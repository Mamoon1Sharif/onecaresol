import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface Props {
  title: string;
  description: string;
}

export function PlaceholderTab({ title, description }: Props) {
  return (
    <Card className="border border-border">
      <CardContent className="p-12 flex flex-col items-center justify-center text-center">
        <Construction className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      </CardContent>
    </Card>
  );
}
