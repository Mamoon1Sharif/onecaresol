import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useCareGiver } from "@/hooks/use-care-data";
import { useShifts } from "@/hooks/use-care-data";
import { useDailyVisits } from "@/hooks/use-care-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, ChevronLeft, ChevronRight, CalendarDays, Clock,
  User, MapPin, CheckCircle2, XCircle, AlertCircle, Search,
} from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const statusConfig: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
  Complete: { icon: CheckCircle2, className: "text-success", label: "Complete" },
  Completed: { icon: CheckCircle2, className: "text-success", label: "Complete" },
  "In Progress": { icon: AlertCircle, className: "text-warning", label: "In Progress" },
  Pending: { icon: Clock, className: "text-muted-foreground", label: "Pending" },
  Cancelled: { icon: XCircle, className: "text-destructive", label: "Cancelled" },
  Due: { icon: Clock, className: "text-info", label: "Due" },
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

const shiftTypeColors: Record<string, string> = {
  Morning: "bg-amber-100 text-amber-800 border-amber-200",
  Afternoon: "bg-sky-100 text-sky-800 border-sky-200",
  Night: "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Live-in": "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const CareGiverSchedule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: cg, isLoading: cgLoading } = useCareGiver(id);
  const { data: allShifts = [] } = useShifts();
  const [dayOffset, setDayOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"daily" | "weekly">("daily");

  const dateStr = useMemo(() => getDateStr(dayOffset), [dayOffset]);
  const { data: dailyVisits = [] } = useDailyVisits(dateStr);

  const currentDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  // Filter shifts & visits for this caregiver
  const myShifts = useMemo(() => allShifts.filter((s) => s.care_giver_id === id), [allShifts, id]);
  const myVisits = useMemo(() => dailyVisits.filter((v) => v.care_giver_id === id), [dailyVisits, id]);

  const filteredVisits = useMemo(() => {
    if (!search) return myVisits;
    const q = search.toLowerCase();
    return myVisits.filter((v) =>
      (v.care_receivers as any)?.name?.toLowerCase().includes(q) ||
      v.status?.toLowerCase().includes(q)
    );
  }, [myVisits, search]);

  // Compute scheduled and actual hours
  const scheduledMinutes = myVisits.reduce((sum, v) => sum + (v.duration ?? 0) * 60, 0);
  const clockedMinutes = myVisits.reduce((sum, v) => {
    if (v.check_in_time && v.check_out_time) {
      return sum + (new Date(v.check_out_time).getTime() - new Date(v.check_in_time).getTime()) / 60000;
    }
    return sum;
  }, 0);

  const fmtMins = (m: number) => `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;

  if (cgLoading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!cg) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Care giver not found.</p>
          <Button variant="link" onClick={() => navigate("/caregivers")}>Back to list</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/caregivers/${id}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Schedule — {cg.name}</h1>
              <p className="text-sm text-muted-foreground">{cg.role_title ?? "Team Member"} · {cg.status}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={view === "daily" ? "default" : "outline"} size="sm" onClick={() => setView("daily")}>
              Daily
            </Button>
            <Button variant={view === "weekly" ? "default" : "outline"} size="sm" onClick={() => setView("weekly")}>
              Weekly
            </Button>
          </div>
        </div>

        {view === "daily" ? (
          <>
            {/* Date navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={() => setDayOffset((o) => o - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 font-medium text-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                {currentDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div className="flex gap-2">
                {dayOffset !== 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setDayOffset(0)}>Today</Button>
                )}
                <Button variant="outline" size="icon" onClick={() => setDayOffset((o) => o + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{myVisits.length}</p>
                  <p className="text-xs text-muted-foreground">Total Visits</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-success">{myVisits.filter((v) => v.status === "Completed" || v.status === "Complete").length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{fmtMins(scheduledMinutes)}</p>
                  <p className="text-xs text-muted-foreground">Scheduled Hrs</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{fmtMins(clockedMinutes)}</p>
                  <p className="text-xs text-muted-foreground">Clocked Hrs</p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search visits..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            {/* Visit table */}
            <Card className="border border-border shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service User</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                          No visits scheduled for this day
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredVisits.map((v) => {
                      const st = statusConfig[v.status] ?? statusConfig.Pending;
                      const StIcon = st.icon;
                      return (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {(v.care_receivers as any)?.name ?? "—"}
                            </div>
                          </TableCell>
                          <TableCell>{String(v.start_hour).padStart(2, "0")}:00</TableCell>
                          <TableCell>{v.duration}h</TableCell>
                          <TableCell className="text-sm">
                            {v.check_in_time ? new Date(v.check_in_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {v.check_out_time ? new Date(v.check_out_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 ${st.className}`}>
                              <StIcon className="h-3 w-3" />
                              {st.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Weekly view */}
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
                      {DAYS.map((_, dayIdx) => {
                        const dayShifts = myShifts.filter((s) => s.day === dayIdx);
                        return (
                          <TableCell key={dayIdx} className="align-top border-r last:border-r-0 p-2 min-h-[120px]">
                            <div className="space-y-2 min-h-[100px]">
                              {dayShifts.length === 0 && (
                                <p className="text-xs text-muted-foreground/50 text-center pt-8">No shifts</p>
                              )}
                              {dayShifts.map((shift) => (
                                <div
                                  key={shift.id}
                                  className={`rounded-lg border p-2 text-xs ${shiftTypeColors[shift.shift_type] ?? ""}`}
                                >
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-current mb-1">
                                    {shift.shift_type}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-[11px]">
                                    <User className="h-3 w-3" />
                                    {(shift.care_receivers as any)?.name ?? "—"}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1 opacity-75">
                                    <Clock className="h-3 w-3" />
                                    {shift.start_time}–{shift.end_time}
                                  </div>
                                </div>
                              ))}
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
    </AppLayout>
  );
};

export default CareGiverSchedule;
