import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdvancedRota = () => (
  <AppLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Advanced Rota</h1>
        <p className="text-sm text-muted-foreground mt-1">Power-user view with filtering, conflicts, and bulk edits.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Advanced view</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Coming soon.</CardContent>
      </Card>
    </div>
  </AppLayout>
);

export default AdvancedRota;
