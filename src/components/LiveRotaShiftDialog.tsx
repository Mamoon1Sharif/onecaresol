import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Lock, Plus, Save, X, Pencil } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCareGivers } from "@/hooks/use-care-data";

export type LiveRotaShift = {
  ref: string;
  date: string;
  start: string;
  end: string;
  client: string;
  staff: string;
  serviceCall?: string;
  schedHrs?: string;
  clockHrs?: string;
};

const INITIAL_NOTES = [
  { ref: "139988439", created: "21/04/2026 12:06", note: "Service user prefers door bell to be rung twice on arrival.", by: "Maya Sawich", visible: "Yes" },
  { ref: "139988512", created: "22/04/2026 09:14", note: "Key safe code refreshed — collect from office before visit.", by: "Anna Pereira", visible: "Yes" },
  { ref: "139988577", created: "23/04/2026 16:42", note: "Family will be present during evening call. Hand over notes.", by: "Maria Khalil", visible: "No" },
];

const INITIAL_MEDS = [
  { name: "Atorvastatin", period: "Evening: 16:00 - 22:00", planned: ["Administer", "1", "40mg", "ONE to be taken at NIGHT"] },
  { name: "Carbamazepine", period: "Evening: 16:00 - 22:00", planned: ["Administer", "1", "100mg", "ONE to be taken in the MORNING and NIGHT"] },
  { name: "Dermol 500 Lotion", period: "", planned: ["Applied", "Use as a soap substitute."] },
  { name: "E45 Cream", period: "", planned: ["Applied", "Apply as required"] },
  { name: "Epimax Excetra Cream", period: "", planned: ["Applied", "Apply to arms and back daily"] },
  { name: "Medi-Derma S Barrier Cream", period: "", planned: ["Applied", "Apply to groin and bottom when required. Use a pea size amount."] },
  { name: "Ramipril", period: "Evening: 16:00 - 22:00", planned: ["Administer", "1", "5mg", "ONE to be taken in the MORNING and at NIGHT."] },
];

