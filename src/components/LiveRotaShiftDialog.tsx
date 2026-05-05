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
  if (!shift) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
            <DialogTitle className="text-base">
              Live Rota Shift — Ref {shift.ref} · {shift.client} · {shift.date} · {shift.start}–{shift.end}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {/* Live Rota Shift(s) section */}
            <section className="border border-border rounded-sm overflow-hidden">
              <div className="border-t-2 border-t-primary/70 flex items-center justify-between px-3 py-2 bg-card">
                <h3 className="text-sm font-semibold text-foreground">Live Rota Shift(s)</h3>
                <Button size="sm" className="h-7 gap-1 bg-warning hover:bg-warning/90 text-warning-foreground">
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
              <div className="p-3 text-xs text-muted-foreground">
                Notes marked as hidden will only appear on a single rota, service user and team member note area or some of the reports. Notes marked as hidden will also not appear on the Care Portal section.
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
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-warning text-warning-foreground">
        <div className="flex items-center justify-between px-4 py-3 border-b border-warning-foreground/20">
          <h3 className="text-sm font-semibold">
            Edit Clock {mode === "in" ? "In" : "Out"} Hours Manually
          </h3>
          <button onClick={onClose} className="hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="font-medium text-base border-b border-warning-foreground/30 pb-2">{staff}</div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-3">
            <Label className="text-sm">Time {mode}</Label>
            <div className="flex items-center gap-2">
              <Select value={hh} onValueChange={setHh}>
                <SelectTrigger className="h-8 w-20 bg-card text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <SelectItem key={i} value={String(i).padStart(2, "0")}>{String(i).padStart(2, "0")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>:</span>
              <Select value={mm} onValueChange={setMm}>
                <SelectTrigger className="h-8 w-20 bg-card text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["00", "15", "30", "45"].map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Label className="text-sm">Date {mode}</Label>
            <Input value={date} readOnly className="h-8 bg-muted text-foreground" />

            <Label className="text-sm">Send Push</Label>
            <Checkbox checked={push} onCheckedChange={(v) => setPush(!!v)} className="bg-card" />

            <Label className="text-sm self-start pt-1">Reason For Manual Clock {mode === "in" ? "In" : "Out"}</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="bg-card text-foreground min-h-[100px]" />
          </div>

          <Button
            size="sm"
            className="bg-warning-foreground/90 text-warning hover:bg-warning-foreground gap-1"
            onClick={() => {
              toast.success(`Clock ${mode} updated for ${staff}`);
              onClose();
            }}
          >
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
        <div className="flex justify-end px-4 py-3 border-t border-warning-foreground/20">
          <Button size="sm" variant="secondary" onClick={onClose} className="h-8">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
