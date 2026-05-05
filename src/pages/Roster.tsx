import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useShifts, useUpsertShift, useDeleteShift, useCareGivers, useCareReceivers, useDailyVisitsRange } from "@/hooks/use-care-data";
import { RosterViewSwitcher } from "@/components/RosterViewSwitcher";
import { useCaregiverHolidayEntries, caregiverUnavailableReason } from "@/hooks/use-caregiver-availability";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const shiftTypeColors: Record<string, string> = {
  Morning: "bg-amber-100 text-amber-800 border-amber-200",
  Afternoon: "bg-sky-100 text-sky-800 border-sky-200",
  Night: "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Live-in": "bg-emerald-100 text-emerald-800 border-emerald-200",
};

function getWeekDates(offset: number) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  return DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const Roster = () => {
  const { toast } = useToast();
  const { data: shiftsData = [], isLoading } = useShifts();
  const { data: careGivers = [] } = useCareGivers();
  const { data: careReceivers = [] } = useCareReceivers();
  const upsertShift = useUpsertShift();
  const delShift = useDeleteShift();
  const { data: holidayEntries = [] } = useCaregiverHolidayEntries();

  const [weekOffset, setWeekOffset] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formCgId, setFormCgId] = useState("");
  const [formCrId, setFormCrId] = useState("");
  const [formDay, setFormDay] = useState("0");
  const [formStart, setFormStart] = useState("07:00");
  const [formEnd, setFormEnd] = useState("14:00");
  const [formType, setFormType] = useState("Morning");
  const [formNotes, setFormNotes] = useState("");

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekLabel = `${weekDates[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekDates[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  const weekFromStr = useMemo(() => weekDates[0].toISOString().split("T")[0], [weekDates]);
  const weekToStr = useMemo(() => weekDates[6].toISOString().split("T")[0], [weekDates]);
  const { data: weekVisits = [] } = useDailyVisitsRange(weekFromStr, weekToStr);

  const resetForm = () => {
    setFormCgId("");
    setFormCrId("");
    setFormDay("0");
    setFormStart("07:00");
    setFormEnd("14:00");
    setFormType("Morning");
    setFormNotes("");
    setEditingShiftId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (shift: (typeof shiftsData)[0]) => {
    setEditingShiftId(shift.id);
    setFormCgId(shift.care_giver_id ?? "");
    setFormCrId(shift.care_receiver_id ?? "");
    setFormDay(String(shift.day));
    setFormStart(shift.start_time);
    setFormEnd(shift.end_time);
    setFormType(shift.shift_type);
    setFormNotes(shift.notes ?? "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formCgId || !formCrId) return;
    const cg = careGivers.find((c) => c.id === formCgId);
    const targetDate = weekDates[Number(formDay)].toISOString().split("T")[0];
    const reason = caregiverUnavailableReason(cg as any, holidayEntries, targetDate);
    if (reason) {
      const detail =
        reason.kind === "inactive"
          ? `${cg?.name ?? "This caregiver"} is marked ${reason.label} and cannot be assigned to a rota.`
          : `${cg?.name ?? "This caregiver"} is ${reason.label} on ${targetDate}${reason.to && reason.to !== reason.from ? ` (until ${reason.to})` : ""} and cannot be assigned.`;
      toast({ title: "Cannot assign rota", description: detail, variant: "destructive" });
      return;
    }
    try {
      await upsertShift.mutateAsync({
        id: editingShiftId ?? undefined,
        care_giver_id: formCgId,
        care_receiver_id: formCrId,
        day: Number(formDay),
        start_time: formStart,
        end_time: formEnd,
        shift_type: formType,
        notes: formNotes,
      });
      toast({ title: editingShiftId ? "Shift Updated" : "Shift Created" });
      setDialogOpen(false);
      resetForm();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    await delShift.mutateAsync(id);
    setDeleteConfirm(null);
    toast({ title: "Shift Removed" });
  };

  const selectedCg = careGivers.find((c) => c.id === formCgId);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Roster</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage weekly caregiver shift assignments</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <RosterViewSwitcher />
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Create Rota
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarDays className="h-4 w-4 text-primary" />
            {weekLabel}
          </div>
          <div className="flex gap-2">
            {weekOffset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
                This Week
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {DAYS.map((day, i) => (
                    <TableHead key={day} className="text-center min-w-[140px] border-r last:border-r-0">
                      <div className="font-semibold">{day}</div>
                      <div className="text-xs text-muted-foreground">
                        {weekDates[i].toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {DAYS.map((_, dayIdx) => {
                    const cellDateStr = weekDates[dayIdx].toISOString().split("T")[0];
                    const dayVisits = weekVisits.filter((v) => v.visit_date === cellDateStr);
                    return (
                      <TableCell key={dayIdx} className="align-top border-r last:border-r-0 p-2 min-h-[120px]">
                        <div className="space-y-2 min-h-[100px]">
                          {dayVisits.length === 0 && (
                            <p className="text-xs text-muted-foreground/50 text-center pt-8">No shifts</p>
                          )}
                          {dayVisits.map((v) => {
                            const shiftType = v.start_hour < 12 ? "Morning" : v.start_hour < 17 ? "Afternoon" : "Night";
                            const endHour = v.start_hour + (v.duration ?? 0);
                            return (
                              <div
                                key={v.id}
                                className={`rounded-lg border p-2 text-xs ${shiftTypeColors[shiftType] ?? ""}`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-current">
                                    {shiftType}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 font-medium">
                                  <User className="h-3 w-3" /> {(v.care_givers as any)?.name?.split(" ")[0] ?? "—"}
                                </div>
                                <div className="text-[10px] opacity-75 mt-0.5">
                                  → {(v.care_receivers as any)?.name?.split(" ")[0] ?? "—"}
                                </div>
                                <div className="flex items-center gap-1 mt-1 opacity-75">
                                  <Clock className="h-3 w-3" />
                                  {String(v.start_hour).padStart(2, "0")}:00–{String(endHour).padStart(2, "0")}:00
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">This Week's Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Caregiver</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Service Member</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {shiftsData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {isLoading ? "Loading..." : "No shifts scheduled"}
                    </TableCell>
                  </TableRow>
                )}
                {shiftsData.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(s)}>
                    <TableCell className="font-medium">{(s.care_givers as any)?.name ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {((s.care_givers as any)?.skills ?? []).slice(0, 2).map((sk: string) => (
                          <Badge key={sk} variant="secondary" className="text-[10px]">
                            {sk}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{(s.care_receivers as any)?.name ?? "—"}</TableCell>
                    <TableCell>{DAYS[s.day]}</TableCell>
                    <TableCell className="text-sm">
                      {s.start_time}–{s.end_time}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${shiftTypeColors[s.shift_type] ?? ""} border`}>{s.shift_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(s);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingShiftId ? "Edit Shift" : "Create Shift"}</DialogTitle>
            <DialogDescription>Assign a caregiver to a service member.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Caregiver</Label>
                <Select value={formCgId} onValueChange={setFormCgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {careGivers.map((cg) => (
                      <SelectItem key={cg.id} value={cg.id}>
                        {cg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Service Member</Label>
                <Select value={formCrId} onValueChange={setFormCrId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {careReceivers.map((cr) => (
                      <SelectItem key={cr.id} value={cr.id}>
                        {cr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedCg && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Skills:</span>
                {(selectedCg.skills ?? []).map((sk) => (
                  <Badge key={sk} variant="secondary" className="text-xs">
                    {sk}
                  </Badge>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Day</Label>
                <Select value={formDay} onValueChange={setFormDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => (
                      <SelectItem key={d} value={String(i)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Shift Type</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Afternoon">Afternoon</SelectItem>
                  <SelectItem value="Night">Night</SelectItem>
                  <SelectItem value="Live-in">Live-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={upsertShift.isPending}>
              {upsertShift.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Roster;
