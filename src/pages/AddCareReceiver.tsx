import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, UserPlus, Heart, MapPin, Phone, Stethoscope, Building, Users, Tags,
  Upload, X, Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ETHNICITY_OPTIONS = [
  "British","English","Scottish","Welsh","Gypsy or Irish Traveller","Irish","Northern Irish","Any other White background","Polish",
  "White and Black Caribbean","White and Black African","White and Asian","Any other Mixed background",
  "Indian","Pakistani","Bangladeshi","Any other Asian background","Asian British",
  "Caribbean","African","Any other black background","Black British",
  "Chinese","Ghanaian","Nigerian","Other","Somali","Somaliland","Sri Lankan",
  "Prefers Not To Say","Unknown",
];

const COUNTY_OPTIONS = [
  "Aberdeenshire","Angus","Antrim","Argyll and Bute","Armagh","Bedfordshire","Berkshire","Buckinghamshire",
  "Cambridgeshire","Cheshire","City of London","Clackmannanshire","Cornwall","County Durham",
  "Cumbria","Derbyshire","Devon","Dorset","Down","Dumfries and Galloway","Dundee","East Ayrshire",
  "East Dunbartonshire","East Lothian","East Renfrewshire","East Riding of Yorkshire","East Sussex",
  "Edinburgh","Essex","Falkirk","Fermanagh","Fife","Glasgow","Gloucestershire","Greater London",
  "Greater Manchester","Hampshire","Herefordshire","Hertfordshire","Highland","Inverclyde",
  "Isle of Wight","Kent","Lancashire","Leicestershire","Lincolnshire","Londonderry",
  "Merseyside","Midlothian","Moray","Norfolk","North Ayrshire","North Lanarkshire",
  "North Yorkshire","Northamptonshire","Northumberland","Nottinghamshire","Orkney Islands",
  "Oxfordshire","Perth and Kinross","Renfrewshire","Rutland","Scottish Borders",
  "Shetland Islands","Shropshire","Somerset","South Ayrshire","South Lanarkshire",
  "South Yorkshire","Staffordshire","Stirling","Suffolk","Surrey","Tyne and Wear",
  "Tyrone","Warwickshire","West Dunbartonshire","West Lothian","West Midlands",
  "West Sussex","West Yorkshire","Wiltshire","Worcestershire",
];

const COUNTRY_OPTIONS = ["United Kingdom","England","Scotland","Wales","Northern Ireland","Ireland","Other"];
const SEX_OPTIONS = ["Male","Female","Indeterminate (unable to be classified as either male or female)","Not Known"];
const GENDER_OPTIONS = ["Female","Male","N/A","Non-Binary","Other","Prefer not to say","Transgender"];
const SEXUAL_ORIENTATION_OPTIONS = ["Bisexual","Gay","Heterosexual","Homosexual","Lesbian","N/A","Other","Pansexual","Prefer not to say"];
const MARITAL_STATUS_OPTIONS = [
  "Divorced/Person whose Civil Partnership has been dissolved","Married/Civil Partner",
  "Not applicable","Not disclosed","Not known","Separated","Single","Widowed/Surviving Civil Partner",
];
const RELIGION_OPTIONS = [
  "Christianity","Islam","Hinduism","Sikhism","Judaism","Buddhism",
  "No Religion","Other","Prefer not to say",
];
const CARE_STATUS_OPTIONS = ["Active","On Hold","Discharged"];
const CARE_TYPE_OPTIONS = ["Domiciliary","Live-In","Respite","Supported Living","Other"];
const RISK_RATING_OPTIONS = ["Low","Medium","High","None"];
const PREFERENCE_OPTIONS = ["Either","Female","Male"];
const LANGUAGE_OPTIONS = ["English","Welsh","Polish","Urdu","Punjabi","Bengali","Gujarati","Arabic","Other"];
const TITLE_OPTIONS = ["Mr","Mrs","Miss","Ms","Mx","Dr","Prof","Rev","Sir","Dame","Lady","Lord"];
const SUFFIX_OPTIONS = ["Jr","Sr","II","III","IV","PhD","MD","Esq","OBE","MBE","RN"];
const TAG_OPTIONS = [
  "End of Life",
  "Falls Risk",
  "Pets in Home",
  "Smoker",
  "Wheelchair User",
  "Dementia",
  "Diabetes",
];

