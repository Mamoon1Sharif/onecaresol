import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { useCareGivers } from "@/hooks/use-care-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Plus, CalendarDays, Filter, Search, ChevronLeft, ChevronRight,
  Calendar as CalIcon, FileText, Send, Pin, PieChart, Settings, Check, X,
} from "lucide-react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  format, addMonths, subMonths, addWeeks, subWeeks, isSameMonth, isSameDay,
  parseISO,
} from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ViewMode = "month" | "week" | "list";

interface HolidayRow {
  id: string;
  care_giver_id: string;
  entry_type: string;
  start_date: string;
  end_date: string | null;
  status: string;
  reason: string | null;
  hours?: number | null;
  notes?: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  holiday: "bg-emerald-500",
  absence: "bg-amber-500",
  late: "bg-rose-500",
  request: "bg-sky-500",
};

const HolidaysAbsence = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialId = params.get("caregiver") || "";
  const qc = useQueryClient();

  const [selectedCgId, setSelectedCgId] = useState<string>(initialId);
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [showHolidays, setShowHolidays] = useState(true);
  const [showAbsence, setShowAbsence] = useState(true);
  const [showLateness, setShowLateness] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reportOpen, setReportOpen] = useState(false);

  const { data: caregivers = [] } = useCareGivers();

  const selectedCg = useMemo(
    () => caregivers.find((c) => c.id === selectedCgId) || caregivers[0],
    [caregivers, selectedCgId],
  );

  const { data: entries = [] } = useQuery({
    queryKey: ["holidays_all", selectedCg?.id],
    enabled: !!selectedCg?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caregiver_holidays")
        .select("*")
        .eq("care_giver_id", selectedCg!.id);
      if (error) throw error;
      return data as HolidayRow[];
    },
  });

  const visibleEntries = useMemo(
    () =>
      entries.filter((e) => {
        if (e.entry_type === "holiday" && !showHolidays) return false;
        if (e.entry_type === "absence" && !showAbsence) return false;
        if (e.entry_type === "late" && !showLateness) return false;
        if (statusFilter !== "all" && e.status !== statusFilter) return false;
        return true;
      }),
    [entries, showHolidays, showAbsence, showLateness, statusFilter],
  );

  const filteredCgs = useMemo(
    () =>
      caregivers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [caregivers, search],
  );

  const pendingRequests = useMemo(
    () => entries.filter((e) => e.status === "pending"),
    [entries],
  );

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 6 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 6 });
    const days: Date[] = [];
    let d = start;
    while (d <= end) { days.push(d); d = addDays(d, 1); }
    return days;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 6 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const entriesOn = (day: Date) =>
    visibleEntries.filter((e) => {
      const s = parseISO(e.start_date);
      const en = e.end_date ? parseISO(e.end_date) : s;
      return day >= new Date(s.getFullYear(), s.getMonth(), s.getDate())
        && day <= new Date(en.getFullYear(), en.getMonth(), en.getDate());
    });

  const navigatePrev = () => {
    if (view === "month") setCursor(subMonths(cursor, 1));
    else if (view === "week") setCursor(subWeeks(cursor, 1));
  };
  const navigateNext = () => {
    if (view === "month") setCursor(addMonths(cursor, 1));
    else if (view === "week") setCursor(addWeeks(cursor, 1));
  };

  const headerLabel =
    view === "month" ? format(cursor, "MMMM yyyy") :
    view === "week" ? `Week of ${format(weekDays[0], "dd MMM yyyy")}` :
    "All Entries";

  const dayLabels = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

  const insertEntry = useMutation({
    mutationFn: async (v: Partial<HolidayRow>) => {
      const { error } = await supabase.from("caregiver_holidays").insert({
        care_giver_id: selectedCg!.id,
        entry_type: v.entry_type || "holiday",
        start_date: v.start_date!,
        end_date: v.end_date || null,
        hours: v.hours ?? 0,
        status: v.status || "approved",
        reason: v.reason || null,
        notes: v.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays_all", selectedCg?.id] });
      qc.invalidateQueries({ queryKey: ["caregiver_holidays_all"] });
      setAddOpen(false);
      toast.success("Entry added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("caregiver_holidays")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays_all", selectedCg?.id] });
      qc.invalidateQueries({ queryKey: ["caregiver_holidays_all"] });
      toast.success("Updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const exportCsv = () => {
    if (visibleEntries.length === 0) {
      toast.info("No entries to export");
      return;
    }
    const headers = ["Type", "Start", "End", "Status", "Reason"];
    const rows = visibleEntries.map((e) => [
      e.entry_type,
      e.start_date,
      e.end_date || "",
      e.status,
      (e.reason || "").replace(/[",\n]/g, " "),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `holidays_${selectedCg?.name || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="space-y-3">
        {/* Top toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b-2 border-purple-300 pb-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-sky-500 hover:bg-sky-500 text-white text-base px-3 py-1.5">
              Holidays & Absence
            </Badge>
            <span className="text-sm text-muted-foreground">- Team Member</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <ToggleSwitch label="Holidays" checked={showHolidays} onChange={setShowHolidays} />
            <ToggleSwitch label="Absence" checked={showAbsence} onChange={setShowAbsence} />
            <ToggleSwitch label="Lateness" checked={showLateness} onChange={setShowLateness} />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 gap-1 h-8"
              onClick={() => setAddOpen(true)}
              disabled={!selectedCg}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
            <Button
              size="sm"
              className="bg-sky-500 hover:bg-sky-600 text-white gap-1 h-8"
              onClick={() => setRequestsOpen(true)}
            >
              <CalendarDays className="h-3.5 w-3.5" /> Requests ({pendingRequests.length})
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white gap-1 h-8">
                  <Filter className="h-3.5 w-3.5" /> Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 space-y-3" align="end">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm" variant="outline" className="w-full h-8 text-xs"
                  onClick={() => {
                    setStatusFilter("all"); setShowHolidays(true);
                    setShowAbsence(true); setShowLateness(true);
                  }}
                >
                  Reset
                </Button>
              </PopoverContent>
            </Popover>

            <Button
              size="icon" variant="outline" title="Export CSV"
              className="h-8 w-8 bg-amber-500 border-amber-500 text-white hover:bg-amber-600"
              onClick={exportCsv}
            >
              <FileText className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon" variant="outline" title="Send Request"
              className="h-8 w-8 bg-sky-400 border-sky-400 text-white hover:bg-sky-500"
              onClick={() => { setAddOpen(true); }}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon" variant="outline" title="Pin to today"
              className="h-8 w-8 bg-slate-500 border-slate-500 text-white hover:bg-slate-600"
              onClick={() => setCursor(new Date())}
            >
              <Pin className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon" variant="outline" title="Holiday Report"
              className="h-8 w-8 bg-rose-500 border-rose-500 text-white hover:bg-rose-600"
              onClick={() => navigate("/reports/holidays")}
            >
              <PieChart className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon" variant="outline" className="h-8 w-8" title="Settings"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3">
          {/* Sidebar */}
          <Card className="p-3 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            <Select
              value={selectedCg?.id || ""}
              onValueChange={(v) => setSelectedCgId(v)}
            >
              <SelectTrigger className="w-full h-9 bg-orange-50">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {caregivers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="border-t pt-2">
              <h3 className="text-sm font-semibold mb-2">Team Member Statistics</h3>
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="pl-7 h-8 text-xs"
                  placeholder="Search User..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <ul className="space-y-1">
                {filteredCgs.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => setSelectedCgId(c.id)}
                    className={cn(
                      "flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-muted/50 border-b",
                      selectedCg?.id === c.id && "bg-primary/10",
                    )}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">
                        {c.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-primary flex-1 truncate">{c.name}</span>
                    <FileText className="h-3 w-3 text-muted-foreground" />
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Calendar / List view */}
          <Card className="p-3">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center bg-muted rounded overflow-hidden">
                <button
                  onClick={() => setView("month")}
                  className={cn(
                    "px-3 py-1 text-xs font-medium",
                    view === "month" ? "bg-slate-700 text-white" : "hover:bg-muted-foreground/10",
                  )}
                >month</button>
                <button
                  onClick={() => setView("week")}
                  className={cn(
                    "px-3 py-1 text-xs font-medium",
                    view === "week" ? "bg-slate-700 text-white" : "hover:bg-muted-foreground/10",
                  )}
                >week</button>
                <button
                  onClick={() => setView("list")}
                  className={cn(
                    "px-3 py-1 text-xs font-medium",
                    view === "list" ? "bg-slate-700 text-white" : "hover:bg-muted-foreground/10",
                  )}
                >list</button>
              </div>

              <h2 className="text-lg font-medium">{headerLabel}</h2>

              <div className="flex items-center gap-1">
                <Button size="sm" variant="secondary" onClick={() => setCursor(new Date())} className="h-7 text-xs">
                  today
                </Button>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={navigatePrev}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="icon" variant="outline" className="h-7 w-7" title="Pick date">
                      <CalIcon className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={cursor}
                      onSelect={(d) => d && setCursor(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={navigateNext}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Month grid */}
            {view === "month" && (
              <div className="border rounded">
                <div className="grid grid-cols-7 bg-muted/30 border-b">
                  {dayLabels.map((d) => (
                    <div key={d} className="text-center text-xs font-medium py-2">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 grid-rows-6">
                  {monthDays.map((day, i) => {
                    const dayEntries = entriesOn(day);
                    const isToday = isSameDay(day, new Date());
                    const inMonth = isSameMonth(day, cursor);
                    return (
                      <div
                        key={i}
                        className={cn(
                          "border-b border-r p-1 min-h-[80px] text-xs relative",
                          !inMonth && "bg-muted/20 text-muted-foreground",
                          isToday && "bg-amber-50",
                        )}
                      >
                        <div className="text-right text-xs">{format(day, "d")}</div>
                        <div className="space-y-0.5 mt-1">
                          {dayEntries.slice(0, 3).map((e) => (
                            <div
                              key={e.id}
                              className={cn(
                                "text-[10px] text-white px-1 rounded truncate",
                                TYPE_COLORS[e.entry_type] || "bg-slate-500",
                              )}
                              title={`${e.entry_type}${e.reason ? ` – ${e.reason}` : ""}`}
                            >
                              {e.entry_type}
                            </div>
                          ))}
                          {dayEntries.length > 3 && (
                            <div className="text-[10px] text-muted-foreground">+{dayEntries.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Week view */}
            {view === "week" && (
              <div className="border rounded">
                <div className="grid grid-cols-7 bg-muted/30 border-b">
                  {weekDays.map((d) => (
                    <div key={d.toISOString()} className="text-center text-xs font-medium py-2">
                      {format(d, "EEE d")}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {weekDays.map((day) => {
                    const dayEntries = entriesOn(day);
                    return (
                      <div key={day.toISOString()} className="border-b border-r p-2 min-h-[300px]">
                        <div className="space-y-1">
                          {dayEntries.map((e) => (
                            <div
                              key={e.id}
                              className={cn(
                                "text-xs text-white px-1.5 py-1 rounded",
                                TYPE_COLORS[e.entry_type] || "bg-slate-500",
                              )}
                            >
                              <div className="font-medium capitalize">{e.entry_type}</div>
                              {e.reason && <div className="text-[10px] opacity-90">{e.reason}</div>}
                            </div>
                          ))}
                          {dayEntries.length === 0 && (
                            <div className="text-xs text-muted-foreground italic">—</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List view */}
            {view === "list" && (
              <div className="border rounded divide-y">
                {visibleEntries.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-10">
                    No entries
                  </div>
                ) : (
                  visibleEntries
                    .slice()
                    .sort((a, b) => b.start_date.localeCompare(a.start_date))
                    .map((e) => (
                      <div key={e.id} className="p-3 flex items-center gap-3 text-sm">
                        <div className={cn("w-2 h-8 rounded", TYPE_COLORS[e.entry_type] || "bg-slate-500")} />
                        <div className="flex-1">
                          <div className="font-medium capitalize">{e.entry_type}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(e.start_date), "dd MMM yyyy")}
                            {e.end_date && ` – ${format(parseISO(e.end_date), "dd MMM yyyy")}`}
                            {e.reason && ` · ${e.reason}`}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            e.status === "approved" ? "border-emerald-500 text-emerald-700" :
                            e.status === "rejected" ? "border-destructive text-destructive" :
                            "border-amber-500 text-amber-700"
                          }
                        >
                          {e.status}
                        </Badge>
                      </div>
                    ))
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Entry for {selectedCg?.name}</DialogTitle>
            <DialogDescription>Record a holiday, absence, lateness, or pending request.</DialogDescription>
          </DialogHeader>
          <AddEntryForm onSubmit={(v) => insertEntry.mutate(v)} submitting={insertEntry.isPending} />
        </DialogContent>
      </Dialog>

      {/* Pending Requests Dialog */}
      <Dialog open={requestsOpen} onOpenChange={setRequestsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pending Requests ({pendingRequests.length})</DialogTitle>
            <DialogDescription>Approve or reject pending entries for {selectedCg?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {pendingRequests.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">No pending requests</div>
            ) : (
              pendingRequests.map((e) => (
                <div key={e.id} className="flex items-center gap-3 border rounded p-2 text-sm">
                  <div className={cn("w-2 h-10 rounded", TYPE_COLORS[e.entry_type] || "bg-slate-500")} />
                  <div className="flex-1">
                    <div className="font-medium capitalize">{e.entry_type}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(e.start_date), "dd MMM yyyy")}
                      {e.end_date && ` – ${format(parseISO(e.end_date), "dd MMM yyyy")}`}
                      {e.reason && ` · ${e.reason}`}
                    </div>
                  </div>
                  <Button
                    size="sm" variant="outline" className="h-7 gap-1 text-emerald-700 border-emerald-500"
                    onClick={() => setStatus.mutate({ id: e.id, status: "approved" })}
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm" variant="outline" className="h-7 gap-1 text-destructive border-destructive"
                    onClick={() => setStatus.mutate({ id: e.id, status: "rejected" })}
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

const AddEntryForm = ({
  onSubmit, submitting,
}: { onSubmit: (v: Partial<HolidayRow>) => void; submitting: boolean }) => {
  const [type, setType] = useState("holiday");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [hours, setHours] = useState("0");
  const [status, setStatus] = useState("approved");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!start) return toast.error("Start date is required");
        onSubmit({
          entry_type: type, start_date: start, end_date: end || null,
          hours: Number(hours) || 0, status, reason: reason || null, notes: notes || null,
        });
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="holiday">Holiday</SelectItem>
              <SelectItem value="absence">Absence</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="request">Pending Request</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">From *</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
        </div>
        <div>
          <Label className="text-xs">To</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Hours</Label>
          <Input type="number" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Reason</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="text-xs">Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const ToggleSwitch = ({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center gap-1.5">
    <Label className="text-xs font-medium">{label} :</Label>
    <Switch checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-emerald-500" />
    <span className="text-xs text-emerald-600 font-medium w-6">{checked ? "On" : "Off"}</span>
  </div>
);

export default HolidaysAbsence;
