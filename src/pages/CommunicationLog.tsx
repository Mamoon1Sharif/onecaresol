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
  occurred_at: string;
  duration_minutes: number | null;
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

  const outgoing = logs.filter((l) => l.direction === "outgoing");
  const incoming = logs.filter((l) => l.direction === "incoming");
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
            <Button size="sm" variant="secondary" onClick={() => setReasonsOpen(true)} className="h-8 bg-amber-500 hover:bg-amber-600 text-white">
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
  const [direction, setDirection] = useState<"outgoing" | "incoming">("outgoing");
  const [commType, setCommType] = useState<"call" | "email">("call");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [reasonId, setReasonId] = useState<string>("none");
  const [loggedBy, setLoggedBy] = useState("");
  const [occurredAt, setOccurredAt] = useState<Date>(new Date());
  const [duration, setDuration] = useState("");

  const reset = () => {
    setDirection("outgoing"); setCommType("call"); setContactName(""); setContactPhone("");
    setContactEmail(""); setSubject(""); setNotes(""); setReasonId("none"); setLoggedBy("");
    setOccurredAt(new Date()); setDuration("");
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!contactName.trim()) throw new Error("Contact name required");
      const reason = reasons.find((r) => r.id === reasonId);
      const { error } = await supabase.from("communication_logs" as any).insert({
        direction, comm_type: commType,
        contact_name: contactName.trim(),
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
        subject: subject || null,
        notes: notes || null,
        reason_id: reasonId === "none" ? null : reasonId,
        reason_label: reason?.name ?? null,
        logged_by: loggedBy || null,
        occurred_at: occurredAt.toISOString(),
        duration_minutes: duration ? Number(duration) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comm_logs"] });
      toast.success("Log added");
      reset(); onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Log a Call/Email</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Direction</Label>
            <Select value={direction} onValueChange={(v: any) => setDirection(v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="outgoing">Outgoing</SelectItem>
                <SelectItem value="incoming">Incoming</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={commType} onValueChange={(v: any) => setCommType(v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Contact name *</Label>
            <Input className="h-8 text-xs" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <Input className="h-8 text-xs" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input className="h-8 text-xs" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Subject</Label>
            <Input className="h-8 text-xs" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Notes</Label>
            <Textarea className="text-xs min-h-[70px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Reason</Label>
            <Select value={reasonId} onValueChange={setReasonId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {reasons.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Logged by</Label>
            <Input className="h-8 text-xs" value={loggedBy} onChange={(e) => setLoggedBy(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Occurred at</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 text-xs w-full justify-start font-normal">
                  <CalendarIcon className="h-3 w-3 mr-1" />{format(occurredAt, "dd MMM yyyy HH:mm")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={occurredAt} onSelect={(d) => d && setOccurredAt(d)} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="text-xs">Duration (min)</Label>
            <Input className="h-8 text-xs" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Save Log</Button>
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
