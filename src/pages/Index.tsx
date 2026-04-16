import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, HeartHandshake, CalendarDays, AlertTriangle, Radio, CheckCircle2, Clock, ListChecks, Pill, Palmtree, UmbrellaOff, AlertOctagon, Eye, ChevronLeft, ChevronRight, XCircle, Timer, Search, Ban, UserX, Moon, ArrowRightFromLine } from "lucide-react";
import { useDashboardStats, useDashboardVisits, useCompletedVisitsToday } from "@/hooks/use-care-data";
import { supabase } from "@/integrations/supabase/client";
import { ShiftDetailDialog } from "@/components/ShiftDetailDialog";
import { Button } from "@/components/ui/button";

type CheckInStatus = "On Time" | "Late" | "Not Arrived";

const statusStyles: Record<CheckInStatus, string> = {
  "On Time": "bg-success/15 text-success border-0 hover:bg-success/20",
  Late: "bg-warning/15 text-warning border-0 hover:bg-warning/20",
  "Not Arrived": "bg-destructive/15 text-destructive border-0 hover:bg-destructive/20",
};

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
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

const Dashboard = () => {
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, Admin. Here's your overview.</p>
        </div>

        {/* Operational Overview */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Operational Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label: "Overdue Tasks", value: 2, icon: ListChecks, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
              { label: "Unverified Meds", value: 56, icon: Pill, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
              { label: "Holiday Requests", value: 1, icon: UmbrellaOff, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" },
              { label: "Team Holidays", value: 9, icon: Palmtree, color: "text-teal-500", bg: "bg-teal-500/10", border: "border-teal-500/30" },
              { label: "Member Holidays", value: 0, icon: CalendarDays, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
              { label: "New Incidents", value: 8, icon: AlertOctagon, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
            ].map((item) => (
              <Card key={item.label} className={`border ${item.border} shadow-sm hover:shadow-md transition-shadow`}>
                <CardContent className="p-5 flex flex-col items-center text-center gap-2.5">
                  <div className={`h-12 w-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <span className={`text-3xl font-bold ${item.color}`}>{item.value}</span>
                  <span className="text-xs text-muted-foreground font-medium leading-tight">{item.label}</span>
                  <Button variant="outline" size="sm" className={`h-7 px-3 text-[11px] font-semibold ${item.color} mt-1 gap-1`}>
                    <Eye className="h-3.5 w-3.5" /> View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No completed shifts yet today</TableCell>
                  </TableRow>
                ) : completedVisits.map((v) => (
                  <TableRow
                    key={v.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedVisit(v)}
                  >
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
                    <TableCell className="text-sm text-foreground">{fmtTime(v.check_in_time)}</TableCell>
                    <TableCell className="text-sm text-foreground">{fmtTime(v.check_out_time)}</TableCell>
                    <TableCell>
                      <Badge className="bg-success/15 text-success border-0 text-xs">
                        {diffMinutes(v.check_in_time, v.check_out_time)}
                      </Badge>
                    </TableCell>
                  </TableRow>
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
              { label: "Add Care Giver", icon: Users },
              { label: "Add Service Member", icon: HeartHandshake },
              { label: "Create Roster", icon: CalendarDays },
              { label: "View Reports", icon: AlertTriangle },
            ].map((action) => (
              <button
                key={action.label}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-accent hover:border-primary/20 transition-colors"
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
