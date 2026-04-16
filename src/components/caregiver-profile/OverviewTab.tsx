import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User, MapPin, Phone, Mail, Shield, Car, Calendar,
  Briefcase, Hash, KeyRound, UserCog, Stethoscope, Heart, Clock,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CareGiver = Tables<"care_givers">;

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm text-foreground break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="pt-6 pb-2">
      <h3 className="text-sm font-bold uppercase tracking-widest text-primary">{title}</h3>
      <Separator className="mt-2" />
    </div>
  );
}

function HoursRow({ hours }: { hours: any }) {
  const h = hours ? (typeof hours === "string" ? JSON.parse(hours) : hours) : {};
  return (
    <div className="grid grid-cols-2 gap-3">
      {["week1", "week2", "week3", "week4"].map((w, i) => (
        <div key={w} className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Week {i + 1}</p>
          <p className="text-lg font-bold text-foreground flex items-center justify-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {h[w] || "00:00"}
          </p>
        </div>
      ))}
    </div>
  );
}

interface Props {
  cg: CareGiver;
}

export function OverviewTab({ cg }: Props) {
  const age = cg.dob ? Math.floor((Date.now() - new Date(cg.dob).getTime()) / 31557600000) : null;

  return (
    <div className="space-y-6">
      <Card className="border border-border">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-1">
            <InfoItem icon={MapPin} label="Address" value={cg.address} />
            <InfoItem icon={Phone} label="Phone" value={cg.phone} />
            <InfoItem icon={Mail} label="Email" value={cg.email} />
          </div>

          <SectionTitle title="Personal Information" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-1">
            <InfoItem icon={Calendar} label="DOB (Age)" value={cg.dob ? `${new Date(cg.dob).toLocaleDateString("en-GB")} (${age})` : null} />
            <InfoItem icon={User} label="Ethnicity" value={cg.ethnicity} />
            <InfoItem icon={Car} label="Is Driver?" value={cg.is_driver ? "Yes" : "No"} />
            <InfoItem icon={Stethoscope} label="Allergies" value={cg.allergies || "None"} />
          </div>

          <SectionTitle title="Work Details" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-1">
            <InfoItem icon={KeyRound} label="Login Code" value={cg.login_code} />
            <InfoItem icon={UserCog} label="Permission" value={cg.permission} />
            <InfoItem icon={Briefcase} label="Role" value={cg.role_title} />
            <InfoItem icon={Hash} label="Sage Num" value={cg.sage_num} />
          </div>

          <SectionTitle title="DBS Information" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-1">
            <InfoItem icon={Shield} label="DBS Ref" value={cg.dbs_ref} />
            <InfoItem icon={Shield} label="DBS Type" value={cg.dbs_type} />
            <div className="flex items-center gap-3 py-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">DBS Update Service</p>
                <Badge variant={cg.dbs_update_service ? "default" : "secondary"} className="text-xs mt-0.5">
                  {cg.dbs_update_service ? "Registered" : "Not Registered"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hours Overview */}
      <Card className="border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-transparent px-6 py-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <Clock className="h-4 w-4" /> Hours Overview
          </h3>
        </div>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Requested Hours</p>
              <HoursRow hours={cg.requested_hours} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Templated Hours</p>
              <HoursRow hours={cg.templated_hours} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next of Kin summary */}
      <Card className="border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-transparent px-6 py-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <Heart className="h-4 w-4" /> Next of Kin
          </h3>
        </div>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-1">
            <InfoItem icon={User} label="Name" value={cg.next_of_kin_name} />
            <InfoItem icon={Heart} label="Relationship" value={cg.next_of_kin_relationship} />
            <InfoItem icon={Phone} label="Phone" value={cg.next_of_kin_phone} />
            <InfoItem icon={Mail} label="Email" value={cg.next_of_kin_email} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
