import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const PrintableRota = () => (
  <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Printable Rota</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate a printer-friendly rota.</p>
        </div>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Coming soon — full printable layout.</CardContent>
      </Card>
    </div>
  </AppLayout>
);

export default PrintableRota;
