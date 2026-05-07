import { useEffect, useState, useMemo } from "react";
import { useShifts, useDailyVisits } from "@/hooks/use-care-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { Tables } from "@/integrations/supabase/types";
import {
  ChevronLeft, ChevronRight, CalendarDays, Clock,
  User, CheckCircle2, XCircle, AlertCircle, Search, Timer,
  ClipboardList, TrendingUp, Hourglass, ArrowRightLeft,
} from "lucide-react";

type CareGiver = Tables<"care_givers">;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const statusConfig: Record<string, { icon: typeof CheckCircle2; bg: string; text: string; label: string }> = {
  Complete:      { icon: CheckCircle2, bg: "bg-success/10", text: "text-success", label: "Complete" },
  Completed:     { icon: CheckCircle2, bg: "bg-success/10", text: "text-success", label: "Complete" },
  "In Progress": { icon: Timer, bg: "bg-warning/10", text: "text-warning", label: "In Progress" },
  Pending:       { icon: Clock, bg: "bg-muted", text: "text-muted-foreground", label: "Pending" },
  Cancelled:     { icon: XCircle, bg: "bg-destructive/10", text: "text-destructive", label: "Cancelled" },
  Due:           { icon: AlertCircle, bg: "bg-info/10", text: "text-info", label: "Due" },
};

const shiftTypeColors: Record<string, string> = {
  Morning: "bg-amber-100 text-amber-800 border-amber-200",
  Afternoon: "bg-sky-100 text-sky-800 border-sky-200",
  Night: "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Live-in": "bg-emerald-100 text-emerald-800 border-emerald-200",
};

