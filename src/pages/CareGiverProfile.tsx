import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useCareGiver, useUpdateCareGiver } from "@/hooks/use-care-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Pencil, Save, X, User, MapPin, Phone, Mail,
  Shield, Car, Calendar, AlertTriangle, Users, Clock,
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

function HoursRow({ hours }: { hours: any }) {
  const h = hours ? (typeof hours === "string" ? JSON.parse(hours) : hours) : {};
  return (
    <div className="flex gap-6 flex-wrap">
      {["week1", "week2", "week3", "week4"].map((w, i) => (
        <div key={w}>
          <span className="text-xs text-muted-foreground font-medium">Week {i + 1}:</span>{" "}
          <span className="text-sm font-semibold text-foreground">{h[w] || "00:00"}</span>
        </div>
      ))}
    </div>
  );
}

const CareGiverProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: cg, isLoading } = useCareGiver(id);
  const updateMutation = useUpdateCareGiver();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (cg) {
      setForm({
        name: cg.name ?? "", email: cg.email ?? "", phone: cg.phone ?? "",
        address: cg.address ?? "", login_code: cg.login_code ?? "",
        permission: cg.permission ?? "", role_title: cg.role_title ?? "",
        sage_num: cg.sage_num ?? "", dob: cg.dob ?? "",
        is_driver: cg.is_driver ?? false, dbs_ref: cg.dbs_ref ?? "",
        ethnicity: cg.ethnicity ?? "", dbs_update_service: cg.dbs_update_service ?? false,
        dbs_type: cg.dbs_type ?? "", allergies: cg.allergies ?? "",
        next_of_kin_name: cg.next_of_kin_name ?? "",
        next_of_kin_address: cg.next_of_kin_address ?? "",
        next_of_kin_phone: cg.next_of_kin_phone ?? "",
        status: cg.status ?? "Active",
      });
    }
  }, [cg]);

  const handleSave = async () => {
    if (!cg) return;
    try {
      await updateMutation.mutateAsync({ id: cg.id, ...form });
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

  if (!cg) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Care giver not found.</p>
          <Button variant="link" onClick={() => navigate("/caregivers")}>Back to list</Button>
        </div>
      </AppLayout>
    );
  }

  const age = cg.dob ? Math.floor((Date.now() - new Date(cg.dob).getTime()) / 31557600000) : null;
  const refs = cg.care_giver_references
    ? typeof cg.care_giver_references === "string" ? JSON.parse(cg.care_giver_references) : cg.care_giver_references
    : [];

  const set = (field: string) => (v: string) => setForm({ ...form, [field]: v });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/caregivers")} className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Care Givers
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
              {/* Avatar */}
              <div className="h-20 w-20 rounded-2xl bg-primary/15 border-2 border-primary/20 flex items-center justify-center shrink-0">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">{cg.name}</h1>
                  <Badge
                    variant={cg.status === "Active" ? "default" : "secondary"}
                    className={cg.status === "Active" ? "bg-success/15 text-success border-0" : ""}
                  >
                    {cg.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{cg.role_title || "Homecare Assistant"}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                  {cg.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{cg.phone}</span>}
                  {cg.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{cg.email}</span>}
                </div>
                {cg.created_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    User Created: {new Date(cg.created_at).toLocaleDateString("en-GB")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details (2-col span) */}
          <div className="lg:col-span-2 space-y-0">
            <Card className="border border-border">
              <CardContent className="p-6">
                {editing ? (
                  <div className="space-y-5">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Personal Details</h2>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <EditField label="Full Name" value={form.name} onChange={set("name")} />
                      <EditField label="Email" value={form.email} onChange={set("email")} type="email" />
                      <EditField label="Phone" value={form.phone} onChange={set("phone")} type="tel" />
                      <EditField label="Address" value={form.address} onChange={set("address")} />
                      <EditField label="Date of Birth" value={form.dob} onChange={set("dob")} type="date" />
                      <EditField label="Ethnicity" value={form.ethnicity} onChange={set("ethnicity")} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={form.is_driver} onCheckedChange={(v) => setForm({ ...form, is_driver: v })} />
                      <Label className="text-sm">Is Driver</Label>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Allergies</Label>
                      <Textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="min-h-[60px] text-sm" />
                    </div>

                    <h2 className="text-sm font-bold uppercase tracking-widest text-primary pt-4">Work Details</h2>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <EditField label="Login Code" value={form.login_code} onChange={set("login_code")} />
                      <EditField label="Permission" value={form.permission} onChange={set("permission")} />
                      <EditField label="Role Title" value={form.role_title} onChange={set("role_title")} />
                      <EditField label="Sage Number" value={form.sage_num} onChange={set("sage_num")} />
                    </div>

                    <h2 className="text-sm font-bold uppercase tracking-widest text-primary pt-4">DBS Information</h2>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <EditField label="DBS Reference" value={form.dbs_ref} onChange={set("dbs_ref")} />
                      <EditField label="DBS Type" value={form.dbs_type} onChange={set("dbs_type")} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={form.dbs_update_service} onCheckedChange={(v) => setForm({ ...form, dbs_update_service: v })} />
                      <Label className="text-sm">Registered to DBS Update Service</Label>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Contact Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-1">
                      <InfoItem icon={MapPin} label="Address" value={cg.address} />
                      <InfoItem icon={Phone} label="Phone" value={cg.phone} />
                      <InfoItem icon={Mail} label="Email" value={cg.email} />
                    </div>

                    <SectionTitle title="Personal Information" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-1">
                      <InfoItem icon={Calendar} label="DOB (Age)" value={cg.dob ? `${new Date(cg.dob).toLocaleDateString("en-GB")} (${age})` : null} />
                      <InfoItem icon={User} label="Ethnicity" value={cg.ethnicity} />
                      <InfoItem icon={Car} label="Is Driver?" value={cg.is_driver ? "Yes" : "No"} />
                      <InfoItem icon={AlertTriangle} label="Allergies" value={cg.allergies || "None"} />
                    </div>

                    <SectionTitle title="Work Details" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-1">
                      <InfoItem icon={Shield} label="Login Code" value={cg.login_code} />
                      <InfoItem icon={User} label="Permission" value={cg.permission} />
                      <InfoItem icon={User} label="Role" value={cg.role_title} />
                      <InfoItem icon={User} label="Sage Num" value={cg.sage_num} />
                    </div>

                    <SectionTitle title="DBS Information" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1">
                      <InfoItem icon={Shield} label="DBS Ref" value={cg.dbs_ref} />
                      <InfoItem icon={Shield} label="DBS Type" value={cg.dbs_type} />
                      <div className="flex items-center gap-3 py-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">DBS Update Service</p>
                          <Badge variant={cg.dbs_update_service ? "default" : "secondary"} className="text-xs mt-0.5">
                            {cg.dbs_update_service ? "Registered" : "Not Registered"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* References */}
                    {Array.isArray(refs) && refs.length > 0 && (
                      <>
                        <SectionTitle title="References" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {refs.map((r: any, i: number) => (
                            <div key={i} className="bg-muted/50 rounded-lg p-3">
                              <p className="text-sm font-medium text-foreground">{r.name}</p>
                              <p className="text-xs text-muted-foreground">{r.type}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hours */}
            <Card className="border border-border">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Requested Hours</h3>
                <Separator className="mb-3" />
                <HoursRow hours={cg.requested_hours} />
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mt-5 mb-3">Templated Hours</h3>
                <Separator className="mb-3" />
                <HoursRow hours={cg.templated_hours} />
              </CardContent>
            </Card>

            {/* Next of Kin */}
            <Card className="border border-border">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Next of Kin</h3>
                <Separator className="mb-3" />
                {editing ? (
                  <div className="space-y-3">
                    <EditField label="Name" value={form.next_of_kin_name} onChange={set("next_of_kin_name")} />
                    <EditField label="Address" value={form.next_of_kin_address} onChange={set("next_of_kin_address")} />
                    <EditField label="Phone" value={form.next_of_kin_phone} onChange={set("next_of_kin_phone")} type="tel" />
                  </div>
                ) : (
                  <>
                    <InfoItem icon={Users} label="Name" value={cg.next_of_kin_name} />
                    <InfoItem icon={MapPin} label="Address" value={cg.next_of_kin_address} />
                    <InfoItem icon={Phone} label="Phone" value={cg.next_of_kin_phone} />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CareGiverProfile;
