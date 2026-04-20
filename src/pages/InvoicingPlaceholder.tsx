import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function InvoicingPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/invoicing")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        <Card className="p-10 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Construction className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="font-medium">{title}</h2>
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        </Card>
      </div>
    </AppLayout>
  );
}
