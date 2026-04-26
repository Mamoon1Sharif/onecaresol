import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Info,
  CalendarDays,
  Ban,
  ThumbsUp,
  Link2,
  Map as MapIcon,
  ListChecks,
  TrendingUp,
  Clock,
  CircleAlert,
  Bell,
  Pencil,
  Eye,
  UserCog,
  LogIn,
  LogOut,
  StickyNote,
  CheckSquare,
  Pill,
  Users,
  Lock,
  Search,
  Check,
  X as XIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export interface EditRotaShift {
  id: string;
  ref: string;
  date: string; // dd/MM/yyyy
  status: string; // Missed | Scheduled | Complete | In Progress | On Call
  client: string;
  start: number;
  end: number;
  staff: string;
  service: string;
  schedHours?: string;
  clockHours?: string;
  week?: number;
  weekNo?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: EditRotaShift | null;
  onSave: (updates: {
    service: string;
    rotaType: string;
    date: string;
    startH: number;
    startM: number;
    endH: number;
    endM: number;
    link: string;
    alert: string;
    taskCall: string;
    tasks: string;
    medCall: string;
  }) => void;
}

type Tab =
  | "edit"
  | "edit-staff"
  | "service-user"
  | "manual-in"
  | "manual-out"
  | "notes"
  | "tasks"
  | "medication"
  | "shadows"
  | "locks";

const TABS: { id: Tab; label: string; icon: typeof Pencil }[] = [
  { id: "edit", label: "Edit", icon: Pencil },
  { id: "edit-staff", label: "Edit Staff with Visual", icon: Eye },
  { id: "service-user", label: "Go to Service Users Profile", icon: UserCog },
  { id: "manual-in", label: "Manual Clock In", icon: LogIn },
  { id: "manual-out", label: "Manual Clock Out", icon: LogOut },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "medication", label: "Medication", icon: Pill },
  { id: "shadows", label: "Shadows", icon: Users },
  { id: "locks", label: "Locks", icon: Lock },
];

const HEADER_COLS: { label: string; icon?: typeof Info; tone?: string }[] = [
  { label: "", icon: Info },
  { label: "", icon: CalendarDays },
  { label: "Status" },
  { label: "", icon: Ban },
  { label: "", icon: ThumbsUp },
  { label: "", icon: Link2 },
  { label: "", icon: MapIcon },
  { label: "", icon: ListChecks },
  { label: "Service User" },
  { label: "", icon: CalendarDays, tone: "text-success" },
  { label: "", icon: CalendarDays, tone: "text-destructive" },
  { label: "", icon: TrendingUp },
  { label: "", icon: Clock, tone: "text-success" },
  { label: "", icon: CircleAlert, tone: "text-destructive" },
  { label: "", icon: TrendingUp },
  { label: "Team Member" },
  { label: "Service Call" },
  { label: "", icon: Bell },
  { label: "", icon: Pencil },
];

function fmtTime(h: number) {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("miss")) return "text-destructive font-semibold";
  if (s.includes("complete")) return "text-success font-semibold";
  if (s.includes("progress")) return "text-primary font-semibold";
  if (s.includes("call")) return "text-purple-600 font-semibold";
  return "text-foreground";
}

