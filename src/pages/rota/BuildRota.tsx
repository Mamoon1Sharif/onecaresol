import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BuildRota = () => (
  <AppLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Build Rota</h1>
        <p className="text-sm text-muted-foreground mt-1">Drag-and-drop rota builder.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Builder</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Coming soon.</CardContent>
      </Card>
    </div>
  </AppLayout>
);

export default BuildRota;
