import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Clock, LogOut, Users, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
type CareGiver = { id: string; requested_hours?: any };

interface Slot {
  id: string;
  care_giver_id: string;
  week_number: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  note: string | null;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKS = [1, 2, 3, 4];

const minutesBetween = (start: string, end: string) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
};
const fmtHHMM = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

interface Props {
  cg: CareGiver;
}

export const AvailabilityTab = ({ cg }: Props) => {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorWeek, setEditorWeek] = useState<number>(1);
  const [editorSlot, setEditorSlot] = useState<Slot | null>(null);
  const [requestedOpen, setRequestedOpen] = useState(false);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["caregiver_availability", cg.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caregiver_availability")
        .select("*")
        .eq("care_giver_id", cg.id)
        .order("day_of_week");
      if (error) throw error;
      return data as Slot[];
    },
  });

  const requested = (cg.requested_hours as any) || {
    week1: "00:00", week2: "00:00", week3: "00:00", week4: "00:00",
  };

  const upsertSlot = useMutation({
    mutationFn: async (s: Partial<Slot> & { id?: string }) => {
      if (s.id) {
        const { error } = await supabase
          .from("caregiver_availability").update(s).eq("id", s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("caregiver_availability").insert({
          care_giver_id: cg.id,
          week_number: s.week_number!,
          day_of_week: s.day_of_week!,
          start_time: s.start_time || "09:00",
          end_time: s.end_time || "17:00",
          note: s.note || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caregiver_availability", cg.id] });
      setEditorOpen(false);
      setEditorSlot(null);
      toast.success("Availability saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeSlot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("caregiver_availability").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caregiver_availability", cg.id] });
      toast.success("Slot removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeWeek = useMutation({
    mutationFn: async (week: number) => {
      const { error } = await supabase
        .from("caregiver_availability").delete()
        .eq("care_giver_id", cg.id).eq("week_number", week);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caregiver_availability", cg.id] });
      toast.success("Week cleared");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateRequested = useMutation({
    mutationFn: async (next: Record<string, string>) => {
      const { error } = await supabase.from("care_givers")
        .update({ requested_hours: next }).eq("id", cg.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setRequestedOpen(false);
      toast.success("Requested hours updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openAdd = (week: number) => {
    setEditorSlot(null);
    setEditorWeek(week);
    setEditorOpen(true);
  };
  const openEdit = (slot: Slot) => {
    setEditorSlot(slot);
    setEditorWeek(slot.week_number);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" className="gap-1.5">
          <Users className="h-3.5 w-3.5" /> All Team Members
        </Button>
        <Button size="sm" className="gap-1.5 bg-red-500 hover:bg-red-600 text-white">
          <LogOut className="h-3.5 w-3.5" /> Logout of handset
        </Button>
        <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => openAdd(1)}>
          <Plus className="h-3.5 w-3.5" /> Add Availability
        </Button>
      </div>

      {/* Requested Hours summary */}
      <Card>
        <CardHeader className="py-3 bg-muted/30 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Requested Hours</CardTitle>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white gap-1"
            onClick={() => setRequestedOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit weekly hours
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {WEEKS.map((w) => (
              <div key={w} className="flex items-center justify-between md:justify-start gap-2">
                <span className="italic text-muted-foreground">Week {w}:</span>
                <span className="font-medium">{requested[`week${w}`] || "00:00"}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-week availability blocks */}
      <Card>
        <CardHeader className="py-2 bg-muted/30 border-b">
          <CardTitle className="text-sm">Availability</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {WEEKS.map((week) => {
            const weekSlots = slots.filter((s) => s.week_number === week);
            const totalMins = weekSlots.reduce(
              (sum, s) => sum + minutesBetween(s.start_time, s.end_time), 0,
            );
            return (
              <div key={week} className="p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <Clock className="h-4 w-4" /> Week {week}
                    {totalMins > 0 && (
                      <span className="text-xs text-muted-foreground font-normal">
                        ({fmtHHMM(totalMins)})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="h-7 bg-emerald-600 hover:bg-emerald-700 gap-1" onClick={() => openAdd(week)}>
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7"
                      disabled={weekSlots.length === 0}
                      onClick={() => removeWeek.mutate(week)}
                    >
                      Remove All
                    </Button>
                  </div>
                </div>

                {weekSlots.length > 0 && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {weekSlots.map((s) => (
                      <div key={s.id} className="flex items-center justify-between border rounded px-2 py-1.5 text-xs bg-muted/30">
                        <div>
                          <div className="font-medium">{DAY_NAMES[s.day_of_week]}</div>
                          <div className="text-muted-foreground">
                            {s.start_time} – {s.end_time}
                          </div>
                          {s.note && <div className="text-muted-foreground italic">{s.note}</div>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(s)} className="text-amber-600 hover:text-amber-700">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button onClick={() => removeSlot.mutate(s.id)} className="text-destructive hover:text-destructive/80">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {isLoading && (
            <div className="p-3 text-xs text-muted-foreground">Loading availability...</div>
          )}
        </CardContent>
      </Card>

      {/* Slot editor dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editorSlot ? "Edit Availability" : "Add Availability"}</DialogTitle>
          </DialogHeader>
          <SlotForm
            initial={editorSlot}
            initialWeek={editorWeek}
            onSubmit={(values) =>
              upsertSlot.mutate({ ...values, id: editorSlot?.id })
            }
          />
        </DialogContent>
      </Dialog>

      {/* Requested hours editor */}
      <Dialog open={requestedOpen} onOpenChange={setRequestedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Weekly Requested Hours</DialogTitle>
          </DialogHeader>
          <RequestedForm
            initial={requested}
            onSubmit={(next) => updateRequested.mutate(next)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SlotForm = ({
  initial, initialWeek, onSubmit,
}: { initial: Slot | null; initialWeek: number; onSubmit: (v: Partial<Slot>) => void }) => {
  const [week, setWeek] = useState(String(initial?.week_number || initialWeek));
  const [day, setDay] = useState(String(initial?.day_of_week ?? 1));
  const [start, setStart] = useState(initial?.start_time || "09:00");
  const [end, setEnd] = useState(initial?.end_time || "17:00");
  const [note, setNote] = useState(initial?.note || "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          week_number: Number(week),
          day_of_week: Number(day),
          start_time: start,
          end_time: end,
          note: note || null,
        });
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Week</Label>
          <Select value={week} onValueChange={setWeek}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {WEEKS.map((w) => <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Day</Label>
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Start</Label>
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">End</Label>
          <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="text-xs">Note (optional)</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
      </DialogFooter>
    </form>
  );
};

const RequestedForm = ({
  initial, onSubmit,
}: { initial: Record<string, string>; onSubmit: (v: Record<string, string>) => void }) => {
  const [vals, setVals] = useState<Record<string, string>>({
    week1: initial.week1 || "00:00",
    week2: initial.week2 || "00:00",
    week3: initial.week3 || "00:00",
    week4: initial.week4 || "00:00",
  });
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(vals); }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        {WEEKS.map((w) => (
          <div key={w}>
            <Label className="text-xs">Week {w}</Label>
            <Input
              type="time"
              value={vals[`week${w}`]}
              onChange={(e) => setVals({ ...vals, [`week${w}`]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
      </DialogFooter>
    </form>
  );
};
