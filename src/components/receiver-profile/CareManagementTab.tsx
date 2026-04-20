import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Star, CheckSquare, Hand, Users, Plus, Printer, Save, History, Pencil, Trash2,
  ChevronDown, ChevronRight, Calendar as CalendarIcon, Clock, FileText, Check, FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type SubTab = "outcomes" | "tasks" | "visits" | "groups";

interface Outcome {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  status: "Active" | "Inactive" | "Achieved";
  targetDate: string;
  progress: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;          // e.g. 2025-07-04
  isOngoing: boolean;
  visits: string[];           // visit-type pill labels
  isMedication: boolean;      // renders as blue document row (e.g. "Medication Stock Check")
  status: "Active" | "Inactive";
  outcome?: string;           // optional linked outcome (kept for compatibility)
}

interface Visit {
  id: string;
  type: string;
  startDate: string;        // e.g. 2025-06-30
  isOngoing: boolean;
  visitKind: string;        // "Care visit" | "Medication" | etc
  dayOfWeek: string;        // "Daily" / "Mon" / "Tue Wed Thu Fri Sat Sun"
  startTime: string;
  duration: number;
  caregivers: number;
  status: "Active" | "Inactive";
}

interface CareGroup {
  id: string;
  name: string;
  members: number;
  color: string;
  status: "Active" | "Inactive";
}

interface HistoryEntry {
  version: number;
  modifiedAt: string;
  modifiedBy: string;
  summary: string;
}

const SEED_OUTCOMES: Outcome[] = [
  { id: "o1", title: "Maintain mobility and balance", description: "Daily walking exercises with support to prevent falls.", category: "Physical Health", priority: "High", status: "Active", targetDate: "2026-09-30", progress: 65 },
  { id: "o2", title: "Improve nutrition and hydration", description: "Encourage 1.5L of fluid intake and balanced meals.", category: "Nutrition", priority: "Medium", status: "Active", targetDate: "2026-06-15", progress: 80 },
  { id: "o3", title: "Manage diabetes through routine checks", description: "Regular blood glucose monitoring and dietary adherence.", category: "Medical", priority: "High", status: "Active", targetDate: "2026-12-31", progress: 50 },
  { id: "o4", title: "Reduce social isolation", description: "Weekly community activities and family video calls.", category: "Wellbeing", priority: "Medium", status: "Achieved", targetDate: "2025-12-01", progress: 100 },
  { id: "o5", title: "Continue smoking cessation program", description: "Discontinued — service user moved to alternative provider.", category: "Wellbeing", priority: "Low", status: "Inactive", targetDate: "2025-08-01", progress: 30 },
];

