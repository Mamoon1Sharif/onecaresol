import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LiveRunRoutes = () => (
  <AppLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live Run Routes</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time view of caregiver routes for today.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Live routes</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Coming soon.</CardContent>
      </Card>
    </div>
  </AppLayout>
);

export default LiveRunRoutes;
