
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin, Phone, Mail, Shield, Car, Calendar, User, Heart,
  AlertTriangle, Clock, Users,
} from "lucide-react";

interface CareGiverProfile {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  address?: string | null;
  login_code?: string | null;
  permission?: string | null;
  role_title?: string | null;
  sage_num?: string | null;
  dob?: string | null;
  is_driver?: boolean | null;
  dbs_ref?: string | null;
  ethnicity?: string | null;
  dbs_update_service?: boolean | null;
  dbs_type?: string | null;
  allergies?: string | null;
  next_of_kin_name?: string | null;
  next_of_kin_address?: string | null;
  next_of_kin_phone?: string | null;
  care_giver_references?: any;
  requested_hours?: any;
  templated_hours?: any;
  created_at?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caregiver: CareGiverProfile | null;
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-1.5">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-3 pb-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <Separator className="mt-1" />
    </div>
  );
}

function HoursGrid({ label, hours }: { label: string; hours?: any }) {
  if (!hours) return null;
  const h = typeof hours === "string" ? JSON.parse(hours) : hours;
  return (
    <div className="py-1.5">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="grid grid-cols-4 gap-2">
        {["week1", "week2", "week3", "week4"].map((w, i) => (
          <div key={w} className="bg-muted rounded-md px-2 py-1 text-center">
            <p className="text-[10px] text-muted-foreground">Wk {i + 1}</p>
            <p className="text-sm font-medium text-foreground">{h[w] || "00:00"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CareGiverProfileDialog({ open, onOpenChange, caregiver }: Props) {
  if (!caregiver) return null;

  const age = caregiver.dob
    ? `${Math.floor((Date.now() - new Date(caregiver.dob).getTime()) / 31557600000)}`
    : null;

  const refs = caregiver.care_giver_references
    ? typeof caregiver.care_giver_references === "string"
      ? JSON.parse(caregiver.care_giver_references)
      : caregiver.care_giver_references
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">{caregiver.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {caregiver.role_title || "Homecare Assistant"}
              </p>
            </div>
            <Badge
              variant={caregiver.status === "Active" ? "default" : "secondary"}
              className={caregiver.status === "Active" ? "bg-success/15 text-success border-0" : ""}
            >
              {caregiver.status}
            </Badge>
          </div>
          {caregiver.created_at && (
            <p className="text-xs text-muted-foreground">
              User Created: {new Date(caregiver.created_at).toLocaleDateString("en-GB")}
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] px-6 pb-6">
          <div className="space-y-1">
            {/* Contact */}
            <SectionHeader title="Contact Details" />
            <InfoRow icon={MapPin} label="Address" value={caregiver.address} />
            <InfoRow icon={Phone} label="Phone" value={caregiver.phone} />
            <InfoRow icon={Mail} label="Email" value={caregiver.email} />

            {/* Work Details */}
            <SectionHeader title="Work Details" />
            <InfoRow icon={Shield} label="Login Code" value={caregiver.login_code} />
            <InfoRow icon={User} label="Permission" value={caregiver.permission} />
            <InfoRow icon={User} label="Role" value={caregiver.role_title} />
            <InfoRow icon={User} label="Sage Num" value={caregiver.sage_num} />
            <InfoRow
              icon={Calendar}
              label="DOB (Age)"
              value={caregiver.dob ? `${new Date(caregiver.dob).toLocaleDateString("en-GB")} (${age})` : null}
            />
            <InfoRow icon={Car} label="Is Driver?" value={caregiver.is_driver ? "Yes" : "No"} />
            <InfoRow icon={User} label="Ethnicity" value={caregiver.ethnicity} />

            {/* DBS */}
            <SectionHeader title="DBS Information" />
            <InfoRow icon={Shield} label="DBS Ref" value={caregiver.dbs_ref} />
            <div className="flex items-center gap-2 py-1.5">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">
                Registered to DBS Update Service:
              </span>
              <Badge variant={caregiver.dbs_update_service ? "default" : "secondary"} className="text-xs">
                {caregiver.dbs_update_service ? "Yes" : "No"}
              </Badge>
            </div>
            <InfoRow icon={Shield} label="DBS Type" value={caregiver.dbs_type} />

            {/* Health */}
            <SectionHeader title="Health" />
            <InfoRow icon={AlertTriangle} label="Allergies" value={caregiver.allergies || "None recorded"} />

            {/* Hours */}
            <SectionHeader title="Hours" />
            <HoursGrid label="Requested Hours" hours={caregiver.requested_hours} />
            <HoursGrid label="Templated Hours" hours={caregiver.templated_hours} />

            {/* Next of Kin */}
            <SectionHeader title="Next of Kin" />
            <InfoRow icon={Users} label="Name" value={caregiver.next_of_kin_name} />
            <InfoRow icon={MapPin} label="Address" value={caregiver.next_of_kin_address} />
            <InfoRow icon={Phone} label="Phone" value={caregiver.next_of_kin_phone} />

            {/* References */}
            {Array.isArray(refs) && refs.length > 0 && (
              <>
                <SectionHeader title="References" />
                {refs.map((r: any, i: number) => (
                  <div key={i} className="py-1 pl-7">
                    <p className="text-sm text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.type}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
