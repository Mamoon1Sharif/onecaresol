import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { getCareGiverAvatar } from "@/lib/avatars";
import {
  Pencil, Plus, Lock, Info, Calendar, TrendingUp, Clock, ThumbsUp, Link as LinkIcon,
  Map as MapIcon, Users, AlertCircle, User, ArrowRight, FileText, Briefcase, Bell,
  PoundSterling, Camera, ListChecks, XCircle, Trash2, X, CheckCircle2, Activity,
  LogIn, LogOut, PlayCircle, CircleDot,
} from "lucide-react";

interface VisitRow {
  id: string;
  ref: string;
  date: string;
  status: string;
  serviceUserRaw: string;
  serviceUser: string;
  scheduledStart: string;
  scheduledEnd: string;
  duration: string;
  actualStart: string;
  actualEnd: string;
  actualDuration: string;
  teamMember: string;
  serviceCall: string;
  isFuture: boolean;
  accepted: boolean;
  week?: string;
  weekNum?: number;
}

interface Note {
  id: string;
  author: string;
  text: string;
  hidden: boolean;
  createdAt: string;
}

interface RotaLock {
  id: string;
  reason: string;
  by: string;
  createdAt: string;
}

interface Props {
  visit: VisitRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const COL_ICON = "h-3.5 w-3.5 text-muted-foreground/70";

export function VisitDetailDialog({ visit, open, onOpenChange }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [locks, setLocks] = useState<RotaLock[]>([]);
  const [shadow, setShadow] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [shadowOpen, setShadowOpen] = useState(false);

  // Editable shift fields (local)
  const [editStatus, setEditStatus] = useState<string>(visit?.status ?? "");
  const [editStart, setEditStart] = useState<string>(visit?.scheduledStart ?? "");
  const [editEnd, setEditEnd] = useState<string>(visit?.scheduledEnd ?? "");
  const [editServiceCall, setEditServiceCall] = useState<string>(visit?.serviceCall ?? "");

  // Note draft
  const [noteText, setNoteText] = useState("");
  const [noteHidden, setNoteHidden] = useState(false);

  // Lock draft
  const [lockReason, setLockReason] = useState("");

  // Clock state per team member (single member here)
  const [clockIn, setClockIn] = useState<string | null>(null);
  const [clockOut, setClockOut] = useState<string | null>(null);
  const [memberRemoved, setMemberRemoved] = useState(false);

  if (!visit) return null;

  const built = `${visit.ref} at ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} on ${visit.date}`;

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    setNotes((n) => [
      ...n,
      { id: crypto.randomUUID(), author: "You", text: noteText, hidden: noteHidden, createdAt: new Date().toLocaleString("en-GB") },
    ]);
    setNoteText("");
    setNoteHidden(false);
    setNoteOpen(false);
  };

  const handleAddLock = () => {
    if (!lockReason.trim()) return;
    setLocks((l) => [
      ...l,
      { id: crypto.randomUUID(), reason: lockReason, by: "You", createdAt: new Date().toLocaleString("en-GB") },
    ]);
    setLockReason("");
    setLockOpen(false);
  };

  const handleClockIn = () => setClockIn(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
  const handleClockOut = () => setClockOut(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));

