import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

const Roster = () => (
  <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roster</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage schedules and shift assignments</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          + Create Roster
        </button>
      </div>
      <Card className="border border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <CardTitle className="text-lg mb-1">Roster Schedule</CardTitle>
          <p className="text-sm text-muted-foreground">Roster entries will appear here.</p>
        </CardContent>
      </Card>
    </div>
  </AppLayout>
);

export default Roster;
