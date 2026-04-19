import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { EditableField } from "@/components/caregiver-profile/EditableField";
import { useUpdateCareReceiver } from "@/hooks/use-care-data";
import { useToast } from "@/hooks/use-toast";
import {
  User, MapPin, Phone, Mail, Shield, Calendar, Heart,
  Stethoscope, Globe, AlertTriangle, Pill, Hash, Clock,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CareReceiver = Tables<"care_receivers">;

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

export function ReceiverDetailedProfileTab({ cr }: { cr: CareReceiver }) {
  const updateMutation = useUpdateCareReceiver();
  const { toast } = useToast();

  const save = async (field: string, value: any) => {
    try {
      await updateMutation.mutateAsync({ id: cr.id, [field]: value });
      toast({ title: "Updated", description: `${field.replace(/_/g, " ")} updated.` });
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Service Member Details</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={User} label="Full Name" value={cr.name} onSave={(v) => save("name", v)} />
            <EditableField icon={Calendar} label="Age" value={cr.age ? String(cr.age) : ""} onSave={(v) => save("age", v ? Number(v) : null)} type="number" />
            <EditableField icon={Globe} label="Ethnicity" value={cr.ethnicity} onSave={(v) => save("ethnicity", v)} />
            <EditableField icon={Globe} label="Language" value={cr.language} onSave={(v) => save("language", v)} />
            <EditableField icon={Heart} label="Preference" value={cr.preference} onSave={(v) => save("preference", v)} />
            <EditableField icon={Heart} label="Care Type" value={cr.care_type} onSave={(v) => save("care_type", v)} />
            <EditableField icon={Heart} label="Care Status" value={cr.care_status} onSave={(v) => save("care_status", v)} />
            <EditableField icon={AlertTriangle} label="Risk Rating" value={cr.risk_rating} onSave={(v) => save("risk_rating", v)} />
            <EditableField icon={Shield} label="NFC Code" value={cr.nfc_code} onSave={(v) => save("nfc_code", v)} />
            <EditableField icon={Clock} label="Preferred Hours" value={cr.preferred_hours} onSave={(v) => save("preferred_hours", v)} />
            <div className="flex items-center gap-3 py-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">DNACPR</p>
                <div className="flex items-center gap-2 mt-1">
                  <Switch checked={cr.dnacpr ?? false} onCheckedChange={(v) => save("dnacpr", v)} />
                  <Badge variant={cr.dnacpr ? "destructive" : "secondary"} className="text-xs">
                    {cr.dnacpr ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Address</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={MapPin} label="Address" value={cr.address} onSave={(v) => save("address", v)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Identifiers</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={Shield} label="NHS Number" value={cr.nhs_number} onSave={(v) => save("nhs_number", v)} />
            <EditableField icon={Hash} label="Patient Number" value={cr.patient_number} onSave={(v) => save("patient_number", v)} />
            <EditableField icon={Hash} label="Health Care Number" value={cr.health_care_number} onSave={(v) => save("health_care_number", v)} />
            <EditableField icon={Hash} label="Community Health Index" value={cr.community_health_index} onSave={(v) => save("community_health_index", v)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Health</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={AlertTriangle} label="Allergies" value={cr.allergies} onSave={(v) => save("allergies", v)} />
            <EditableField icon={Stethoscope} label="Diagnoses" value={cr.diagnoses} onSave={(v) => save("diagnoses", v)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Next Of Kin</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={User} label="Name" value={cr.next_of_kin} onSave={(v) => save("next_of_kin", v)} />
            <EditableField icon={MapPin} label="Address" value={cr.next_of_kin_address} onSave={(v) => save("next_of_kin_address", v)} />
            <EditableField icon={Phone} label="Phone" value={cr.next_of_kin_phone} onSave={(v) => save("next_of_kin_phone", v)} type="tel" />
            <EditableField icon={Mail} label="Email" value={cr.next_of_kin_email} onSave={(v) => save("next_of_kin_email", v)} type="email" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Doctor / GP</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={Stethoscope} label="Practice Name" value={cr.doctor_name} onSave={(v) => save("doctor_name", v)} />
            <EditableField icon={User} label="Contact" value={cr.doctor_contact} onSave={(v) => save("doctor_contact", v)} />
            <EditableField icon={MapPin} label="Address" value={cr.doctor_address} onSave={(v) => save("doctor_address", v)} />
            <EditableField icon={Phone} label="Phone" value={cr.doctor_phone} onSave={(v) => save("doctor_phone", v)} type="tel" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Pharmacy</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={Pill} label="Name" value={cr.pharmacy_name} onSave={(v) => save("pharmacy_name", v)} />
            <EditableField icon={MapPin} label="Address" value={cr.pharmacy_address} onSave={(v) => save("pharmacy_address", v)} />
            <EditableField icon={Phone} label="Phone" value={cr.pharmacy_phone} onSave={(v) => save("pharmacy_phone", v)} type="tel" />
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
    </div>
  );
}