type FormData = {
  title: string; forename: string; surname: string; preferred_name: string; alias: string; suffix: string;
  sex_assigned_at_birth: string; gender: string; sexual_orientation: string; dob: string; ethnicity: string;
  marital_status: string; religion: string; preferred_language: string; preference: string;
  house_street: string; address_2: string; address_3: string; town: string; county: string; country: string; postcode: string;
  phone_number: string; mobile_num_1: string; mobile_num_2: string; email_1: string; email_2: string;
  next_of_kin: string; next_of_kin_phone: string; next_of_kin_email: string; next_of_kin_address: string;
  nhs_number: string; ni_number: string; patient_number: string; health_care_number: string; community_health_index: string;
  doctor_name: string; doctor_phone: string; doctor_address: string;
  pharmacy_name: string; pharmacy_phone: string; pharmacy_address: string;
  allergies: string; diagnoses: string;
  care_status: string; care_type: string; risk_rating: string; service_start_date: string;
  reference_no: string; keysafe: string; nfc_code: string; dnacpr: boolean;
};

const initialForm: FormData = {
  title:"",forename:"",surname:"",preferred_name:"",alias:"",suffix:"",
  sex_assigned_at_birth:"",gender:"",sexual_orientation:"",dob:"",ethnicity:"",
  marital_status:"",religion:"",preferred_language:"",preference:"",
  house_street:"",address_2:"",address_3:"",town:"",county:"",country:"",postcode:"",
  phone_number:"",mobile_num_1:"",mobile_num_2:"",email_1:"",email_2:"",
  next_of_kin:"",next_of_kin_phone:"",next_of_kin_email:"",next_of_kin_address:"",
  nhs_number:"",ni_number:"",patient_number:"",health_care_number:"",community_health_index:"",
  doctor_name:"",doctor_phone:"",doctor_address:"",
  pharmacy_name:"",pharmacy_phone:"",pharmacy_address:"",
  allergies:"",diagnoses:"",
  care_status:"Active",care_type:"",risk_rating:"",service_start_date:"",
  reference_no:"",keysafe:"",nfc_code:"",dnacpr:false,
};

const REQUIRED_FIELDS: (keyof FormData)[] = [
  "title","forename","surname","sex_assigned_at_birth","dob","ethnicity",
  "house_street","town","county","country",
  "care_status","care_type","service_start_date",
];

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
  );
}

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}{required && <RequiredMark />}
      </Label>
      {children}
    </div>
  );
}

