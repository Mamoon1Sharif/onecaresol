import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EditableField } from "./EditableField";
import { Building2, Hash, KeyRound } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CareGiver = Tables<"care_givers">;

interface Props {
  cg: CareGiver;
  save: (field: string, value: any) => void;
}

export function LoginDetailsSection({ cg, save }: Props) {
  return (
    <Card className="border border-border">
      <CardContent className="p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Login Details</h3>
        <Separator className="mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
          <EditableField icon={Building2} label="Company Number" value={cg.reference_no} onSave={(v) => save("reference_no", v)} />
          <EditableField icon={Hash} label="Team Member Number" value={cg.payroll_number} onSave={(v) => save("payroll_number", v)} />
          <EditableField icon={KeyRound} label="Login Code" value={cg.login_code} onSave={(v) => save("login_code", v)} />
        </div>
      </CardContent>
    </Card>
  );
}
