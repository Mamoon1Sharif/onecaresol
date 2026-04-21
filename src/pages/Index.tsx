import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, HeartHandshake, CalendarDays, AlertTriangle, Radio, CheckCircle2, Clock, ListChecks, Pill, Palmtree, UmbrellaOff, AlertOctagon, Eye, ChevronLeft, ChevronRight, XCircle, Timer, Search, Ban, UserX, Moon, ArrowRightFromLine, ChevronDown, StickyNote, ClipboardCheck } from "lucide-react";
import { useDashboardStats, useDashboardVisits, useCompletedVisitsToday, useShiftNotes, useShiftTasks } from "@/hooks/use-care-data";
import { supabase } from "@/integrations/supabase/client";
import { ShiftDetailDialog } from "@/components/ShiftDetailDialog";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type CheckInStatus = "On Time" | "Late" | "Not Arrived";

const statusStyles: Record<CheckInStatus, string> = {
  "On Time": "bg-success/15 text-success border-0 hover:bg-success/20",
  Late: "bg-warning/15 text-warning border-0 hover:bg-warning/20",
  "Not Arrived": "bg-destructive/15 text-destructive border-0 hover:bg-destructive/20",
};

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function diffMinutes(start: string | null, end: string | null) {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return "—";
  const totalMin = Math.floor(ms / 60000);
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${hrs}h ${String(mins).padStart(2, "0")}m`;
}

function getLateMins(visit: any): number {
  if (!visit.check_in_time || !visit.start_hour) return 0;
  const checkIn = new Date(visit.check_in_time);
  const scheduledHour = visit.start_hour;
  const actualMinuteOfDay = checkIn.getUTCHours() * 60 + checkIn.getUTCMinutes();
  const scheduledMinuteOfDay = scheduledHour * 60;
  const diff = actualMinuteOfDay - scheduledMinuteOfDay;
  return diff > 5 ? diff : 0;
}

function CompletedVisitRow({ v, onClick }: { v: any; onClick: () => void }) {
  const [showNotes, setShowNotes] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const { data: notes = [] } = useShiftNotes(v.id);
  const { data: tasks = [] } = useShiftTasks(v.id);
  const lateMins = getLateMins(v);
  const completedTasks = tasks.filter((t: any) => t.is_completed).length;

  return (
    <>
      <TableRow className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={onClick}>
        <TableCell className="font-medium text-foreground">
          {(v.care_givers as any)?.name ?? "—"}
        </TableCell>
        <TableCell className="text-sm text-foreground">
          <div className="flex items-center gap-1.5">
            {(v.care_receivers as any)?.name ?? "—"}
            {(v.care_receivers as any)?.dnacpr && (
              <Badge variant="destructive" className="text-[9px] px-1 py-0">DNACPR</Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {String(v.start_hour).padStart(2, "0")}:00 – {String(v.start_hour + v.duration).padStart(2, "0")}:00
          </div>
        </TableCell>
        <TableCell className="text-sm">
          <span className={lateMins > 0 ? "text-destructive font-semibold" : "text-foreground"}>
            {fmtTime(v.check_in_time)}
          </span>
        </TableCell>
        <TableCell className="text-sm text-foreground">{fmtTime(v.check_out_time)}</TableCell>
        <TableCell>
          <Badge className="bg-success/15 text-success border-0 text-xs">
            {diffMinutes(v.check_in_time, v.check_out_time)}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showNotes ? "bg-primary/15 text-primary shadow-sm" : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"}`}
            >
              <StickyNote className="h-4 w-4" />
              {notes.length}
            </button>
            <button
              onClick={() => setShowTasks(!showTasks)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showTasks ? "bg-primary/15 text-primary shadow-sm" : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"}`}
            >
              <ClipboardCheck className="h-4 w-4" />
              {completedTasks}/{tasks.length}
            </button>
          </div>
        </TableCell>
      </TableRow>
      {showNotes && notes.length > 0 && (
        <TableRow className="bg-muted/20">
          <TableCell colSpan={7} className="py-2 px-6">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><StickyNote className="h-3 w-3" /> Notes</p>
              {notes.map((n: any) => (
                <div key={n.id} className="text-sm text-foreground bg-background rounded px-3 py-1.5 border border-border">
                  <span className="font-medium text-primary text-xs">{n.author}:</span> {n.note}
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
      {showTasks && tasks.length > 0 && (
        <TableRow className="bg-muted/20">
          <TableCell colSpan={7} className="py-2 px-6">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><ClipboardCheck className="h-3 w-3" /> Tasks</p>
              {tasks.map((t: any) => (
                <div key={t.id} className="flex items-center gap-2 text-sm bg-background rounded px-3 py-1.5 border border-border">
                  {t.is_completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  )}
                  <span className={t.is_completed ? "text-foreground" : "text-muted-foreground"}>{t.title}</span>
                  {t.completed_by && <span className="text-xs text-muted-foreground ml-auto">by {t.completed_by}</span>}
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: stats } = useDashboardStats();
  const { data: dbVisits, refetch } = useDashboardVisits();
  const { data: completedVisits = [], refetch: refetchCompleted } = useCompletedVisitsToday();
  const [selectedVisit, setSelectedVisit] = useState<any>(null);

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-visits-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "dashboard_visits" }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_visits" }, () => refetchCompleted())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch, refetchCompleted]);

  const visits = dbVisits ?? [];

  const statCards = [
    { title: "Total Care Givers", value: String(stats?.totalCareGivers ?? "—"), icon: Users, iconBg: "bg-primary/10", color: "text-primary", borderAccent: "" },
    { title: "Active Service Members", value: String(stats?.activeCareReceivers ?? "—"), icon: HeartHandshake, iconBg: "bg-success/10", color: "text-success", borderAccent: "" },
    { title: "Visits Today", value: String(stats?.visitsToday ?? "—"), icon: CalendarDays, iconBg: "bg-info/10", color: "text-info", borderAccent: "" },
    { title: "Completed Shifts", value: String(completedVisits.length), icon: CheckCircle2, iconBg: "bg-success/10", color: "text-success", borderAccent: "border-l-4 border-l-success" },
  ];

  const [carouselPage, setCarouselPage] = useState(0);
  const CARDS_PER_PAGE = 4;
  const infographicCards = [
    { label: "COMPLETED CALLS", value: String(completedVisits.length || 0), sub: `${stats?.visitsToday ? ((completedVisits.length / stats.visitsToday) * 100).toFixed(1) : 0}% of ${stats?.visitsToday ?? 0} shifts`, icon: CheckCircle2, bg: "bg-green-500", iconBg: "bg-green-600" },
    { label: "LATE CALLS", value: "2", sub: "1.57% 30 minutes late", icon: Timer, bg: "bg-amber-600", iconBg: "bg-amber-700" },
    { label: "MISSED CALLS", value: "2", sub: "1.57% Not clocked into", icon: XCircle, bg: "bg-red-500", iconBg: "bg-red-600" },
    { label: "CALLS WITH MISSED MEDS", value: "5", sub: "13 Missed Meds", icon: Pill, bg: "bg-sky-500", iconBg: "bg-sky-600" },
    { label: "MEDS NOT ADMINISTERED", value: "2", sub: "3 Meds Not Administered", icon: Pill, bg: "bg-pink-600", iconBg: "bg-pink-700" },
    { label: "OVERDUE TASKS", value: "5", sub: "5 Overdue Tasks", icon: ListChecks, bg: "bg-amber-500", iconBg: "bg-amber-600" },
    { label: "SHORT VISITS", value: "3", sub: "2.36% clocked in less than 75%", icon: Search, bg: "bg-orange-400", iconBg: "bg-orange-500" },
    { label: "CANCELLED CALLS", value: "6", sub: "4.72% Calls Cancelled", icon: Ban, bg: "bg-gray-600", iconBg: "bg-gray-700" },
    { label: "SHADOW SHIFTS", value: "1", sub: "0.79% of 127 shifts", icon: UserX, bg: "bg-blue-600", iconBg: "bg-blue-700" },
    { label: "EARLY CALLS", value: "0", sub: "0.00% of shifts", icon: Clock, bg: "bg-purple-600", iconBg: "bg-purple-700" },
    { label: "CLOCK OUT EARLY", value: "1", sub: "0.79% of shifts", icon: Moon, bg: "bg-purple-500", iconBg: "bg-purple-600" },
    { label: "AUTO CLOCKOUTS", value: "2", sub: "1.57% of shifts", icon: ArrowRightFromLine, bg: "bg-pink-500", iconBg: "bg-pink-600" },
  ];
  const totalPages = Math.ceil(infographicCards.length / CARDS_PER_PAGE);
  const visibleCards = infographicCards.slice(carouselPage * CARDS_PER_PAGE, carouselPage * CARDS_PER_PAGE + CARDS_PER_PAGE);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, Admin. Here's your overview.</p>
        </div>

        {/* Infographic Carousel */}
        <div className="relative">
          <button
            onClick={() => setCarouselPage((p) => (p - 1 + totalPages) % totalPages)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors -ml-2"
          >
            <ChevronLeft className="h-5 w-5 text-green-600" />
          </button>
          <div className="grid grid-cols-4 gap-3 px-6">
            {visibleCards.map((card) => (
              <div
                key={card.label}
                className={`${card.bg} rounded-lg flex overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer`}
              >
                <div className={`${card.iconBg} w-16 flex flex-col items-center justify-center gap-1 py-3`}>
                  <card.icon className="h-7 w-7 text-white/90" />
                  <p className="text-xl font-extrabold text-white leading-none">{card.value}</p>
                </div>
                <div className="flex-1 px-3 py-3 text-white min-w-0 flex flex-col justify-center">
                  <p className="text-xs font-bold tracking-wider uppercase truncate">{card.label}</p>
                  <div className="border-t border-white/30 mt-1.5 pt-1.5">
                    <p className="text-xs font-medium opacity-90 truncate">{card.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setCarouselPage((p) => (p + 1) % totalPages)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors -mr-2"
          >
            <ChevronRight className="h-5 w-5 text-green-600" />
          </button>
          {/* Page dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselPage(i)}
                className={`h-2 rounded-full transition-all ${i === carouselPage ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"}`}
              />
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className={`border border-border shadow-md hover:shadow-lg transition-shadow bg-card ${stat.borderAccent}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completed Shifts */}
        <Card className="border border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <CardTitle className="text-base font-semibold">Completed Shifts Today</CardTitle>
              <Badge variant="secondary" className="ml-1 text-xs">{completedVisits.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-foreground">Care Giver</TableHead>
                  <TableHead className="font-semibold text-foreground">Service Member</TableHead>
                  <TableHead className="font-semibold text-foreground">Scheduled</TableHead>
                  <TableHead className="font-semibold text-foreground">Checked In</TableHead>
                  <TableHead className="font-semibold text-foreground">Clocked Out</TableHead>
                  <TableHead className="font-semibold text-foreground">Total Worked</TableHead>
                  <TableHead className="font-semibold text-foreground">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No completed shifts yet today</TableCell>
                  </TableRow>
                ) : completedVisits.map((v) => (
                  <CompletedVisitRow key={v.id} v={v} onClick={() => setSelectedVisit(v)} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Live Visit Monitor */}
        <Card className="border border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-destructive animate-pulse" />
              <CardTitle className="text-base font-semibold">Live Visit Monitor</CardTitle>
              <span className="text-xs text-muted-foreground ml-auto">Real-time from database</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-foreground">Care Giver</TableHead>
                  <TableHead className="font-semibold text-foreground">Assigned Member</TableHead>
                  <TableHead className="font-semibold text-foreground">Scheduled Time</TableHead>
                  <TableHead className="font-semibold text-foreground">Check-in Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No live visits today</TableCell>
                  </TableRow>
                ) : visits.map((visit) => (
                  <TableRow key={visit.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">{visit.care_giver}</TableCell>
                    <TableCell className="text-sm text-foreground">{visit.assigned_member}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{visit.scheduled_time}</TableCell>
                    <TableCell>
                      <Badge variant="default" className={statusStyles[visit.check_in_status as CheckInStatus] ?? ""}>
                        {visit.check_in_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Add Care Giver", icon: Users, to: "/add-care-giver" },
              { label: "Add Service Member", icon: HeartHandshake, to: "/care-receivers" },
              { label: "Create Roster", icon: CalendarDays, to: "/roster" },
              { label: "View Reports", icon: AlertTriangle, to: "/reports" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.to)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-accent hover:border-primary/20 transition-colors active:scale-[0.98]"
              >
                <action.icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <ShiftDetailDialog
        open={!!selectedVisit}
        onOpenChange={(o) => { if (!o) setSelectedVisit(null); }}
        visit={selectedVisit}
      />
    </AppLayout>
  );
};

export default Dashboard;
