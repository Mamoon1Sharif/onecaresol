import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, HeartHandshake, CalendarDays, AlertTriangle, Radio } from "lucide-react";

const stats = [
  { title: "Total Care Givers", value: "124", icon: Users, iconBg: "bg-primary/10", color: "text-primary", borderAccent: "" },
  { title: "Active Care Receivers", value: "348", icon: HeartHandshake, iconBg: "bg-success/10", color: "text-success", borderAccent: "" },
  { title: "Visits Today", value: "56", icon: CalendarDays, iconBg: "bg-info/10", color: "text-info", borderAccent: "" },
  { title: "Active Incidents", value: "7", icon: AlertTriangle, iconBg: "bg-destructive/10", color: "text-destructive", borderAccent: "border-l-4 border-l-destructive" },
];

type CheckInStatus = "On Time" | "Late" | "Not Arrived";

interface Visit {
  id: number;
  careGiver: string;
  assignedMember: string;
  scheduledTime: string;
  status: CheckInStatus;
}

const initialVisits: Visit[] = [
  { id: 1, careGiver: "Sarah Johnson", assignedMember: "Mary Williams", scheduledTime: "9:00 AM", status: "On Time" },
  { id: 2, careGiver: "Mike Patel", assignedMember: "John Davidson", scheduledTime: "9:30 AM", status: "On Time" },
  { id: 3, careGiver: "Tom Harris", assignedMember: "Robert Turner", scheduledTime: "10:00 AM", status: "Late" },
  { id: 4, careGiver: "Anna Garcia", assignedMember: "Eleanor Brooks", scheduledTime: "10:15 AM", status: "Not Arrived" },
  { id: 5, careGiver: "Emily Davis", assignedMember: "Mary Williams", scheduledTime: "11:00 AM", status: "Not Arrived" },
  { id: 6, careGiver: "Lisa Chen", assignedMember: "Dorothy Clarke", scheduledTime: "11:30 AM", status: "Late" },
  { id: 7, careGiver: "James Wilson", assignedMember: "John Davidson", scheduledTime: "12:00 PM", status: "Not Arrived" },
];

const statusStyles: Record<CheckInStatus, string> = {
  "On Time": "bg-success/15 text-success border-0 hover:bg-success/20",
  Late: "bg-warning/15 text-warning border-0 hover:bg-warning/20",
  "Not Arrived": "bg-destructive/15 text-destructive border-0 hover:bg-destructive/20",
};

const statusOptions: CheckInStatus[] = ["On Time", "Late", "Not Arrived"];

const recentActivity = [
  { name: "Sarah Johnson", action: "Shift completed for Mary W.", time: "2 min ago" },
  { name: "Dr. Mike Patel", action: "Updated care plan for John D.", time: "15 min ago" },
  { name: "Lisa Chen", action: "New roster assignment created", time: "1 hr ago" },
  { name: "Tom Harris", action: "Care receiver intake completed", time: "2 hrs ago" },
  { name: "Anna Garcia", action: "Time-off request submitted", time: "3 hrs ago" },
];

const Dashboard = () => {
  const [visits, setVisits] = useState<Visit[]>(initialVisits);

  // Simulate dynamic updates every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setVisits((prev) =>
        prev.map((v) => {
          if (Math.random() > 0.7) {
            const currentIdx = statusOptions.indexOf(v.status);
            // Only progress forward: Not Arrived -> Late -> On Time
            const newIdx = Math.min(currentIdx + 1, statusOptions.length - 1);
            if (currentIdx < statusOptions.length - 1) {
              return { ...v, status: statusOptions[newIdx] };
            }
          }
          return v;
        })
      );
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, Admin. Here's your overview.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
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

        {/* Live Visit Monitor */}
        <Card className="border border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-destructive animate-pulse" />
              <CardTitle className="text-base font-semibold">Live Visit Monitor</CardTitle>
              <span className="text-xs text-muted-foreground ml-auto">Auto-refreshing</span>
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
                {visits.map((visit) => (
                  <TableRow key={visit.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">{visit.careGiver}</TableCell>
                    <TableCell className="text-sm text-foreground">{visit.assignedMember}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{visit.scheduledTime}</TableCell>
                    <TableCell>
                      <Badge variant="default" className={statusStyles[visit.status]}>
                        {visit.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                  <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-accent-foreground">
                      {item.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.action}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{item.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { label: "Add Care Giver", icon: Users },
                { label: "Add Care Receiver", icon: HeartHandshake },
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
      </div>
    </AppLayout>
  );
};

export default Dashboard;
