
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
import { useToast } from "@/hooks/use-toast";
import { useUpdateCareGiver } from "@/hooks/use-care-data";
import {
  MapPin, Phone, Mail, Shield, Car, Calendar, User, Heart,
  AlertTriangle, Clock, Users, Pencil, Save, X,
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

function HoursGrid({ label, hours, editing, field, form, setForm }: {
  label: string; hours?: any; editing: boolean; field?: string; form?: any; setForm?: any;
}) {
  const h = hours ? (typeof hours === "string" ? JSON.parse(hours) : hours) : { week1: "00:00", week2: "00:00", week3: "00:00", week4: "00:00" };
  return (
    <div className="py-2">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <div className="grid grid-cols-4 gap-2">
        {["week1", "week2", "week3", "week4"].map((w, i) => (
          <div key={w} className="bg-muted rounded-lg px-2 py-2 text-center">
            <p className="text-[10px] font-medium text-muted-foreground">Week {i + 1}</p>
            {editing ? (
              <Input
                value={form?.[field!]?.[w] ?? h[w] ?? "00:00"}
                onChange={(e) => setForm?.({ ...form, [field!]: { ...(form?.[field!] || h), [w]: e.target.value } })}
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

export function CareGiverProfileDialog({ open, onOpenChange, caregiver }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const updateMutation = useUpdateCareGiver();
  const { toast } = useToast();

  useEffect(() => {
    if (caregiver) {
      setForm({
        name: caregiver.name ?? "",
        email: caregiver.email ?? "",
        phone: caregiver.phone ?? "",
        address: caregiver.address ?? "",
        login_code: caregiver.login_code ?? "",
        permission: caregiver.permission ?? "",
        role_title: caregiver.role_title ?? "",
        sage_num: caregiver.sage_num ?? "",
        dob: caregiver.dob ?? "",
        is_driver: caregiver.is_driver ?? false,
        dbs_ref: caregiver.dbs_ref ?? "",
        ethnicity: caregiver.ethnicity ?? "",
        dbs_update_service: caregiver.dbs_update_service ?? false,
        dbs_type: caregiver.dbs_type ?? "",
        allergies: caregiver.allergies ?? "",
        next_of_kin_name: caregiver.next_of_kin_name ?? "",
        next_of_kin_address: caregiver.next_of_kin_address ?? "",
        next_of_kin_phone: caregiver.next_of_kin_phone ?? "",
        requested_hours: caregiver.requested_hours ?? { week1: "00:00", week2: "00:00", week3: "00:00", week4: "00:00" },
        templated_hours: caregiver.templated_hours ?? { week1: "00:00", week2: "00:00", week3: "00:00", week4: "00:00" },
        status: caregiver.status ?? "Active",
      });
      setEditing(false);
    }
  }, [caregiver]);

  if (!caregiver) return null;

  const age = caregiver.dob
    ? `${Math.floor((Date.now() - new Date(caregiver.dob).getTime()) / 31557600000)}`
    : null;

  const refs = caregiver.care_giver_references
    ? typeof caregiver.care_giver_references === "string"
      ? JSON.parse(caregiver.care_giver_references)
      : caregiver.care_giver_references
    : [];

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id: caregiver.id, ...form });
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
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">{editing ? form.name : caregiver.name}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {caregiver.role_title || "Homecare Assistant"}
                </p>
                {caregiver.created_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Created: {new Date(caregiver.created_at).toLocaleDateString("en-GB")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={caregiver.status === "Active" ? "default" : "secondary"}
                className={caregiver.status === "Active" ? "bg-success/15 text-success border-0" : ""}
              >
                {caregiver.status}
              </Badge>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              ) : (
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(false); setForm({ ...form, ...caregiver }); }}>
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
              <TabsTrigger value="personal" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-sm">
                Personal
              </TabsTrigger>
              <TabsTrigger value="work" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-sm">
                Work & DBS
              </TabsTrigger>
              <TabsTrigger value="hours" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-sm">
                Hours
              </TabsTrigger>
              <TabsTrigger value="emergency" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-sm">
                Emergency
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="max-h-[55vh]">
            {/* Personal Tab */}
            <TabsContent value="personal" className="px-6 pb-6 mt-0">
              <SectionTitle title="Contact Details" />
              <Field icon={User} label="Full Name" value={caregiver.name} editing={editing} field="name" form={form} setForm={setForm} />
              <Field icon={MapPin} label="Address" value={caregiver.address} editing={editing} field="address" form={form} setForm={setForm} />
              <Field icon={Phone} label="Phone" value={caregiver.phone} editing={editing} field="phone" form={form} setForm={setForm} type="tel" />
              <Field icon={Mail} label="Email" value={caregiver.email} editing={editing} field="email" form={form} setForm={setForm} type="email" />

              <SectionTitle title="Personal Information" />
              <Field icon={Calendar} label="Date of Birth" value={caregiver.dob ? `${new Date(caregiver.dob).toLocaleDateString("en-GB")}${age ? ` (Age ${age})` : ""}` : null} editing={editing} field="dob" form={form} setForm={setForm} type="date" />
              <Field icon={User} label="Ethnicity" value={caregiver.ethnicity} editing={editing} field="ethnicity" form={form} setForm={setForm} />

              <SectionTitle title="Health" />
              {editing ? (
                <div className="py-2 space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">Allergies</Label>
                  <Textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="min-h-[60px] text-sm" placeholder="None recorded" />
                </div>
              ) : (
                <Field icon={AlertTriangle} label="Allergies" value={caregiver.allergies || "None recorded"} editing={false} />
              )}

              <div className="flex items-center gap-3 py-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Is Driver?</p>
                  {editing ? (
                    <Switch checked={form.is_driver} onCheckedChange={(v) => setForm({ ...form, is_driver: v })} />
                  ) : (
                    <Badge variant={caregiver.is_driver ? "default" : "secondary"} className="text-xs mt-0.5">
                      {caregiver.is_driver ? "Yes" : "No"}
                    </Badge>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Work & DBS Tab */}
            <TabsContent value="work" className="px-6 pb-6 mt-0">
              <SectionTitle title="Work Details" />
              <Field icon={Shield} label="Login Code" value={caregiver.login_code} editing={editing} field="login_code" form={form} setForm={setForm} />
              <Field icon={User} label="Permission" value={caregiver.permission} editing={editing} field="permission" form={form} setForm={setForm} />
              <Field icon={User} label="Role Title" value={caregiver.role_title} editing={editing} field="role_title" form={form} setForm={setForm} />
              <Field icon={User} label="Sage Number" value={caregiver.sage_num} editing={editing} field="sage_num" form={form} setForm={setForm} />

              <SectionTitle title="DBS Information" />
              <Field icon={Shield} label="DBS Reference" value={caregiver.dbs_ref} editing={editing} field="dbs_ref" form={form} setForm={setForm} />
              <Field icon={Shield} label="DBS Type" value={caregiver.dbs_type} editing={editing} field="dbs_type" form={form} setForm={setForm} />
              <div className="flex items-center gap-3 py-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">DBS Update Service</p>
                  {editing ? (
                    <Switch checked={form.dbs_update_service} onCheckedChange={(v) => setForm({ ...form, dbs_update_service: v })} />
                  ) : (
                    <Badge variant={caregiver.dbs_update_service ? "default" : "secondary"} className="text-xs mt-0.5">
                      {caregiver.dbs_update_service ? "Registered" : "Not Registered"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* References (read-only) */}
              {Array.isArray(refs) && refs.length > 0 && (
                <>
                  <SectionTitle title="References" />
                  {refs.map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 py-2 pl-7">
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.type}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </TabsContent>

            {/* Hours Tab */}
            <TabsContent value="hours" className="px-6 pb-6 mt-0">
              <SectionTitle title="Hours Overview" />
              <HoursGrid label="Requested Hours" hours={caregiver.requested_hours} editing={editing} field="requested_hours" form={form} setForm={setForm} />
              <HoursGrid label="Templated Hours" hours={caregiver.templated_hours} editing={editing} field="templated_hours" form={form} setForm={setForm} />
            </TabsContent>

            {/* Emergency Tab */}
            <TabsContent value="emergency" className="px-6 pb-6 mt-0">
              <SectionTitle title="Next of Kin" />
              <Field icon={Users} label="Name" value={caregiver.next_of_kin_name} editing={editing} field="next_of_kin_name" form={form} setForm={setForm} />
              <Field icon={MapPin} label="Address" value={caregiver.next_of_kin_address} editing={editing} field="next_of_kin_address" form={form} setForm={setForm} />
              <Field icon={Phone} label="Phone" value={caregiver.next_of_kin_phone} editing={editing} field="next_of_kin_phone" form={form} setForm={setForm} type="tel" />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