function getDateStr(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

function getWeekDates(offset: number) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  return DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function diffDisplay(start: string | null, end: string | null) {
  if (!start || !end) return "—";
  const mins = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const fmtMins = (m: number) => {
  const h = Math.floor(m / 60);
  const mins = Math.round(m % 60);
  return `${String(h).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

// Shifts table: day = 0..6 (Mon..Sun), start_time/end_time as "HH:MM" text
function shiftMinutes(start: string | null, end: string | null) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}
function shiftStartHour(start: string | null) {
  if (!start) return 0;
  return Number(start.split(":")[0] ?? 0);
}
// JS getDay: Sun=0..Sat=6 -> Mon=0..Sun=6
function weekdayIdx(d: Date) {
  return (d.getDay() + 6) % 7;
}


interface Props {
  cg: CareGiver;
  showHeader?: boolean;
}

export function ScheduleView({ cg, showHeader = true }: Props) {
  const { data: allShifts = [] } = useShifts();
  const [dayOffset, setDayOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const [fromDate, setFromDate] = useState(() => getDateStr(0));
  const [toDate, setToDate] = useState(() => getDateStr(0));

  const dateStr = useMemo(() => getDateStr(dayOffset), [dayOffset]);

  useEffect(() => {
    setFromDate(dateStr);
    setToDate(dateStr);
  }, [dateStr]);

  const currentDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const { data: dailyVisitsForDay = [] } = useDailyVisits(dateStr);

  const myShifts = useMemo(() => allShifts.filter((s: any) => s.care_giver_id === cg.id), [allShifts, cg.id]);

  // Daily view: combine recurring shifts (matching weekday) with daily_visits assigned for the date
  const dayIdx = weekdayIdx(currentDate);
  const myVisits = useMemo(() => {
    const recurring = myShifts.filter((s: any) => s.day === dayIdx);
    const dailyMapped = dailyVisitsForDay
      .filter((v: any) => v.care_giver_id === cg.id)
      .map((v: any) => {
        const sh = String(v.start_hour ?? 0).padStart(2, "0");
        const sm = String(v.start_minute ?? 0).padStart(2, "0");
        const endH = String((v.start_hour ?? 0) + (v.duration ?? 0)).padStart(2, "0");
        return {
          id: `dv-${v.id}`,
          care_receivers: v.care_receivers,
          care_giver_id: v.care_giver_id,
          start_time: `${sh}:${sm}`,
          end_time: `${endH}:${sm}`,
          arrived_at: v.check_in_time,
          departed_at: v.check_out_time,
          shift_type: null,
          status: v.status,
        };
      });
    return [...recurring, ...dailyMapped];
  }, [myShifts, dayIdx, dailyVisitsForDay, cg.id]);

  const filteredVisits = useMemo(() => {
    if (!search) return myVisits;
    const q = search.toLowerCase();
    return myVisits.filter((v: any) =>
      (v.care_receivers as any)?.name?.toLowerCase().includes(q) ||
      (v.shift_type ?? "").toLowerCase().includes(q)
    );
  }, [myVisits, search]);

  const scheduledMinutes = myVisits.reduce(
    (sum: number, v: any) => sum + shiftMinutes(v.start_time, v.end_time),
    0
  );
  const clockedMinutes = myVisits.reduce((sum: number, v: any) => {
    if (v.arrived_at && v.departed_at) {
      return sum + (new Date(v.departed_at).getTime() - new Date(v.arrived_at).getTime()) / 60000;
    }
    return sum;
  }, 0);

  const completedCount = myVisits.filter((v: any) => v.arrived_at && v.departed_at).length;
  const inProgressCount = myVisits.filter((v: any) => v.arrived_at && !v.departed_at).length;
  const dueCount = myVisits.filter((v: any) => !v.arrived_at).length;

  const handleDateUpdate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(fromDate);
    const diff = Math.round((from.getTime() - today.getTime()) / 86400000);
    setDayOffset(diff);
  };

  return (
    <div className="space-y-5">
      {/* View toggle */}
      <div className="flex items-center justify-end gap-2">
        <Button variant={view === "daily" ? "default" : "outline"} size="sm" onClick={() => setView("daily")}>
          <ClipboardList className="h-4 w-4 mr-1.5" /> Daily View
        </Button>
        <Button variant={view === "weekly" ? "default" : "outline"} size="sm" onClick={() => setView("weekly")}>
          <CalendarDays className="h-4 w-4 mr-1.5" /> Weekly View
        </Button>
      </div>

      {showHeader && (
        <Card className="border border-border">
          <CardContent className="py-4 px-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Care Giver</p>
                  <h2 className="text-xl font-bold text-foreground">{cg.name}</h2>
                  <p className="text-sm text-muted-foreground">{cg.role_title ?? "Homecare Assistant"}</p>
                </div>
              </div>
              <Badge
                className={`text-sm px-3 py-1 ${cg.status === "Active" ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground"}`}
                variant="outline"
              >
                {cg.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {view === "daily" ? (
        <>
          <Card className="border border-border">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDayOffset((o) => o - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-semibold text-primary">
                    {currentDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDayOffset((o) => o + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  {dayOffset !== 0 && (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDayOffset(0)}>Back to Today</Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 text-xs w-[160px] pr-2" />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 text-xs w-[160px] pr-2" />
                  <Button size="sm" className="h-8 gap-1.5" onClick={handleDateUpdate}>
                    <CalendarDays className="h-3.5 w-3.5" /> Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card className="border border-border">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{myVisits.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-lg font-bold text-success leading-none">{completedCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Complete</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Timer className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-lg font-bold text-warning leading-none">{inProgressCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">In Progress</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-info" />
                </div>
                <div>
                  <p className="text-lg font-bold text-info leading-none">{dueCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Due</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Hourglass className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{fmtMins(scheduledMinutes)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Sched Hrs</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{fmtMins(clockedMinutes)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Clock Hrs</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by service member or status..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Badge variant="outline" className="text-xs px-2.5 py-1">
              {filteredVisits.length} visit{filteredVisits.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          <Card className="border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Service Member</TableHead>
                    <TableHead className="font-semibold text-center">Scheduled Start</TableHead>
                    <TableHead className="font-semibold text-center">Scheduled End</TableHead>
                    <TableHead className="font-semibold text-center">Duration</TableHead>
                    <TableHead className="font-semibold text-center">Check In</TableHead>
                    <TableHead className="font-semibold text-center">Check Out</TableHead>
                    <TableHead className="font-semibold text-center">Actual Duration</TableHead>
                    <TableHead className="font-semibold">Shift Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-16">
                        <div className="flex flex-col items-center gap-2">
                          <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
                          <p>No visits scheduled for this day</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredVisits.map((v: any) => {
                    const status = v.arrived_at && v.departed_at
                      ? "Completed"
                      : v.arrived_at
                        ? "In Progress"
                        : "Pending";
                    const st = statusConfig[status] ?? statusConfig.Pending;
                    const StIcon = st.icon;
                    const sh = shiftStartHour(v.start_time);
                    const mins = shiftMinutes(v.start_time, v.end_time);
                    return (
                      <TableRow key={v.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                            <StIcon className="h-3.5 w-3.5" />
                            {st.label}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 font-medium">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{(v.care_receivers as any)?.name ?? "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">{v.start_time ?? "—"}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{v.end_time ?? "—"}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{fmtMins(mins)}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{fmtTime(v.arrived_at)}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{fmtTime(v.departed_at)}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{diffDisplay(v.arrived_at, v.departed_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {v.shift_type ?? (sh < 12 ? "Morning" : sh < 17 ? "Afternoon" : "Night")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <Separator />
            <div className="flex items-center gap-6 px-4 py-3 bg-muted/20 text-sm">
              <div className="flex items-center gap-2">
                <Hourglass className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sched Hrs:</span>
                <span className="font-semibold font-mono">{fmtMins(scheduledMinutes)}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Clock Hrs:</span>
                <span className="font-semibold font-mono">{fmtMins(clockedMinutes)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Variance:</span>
                <span className={`font-semibold font-mono ${clockedMinutes > scheduledMinutes ? "text-warning" : "text-success"}`}>
                  {clockedMinutes >= scheduledMinutes ? "+" : "-"}{fmtMins(Math.abs(clockedMinutes - scheduledMinutes))}
                </span>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 font-medium text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              {weekDates[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – {weekDates[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </div>
            <div className="flex gap-2">
              {weekOffset !== 0 && (
                <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>This Week</Button>
              )}
              <Button variant="outline" size="icon" onClick={() => setWeekOffset((o) => o + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card className="border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {DAYS.map((day, i) => (
                      <TableHead key={day} className="text-center min-w-[140px] border-r last:border-r-0">
                        <div className="font-semibold">{day}</div>
                        <div className="text-xs text-muted-foreground">
                          {weekDates[i].toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    {DAYS.map((_, di) => {
                      const dayVisits = myShifts.filter((s: any) => s.day === di);
                      return (
                        <TableCell key={di} className="align-top border-r last:border-r-0 p-2 min-h-[120px]">
                          <div className="space-y-2 min-h-[100px]">
                            {dayVisits.length === 0 && (
                              <p className="text-xs text-muted-foreground/50 text-center pt-8">No shifts</p>
                            )}
                            {dayVisits.map((v: any) => {
                              const sh = shiftStartHour(v.start_time);
                              const shiftType = v.shift_type ?? (sh < 12 ? "Morning" : sh < 17 ? "Afternoon" : "Night");
                              return (
                                <div
                                  key={v.id}
                                  className={`rounded-lg border p-2 text-xs ${shiftTypeColors[shiftType] ?? ""}`}
                                >
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-current mb-1">
                                    {shiftType}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-[11px]">
                                    <User className="h-3 w-3" />
                                    {(v.care_receivers as any)?.name ?? "—"}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1 opacity-75">
                                    <Clock className="h-3 w-3" />
                                    {v.start_time}–{v.end_time}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