const SEED_TASKS: Task[] = [
  { id: "t1", title: "Attach Night Bag", description: "Staff Member should empty my catheter and connect my Night Bag.", startDate: "2025-07-04", isOngoing: true, visits: ["Bed Time Visit"], isMedication: false, status: "Active" },
  { id: "t2", title: "Check and Changed Pad", description: "staff member should check my pad and change when required", startDate: "2025-07-11", isOngoing: true, visits: ["Bed Time Visit", "Medication Stock Check Visit"], isMedication: false, status: "Active" },
  { id: "t3", title: "Clean & Tidy", description: "Staff to ensure they empty bins, wash dishes, clean bathroom after use, wipe down kitchen sides and …", startDate: "2025-06-30", isOngoing: true, visits: ["Bed Time Visit", "Medication Stock Check Visit", "Morning Visit"], isMedication: false, status: "Active" },
  { id: "t4", title: "Dry & Dress", description: "Staff to support me with getting dry and dressing into clean appropriate clothing for the day.", startDate: "2025-06-30", isOngoing: true, visits: ["Medication Stock Check Visit", "Morning Visit"], isMedication: false, status: "Active" },
  { id: "t5", title: "Empty leg bag", description: "staff member to assist me to empty my catheter bag at all calls.", startDate: "2025-07-04", isOngoing: true, visits: ["Bed Time Visit", "Medication Stock Check Visit", "Morning Visit"], isMedication: false, status: "Active" },
  { id: "t6", title: "Ensure I have my hearing Aids on", description: "please assist me to put my hearing Aids on in the Morning and ensure it is working.", startDate: "2025-07-04", isOngoing: true, visits: ["Medication Stock Check Visit", "Morning Visit"], isMedication: false, status: "Active" },
  { id: "t7", title: "Enter Via keysafe", description: "Keysafe – 1953", startDate: "2025-06-25", isOngoing: true, visits: ["Bed Time Visit", "Medication Stock Check Visit", "Morning Visit"], isMedication: false, status: "Active" },
  { id: "t8", title: "General Information", description: "I live with my wife and I have underlined condition which I require the help of carers my wife helps…", startDate: "2025-06-24", isOngoing: true, visits: ["Bed Time Visit", "Medication Stock Check Visit", "Morning Visit"], isMedication: false, status: "Active" },
  { id: "t9", title: "Greet & Gain consent", description: "Staff to ask how I am feeling and report any concerns or deterioration.", startDate: "2025-06-25", isOngoing: true, visits: ["Bed Time Visit", "Medication Stock Check Visit", "Morning Visit"], isMedication: false, status: "Active" },
  { id: "t10", title: "Medication Stock Check", description: "Staff to monitor and report concerns.", startDate: "2025-06-30", isOngoing: true, visits: ["Medication Stock Check Visit"], isMedication: true, status: "Active" },
  { id: "t11", title: "Offer Breakfast meal & Drink", description: "My wife will prepare my breakfast and drink, Staff to ensure I have a meal and drink of my choice.", startDate: "2025-06-30", isOngoing: true, visits: ["Medication Stock Check Visit", "Morning Visit"], isMedication: false, status: "Active" },
  { id: "t12", title: "Oral Hygiene", description: "Staff to ensure I am encouraged with my oral hygiene.", startDate: "2025-06-30", isOngoing: true, visits: ["Bed Time Visit", "Medication Stock Check Visit", "Morning Visit"], isMedication: false, status: "Active" },
  { id: "t13", title: "Personal Care", description: "Staff to support with personal care.", startDate: "2025-06-30", isOngoing: true, visits: ["Bed Time Visit", "Medication Stock Check Visit", "Morning Visit"], isMedication: false, status: "Active" },
  { id: "t14", title: "PPE", description: "Staff to ensure they are wearing required PPE – Gloves, Aprons, Masks.", startDate: "2025-06-25", isOngoing: true, visits: ["Bed Time Visit", "Medication Stock Check Visit", "Morning Visit"], isMedication: false, status: "Active" },
  { id: "t15", title: "Remove Night Bag and disposed appropriately", description: "staff member to assist me to remove my night bag in the morning and dispose.", startDate: "2025-07-04", isOngoing: true, visits: ["Medication Stock Check Visit", "Morning Visit"], isMedication: false, status: "Active" },
  { id: "t16", title: "Skin Integrity", description: "Staff to monitor my skin during personal care and report any redness or breakdown.", startDate: "2025-07-01", isOngoing: true, visits: ["Bed Time Visit", "Morning Visit"], isMedication: false, status: "Active" },
  { id: "t17", title: "Safe Exit", description: "Ensure all doors are locked and the keysafe is reset before leaving.", startDate: "2025-06-25", isOngoing: true, visits: ["Bed Time Visit", "Medication Stock Check Visit", "Morning Visit"], isMedication: false, status: "Active" },
  { id: "t18", title: "Snack & Drink", description: "Offer a small snack and drink at the bed time visit.", startDate: "2025-07-08", isOngoing: false, visits: ["Bed Time Visit"], isMedication: false, status: "Inactive" },
];

const SEED_VISITS: Visit[] = [
  { id: "v1", type: "Bed Time Visit", startDate: "2025-06-30", isOngoing: true, visitKind: "Care visit", dayOfWeek: "Daily", startTime: "18:45", duration: 30, caregivers: 1, status: "Active" },
  { id: "v2", type: "Medication Stock Check Visit", startDate: "2025-06-30", isOngoing: true, visitKind: "Care visit", dayOfWeek: "Mon", startTime: "08:45", duration: 30, caregivers: 1, status: "Active" },
  { id: "v3", type: "Morning Visit", startDate: "2025-06-30", isOngoing: true, visitKind: "Care visit", dayOfWeek: "Tue Wed Thu Fri Sat Sun", startTime: "08:45", duration: 30, caregivers: 1, status: "Active" },
];

