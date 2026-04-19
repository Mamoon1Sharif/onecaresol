import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Clock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Slot {
  id: string;
  care_receiver_id: string;
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

export const ReceiverAvailabilityTab = ({ careReceiverId }: { careReceiverId: string }) => {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorWeek, setEditorWeek] = useState<number>(1);
  const [editorSlot, setEditorSlot] = useState<Slot | null>(null);
  const [confirmWeek, setConfirmWeek] = useState<number | null>(null);
  const [confirmSlotId, setConfirmSlotId] = useState<string | null>(null);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["receiver_availability", careReceiverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receiver_availability")
        .select("*")
        .eq("care_receiver_id", careReceiverId)
        .order("day_of_week");
      if (error) throw error;
      return data as Slot[];
    },
  });

  const upsertSlot = useMutation({
    mutationFn: async (s: Partial<Slot> & { id?: string }) => {
      if (s.id) {
        const { error } = await supabase.from("receiver_availability").update(s).eq("id", s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("receiver_availability").insert({
          care_receiver_id: careReceiverId,
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
      queryClient.invalidateQueries({ queryKey: ["receiver_availability", careReceiverId] });
      setEditorOpen(false);
      setEditorSlot(null);
      toast.success("Availability saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeSlot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receiver_availability").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receiver_availability", careReceiverId] });
      toast.success("Slot removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeWeek = useMutation({
    mutationFn: async (week: number) => {
      const { error } = await supabase
        .from("receiver_availability").delete()
        .eq("care_receiver_id", careReceiverId).eq("week_number", week);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receiver_availability", careReceiverId] });
      toast.success("Week cleared");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openAdd = (week: number) => { setEditorSlot(null); setEditorWeek(week); setEditorOpen(true); };
  const openEdit = (slot: Slot) => { setEditorSlot(slot); setEditorWeek(slot.week_number); setEditorOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => openAdd(1)}>
          <Plus className="h-3.5 w-3.5" /> Add Availability
        </Button>
      </div>

      <Card>
        <CardHeader className="py-2 bg-muted/30 border-b">
          <CardTitle className="text-sm">Availability</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {WEEKS.map((week) => {
            const weekSlots = slots.filter((s) => s.week_number === week);
            const totalMins = weekSlots.reduce((sum, s) => sum + minutesBetween(s.start_time, s.end_time), 0);
            return (
              <div key={week} className="p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <Clock className="h-4 w-4" /> Week {week}
                    {totalMins > 0 && (
                      <span className="text-xs text-muted-foreground font-normal">({fmtHHMM(totalMins)})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="h-7 bg-emerald-600 hover:bg-emerald-700 gap-1" onClick={() => openAdd(week)}>
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7" onClick={() => setConfirmWeek(week)}>
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
                          <div className="text-muted-foreground">{s.start_time} – {s.end_time}</div>
                          {s.note && <div className="text-muted-foreground italic">{s.note}</div>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(s)} className="text-amber-600">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button onClick={() => setConfirmSlotId(s.id)} className="text-destructive">
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
          {isLoading && (<div className="p-3 text-xs text-muted-foreground">Loading availability...</div>)}
        </CardContent>
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editorSlot ? "Edit Availability" : "Add Availability"}</DialogTitle></DialogHeader>
          <SlotForm
            initial={editorSlot}
            initialWeek={editorWeek}
            onSubmit={(values) => upsertSlot.mutate({ ...values, id: editorSlot?.id })}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmWeek !== null} onOpenChange={(o) => !o && setConfirmWeek(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove all Week {confirmWeek} availability?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmWeek !== null) removeWeek.mutate(confirmWeek); setConfirmWeek(null); }}
            >Remove All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmSlotId !== null} onOpenChange={(o) => !o && setConfirmSlotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this availability slot?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmSlotId) removeSlot.mutate(confirmSlotId); setConfirmSlotId(null); }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SlotForm = ({ initial, initialWeek, onSubmit }: {
  initial: Slot | null; initialWeek: number; onSubmit: (v: Partial<Slot>) => void;
}) => {
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
          start_time: start, end_time: end, note: note || null,
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
