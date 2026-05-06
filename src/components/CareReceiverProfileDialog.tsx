
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useUpdateCareReceiver } from "@/hooks/use-care-data";
import {
  MapPin, Phone, Mail, Globe, Heart, AlertTriangle, Calendar,
  Shield, Users, Stethoscope, Pill, CheckCircle2, Clock, User, Pencil, Save, X,
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

function Field({ icon: Icon, label, value, editing, field, form, setForm, type = "text" }: {
  icon: any; label: string; value?: string | null; editing: boolean;
  field?: string; form?: any; setForm?: any; type?: string;
}) {
  if (!editing) {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-2">
        <Icon className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-sm text-foreground break-words">{value}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-3 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        <Input
          type={type}
          value={form?.[field!] ?? ""}
          onChange={(e) => setForm?.({ ...form, [field!]: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="pt-4 pb-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-primary">{title}</h3>
      <Separator className="mt-1.5" />
    </div>
  );
}

function HoursGrid({ hours, editing, form, setForm }: {
  hours?: any; editing: boolean; form?: any; setForm?: any;
}) {
  const h = hours ? (typeof hours === "string" ? JSON.parse(hours) : hours) : { week1: "00:00", week2: "00:00", week3: "00:00", week4: "00:00" };
  return (
    <div className="py-2">
      <p className="text-xs font-medium text-muted-foreground mb-2">Requested Hours</p>
      <div className="grid grid-cols-4 gap-2">
        {["week1", "week2", "week3", "week4"].map((w, i) => (
          <div key={w} className="bg-muted rounded-lg px-2 py-2 text-center">
            <p className="text-[10px] font-medium text-muted-foreground">Week {i + 1}</p>
            {editing ? (
              <Input
                value={form?.requested_hours?.[w] ?? h[w] ?? "00:00"}
                onChange={(e) => setForm?.({ ...form, requested_hours: { ...(form?.requested_hours || h), [w]: e.target.value } })}
                className="h-6 text-xs text-center mt-1 px-1"
              />
            ) : (
              <p className="text-sm font-semibold text-foreground mt-0.5">{h[w] || "00:00"}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const consentLabels: Record<string, string> = {
  contract_received: "Care Service Contract Received",
  user_pack_issued: "Service Member Pack Issued",
  consent_form_done: "Consent Form Done",
  poa_in_place: "Power of Attorney in Place",
  privacy_notice: "Privacy Notice",
  user_guide: "Service Member Guide",
};

const riskColors: Record<string, string> = {
  None: "bg-success/15 text-success",
  Low: "bg-blue-500/15 text-blue-600",
  Medium: "bg-warning/15 text-warning",
  High: "bg-destructive/15 text-destructive",
};

export function CareReceiverProfileDialog({ open, onOpenChange, receiver }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const updateMutation = useUpdateCareReceiver();
  const { toast } = useToast();

  useEffect(() => {
    if (receiver) {
      setForm({
        name: receiver.name ?? "",
        age: receiver.age ?? "",
        address: receiver.address ?? "",
        care_status: receiver.care_status ?? "Active",
        care_type: receiver.care_type ?? "",
        dnacpr: receiver.dnacpr ?? false,
        ethnicity: receiver.ethnicity ?? "",
        preferred_hours: receiver.preferred_hours ?? "",
        nfc_code: receiver.nfc_code ?? "",
        language: receiver.language ?? "",
        preference: receiver.preference ?? "",
        risk_rating: receiver.risk_rating ?? "None",
        nhs_number: receiver.nhs_number ?? "",
        patient_number: receiver.patient_number ?? "",
        health_care_number: receiver.health_care_number ?? "",
        community_health_index: receiver.community_health_index ?? "",
        allergies: receiver.allergies ?? "",
        diagnoses: receiver.diagnoses ?? "",
        doctor_name: receiver.doctor_name ?? "",
        doctor_contact: receiver.doctor_contact ?? "",
        doctor_address: receiver.doctor_address ?? "",
        doctor_phone: receiver.doctor_phone ?? "",
        pharmacy_name: receiver.pharmacy_name ?? "",
        pharmacy_address: receiver.pharmacy_address ?? "",
        pharmacy_phone: receiver.pharmacy_phone ?? "",
        next_of_kin: receiver.next_of_kin ?? "",
        next_of_kin_phone: receiver.next_of_kin_phone ?? "",
        next_of_kin_email: receiver.next_of_kin_email ?? "",
        next_of_kin_address: receiver.next_of_kin_address ?? "",
        consent_flags: receiver.consent_flags
          ? typeof receiver.consent_flags === "string" ? JSON.parse(receiver.consent_flags) : receiver.consent_flags
          : {},
        requested_hours: receiver.requested_hours
          ? typeof receiver.requested_hours === "string" ? JSON.parse(receiver.requested_hours) : receiver.requested_hours
          : { week1: "00:00", week2: "00:00", week3: "00:00", week4: "00:00" },
      });
      setEditing(false);
    }
  }, [receiver]);

  if (!receiver) return null;

  const flags = receiver.consent_flags
    ? typeof receiver.consent_flags === "string" ? JSON.parse(receiver.consent_flags) : receiver.consent_flags
    : {};

  const handleSave = async () => {
    try {
      const { consent_flags, requested_hours, age, ...rest } = form;
      await updateMutation.mutateAsync({
        id: receiver.id,
        ...rest,
        age: age ? Number(age) : null,
        consent_flags,
        requested_hours,
      });
      setEditing(false);
      toast({ title: "Profile Updated", description: `${form.name} has been updated successfully.` });
    } catch {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setEditing(false); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] p-0 gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border bg-muted/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-7 w-7 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {editing ? form.name : receiver.name}
                  {receiver.dnacpr && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">DNACPR</Badge>
                  )}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {receiver.care_type} · Age {receiver.age ?? "—"}
                </p>
                {receiver.created_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Created: {new Date(receiver.created_at).toLocaleString("en-GB", { timeZone: "Asia/Karachi" })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
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
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              ) : (
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <Tabs defaultValue="personal" className="flex-1">
          <div className="px-6 pt-2 border-b border-border">
            <TabsList className="bg-transparent p-0 h-auto gap-4">
              {["Personal", "Medical", "Hours & Consent", "Contacts", "GP & Pharmacy"].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t.toLowerCase().replace(/ & /g, "-")}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-sm"
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="h-[55vh]">
            {/* Personal */}
            <TabsContent value="personal" className="px-6 pb-6 mt-0">
              <SectionTitle title="Personal Details" />
              <Field icon={User} label="Full Name" value={receiver.name} editing={editing} field="name" form={form} setForm={setForm} />
              <Field icon={MapPin} label="Address" value={receiver.address} editing={editing} field="address" form={form} setForm={setForm} />

              {editing ? (
                <div className="flex items-start gap-3 py-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-3 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">Age</Label>
                    <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="h-8 text-sm w-24" />
                  </div>
                </div>
              ) : (
                <Field icon={Calendar} label="Age" value={receiver.age?.toString()} editing={false} />
              )}

              <Field icon={Globe} label="Ethnicity" value={receiver.ethnicity} editing={editing} field="ethnicity" form={form} setForm={setForm} />
              <Field icon={Globe} label="Language" value={receiver.language} editing={editing} field="language" form={form} setForm={setForm} />
              <Field icon={Heart} label="Preference" value={receiver.preference} editing={editing} field="preference" form={form} setForm={setForm} />
              <Field icon={Shield} label="NFC Code" value={receiver.nfc_code} editing={editing} field="nfc_code" form={form} setForm={setForm} />

              <SectionTitle title="DNACPR Status" />
              <div className="flex items-center gap-3 py-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Do Not Attempt CPR</p>
                  {editing ? (
                    <Switch checked={form.dnacpr} onCheckedChange={(v) => setForm({ ...form, dnacpr: v })} />
                  ) : (
                    <Badge variant={receiver.dnacpr ? "destructive" : "secondary"} className="text-xs mt-0.5">
                      {receiver.dnacpr ? "Yes — DNACPR" : "No"}
                    </Badge>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Medical */}
            <TabsContent value="medical" className="px-6 pb-6 mt-0">
              <SectionTitle title="Risk & Health" />
              <div className="flex items-center gap-3 py-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Risk Rating</p>
                  {editing ? (
                    <Input value={form.risk_rating} onChange={(e) => setForm({ ...form, risk_rating: e.target.value })} className="h-8 text-sm w-32 mt-1" />
                  ) : (
                    <Badge className={`text-xs mt-0.5 ${riskColors[receiver.risk_rating || "None"] || ""}`}>
                      {receiver.risk_rating || "None"}
                    </Badge>
                  )}
                </div>
              </div>

              {editing ? (
                <>
                  <div className="py-2 space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">Allergies</Label>
                    <Textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="min-h-[60px] text-sm" placeholder="None recorded" />
                  </div>
                  <div className="py-2 space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">Diagnoses</Label>
                    <Textarea value={form.diagnoses} onChange={(e) => setForm({ ...form, diagnoses: e.target.value })} className="min-h-[60px] text-sm" placeholder="None recorded" />
                  </div>
                </>
              ) : (
                <>
                  <Field icon={AlertTriangle} label="Allergies" value={receiver.allergies || "None recorded"} editing={false} />
                  <Field icon={Stethoscope} label="Diagnoses" value={receiver.diagnoses || "None recorded"} editing={false} />
                </>
              )}

              <SectionTitle title="Identifiers" />
              <Field icon={Shield} label="NHS Number" value={receiver.nhs_number} editing={editing} field="nhs_number" form={form} setForm={setForm} />
              <Field icon={Shield} label="Patient Number" value={receiver.patient_number} editing={editing} field="patient_number" form={form} setForm={setForm} />
              <Field icon={Shield} label="Health Care Number" value={receiver.health_care_number} editing={editing} field="health_care_number" form={form} setForm={setForm} />
              <Field icon={Shield} label="Community Health Index" value={receiver.community_health_index} editing={editing} field="community_health_index" form={form} setForm={setForm} />
            </TabsContent>

            {/* Hours & Consent */}
            <TabsContent value="hours-consent" className="px-6 pb-6 mt-0">
              <SectionTitle title="Hours" />
              <Field icon={Clock} label="Preferred Hours" value={receiver.preferred_hours} editing={editing} field="preferred_hours" form={form} setForm={setForm} />
              <HoursGrid hours={receiver.requested_hours} editing={editing} form={form} setForm={setForm} />

              <SectionTitle title="Consent & Documents" />
              <div className="grid grid-cols-1 gap-2 py-2">
                {Object.entries(consentLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3 py-1">
                    {editing ? (
                      <>
                        <Checkbox
                          checked={form.consent_flags?.[key] ?? false}
                          onCheckedChange={(v) => setForm({ ...form, consent_flags: { ...form.consent_flags, [key]: !!v } })}
                        />
                        <span className="text-sm text-foreground">{label}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className={`h-4 w-4 ${flags[key] ? "text-success" : "text-muted-foreground/40"}`} />
                        <span className={`text-sm ${flags[key] ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Contacts */}
            <TabsContent value="contacts" className="px-6 pb-6 mt-0">
              <SectionTitle title="Next of Kin" />
              <Field icon={Users} label="Name" value={receiver.next_of_kin} editing={editing} field="next_of_kin" form={form} setForm={setForm} />
              <Field icon={MapPin} label="Address" value={receiver.next_of_kin_address} editing={editing} field="next_of_kin_address" form={form} setForm={setForm} />
              <Field icon={Phone} label="Phone" value={receiver.next_of_kin_phone} editing={editing} field="next_of_kin_phone" form={form} setForm={setForm} type="tel" />
              <Field icon={Mail} label="Email" value={receiver.next_of_kin_email} editing={editing} field="next_of_kin_email" form={form} setForm={setForm} type="email" />
            </TabsContent>

            {/* GP & Pharmacy */}
            <TabsContent value="gp-pharmacy" className="px-6 pb-6 mt-0">
              <SectionTitle title="Doctor / GP" />
              <Field icon={Stethoscope} label="Practice Name" value={receiver.doctor_name} editing={editing} field="doctor_name" form={form} setForm={setForm} />
              <Field icon={Users} label="Contact" value={receiver.doctor_contact} editing={editing} field="doctor_contact" form={form} setForm={setForm} />
              <Field icon={MapPin} label="Address" value={receiver.doctor_address} editing={editing} field="doctor_address" form={form} setForm={setForm} />
              <Field icon={Phone} label="Phone" value={receiver.doctor_phone} editing={editing} field="doctor_phone" form={form} setForm={setForm} type="tel" />

              <SectionTitle title="Pharmacy" />
              <Field icon={Pill} label="Name" value={receiver.pharmacy_name} editing={editing} field="pharmacy_name" form={form} setForm={setForm} />
              <Field icon={MapPin} label="Address" value={receiver.pharmacy_address} editing={editing} field="pharmacy_address" form={form} setForm={setForm} />
              <Field icon={Phone} label="Phone" value={receiver.pharmacy_phone} editing={editing} field="pharmacy_phone" form={form} setForm={setForm} type="tel" />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