  const duration = (() => {
    if (!clockIn || !clockOut) return "0 minutes";
    const [h1, m1] = clockIn.split(":").map(Number);
    const [h2, m2] = clockOut.split(":").map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "0 minutes";
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] p-0 gap-0 overflow-hidden">
        {/* ============== HEADER ============== */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Info className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Shift Details — {visit.ref}</h2>
              <p className="text-xs text-muted-foreground">{visit.serviceUserRaw} · {visit.date}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(92vh-56px)]">
          <div className="p-4 space-y-6">

            {/* ============== LIVE ROTA SHIFTS ============== */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-primary">Live Rota Shift(s)</h3>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs gap-1.5" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit Shift Details
                </Button>
              </div>

              <Card className="border border-border overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Select defaultValue="bulk">
                      <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bulk">Bulk Actions...</SelectItem>
                        <SelectItem value="confirm">Confirm</SelectItem>
                        <SelectItem value="cancel">Cancel</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground h-8 px-4 text-xs">Go</Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border">
                        <th className="p-2 border-r border-border w-8"><input type="checkbox" className="rounded" /></th>
                        <th className="p-2 border-r border-border text-left w-20">Ref</th>
                        <th className="p-2 border-r border-border text-left w-20">Date</th>
                        <th className="p-2 border-r border-border text-left w-24">Status</th>
                        <th className="p-2 border-r border-border text-center w-10" title="Accepted"><ThumbsUp className={COL_ICON} /></th>
                        <th className="p-2 border-r border-border text-center w-10" title="Linked"><LinkIcon className={COL_ICON} /></th>
                        <th className="p-2 border-r border-border text-center w-10" title="Location"><MapIcon className={COL_ICON} /></th>
                        <th className="p-2 border-r border-border text-center w-10" title="Team"><Users className={COL_ICON} /></th>
                        <th className="p-2 border-r border-border text-center w-10" title="Alerts"><AlertCircle className={COL_ICON} /></th>
                        <th className="p-2 border-r border-border text-left">Service User</th>
                        <th className="p-2 border-r border-border text-center w-16 bg-emerald-100" title="Scheduled Start"><Calendar className="h-3.5 w-3.5 text-emerald-700 mx-auto" /></th>
                        <th className="p-2 border-r border-border text-center w-16 bg-rose-100" title="Scheduled End"><Calendar className="h-3.5 w-3.5 text-rose-700 mx-auto" /></th>
                        <th className="p-2 border-r border-border text-center w-16" title="Duration"><TrendingUp className={COL_ICON} /></th>
                        <th className="p-2 border-r border-border text-center w-16 bg-emerald-100" title="Clocked In"><Clock className="h-3.5 w-3.5 text-emerald-700 mx-auto" /></th>
                        <th className="p-2 border-r border-border text-center w-16 bg-rose-100" title="Clocked Out"><Clock className="h-3.5 w-3.5 text-rose-700 mx-auto" /></th>
                        <th className="p-2 border-r border-border text-center w-16" title="Worked"><TrendingUp className={COL_ICON} /></th>
                        <th className="p-2 border-r border-border text-left">Team Member</th>
                        <th className="p-2 border-r border-border text-left w-20">Week</th>
                        <th className="p-2 text-center w-10"><Lock className={COL_ICON} /></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-purple-100/70 border-b border-border">
                        <td className="p-1.5 border-r border-border text-center"><input type="checkbox" className="rounded" /></td>
                        <td className="p-1.5 border-r border-border text-center">
                          <a className="text-primary hover:underline cursor-pointer font-mono text-[11px]">{visit.ref}</a>
                        </td>
                        <td className="p-1.5 border-r border-border font-mono text-[11px] text-center">{visit.date}</td>
                        <td className="p-1.5 border-r border-border text-[11px] font-semibold">
                          {(() => {
                            const s = editStatus || visit.status;
                            // Live rota: never show "Complete".
                            const live = s === "Complete" ? "In Progress" : s;
                            const tone = live === "Missed" ? "text-destructive" : live === "In Progress" || live === "Finished" ? "text-success" : "text-blue-600";
                            return <span className={tone}>{live}</span>;
                          })()}
                        </td>
                        <td className="p-1.5 border-r border-border text-center">{visit.accepted ? <CheckCircle2 className="h-3.5 w-3.5 text-success mx-auto" /> : <span className="text-muted-foreground/40 text-[11px]">—</span>}</td>
                        <td className="p-1.5 border-r border-border text-center text-muted-foreground/40 text-[11px]">—</td>
                        <td className="p-1.5 border-r border-border text-center text-muted-foreground/40 text-[11px]">—</td>
                        <td className="p-1.5 border-r border-border text-center"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" /></td>
                        <td className="p-1.5 border-r border-border text-center text-muted-foreground/40 text-[11px]">—</td>
                        <td className="p-1.5 border-r border-border">
                          <a className="text-primary hover:underline cursor-pointer text-[11px]">{visit.serviceUser}</a>
                        </td>
                        <td className="p-1.5 border-r border-border text-center font-mono text-[11px] bg-emerald-50">{editStart || visit.scheduledStart}</td>
                        <td className="p-1.5 border-r border-border text-center font-mono text-[11px] bg-rose-50">{editEnd || visit.scheduledEnd}</td>
                        <td className="p-1.5 border-r border-border text-center font-mono text-[11px]">{visit.duration}</td>
                         <td className="p-1.5 border-r border-border text-center font-mono text-[11px] bg-emerald-50">{visit.isFuture || (editStatus || visit.status) === "Missed" ? "—" : (clockIn || visit.actualStart || "—")}</td>
                         <td className="p-1.5 border-r border-border text-center font-mono text-[11px] bg-rose-50">{visit.isFuture || (editStatus || visit.status) === "Missed" ? "—" : (clockOut || visit.actualEnd || "—")}</td>
                         <td className="p-1.5 border-r border-border text-center font-mono text-[11px]">{visit.isFuture || (editStatus || visit.status) === "Missed" ? "—" : (duration !== "0 minutes" ? duration : (visit.actualDuration || "—"))}</td>
                        <td className="p-1.5 border-r border-border">
                          <a className="text-primary hover:underline cursor-pointer text-[11px]">{visit.teamMember}</a>
                        </td>
                        <td className="p-1.5 border-r border-border text-[11px]">{visit.week ?? "Week 1"}</td>
                        <td className="p-1.5 text-center"><Lock className="h-3 w-3 text-muted-foreground mx-auto" /></td>
                      </tr>
                      <tr className="border-b border-border bg-card">
                        <td className="p-1.5 border-r border-border" colSpan={11} />
                        <td className="p-1.5 border-r border-border text-[11px] font-mono" colSpan={3}>
                          <div>{visit.duration}</div>
                          <div className="text-[10px] text-muted-foreground">Sched hrs</div>
                        </td>
                        <td className="p-1.5 border-r border-border text-[11px] font-mono" colSpan={3}>
                          <div>{(editStatus || visit.status) === "Missed" ? "00:00" : (duration !== "0 minutes" ? duration : (visit.actualDuration || "00:00"))}</div>
                          <div className="text-[10px] text-muted-foreground">Clock hrs</div>
                        </td>
                        <td className="p-1.5 border-r border-border" colSpan={3} />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <p className="text-xs text-center text-primary mt-2">
                Built from template: <a className="font-semibold hover:underline cursor-pointer">{built}</a>
              </p>
            </section>

            {/* ============== SHIFT TIMELINE ============== */}
            <section>
              <h3 className="text-sm font-semibold text-primary border-b pb-1 mb-3 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" /> Shift Timeline
              </h3>
              {(() => {
                const currentStatus = (editStatus || visit.status || "").toLowerCase();
                const isMissed = currentStatus === "missed";
                const events: { time: string; label: string; icon: any; tone: string; sub?: string }[] = [];

                events.push({ time: editStart || visit.scheduledStart, label: "Shift scheduled to start", icon: Calendar, tone: "text-blue-600", sub: "Built from rota template" });

                if (isMissed) {
                  // Missed shift: no clock-in/out, no "in progress". Show that no-one attended.
                  events.push({
                    time: editStart || visit.scheduledStart,
                    label: `${visit.teamMember && visit.teamMember !== "—" ? visit.teamMember : "Caregiver"} did not clock in`,
                    icon: XCircle,
                    tone: "text-destructive",
                    sub: "No GPS check-in recorded at scheduled start time",
                  });
                  events.push({
                    time: editEnd || visit.scheduledEnd,
                    label: "Shift marked as Missed",
                    icon: AlertCircle,
                    tone: "text-destructive",
                    sub: "Office notified · added to incidents for follow-up",
                  });
                } else {
                  if (clockIn || visit.actualStart) {
                    events.push({ time: clockIn || visit.actualStart, label: `${visit.teamMember} clocked in`, icon: LogIn, tone: "text-success", sub: "GPS verified at service-user address" });
                    events.push({ time: clockIn || visit.actualStart, label: "Shift in progress", icon: PlayCircle, tone: "text-success" });
                  }
                  if (clockOut || visit.actualEnd) {
                    events.push({ time: clockOut || visit.actualEnd, label: `${visit.teamMember} clocked out`, icon: LogOut, tone: "text-rose-600", sub: `Total worked: ${duration !== "0 minutes" ? duration : visit.actualDuration || "—"}` });
                  }
                  events.push({ time: editEnd || visit.scheduledEnd, label: "Shift scheduled to end", icon: Calendar, tone: "text-blue-600" });
                }

                return (
                  <ol className="relative border-l-2 border-border ml-3 space-y-4 py-1">
                    {events.map((e, i) => {
                      const Ico = e.icon;
                      return (
                        <li key={i} className="ml-5">
                          <span className={`absolute -left-[11px] flex items-center justify-center h-5 w-5 rounded-full bg-card border-2 border-border ${e.tone}`}>
                            <Ico className="h-2.5 w-2.5" />
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-xs font-semibold text-foreground">{e.time || "—"}</span>
                            <span className="text-xs text-foreground">{e.label}</span>
                          </div>
                          {e.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{e.sub}</p>}
                        </li>
                      );
                    })}
                  </ol>
                );
              })()}
            </section>

            {/* ============== TASKS ============== */}
            <section>
              <ShiftTasks
                shiftEnd={editEnd || visit.scheduledEnd}
                clockOut={clockOut || visit.actualEnd}
                isMissed={(editStatus || visit.status || "").toLowerCase() === "missed"}
              />
            </section>

            {/* ============== ASSIGNED TEAM MEMBERS ============== */}
            <section>
              <h3 className="text-sm font-semibold text-foreground border-b pb-1 mb-3">Assigned Team Members</h3>
              {memberRemoved || visit.teamMember === "—" ? (
                <p className="text-xs text-muted-foreground text-center py-6">No team member assigned.</p>
              ) : (
                <div className="flex items-start gap-6 flex-wrap">
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={getCareGiverAvatar(visit.id, null)}
                      alt={visit.teamMember}
                      className="h-28 w-28 rounded object-cover border border-border"
                    />
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs w-full gap-1.5"
                      onClick={() => setMemberRemoved(true)}
                    >
                      ↑ Remove Team Member
                    </Button>
                  </div>
                  <div className="flex-1 min-w-[240px]">
                    <a className="text-primary hover:underline font-medium text-sm cursor-pointer">{visit.teamMember}</a>
                    {(editStatus || visit.status || "").toLowerCase() === "missed" ? (
                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">- Clock In:</span>
                          <span className="font-mono font-semibold text-destructive">No check-in</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">- Clock Out:</span>
                          <span className="font-mono font-semibold text-destructive">No check-out</span>
                        </div>
                        <div className="text-destructive font-medium">Shift was missed — caregiver did not attend.</div>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">- Clock In:</span>
                          {clockIn ? (
                            <span className="font-mono font-semibold text-success">{clockIn}</span>
                          ) : (
                            <Button size="sm" variant="outline" className="h-6 text-[11px] px-2" onClick={handleClockIn}>Clock In</Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">- Clock Out:</span>
                          {clockOut ? (
                            <span className="font-mono font-semibold text-success">{clockOut}</span>
                          ) : (
                            <Button size="sm" variant="outline" className="h-6 text-[11px] px-2" disabled={!clockIn} onClick={handleClockOut}>Clock Out</Button>
                          )}
                        </div>
                        <div className="text-orange-600">Duration: {duration}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-center text-primary mt-4">
                If clock in or out distances are not showing, it means your team member has location services off on their mobile phone.
              </p>
            </section>

            {/* ============== ROTA LOCKS ============== */}
            <section>
              <div className="flex items-center justify-between border-b pb-1 mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Rota Locks</h3>
                <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground h-8 text-xs gap-1" onClick={() => setLockOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Lock
                </Button>
              </div>
              {locks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No locks added.</p>
              ) : (
                <div className="space-y-1.5">
                  {locks.map((l) => (
                    <div key={l.id} className="flex items-center justify-between bg-muted/40 rounded px-3 py-2 text-xs">
                      <div>
                        <div className="font-medium">{l.reason}</div>
                        <div className="text-[10px] text-muted-foreground">By {l.by} · {l.createdAt}</div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setLocks((arr) => arr.filter((x) => x.id !== l.id))}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ============== LIVE ROTA NOTES ============== */}
            <section>
              <div className="flex items-center justify-between border-b pb-1 mb-2">
                <h3 className="text-sm font-semibold text-primary">Live Rota Notes</h3>
                <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground h-8 text-xs gap-1" onClick={() => setNoteOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add New
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">
                Notes marked as hidden will only appear on a single rota, service user and team member note area or some of the reports. Notes marked as hidden will also not appear on the Care Portal section.
              </p>
              {notes.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No notes added.</p>
              ) : (
                <div className="space-y-2">
                  {notes.map((n) => (
                    <div key={n.id} className="bg-muted/40 rounded px-3 py-2 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{n.author} {n.hidden && <span className="text-[10px] text-amber-600 ml-1">(hidden)</span>}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{n.createdAt}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNotes((arr) => arr.filter((x) => x.id !== n.id))}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p>{n.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ============== SHADOW SHIFTS ============== */}
            <section>
              <div className="flex items-center justify-between border-b pb-1 mb-2">
                <h3 className="text-sm font-semibold text-primary">Shadow Shifts</h3>
                <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground h-8 text-xs gap-1" onClick={() => setShadowOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add New
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">
                shadowing shifts will not be included in any invoicing, they will be included in payroll if completed
              </p>
              <Card className="border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border">
                        <th className="p-2 border-r border-border w-8"><input type="checkbox" className="rounded" /></th>
                        <th className="p-2 border-r border-border text-center w-16"><Info className={COL_ICON} /></th>
                        <th className="p-2 border-r border-border text-left w-20">Status</th>
                        <th className="p-2 border-r border-border text-left">Service User</th>
                        <th className="p-2 border-r border-border text-left">Team Member</th>
                        
                        <th className="p-2 text-left w-20">Week</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shadow.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-center text-muted-foreground text-xs">No data available in table</td></tr>
                      ) : (
                        shadow.map((s, i) => (
                          <tr key={i} className="border-b border-border">
                            <td className="p-1.5 border-r border-border text-center"><input type="checkbox" /></td>
                            <td className="p-1.5 border-r border-border font-mono text-[11px]">{s.ref}</td>
                            <td className="p-1.5 border-r border-border">{s.status}</td>
                            <td className="p-1.5 border-r border-border">{s.serviceUser}</td>
                            <td className="p-1.5 border-r border-border">{s.teamMember}</td>
                            
                            <td className="p-1.5">{s.week}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>

          </div>
        </ScrollArea>

        {/* ============== EDIT SHIFT DIALOG ============== */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md">
            <h3 className="font-semibold text-base mb-3">Edit Shift Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Status</label>
                <Select value={editStatus || visit.status} onValueChange={setEditStatus}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Due">Due</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Finished">Finished</SelectItem>
                    <SelectItem value="Missed">Missed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Scheduled Start</label>
                  <Input value={editStart || visit.scheduledStart} onChange={(e) => setEditStart(e.target.value)} className="h-9 mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium">Scheduled End</label>
                  <Input value={editEnd || visit.scheduledEnd} onChange={(e) => setEditEnd(e.target.value)} className="h-9 mt-1" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => setEditOpen(false)}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ============== ADD NOTE DIALOG ============== */}
        <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
          <DialogContent className="max-w-md">
            <h3 className="font-semibold text-base mb-3">Add Live Rota Note</h3>
            <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} placeholder="Write your note..." />
            <label className="flex items-center gap-2 text-xs mt-2">
              <input type="checkbox" checked={noteHidden} onChange={(e) => setNoteHidden(e.target.checked)} />
              Mark as hidden (won't appear on Care Portal)
            </label>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setNoteOpen(false)}>Cancel</Button>
              <Button size="sm" className="bg-success text-success-foreground" onClick={handleAddNote}>Add Note</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ============== ADD LOCK DIALOG ============== */}
        <Dialog open={lockOpen} onOpenChange={setLockOpen}>
          <DialogContent className="max-w-md">
            <h3 className="font-semibold text-base mb-3">Add Rota Lock</h3>
            <label className="text-xs font-medium">Reason</label>
            <Input value={lockReason} onChange={(e) => setLockReason(e.target.value)} className="mt-1" placeholder="e.g. Confirmed by service user" />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setLockOpen(false)}>Cancel</Button>
              <Button size="sm" className="bg-success text-success-foreground" onClick={handleAddLock}>Add Lock</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ============== ADD SHADOW SHIFT DIALOG ============== */}
        <Dialog open={shadowOpen} onOpenChange={setShadowOpen}>
          <DialogContent className="max-w-md">
            <h3 className="font-semibold text-base mb-3">Add Shadow Shift</h3>
            <ShadowForm onCancel={() => setShadowOpen(false)} onSave={(s) => { setShadow((arr) => [...arr, s]); setShadowOpen(false); }} visit={visit} />
          </DialogContent>
        </Dialog>

      </DialogContent>
    </Dialog>
  );
}

function ShadowForm({ visit, onCancel, onSave }: { visit: VisitRow; onCancel: () => void; onSave: (s: any) => void }) {
  const [team, setTeam] = useState("");
  return (
    <>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium">Shadowing Team Member</label>
          <Input value={team} onChange={(e) => setTeam(e.target.value)} className="mt-1" placeholder="Team member name" />
        </div>
        <div className="text-[11px] text-muted-foreground">
          Will shadow {visit.teamMember} on shift {visit.ref}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          className="bg-success text-success-foreground"
          onClick={() => team.trim() && onSave({
            ref: `SH-${visit.ref}`,
            status: "Pending",
            serviceUser: visit.serviceUserRaw,
            teamMember: team,
            serviceCall: visit.serviceCall,
            week: visit.week ?? "Week 1",
          })}
        >
          Add
        </Button>
      </div>
    </>
  );
}

interface TaskItem {
  id: string;
  title: string;
  done: boolean;
  completedAt?: string;
}

function ShiftTasks({ shiftEnd, clockOut, isMissed = false }: { shiftEnd: string; clockOut: string | null; isMissed?: boolean }) {
  const initialDone = !isMissed;
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: "t1", title: "Personal care — wash & dress", done: initialDone, completedAt: initialDone ? "08:14" : undefined },
    { id: "t2", title: "Administer morning medication", done: initialDone, completedAt: initialDone ? "08:32" : undefined },
    { id: "t3", title: "Prepare breakfast & assist with eating", done: initialDone, completedAt: initialDone ? "09:05" : undefined },
    { id: "t4", title: "Light housekeeping in kitchen", done: false },
    { id: "t5", title: "Lunchtime medication & meal", done: false },
    { id: "t6", title: "Record fluid & food intake", done: false },
  ]);
  const [draft, setDraft] = useState("");

  const completed = tasks.filter((t) => t.done);
  const pending = tasks.filter((t) => !t.done);
  const pct = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;

  const toggle = (id: string) =>
    setTasks((arr) =>
      arr.map((t) =>
        t.id === id
          ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : undefined }
          : t,
      ),
    );

  const addTask = () => {
    if (!draft.trim()) return;
    setTasks((arr) => [...arr, { id: crypto.randomUUID(), title: draft.trim(), done: false }]);
    setDraft("");
  };

  return (
    <>
      <div className="flex items-center justify-between border-b pb-1 mb-3">
        <h3 className="text-sm font-semibold text-primary flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5" /> Care Tasks
          <span className="text-[11px] font-normal text-muted-foreground ml-1">
            ({completed.length}/{tasks.length} complete · {pct}%)
          </span>
        </h3>
        <span className={`text-[11px] ${isMissed ? "text-destructive font-medium" : "text-muted-foreground"}`}>
          {isMissed ? "Shift missed — no tasks completed" : clockOut ? "Shift ended" : `Pending until ${shiftEnd}`}
        </span>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
        <div className={`h-full transition-all ${isMissed ? "bg-destructive" : "bg-success"}`} style={{ width: `${isMissed ? 100 : pct}%` }} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {/* Completed */}
        <div className="rounded border border-border bg-success/5 p-2">
          <div className="text-[11px] font-semibold text-success uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completed ({completed.length})
          </div>
          {completed.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-2">None yet.</p>
          ) : (
            <ul className="space-y-1">
              {completed.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked readOnly onClick={() => toggle(t.id)} className="rounded text-success" />
                  <span className="line-through text-muted-foreground flex-1">{t.title}</span>
                  <span className="font-mono text-[10px] text-success">{t.completedAt}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pending */}
        <div className={`rounded border border-border p-2 ${isMissed ? "bg-destructive/5" : "bg-amber-50"}`}>
          <div className={`text-[11px] font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1 ${isMissed ? "text-destructive" : "text-amber-700"}`}>
            <CircleDot className="h-3 w-3" /> {isMissed ? `Not done — shift missed (${pending.length})` : `Pending until end of shift (${pending.length})`}
          </div>
          {pending.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-2">All tasks done. 🎉</p>
          ) : (
            <ul className="space-y-1">
              {pending.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-xs">
                  <input type="checkbox" onChange={() => toggle(t.id)} className="rounded" />
                  <span className="flex-1 text-foreground">{t.title}</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setTasks((arr) => arr.filter((x) => x.id !== t.id))}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a new care task..."
          className="h-8 text-xs"
        />
        <Button size="sm" onClick={addTask} className="bg-success hover:bg-success/90 text-success-foreground h-8 text-xs gap-1">
          <Plus className="h-3.5 w-3.5" /> Add Task
        </Button>
      </div>
    </>
  );
}
