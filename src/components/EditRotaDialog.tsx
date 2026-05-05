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
  { label: "Care Giver" },
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
                  description="Visual staff allocation with availability heatmap. Pick a care giver by viewing their schedule and skills side-by-side."
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
                  description="Add shadow care givers assigned to observe this visit."
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

/* -------------------------------------------------------------------------- */
/*  Medication Panel                                                           */
/* -------------------------------------------------------------------------- */

type MedStatus = "Complete" | "Refused" | "Not Given" | "Pending";

interface MedRow {
  id: string;
  name: string;
  status: MedStatus;
  audited: boolean;
  auditNotes: string;
  admin: {
    by: string;
    initials: string;
    timestamp: string;
    notRequired: boolean;
    dose: string;
    unit: string;
    form: string;
    route: string;
    note: string;
    signature: boolean;
  };
  linkedAreas: string[];
  planned: {
    method: string;
    pre: string;
    post: string;
    instructions: string;
  };
  bodyMap: string;
}

function medSlotLabel(start: number) {
  if (start < 11) return "Morning Medication";
  if (start < 14) return "Lunchtime Medication";
  if (start < 18) return "Tea-time Medication";
  return "Bedtime Medication";
}

function MedicationPanel({ shift }: { shift: EditRotaShift }) {
  const slot = medSlotLabel(shift.start);

  // Seeded sample meds for the visit. In a real app these come from the MAR.
  const [meds, setMeds] = useState<MedRow[]>(() => seedMeds(shift, slot));
  const [search, setSearch] = useState("");
  const [picker, setPicker] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  const filtered = meds.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.status.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(pageRows.map((r) => r.id)) : new Set());
  };

  const addMed = () => {
    if (!picker) return;
    const newMed: MedRow = {
      id: `m-${Date.now()}`,
      name: picker,
      status: "Pending",
      audited: false,
      auditNotes: "",
      admin: {
        by: "—",
        initials: "—",
        timestamp: shift.date + " " + fmtTime(shift.start),
        notRequired: false,
        dose: "1",
        unit: "0",
        form: "Tablet",
        route: "Oral",
        note: "—",
        signature: false,
      },
      linkedAreas: [],
      planned: { method: "Oral", pre: "0", post: "0", instructions: "Take as prescribed." },
      bodyMap: "—",
    };
    setMeds([newMed, ...meds]);
    setPicker("");
    toast.success(`${newMed.name} added`);
  };

  const setStatus = (id: string, status: MedStatus) => {
    setMeds(meds.map((m) => (m.id === id ? { ...m, status } : m)));
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    setMeds(meds.filter((m) => !selected.has(m.id)));
    setSelected(new Set());
    toast.success("Removed selected meds");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Pill className="h-4 w-4 text-primary" />
          Medication
          <span className="text-xs font-normal text-muted-foreground">({slot})</span>
        </h3>
        <div className="text-xs text-muted-foreground">
          Visit: <span className="text-foreground font-medium">{shift.client}</span>
          <span className="mx-1.5">·</span>
          {fmtTime(shift.start)}–{fmtTime(shift.end)}
        </div>
      </div>

      {/* Top bar: med picker + search */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 p-2 border border-border rounded-md bg-muted/30">
        <div className="flex items-center gap-2 flex-1">
          <Select value={picker} onValueChange={setPicker}>
            <SelectTrigger className="h-8 text-xs flex-1 max-w-xs">
              <SelectValue placeholder="Please Select Meds..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Paracetamol 500mg">Paracetamol 500mg</SelectItem>
              <SelectItem value="Ibuprofen 200mg">Ibuprofen 200mg</SelectItem>
              <SelectItem value="Amoxicillin 250mg">Amoxicillin 250mg</SelectItem>
              <SelectItem value="Atorvastatin 20mg">Atorvastatin 20mg</SelectItem>
              <SelectItem value="Bisoprolol 5mg">Bisoprolol 5mg</SelectItem>
              <SelectItem value="Dermol Cream">Dermol Cream</SelectItem>
              <SelectItem value="Salbutamol Inhaler">Salbutamol Inhaler</SelectItem>
              <SelectItem value="Warfarin 3mg">Warfarin 3mg</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 px-3 bg-success hover:bg-success/90 text-success-foreground text-xs" onClick={addMed}>
            Go
          </Button>
          {selected.size > 0 && (
            <Button size="sm" variant="destructive" className="h-8 px-3 text-xs" onClick={deleteSelected}>
              Remove ({selected.size})
            </Button>
          )}
        </div>
        <div className="relative md:w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search:"
            className="h-8 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Med table */}
      <div className="border border-border rounded-md overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[1100px]">
            <thead className="bg-muted/60 border-b border-border">
              <tr>
                <th className="w-8 px-2 py-2 text-left">
                  <Checkbox
                    checked={pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))}
                    onCheckedChange={(c) => toggleAll(!!c)}
                  />
                </th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Med Name</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Audited</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Audit Notes</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Admin Details</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Linked Areas</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Planned</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Body Map</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                    No medication scheduled for this visit.
                  </td>
                </tr>
              ) : (
                pageRows.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-b-0 hover:bg-muted/20 align-top">
                    <td className="px-2 py-3">
                      <Checkbox
                        checked={selected.has(m.id)}
                        onCheckedChange={() => toggleSelect(m.id)}
                      />
                    </td>
                    <td className="px-2 py-3 font-semibold text-foreground whitespace-nowrap">{m.name}</td>
                    <td className="px-2 py-3">
                      <Select value={m.status} onValueChange={(v) => setStatus(m.id, v as MedStatus)}>
                        <SelectTrigger className={cn(
                          "h-7 text-[11px] w-28 border",
                          m.status === "Complete" && "text-success border-success/40",
                          m.status === "Refused" && "text-destructive border-destructive/40",
                          m.status === "Not Given" && "text-warning border-warning/40",
                          m.status === "Pending" && "text-muted-foreground",
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Complete">Complete</SelectItem>
                          <SelectItem value="Refused">Refused</SelectItem>
                          <SelectItem value="Not Given">Not Given</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-3">
                      {m.audited ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <XIcon className="h-4 w-4 text-destructive" />
                      )}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">{m.auditNotes || "—"}</td>
                    <td className="px-2 py-3 min-w-[220px]">
                      <div className="flex items-start gap-2">
                        <span className="inline-block h-3.5 w-3.5 rounded-sm bg-success mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground">{m.admin.by}</div>
                          <div className="text-muted-foreground">{m.admin.timestamp}</div>
                          <div>{m.admin.notRequired ? "Not Required" : `Dose: ${m.admin.dose}`}</div>
                          <div className="text-muted-foreground">{m.admin.unit}</div>
                          <div className="text-muted-foreground">0</div>
                          <div>{m.admin.form}</div>
                          <div>{m.admin.route}</div>
                          <div className="text-muted-foreground italic">Note: {m.admin.note}</div>
                          {m.admin.signature && (
                            <div className="mt-1 border border-border rounded bg-background px-2 py-1 inline-flex">
                              <SignatureSvg seed={m.id} />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {m.linkedAreas.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {m.linkedAreas.map((a) => (
                            <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-2 py-3 max-w-[320px]">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground">{m.planned.method}</div>
                        <div className="text-muted-foreground">{m.planned.pre}</div>
                        <div className="text-muted-foreground">{m.planned.post}</div>
                        <div className="text-foreground/80 leading-snug">{m.planned.instructions}</div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">{m.bodyMap}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
          <div>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2">Page {page} / {totalPages}</span>
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignatureSvg({ seed }: { seed: string }) {
  // Deterministic squiggle so it's stable per row
  const h = Array.from(seed).reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
  const r = (n: number) => ((Math.abs(h) >> n) % 20) - 10;
  return (
    <svg width="120" height="40" viewBox="0 0 120 40" className="text-foreground">
      <path
        d={`M5 ${22 + r(0)} C 20 ${5 + r(2)}, 35 ${35 + r(4)}, 55 ${20 + r(6)} S 95 ${8 + r(8)}, 115 ${28 + r(10)}`}
        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
      <path
        d={`M30 ${30 + r(1)} q 12 -12 28 0 t 28 -2`}
        fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"
      />
    </svg>
  );
}

function seedMeds(shift: EditRotaShift, slot: string): MedRow[] {
  // Hash for deterministic per-shift content
  const h = Array.from(shift.id).reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
  const abs = Math.abs(h);

  // Some shifts have no meds
  if (abs % 5 === 0 && shift.staff === "Unassigned Shifts") return [];

  const time = `${fmtTime(shift.start)} ${shift.date}`;
  const carer = pickFromList(abs, [
    { name: "Sumayyah Shafiq", initials: "SS" },
    { name: "Ewelina Delport", initials: "ED" },
    { name: "Jodie Hawtin", initials: "JH" },
    { name: "Maria Khalil", initials: "MK" },
    { name: "Rita Muneeb", initials: "RM" },
  ]);

  const base: MedRow[] = [
    {
      id: shift.id + "-m1",
      name: "Dermol Cream",
      status: "Complete",
      audited: false,
      auditNotes: "",
      admin: {
        by: carer.name,
        initials: carer.initials,
        timestamp: time,
        notRequired: true,
        dose: "0",
        unit: "0",
        form: "Cream",
        route: "Topical",
        note: "not required",
        signature: true,
      },
      linkedAreas: [],
      planned: {
        method: "Applied",
        pre: "0",
        post: "0",
        instructions:
          "Apply to the skin or use as a soap substitute. For external use ONLY. CAUTION: Flammable keep your body away from fire or flames after you have put on this medicine. Dressings and clothing in contact with this product are easily ignited by a naked flame.",
      },
      bodyMap: "—",
    },
  ];

  if (slot.startsWith("Morning") || slot.startsWith("Bedtime")) {
    base.push({
      id: shift.id + "-m2",
      name: "Atorvastatin 20mg",
      status: abs % 3 === 0 ? "Refused" : "Complete",
      audited: true,
      auditNotes: abs % 3 === 0 ? "Service user declined" : "Witnessed",
      admin: {
        by: carer.name,
        initials: carer.initials,
        timestamp: time,
        notRequired: false,
        dose: "1",
        unit: "Tablet",
        form: "Tablet",
        route: "Oral",
        note: "Given with water",
        signature: true,
      },
      linkedAreas: ["Cardiac"],
      planned: { method: "Oral", pre: "1", post: "0", instructions: "Take one tablet at the same time each day. Swallow whole with water." },
      bodyMap: "—",
    });
  }

  if (slot.startsWith("Lunch") || slot.startsWith("Tea")) {
    base.push({
      id: shift.id + "-m3",
      name: "Paracetamol 500mg",
      status: "Complete",
      audited: true,
      auditNotes: "PRN — pain reported",
      admin: {
        by: carer.name,
        initials: carer.initials,
        timestamp: time,
        notRequired: false,
        dose: "2",
        unit: "Tablets",
        form: "Tablet",
        route: "Oral",
        note: "For mild back pain",
        signature: true,
      },
      linkedAreas: ["PRN", "Pain"],
      planned: { method: "Oral", pre: "2", post: "0", instructions: "Up to 2 tablets every 4–6 hours. Maximum 8 tablets in 24 hours." },
      bodyMap: "—",
    });
  }

  return base;
}

function pickFromList<T>(seed: number, arr: T[]): T {
  return arr[Math.abs(seed) % arr.length];
}