export function EditRotaDialog({ open, onOpenChange, shift, onSave }: Props) {
  const [active, setActive] = useState<Tab>("edit");

  // form state
  const [service, setService] = useState("WCC - Lunch Call (Z4-T3)");
  const [rotaType, setRotaType] = useState("Normal");
  const [dateStr, setDateStr] = useState("");
  const [startH, setStartH] = useState("00");
  const [startM, setStartM] = useState("00");
  const [endH, setEndH] = useState("00");
  const [endM, setEndM] = useState("00");
  const [link, setLink] = useState("No");
  const [alert, setAlert] = useState("Yes");
  const [taskCall, setTaskCall] = useState("Yes");
  const [tasks, setTasks] = useState("Lunchtime");
  const [medCall, setMedCall] = useState("No");

  useEffect(() => {
    if (!shift) return;
    setActive("edit");
    setService(shift.service.replace(/\s-\s(Missed|Complete|In Progress|On Call|Scheduled)$/, ""));
    setRotaType("Normal");
    setDateStr(shift.date);
    setStartH(String(Math.floor(shift.start)).padStart(2, "0"));
    setStartM(String(Math.round((shift.start - Math.floor(shift.start)) * 60)).padStart(2, "0"));
    setEndH(String(Math.floor(shift.end)).padStart(2, "0"));
    setEndM(String(Math.round((shift.end - Math.floor(shift.end)) * 60)).padStart(2, "0"));
    setLink("No");
    setAlert("Yes");
    setTaskCall("Yes");
    setTasks("Lunchtime");
    setMedCall("No");
  }, [shift]);

  if (!shift) return null;

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const mins = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  const handleSave = () => {
    onSave({
      service,
      rotaType,
      date: dateStr,
      startH: Number(startH),
      startM: Number(startM),
      endH: Number(endH),
      endM: Number(endM),
      link,
      alert,
      taskCall,
      tasks,
      medCall,
    });
    toast.success("Shift updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 gap-0 bg-card max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-5 py-3 border-b border-border bg-muted/40 shrink-0">
          <DialogTitle className="text-base font-semibold text-foreground">
            Edit Rota Ref: <span className="text-primary">{shift.ref}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          {/* Summary table */}
          <div className="border-b border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[1100px]">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    {HEADER_COLS.map((c, i) => (
                      <th
                        key={i}
                        className="px-2 py-2 text-left text-[11px] font-semibold text-muted-foreground border-r border-border last:border-r-0 whitespace-nowrap"
                      >
                        {c.icon ? (
                          <c.icon className={cn("h-3.5 w-3.5", c.tone || "text-muted-foreground")} />
                        ) : (
                          c.label
                        )}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-left text-[11px] font-semibold text-muted-foreground whitespace-nowrap">Week</th>
                    <th className="px-2 py-2 text-left text-[11px] font-semibold text-muted-foreground whitespace-nowrap">#</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-destructive/5 border-b border-border">
                    <td className="px-2 py-2 border-r border-border">
                      <span className="text-primary underline cursor-pointer">{shift.ref}</span>
                    </td>
                    <td className="px-2 py-2 border-r border-border whitespace-nowrap">{shift.date}</td>
                    <td className={cn("px-2 py-2 border-r border-border", statusTone(shift.status))}>{shift.status}</td>
                    <td className="px-2 py-2 border-r border-border text-muted-foreground">×</td>
                    <td className="px-2 py-2 border-r border-border text-muted-foreground">—</td>
                    <td className="px-2 py-2 border-r border-border">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-500" />
                    </td>
                    <td className="px-2 py-2 border-r border-border text-muted-foreground">—</td>
                    <td className="px-2 py-2 border-r border-border text-muted-foreground">—</td>
                    <td className="px-2 py-2 border-r border-border whitespace-nowrap">
                      <span className="text-primary underline cursor-pointer">
                        {shift.client} - W...
                      </span>
                    </td>
                    <td className="px-2 py-2 border-r border-border whitespace-nowrap">{fmtTime(shift.start)}</td>
                    <td className="px-2 py-2 border-r border-border whitespace-nowrap">{fmtTime(shift.end)}</td>
                    <td className="px-2 py-2 border-r border-border whitespace-nowrap">
                      {fmtTime(shift.end - shift.start)}
                    </td>
                    <td className="px-2 py-2 border-r border-border text-muted-foreground">—</td>
                    <td className="px-2 py-2 border-r border-border text-muted-foreground">—</td>
                    <td className="px-2 py-2 border-r border-border text-muted-foreground">—</td>
                    <td className={cn("px-2 py-2 border-r border-border whitespace-nowrap", shift.staff === "Unassigned Shifts" ? "text-destructive font-medium" : "text-foreground")}>
                      {shift.staff === "Unassigned Shifts" ? "Unallocated" : shift.staff}
                    </td>
                    <td className="px-2 py-2 border-r border-border whitespace-nowrap">{service.length > 22 ? service.slice(0, 22) + "..." : service}</td>
                    <td className="px-2 py-2 border-r border-border text-muted-foreground">—</td>
                    <td className="px-2 py-2 border-r border-border text-muted-foreground">—</td>
                    <td className="px-2 py-2 border-r border-border whitespace-nowrap">Week {shift.week ?? 1}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">{shift.weekNo ?? 17}</td>
                  </tr>
                  <tr className="bg-background">
                    <td className="px-2 py-2 border-r border-border" colSpan={1}>
                      <div className="font-semibold">{shift.schedHours ?? fmtTime(shift.end - shift.start)}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Sched hrs</div>
                    </td>
                    <td className="px-2 py-2 border-r border-border" colSpan={1}>
                      <div className="font-semibold">{shift.clockHours ?? "00:00"}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Clock hrs</div>
                    </td>
                    <td colSpan={19}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Body: tabs + form */}
          <div className="grid grid-cols-12 gap-0">
            {/* Side tabs */}
            <div className="col-span-12 md:col-span-3 border-r border-border bg-muted/20">
              <div className="py-2">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  const isActive = active === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActive(t.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-left transition-colors border-l-2",
                        isActive
                          ? "bg-card border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{t.label}</span>
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form panel */}
            <div className="col-span-12 md:col-span-9 p-6">
              {active === "edit" && (
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-base font-semibold text-foreground mb-5 text-center">
                    Edit Rota Details
                  </h3>
                  <div className="space-y-3.5">
                    <FormRow label="Service" required>
                      <Select value={service} onValueChange={setService}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WCC - Lunch Call (Z4-T3)">WCC - Lunch Call (Z4-T3)</SelectItem>
                          <SelectItem value="WCC - Morning">WCC - Morning</SelectItem>
                          <SelectItem value="WCC - Tea Call">WCC - Tea Call</SelectItem>
                          <SelectItem value="WCC - Bedtime">WCC - Bedtime</SelectItem>
                          <SelectItem value="CHC - Morning Call">CHC - Morning Call</SelectItem>
                          <SelectItem value="Private - Live-in Care (Basic)">Private - Live-in Care (Basic)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormRow>

                    <FormRow label="Rota Type" required>
                      <Select value={rotaType} onValueChange={setRotaType}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Cover">Cover</SelectItem>
                          <SelectItem value="Shadow">Shadow</SelectItem>
                          <SelectItem value="Training">Training</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormRow>

                    <FormRow label="Date" required>
                      <Input
                        value={dateStr}
                        onChange={(e) => setDateStr(e.target.value)}
                        className="h-9 text-xs bg-muted/50"
                        readOnly
                      />
                    </FormRow>

                    <FormRow label="Start" required>
                      <div className="flex items-center gap-2">
                        <Select value={startH} onValueChange={setStartH}>
                          <SelectTrigger className="h-9 text-xs w-20"><SelectValue /></SelectTrigger>
                          <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                        </Select>
                        <span className="text-foreground font-semibold">:</span>
                        <Select value={startM} onValueChange={setStartM}>
                          <SelectTrigger className="h-9 text-xs w-20"><SelectValue /></SelectTrigger>
                          <SelectContent>{mins.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </FormRow>

                    <FormRow label="End" required>
                      <div className="flex items-center gap-2">
                        <Select value={endH} onValueChange={setEndH}>
                          <SelectTrigger className="h-9 text-xs w-20"><SelectValue /></SelectTrigger>
                          <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                        </Select>
                        <span className="text-foreground font-semibold">:</span>
                        <Select value={endM} onValueChange={setEndM}>
                          <SelectTrigger className="h-9 text-xs w-20"><SelectValue /></SelectTrigger>
                          <SelectContent>{mins.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </FormRow>

                    <FormRow label="Link" required>
                      <YesNoSelect value={link} onChange={setLink} />
                    </FormRow>

                    <FormRow label="Alert?" required>
                      <YesNoSelect value={alert} onChange={setAlert} />
                    </FormRow>

                    <FormRow label="Task Call?">
                      <YesNoSelect value={taskCall} onChange={setTaskCall} />
                    </FormRow>

                    <FormRow label="Tasks">
                      <Select value={tasks} onValueChange={setTasks}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lunchtime">Lunchtime</SelectItem>
                          <SelectItem value="Morning">Morning</SelectItem>
                          <SelectItem value="Teatime">Teatime</SelectItem>
                          <SelectItem value="Bedtime">Bedtime</SelectItem>
                          <SelectItem value="None">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormRow>

                    <FormRow label="Med Call?">
                      <YesNoSelect value={medCall} onChange={setMedCall} />
                    </FormRow>
                  </div>

                  <div className="flex justify-center mt-7">
                    <Button onClick={handleSave} className="h-8 px-6 text-xs">
                      Update Shift
                    </Button>
                  </div>
                </div>
              )}

              {active === "edit-staff" && (
                <PlaceholderPanel
                  title="Edit Staff with Visual"
                  description="Visual staff allocation with availability heatmap. Pick a team member by viewing their schedule and skills side-by-side."
                  cta="Open Visual Allocator"
                />
              )}

              {active === "service-user" && (
                <PlaceholderPanel
                  title="Service User Profile"
                  description={`Open ${shift.client}'s full profile to view care plans, key contacts, MAR chart and visit history.`}
                  cta="Go to Profile"
                />
              )}

              {active === "manual-in" && (
                <ManualClockPanel
                  type="in"
                  defaultTime={fmtTime(shift.start)}
                  onConfirm={() => { toast.success("Manual clock in recorded"); onOpenChange(false); }}
                />
              )}

              {active === "manual-out" && (
                <ManualClockPanel
                  type="out"
                  defaultTime={fmtTime(shift.end)}
                  onConfirm={() => { toast.success("Manual clock out recorded"); onOpenChange(false); }}
                />
              )}

              {active === "notes" && (
                <NotesPanel onSave={() => { toast.success("Note saved"); }} />
              )}

              {active === "tasks" && (
                <TasksPanel />
              )}

              {active === "medication" && (
                <MedicationPanel shift={shift} />
              )}

              {active === "shadows" && (
                <PlaceholderPanel
                  title="Shadows"
                  description="Add shadow team members assigned to observe this visit."
                  cta="Add Shadow"
                />
              )}

              {active === "locks" && (
                <PlaceholderPanel
                  title="Locks"
                  description="Lock this shift to prevent further changes from auto-rota or other planners."
                  cta="Lock Shift"
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3">
      <label className="col-span-3 text-xs text-foreground text-right font-medium">
        {required && <span className="text-destructive mr-0.5">*</span>}
        {label}
      </label>
      <div className="col-span-9">{children}</div>
    </div>
  );
}

function YesNoSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="Yes">Yes</SelectItem>
        <SelectItem value="No">No</SelectItem>
      </SelectContent>
    </Select>
  );
}

function PlaceholderPanel({ title, description, cta }: { title: string; description: string; cta: string }) {
  return (
    <div className="max-w-md mx-auto text-center py-8">
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground mb-6">{description}</p>
      <Button size="sm" onClick={() => toast.info(`${cta} - coming soon`)}>{cta}</Button>
    </div>
  );
}

function ManualClockPanel({ type, defaultTime, onConfirm }: { type: "in" | "out"; defaultTime: string; onConfirm: () => void }) {
  const [time, setTime] = useState(defaultTime);
  const [reason, setReason] = useState("");
  return (
    <div className="max-w-md mx-auto">
      <h3 className="text-base font-semibold text-foreground mb-5 text-center">
        Manual Clock {type === "in" ? "In" : "Out"}
      </h3>
      <div className="space-y-3.5">
        <FormRow label="Time" required>
          <Input value={time} onChange={(e) => setTime(e.target.value)} className="h-9 text-xs" />
        </FormRow>
        <FormRow label="Reason" required>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="text-xs min-h-[80px]" placeholder="e.g. Network outage, app fault" />
        </FormRow>
      </div>
      <div className="flex justify-center mt-7">
        <Button onClick={onConfirm} className="h-8 px-6 text-xs">Confirm</Button>
      </div>
    </div>
  );
}

function NotesPanel({ onSave }: { onSave: () => void }) {
  const [note, setNote] = useState("");
  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-base font-semibold text-foreground mb-5 text-center">Visit Notes</h3>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="text-xs min-h-[180px]" placeholder="Add a note about this visit..." />
      <div className="flex justify-center mt-5">
        <Button onClick={onSave} className="h-8 px-6 text-xs">Save Note</Button>
      </div>
    </div>
  );
}

function TasksPanel() {
  const [items, setItems] = useState([
    { id: 1, label: "Prepare lunch", done: true },
    { id: 2, label: "Medication prompt", done: true },
    { id: 3, label: "Check fluids", done: false },
    { id: 4, label: "Tidy kitchen", done: false },
  ]);
  return (
    <div className="max-w-md mx-auto">
      <h3 className="text-base font-semibold text-foreground mb-5 text-center">Visit Tasks</h3>
      <div className="space-y-2">
        {items.map((t) => (
          <label key={t.id} className="flex items-center gap-3 p-2.5 rounded border border-border hover:bg-muted/40 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={t.done}
              onChange={(e) => setItems(items.map(i => i.id === t.id ? { ...i, done: e.target.checked } : i))}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className={cn("flex-1", t.done && "line-through text-muted-foreground")}>{t.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