export default function AddCareReceiver() {
  const [form, setForm] = useState<FormData>({ ...initialForm });
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const onPickAvatar = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5MB.", variant: "destructive" });
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const set = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value as any }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    REQUIRED_FIELDS.forEach((f) => {
      const v = form[f];
      if (typeof v === "string" && !v.trim()) errs[f] = "This field is required";
    });
    if (form.email_1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_1)) errs.email_1 = "Invalid email";
    if (form.email_2 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_2)) errs.email_2 = "Invalid email";
    if (form.next_of_kin_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.next_of_kin_email)) errs.next_of_kin_email = "Invalid email";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("You must be signed in to add a service member.");
      const { data: cu, error: cuErr } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (cuErr) throw cuErr;
      if (!cu?.company_id) throw new Error("Your account is not linked to a company.");

      const name = `${form.forename.trim()} ${form.surname.trim()}`.trim();
      const address = [form.house_street, form.address_2, form.address_3, form.town, form.county, form.postcode, form.country]
        .filter(Boolean).join(", ");

      const { data, error } = await supabase.from("care_receivers").insert({
        company_id: cu.company_id,
        name,
        title: form.title || null, forename: form.forename, surname: form.surname,
        alias: form.alias || null, suffix: form.suffix || null,
        sex_assigned_at_birth: form.sex_assigned_at_birth || null,
        gender: form.gender || null, sexual_orientation: form.sexual_orientation || null,
        dob: form.dob || null, ethnicity: form.ethnicity || null,
        marital_status: form.marital_status || null, religion: form.religion || null,
        preferred_language: form.preferred_language || null, language: form.preferred_language || null,
        preference: form.preference || null,
        address,
        phone_number: form.phone_number || null,
        mobile_num_1: form.mobile_num_1 || null, mobile_num_2: form.mobile_num_2 || null,
        email_1: form.email_1 || null, email_2: form.email_2 || null,
        next_of_kin: form.next_of_kin || null, next_of_kin_phone: form.next_of_kin_phone || null,
        next_of_kin_email: form.next_of_kin_email || null, next_of_kin_address: form.next_of_kin_address || null,
        nhs_number: form.nhs_number || null, ni_number: form.ni_number || null,
        patient_number: form.patient_number || null, health_care_number: form.health_care_number || null,
        community_health_index: form.community_health_index || null,
        doctor_name: form.doctor_name || null, doctor_phone: form.doctor_phone || null,
        doctor_address: form.doctor_address || null,
        pharmacy_name: form.pharmacy_name || null, pharmacy_phone: form.pharmacy_phone || null,
        pharmacy_address: form.pharmacy_address || null,
        allergies: form.allergies || null, diagnoses: form.diagnoses || null,
        care_status: form.care_status || "Active",
        care_type: form.care_type || "Domiciliary",
        risk_rating: form.risk_rating || null,
        service_start_date: form.service_start_date || null,
        reference_no: form.reference_no || null,
        keysafe: form.keysafe || null,
        nfc_code: form.nfc_code || null,
        dnacpr: form.dnacpr,
        tags,
      } as any).select().single();

      if (error) throw error;
      toast({ title: "Service Member Added", description: `${name} has been added successfully.` });
      navigate(data?.id ? `/carereceivers/${data.id}` : "/carereceivers");
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to add service member.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscard = () => setShowDiscard(true);

  const inputCn = (field: keyof FormData) =>
    `bg-card border-border ${errors[field] ? "border-destructive" : ""}`;

  const selectField = (field: keyof FormData, placeholder: string, options: string[]) => (
    <div>
      <Select value={form[field] as string} onValueChange={(v) => set(field, v)}>
        <SelectTrigger className={inputCn(field)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors[field] && <p className="text-xs text-destructive mt-1">{errors[field]}</p>}
    </div>
  );

  const inputField = (field: keyof FormData, placeholder: string, type = "text") => (
    <div>
      <Input
        type={type}
        placeholder={placeholder}
        value={form[field] as string}
        onChange={(e) => set(field, e.target.value)}
        className={inputCn(field)}
      />
      {errors[field] && <p className="text-xs text-destructive mt-1">{errors[field]}</p>}
    </div>
  );

  const textareaField = (field: keyof FormData, placeholder: string) => (
    <Textarea
      placeholder={placeholder}
      value={form[field] as string}
      onChange={(e) => set(field, e.target.value)}
      className={inputCn(field)}
      rows={3}
    />
  );

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleDiscard}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Add Service Member</h1>
              <p className="text-sm text-muted-foreground">Fill in all required fields marked with *</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDiscard}>Discard</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {submitting ? "Saving..." : "Save Service Member"}
            </Button>
          </div>
        </div>

        {/* Personal Detail */}
        <Card>
          <SectionHeader icon={Heart} title="Personal Detail" />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldRow label="Title" required>{selectField("title", "Choose one...", TITLE_OPTIONS)}</FieldRow>
            <FieldRow label="Forename" required>{inputField("forename", "First name")}</FieldRow>
            <FieldRow label="Surname" required>{inputField("surname", "Last name")}</FieldRow>
            <FieldRow label="Preferred Name">{inputField("preferred_name", "Preferred name")}</FieldRow>
            <FieldRow label="Alias">{inputField("alias", "Alias")}</FieldRow>
            <FieldRow label="Suffix">{selectField("suffix", "Choose one...", SUFFIX_OPTIONS)}</FieldRow>
            <FieldRow label="Sex Assigned At Birth" required>{selectField("sex_assigned_at_birth", "Choose one...", SEX_OPTIONS)}</FieldRow>
            <FieldRow label="Gender">{selectField("gender", "Choose one...", GENDER_OPTIONS)}</FieldRow>
            <FieldRow label="Sexual Orientation">{selectField("sexual_orientation", "Choose one...", SEXUAL_ORIENTATION_OPTIONS)}</FieldRow>
            <FieldRow label="DOB" required>{inputField("dob", "", "date")}</FieldRow>
            <FieldRow label="Ethnicity" required>{selectField("ethnicity", "Choose one...", ETHNICITY_OPTIONS)}</FieldRow>
            <FieldRow label="Marital Status">{selectField("marital_status", "Choose one...", MARITAL_STATUS_OPTIONS)}</FieldRow>
            <FieldRow label="Religion">{selectField("religion", "Choose one...", RELIGION_OPTIONS)}</FieldRow>
            <FieldRow label="Preferred Language">{selectField("preferred_language", "Choose one...", LANGUAGE_OPTIONS)}</FieldRow>
            <FieldRow label="Carer Preference">{selectField("preference", "Choose one...", PREFERENCE_OPTIONS)}</FieldRow>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <SectionHeader icon={MapPin} title="Address Details" />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldRow label="House No & Street Name" required>{inputField("house_street", "Street address")}</FieldRow>
            <FieldRow label="Address 2">{inputField("address_2", "Address line 2")}</FieldRow>
            <FieldRow label="Address 3">{inputField("address_3", "Address line 3")}</FieldRow>
            <FieldRow label="Town / Area" required>{inputField("town", "Town or area")}</FieldRow>
            <FieldRow label="County" required>{selectField("county", "Choose one...", COUNTY_OPTIONS)}</FieldRow>
            <FieldRow label="Country" required>{selectField("country", "Choose one...", COUNTRY_OPTIONS)}</FieldRow>
            <FieldRow label="Postcode">{inputField("postcode", "e.g. SW1A 1AA")}</FieldRow>
            <FieldRow label="Keysafe Code">{inputField("keysafe", "Keysafe")}</FieldRow>
            <FieldRow label="NFC Code">{inputField("nfc_code", "NFC code")}</FieldRow>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <SectionHeader icon={Phone} title="Contact Details" />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldRow label="Home Phone">{inputField("phone_number", "Home phone", "tel")}</FieldRow>
            <FieldRow label="Mobile 1">{inputField("mobile_num_1", "Mobile", "tel")}</FieldRow>
            <FieldRow label="Mobile 2">{inputField("mobile_num_2", "Alt mobile", "tel")}</FieldRow>
            <FieldRow label="Email 1">{inputField("email_1", "Email", "email")}</FieldRow>
            <FieldRow label="Email 2">{inputField("email_2", "Alt email", "email")}</FieldRow>
          </CardContent>
        </Card>

        {/* Next of Kin */}
        <Card>
          <SectionHeader icon={Users} title="Next of Kin" />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldRow label="Name">{inputField("next_of_kin", "Full name")}</FieldRow>
            <FieldRow label="Phone">{inputField("next_of_kin_phone", "Phone", "tel")}</FieldRow>
            <FieldRow label="Email">{inputField("next_of_kin_email", "Email", "email")}</FieldRow>
            <div className="sm:col-span-2 lg:col-span-3">
              <FieldRow label="Address">{inputField("next_of_kin_address", "Address")}</FieldRow>
            </div>
          </CardContent>
        </Card>

        {/* Medical */}
        <Card>
          <SectionHeader icon={Stethoscope} title="Medical Information" />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldRow label="NHS Number">{inputField("nhs_number", "NHS number")}</FieldRow>
            <FieldRow label="NI Number">{inputField("ni_number", "e.g. AB123456C")}</FieldRow>
            <FieldRow label="Patient Number">{inputField("patient_number", "Patient number")}</FieldRow>
            <FieldRow label="Health Care Number">{inputField("health_care_number", "Health care number")}</FieldRow>
            <FieldRow label="Community Health Index">{inputField("community_health_index", "CHI number")}</FieldRow>
            <FieldRow label="Doctor Name">{inputField("doctor_name", "Doctor name")}</FieldRow>
            <FieldRow label="Doctor Phone">{inputField("doctor_phone", "Doctor phone", "tel")}</FieldRow>
            <div className="sm:col-span-2 lg:col-span-3">
              <FieldRow label="Doctor Address">{inputField("doctor_address", "Surgery address")}</FieldRow>
            </div>
            <FieldRow label="Pharmacy Name">{inputField("pharmacy_name", "Pharmacy name")}</FieldRow>
            <FieldRow label="Pharmacy Phone">{inputField("pharmacy_phone", "Pharmacy phone", "tel")}</FieldRow>
            <div className="sm:col-span-2 lg:col-span-3">
              <FieldRow label="Pharmacy Address">{inputField("pharmacy_address", "Pharmacy address")}</FieldRow>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <FieldRow label="Allergies">{textareaField("allergies", "List known allergies")}</FieldRow>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <FieldRow label="Diagnoses">{textareaField("diagnoses", "List diagnoses")}</FieldRow>
            </div>
          </CardContent>
        </Card>

        {/* Care */}
        <Card>
          <SectionHeader icon={Building} title="Care Details" />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldRow label="Care Status" required>{selectField("care_status", "Choose one...", CARE_STATUS_OPTIONS)}</FieldRow>
            <FieldRow label="Care Type" required>{selectField("care_type", "Choose one...", CARE_TYPE_OPTIONS)}</FieldRow>
            <FieldRow label="Risk Rating">{selectField("risk_rating", "Choose one...", RISK_RATING_OPTIONS)}</FieldRow>
            <FieldRow label="Service Start Date" required>{inputField("service_start_date", "", "date")}</FieldRow>
            <FieldRow label="Reference No">{inputField("reference_no", "Reference number")}</FieldRow>
            <div className="flex items-end">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors w-full">
                <Checkbox
                  checked={form.dnacpr}
                  onCheckedChange={(checked) => set("dnacpr", !!checked)}
                />
                <span className="text-sm font-medium text-foreground">DNACPR in place</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <SectionHeader icon={Tags} title="Tags" />
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Select applicable tags for this service member</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TAG_OPTIONS.map((tag) => (
                <label key={tag} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={tags.includes(tag)}
                    onCheckedChange={(checked) => {
                      setTags(checked ? [...tags, tag] : tags.filter((t) => t !== tag));
                    }}
                  />
                  <span className="text-sm font-medium text-foreground">{tag}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={handleDiscard}>Discard</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {submitting ? "Saving..." : "Save Service Member"}
          </Button>
        </div>
      </div>

      {/* Discard confirmation */}
      <AlertDialog open={showDiscard} onOpenChange={setShowDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard addition?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discard this new service member? All entered data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/carereceivers")}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
