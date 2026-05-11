import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ArrowLeft,
  Plus,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  Trash2,
  Check,
  X,
  Pencil,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CommLog = {
  id: string;
  direction: "outgoing" | "incoming";
  comm_type: "call" | "email";
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  subject: string | null;
  notes: string | null;
  reason_id: string | null;
  reason_label: string | null;
  logged_by: string | null;
  logged_for: string | null;
  assigned_to: string | null;
  occurred_at: string;
  duration_minutes: number | null;
  pin: string | null;
};

type CommReason = {
  id: string;
  name: string;
  color: string;
};

type CommAction = {
  id: string;
  log_id: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
};

type RangePreset = "this_month" | "last_month" | "this_week" | "last_week" | "today" | "yesterday" | "custom";

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "this_week", label: "This week" },
  { key: "last_week", label: "Last week" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "custom", label: "Custom" },
];

function rangeFor(preset: RangePreset, custom?: { from: Date; to: Date }) {
  const now = new Date();
  switch (preset) {
    case "this_month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last_month": {
      const d = subMonths(now, 1);
      return { from: startOfMonth(d), to: endOfMonth(d) };
    }
    case "this_week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case "last_week": {
      const d = subWeeks(now, 1);
      return { from: startOfWeek(d, { weekStartsOn: 1 }), to: endOfWeek(d, { weekStartsOn: 1 }) };
    }
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const d = subDays(now, 1);
      return { from: startOfDay(d), to: endOfDay(d) };
    }
    case "custom":
      return custom ?? { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

export default function CommunicationLog() {
  const nav = useNavigate();
  const qc = useQueryClient();

  // Filters
  const [myCallsOn, setMyCallsOn] = useState(false);
  const [directionFilter, setDirectionFilter] = useState<"outgoing_incoming" | "outgoing" | "incoming">("outgoing_incoming");
  const [preset, setPreset] = useState<RangePreset>("this_month");
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [defaultView, setDefaultView] = useState<RangePreset>("this_month");
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const range = useMemo(() => rangeFor(preset, customRange), [preset, customRange]);

  // Dialogs
  const [logOpen, setLogOpen] = useState(false);
  const [reasonsOpen, setReasonsOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<CommAction | null>(null);

  // Action tab
  const [actionTab, setActionTab] = useState<"active" | "completed">("active");

  // Queries
  const { data: logs = [] } = useQuery({
    queryKey: ["comm_logs", range.from.toISOString(), range.to.toISOString(), directionFilter, myCallsOn],
    queryFn: async () => {
      let q = supabase
        .from("communication_logs" as any)
        .select("*")
        .gte("occurred_at", range.from.toISOString())
        .lte("occurred_at", range.to.toISOString())
        .order("occurred_at", { ascending: false });
      if (directionFilter !== "outgoing_incoming") q = q.eq("direction", directionFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as CommLog[];
    },
  });

  const { data: reasons = [] } = useQuery({
    queryKey: ["comm_reasons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("communication_reasons" as any).select("*").order("name");
      if (error) throw error;
      return data as unknown as CommReason[];
    },
  });

  const { data: actions = [] } = useQuery({
    queryKey: ["comm_actions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("communication_actions" as any).select("*").order("due_date");
      if (error) throw error;
      return data as unknown as CommAction[];
    },
  });

  // Mutations
  const deleteLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("communication_logs" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comm_logs"] });
      toast.success("Log deleted");
    },
  });

  const toggleAction = useMutation({
    mutationFn: async (a: CommAction) => {
      const { error } = await supabase
        .from("communication_actions" as any)
        .update({
          is_completed: !a.is_completed,
          completed_at: !a.is_completed ? new Date().toISOString() : null,
        })
        .eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comm_actions"] }),
  });

  const deleteAction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("communication_actions" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comm_actions"] });
      toast.success("Action deleted");
    },
  });

  const searchLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter((l) =>
      (l.contact_name && l.contact_name.toLowerCase().includes(q)) ||
      (l.contact_phone && l.contact_phone.toLowerCase().includes(q)) ||
      (l.contact_email && l.contact_email.toLowerCase().includes(q)) ||
      (l.subject && l.subject.toLowerCase().includes(q)) ||
      (l.notes && l.notes.toLowerCase().includes(q)) ||
      (l.assigned_to && l.assigned_to.toLowerCase().includes(q))
    );
  }, [logs, searchQuery]);

  const outgoing = searchLogs.filter((l) => l.direction === "outgoing");
  const incoming = searchLogs.filter((l) => l.direction === "incoming");
  const filteredActions = actions.filter((a) => (actionTab === "active" ? !a.is_completed : a.is_completed));

  return (
    <AppLayout>
      <div className="space-y-3">
        {/* Top bar */}
        <div className="flex items-center justify-between bg-muted/40 border border-border rounded-md px-3 py-2">
          <Button size="sm" variant="default" onClick={() => nav(-1)} className="h-8 bg-primary hover:bg-primary/90">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">My Calls:</span>
              <div className="flex items-center gap-1.5 bg-primary/90 rounded px-2 py-1">
                <span className="text-[10px] font-bold text-primary-foreground">{myCallsOn ? "On" : "Off"}</span>
                <Switch checked={myCallsOn} onCheckedChange={setMyCallsOn} className="scale-75" />
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => nav("/communication-log/reasons")} className="h-8 bg-amber-500 hover:bg-amber-600 text-white">
              Custom Reasons
            </Button>
            <Button size="sm" onClick={() => setLogOpen(true)} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
            <Select value={directionFilter} onValueChange={(v: any) => setDirectionFilter(v)}>
              <SelectTrigger className="h-8 w-44 text-xs bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="outgoing_incoming">Outgoing/Incoming</SelectItem>
                <SelectItem value="outgoing">Outgoing only</SelectItem>
                <SelectItem value="incoming">Incoming only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date range card */}
        <Card className="overflow-hidden border-primary/30">
          <div className="flex items-center justify-between px-3 py-2 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarIcon className="h-4 w-4" />
              Date Range
            </div>
            <button onClick={() => setCollapsed((c) => !c)} className="text-primary-foreground hover:opacity-70 px-2 text-lg leading-none">
              {collapsed ? "+" : "−"}
            </button>
          </div>
          {!collapsed && (
            <div className="p-3 space-y-3 bg-background">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPreset(p.key)}
                      className={cn(
                        "h-7 px-3 text-xs rounded border transition-colors",
                        preset === p.key
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 w-56 text-xs"
                />
              </div>
              <div className="text-xs flex items-center gap-2">
                <span className="text-emerald-700 dark:text-emerald-400">▼</span>
                <span className="font-semibold text-foreground">{PRESETS.find((p) => p.key === preset)?.label}:</span>
                <span className="text-emerald-700 dark:text-emerald-400">{format(range.from, "dd MMM yyyy")}</span>
                <span className="text-muted-foreground">–</span>
                <span className="text-rose-600 dark:text-rose-400">{format(range.to, "dd MMM yyyy")}</span>
                {preset === "custom" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline" className="h-6 text-[11px] ml-2">Pick range</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{ from: customRange.from, to: customRange.to }}
                        onSelect={(r) => {
                          if (r?.from && r?.to) setCustomRange({ from: r.from, to: r.to });
                        }}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">Default view:</span>
                <Select value={defaultView} onValueChange={(v: any) => setDefaultView(v)}>
                  <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRESETS.filter((p) => p.key !== "custom").map((p) => (
                      <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setPreset(defaultView); toast.success("Default view saved"); }}>Save</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Two-column logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <LogColumn
            title="Outgoing Calls/Emails"
            color="amber"
            logs={outgoing}
            onDelete={(id) => deleteLog.mutate(id)}
          />
          <LogColumn
            title="Incoming Calls/Emails"
            color="amber"
            logs={incoming}
            onDelete={(id) => deleteLog.mutate(id)}
          />
        </div>

        {/* Actions section */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-1 border-b border-border bg-muted/30 px-2 pt-2">
            <button
              onClick={() => setActionTab("active")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium border-b-2 -mb-px",
                actionTab === "active"
                  ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Active
            </button>
            <button
              onClick={() => setActionTab("completed")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium border-b-2 -mb-px",
                actionTab === "completed"
                  ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Completed
            </button>
            <div className="ml-auto pb-1.5">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditingAction(null); setActionOpen(true); }}>
                <Plus className="h-3 w-3 mr-1" /> Add Action
              </Button>
            </div>
          </div>
          <div className="p-3">
            {filteredActions.length === 0 ? (
              <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">No Results</div>
            ) : (
              <div className="space-y-1.5">
                {filteredActions.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 border border-border rounded px-2 py-1.5 bg-background">
                    <button
                      onClick={() => toggleAction.mutate(a)}
                      className={cn(
                        "h-5 w-5 rounded border flex items-center justify-center",
                        a.is_completed ? "bg-emerald-600 border-emerald-600 text-white" : "border-border"
                      )}
                    >
                      {a.is_completed && <Check className="h-3 w-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-xs font-medium", a.is_completed && "line-through text-muted-foreground")}>{a.title}</div>
                      {(a.assigned_to || a.due_date) && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                          {a.assigned_to && <span>👤 {a.assigned_to}</span>}
                          {a.due_date && <span>📅 {format(new Date(a.due_date), "dd MMM yyyy")}</span>}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingAction(a); setActionOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteAction.mutate(a.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <AddLogDialog open={logOpen} onOpenChange={setLogOpen} reasons={reasons} />
      <ReasonsDialog open={reasonsOpen} onOpenChange={setReasonsOpen} reasons={reasons} />
      <ActionDialog open={actionOpen} onOpenChange={setActionOpen} editing={editingAction} />
    </AppLayout>
  );
}

function LogColumn({
  title,
  logs,
  onDelete,
}: {
  title: string;
  color: string;
  logs: CommLog[];
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden min-h-[280px]">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-400">{title}</h3>
      </div>
      <div className="p-3">
        {logs.length === 0 ? (
          <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">No Results</div>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="border border-border rounded px-2.5 py-2 bg-background">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <div className="mt-0.5">
                      {l.comm_type === "call" ? (
                        <Phone className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Mail className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground truncate">{l.contact_name}</div>
                      {l.assigned_to && <div className="text-[11px] text-primary truncate">Assigned to: {l.assigned_to}</div>}
                      {l.subject && <div className="text-[11px] text-foreground truncate">{l.subject}</div>}
                      {l.notes && <div className="text-[10px] text-muted-foreground line-clamp-2">{l.notes}</div>}
                      <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        <span>{format(new Date(l.occurred_at), "dd MMM yyyy HH:mm")}</span>
                        {l.reason_label && (
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">{l.reason_label}</span>
                        )}
                        {l.logged_by && <span>by {l.logged_by}</span>}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => onDelete(l.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function AddLogDialog({
  open,
  onOpenChange,
  reasons,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reasons: CommReason[];
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [userType, setUserType] = useState<string>("");
  const [logType, setLogType] = useState<"outgoing" | "incoming">("outgoing");
  const [commType, setCommType] = useState<"Phone" | "Email" | "SMS" | "In Person" | "Letter">("Phone");
  const [phoneEmail, setPhoneEmail] = useState("");
  const [waitingOn, setWaitingOn] = useState<string>("Call Back");
  const [assignTo, setAssignTo] = useState("");
  const [commDate, setCommDate] = useState<Date>(new Date());
  const [note, setNote] = useState("");
  const [reasonId, setReasonId] = useState<string>("none");
  const [pin, setPin] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Load assignable users (caregivers) for "Assign To"
  const { data: assignees = [] } = useQuery({
    queryKey: ["caregivers_for_assign"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_givers")
        .select("id, name")
        .eq("status", "Active")
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const reset = () => {
    setTitle(""); setUserType(""); setLogType("outgoing"); setCommType("Phone");
    setPhoneEmail(""); setWaitingOn("Call Back"); setAssignTo(""); setCommDate(new Date());
    setNote(""); setReasonId("none"); setPin(""); setTagsInput("");
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");
      if (!userType) throw new Error("User Type is required");
      if (!logType) throw new Error("Log Type is required");
      if (!commType) throw new Error("Communication Type is required");
      if (!waitingOn) throw new Error("Waiting On is required");
      if (!pin.trim()) throw new Error("PIN is required");

      const reason = reasons.find((r) => r.id === reasonId);
      const isEmail = commType === "Email";
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

      const { error } = await supabase.from("communication_logs" as any).insert({
        title: title.trim(),
        user_type: userType,
        direction: logType,
        comm_type: isEmail ? "email" : "call",
        contact_name: title.trim(),
        contact_phone: !isEmail ? phoneEmail || null : null,
        contact_email: isEmail ? phoneEmail || null : null,
        subject: title.trim(),
        notes: note || null,
        reason_id: reasonId === "none" ? null : reasonId,
        reason_label: reason?.name ?? null,
        waiting_on: waitingOn,
        assigned_to: assignTo || null,
        occurred_at: commDate.toISOString(),
        pin: pin.trim(),
        tags,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comm_logs"] });
      toast.success("Communication log added");
      reset();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const labelCls = "text-xs font-medium text-muted-foreground";
  const requiredStar = <span className="text-destructive ml-0.5">*</span>;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="text-base font-semibold">Add Communication Log</DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Title{requiredStar}</label>
            <Input
              className="h-9 text-sm"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the communication"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>User Type{requiredStar}</label>
              <Select value={userType} onValueChange={setUserType}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Please select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Service Member">Service Member</SelectItem>
                  <SelectItem value="Care Giver">Care Giver</SelectItem>
                  <SelectItem value="Family / NOK">Family / NOK</SelectItem>
                  <SelectItem value="Healthcare Pro">Healthcare Pro</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Log Type{requiredStar}</label>
              <Select value={logType} onValueChange={(v: any) => setLogType(v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outgoing">Outgoing</SelectItem>
                  <SelectItem value="incoming">Incoming</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Communication Type{requiredStar}</label>
              <Select value={commType} onValueChange={(v: any) => setCommType(v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="In Person">In Person</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Phone / Email</label>
              <Input
                className="h-9 text-sm"
                placeholder={commType === "Email" ? "name@example.com" : "Phone number"}
                value={phoneEmail}
                maxLength={255}
                onChange={(e) => setPhoneEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Waiting On{requiredStar}</label>
              <Select value={waitingOn} onValueChange={setWaitingOn}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Call Back">Call Back</SelectItem>
                  <SelectItem value="Email Reply">Email Reply</SelectItem>
                  <SelectItem value="Action">Action</SelectItem>
                  <SelectItem value="Nothing">Nothing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Assign To</label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Please select" /></SelectTrigger>
                <SelectContent>
                  {assignees.length === 0 ? (
                    <SelectItem value="__none" disabled>No active care givers</SelectItem>
                  ) : (
                    assignees.map((u) => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Communication Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 text-sm w-full justify-start font-normal">
                    <CalendarIcon className="h-3.5 w-3.5 mr-2" />{format(commDate, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={commDate} onSelect={(d) => d && setCommDate(d)} className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
<div className="space-y-1.5"> <label className={labelCls}>Reason{requiredStar}</label> <Select value={reasonId} onValueChange={setReasonId}> <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choose one..." /></SelectTrigger> <SelectContent> <SelectItem value="none">Choose one...</SelectItem> {reasons.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)} </SelectContent> </Select> </div>

  <div className="space-y-1.5">
    <label className={labelCls}>PIN{requiredStar}</label>
    <input
      type="password"
      value={pin}
      maxLength={50}
      onChange={(e) => setPin(e.target.value)}
      placeholder="Enter PIN..."
      className="w-full h-9 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
    />
  </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Note</label>
            <Textarea
              className="text-sm min-h-[100px] resize-y"
              value={note}
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add details about this communication..."
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Tags</label>
            <Input
              className="h-9 text-sm"
              placeholder="Comma-separated tags"
              value={tagsInput}
              maxLength={300}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3 border-t bg-muted/30">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => save.mutate()}
            disabled={save.isPending}
          >
            {save.isPending ? "Saving..." : "Save Log"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function ReasonsDialog({
  open,
  onOpenChange,
  reasons,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reasons: CommReason[];
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");

  const add = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name required");
      const { error } = await supabase.from("communication_reasons" as any).insert({ name: name.trim(), color });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_reasons"] }); setName(""); toast.success("Reason added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("communication_reasons" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm_reasons"] }); toast.success("Reason removed"); },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Custom Reasons</DialogTitle></DialogHeader>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs">Reason name</Label>
            <Input className="h-8 text-xs" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 rounded border border-border" />
          </div>
          <Button size="sm" onClick={() => add.mutate()} disabled={add.isPending}>Add</Button>
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {reasons.length === 0 ? (
            <div className="text-xs text-muted-foreground">No custom reasons yet</div>
          ) : (
            reasons.map((r) => (
              <div key={r.id} className="flex items-center gap-2 border border-border rounded px-2 py-1.5">
                <span className="h-4 w-4 rounded" style={{ background: r.color }} />
                <span className="text-xs flex-1">{r.name}</span>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => remove.mutate(r.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
        <DialogFooter><Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActionDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: CommAction | null;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [assignedTo, setAssignedTo] = useState(editing?.assigned_to ?? "");
  const [dueDate, setDueDate] = useState<Date | undefined>(editing?.due_date ? new Date(editing.due_date) : undefined);

  // Reset on editing change
  useMemo(() => {
    setTitle(editing?.title ?? "");
    setDescription(editing?.description ?? "");
    setAssignedTo(editing?.assigned_to ?? "");
    setDueDate(editing?.due_date ? new Date(editing.due_date) : undefined);
  }, [editing]);

  const save = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title required");
      const payload = {
        title: title.trim(),
        description: description || null,
        assigned_to: assignedTo || null,
        due_date: dueDate?.toISOString() ?? null,
      };
      if (editing) {
        const { error } = await supabase.from("communication_actions" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("communication_actions" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comm_actions"] });
      toast.success(editing ? "Action updated" : "Action added");
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Edit Action" : "Add Action"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title *</Label>
            <Input className="h-8 text-xs" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea className="text-xs min-h-[60px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Assigned to</Label>
              <Input className="h-8 text-xs" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Due date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 text-xs w-full justify-start font-normal">
                    <CalendarIcon className="h-3 w-3 mr-1" />{dueDate ? format(dueDate, "dd MMM yyyy") : "Pick"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
