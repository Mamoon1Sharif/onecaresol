import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TheMonitor = () => (
  <AppLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">The Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">Live shift monitoring board.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Monitor</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Coming soon.</CardContent>
      </Card>
    </div>
  </AppLayout>
);

export default TheMonitor;
