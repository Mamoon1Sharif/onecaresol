import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Clock, User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Data ──

interface Shift {
  id: number;
  careGiver: string;
  careGiverSkills: string[];
  careReceiver: string;
  day: number; // 0-6 Mon-Sun
  startTime: string;
  endTime: string;
  type: "Morning" | "Afternoon" | "Night" | "Live-in";
  notes: string;
}

const careGiverPool = [
  { name: "Sarah Johnson", skills: ["Dementia Care", "Medication Management", "First Aid"] },
  { name: "James Smith", skills: ["Palliative Care", "Mobility Assistance", "Wound Care"] },
  { name: "Emily Davis", skills: ["Mental Health", "Medication Management", "Personal Care"] },
  { name: "Michael Brown", skills: ["Mobility Assistance", "Dementia Care", "Cooking"] },
  { name: "Rachel Wilson", skills: ["First Aid", "Personal Care", "Companionship"] },
];

const careReceiverPool = [
  "Margaret Thompson", "John Davies", "Dorothy Williams", "Robert Evans", "Mary Clarke",
];

const shiftTypeColors: Record<string, string> = {
  Morning: "bg-amber-100 text-amber-800 border-amber-200",
  Afternoon: "bg-sky-100 text-sky-800 border-sky-200",
  Night: "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Live-in": "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const initialShifts: Shift[] = [
  { id: 1, careGiver: "Sarah Johnson", careGiverSkills: ["Dementia Care", "Medication Management", "First Aid"], careReceiver: "Margaret Thompson", day: 0, startTime: "07:00", endTime: "14:00", type: "Morning", notes: "" },
  { id: 2, careGiver: "James Smith", careGiverSkills: ["Palliative Care", "Mobility Assistance", "Wound Care"], careReceiver: "John Davies", day: 0, startTime: "14:00", endTime: "21:00", type: "Afternoon", notes: "" },
  { id: 3, careGiver: "Emily Davis", careGiverSkills: ["Mental Health", "Medication Management", "Personal Care"], careReceiver: "Dorothy Williams", day: 1, startTime: "07:00", endTime: "14:00", type: "Morning", notes: "" },
  { id: 4, careGiver: "Michael Brown", careGiverSkills: ["Mobility Assistance", "Dementia Care", "Cooking"], careReceiver: "Robert Evans", day: 2, startTime: "21:00", endTime: "07:00", type: "Night", notes: "" },
  { id: 5, careGiver: "Rachel Wilson", careGiverSkills: ["First Aid", "Personal Care", "Companionship"], careReceiver: "Mary Clarke", day: 3, startTime: "07:00", endTime: "07:00", type: "Live-in", notes: "24-hour care" },
  { id: 6, careGiver: "Sarah Johnson", careGiverSkills: ["Dementia Care", "Medication Management", "First Aid"], careReceiver: "Margaret Thompson", day: 4, startTime: "07:00", endTime: "14:00", type: "Morning", notes: "" },
  { id: 7, careGiver: "James Smith", careGiverSkills: ["Palliative Care", "Mobility Assistance", "Wound Care"], careReceiver: "Dorothy Williams", day: 5, startTime: "14:00", endTime: "21:00", type: "Afternoon", notes: "" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

// ── Component ──

const Roster = () => {
  const { toast } = useToast();
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [weekOffset, setWeekOffset] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // form state
  const [formCareGiver, setFormCareGiver] = useState("");
  const [formCareReceiver, setFormCareReceiver] = useState("");
  const [formDay, setFormDay] = useState("0");
  const [formStart, setFormStart] = useState("07:00");
  const [formEnd, setFormEnd] = useState("14:00");
  const [formType, setFormType] = useState<Shift["type"]>("Morning");
  const [formNotes, setFormNotes] = useState("");

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekLabel = `${weekDates[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekDates[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  const selectedCareGiver = careGiverPool.find((c) => c.name === formCareGiver);

  // Check availability: caregiver not already assigned same day & overlapping time
  const isAvailable = (name: string, day: number, start: string, end: string, excludeId?: number) => {
    return !shifts.some(
      (s) => s.careGiver === name && s.day === day && s.id !== excludeId &&
        !(end <= s.startTime || start >= s.endTime),
    );
  };

  const resetForm = () => {
    setFormCareGiver(""); setFormCareReceiver(""); setFormDay("0");
    setFormStart("07:00"); setFormEnd("14:00"); setFormType("Morning"); setFormNotes("");
    setEditingShift(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormCareGiver(shift.careGiver); setFormCareReceiver(shift.careReceiver);
    setFormDay(String(shift.day)); setFormStart(shift.startTime); setFormEnd(shift.endTime);
    setFormType(shift.type); setFormNotes(shift.notes);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formCareGiver || !formCareReceiver) return;
    const day = Number(formDay);
    if (!isAvailable(formCareGiver, day, formStart, formEnd, editingShift?.id)) {
      toast({ title: "Scheduling Conflict", description: `${formCareGiver} is already assigned on ${DAYS[day]} during this time.`, variant: "destructive" });
      return;
    }
    const cg = careGiverPool.find((c) => c.name === formCareGiver);
    const entry: Shift = {
      id: editingShift?.id ?? Date.now(),
      careGiver: formCareGiver,
      careGiverSkills: cg?.skills ?? [],
      careReceiver: formCareReceiver,
      day, startTime: formStart, endTime: formEnd, type: formType, notes: formNotes,
    };
    if (editingShift) {
      setShifts((prev) => prev.map((s) => (s.id === editingShift.id ? entry : s)));
      toast({ title: "Shift Updated" });
    } else {
      setShifts((prev) => [...prev, entry]);
      toast({ title: "Shift Created" });
    }
    setDialogOpen(false); resetForm();
  };

  const handleDelete = (id: number) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
    setDeleteConfirm(null);
    toast({ title: "Shift Removed" });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Roster</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage weekly caregiver shift assignments</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Create Shift
          </Button>
        </div>

        {/* Week navigator */}
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
              <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>Today</Button>
            )}
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
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
                    const dayShifts = shifts.filter((s) => s.day === dayIdx);
                    return (
                      <TableCell key={dayIdx} className="align-top border-r last:border-r-0 p-2 min-h-[120px]">
                        <div className="space-y-2 min-h-[100px]">
                          {dayShifts.length === 0 && (
                            <p className="text-xs text-muted-foreground/50 text-center pt-8">No shifts</p>
                          )}
                          {dayShifts.map((shift) => (
                            <div
                              key={shift.id}
                              className={`rounded-lg border p-2 text-xs cursor-pointer hover:shadow-md transition-shadow ${shiftTypeColors[shift.type]}`}
                              onClick={() => openEdit(shift)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-current">
                                  {shift.type}
                                </Badge>
                                <button
                                  className="opacity-50 hover:opacity-100"
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(shift.id); }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="flex items-center gap-1 font-medium">
                                <User className="h-3 w-3" /> {shift.careGiver.split(" ")[0]}
                              </div>
                              <div className="text-[10px] opacity-75 mt-0.5">→ {shift.careReceiver.split(" ")[0]}</div>
                              <div className="flex items-center gap-1 mt-1 opacity-75">
                                <Clock className="h-3 w-3" />
                                {shift.startTime}–{shift.endTime}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Shift summary table */}
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
                  <TableHead>Service Receiver</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No shifts scheduled</TableCell></TableRow>
                )}
                {[...shifts].sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime)).map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(s)}>
                    <TableCell className="font-medium">{s.careGiver}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.careGiverSkills.slice(0, 2).map((sk) => (
                          <Badge key={sk} variant="secondary" className="text-[10px]">{sk}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{s.careReceiver}</TableCell>
                    <TableCell>{DAYS[s.day]}</TableCell>
                    <TableCell className="text-sm">{s.startTime}–{s.endTime}</TableCell>
                    <TableCell>
                      <Badge className={`${shiftTypeColors[s.type]} border`}>{s.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { resetForm(); } setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingShift ? "Edit Shift" : "Create Shift"}</DialogTitle>
            <DialogDescription>Assign a caregiver to a service receiver based on availability and skills.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Caregiver</Label>
                <Select value={formCareGiver} onValueChange={setFormCareGiver}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {careGiverPool.map((cg) => (
                      <SelectItem key={cg.name} value={cg.name}>{cg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Service Receiver</Label>
                <Select value={formCareReceiver} onValueChange={setFormCareReceiver}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {careReceiverPool.map((cr) => (
                      <SelectItem key={cr} value={cr}>{cr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedCareGiver && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Skills:</span>
                {selectedCareGiver.skills.map((sk) => (
                  <Badge key={sk} variant="secondary" className="text-xs">{sk}</Badge>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Day</Label>
                <Select value={formDay} onValueChange={setFormDay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => (
                      <SelectItem key={d} value={String(i)}>{d}</SelectItem>
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
              <Select value={formType} onValueChange={(v) => setFormType(v as Shift["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Additional instructions..." rows={2} />
            </div>

            {formCareGiver && (
              <div className="text-xs">
                {isAvailable(formCareGiver, Number(formDay), formStart, formEnd, editingShift?.id)
                  ? <span className="text-success font-medium">✓ {formCareGiver} is available</span>
                  : <span className="text-destructive font-medium">✗ Scheduling conflict detected</span>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formCareGiver || !formCareReceiver}>
              {editingShift ? "Update Shift" : "Create Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Shift</DialogTitle>
            <DialogDescription>Are you sure you want to remove this shift?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Roster;
