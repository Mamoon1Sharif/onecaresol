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
import { ArrowLeft, UserPlus, User, MapPin, Phone, Briefcase, Building, Tags } from "lucide-react";
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

const PERMISSION_OPTIONS = ["Rota Admin","Rota Admin Assist","Rota Admin Training","Tags","System Admin","Field User"];

const EMPLOYMENT_STATUS_OPTIONS = ["Break","Employed","Leaver","Self Employed","Suspended"];

const EMPLOYMENT_TYPE_OPTIONS = ["12 Hour Contract","Full Time","Live In","Loaner","Part Time","Temp","Zero Hours Contract"];

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

const MANAGER_OPTIONS = ["Manager 1","Manager 2","Manager 3"];

const ROLE_OPTIONS = ["Homecare Assistant","Senior Carer","Team Leader","Care Coordinator","Nurse","Support Worker","Other"];

const TAG_OPTIONS = [
  "COS Letter Received",
  "DBS Adult & Children",
  "DBS Disclaimer",
  "Has Full UK Driving Licence",
  "Registered to DBS Update Service",
];

type FormData = {
  title: string; forename: string; surname: string; preferred_name: string; alias: string; suffix: string;
  sex_assigned_at_birth: string; gender: string; sexual_orientation: string; dob: string; ethnicity: string;
  marital_status: string; religion: string; ni_number: string; is_driver: string;
  house_street: string; address_2: string; address_3: string; town: string; county: string; country: string; postcode: string;
  home_phone: string; work_number: string; work_email: string; personal_number: string; personal_email: string;
  permission: string; reference_no: string; sage_num: string; payroll_number: string; password: string; repeat_password: string;
  start_date: string; employment_status: string; employment_type: string; manager: string; role_title: string; salary: string;
};

const initialForm: FormData = {
  title:"",forename:"",surname:"",preferred_name:"",alias:"",suffix:"",
  sex_assigned_at_birth:"",gender:"",sexual_orientation:"",dob:"",ethnicity:"",
  marital_status:"",religion:"",ni_number:"",is_driver:"",
  house_street:"",address_2:"",address_3:"",town:"",county:"",country:"",postcode:"",
  home_phone:"",work_number:"",work_email:"",personal_number:"",personal_email:"",
  permission:"",reference_no:"",sage_num:"",payroll_number:"",password:"",repeat_password:"",
  start_date:"",employment_status:"",employment_type:"",manager:"",role_title:"",salary:"",
};

