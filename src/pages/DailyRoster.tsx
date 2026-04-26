import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ChevronLeft, ChevronRight, Users, User, FileText, Bell, PoundSterling,
  Camera, ListChecks, ThumbsUp, Calendar,
  TrendingUp, Clock, AlertCircle, Info, XCircle, MessageSquare,
} from "lucide-react";

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
import { useDailyVisits, useCareGivers, useCareReceivers } from "@/hooks/use-care-data";
import { supabase } from "@/integrations/supabase/client";
import { RosterViewSwitcher } from "@/components/RosterViewSwitcher";
import { VisitDetailDialog } from "@/components/VisitDetailDialog";

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
  // wrap into 0-23 so durations crossing midnight don't render as 25:00, 29:00, etc.
  const hr = ((h % 24) + 24) % 24;
  return `${String(hr).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function statusLabel(s: string) {
  // Live rota — never show "Complete". Map confirmed visits to In Progress.
  if (s === "Confirmed") return "In Progress";
  if (s === "Pending") return "Missed";
  return s;
}

const statusTone: Record<string, string> = {
  Finished: "text-success",
  "In Progress": "text-success font-semibold",
  Missed: "text-destructive font-semibold",
  Pending: "text-warning",
  Due: "text-blue-600 font-semibold",
};

const ROW_BG_ALT = "bg-success/5";
const ROW_BG_TOP = "bg-accent/40";

const COL_ICON_CLASS = "h-3.5 w-3.5 text-muted-foreground/70";

const DailyRoster = () => {
  const [dayOffset, setDayOffset] = useState(0);
  const dateStr = getDateStr(dayOffset);
  const { data: rawVisits = [], refetch } = useDailyVisits(dateStr);
  const { data: careGivers = [] } = useCareGivers();
  const { data: careReceivers = [] } = useCareReceivers();

  const [teamFilter, setTeamFilter] = useState<string>("");
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [detailVisit, setDetailVisit] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

      // Compute visit start datetime
      const visitStart = new Date(`${v.visit_date}T${String(start).padStart(2, "0")}:00:00`);
      const isFuture = visitStart.getTime() > now.getTime();
      const accepted = !!v.care_giver_id;

      // Live-rota status logic — never use "Complete" here.
      let status: string;
      if (v.status === "Confirmed") {
        status = v.check_out_time ? "Finished" : v.check_in_time ? "In Progress" : "Due";
      } else if (isFuture) {
        status = "Due";
      } else if (v.status === "Pending") {
        status = "Missed";
      } else {
        status = v.status;
      }

      const postcode = (cr.address ?? "").split(" ").slice(-2).join(" ").toUpperCase() || "—";
      return {
        id: v.id,
        ref,
        date: getDateShort(dayOffset),
        status,
        isFuture,
        accepted,
        serviceUser: `${cr.name ?? "Unknown"}${postcode !== "—" ? "-" + postcode.replace(" ", "") : ""}`,
        serviceUserRaw: cr.name ?? "Unknown",
        scheduledStart: fmtHour(start),
        scheduledEnd: fmtHour(start + dur),
        duration: fmtHour(dur),
        actualStart: v.check_in_time ? new Date(v.check_in_time).toTimeString().slice(0, 5) : "",
        actualEnd: v.check_out_time ? new Date(v.check_out_time).toTimeString().slice(0, 5) : "",
        actualDuration: v.check_in_time && v.check_out_time
          ? (() => {
              const ms = new Date(v.check_out_time).getTime() - new Date(v.check_in_time).getTime();
              const mins = Math.max(0, Math.round(ms / 60000));
              return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
            })()
          : "",
        teamMember: cg.name ?? "—",
        serviceCall: cr.care_type === "12h-live-in" ? "Private - Live-in" : cr.care_type === "8h-night" ? "WCC - Night" : cr.care_type === "8h-morning" ? "WCC - Mor..." : "Private Mor...",
        week: `Week ${(week % 4) || 1}`,
        weekNum: 17 + (week % 4),
      };
    });

    return mapped.filter((r) => {
      if (teamFilter && r.teamMember !== teamFilter) return false;
      if (serviceFilter && r.serviceUserRaw !== serviceFilter) return false;
      if (search && !r.serviceUser.toLowerCase().includes(search.toLowerCase()) && !r.teamMember.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rawVisits, dayOffset, dateStr, teamFilter, serviceFilter, search]);

  // Totals
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

  return (
    <AppLayout>
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Daily Rota</h1>
          </div>
          <RosterViewSwitcher />
        </div>

        {/* Top filter bar */}
        <Card className="p-3 bg-muted/30 border-border">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={teamFilter || "all"} onValueChange={(v) => setTeamFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[220px] h-9 bg-background"><SelectValue placeholder="Select Team Member..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All team members</SelectItem>
                  {careGivers.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={serviceFilter || "all"} onValueChange={(v) => setServiceFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[220px] h-9 bg-background"><SelectValue placeholder="Select Service User..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All service users</SelectItem>
                  {careReceivers.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9">
              Actions ▾
            </Button>
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
            <Select defaultValue="bulk">
              <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bulk">Bulk Actions...</SelectItem>
                <SelectItem value="confirm">Confirm Selected</SelectItem>
                <SelectItem value="reassign">Reassign Selected</SelectItem>
                <SelectItem value="delete">Delete Selected</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground h-8 px-4 text-xs font-semibold">Go</Button>
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
                  <th className="p-2 border-r border-border w-8"><input type="checkbox" className="rounded" /></th>
                  <th className="p-2 border-r border-border text-center w-20"><IconCell icon={Info} label="Visit reference ID" /></th>
                  <th className="p-2 border-r border-border text-center w-20"><IconCell icon={Calendar} label="Visit date" /></th>
                  <th className="p-2 border-r border-border text-left w-20">Status</th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={XCircle} label="Cancelled / not accepted by carer" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={ThumbsUp} label="Carer confirmed shift" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Users} label="Care team color tag" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={AlertCircle} label="Visit alert / flag" /></th>
                  <th className="p-2 border-r border-border text-left">Service User</th>
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
                  <th className="p-2 border-r border-border text-left">Team Member</th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={FileText} label="Care notes recorded" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={MessageSquare} label="Messages on visit" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Bell} label="Alerts raised" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={PoundSterling} label="Payroll / charge status" /></th>
                  <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Camera} label="Photo evidence captured" /></th>
                  <th className="p-2 border-r border-border text-left w-20">Week</th>
                  <th className="p-2 text-center w-8"><IconCell icon={ListChecks} label="Tasks completion status" /></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={23} className="p-8 text-center text-muted-foreground">No shifts scheduled for this day.</td></tr>
                )}
                {rows.map((r, i) => {
                  const isTopRow = i === 0;
                  const rowBg = isTopRow ? ROW_BG_TOP : i % 2 === 1 ? ROW_BG_ALT : "bg-card";
                  const dot = dotColors[i % dotColors.length];
                  return (
                    <tr key={r.id} className={`${rowBg} border-b border-border hover:bg-muted/40 transition-colors`}>
                      <td className="p-1.5 border-r border-border text-center"><input type="checkbox" className="rounded" /></td>
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
                        {!r.accepted ? (
                          <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><XCircle className="h-3.5 w-3.5 text-destructive" /></span></TooltipTrigger><TooltipContent className="text-xs">Not yet accepted by carer</TooltipContent></Tooltip>
                        ) : null}
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        {r.accepted ? (
                          <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><ThumbsUp className="h-3 w-3 text-success" /></span></TooltipTrigger><TooltipContent className="text-xs">Confirmed by carer</TooltipContent></Tooltip>
                        ) : null}
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        <Tooltip><TooltipTrigger asChild><span className={`inline-block w-3 h-3 rounded-full cursor-help ${dot}`} /></TooltipTrigger><TooltipContent className="text-xs">Care team tag</TooltipContent></Tooltip>
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        {i % 5 === 0 && (
                          <Tooltip><TooltipTrigger asChild><span className="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-fuchsia-500 cursor-help" /></TooltipTrigger><TooltipContent className="text-xs">Priority alert</TooltipContent></Tooltip>
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
                      <td className="p-1.5 border-r border-border text-center">
                        <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><FileText className="h-3 w-3 text-emerald-600" /></span></TooltipTrigger><TooltipContent className="text-xs">Care notes recorded</TooltipContent></Tooltip>
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><MessageSquare className="h-3 w-3 text-muted-foreground" /></span></TooltipTrigger><TooltipContent className="text-xs">No messages</TooltipContent></Tooltip>
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><Bell className="h-3 w-3 text-muted-foreground" /></span></TooltipTrigger><TooltipContent className="text-xs">No alerts raised</TooltipContent></Tooltip>
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><PoundSterling className="h-3 w-3 text-muted-foreground" /></span></TooltipTrigger><TooltipContent className="text-xs">Payroll pending</TooltipContent></Tooltip>
                      </td>
                      <td className="p-1.5 border-r border-border text-center">
                        <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><Camera className="h-3 w-3 text-muted-foreground" /></span></TooltipTrigger><TooltipContent className="text-xs">No photo evidence</TooltipContent></Tooltip>
                      </td>
                      <td className="p-1.5 border-r border-border text-[11px]">{r.week}</td>
                      <td className="p-1.5 text-center">
                        <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><ListChecks className="h-3 w-3 text-success" /></span></TooltipTrigger><TooltipContent className="text-xs">Tasks tracked</TooltipContent></Tooltip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-muted/30 border-t-2 border-border">
                    <td colSpan={11} className="p-2">
                      <div className="flex items-center gap-6">
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
                    <td colSpan={23}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Showing <strong className="text-foreground">1</strong> to <strong className="text-foreground">{rows.length}</strong> of <strong className="text-foreground">{rows.length}</strong></span>
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
