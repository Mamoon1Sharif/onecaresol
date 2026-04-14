import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useCareReceiver, useUpdateCareReceiver } from "@/hooks/use-care-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Pencil, Save, X, Heart, MapPin, Phone, Mail,
  Shield, Globe, Calendar, AlertTriangle, Users, Clock,
  Stethoscope, Pill, CheckCircle2,
} from "lucide-react";

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="pt-6 pb-2">
      <h3 className="text-sm font-bold uppercase tracking-widest text-primary">{title}</h3>
      <Separator className="mt-2" />
    </div>
  );
}

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

function EditField({ label, value, onChange, type = "text", className = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-sm" />
    </div>
  );
}

const consentLabels: Record<string, { label: string; color: string }> = {
  contract_received: { label: "Care Service Contract Received", color: "bg-orange-500 hover:bg-orange-600" },
  user_pack_issued: { label: "Service User Pack Issued", color: "bg-red-500 hover:bg-red-600" },
  consent_form_done: { label: "Consent Form Done", color: "bg-yellow-500 hover:bg-yellow-600" },
  poa_in_place: { label: "Power of Attorney in Place", color: "bg-blue-500 hover:bg-blue-600" },
  privacy_notice: { label: "Privacy Notice", color: "bg-pink-500 hover:bg-pink-600" },
  user_guide: { label: "Service User Guide", color: "bg-green-500 hover:bg-green-600" },
};

const riskColors: Record<string, string> = {
  None: "bg-success/15 text-success",
  Low: "bg-blue-500/15 text-blue-600",
  Medium: "bg-warning/15 text-warning",
  High: "bg-destructive/15 text-destructive",
};

const CareReceiverProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: cr, isLoading } = useCareReceiver(id);
  const updateMutation = useUpdateCareReceiver();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (cr) {
      setForm({
        name: cr.name ?? "", age: cr.age ?? "", address: cr.address ?? "",
        care_status: cr.care_status ?? "Active", care_type: cr.care_type ?? "",
        dnacpr: cr.dnacpr ?? false, ethnicity: cr.ethnicity ?? "",
        preferred_hours: cr.preferred_hours ?? "", nfc_code: cr.nfc_code ?? "",
        language: cr.language ?? "", preference: cr.preference ?? "",
        risk_rating: cr.risk_rating ?? "None", nhs_number: cr.nhs_number ?? "",
        patient_number: cr.patient_number ?? "", health_care_number: cr.health_care_number ?? "",
        community_health_index: cr.community_health_index ?? "",
        allergies: cr.allergies ?? "", diagnoses: cr.diagnoses ?? "",
        doctor_name: cr.doctor_name ?? "", doctor_contact: cr.doctor_contact ?? "",
        doctor_address: cr.doctor_address ?? "", doctor_phone: cr.doctor_phone ?? "",
        pharmacy_name: cr.pharmacy_name ?? "", pharmacy_address: cr.pharmacy_address ?? "",
        pharmacy_phone: cr.pharmacy_phone ?? "",
        next_of_kin: cr.next_of_kin ?? "", next_of_kin_phone: cr.next_of_kin_phone ?? "",
        next_of_kin_email: cr.next_of_kin_email ?? "",
        next_of_kin_address: cr.next_of_kin_address ?? "",
        consent_flags: cr.consent_flags
          ? typeof cr.consent_flags === "string" ? JSON.parse(cr.consent_flags) : cr.consent_flags
          : {},
      });
    }
  }, [cr]);

  const handleSave = async () => {
    if (!cr) return;
    try {
      const { consent_flags, age, ...rest } = form;
      await updateMutation.mutateAsync({
        id: cr.id, ...rest,
        age: age ? Number(age) : null,
        consent_flags,
      });
      setEditing(false);
      toast({ title: "Profile Updated", description: `${form.name} updated successfully.` });
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!cr) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Service member not found.</p>
          <Button variant="link" onClick={() => navigate("/carereceivers")}>Back to list</Button>
        </div>
      </AppLayout>
    );
  }

  const flags = cr.consent_flags
    ? typeof cr.consent_flags === "string" ? JSON.parse(cr.consent_flags) : cr.consent_flags
    : {};

  const reqHours = cr.requested_hours
    ? typeof cr.requested_hours === "string" ? JSON.parse(cr.requested_hours) : cr.requested_hours
    : {};

  const set = (field: string) => (v: string) => setForm({ ...form, [field]: v });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/carereceivers")} className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Care Receivers
          </Button>
          {!editing ? (
            <Button variant="outline" onClick={() => setEditing(true)} className="gap-2">
              <Pencil className="h-4 w-4" /> Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}><Save className="h-4 w-4 mr-1" /> Save</Button>
            </div>
          )}
        </div>

        {/* Header Card */}
        <Card className="border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-8 py-6">
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 rounded-2xl bg-primary/15 border-2 border-primary/20 flex items-center justify-center shrink-0">
                <Heart className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">{cr.name}</h1>
                  {cr.dnacpr && (
                    <Badge variant="destructive" className="text-xs">DNACPR</Badge>
                  )}
                  <Badge
                    variant="default"
                    className={
                      cr.care_status === "Active" ? "bg-success/15 text-success border-0"
                        : cr.care_status === "On Hold" ? "bg-warning/15 text-warning border-0"
                        : "bg-muted text-muted-foreground border-0"
                    }
                  >
                    {cr.care_status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {cr.care_type} · Age {cr.age ?? "—"}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                  {cr.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{cr.address}</span>}
                </div>
                {cr.created_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    User Created: {new Date(cr.created_at).toLocaleDateString("en-GB")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        {editing ? (
          <Card className="border border-border">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Personal Details</h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <EditField label="Full Name" value={form.name} onChange={set("name")} />
                <EditField label="Address" value={form.address} onChange={set("address")} />
                <EditField label="Age" value={String(form.age)} onChange={set("age")} type="number" />
                <EditField label="Ethnicity" value={form.ethnicity} onChange={set("ethnicity")} />
                <EditField label="Language" value={form.language} onChange={set("language")} />
                <EditField label="Preference" value={form.preference} onChange={set("preference")} />
                <EditField label="NFC Code" value={form.nfc_code} onChange={set("nfc_code")} />
                <EditField label="Risk Rating" value={form.risk_rating} onChange={set("risk_rating")} />
                <EditField label="Preferred Hours" value={form.preferred_hours} onChange={set("preferred_hours")} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.dnacpr} onCheckedChange={(v) => setForm({ ...form, dnacpr: v })} />
                <Label className="text-sm">DNACPR</Label>
              </div>

              <h2 className="text-sm font-bold uppercase tracking-widest text-primary pt-4">Identifiers</h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditField label="NHS Number" value={form.nhs_number} onChange={set("nhs_number")} />
                <EditField label="Patient Number" value={form.patient_number} onChange={set("patient_number")} />
                <EditField label="Health Care Number" value={form.health_care_number} onChange={set("health_care_number")} />
                <EditField label="Community Health Index" value={form.community_health_index} onChange={set("community_health_index")} />
              </div>

              <h2 className="text-sm font-bold uppercase tracking-widest text-primary pt-4">Health</h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Allergies</Label>
                  <Textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="min-h-[60px] text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Diagnoses</Label>
                  <Textarea value={form.diagnoses} onChange={(e) => setForm({ ...form, diagnoses: e.target.value })} className="min-h-[60px] text-sm" />
                </div>
              </div>

              <h2 className="text-sm font-bold uppercase tracking-widest text-primary pt-4">Consent</h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(consentLabels).map(([key, { label }]) => (
                  <div key={key} className="flex items-center gap-3">
                    <Checkbox
                      checked={form.consent_flags?.[key] ?? false}
                      onCheckedChange={(v) => setForm({ ...form, consent_flags: { ...form.consent_flags, [key]: !!v } })}
                    />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>

              <h2 className="text-sm font-bold uppercase tracking-widest text-primary pt-4">Next of Kin</h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditField label="Name" value={form.next_of_kin} onChange={set("next_of_kin")} />
                <EditField label="Address" value={form.next_of_kin_address} onChange={set("next_of_kin_address")} />
                <EditField label="Phone" value={form.next_of_kin_phone} onChange={set("next_of_kin_phone")} type="tel" />
                <EditField label="Email" value={form.next_of_kin_email} onChange={set("next_of_kin_email")} type="email" />
              </div>

              <h2 className="text-sm font-bold uppercase tracking-widest text-primary pt-4">Doctor / GP</h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditField label="Practice Name" value={form.doctor_name} onChange={set("doctor_name")} />
                <EditField label="Contact" value={form.doctor_contact} onChange={set("doctor_contact")} />
                <EditField label="Address" value={form.doctor_address} onChange={set("doctor_address")} />
                <EditField label="Phone" value={form.doctor_phone} onChange={set("doctor_phone")} type="tel" />
              </div>

              <h2 className="text-sm font-bold uppercase tracking-widest text-primary pt-4">Pharmacy</h2>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditField label="Name" value={form.pharmacy_name} onChange={set("pharmacy_name")} />
                <EditField label="Address" value={form.pharmacy_address} onChange={set("pharmacy_address")} />
                <EditField label="Phone" value={form.pharmacy_phone} onChange={set("pharmacy_phone")} type="tel" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2">
              <Card className="border border-border">
                <CardContent className="p-6">
                  {/* Top Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1">
                    <InfoItem icon={Globe} label="Ethnicity" value={cr.ethnicity} />
                    <InfoItem icon={Globe} label="Language" value={cr.language} />
                    <InfoItem icon={Heart} label="Preference" value={cr.preference} />
                    <InfoItem icon={Shield} label="NFC Code" value={cr.nfc_code} />
                    <InfoItem icon={Clock} label="Preferred Hours" value={cr.preferred_hours} />
                    <div className="flex items-start gap-3 py-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk Rating</p>
                        <Badge className={`text-xs mt-0.5 ${riskColors[cr.risk_rating || "None"] || ""}`}>
                          {cr.risk_rating || "None"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Identifiers */}
                  <SectionTitle title="Identifiers" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-1">
                    <InfoItem icon={Shield} label="NHS Number" value={cr.nhs_number} />
                    <InfoItem icon={Shield} label="Patient Number" value={cr.patient_number} />
                    <InfoItem icon={Shield} label="Health Care Number" value={cr.health_care_number} />
                    <InfoItem icon={Shield} label="Community Health Index" value={cr.community_health_index} />
                  </div>

                  {/* Consent Badges */}
                  <SectionTitle title="Consent & Documents" />
                  <div className="flex flex-wrap gap-2 py-2">
                    {Object.entries(consentLabels).map(([key, { label, color }]) => (
                      <Badge
                        key={key}
                        className={`text-xs text-white px-3 py-1 ${flags[key] ? color : "bg-muted text-muted-foreground"}`}
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>

                  {/* Health */}
                  <SectionTitle title="Health" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                    <InfoItem icon={AlertTriangle} label="Allergies" value={cr.allergies || "None"} />
                    <InfoItem icon={Stethoscope} label="Diagnoses" value={cr.diagnoses || "None"} />
                  </div>

                  {/* Requested Hours */}
                  <SectionTitle title="Requested Hours" />
                  <div className="flex gap-6 flex-wrap py-2">
                    {["week1", "week2", "week3", "week4"].map((w, i) => (
                      <div key={w}>
                        <span className="text-xs text-muted-foreground font-medium">Week {i + 1}:</span>{" "}
                        <span className="text-sm font-semibold text-foreground">{reqHours[w] || "00:00"}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Next of Kin */}
              <Card className="border border-border">
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Next of Kin</h3>
                  <Separator className="mb-3" />
                  <InfoItem icon={Users} label="Name" value={cr.next_of_kin} />
                  <InfoItem icon={MapPin} label="Address" value={cr.next_of_kin_address} />
                  <InfoItem icon={Phone} label="Phone" value={cr.next_of_kin_phone} />
                  <InfoItem icon={Mail} label="Email" value={cr.next_of_kin_email} />
                </CardContent>
              </Card>

              {/* Doctor */}
              <Card className="border border-border">
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Doctors</h3>
                  <Separator className="mb-3" />
                  <InfoItem icon={Stethoscope} label="Practice" value={cr.doctor_name} />
                  <InfoItem icon={Users} label="Contact" value={cr.doctor_contact} />
                  <InfoItem icon={MapPin} label="Address" value={cr.doctor_address} />
                  <InfoItem icon={Phone} label="Phone" value={cr.doctor_phone} />
                </CardContent>
              </Card>

              {/* Pharmacy */}
              <Card className="border border-border">
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Pharmacy</h3>
                  <Separator className="mb-3" />
                  <InfoItem icon={Pill} label="Name" value={cr.pharmacy_name} />
                  <InfoItem icon={MapPin} label="Address" value={cr.pharmacy_address} />
                  <InfoItem icon={Phone} label="Phone" value={cr.pharmacy_phone} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CareReceiverProfile;
