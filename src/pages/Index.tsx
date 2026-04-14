import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, HeartHandshake, CalendarDays, AlertTriangle } from "lucide-react";

const stats = [
  { title: "Total Care Givers", value: "124", change: "+12%", icon: Users, iconBg: "bg-primary/10", color: "text-primary", borderAccent: "" },
  { title: "Active Care Receivers", value: "348", change: "+8%", icon: HeartHandshake, iconBg: "bg-success/10", color: "text-success", borderAccent: "" },
  { title: "Visits Today", value: "56", change: "+3%", icon: CalendarDays, iconBg: "bg-info/10", color: "text-info", borderAccent: "" },
  { title: "Active Incidents", value: "7", change: "+2", icon: AlertTriangle, iconBg: "bg-destructive/10", color: "text-destructive", borderAccent: "border-l-4 border-l-destructive" },
];

const recentActivity = [
  { name: "Sarah Johnson", action: "Shift completed for Mary W.", time: "2 min ago" },
  { name: "Dr. Mike Patel", action: "Updated care plan for John D.", time: "15 min ago" },
  { name: "Lisa Chen", action: "New roster assignment created", time: "1 hr ago" },
  { name: "Tom Harris", action: "Care receiver intake completed", time: "2 hrs ago" },
  { name: "Anna Garcia", action: "Time-off request submitted", time: "3 hrs ago" },
];

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, Admin. Here's your overview.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border border-border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    <p className="text-xs text-success mt-1">{stat.change} this month</p>
                  </div>
                  <div className="h-11 w-11 rounded-lg bg-accent flex items-center justify-center">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
                { label: "View Reports", icon: Activity },
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
