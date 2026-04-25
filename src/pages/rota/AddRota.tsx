import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

const AddRota = () => (
  <AppLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add Rota</h1>
        <p className="text-sm text-muted-foreground mt-1">Create a new rota entry.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" /> New Rota
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Coming soon — use the Daily Rota or Build Rota tools to schedule shifts in the meantime.
        </CardContent>
      </Card>
    </div>
  </AppLayout>
);

export default AddRota;
