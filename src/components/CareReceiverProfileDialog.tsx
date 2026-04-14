
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin, Phone, Mail, Globe, Heart, AlertTriangle, Calendar,
  Shield, Users, Stethoscope, Pill, CheckCircle2, Clock,
} from "lucide-react";

interface CareReceiverProfile {
  id: string;
  name: string;
  age?: number | null;
  address?: string | null;
  care_status: string;
  care_type: string;
  dnacpr: boolean;
  next_of_kin?: string | null;
  next_of_kin_phone?: string | null;
  next_of_kin_email?: string | null;
  next_of_kin_address?: string | null;
  ethnicity?: string | null;
  preferred_hours?: string | null;
  nfc_code?: string | null;
  language?: string | null;
  preference?: string | null;
  risk_rating?: string | null;
  nhs_number?: string | null;
  patient_number?: string | null;
  health_care_number?: string | null;
  community_health_index?: string | null;
  allergies?: string | null;
  diagnoses?: string | null;
  doctor_name?: string | null;
  doctor_contact?: string | null;
  doctor_address?: string | null;
  doctor_phone?: string | null;
  pharmacy_name?: string | null;
  pharmacy_address?: string | null;
  pharmacy_phone?: string | null;
  consent_flags?: any;
  requested_hours?: any;
  created_at?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiver: CareReceiverProfile | null;
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

function HoursGrid({ hours }: { hours?: any }) {
  if (!hours) return null;
  const h = typeof hours === "string" ? JSON.parse(hours) : hours;
  return (
    <div className="py-1.5">
      <p className="text-xs text-muted-foreground mb-1">Requested Hours</p>
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

const consentLabels: Record<string, string> = {
  contract_received: "Care Service Contract Received",
  user_pack_issued: "Service User Pack Issued",
  consent_form_done: "Consent Form Done",
  poa_in_place: "Power of Attorney in Place",
  privacy_notice: "Privacy Notice",
  user_guide: "Service User Guide",
};

export function CareReceiverProfileDialog({ open, onOpenChange, receiver }: Props) {
  if (!receiver) return null;

  const flags = receiver.consent_flags
    ? typeof receiver.consent_flags === "string"
      ? JSON.parse(receiver.consent_flags)
      : receiver.consent_flags
    : {};

  const riskColors: Record<string, string> = {
    None: "bg-success/15 text-success",
    Low: "bg-blue-500/15 text-blue-600",
    Medium: "bg-warning/15 text-warning",
    High: "bg-destructive/15 text-destructive",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {receiver.name}
                {receiver.dnacpr && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">DNACPR</Badge>
                )}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {receiver.care_type} · Age {receiver.age ?? "—"}
              </p>
            </div>
            <Badge
              variant="default"
              className={
                receiver.care_status === "Active"
                  ? "bg-success/15 text-success border-0"
                  : receiver.care_status === "On Hold"
                  ? "bg-warning/15 text-warning border-0"
                  : "bg-muted text-muted-foreground border-0"
              }
            >
              {receiver.care_status}
            </Badge>
          </div>
          {receiver.created_at && (
            <p className="text-xs text-muted-foreground">
              User Created: {new Date(receiver.created_at).toLocaleDateString("en-GB")}
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] px-6 pb-6">
          <div className="space-y-1">
            {/* Contact */}
            <SectionHeader title="Contact & Location" />
            <InfoRow icon={MapPin} label="Address" value={receiver.address} />
            <InfoRow icon={Globe} label="Ethnicity" value={receiver.ethnicity} />
            <InfoRow icon={Globe} label="Language" value={receiver.language} />
            <InfoRow icon={Heart} label="Preference" value={receiver.preference} />

            {/* Identifiers */}
            <SectionHeader title="Identifiers" />
            <InfoRow icon={Shield} label="NFC Code" value={receiver.nfc_code} />
            <InfoRow icon={Shield} label="NHS Number" value={receiver.nhs_number} />
            <InfoRow icon={Shield} label="Patient Number" value={receiver.patient_number} />
            <InfoRow icon={Shield} label="Health Care Number" value={receiver.health_care_number} />
            <InfoRow icon={Shield} label="Community Health Index" value={receiver.community_health_index} />

            {/* Risk */}
            <SectionHeader title="Risk & Health" />
            <div className="flex items-center gap-3 py-1.5">
              <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Risk Rating</p>
                <Badge className={`text-xs ${riskColors[receiver.risk_rating || "None"] || ""}`}>
                  {receiver.risk_rating || "None"}
                </Badge>
              </div>
            </div>
            <InfoRow icon={AlertTriangle} label="Allergies" value={receiver.allergies || "None recorded"} />
            <InfoRow icon={Stethoscope} label="Diagnoses" value={receiver.diagnoses || "None recorded"} />

            {/* Hours */}
            <SectionHeader title="Hours" />
            <InfoRow icon={Clock} label="Preferred Hours" value={receiver.preferred_hours} />
            <HoursGrid hours={receiver.requested_hours} />

            {/* Consent */}
            {Object.keys(flags).length > 0 && (
              <>
                <SectionHeader title="Consent & Documents" />
                <div className="grid grid-cols-1 gap-1 py-1">
                  {Object.entries(consentLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2 py-0.5">
                      <CheckCircle2
                        className={`h-4 w-4 ${flags[key] ? "text-success" : "text-muted-foreground/40"}`}
                      />
                      <span className={`text-sm ${flags[key] ? "text-foreground" : "text-muted-foreground"}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Next of Kin */}
            <SectionHeader title="Next of Kin" />
            <InfoRow icon={Users} label="Name" value={receiver.next_of_kin} />
            <InfoRow icon={MapPin} label="Address" value={receiver.next_of_kin_address} />
            <InfoRow icon={Phone} label="Phone" value={receiver.next_of_kin_phone} />
            <InfoRow icon={Mail} label="Email" value={receiver.next_of_kin_email} />

            {/* Doctor */}
            <SectionHeader title="Doctor" />
            <InfoRow icon={Stethoscope} label="Practice" value={receiver.doctor_name} />
            <InfoRow icon={Users} label="Contact" value={receiver.doctor_contact} />
            <InfoRow icon={MapPin} label="Address" value={receiver.doctor_address} />
            <InfoRow icon={Phone} label="Phone" value={receiver.doctor_phone} />

            {/* Pharmacy */}
            <SectionHeader title="Pharmacy" />
            <InfoRow icon={Pill} label="Name" value={receiver.pharmacy_name} />
            <InfoRow icon={MapPin} label="Address" value={receiver.pharmacy_address} />
            <InfoRow icon={Phone} label="Phone" value={receiver.pharmacy_phone} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
