import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { EditableField } from "./EditableField";
import { Building2, Hash, KeyRound, Eye, EyeOff } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CareGiver = Tables<"care_givers">;

interface Props {
  cg: CareGiver;
  save: (field: string, value: any) => void;
}

export function LoginDetailsSection({ cg, save }: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className="border border-border">
      <CardContent className="p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Login Details</h3>
        <Separator className="mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
          <EditableField icon={Building2} label="Company Number" value={cg.reference_no} onSave={(v) => save("reference_no", v)} />
          <EditableField icon={Hash} label="Team Member Number" value={cg.payroll_number} onSave={(v) => save("payroll_number", v)} />
          <div className="flex items-start gap-2 py-1.5">
            <KeyRound className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Password</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-foreground font-mono">
                  {showPassword ? (cg.login_code || "—") : "••••••••"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <EditableField icon={KeyRound} label="Edit Password / Login Code" value={cg.login_code} onSave={(v) => save("login_code", v)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
