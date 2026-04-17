import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { EditableField } from "./EditableField";
import { LoginDetailsSection } from "./LoginDetailsSection";
import { ReferencesSection } from "./ReferencesSection";
import { UserPreferencesSection } from "./UserPreferencesSection";
import { DnarSection } from "./DnarSection";
import { useUpdateCareGiver } from "@/hooks/use-care-data";
import { useToast } from "@/hooks/use-toast";
import {
  User, MapPin, Phone, Mail, Shield, Car, Calendar,
  Briefcase, Hash, KeyRound, UserCog, Stethoscope, Home,
  Heart, PhoneCall, StickyNote, Clock,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CareGiver = Tables<"care_givers">;

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

export function DetailedProfileTab({ cg }: Props) {
  const updateMutation = useUpdateCareGiver();
  const { toast } = useToast();
  const [dnarEnabled, setDnarEnabled] = useState(false);

  const save = async (field: string, value: any) => {
    try {
      await updateMutation.mutateAsync({ id: cg.id, [field]: value } as any);
      toast({ title: "Updated", description: `${field.replace(/_/g, " ")} updated.` });
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    }
  };

  const age = cg.dob ? Math.floor((Date.now() - new Date(cg.dob).getTime()) / 31557600000) : null;
  const refs = cg.care_giver_references
    ? typeof cg.care_giver_references === "string" ? JSON.parse(cg.care_giver_references) : cg.care_giver_references
    : [];

  return (
    <div className="space-y-6">
      {/* Team Member Details */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Team Member Details</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={User} label="Title" value={cg.title} onSave={(v) => save("title", v)} />
            <EditableField icon={User} label="Forename" value={cg.forename} onSave={(v) => save("forename", v)} />
            <EditableField icon={User} label="Surname" value={cg.surname} onSave={(v) => save("surname", v)} />
            <EditableField icon={User} label="Preferred Name" value={cg.preferred_name} onSave={(v) => save("preferred_name", v)} />
            <EditableField icon={User} label="Alias" value={cg.alias} onSave={(v) => save("alias", v)} />
            <EditableField icon={User} label="Suffix" value={cg.suffix} onSave={(v) => save("suffix", v)} />
            <EditableField icon={User} label="Sex Assigned At Birth" value={cg.sex_assigned_at_birth} onSave={(v) => save("sex_assigned_at_birth", v)} />
            <EditableField icon={User} label="Gender" value={cg.gender} onSave={(v) => save("gender", v)} />
            <EditableField icon={User} label="Sexual Orientation" value={cg.sexual_orientation} onSave={(v) => save("sexual_orientation", v)} />
            <EditableField icon={User} label="Ethnicity" value={cg.ethnicity} onSave={(v) => save("ethnicity", v)} />
            <EditableField icon={User} label="Marital Status" value={cg.marital_status} onSave={(v) => save("marital_status", v)} />
            <EditableField icon={User} label="Religion" value={cg.religion} onSave={(v) => save("religion", v)} />
            <EditableField icon={Calendar} label="DOB" value={cg.dob} onSave={(v) => save("dob", v)} type="date" />
            <EditableField icon={Hash} label="NI Number" value={cg.ni_number} onSave={(v) => save("ni_number", v)} />
            <div className="flex items-center gap-3 py-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Is Driver?</p>
                <Switch checked={cg.is_driver ?? false} onCheckedChange={(v) => save("is_driver", v)} />
              </div>
            </div>
            <EditableField icon={Stethoscope} label="Allergies" value={cg.allergies} onSave={(v) => save("allergies", v)} />
          </div>
        </CardContent>
      </Card>

      {/* Contact Details */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Contact Details</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={Phone} label="Home Tel" value={cg.home_phone} onSave={(v) => save("home_phone", v)} type="tel" />
            <EditableField icon={Phone} label="Work Mob" value={cg.work_number} onSave={(v) => save("work_number", v)} type="tel" />
            <EditableField icon={Mail} label="Work Email" value={cg.work_email} onSave={(v) => save("work_email", v)} type="email" />
            <EditableField icon={Phone} label="Personal Mob" value={cg.personal_number} onSave={(v) => save("personal_number", v)} type="tel" />
            <EditableField icon={Mail} label="Personal Email" value={cg.personal_email} onSave={(v) => save("personal_email", v)} type="email" />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Address</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={Home} label="House / Street" value={cg.house_street} onSave={(v) => save("house_street", v)} />
            <EditableField icon={MapPin} label="Address Line 2" value={cg.address_2} onSave={(v) => save("address_2", v)} />
            <EditableField icon={MapPin} label="Address Line 3" value={cg.address_3} onSave={(v) => save("address_3", v)} />
            <EditableField icon={MapPin} label="Town" value={cg.town} onSave={(v) => save("town", v)} />
            <EditableField icon={MapPin} label="County" value={cg.county} onSave={(v) => save("county", v)} />
            <EditableField icon={MapPin} label="Country" value={cg.country} onSave={(v) => save("country", v)} />
            <EditableField icon={MapPin} label="Postcode" value={cg.postcode} onSave={(v) => save("postcode", v)} />
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Account Details</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={Hash} label="Reference No" value={cg.reference_no} onSave={(v) => save("reference_no", v)} />
            <EditableField icon={UserCog} label="Manager" value={cg.manager} onSave={(v) => save("manager", v)} />
            <EditableField icon={Briefcase} label="Role" value={cg.role_title} onSave={(v) => save("role_title", v)} />
            <EditableField icon={Hash} label="Salary" value={cg.salary} onSave={(v) => save("salary", v)} />
            <EditableField icon={Hash} label="Payroll No" value={cg.payroll_number} onSave={(v) => save("payroll_number", v)} />
            <EditableField icon={Hash} label="Sage No" value={cg.sage_num} onSave={(v) => save("sage_num", v)} />
            <EditableField icon={UserCog} label="Permission" value={cg.permission} onSave={(v) => save("permission", v)} />
            <EditableField icon={Briefcase} label="Employment Status" value={cg.employment_status} onSave={(v) => save("employment_status", v)} />
            <EditableField icon={Briefcase} label="Employment Type" value={cg.employment_type} onSave={(v) => save("employment_type", v)} />
            <EditableField icon={Calendar} label="Start Date" value={cg.start_date} onSave={(v) => save("start_date", v)} type="date" />
            <EditableField icon={KeyRound} label="Login Code" value={cg.login_code} onSave={(v) => save("login_code", v)} />
          </div>
        </CardContent>
      </Card>

      {/* DBS Details */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">DBS / PVG Details</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={Shield} label="DBS/PVG Number" value={cg.dbs_ref} onSave={(v) => save("dbs_ref", v)} />
            <EditableField icon={Shield} label="DBS Type" value={cg.dbs_type} onSave={(v) => save("dbs_type", v)} />
            <div className="flex items-center gap-3 py-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">DBS Update Service</p>
                <div className="flex items-center gap-2 mt-1">
                  <Switch checked={cg.dbs_update_service ?? false} onCheckedChange={(v) => save("dbs_update_service", v)} />
                  <Badge variant={cg.dbs_update_service ? "default" : "secondary"} className="text-xs">
                    {cg.dbs_update_service ? "Registered" : "Not Registered"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next of Kin */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Next Of Kin</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={User} label="Name" value={cg.next_of_kin_name} onSave={(v) => save("next_of_kin_name", v)} />
            <EditableField icon={Heart} label="Relationship" value={cg.next_of_kin_relationship} onSave={(v) => save("next_of_kin_relationship", v)} />
            <EditableField icon={Home} label="Address" value={cg.next_of_kin_address} onSave={(v) => save("next_of_kin_address", v)} />
            <EditableField icon={Phone} label="Tel" value={cg.next_of_kin_phone} onSave={(v) => save("next_of_kin_phone", v)} type="tel" />
            <EditableField icon={PhoneCall} label="Tel 2" value={cg.next_of_kin_secondary_phone} onSave={(v) => save("next_of_kin_secondary_phone", v)} type="tel" />
            <EditableField icon={Mail} label="Email" value={cg.next_of_kin_email} onSave={(v) => save("next_of_kin_email", v)} type="email" />
            <EditableField icon={StickyNote} label="Notes" value={cg.next_of_kin_notes} onSave={(v) => save("next_of_kin_notes", v)} />
          </div>
        </CardContent>
      </Card>

      {/* References */}
      {Array.isArray(refs) && refs.length > 0 && (
        <Card className="border border-border">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">References</h3>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {refs.map((r: any, i: number) => (
                <div key={i} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.type}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}