const SEED_GROUPS: CareGroup[] = [
  { id: "g1", name: "Mobility & Falls Prevention", members: 3, color: "bg-emerald-500", status: "Active" },
  { id: "g2", name: "Diabetes Care", members: 2, color: "bg-amber-500", status: "Active" },
  { id: "g3", name: "Nutrition Support", members: 4, color: "bg-sky-500", status: "Active" },
  { id: "g4", name: "Smoking Cessation", members: 0, color: "bg-slate-400", status: "Inactive" },
];

const SEED_HISTORY: HistoryEntry[] = [
  { version: 30, modifiedAt: "2026-03-27", modifiedBy: "Sana Arshad", summary: "Updated outcome progress for mobility goal" },
  { version: 29, modifiedAt: "2026-03-12", modifiedBy: "Sana Arshad", summary: "Added Tea Visit to schedule" },
  { version: 28, modifiedAt: "2026-02-22", modifiedBy: "David Goliby", summary: "Marked smoking cessation as inactive" },
  { version: 27, modifiedAt: "2026-02-05", modifiedBy: "Karren Lupton", summary: "Created Diabetes Care group" },
  { version: 26, modifiedAt: "2026-01-18", modifiedBy: "Sana Arshad", summary: "Initial care plan setup" },
];

interface Props {
  careReceiverId: string;
  careReceiverName: string;
}