const REQUIRED_FIELDS: (keyof FormData)[] = [
  "title","forename","surname","sex_assigned_at_birth","dob","ethnicity","is_driver",
  "house_street","town","county","country",
  "permission","password","repeat_password",
  "start_date","employment_status","employment_type","salary",
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

export default function AddCareGiver() {
  const [form, setForm] = useState<FormData>({ ...initialForm });
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const set = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    REQUIRED_FIELDS.forEach((f) => {
      if (!form[f]?.trim()) errs[f] = "This field is required";
    });
    if (form.password && form.repeat_password && form.password !== form.repeat_password) {
      errs.repeat_password = "Passwords do not match";
    }
    if (form.work_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.work_email)) errs.work_email = "Invalid email";
    if (form.personal_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.personal_email)) errs.personal_email = "Invalid email";
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
      const name = `${form.forename.trim()} ${form.surname.trim()}`;
      const { error } = await supabase.from("care_givers").insert({
        name,
        title: form.title, forename: form.forename, surname: form.surname,
        preferred_name: form.preferred_name || null, alias: form.alias || null, suffix: form.suffix || null,
        sex_assigned_at_birth: form.sex_assigned_at_birth, gender: form.gender || null,
        sexual_orientation: form.sexual_orientation || null, dob: form.dob || null,
        ethnicity: form.ethnicity, marital_status: form.marital_status || null,
        religion: form.religion || null, ni_number: form.ni_number || null,
        is_driver: form.is_driver === "Yes",
        house_street: form.house_street, address_2: form.address_2 || null,
        address_3: form.address_3 || null, town: form.town, county: form.county,
        country: form.country, postcode: form.postcode || null,
        address: [form.house_street, form.address_2, form.address_3, form.town, form.county, form.postcode, form.country].filter(Boolean).join(", "),
        home_phone: form.home_phone || null, work_number: form.work_number || null,
        work_email: form.work_email || null, personal_number: form.personal_number || null,
        personal_email: form.personal_email || null,
        email: form.work_email || form.personal_email || null,
        phone: form.personal_number || form.home_phone || form.work_number || null,
        permission: form.permission, reference_no: form.reference_no || null,
        sage_num: form.sage_num || null, payroll_number: form.payroll_number || null,
        login_code: form.password,
        start_date: form.start_date || null, employment_status: form.employment_status,
        employment_type: form.employment_type, manager: form.manager || null,
        role_title: form.role_title || null, salary: form.salary || null,
        status: "Active",
        tags: tags,
      } as any);
      if (error) throw error;
      toast({ title: "Team Member Added", description: `${name} has been added successfully.` });
      navigate("/caregivers");
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to add team member.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscard = () => setShowDiscard(true);

  const inputCn = (field: keyof FormData) =>
    `bg-card border-border ${errors[field] ? "border-destructive" : ""}`;

  const selectField = (field: keyof FormData, placeholder: string, options: string[]) => (
    <div>
      <Select value={form[field]} onValueChange={(v) => set(field, v)}>
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
        value={form[field]}
        onChange={(e) => set(field, e.target.value)}
        className={inputCn(field)}
      />
      {errors[field] && <p className="text-xs text-destructive mt-1">{errors[field]}</p>}
    </div>
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
              <h1 className="text-2xl font-bold text-foreground">Add Team Member</h1>
              <p className="text-sm text-muted-foreground">Fill in all required fields marked with *</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDiscard}>Discard</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {submitting ? "Saving..." : "Save Team Member"}
            </Button>
          </div>
        </div>

        {/* Staff Detail */}
        <Card>
          <SectionHeader icon={User} title="Staff Detail" />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldRow label="Title" required>{inputField("title", "e.g. Mr, Mrs, Ms")}</FieldRow>
            <FieldRow label="Forename" required>{inputField("forename", "First name")}</FieldRow>
            <FieldRow label="Surname" required>{inputField("surname", "Last name")}</FieldRow>
            <FieldRow label="Preferred Name">{inputField("preferred_name", "Preferred name")}</FieldRow>
            <FieldRow label="Alias">{inputField("alias", "Alias")}</FieldRow>
            <FieldRow label="Suffix">{inputField("suffix", "e.g. Jr, Sr")}</FieldRow>
            <FieldRow label="Sex Assigned At Birth" required>{selectField("sex_assigned_at_birth", "Choose one...", SEX_OPTIONS)}</FieldRow>
            <FieldRow label="Gender">{selectField("gender", "Choose one...", GENDER_OPTIONS)}</FieldRow>
            <FieldRow label="Sexual Orientation">{selectField("sexual_orientation", "Choose one...", SEXUAL_ORIENTATION_OPTIONS)}</FieldRow>
            <FieldRow label="DOB" required>{inputField("dob", "", "date")}</FieldRow>
            <FieldRow label="Ethnicity" required>{selectField("ethnicity", "Choose one...", ETHNICITY_OPTIONS)}</FieldRow>
            <FieldRow label="Marital Status">{selectField("marital_status", "Choose one...", MARITAL_STATUS_OPTIONS)}</FieldRow>
            <FieldRow label="Religion">{selectField("religion", "Choose one...", RELIGION_OPTIONS)}</FieldRow>
            <FieldRow label="NI Number">{inputField("ni_number", "e.g. AB123456C")}</FieldRow>
            <FieldRow label="Is Driver?" required>{selectField("is_driver", "Choose one...", ["Yes","No"])}</FieldRow>
          </CardContent>
        </Card>

        {/* Address Details */}
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
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <SectionHeader icon={Phone} title="Contact Details" />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldRow label="Home Phone Number">{inputField("home_phone", "Home phone", "tel")}</FieldRow>
            <FieldRow label="Work Number">{inputField("work_number", "Work phone", "tel")}</FieldRow>
            <FieldRow label="Work Email">{inputField("work_email", "Work email", "email")}</FieldRow>
            <FieldRow label="Personal Number">{inputField("personal_number", "Personal phone", "tel")}</FieldRow>
            <FieldRow label="Personal Email">{inputField("personal_email", "Personal email", "email")}</FieldRow>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <SectionHeader icon={Building} title="Account Details" />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldRow label="Permission" required>{selectField("permission", "Choose one...", PERMISSION_OPTIONS)}</FieldRow>
            <FieldRow label="Reference No">{inputField("reference_no", "Reference number")}</FieldRow>
            <FieldRow label="Sage Number">{inputField("sage_num", "Sage number")}</FieldRow>
            <FieldRow label="Payroll Number">{inputField("payroll_number", "Payroll number")}</FieldRow>
            <FieldRow label="Password" required>{inputField("password", "Password", "password")}</FieldRow>
            <FieldRow label="Repeat Password" required>{inputField("repeat_password", "Repeat password", "password")}</FieldRow>
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card>
          <SectionHeader icon={Briefcase} title="Employment Details" />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldRow label="Start Date" required>{inputField("start_date", "", "date")}</FieldRow>
            <FieldRow label="Employment Status" required>{selectField("employment_status", "Choose one...", EMPLOYMENT_STATUS_OPTIONS)}</FieldRow>
            <FieldRow label="Employment Type" required>{selectField("employment_type", "Choose one...", EMPLOYMENT_TYPE_OPTIONS)}</FieldRow>
            <FieldRow label="Manager">{selectField("manager", "Choose one...", MANAGER_OPTIONS)}</FieldRow>
            <FieldRow label="Role">{selectField("role_title", "Choose one...", ROLE_OPTIONS)}</FieldRow>
            <FieldRow label="Salary" required>{inputField("salary", "e.g. £25,000")}</FieldRow>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <SectionHeader icon={Tags} title="Tags" />
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Select applicable tags for this team member</p>
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
            {submitting ? "Saving..." : "Save Team Member"}
          </Button>
        </div>
      </div>

      {/* Discard confirmation */}
      <AlertDialog open={showDiscard} onOpenChange={setShowDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard addition?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discard this new team member? All entered data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/caregivers")}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
