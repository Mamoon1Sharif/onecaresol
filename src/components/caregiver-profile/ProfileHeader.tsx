import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCareGiverAvatar } from "@/lib/avatars";
import { ArrowLeft, CalendarDays, Phone, Mail } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CareGiver = Tables<"care_givers">;

interface Props {
  cg: CareGiver;
}

export function ProfileHeader({ cg }: Props) {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/caregivers")} className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Care Givers
        </Button>
        <Button variant="outline" onClick={() => navigate(`/caregivers/${cg.id}/schedule`)} className="gap-2">
          <CalendarDays className="h-4 w-4" /> View Schedule
        </Button>
      </div>

      <Card className="border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-8 py-6">
          <div className="flex items-start gap-6">
            <div className="h-24 w-24 rounded-2xl border-2 border-primary/20 overflow-hidden shrink-0">
              <img src={getCareGiverAvatar(cg.id)} alt={cg.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{cg.name}</h1>
                <Badge
                  variant={cg.status === "Active" ? "default" : "secondary"}
                  className={cg.status === "Active" ? "bg-success/15 text-success border-0" : ""}
                >
                  {cg.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{cg.role_title || "Homecare Assistant"}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                {cg.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{cg.phone}</span>}
                {cg.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{cg.email}</span>}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
