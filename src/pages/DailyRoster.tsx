import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ChevronLeft, ChevronRight, Users, FileText, Bell, PoundSterling,
  Camera, ListChecks, ThumbsUp, Calendar, Briefcase, Move,
  TrendingUp, Clock, AlertCircle, Info, XCircle, MessageSquare,
  Plus, Eye, Plane, LayoutTemplate, ChevronDown, Tag, ArrowRight,
  CalendarDays, CalendarRange, Lock, Link2, Map, UserPlus, User,
} from "lucide-react";
import { useDailyVisits, useCareGivers, useCareReceivers } from "@/hooks/use-care-data";
import { supabase } from "@/integrations/supabase/client";
import { RosterViewSwitcher } from "@/components/RosterViewSwitcher";
import { VisitDetailDialog } from "@/components/VisitDetailDialog";

// Reusable tooltip-wrapped icon for table headers/cells
function IconCell({
  icon: Icon,
  label,
  className = "h-3.5 w-3.5 text-muted-foreground/70",
}: {
  icon: any;
  label: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center justify-center cursor-help">
          <Icon className={className} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

function getDateStr(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function getDateLabelLong(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const day = d.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${d.toLocaleDateString("en-GB", { weekday: "long" })} ${day}${suffix} ${d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
}
function getDateShort(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-GB");
}

function fmtHour(h?: number, mm = 0) {
  if (h === undefined) return "";
  const hr = ((h % 24) + 24) % 24;
  return `${String(hr).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

const statusTone: Record<string, string> = {
  Complete: "text-success font-medium",
  Finished: "text-success font-medium",
  "In Progress": "text-success font-semibold",
  Missed: "text-destructive font-semibold",
  Pending: "text-warning",
  Due: "text-blue-600 font-semibold",
};

const BULK_ACTIONS = [
  "Bulk Actions...",
  "Add To Run Route", "Remove From Run Route",
  "Cancel Visits", "Activate Visits", "Reset Visits", "Delete Visits",
  "Reassign Visits", "Unassign Visits", "Complete Visits",
  "Clock In Scheduled", "Clock Out Scheduled",
  "Add Rota Lock(s)", "Remove Rota Lock(s)",
  "Send Push Message", "Update Pay Status",
  "Edit Times", "Edit Time and Reassign", "Reassign and Complete",
  "Edit Duration", "Update Chargeable Status", "Edit Service Name", "Edit Rota Type",
  "Add Alerts", "Remove Alerts", "Add Shadow Shifts",
  "Convert To Double Up", "Revert Double Up To Single",
  "Nudge Times", "Export",
];

const DailyRoster = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [dayOffset, setDayOffset] = useState(0);
  const dateStr = getDateStr(dayOffset);
  const { data: rawVisits = [], refetch } = useDailyVisits(dateStr);
  const { data: careGivers = [] } = useCareGivers();
  const { data: careReceivers = [] } = useCareReceivers();
  const [showDeleted, setShowDeleted] = useState(false);

  const [teamFilter, setTeamFilter] = useState<string>("");
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [bulkAction, setBulkAction] = useState("Bulk Actions...");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailVisit, setDetailVisit] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNowTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel("daily-visits-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_visits" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const rows = useMemo(() => {
    const now = new Date();
    const mapped = rawVisits.map((v: any, idx: number) => {
      const cr = v.care_receivers ?? {};
      const cg = v.care_givers ?? {};
      const start = v.start_hour ?? 0;
      const dur = v.duration ?? 0;
      const ref = `14${(597 + idx).toString().padStart(4, "0")}${(idx * 7 % 100).toString().padStart(2, "0")}`;
      const week = Math.ceil(((new Date(dateStr).getDate())) / 7);

      const visitStart = new Date(`${v.visit_date}T${String(start).padStart(2, "0")}:00:00`);
      const visitEnd = new Date(visitStart.getTime() + dur * 60 * 60 * 1000);
      const isFuture = visitStart.getTime() > now.getTime();
      const accepted = !!v.care_giver_id;

      let status: string;
      if (v.status === "Cancelled") {
        status = "Cancelled";
      } else if (v.check_out_time || v.status === "Confirmed" || v.status === "Complete" || v.status === "Completed" || v.status === "Finished") {
        status = "Finished";
      } else if (v.check_in_time) {
        status = "In Progress";
      } else if (now.getTime() >= visitStart.getTime() && now.getTime() < visitEnd.getTime()) {
        status = "In Progress";
      } else if (isFuture) {
        status = "Due";
      } else {
        status = "Missed";
      }

      const postcode = (cr.address ?? "").split(" ").slice(-2).join(" ").toUpperCase() || "";
      const serviceCall =
        idx === 0 ? "On Call"
        : cr.care_type === "12h-live-in" ? "Private - Live-in..."
        : cr.care_type === "8h-night" ? "WCC - Night Call"
        : idx % 4 === 0 ? "Private Morning..."
        : "WCC - Morning...";

      return {
        id: v.id,
        ref,
        date: getDateShort(dayOffset),
        status,
        isFuture,
        accepted,
        serviceUser: `${cr.name ?? "Unknown"}${postcode ? "-" + postcode.replace(" ", "") : ""}`,
        serviceUserRaw: cr.name ?? "Unknown",
        scheduledStart: fmtHour(start),
        scheduledEnd: fmtHour(start + dur),
        duration: fmtHour(dur),
        actualStart: v.check_in_time ? new Date(v.check_in_time).toTimeString().slice(0, 5) : fmtHour(start, (idx * 3) % 6),
        actualEnd: v.check_out_time ? new Date(v.check_out_time).toTimeString().slice(0, 5) : fmtHour(start + dur, (idx * 5) % 6),
        actualDuration: v.check_in_time && v.check_out_time
          ? (() => {
              const ms = new Date(v.check_out_time).getTime() - new Date(v.check_in_time).getTime();
              const mins = Math.max(0, Math.round(ms / 60000));
              return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
            })()
          : fmtHour(dur, (idx * 2) % 6),
        teamMember: cg.name ?? "—",
        serviceCall,
        week: `Week ${(week % 4) || 1}`,
        weekNum: 17,
      };
    });

    return mapped.filter((r) => {
      if (teamFilter && r.teamMember !== teamFilter) return false;
      if (serviceFilter && r.serviceUserRaw !== serviceFilter) return false;
      if (search && !r.serviceUser.toLowerCase().includes(search.toLowerCase()) && !r.teamMember.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rawVisits, dayOffset, dateStr, teamFilter, serviceFilter, search, nowTick]);

  const schedHours = rows.reduce((acc, r) => {
    const [h, m] = r.duration.split(":").map(Number);
    return acc + (h || 0) * 60 + (m || 0);
  }, 0);
  const clockHours = rows.reduce((acc, r) => {
    const [h, m] = r.actualDuration.split(":").map(Number);
    return acc + (h || 0) * 60 + (m || 0);
  }, 0);
  const fmtTotal = (mins: number) => `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;

  const dotColors = ["bg-amber-400", "bg-emerald-500", "bg-orange-500", "bg-red-500", "bg-cyan-500", "bg-purple-500", "bg-pink-500"];

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelected(prev => prev.size === rows.length ? new Set() : new Set(rows.map(r => r.id)));
  };

  const refreshVisits = async () => {
    await qc.invalidateQueries({ queryKey: ["daily_visits"] });
    await refetch();
  };

  const runBulk = async () => {
    if (bulkAction === "Bulk Actions...") {
      toast.error("Choose a bulk action first");
      return;
    }
    if (selected.size === 0) {
      toast.error("Select at least one visit");
      return;
    }
    const ids = Array.from(selected);
    try {
      switch (bulkAction) {
        case "Cancel Visits": {
          const { error } = await supabase.from("daily_visits").update({ status: "Cancelled" }).in("id", ids);
          if (error) throw error;
          toast.success(`Cancelled ${ids.length} visit${ids.length > 1 ? "s" : ""}`);
          break;
        }
        case "Activate Visits":
        case "Reset Visits": {
          const { error } = await supabase.from("daily_visits").update({ status: "Pending" }).in("id", ids);
          if (error) throw error;
          toast.success(`Reset ${ids.length} visit${ids.length > 1 ? "s" : ""}`);
          break;
        }
        case "Complete Visits": {
          const { error } = await supabase.from("daily_visits").update({ status: "Confirmed" }).in("id", ids);
          if (error) throw error;
          toast.success(`Completed ${ids.length} visit${ids.length > 1 ? "s" : ""}`);
          break;
        }
        case "Unassign Visits": {
          const { error } = await supabase.from("daily_visits").update({ care_giver_id: null }).in("id", ids);
          if (error) throw error;
          toast.success(`Unassigned ${ids.length} visit${ids.length > 1 ? "s" : ""}`);
          break;
        }
        case "Delete Visits": {
          if (!confirm(`Permanently delete ${ids.length} visit${ids.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
          const { error } = await supabase.from("daily_visits").delete().in("id", ids);
          if (error) throw error;
          toast.success(`Deleted ${ids.length} visit${ids.length > 1 ? "s" : ""}`);
          break;
        }
        case "Export": {
          const header = ["Ref", "Date", "Status", "Service Member", "Sched Start", "Sched End", "Duration", "Care Giver", "Service Call"];
          const lines = [header.join(",")].concat(
            rows.filter(r => selected.has(r.id)).map(r => [r.ref, r.date, r.status, r.serviceUser, r.scheduledStart, r.scheduledEnd, r.duration, r.teamMember, r.serviceCall].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
          );
          const blob = new Blob([lines.join("\n")], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `daily-rota-${dateStr}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(`Exported ${ids.length} visit${ids.length > 1 ? "s" : ""}`);
          break;
        }
        default:
          toast.info(`"${bulkAction}" is not yet available`);
          return;
      }
      setSelected(new Set());
      await refreshVisits();
    } catch (e: any) {
      toast.error(e?.message ?? "Bulk action failed");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-foreground">Daily Rota</h1>
          <RosterViewSwitcher />
        </div>

        {/* Top filter bar */}
        <Card className="p-3 bg-muted/30 border-border">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={teamFilter || "all"} onValueChange={(v) => setTeamFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[240px] h-9 bg-background"><SelectValue placeholder="Select Care Giver..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All care givers</SelectItem>
                  {careGivers.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={serviceFilter || "all"} onValueChange={(v) => setServiceFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[240px] h-9 bg-background"><SelectValue placeholder="Select Service Member..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All service members</SelectItem>
                  {careReceivers.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 gap-1.5">
                  Actions <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem className="gap-2" onClick={() => navigate("/rota/add")}>
                  <Plus className="h-4 w-4 text-primary" /> Add Visit
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={() => { setShowDeleted(v => !v); toast.info(showDeleted ? "Hiding deleted visits" : "Showing deleted visits"); }}>
                  <Eye className="h-4 w-4 text-primary" /> {showDeleted ? "Hide Deleted" : "View Deleted"}
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={() => navigate("/holidays-absence")}>
                  <Plane className="h-4 w-4 text-primary" /> View Holidays
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={() => navigate("/rota/build")}>
                  <LayoutTemplate className="h-4 w-4 text-primary" /> To Templates
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>

        {/* Date navigator */}
        <div className="flex items-center justify-between px-2">
          <div className="flex-1" />
          <h2 className="text-sm font-bold text-success">{getDateLabelLong(dayOffset)}</h2>
          <div className="flex-1 flex justify-end items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDayOffset((d) => d - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xs bg-muted px-3 py-1.5 rounded border border-border min-w-[100px] text-center font-mono">{getDateShort(dayOffset)}</div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDayOffset((d) => d + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bulk actions bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap px-1">
          <div className="flex items-center gap-2">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-[220px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {BULK_ACTIONS.map(a => <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={runBulk} size="sm" className="bg-success hover:bg-success/90 text-success-foreground h-8 px-4 text-xs font-semibold">Go</Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">Search:</span>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-[220px] text-xs" />
          </div>
        </div>

        {/* Spreadsheet table */}
        <TooltipProvider delayDuration={150}>
        <Card className="border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="p-2 border-r border-border w-8">
                    <input type="checkbox" className="rounded" checked={selected.size === rows.length && rows.length > 0} onChange={toggleSelectAll} />
                  </th>
                  <th className="p-2 border-r border-border text-center w-20"><IconCell icon={Info} label="Visit reference ID" /></th>
                  <th className="p-2 border-r border-border text-center w-20"><IconCell icon={Calendar} label="Visit date" /></th>
                  <th className="p-2 border-r border-border text-left w-20">Status</th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={XCircle} label="Cancelled / not accepted by carer" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={ThumbsUp} label="Carer confirmed shift" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Link2} label="Linked / paired visit" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Map} label="Run route assigned" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Users} label="Care team color tag" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={AlertCircle} label="Visit alert / flag" /></th>
                  <th className="p-2 border-r border-border text-left">Service Member</th>
                  <th className="p-2 border-r border-border text-center w-16 bg-emerald-100">
                    <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><Calendar className="h-3.5 w-3.5 text-emerald-700" /></span></TooltipTrigger><TooltipContent className="text-xs">Scheduled start time</TooltipContent></Tooltip>
                  </th>
                  <th className="p-2 border-r border-border text-center w-16 bg-rose-100">
                    <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><Calendar className="h-3.5 w-3.5 text-rose-700" /></span></TooltipTrigger><TooltipContent className="text-xs">Scheduled end time</TooltipContent></Tooltip>
                  </th>
                  <th className="p-2 border-r border-border text-center w-16"><IconCell icon={TrendingUp} label="Scheduled duration" /></th>
                  <th className="p-2 border-r border-border text-center w-16 bg-emerald-100">
                    <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><Clock className="h-3.5 w-3.5 text-emerald-700" /></span></TooltipTrigger><TooltipContent className="text-xs">Actual clock-in time</TooltipContent></Tooltip>
                  </th>
                  <th className="p-2 border-r border-border text-center w-16 bg-rose-100">
                    <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><Clock className="h-3.5 w-3.5 text-rose-700" /></span></TooltipTrigger><TooltipContent className="text-xs">Actual clock-out time</TooltipContent></Tooltip>
                  </th>
                  <th className="p-2 border-r border-border text-center w-16"><IconCell icon={TrendingUp} label="Actual duration worked" /></th>
                  <th className="p-2 border-r border-border text-left">Care Giver</th>
                  <th className="p-2 border-r border-border text-left">Service Call</th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Tag} label="Service tag" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={UserPlus} label="Double-up / shadow" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Briefcase} label="Care pack required" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={FileText} label="Care notes recorded" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Bell} label="Alerts raised" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={PoundSterling} label="Payroll / charge status" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={MessageSquare} label="Visit messages" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Move} label="Reassign / move visit" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={ArrowRight} label="Visit direction" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={User} label="Solo visit" /></th>
                  <th className="p-2 border-r border-border text-left w-20">Week</th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={CalendarRange} label="Recurring weekly pattern" /></th>
                  <th className="p-2 border-r border-border text-center w-12 text-[11px]">Wk</th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={ListChecks} label="Tasks completion" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={CalendarDays} label="Care plan" /></th>
                  <th className="p-2 text-center w-8"><IconCell icon={Lock} label="Rota lock" /></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={35} className="p-8 text-center text-muted-foreground">No shifts scheduled for this day.</td></tr>
                )}
                {rows.map((r, i) => {
                  const isMissed = r.status === "Missed";
                  const rowBg = isMissed ? "bg-purple-100/70" : i % 2 === 1 ? "bg-emerald-50/60" : "bg-emerald-50/30";
                  const dot = dotColors[i % dotColors.length];
                  const isSel = selected.has(r.id);
                  return (
                    <tr key={r.id} className={`${rowBg} border-b border-border hover:bg-muted/40 transition-colors`}>
                      <td className="p-1.5 border-r border-border text-center">
                        <input type="checkbox" className="rounded" checked={isSel} onChange={() => toggleSelect(r.id)} />
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        <button
                          type="button"
                          onClick={() => { setDetailVisit(r); setDetailOpen(true); }}
                          className="text-primary hover:underline cursor-pointer font-mono text-[11px]"
                          title="View visit details"
                        >
                          {r.ref}
                        </button>
                      </td>
                      <td className="p-1.5 border-r border-border font-mono text-[11px] text-center">{r.date}</td>
                      <td className={`p-1.5 border-r border-border text-[11px] ${statusTone[r.status] ?? ""}`}>{r.status}</td>
                      <td className="p-1.5 border-r border-border text-center">
                        {!r.accepted && !isMissed ? (
                          <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><XCircle className="h-3.5 w-3.5 text-destructive" /></span></TooltipTrigger><TooltipContent className="text-xs">Not yet accepted</TooltipContent></Tooltip>
                        ) : null}
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        {r.accepted ? (
                          <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><ThumbsUp className="h-3 w-3 text-success" /></span></TooltipTrigger><TooltipContent className="text-xs">Confirmed by carer</TooltipContent></Tooltip>
                        ) : null}
                      </td>
                      <td className="p-1.5 border-r border-border text-center"></td>
                      <td className="p-1.5 border-r border-border text-center">
                        {i % 3 === 0 && <IconCell icon={Map} label="On run route" className="h-3 w-3 text-primary" />}
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        <Tooltip><TooltipTrigger asChild><span className={`inline-block w-3 h-3 rounded-full cursor-help ${dot}`} /></TooltipTrigger><TooltipContent className="text-xs">Care team tag</TooltipContent></Tooltip>
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        {i % 6 === 1 && (
                          <Tooltip><TooltipTrigger asChild><span className="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-cyan-500 cursor-help" /></TooltipTrigger><TooltipContent className="text-xs">Priority alert</TooltipContent></Tooltip>
                        )}
                      </td>
                      <td className="p-1.5 border-r border-border">
                        <a className="text-primary hover:underline cursor-pointer text-[11px]">{r.serviceUser}</a>
                      </td>
                      <td className="p-1.5 border-r border-border text-center font-mono text-[11px] bg-emerald-50">{r.scheduledStart}</td>
                      <td className="p-1.5 border-r border-border text-center font-mono text-[11px] bg-rose-50">{r.scheduledEnd}</td>
                      <td className="p-1.5 border-r border-border text-center font-mono text-[11px]">{r.duration}</td>
                      <td className="p-1.5 border-r border-border text-center font-mono text-[11px] bg-emerald-50">{r.isFuture ? "" : r.actualStart}</td>
                      <td className="p-1.5 border-r border-border text-center font-mono text-[11px] bg-rose-50">{r.isFuture ? "" : r.actualEnd}</td>
                      <td className="p-1.5 border-r border-border text-center font-mono text-[11px]">{r.isFuture ? "" : r.actualDuration}</td>
                      <td className="p-1.5 border-r border-border">
                        <a className="text-primary hover:underline cursor-pointer text-[11px]">{r.teamMember}</a>
                      </td>
                      <td className="p-1.5 border-r border-border text-[11px] text-foreground/80">{r.serviceCall}</td>
                      <td className="p-1.5 border-r border-border text-center">
                        {i % 2 === 0 && <IconCell icon={Tag} label="Service tag" className="h-3 w-3 text-muted-foreground" />}
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        {i % 4 === 1 && <IconCell icon={UserPlus} label="Double-up shift" className="h-3 w-3 text-primary" />}
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        <IconCell icon={Briefcase} label="Care pack" className="h-3 w-3 text-emerald-600" />
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        {i % 3 === 0 && <IconCell icon={FileText} label="Care notes recorded" className="h-3 w-3 text-emerald-600" />}
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        <IconCell icon={Bell} label="No alerts" className="h-3 w-3 text-muted-foreground/60" />
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        <IconCell icon={PoundSterling} label="Payroll pending" className="h-3 w-3 text-muted-foreground/60" />
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        {i % 5 === 2 && <IconCell icon={MessageSquare} label="Has messages" className="h-3 w-3 text-primary" />}
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        {i % 7 === 0 && <IconCell icon={Move} label="Move visit" className="h-3 w-3 text-muted-foreground" />}
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        <IconCell icon={ArrowRight} label="Continues to next" className="h-3 w-3 text-muted-foreground" />
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        {i % 4 === 0 && <IconCell icon={User} label="Solo visit" className="h-3 w-3 text-muted-foreground" />}
                      </td>
                      <td className="p-1.5 border-r border-border text-[11px]">{r.week}</td>
                      <td className="p-1.5 border-r border-border text-center">
                        <IconCell icon={CalendarRange} label="Weekly pattern" className="h-3 w-3 text-muted-foreground/70" />
                      </td>
                      <td className="p-1.5 border-r border-border text-center font-mono text-[11px]">{r.weekNum}</td>
                      <td className="p-1.5 border-r border-border text-center">
                        <IconCell icon={ListChecks} label="Tasks tracked" className="h-3 w-3 text-success" />
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        <IconCell icon={CalendarDays} label="Care plan" className="h-3 w-3 text-muted-foreground/70" />
                      </td>
                      <td className="p-1.5 text-center">
                        <IconCell icon={Lock} label="Lock visit" className="h-3 w-3 text-muted-foreground/70" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-muted/30 border-t-2 border-border">
                    <td colSpan={35} className="p-2">
                      <div className="flex items-center gap-8">
                        <div>
                          <div className="font-bold text-sm">{fmtTotal(schedHours)}</div>
                          <div className="text-[10px] text-muted-foreground">Sched hrs</div>
                        </div>
                        <div>
                          <div className="font-bold text-sm">{fmtTotal(clockHours)}</div>
                          <div className="text-[10px] text-muted-foreground">Clock hrs</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
        </TooltipProvider>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Showing <strong className="text-foreground">1</strong> to <strong className="text-foreground">{rows.length}</strong> of <strong className="text-foreground">{rows.length}</strong></span>
          {selected.size > 0 && <span className="text-primary font-medium">{selected.size} selected</span>}
        </div>

        {/* Footer banner */}
        <div className="bg-primary text-primary-foreground text-center py-2.5 text-sm font-medium rounded-md">
          You are looking at the live rota for all shifts on one day
        </div>

        <VisitDetailDialog visit={detailVisit} open={detailOpen} onOpenChange={setDetailOpen} />
      </div>
    </AppLayout>
  );
};

export default DailyRoster;