export function CareManagementTab({ careReceiverName }: Props) {
  const [sub, setSub] = useState<SubTab>("outcomes");
  const [hideInactive, setHideInactive] = useState(true);

  const [outcomes, setOutcomes] = useState<Outcome[]>(SEED_OUTCOMES);
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);
  const [visits, setVisits] = useState<Visit[]>(SEED_VISITS);
  const [groups, setGroups] = useState<CareGroup[]>(SEED_GROUPS);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  // Outcome dialog
  const [outcomeDlg, setOutcomeDlg] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<Outcome | null>(null);
  const blankOutcome: Outcome = { id: "", title: "", description: "", category: "Physical Health", priority: "Medium", status: "Active", targetDate: "", progress: 0 };
  const [outcomeDraft, setOutcomeDraft] = useState<Outcome>(blankOutcome);

  // Task dialog
  const [taskDlg, setTaskDlg] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const blankTask: Task = { id: "", title: "", description: "", startDate: new Date().toISOString().split("T")[0], isOngoing: true, visits: [], isMedication: false, status: "Active", outcome: "" };
  const [taskDraft, setTaskDraft] = useState<Task>(blankTask);

  // Visit dialog
  const [visitDlg, setVisitDlg] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const blankVisit: Visit = { id: "", type: "", dayOfWeek: "Mon-Sun", startTime: "08:00", duration: 30, caregivers: 1, status: "Active" };
  const [visitDraft, setVisitDraft] = useState<Visit>(blankVisit);

  // Group dialog
  const [groupDlg, setGroupDlg] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CareGroup | null>(null);
  const blankGroup: CareGroup = { id: "", name: "", members: 0, color: "bg-emerald-500", status: "Active" };
  const [groupDraft, setGroupDraft] = useState<CareGroup>(blankGroup);

  // Delete confirm
  const [deleting, setDeleting] = useState<{ kind: SubTab; id: string } | null>(null);

  // ------- Filters
  const visibleOutcomes = useMemo(() => hideInactive ? outcomes.filter((o) => o.status !== "Inactive") : outcomes, [outcomes, hideInactive]);
  const visibleTasks = useMemo(() => hideInactive ? tasks.filter((t) => t.status !== "Inactive") : tasks, [tasks, hideInactive]);
  const visibleVisits = useMemo(() => hideInactive ? visits.filter((v) => v.status !== "Inactive") : visits, [visits, hideInactive]);
  const visibleGroups = useMemo(() => hideInactive ? groups.filter((g) => g.status !== "Inactive") : groups, [groups, hideInactive]);

  const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  // ------- Outcomes
  const openAddOutcome = () => { setEditingOutcome(null); setOutcomeDraft(blankOutcome); setOutcomeDlg(true); };
  const openEditOutcome = (o: Outcome) => { setEditingOutcome(o); setOutcomeDraft(o); setOutcomeDlg(true); };
  const saveOutcome = () => {
    if (!outcomeDraft.title.trim()) return toast.error("Title is required");
    if (editingOutcome) {
      setOutcomes((prev) => prev.map((o) => (o.id === editingOutcome.id ? { ...outcomeDraft, id: editingOutcome.id } : o)));
      toast.success("Outcome updated");
    } else {
      setOutcomes((prev) => [{ ...outcomeDraft, id: uid() }, ...prev]);
      toast.success("Outcome added");
    }
    setOutcomeDlg(false);
  };

  // ------- Tasks
  const openAddTask = () => { setEditingTask(null); setTaskDraft(blankTask); setTaskDlg(true); };
  const openEditTask = (t: Task) => { setEditingTask(t); setTaskDraft(t); setTaskDlg(true); };
  const saveTask = () => {
    if (!taskDraft.title.trim()) return toast.error("Title is required");
    if (editingTask) {
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...taskDraft, id: editingTask.id } : t)));
      toast.success("Task updated");
    } else {
      setTasks((prev) => [{ ...taskDraft, id: uid() }, ...prev]);
      toast.success("Task added");
    }
    setTaskDlg(false);
  };

  // ------- Visits
  const openAddVisit = () => { setEditingVisit(null); setVisitDraft(blankVisit); setVisitDlg(true); };
  const openEditVisit = (v: Visit) => { setEditingVisit(v); setVisitDraft(v); setVisitDlg(true); };
  const saveVisit = () => {
    if (!visitDraft.type.trim()) return toast.error("Visit type is required");
    if (editingVisit) {
      setVisits((prev) => prev.map((v) => (v.id === editingVisit.id ? { ...visitDraft, id: editingVisit.id } : v)));
      toast.success("Visit updated");
    } else {
      setVisits((prev) => [{ ...visitDraft, id: uid() }, ...prev]);
      toast.success("Visit added");
    }
    setVisitDlg(false);
  };

  // ------- Groups
  const openAddGroup = () => { setEditingGroup(null); setGroupDraft(blankGroup); setGroupDlg(true); };
  const openEditGroup = (g: CareGroup) => { setEditingGroup(g); setGroupDraft(g); setGroupDlg(true); };
  const saveGroup = () => {
    if (!groupDraft.name.trim()) return toast.error("Name is required");
    if (editingGroup) {
      setGroups((prev) => prev.map((g) => (g.id === editingGroup.id ? { ...groupDraft, id: editingGroup.id } : g)));
      toast.success("Group updated");
    } else {
      setGroups((prev) => [{ ...groupDraft, id: uid() }, ...prev]);
      toast.success("Group added");
    }
    setGroupDlg(false);
  };

  // ------- Delete
  const confirmDelete = () => {
    if (!deleting) return;
    if (deleting.kind === "outcomes") setOutcomes((p) => p.filter((x) => x.id !== deleting.id));
    if (deleting.kind === "tasks") setTasks((p) => p.filter((x) => x.id !== deleting.id));
    if (deleting.kind === "visits") setVisits((p) => p.filter((x) => x.id !== deleting.id));
    if (deleting.kind === "groups") setGroups((p) => p.filter((x) => x.id !== deleting.id));
    toast.success("Deleted");
    setDeleting(null);
  };

  // ------- Top button handlers
  const handleSave = () => toast.success("Care plan saved");
  const handleAddByTab = () => {
    if (sub === "outcomes") openAddOutcome();
    if (sub === "tasks") openAddTask();
    if (sub === "visits") openAddVisit();
    if (sub === "groups") openAddGroup();
  };
  const addLabel = sub === "outcomes" ? "Add outcome" : sub === "tasks" ? "Add task" : sub === "visits" ? "Add visit" : "Add group";

  const priorityClasses = (p: Outcome["priority"]) =>
    p === "High" ? "bg-destructive/15 text-destructive border-destructive/20" :
    p === "Medium" ? "bg-amber-500/15 text-amber-700 border-amber-500/20" :
    "bg-muted text-muted-foreground border-border";

  const statusClasses = (s: string) =>
    s === "Active" ? "bg-success/15 text-success border-success/20" :
    s === "Achieved" ? "bg-primary/15 text-primary border-primary/20" :
    "bg-muted text-muted-foreground border-border";

  return (
    <Card className="border border-border shadow-sm overflow-hidden">
      {/* Top header bar with action buttons - mirrors screenshot */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 bg-muted/30 border-b">
        <Button size="sm" variant="secondary" className="h-8 gap-1.5" onClick={handleSave}>
          <Save className="h-3.5 w-3.5" /> Save
        </Button>
        <Button size="sm" className="h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleAddByTab}>
          <Plus className="h-3.5 w-3.5" /> {addLabel}
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setPrintOpen(true)}>
          <Printer className="h-3.5 w-3.5" /> Print care plan
        </Button>
      </div>

      {/* Sub-tabs (Outcomes / Tasks / Visits / Care Groups) */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2 flex-wrap gap-3">
        <div className="flex items-center gap-1 mx-auto">
          {[
            { id: "outcomes" as const, label: "Outcomes", icon: Star },
            { id: "tasks" as const, label: "Tasks", icon: CheckSquare },
            { id: "visits" as const, label: "Visits", icon: Hand },
            { id: "groups" as const, label: "Care Groups", icon: Users },
          ].map((t) => {
            const Icon = t.icon;
            const active = sub === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSub(t.id)}
                className={`flex flex-col items-center gap-1 px-6 py-2 text-xs font-medium transition-colors border-b-2 ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={hideInactive}
            onCheckedChange={(v) => setHideInactive(!!v)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          Hide inactive
        </label>
      </div>

      <div className="px-6 pb-6 space-y-3">
        {/* OUTCOMES */}
        {sub === "outcomes" && (
          visibleOutcomes.length === 0 ? (
            <div className="border border-border rounded-md bg-background px-4 py-3 text-sm text-muted-foreground">
              This care plan has no outcomes, click the 'Add outcome' button to add to one.
            </div>
          ) : (
            <div className="space-y-2">
              {visibleOutcomes.map((o) => (
                <div key={o.id} className="border border-border rounded-md bg-background p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Star className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold text-sm text-foreground">{o.title}</span>
                        <Badge variant="outline" className={`text-[10px] ${priorityClasses(o.priority)}`}>{o.priority} priority</Badge>
                        <Badge variant="outline" className={`text-[10px] ${statusClasses(o.status)}`}>{o.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 ml-6">{o.description}</p>
                      <div className="flex items-center gap-4 mt-2 ml-6 text-[11px] text-muted-foreground flex-wrap">
                        <span><span className="font-medium text-foreground">Category:</span> {o.category}</span>
                        {o.targetDate && <span><span className="font-medium text-foreground">Target:</span> {format(new Date(o.targetDate), "dd MMM yyyy")}</span>}
                      </div>
                      <div className="ml-6 mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${o.progress}%` }} />
                        </div>
                        <span className="text-[11px] text-muted-foreground w-10 text-right">{o.progress}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditOutcome(o)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleting({ kind: "outcomes", id: o.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* TASKS — alphabetical task strips with description, date and visit pills */}
        {sub === "tasks" && (
          visibleTasks.length === 0 ? (
            <div className="border border-border rounded-md bg-background px-4 py-3 text-sm text-muted-foreground">
              No tasks yet. Click 'Add task' to create the first task.
            </div>
          ) : (
            <div className="space-y-2">
              {[...visibleTasks].sort((a, b) => a.title.localeCompare(b.title)).map((t) => {
                const isMed = t.isMedication;
                // Header strip color: yellow for normal tasks, blue for medication
                const headerCls = isMed
                  ? "bg-sky-100/80 border-sky-200"
                  : "bg-amber-100/70 border-amber-200";
                const headerTitleCls = isMed ? "text-sky-700" : "text-amber-700";
                const HeaderIcon = isMed ? FileText : Check;
                return (
                  <div key={t.id} className="border border-border rounded-md overflow-hidden bg-background group">
                    {/* Title strip */}
                    <div className={`flex items-center justify-between px-3 py-2 border-b ${headerCls}`}>
                      <div className={`flex items-center gap-2 text-sm font-semibold ${headerTitleCls}`}>
                        <HeaderIcon className="h-4 w-4" />
                        <span>{t.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-wide ${
                            t.status === "Active"
                              ? "bg-emerald-500 text-white border-emerald-600"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {t.status}
                        </Badge>
                        <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition" onClick={() => openEditTask(t)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition" onClick={() => setDeleting({ kind: "tasks", id: t.id })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Body row */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3 items-start px-3 py-2.5">
                      <div className="text-xs text-muted-foreground leading-relaxed">{t.description}</div>
                      <div className="text-[11px] space-y-1">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-3 w-3 text-destructive" />
                          <span>{format(new Date(t.startDate), "dd/MM/yyyy")}</span>
                        </div>
                        {t.isOngoing && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-destructive" />
                            <span className="text-muted-foreground">Ongoing</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {t.visits.map((v, i) => {
                          const isMedVisit = v.toLowerCase().includes("medication");
                          return (
                            <button
                              key={i}
                              onClick={() => toast.info(`Linked visit: ${v}`)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 transition"
                            >
                              {isMedVisit ? <FileCheck className="h-3 w-3" /> : <Hand className="h-3 w-3" />}
                              {v}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* VISITS */}
        {sub === "visits" && (
          visibleVisits.length === 0 ? (
            <div className="border border-border rounded-md bg-background px-4 py-3 text-sm text-muted-foreground">
              No visits planned. Click 'Add visit' to schedule a recurring visit.
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {visibleVisits.map((v) => (
                <div key={v.id} className="border border-border rounded-md bg-background p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Hand className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">{v.type}</span>
                        <Badge variant="outline" className={`text-[10px] ${statusClasses(v.status)}`}>{v.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 ml-6 text-xs">
                        <div><span className="text-muted-foreground">Days:</span> <span className="font-medium">{v.dayOfWeek}</span></div>
                        <div><span className="text-muted-foreground">Start:</span> <span className="font-medium">{v.startTime}</span></div>
                        <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{v.duration} min</span></div>
                        <div><span className="text-muted-foreground">Caregivers:</span> <span className="font-medium">{v.caregivers}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditVisit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleting({ kind: "visits", id: v.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* GROUPS */}
        {sub === "groups" && (
          visibleGroups.length === 0 ? (
            <div className="border border-border rounded-md bg-background px-4 py-3 text-sm text-muted-foreground">
              No care groups yet. Click 'Add group' to create one.
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {visibleGroups.map((g) => (
                <div key={g.id} className="border border-border rounded-md bg-background p-4 hover:shadow-sm transition-shadow flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${g.color} flex items-center justify-center text-white shrink-0`}>
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{g.name}</div>
                    <div className="text-[11px] text-muted-foreground">{g.members} member{g.members === 1 ? "" : "s"}</div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${statusClasses(g.status)}`}>{g.status}</Badge>
                  <div className="flex items-center gap-0.5">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditGroup(g)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleting({ kind: "groups", id: g.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer with version + History */}
      <div className="border-t bg-muted/20 px-6 py-4 flex flex-col items-center gap-3">
        <p className="text-xs text-muted-foreground">
          Version {SEED_HISTORY[0].version} was modified{" "}
          {Math.max(0, Math.floor((Date.now() - new Date(SEED_HISTORY[0].modifiedAt).getTime()) / 86400000))}{" "}
          days ago by {SEED_HISTORY[0].modifiedBy}
        </p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setHistoryOpen(true)}>
          <History className="h-3.5 w-3.5" /> History
        </Button>
      </div>

      {/* ============= Outcome Dialog ============= */}
      <Dialog open={outcomeDlg} onOpenChange={setOutcomeDlg}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingOutcome ? "Edit Outcome" : "Add Outcome"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={outcomeDraft.title} onChange={(e) => setOutcomeDraft({ ...outcomeDraft, title: e.target.value })} placeholder="e.g. Maintain mobility" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea rows={3} value={outcomeDraft.description} onChange={(e) => setOutcomeDraft({ ...outcomeDraft, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={outcomeDraft.category} onValueChange={(v) => setOutcomeDraft({ ...outcomeDraft, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Physical Health", "Medical", "Nutrition", "Wellbeing", "Social", "Personal Care"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={outcomeDraft.priority} onValueChange={(v) => setOutcomeDraft({ ...outcomeDraft, priority: v as Outcome["priority"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={outcomeDraft.status} onValueChange={(v) => setOutcomeDraft({ ...outcomeDraft, status: v as Outcome["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Achieved">Achieved</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Target Date</Label>
                <Input type="date" value={outcomeDraft.targetDate} onChange={(e) => setOutcomeDraft({ ...outcomeDraft, targetDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Progress: {outcomeDraft.progress}%</Label>
              <Input type="range" min={0} max={100} value={outcomeDraft.progress} onChange={(e) => setOutcomeDraft({ ...outcomeDraft, progress: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOutcomeDlg(false)}>Cancel</Button>
            <Button onClick={saveOutcome}>{editingOutcome ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============= Task Dialog ============= */}
      <Dialog open={taskDlg} onOpenChange={setTaskDlg}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTask ? "Edit Task" : "Add Task"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={taskDraft.title} onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })} placeholder="e.g. Personal Care" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea rows={3} value={taskDraft.description} onChange={(e) => setTaskDraft({ ...taskDraft, description: e.target.value })} placeholder="What should staff do for this task?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={taskDraft.startDate} onChange={(e) => setTaskDraft({ ...taskDraft, startDate: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={taskDraft.status} onValueChange={(v) => setTaskDraft({ ...taskDraft, status: v as Task["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={taskDraft.isOngoing} onCheckedChange={(v) => setTaskDraft({ ...taskDraft, isOngoing: !!v })} />
                Ongoing
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={taskDraft.isMedication} onCheckedChange={(v) => setTaskDraft({ ...taskDraft, isMedication: !!v })} />
                Medication task
              </label>
            </div>
            <div>
              <Label className="text-xs">Applies To Visits</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5 border border-border rounded-md p-2 bg-muted/20">
                {visits.map((v) => {
                  const checked = taskDraft.visits.includes(v.type);
                  return (
                    <label key={v.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          setTaskDraft({
                            ...taskDraft,
                            visits: c
                              ? [...taskDraft.visits, v.type]
                              : taskDraft.visits.filter((x) => x !== v.type),
                          });
                        }}
                      />
                      {v.type}
                    </label>
                  );
                })}
                {!visits.some((v) => v.type === "Medication Stock Check Visit") && (
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <Checkbox
                      checked={taskDraft.visits.includes("Medication Stock Check Visit")}
                      onCheckedChange={(c) => setTaskDraft({
                        ...taskDraft,
                        visits: c
                          ? [...taskDraft.visits, "Medication Stock Check Visit"]
                          : taskDraft.visits.filter((x) => x !== "Medication Stock Check Visit"),
                      })}
                    />
                    Medication Stock Check Visit
                  </label>
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs">Linked Outcome (optional)</Label>
              <Select value={taskDraft.outcome || "none"} onValueChange={(v) => setTaskDraft({ ...taskDraft, outcome: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select an outcome..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {outcomes.map((o) => <SelectItem key={o.id} value={o.title}>{o.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDlg(false)}>Cancel</Button>
            <Button onClick={saveTask}>{editingTask ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============= Visit Dialog ============= */}
      <Dialog open={visitDlg} onOpenChange={setVisitDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingVisit ? "Edit Visit" : "Add Visit"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Visit Type</Label>
              <Input value={visitDraft.type} onChange={(e) => setVisitDraft({ ...visitDraft, type: e.target.value })} placeholder="e.g. Morning Visit" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Days</Label>
                <Input value={visitDraft.dayOfWeek} onChange={(e) => setVisitDraft({ ...visitDraft, dayOfWeek: e.target.value })} placeholder="Mon-Sun" />
              </div>
              <div><Label className="text-xs">Start Time</Label>
                <Input type="time" value={visitDraft.startTime} onChange={(e) => setVisitDraft({ ...visitDraft, startTime: e.target.value })} />
              </div>
              <div><Label className="text-xs">Duration (min)</Label>
                <Input type="number" min={5} step={5} value={visitDraft.duration} onChange={(e) => setVisitDraft({ ...visitDraft, duration: Number(e.target.value) })} />
              </div>
              <div><Label className="text-xs">Caregivers</Label>
                <Input type="number" min={1} max={4} value={visitDraft.caregivers} onChange={(e) => setVisitDraft({ ...visitDraft, caregivers: Number(e.target.value) })} />
              </div>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={visitDraft.status} onValueChange={(v) => setVisitDraft({ ...visitDraft, status: v as Visit["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitDlg(false)}>Cancel</Button>
            <Button onClick={saveVisit}>{editingVisit ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============= Group Dialog ============= */}
      <Dialog open={groupDlg} onOpenChange={setGroupDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingGroup ? "Edit Care Group" : "Add Care Group"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name</Label>
              <Input value={groupDraft.name} onChange={(e) => setGroupDraft({ ...groupDraft, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Members</Label>
                <Input type="number" min={0} value={groupDraft.members} onChange={(e) => setGroupDraft({ ...groupDraft, members: Number(e.target.value) })} />
              </div>
              <div><Label className="text-xs">Color</Label>
                <Select value={groupDraft.color} onValueChange={(v) => setGroupDraft({ ...groupDraft, color: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bg-emerald-500">Emerald</SelectItem>
                    <SelectItem value="bg-amber-500">Amber</SelectItem>
                    <SelectItem value="bg-sky-500">Sky</SelectItem>
                    <SelectItem value="bg-rose-500">Rose</SelectItem>
                    <SelectItem value="bg-violet-500">Violet</SelectItem>
                    <SelectItem value="bg-slate-400">Slate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={groupDraft.status} onValueChange={(v) => setGroupDraft({ ...groupDraft, status: v as CareGroup["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDlg(false)}>Cancel</Button>
            <Button onClick={saveGroup}>{editingGroup ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============= History Dialog ============= */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Care Plan History</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {SEED_HISTORY.map((h) => (
              <div key={h.version} className="border border-border rounded-md p-3 bg-background">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Version {h.version}</span>
                  <span className="text-[11px] text-muted-foreground">{format(new Date(h.modifiedAt), "dd MMM yyyy")}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{h.summary}</p>
                <p className="text-[11px] text-muted-foreground mt-1">By {h.modifiedBy}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setHistoryOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============= Print Dialog ============= */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Print Care Plan</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p>Generate a printable care plan for <span className="font-semibold">{careReceiverName}</span>.</p>
            <div className="border border-border rounded-md p-3 bg-muted/30 space-y-1.5 text-xs">
              <div className="flex items-center gap-2"><Checkbox defaultChecked /> Include outcomes ({outcomes.length})</div>
              <div className="flex items-center gap-2"><Checkbox defaultChecked /> Include tasks ({tasks.length})</div>
              <div className="flex items-center gap-2"><Checkbox defaultChecked /> Include visits ({visits.length})</div>
              <div className="flex items-center gap-2"><Checkbox defaultChecked /> Include care groups ({groups.length})</div>
              <div className="flex items-center gap-2"><Checkbox /> Include version history</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintOpen(false)}>Cancel</Button>
            <Button onClick={() => { window.print(); setPrintOpen(false); toast.success("Sent to printer"); }}>
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============= Delete Confirm ============= */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