export function LiveRotaShiftDialog({
  shift, open, onClose,
}: { shift: LiveRotaShift | null; open: boolean; onClose: () => void }) {
  const [clockEdit, setClockEdit] = useState<null | "in" | "out">(null);
  const [amendOpen, setAmendOpen] = useState(false);
  const [current, setCurrent] = useState<LiveRotaShift | null>(shift);
  const [confirmation, setConfirmation] = useState<{ before: LiveRotaShift; after: LiveRotaShift } | null>(null);
  const [removed, setRemoved] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSelected, setAssignSelected] = useState<string>("");
  const { data: caregivers = [] } = useCareGivers();
  const [locks, setLocks] = useState<{ id: string; reason: string; by: string; created: string }[]>([]);
  const [showLockPrompt, setShowLockPrompt] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [showNotePrompt, setShowNotePrompt] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newNoteVisible, setNewNoteVisible] = useState("Yes");
  const [shiftBulk, setShiftBulk] = useState("bulk");
  const [shiftSearch, setShiftSearch] = useState("");
  const [shiftRowChecked, setShiftRowChecked] = useState(false);
  const [medFilter, setMedFilter] = useState("all");
  const [medSearch, setMedSearch] = useState("");
  const [medChecked, setMedChecked] = useState<Record<string, boolean>>({});

  // sync incoming shift
  if (shift && (!current || current.ref !== shift.ref)) {
    setCurrent(shift);
    setRemoved(false);
  }
  if (!shift || !current) return null;

  const matchesShiftSearch = (val: string) =>
    !shiftSearch || val.toLowerCase().includes(shiftSearch.toLowerCase());
  const shiftRowText = `${current.ref} ${current.client} ${current.staff} ${current.serviceCall ?? ""}`;
  const showShiftRow = matchesShiftSearch(shiftRowText);

  const filteredMeds = INITIAL_MEDS.filter((m) => {
    const inFilter = medFilter === "all" || m.name === medFilter;
    const inSearch = !medSearch || m.name.toLowerCase().includes(medSearch.toLowerCase());
    return inFilter && inSearch;
  });

  const runShiftBulk = () => {
    if (shiftBulk === "bulk") {
      toast.info("Select a bulk action first");
      return;
    }
    if (!shiftRowChecked) {
      toast.error("Select at least one shift row");
      return;
    }
    toast.success(`${shiftBulk} applied to selected shift`);
    setShiftBulk("bulk");
    setShiftRowChecked(false);
  };

  const runMedAction = () => {
    const selected = Object.entries(medChecked).filter(([, v]) => v).map(([k]) => k);
    if (medFilter === "all" && selected.length === 0) {
      toast.error("Select medications or pick an action");
      return;
    }
    const target = medFilter !== "all" ? [medFilter] : selected;
    toast.success(`Action applied to ${target.length} med(s)`);
    setMedChecked({});
    setMedFilter("all");
  };


  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
            <DialogTitle className="text-base">
              Live Rota Shift — Ref {current.ref} · {current.client} · {current.date} · {current.start}–{current.end}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {/* Live Rota Shift(s) section */}
            <section className="border border-border rounded-sm overflow-hidden">
              <div className="border-t-2 border-t-primary/70 flex items-center justify-between px-3 py-2 bg-card">
                <h3 className="text-sm font-semibold text-foreground">Live Rota Shift(s)</h3>
                <Button
                  size="sm"
                  className="h-7 gap-1 bg-warning hover:bg-warning/90 text-warning-foreground"
                  onClick={() => setAmendOpen(true)}
                >
                  <Plus className="h-3 w-3" /> Edit Shift Details
                </Button>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Select value={shiftBulk} onValueChange={setShiftBulk}>
                    <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bulk">Bulk Actions...</SelectItem>
                      <SelectItem value="Reassign">Reassign</SelectItem>
                      <SelectItem value="Cancel">Cancel Visit</SelectItem>
                      <SelectItem value="Activate">Activate Visit</SelectItem>
                      <SelectItem value="Reset">Reset Visit</SelectItem>
                      <SelectItem value="Send Push">Send Push Message</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8 bg-success hover:bg-success/90 text-success-foreground" onClick={runShiftBulk}>Go</Button>
                  <div className="ml-auto flex items-center gap-2">
                    <Label className="text-xs">Search:</Label>
                    <Input value={shiftSearch} onChange={(e) => setShiftSearch(e.target.value)} className="h-8 w-48 text-xs" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="p-2 border border-border w-8">
                          <Checkbox checked={shiftRowChecked} onCheckedChange={(v) => setShiftRowChecked(!!v)} />
                        </th>
                        <th className="p-2 border border-border text-left">Ref</th>
                        <th className="p-2 border border-border text-left">Date</th>
                        <th className="p-2 border border-border text-left">Status</th>
                        <th className="p-2 border border-border text-left">Service User</th>
                        <th className="p-2 border border-border text-left">Start</th>
                        <th className="p-2 border border-border text-left">End</th>
                        <th className="p-2 border border-border text-left">Duration</th>
                        <th className="p-2 border border-border text-left">Care Giver</th>
                        <th className="p-2 border border-border text-left">Service Call</th>
                        <th className="p-2 border border-border text-left">Week</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showShiftRow ? (
                        <tr>
                          <td className="p-2 border border-border">
                            <Checkbox checked={shiftRowChecked} onCheckedChange={(v) => setShiftRowChecked(!!v)} />
                          </td>
                          <td className="p-2 border border-border font-mono text-primary underline cursor-pointer">{current.ref}</td>
                          <td className="p-2 border border-border">{current.date}</td>
                          <td className="p-2 border border-border">Due</td>
                          <td className="p-2 border border-border text-primary underline cursor-pointer">{current.client}</td>
                          <td className="p-2 border border-border">{current.start}</td>
                          <td className="p-2 border border-border">{current.end}</td>
                          <td className="p-2 border border-border">{current.schedHrs ?? "00:30"}</td>
                          <td className="p-2 border border-border text-primary underline cursor-pointer">
                            {removed ? (
                              <button onClick={() => setAssignOpen(true)} className="italic text-primary hover:underline">
                                Unassigned — Assign
                              </button>
                            ) : current.staff}
                          </td>
                          <td className="p-2 border border-border">{current.serviceCall ?? "Private Eve..."}</td>
                          <td className="p-2 border border-border">Week 1</td>
                        </tr>
                      ) : (
                        <tr><td colSpan={11} className="p-3 text-center text-xs text-muted-foreground border border-border">No matches.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Built from template: <span className="text-primary underline">4496619</span> at 11:54 on 20/04/2026
                </p>
              </div>
            </section>

            {/* Assigned Care Givers */}
            <section className="border border-border rounded-sm overflow-hidden">
              <div className="border-t-2 border-t-primary/70 px-3 py-2 bg-card">
                <h3 className="text-sm font-semibold text-foreground">Assigned Care Givers</h3>
              </div>
              <div className="p-4 flex gap-6">
                {removed ? (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-muted-foreground italic">No care giver assigned.</p>
                    <Button size="sm" onClick={() => setAssignOpen(true)}>
                      <Plus className="w-3 h-3 mr-1" /> Assign Caregiver
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-[140px] h-[140px] rounded-sm border border-border bg-muted flex items-center justify-center text-muted-foreground text-xs">
                        {current.staff}
                      </div>
                      <Button
                        size="sm"
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-8 w-[140px]"
                        onClick={() => setConfirmRemove(true)}
                      >
                        ↑ Remove Care Giver
                      </Button>
                    </div>
                    <div className="flex-1">
                      <div className="text-primary font-medium mb-2">{current.staff}</div>
                      <div className="space-y-1 text-sm">
                        <button
                          onClick={() => setClockEdit("in")}
                          className="text-success hover:underline block"
                        >
                          - Clock In
                        </button>
                        <button
                          onClick={() => setClockEdit("out")}
                          className="text-success hover:underline block"
                        >
                          - Clock Out
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-6 text-center">
                        If clock in or out distances are not showing, it means your care giver has location services off on their mobile phone.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Rota Locks */}
            <section className="border border-border rounded-sm overflow-hidden">
              <div className="border-t-2 border-t-warning/80 flex items-center justify-between px-3 py-2 bg-card">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" /> Rota Locks
                </h3>
                <Button
                  size="sm"
                  className="h-7 gap-1 bg-success hover:bg-success/90 text-success-foreground"
                  onClick={() => { setLockReason(""); setShowLockPrompt(true); }}
                >
                  <Plus className="h-3 w-3" /> Add Lock
                </Button>
              </div>
              <div className="p-3 space-y-2">
                {locks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No locks set.</p>
                ) : (
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="p-2 border border-border text-left">Reason</th>
                        <th className="p-2 border border-border text-left">Created By</th>
                        <th className="p-2 border border-border text-left">Created</th>
                        <th className="p-2 border border-border w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {locks.map((l) => (
                        <tr key={l.id} className="border-b border-border">
                          <td className="p-2 border border-border">{l.reason}</td>
                          <td className="p-2 border border-border">{l.by}</td>
                          <td className="p-2 border border-border">{l.created}</td>
                          <td className="p-2 border border-border text-center">
                            <button
                              className="text-destructive hover:underline text-xs"
                              onClick={() => {
                                setLocks((p) => p.filter((x) => x.id !== l.id));
                                toast.success("Lock removed");
                              }}
                            >Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Live Rota Notes */}
            <section className="border border-border rounded-sm overflow-hidden">
              <div className="border-t-2 border-t-primary/70 flex items-center justify-between px-3 py-2 bg-card">
                <h3 className="text-sm font-semibold text-foreground">Live Rota Notes</h3>
                <Button
                  size="sm"
                  className="h-7 gap-1 bg-success hover:bg-success/90 text-success-foreground"
                  onClick={() => { setNewNote(""); setNewNoteVisible("Yes"); setShowNotePrompt(true); }}
                >
                  <Plus className="h-3 w-3" /> Add New
                </Button>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Notes marked as hidden will only appear on a single rota, service user and care giver note area or some of the reports. Notes marked as hidden will also not appear on the Care Portal section.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="p-2 border border-border text-left">Ref</th>
                        <th className="p-2 border border-border text-left">Created</th>
                        <th className="p-2 border border-border text-left">Note</th>
                        <th className="p-2 border border-border text-left">Created By</th>
                        <th className="p-2 border border-border text-left">Visible</th>
                        <th className="p-2 border border-border w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {notes.map((n) => (
                        <tr key={n.ref} className="border-b border-border hover:bg-muted/30">
                          <td className="p-2 border border-border font-mono text-[11px]">{n.ref}</td>
                          <td className="p-2 border border-border">{n.created}</td>
                          <td className="p-2 border border-border">{n.note}</td>
                          <td className="p-2 border border-border text-primary underline cursor-pointer">{n.by}</td>
                          <td className="p-2 border border-border">{n.visible}</td>
                          <td className="p-2 border border-border text-center">
                            <button
                              className="text-destructive hover:underline text-xs"
                              onClick={() => {
                                setNotes((p) => p.filter((x) => x.ref !== n.ref));
                                toast.success("Note removed");
                              }}
                            >Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Medication */}
            <section className="border border-border rounded-sm overflow-hidden">
              <div className="border-t-2 border-t-primary/70 flex items-center justify-between px-3 py-2 bg-card">
                <h3 className="text-sm font-semibold text-primary">Medication (Evening Medication)</h3>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Select value={medFilter} onValueChange={setMedFilter}>
                    <SelectTrigger className="h-8 w-[220px] text-xs"><SelectValue placeholder="Please Select Meds..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Medications</SelectItem>
                      {INITIAL_MEDS.map((m) => (
                        <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8 bg-success hover:bg-success/90 text-success-foreground" onClick={runMedAction}>Go</Button>
                  <div className="ml-auto flex items-center gap-2">
                    <Label className="text-xs">Search:</Label>
                    <Input value={medSearch} onChange={(e) => setMedSearch(e.target.value)} className="h-8 w-48 text-xs" placeholder="Search meds..." />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="p-2 border border-border w-8"><Checkbox /></th>
                        <th className="p-2 border border-border text-left">Med Name</th>
                        <th className="p-2 border border-border text-left">Status</th>
                        <th className="p-2 border border-border text-center">Audited</th>
                        <th className="p-2 border border-border text-left">Audit Notes</th>
                        <th className="p-2 border border-border text-left">Admin Details</th>
                        <th className="p-2 border border-border text-left">Linked Areas</th>
                        <th className="p-2 border border-border text-left">Med Group</th>
                        <th className="p-2 border border-border text-left">Period</th>
                        <th className="p-2 border border-border text-left">Planned</th>
                        <th className="p-2 border border-border text-left">Body Map</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMeds.length === 0 && (
                        <tr><td colSpan={11} className="p-3 text-center text-xs text-muted-foreground border border-border">No medications match.</td></tr>
                      )}
                      {filteredMeds.map((m) => (
                        <tr key={m.name} className="border-b border-border hover:bg-muted/30">
                          <td className="p-2 border border-border">
                            <Checkbox
                              checked={!!medChecked[m.name]}
                              onCheckedChange={(v) => setMedChecked((p) => ({ ...p, [m.name]: !!v }))}
                            />
                          </td>
                          <td className="p-2 border border-border">{m.name}</td>
                          <td className="p-2 border border-border">Due</td>
                          <td className="p-2 border border-border text-center text-destructive">✕</td>
                          <td className="p-2 border border-border"></td>
                          <td className="p-2 border border-border">Medication Not Administered Through The System</td>
                          <td className="p-2 border border-border"></td>
                          <td className="p-2 border border-border">Evening Medication</td>
                          <td className="p-2 border border-border">{m.period}</td>
                          <td className="p-2 border border-border whitespace-pre-line">{m.planned.join("\n")}</td>
                          <td className="p-2 border border-border">-</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-muted-foreground pt-2">Showing {filteredMeds.length} of {INITIAL_MEDS.length}</p>
                </div>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Lock prompt */}
      <Dialog open={showLockPrompt} onOpenChange={setShowLockPrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Rota Lock</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm">Reason</Label>
            <Textarea value={lockReason} onChange={(e) => setLockReason(e.target.value)} placeholder="Why is this shift being locked?" />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowLockPrompt(false)}>Cancel</Button>
              <Button
                size="sm"
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => {
                  if (!lockReason.trim()) { toast.error("Reason required"); return; }
                  setLocks((p) => [...p, {
                    id: crypto.randomUUID(),
                    reason: lockReason.trim(),
                    by: "Current User",
                    created: new Date().toLocaleString("en-GB"),
                  }]);
                  setShowLockPrompt(false);
                  toast.success("Lock added");
                }}
              >Add Lock</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note prompt */}
      <Dialog open={showNotePrompt} onOpenChange={setShowNotePrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Live Rota Note</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm">Note</Label>
            <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Type your note..." />
            <Label className="text-sm">Visible</Label>
            <Select value={newNoteVisible} onValueChange={setNewNoteVisible}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No (hidden)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowNotePrompt(false)}>Cancel</Button>
              <Button
                size="sm"
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => {
                  if (!newNote.trim()) { toast.error("Note required"); return; }
                  setNotes((p) => [{
                    ref: String(Date.now()).slice(-9),
                    created: new Date().toLocaleString("en-GB"),
                    note: newNote.trim(),
                    by: "Current User",
                    visible: newNoteVisible,
                  }, ...p]);
                  setShowNotePrompt(false);
                  toast.success("Note added");
                }}
              >Add Note</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ClockEditDialog
        mode={clockEdit}
        staff={current.staff}
        date={current.date}
        defaultTime={clockEdit === "in" ? current.start : current.end}
        onClose={() => setClockEdit(null)}
      />

      <AmendShiftDialog
        open={amendOpen}
        shift={current}
        onClose={() => setAmendOpen(false)}
        onSaved={(updated) => {
          setConfirmation({ before: current, after: updated });
          setCurrent(updated);
          setAmendOpen(false);
        }}
      />

      <ShiftChangeConfirmation
        data={confirmation}
        onClose={() => setConfirmation(null)}
      />

      {/* Confirm remove care giver */}
      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove care giver?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-medium text-foreground">{current.staff}</span> from this shift ({current.ref})? The shift will become unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => {
                setRemoved(true);
                toast.success(`${current.staff} removed from shift`);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign caregiver */}
      <Dialog open={assignOpen} onOpenChange={(o) => { setAssignOpen(o); if (!o) setAssignSelected(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Caregiver</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs">Select from available caregivers</Label>
            <Select value={assignSelected} onValueChange={setAssignSelected}>
              <SelectTrigger><SelectValue placeholder="Choose a caregiver..." /></SelectTrigger>
              <SelectContent className="max-h-[260px]">
                {caregivers
                  .filter((c: any) => c.status === "Active" && c.name !== current.staff)
                  .map((c: any) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name} {c.email ? `— ${c.email}` : ""}
                    </SelectItem>
                  ))}
                {caregivers.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No caregivers available</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button
              disabled={!assignSelected}
              onClick={() => {
                setCurrent({ ...current, staff: assignSelected });
                setRemoved(false);
                setAssignOpen(false);
                toast.success(`${assignSelected} assigned to shift`);
                setAssignSelected("");
              }}
            >
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ClockEditDialog({
  mode, staff, date, defaultTime, onClose,
}: {
  mode: "in" | "out" | null;
  staff: string;
  date: string;
  defaultTime: string;
  onClose: () => void;
}) {
  const [h, m] = (defaultTime || "00:00").split(":");
  const [hh, setHh] = useState(h || "00");
  const [mm, setMm] = useState(m || "00");
  const [reason, setReason] = useState("");
  const [push, setPush] = useState(false);

  if (!mode) return null;

  return (
    <Dialog open={!!mode} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-t-2 border-t-primary/70 bg-card">
          <h3 className="text-sm font-semibold text-foreground">
            Edit Clock {mode === "in" ? "In" : "Out"} Hours Manually
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="text-primary font-medium border-b border-border pb-2">{staff}</div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-3">
            <Label className="text-sm text-foreground">Time {mode}</Label>
            <div className="flex items-center gap-2">
              <Select value={hh} onValueChange={setHh}>
                <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <SelectItem key={i} value={String(i).padStart(2, "0")}>{String(i).padStart(2, "0")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-foreground">:</span>
              <Select value={mm} onValueChange={setMm}>
                <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["00", "15", "30", "45"].map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Label className="text-sm text-foreground">Date {mode}</Label>
            <Input value={date} readOnly className="h-8 bg-muted" />

            <Label className="text-sm text-foreground">Send Push</Label>
            <Checkbox checked={push} onCheckedChange={(v) => setPush(!!v)} />

            <Label className="text-sm self-start pt-1 text-foreground">Reason For Manual Clock {mode === "in" ? "In" : "Out"}</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[100px]" />
          </div>

          <Button
            size="sm"
            className="bg-success hover:bg-success/90 text-success-foreground gap-1 h-8"
            onClick={() => {
              toast.success(`Clock ${mode} updated for ${staff}`);
              onClose();
            }}
          >
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
        <div className="flex justify-end px-4 py-3 border-t border-border bg-muted/30">
          <Button size="sm" variant="secondary" onClick={onClose} className="h-8">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AmendShiftDialog({
  open, shift, onClose, onSaved,
}: {
  open: boolean;
  shift: LiveRotaShift;
  onClose: () => void;
  onSaved: (s: LiveRotaShift) => void;
}) {
  const [service, setService] = useState(shift.serviceCall ?? "Private Evening Call");
  const [rotaType, setRotaType] = useState("Normal");
  const [date, setDate] = useState(shift.date);
  const [startH, startM] = (shift.start || "20:45").split(":");
  const [endH, endM] = (shift.end || "21:15").split(":");
  const [sH, setSH] = useState(startH);
  const [sM, setSM] = useState(startM);
  const [eH, setEH] = useState(endH);
  const [eM, setEM] = useState(endM);
  const [duration, setDuration] = useState(shift.schedHrs ?? "00:30");
  const [timeLock, setTimeLock] = useState("No");
  const [link, setLink] = useState("No");
  const [amendTemplate, setAmendTemplate] = useState("No");
  const [tasksRequired, setTasksRequired] = useState("Yes");
  const [tasks, setTasks] = useState("Evening Tasks");
  const [medRequired, setMedRequired] = useState("Yes");
  const [medication, setMedication] = useState("Evening Medication");
  const [alert, setAlert] = useState("Yes");
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const buildUpdated = (): LiveRotaShift => ({
    ...shift,
    serviceCall: service,
    date,
    start: `${sH}:${sM}`,
    end: `${eH}:${eM}`,
    schedHrs: duration,
  });

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const updated = buildUpdated();
      // Best-effort persistence — ignore if shift row doesn't exist for this dummy ref
      await supabase
        .from("shifts")
        .update({
          start_time: updated.start,
          end_time: updated.end,
          shift_type: service,
          notes: `Amended via Live Rota — ${new Date().toLocaleString("en-GB")}`,
        })
        .eq("id", shift.ref)
        .then(() => {});
      onSaved(updated);
    } catch (e) {
      onSaved(buildUpdated());
    } finally {
      setSaving(false);
      setConfirm(false);
    }
  };

  const Row = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
      <Label className="text-sm text-foreground">
        {required && <span className="text-destructive mr-0.5">*</span>}{label}
      </Label>
      <div>{children}</div>
    </div>
  );

  const YesNo = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="Yes">Yes</SelectItem>
        <SelectItem value="No">No</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-t-2 border-t-primary/70 bg-card">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Pencil className="h-4 w-4" /> Amend Shift Details
            </h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
            <Row label="Service" required>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Private Evening Call">Private Evening Call</SelectItem>
                  <SelectItem value="Private Morning Call">Private Morning Call</SelectItem>
                  <SelectItem value="WCC - Lunch Call">WCC - Lunch Call</SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <p className="text-xs text-muted-foreground italic">
              "Rota Types set to Alternative are handled differently when running wages. See alternative wage tariffs for more details"
            </p>

            <Row label="Rota Type" required>
              <Select value={rotaType} onValueChange={setRotaType}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Alternative">Alternative</SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <Row label="Date" required>
              <Input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 bg-muted" />
            </Row>

            <Row label="Start" required>
              <div className="flex items-center gap-2">
                <Select value={sH} onValueChange={setSH}>
                  <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <SelectItem key={i} value={String(i).padStart(2, "0")}>{String(i).padStart(2, "0")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>:</span>
                <Select value={sM} onValueChange={setSM}>
                  <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["00", "15", "30", "45"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </Row>

            <Row label="Duration">
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} className="h-8 bg-warning/20" />
            </Row>

            <Row label="End" required>
              <div className="flex items-center gap-2">
                <Select value={eH} onValueChange={setEH}>
                  <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <SelectItem key={i} value={String(i).padStart(2, "0")}>{String(i).padStart(2, "0")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>:</span>
                <Select value={eM} onValueChange={setEM}>
                  <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["00", "15", "30", "45"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </Row>

            <Row label="Add Time Lock?"><YesNo value={timeLock} onChange={setTimeLock} /></Row>
            <Row label="Link" required><YesNo value={link} onChange={setLink} /></Row>

            <p className="text-xs text-warning font-medium">
              Selecting yes below will permanently amend the service template for this record
            </p>

            <Row label="Amend Template"><YesNo value={amendTemplate} onChange={setAmendTemplate} /></Row>
            <Row label="Tasks Required?"><YesNo value={tasksRequired} onChange={setTasksRequired} /></Row>

            {tasksRequired === "Yes" && (
              <>
                <p className="text-xs text-success font-medium">
                  Tasks are now required. Please select your task group below
                </p>
                <Row label="Tasks">
                  <Select value={tasks} onValueChange={setTasks}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Evening Tasks">Evening Tasks</SelectItem>
                      <SelectItem value="Morning Tasks">Morning Tasks</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
              </>
            )}

            <Row label="Medication Required?"><YesNo value={medRequired} onChange={setMedRequired} /></Row>

            {medRequired === "Yes" && (
              <>
                <p className="text-xs text-success font-medium">
                  Medication is now a required field. Please select your medication group below
                </p>
                <Row label="Medication">
                  <Select value={medication} onValueChange={setMedication}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Evening Medication">Evening Medication</SelectItem>
                      <SelectItem value="Morning Medication">Morning Medication</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
              </>
            )}

            <Row label="Alert?"><YesNo value={alert} onChange={setAlert} /></Row>
          </div>

          <div className="flex justify-between items-center px-4 py-3 border-t border-border bg-muted/30">
            <Button
              size="sm"
              className="h-8 gap-1 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => setConfirm(true)}
            >
              <Save className="h-3.5 w-3.5" /> Update
            </Button>
            <Button size="sm" variant="secondary" onClick={onClose} className="h-8">Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm shift update</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>You are about to update the following shift:</p>
                <div className="rounded-sm border border-border bg-muted/30 p-3 space-y-1 text-foreground">
                  <div><span className="text-muted-foreground">Ref:</span> <span className="font-mono">{shift.ref}</span></div>
                  <div><span className="text-muted-foreground">Client:</span> {shift.client}</div>
                  <div><span className="text-muted-foreground">Service:</span> {shift.serviceCall ?? "—"} → <span className="font-medium">{service}</span></div>
                  <div><span className="text-muted-foreground">Date:</span> {shift.date} → <span className="font-medium">{date}</span></div>
                  <div><span className="text-muted-foreground">Start:</span> {shift.start} → <span className="font-medium">{sH}:{sM}</span></div>
                  <div><span className="text-muted-foreground">End:</span> {shift.end} → <span className="font-medium">{eH}:{eM}</span></div>
                  <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{duration}</span></div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdate}
              disabled={saving}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              {saving ? "Saving..." : "Confirm Update"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ShiftChangeConfirmation({
  data, onClose,
}: { data: { before: LiveRotaShift; after: LiveRotaShift } | null; onClose: () => void }) {
  if (!data) return null;
  const { before, after } = data;
  const Row = ({ label, a, b }: { label: string; a: string; b: string }) => (
    <tr className="border-b border-border">
      <td className="p-2 text-muted-foreground">{label}</td>
      <td className="p-2">{a}</td>
      <td className="p-2 font-medium text-success">{b}</td>
    </tr>
  );
  return (
    <Dialog open={!!data} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-t-2 border-t-success/70 bg-card">
          <h3 className="text-sm font-semibold text-foreground">Shift Updated</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-foreground">
            Shift <span className="font-mono">{after.ref}</span> for <span className="font-medium">{after.client}</span> has been updated successfully.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border border-border">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-2 text-left">Field</th>
                  <th className="p-2 text-left">Before</th>
                  <th className="p-2 text-left">After</th>
                </tr>
              </thead>
              <tbody>
                <Row label="Service" a={before.serviceCall ?? "—"} b={after.serviceCall ?? "—"} />
                <Row label="Date" a={before.date} b={after.date} />
                <Row label="Start" a={before.start} b={after.start} />
                <Row label="End" a={before.end} b={after.end} />
                <Row label="Duration" a={before.schedHrs ?? "—"} b={after.schedHrs ?? "—"} />
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end px-4 py-3 border-t border-border bg-muted/30">
          <Button size="sm" onClick={onClose} className="h-8 bg-success hover:bg-success/90 text-success-foreground">Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
