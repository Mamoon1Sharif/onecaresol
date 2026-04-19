import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User, MapPin, Phone, Mail, Shield, Calendar, Heart,
  Stethoscope, Globe, AlertTriangle, Pill, Hash, Clock,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CareReceiver = Tables<"care_receivers">;

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

export function ReceiverOverviewTab({ cr }: { cr: CareReceiver }) {
  return (
    <div className="space-y-6">
      <Card className="border border-border">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-1">
            <InfoItem icon={MapPin} label="Address" value={cr.address} />
            <InfoItem icon={Calendar} label="Age" value={cr.age ? String(cr.age) : null} />
            <InfoItem icon={Heart} label="Care Type" value={cr.care_type} />
            <InfoItem icon={Globe} label="Language" value={cr.language} />
          </div>

          <SectionTitle title="Identifiers" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-1">
            <InfoItem icon={Shield} label="NHS Number" value={cr.nhs_number} />
            <InfoItem icon={Hash} label="Patient Number" value={cr.patient_number} />
            <InfoItem icon={Hash} label="Health Care Number" value={cr.health_care_number} />
            <InfoItem icon={Hash} label="Community Health Index" value={cr.community_health_index} />
          </div>

          <SectionTitle title="Health" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            <InfoItem icon={AlertTriangle} label="Allergies" value={cr.allergies || "None"} />
            <InfoItem icon={Stethoscope} label="Diagnoses" value={cr.diagnoses || "None"} />
            <div className="flex items-start gap-3 py-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk Rating</p>
                <Badge className="text-xs mt-0.5">{cr.risk_rating || "None"}</Badge>
              </div>
            </div>
            <div className="flex items-start gap-3 py-2">
              <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">DNACPR</p>
                <Badge variant={cr.dnacpr ? "destructive" : "secondary"} className="text-xs mt-0.5">
                  {cr.dnacpr ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-transparent px-6 py-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <Clock className="h-4 w-4" /> Requested Hours
          </h3>
        </div>
        <CardContent className="p-5">
          <HoursRow hours={cr.requested_hours} />
        </CardContent>
      </Card>

      <Card className="border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-transparent px-6 py-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <Heart className="h-4 w-4" /> Next of Kin
          </h3>
        </div>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-1">
            <InfoItem icon={User} label="Name" value={cr.next_of_kin} />
            <InfoItem icon={Phone} label="Phone" value={cr.next_of_kin_phone} />
            <InfoItem icon={Mail} label="Email" value={cr.next_of_kin_email} />
            <InfoItem icon={MapPin} label="Address" value={cr.next_of_kin_address} />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-transparent px-6 py-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <Stethoscope className="h-4 w-4" /> Doctor / Pharmacy
          </h3>
        </div>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-1">
            <InfoItem icon={Stethoscope} label="GP Practice" value={cr.doctor_name} />
            <InfoItem icon={Phone} label="GP Phone" value={cr.doctor_phone} />
            <InfoItem icon={MapPin} label="GP Address" value={cr.doctor_address} />
            <InfoItem icon={Pill} label="Pharmacy" value={cr.pharmacy_name} />
            <InfoItem icon={Phone} label="Pharmacy Phone" value={cr.pharmacy_phone} />
            <InfoItem icon={MapPin} label="Pharmacy Address" value={cr.pharmacy_address} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
