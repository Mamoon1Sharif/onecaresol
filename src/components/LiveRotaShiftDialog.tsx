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
import { Lock, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";

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

export function LiveRotaShiftDialog({
  shift, open, onClose,
}: { shift: LiveRotaShift | null; open: boolean; onClose: () => void }) {
  const [clockEdit, setClockEdit] = useState<null | "in" | "out">(null);
  const [amendOpen, setAmendOpen] = useState(false);
  const [current, setCurrent] = useState<LiveRotaShift | null>(shift);
  const [confirmation, setConfirmation] = useState<{ before: LiveRotaShift; after: LiveRotaShift } | null>(null);

  // sync incoming shift
  if (shift && (!current || current.ref !== shift.ref)) {
    setCurrent(shift);
  }
  if (!shift || !current) return null;

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
                  <Select defaultValue="bulk">
                    <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bulk">Bulk Actions...</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8 bg-success hover:bg-success/90 text-success-foreground">Go</Button>
                  <div className="ml-auto flex items-center gap-2">
                    <Label className="text-xs">Search:</Label>
                    <Input className="h-8 w-48 text-xs" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="p-2 border border-border w-8"><Checkbox /></th>
                        <th className="p-2 border border-border text-left">Ref</th>
                        <th className="p-2 border border-border text-left">Date</th>
                        <th className="p-2 border border-border text-left">Status</th>
                        <th className="p-2 border border-border text-left">Service User</th>
                        <th className="p-2 border border-border text-left">Start</th>
                        <th className="p-2 border border-border text-left">End</th>
                        <th className="p-2 border border-border text-left">Duration</th>
                        <th className="p-2 border border-border text-left">Team Member</th>
                        <th className="p-2 border border-border text-left">Service Call</th>
                        <th className="p-2 border border-border text-left">Week</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border border-border"><Checkbox /></td>
                        <td className="p-2 border border-border font-mono text-primary underline cursor-pointer">{shift.ref}</td>
                        <td className="p-2 border border-border">{shift.date}</td>
                        <td className="p-2 border border-border">Due</td>
                        <td className="p-2 border border-border text-primary underline cursor-pointer">{shift.client}</td>
                        <td className="p-2 border border-border">{shift.start}</td>
                        <td className="p-2 border border-border">{shift.end}</td>
                        <td className="p-2 border border-border">{shift.schedHrs ?? "00:30"}</td>
                        <td className="p-2 border border-border text-primary underline cursor-pointer">{shift.staff}</td>
                        <td className="p-2 border border-border">{shift.serviceCall ?? "Private Eve..."}</td>
                        <td className="p-2 border border-border">Week 1</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-border" colSpan={7}>
                          <span className="font-semibold mr-2">{shift.schedHrs ?? "00:30"}</span>Sched hrs
                          <span className="font-semibold mx-2 ml-6">{shift.clockHrs ?? "00:00"}</span>Clock hrs
                        </td>
                        <td className="p-2 border border-border" colSpan={4}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Built from template: <span className="text-primary underline">4496619</span> at 11:54 on 20/04/2026
                </p>
              </div>
            </section>

            {/* Assigned Team Members */}
            <section className="border border-border rounded-sm overflow-hidden">
              <div className="border-t-2 border-t-primary/70 px-3 py-2 bg-card">
                <h3 className="text-sm font-semibold text-foreground">Assigned Team Members</h3>
              </div>
              <div className="p-4 flex gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-[140px] h-[140px] rounded-sm border border-border bg-muted flex items-center justify-center text-muted-foreground text-xs">
                    {shift.staff}
                  </div>
                  <Button size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-8 w-[140px]">
                    ↑ Remove Team Member
                  </Button>
                </div>
                <div className="flex-1">
                  <div className="text-primary font-medium mb-2">{shift.staff}</div>
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
                    If clock in or out distances are not showing, it means your team member has location services off on their mobile phone.
                  </p>
                </div>
              </div>
            </section>

            {/* Rota Locks */}
            <section className="border border-border rounded-sm overflow-hidden">
              <div className="border-t-2 border-t-warning/80 flex items-center justify-between px-3 py-2 bg-card">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" /> Rota Locks
                </h3>
                <Button size="sm" className="h-7 gap-1 bg-success hover:bg-success/90 text-success-foreground">
                  <Plus className="h-3 w-3" /> Add Lock
                </Button>
              </div>
              <div className="p-3 text-xs text-muted-foreground">No locks set.</div>
            </section>

            {/* Live Rota Notes */}
            <section className="border border-border rounded-sm overflow-hidden">
              <div className="border-t-2 border-t-primary/70 flex items-center justify-between px-3 py-2 bg-card">
                <h3 className="text-sm font-semibold text-foreground">Live Rota Notes</h3>
                <Button size="sm" className="h-7 gap-1 bg-success hover:bg-success/90 text-success-foreground">
                  <Plus className="h-3 w-3" /> Add New
                </Button>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Notes marked as hidden will only appear on a single rota, service user and team member note area or some of the reports. Notes marked as hidden will also not appear on the Care Portal section.
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
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { ref: "139988439", created: "21/04/2026 12:06", note: "Service user prefers door bell to be rung twice on arrival.", by: "Maya Sawich", visible: "Yes" },
                        { ref: "139988512", created: "22/04/2026 09:14", note: "Key safe code refreshed — collect from office before visit.", by: "Anna Pereira", visible: "Yes" },
                        { ref: "139988577", created: "23/04/2026 16:42", note: "Family will be present during evening call. Hand over notes.", by: "Maria Khalil", visible: "No" },
                      ].map((n) => (
                        <tr key={n.ref} className="border-b border-border hover:bg-muted/30">
                          <td className="p-2 border border-border font-mono text-[11px]">{n.ref}</td>
                          <td className="p-2 border border-border">{n.created}</td>
                          <td className="p-2 border border-border">{n.note}</td>
                          <td className="p-2 border border-border text-primary underline cursor-pointer">{n.by}</td>
                          <td className="p-2 border border-border">{n.visible}</td>
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
                  <Select defaultValue="please">
                    <SelectTrigger className="h-8 w-[220px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="please">Please Select Meds...</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8 bg-success hover:bg-success/90 text-success-foreground">Go</Button>
                  <div className="ml-auto flex items-center gap-2">
                    <Label className="text-xs">Search:</Label>
                    <Input className="h-8 w-48 text-xs" />
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
                      {[
                        { name: "Atorvastatin", period: "Evening: 16:00 - 22:00", planned: ["Administer", "1", "40mg", "ONE to be taken at NIGHT"] },
                        { name: "Carbamazepine", period: "Evening: 16:00 - 22:00", planned: ["Administer", "1", "100mg", "ONE to be taken in the MORNING and NIGHT"] },
                        { name: "Dermol 500 Lotion", period: "", planned: ["Applied", "Use as a soap substitute."] },
                        { name: "E45 Cream", period: "", planned: ["Applied", "Apply as required"] },
                        { name: "Epimax Excetra Cream", period: "", planned: ["Applied", "Apply to arms and back daily"] },
                        { name: "Medi-Derma S Barrier Cream", period: "", planned: ["Applied", "Apply to groin and bottom when required. Use a pea size amount."] },
                        { name: "Ramipril", period: "Evening: 16:00 - 22:00", planned: ["Administer", "1", "5mg", "ONE to be taken in the MORNING and at NIGHT."] },
                      ].map((m) => (
                        <tr key={m.name} className="border-b border-border hover:bg-muted/30">
                          <td className="p-2 border border-border"><Checkbox /></td>
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
                  <p className="text-xs text-muted-foreground pt-2">Showing 1 to 7 of 7</p>
                </div>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <ClockEditDialog
        mode={clockEdit}
        staff={shift.staff}
        date={shift.date}
        defaultTime={clockEdit === "in" ? shift.start : shift.end}
        onClose={() => setClockEdit(null)}
      />
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
