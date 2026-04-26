import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUpdateCareReceiver, useCareGivers } from "@/hooks/use-care-data";
import { toast } from "sonner";
import {
  User as UserIcon, Stethoscope, Pill, Pencil, Plus, Star,
  GraduationCap, ShieldAlert, Link2, History as HistoryIcon, Trash2,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CareReceiver = Tables<"care_receivers">;

/* ------------------------- helpers ------------------------- */

const Row = ({ label, value, accentValue }: { label: string; value?: any; accentValue?: boolean }) => (
  <div className="flex flex-wrap items-baseline gap-1.5 py-[3px] text-[12px]">
    <span className="font-semibold text-foreground">{label}:</span>
    <span className={accentValue ? "text-destructive" : "text-muted-foreground"}>
      {value === null || value === undefined || value === "" ? "" : String(value)}
    </span>
  </div>
);

const SectionTitle = ({ children, icon: Icon, className }: { children: React.ReactNode; icon?: any; className?: string }) => (
  <div className={`flex items-center gap-1.5 text-[13px] font-medium text-primary pb-1.5 mb-2 border-b border-primary/30 ${className ?? ""}`}>
    {Icon && <Icon className="h-3.5 w-3.5" />}
    {children}
  </div>
);

/* ------------------------- main ------------------------- */

export function ReceiverDetailedProfileTab({ cr }: { cr: CareReceiver }) {
  const updateMutation = useUpdateCareReceiver();
  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [editAddrOpen, setEditAddrOpen] = useState(false);
  const [editTagsOpen, setEditTagsOpen] = useState(false);
  const [editHoursOpen, setEditHoursOpen] = useState(false);
  const [editMedicalOpen, setEditMedicalOpen] = useState(false);
  const [editServiceDatesOpen, setEditServiceDatesOpen] = useState(false);

  const phone = (cr as any).phone_number ?? null;
  const phoneOnApp = (cr as any).phone_appears_on_app ?? true;

  const requested = (cr as any).requested_hours
    ? typeof (cr as any).requested_hours === "string"
      ? JSON.parse((cr as any).requested_hours)
      : (cr as any).requested_hours
    : { week1: "00:00", week2: "00:00", week3: "00:00", week4: "00:00" };

  const save = async (patch: Partial<CareReceiver> & Record<string, any>) => {
    try {
      await updateMutation.mutateAsync({ id: cr.id, ...patch } as any);
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    }
  };

  return (
    <div className="space-y-4">
      {/* ============ Service User Details ============ */}
      <Card className="overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
            <UserIcon className="h-3.5 w-3.5" /> Service User Details
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" className="h-7 px-2.5 text-[11px] bg-primary hover:bg-primary/90 text-primary-foreground gap-1" onClick={() => setEditTagsOpen(true)}>
              <Pencil className="h-3 w-3" /> Edit Tags
            </Button>
            <Button size="sm" className="h-7 px-2.5 text-[11px] bg-primary hover:bg-primary/90 text-primary-foreground gap-1" onClick={() => setEditAddrOpen(true)}>
              <Pencil className="h-3 w-3" /> Edit Address
            </Button>
            <Button size="sm" className="h-7 px-2.5 text-[11px] bg-amber-500 hover:bg-amber-600 text-white gap-1" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-4 p-4">
          {/* User Details */}
          <div>
            <SectionTitle>User Details</SectionTitle>
            <Row label="Sub Status" value={(cr as any).sub_status ?? "None"} />
            <Row label="Title" value={(cr as any).title} />
            <Row label="Forename" value={(cr as any).forename ?? cr.name?.split(" ")[0]} />
            <Row label="Surname" value={(cr as any).surname ?? cr.name?.split(" ").slice(1).join(" ")} />
            <Row label="Alias" value={(cr as any).alias} />
            <Row label="Suffix" value={(cr as any).suffix} />
            <Row label="Pref" value={(cr as any).pref} />
            <Row label="Sex Assigned At Birth" value={(cr as any).sex_assigned_at_birth} />
            <Row label="Gender" value={(cr as any).gender ?? "N/A"} />
            <Row label="Sexual Orientation" value={(cr as any).sexual_orientation ?? "N/A"} />
            <Row label="DOB" value={(cr as any).dob} />
            <Row label="Ethnicity" value={cr.ethnicity} />
            <Row label="Marital Status" value={(cr as any).marital_status} />
            <Row label="Religion" value={(cr as any).religion} />
            <Row label="NI Number" value={(cr as any).ni_number} />
            <Row label="Authority Ref" value={(cr as any).authority_ref} />
            <Row label="Social Services ID" value={(cr as any).social_services_id} />
            <Row label="CM2000 Link" value={(cr as any).cm2000_link ?? "No"} />
            <Row label="Keysafe" value={(cr as any).keysafe} />
            <Row label="Mediverify" value={(cr as any).mediverify} />
            <Row label="Preferred Language" value={(cr as any).preferred_language ?? cr.language ?? "English"} />
          </div>

          {/* Contact Details + Preferred Hours */}
          <div className="space-y-5">
            <div>
              <SectionTitle>Contact Details</SectionTitle>
              <div className="flex flex-wrap items-baseline gap-1.5 py-[3px] text-[12px]">
                <span className="font-semibold text-foreground">Phone Number</span>
                {phone && (
                  <span className={phoneOnApp ? "text-destructive text-[11px]" : "text-muted-foreground text-[11px]"}>
                    ({phoneOnApp ? "Appears on the App" : "Hidden from App"})
                  </span>
                )}
                <span className="text-muted-foreground">: {phone}</span>
              </div>
              <Row label="Mobile Num 1" value={(cr as any).mobile_num_1} />
              <Row label="Mobile Num 2" value={(cr as any).mobile_num_2} />
              <Row label="Email 1" value={(cr as any).email_1} />
              <Row label="Email 2" value={(cr as any).email_2} />
            </div>

            <div>
              <SectionTitle>Preferred Hours</SectionTitle>
              <Row label="Preferred Hours" value={cr.preferred_hours} />
            </div>
          </div>

          {/* Account Details */}
          <div>
            <SectionTitle>Account Details</SectionTitle>
            <Row label="Reference No" value={(cr as any).reference_no} />
            <Row label="Carer Pref" value={(cr as any).carer_pref ?? cr.preference ?? "Either"} />
            <Row label="Risk Rating" value={cr.risk_rating ?? "None"} />
            <Row label="Risk Rating Description" value={(cr as any).risk_rating_description ?? "None"} />
            <Row label="Under Regulated Activity" value={(cr as any).under_regulated_activity ? "Yes" : "No"} />
            <Row label="NPC number" value={(cr as any).npc_number} />
            <Row label="Contract Type" value={(cr as any).contract_type ?? "Scheduled"} />
            <Row label="Area Name" value={(cr as any).area_name} />
          </div>
        </div>

        {/* NOK / Doctor / Pharmacy row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-4 px-4 pb-4">
          <div>
            <SectionTitle>Next Of Kin</SectionTitle>
            <Row label="Name" value={cr.next_of_kin} />
            <Row label="Address" value={cr.next_of_kin_address} />
            <Row label="Tel" value={cr.next_of_kin_phone} />
            <Row label="Tel 2" value={(cr as any).next_of_kin_phone_2} />
            <Row label="Mobile" value={(cr as any).next_of_kin_mobile} />
            <Row label="Email" value={cr.next_of_kin_email} />
            <Row label="Notes" value={(cr as any).next_of_kin_notes} />
          </div>
          <div>
            <SectionTitle icon={Stethoscope}>Doctor</SectionTitle>
            <Row label="Name" value={cr.doctor_name} />
            <Row label="Address" value={cr.doctor_address} />
            <Row label="Phone Number 1" value={cr.doctor_phone} />
            <Row label="Email" value={cr.doctor_contact} />
          </div>
          <div>
            <SectionTitle icon={Pill}>Pharmacy</SectionTitle>
            <Row label="Name" value={cr.pharmacy_name} />
            <Row label="Address" value={cr.pharmacy_address} />
            <Row label="Phone Number 1" value={cr.pharmacy_phone} />
            <Row label="Email" value={(cr as any).pharmacy_email} />
          </div>
        </div>
      </Card>

      {/* ============ Onboarding ============ */}
      <OnboardingStrip cr={cr} onSave={(s) => save({ onboarding_status: s } as any)} />

      {/* ============ DNAR + Medical Login ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <DnarSettingsCard careReceiverId={cr.id} />
        <MedicalLoginCard cr={cr} onEdit={() => setEditMedicalOpen(true)} />
      </div>

      {/* ============ Qualifications + Service Dates ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <QualificationRequirementsCard careReceiverId={cr.id} />
        <ServiceDatesCard cr={cr} onEdit={() => setEditServiceDatesOpen(true)} />
      </div>

      {/* ============ Programs of Care ============ */}
      <Card className="overflow-hidden border-t-2 border-t-primary/40">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
            <Link2 className="h-3.5 w-3.5 text-primary" /> Programs of Care
          </div>
          <Button size="sm" className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
            <Plus className="h-3 w-3" /> Link Program of Care
          </Button>
        </div>
        <div className="px-4 py-3 text-[12px] text-muted-foreground">
          This feature allows you to set a program of care for a client. This can be useful for grouping your clients by the type of care their are receiving. You may only have one active at any one time.
        </div>
      </Card>

      {/* ============ User Preferences ============ */}
      <UserPreferencesCard careReceiverId={cr.id} careReceiverName={cr.name} />

      {/* ============ Requested Hours ============ */}
      <Card className="overflow-hidden border-t-2 border-t-primary/40">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
            <HistoryIcon className="h-3.5 w-3.5 text-primary" /> Requested Hours
          </div>
          <Button size="sm" className="h-7 px-2.5 text-[11px] bg-amber-500 hover:bg-amber-600 text-white gap-1" onClick={() => setEditHoursOpen(true)}>
            <Pencil className="h-3 w-3" /> Edit weekly hours
          </Button>
        </div>
        <div className="grid grid-cols-4 px-4 py-3 text-[12px]">
          {(["week1","week2","week3","week4"] as const).map((w, i) => (
            <div key={w}>
              <span className="font-semibold text-foreground">Week {i + 1}: </span>
              <span className="text-muted-foreground">{requested[w] || "00:00"}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ============ Dialogs ============ */}
      <EditDetailsDialog open={editOpen} onOpenChange={setEditOpen} cr={cr} onSave={save} />
      <EditAddressDialog open={editAddrOpen} onOpenChange={setEditAddrOpen} cr={cr} onSave={save} />
      <EditTagsDialog open={editTagsOpen} onOpenChange={setEditTagsOpen} cr={cr} onSave={save} />
      <EditHoursDialog open={editHoursOpen} onOpenChange={setEditHoursOpen} cr={cr} onSave={save} />
      <EditMedicalDialog open={editMedicalOpen} onOpenChange={setEditMedicalOpen} cr={cr} onSave={save} />
      <EditServiceDatesDialog open={editServiceDatesOpen} onOpenChange={setEditServiceDatesOpen} cr={cr} onSave={save} />
    </div>
  );
}

/* ============================================================
   Onboarding strip
============================================================ */
function OnboardingStrip({ cr, onSave }: { cr: CareReceiver; onSave: (s: string) => void }) {
  const status = (cr as any).onboarding_status ?? "None";
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(status);
  return (
    <Card className="overflow-hidden border-t-2 border-t-primary/40">
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="text-[13px]">
          <span className="font-semibold text-emerald-700 dark:text-emerald-500">Onboarding</span>
          <span className="text-muted-foreground"> current status: </span>
          <span className="italic text-muted-foreground">{status}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white">Link Actions</Button>
          <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px]">View History</Button>
        </div>
      </div>
      <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
        <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px]">View Completed Actions</Button>
        <Button size="sm" className="h-7 px-2.5 text-[11px] bg-amber-500 hover:bg-amber-600 text-white" onClick={() => { setDraft(status); setOpen(true); }}>
          Update Status
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Onboarding Status</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Status</Label>
            <Select value={draft || "None"} onValueChange={setDraft}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["None","Pending","In Progress","Awaiting Documents","Complete","On Hold"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { onSave(draft); setOpen(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ============================================================
   DNAR Settings (full CRUD)
============================================================ */
function DnarSettingsCard({ careReceiverId }: { careReceiverId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState({ status: "Active", applies_from: "", applies_until: "", document_ref: "", notes: "" });
  const [delId, setDelId] = useState<string | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["receiver_dnar_settings", careReceiverId],
    queryFn: async () => {
      const { data, error } = await supabase.from("receiver_dnar_settings" as any).select("*").eq("care_receiver_id", careReceiverId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        care_receiver_id: careReceiverId,
        status: draft.status,
        applies_from: draft.applies_from || null,
        applies_until: draft.applies_until || null,
        document_ref: draft.document_ref || null,
        notes: draft.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from("receiver_dnar_settings" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("receiver_dnar_settings" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receiver_dnar_settings", careReceiverId] });
      setOpen(false); setEditing(null);
      toast.success(editing ? "DNAR setting updated" : "DNAR setting added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receiver_dnar_settings" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receiver_dnar_settings", careReceiverId] });
      setDelId(null);
      toast.success("Removed");
    },
  });

  return (
    <Card className="overflow-hidden border-t-2 border-t-primary/40">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
          <ShieldAlert className="h-3.5 w-3.5 text-primary" /> Service User Do Not Attempt Resuscitation (DNAR) Settings
        </div>
        <Button size="sm" className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => { setEditing(null); setDraft({ status: "Active", applies_from: "", applies_until: "", document_ref: "", notes: "" }); setOpen(true); }}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
      <div className="px-4 py-3 text-[12px] text-muted-foreground">
        If this Service User has DNAR (do not attempt resuscitation) in place you can replicate that setting here. This will be shown around the entire system when viewing the service users profile. Please be very careful turning this setting on as getting this wrong is a matter of life and death. The user that turns this on will be clearly logged in the system and may be held accountable. You must put your password in to turn this setting on or off.
      </div>
      <div className="px-4 pb-3 space-y-1.5">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Below you will find the DNAR history for this service user.</p>
        {rows.length === 0 ? (
          <p className="text-[12px] text-muted-foreground italic py-2">No DNAR records.</p>
        ) : (
          <div className="border border-border rounded">
            <div className="grid grid-cols-[1fr_120px_120px_140px_60px] gap-2 px-2 py-1.5 bg-muted/40 text-[11px] font-semibold text-muted-foreground border-b border-border">
              <div>Status / Notes</div><div>From</div><div>Until</div><div>Doc Ref</div><div className="text-right">Actions</div>
            </div>
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_120px_120px_140px_60px] gap-2 px-2 py-2 text-[12px] border-b border-border last:border-b-0">
                <div className="space-y-0.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.status === "Active" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{r.status}</span>
                  {r.notes && <p className="text-muted-foreground text-[11px] truncate">{r.notes}</p>}
                </div>
                <div className="text-muted-foreground">{r.applies_from ?? "—"}</div>
                <div className="text-muted-foreground">{r.applies_until ?? "—"}</div>
                <div className="text-muted-foreground truncate">{r.document_ref ?? "—"}</div>
                <div className="flex items-center gap-0.5 justify-end">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditing(r); setDraft({ status: r.status, applies_from: r.applies_from ?? "", applies_until: r.applies_until ?? "", document_ref: r.document_ref ?? "", notes: r.notes ?? "" }); setOpen(true); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => setDelId(r.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit DNAR Setting" : "Add DNAR Setting"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Active","Inactive","Revoked"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Applies From</Label><Input type="date" value={draft.applies_from} onChange={e => setDraft({ ...draft, applies_from: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Applies Until</Label><Input type="date" value={draft.applies_until} onChange={e => setDraft({ ...draft, applies_until: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Document Ref</Label><Input value={draft.document_ref} onChange={e => setDraft({ ...draft, document_ref: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Notes</Label><Textarea rows={3} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete DNAR record?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => delId && del.mutate(delId)}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/* ============================================================
   Medical Login Details
============================================================ */
function MedicalLoginCard({ cr, onEdit }: { cr: CareReceiver; onEdit: () => void }) {
  const [reveal, setReveal] = useState(false);
  return (
    <Card className="overflow-hidden border-t-2 border-t-primary/40">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
          <UserIcon className="h-3.5 w-3.5 text-primary" /> Medical Login Details
        </div>
        <Button size="sm" className="h-7 px-2.5 text-[11px] bg-amber-500 hover:bg-amber-600 text-white gap-1" onClick={onEdit}>
          <Pencil className="h-3 w-3" /> Edit
        </Button>
      </div>
      <div className="px-4 py-3 space-y-1">
        <Row label="Company Number" value={(cr as any).medical_company_number} />
        <Row label="Service User Number" value={(cr as any).medical_service_user_number} />
        <div className="flex flex-wrap items-baseline gap-1.5 py-[3px] text-[12px]">
          <span className="font-semibold text-foreground">Password:</span>
          <span className="text-muted-foreground font-mono">
            {reveal ? (cr as any).medical_password ?? "" : ((cr as any).medical_password ? "•".repeat(Math.min(8, ((cr as any).medical_password as string).length)) : "")}
          </span>
          {(cr as any).medical_password && (
            <button type="button" onClick={() => setReveal(!reveal)} className="text-primary text-[11px] underline-offset-2 hover:underline">
              {reveal ? "hide" : "show"}
            </button>
          )}
        </div>
        <p className="text-[11px] text-destructive italic pt-2">This login will display all Service User medical info and is intended for doctor/paramedic use</p>
      </div>
    </Card>
  );
}

/* ============================================================
   Qualification Requirements
============================================================ */
function QualificationRequirementsCard({ careReceiverId }: { careReceiverId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState({ qualification: "", mandatory: true, notes: "" });
  const [delId, setDelId] = useState<string | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["receiver_qual_req", careReceiverId],
    queryFn: async () => {
      const { data, error } = await supabase.from("receiver_qualification_requirements" as any).select("*").eq("care_receiver_id", careReceiverId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = { care_receiver_id: careReceiverId, qualification: draft.qualification.trim(), mandatory: draft.mandatory, notes: draft.notes || null };
      if (!payload.qualification) throw new Error("Qualification required");
      if (editing) {
        const { error } = await supabase.from("receiver_qualification_requirements" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("receiver_qualification_requirements" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_qual_req", careReceiverId] }); setOpen(false); setEditing(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("receiver_qualification_requirements" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_qual_req", careReceiverId] }); setDelId(null); toast.success("Removed"); },
  });

  return (
    <Card className="overflow-hidden border-t-2 border-t-primary/40">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
          <GraduationCap className="h-3.5 w-3.5 text-primary" /> Service User Qualification Requirements
        </div>
        <Button size="sm" className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => { setEditing(null); setDraft({ qualification: "", mandatory: true, notes: "" }); setOpen(true); }}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
      <div className="px-4 py-3">
        {rows.length === 0 ? (
          <p className="text-[12px] text-muted-foreground italic py-2">No qualification requirements set.</p>
        ) : (
          <div className="border border-border rounded">
            <div className="grid grid-cols-[1fr_120px_1fr_60px] gap-2 px-2 py-1.5 bg-muted/40 text-[11px] font-semibold text-muted-foreground border-b border-border">
              <div>Qualification</div><div>Mandatory</div><div>Notes</div><div className="text-right">Actions</div>
            </div>
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_120px_1fr_60px] gap-2 px-2 py-2 text-[12px] border-b border-border last:border-b-0 items-center">
                <div className="text-foreground">{r.qualification}</div>
                <div><span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.mandatory ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{r.mandatory ? "Mandatory" : "Optional"}</span></div>
                <div className="text-muted-foreground truncate">{r.notes ?? "—"}</div>
                <div className="flex items-center gap-0.5 justify-end">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditing(r); setDraft({ qualification: r.qualification, mandatory: r.mandatory, notes: r.notes ?? "" }); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => setDelId(r.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Qualification Requirement" : "Add Qualification Requirement"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Qualification *</Label><Input value={draft.qualification} onChange={e => setDraft({ ...draft, qualification: e.target.value })} placeholder="e.g. Manual Handling, Medication Admin" /></div>
            <div className="flex items-center gap-2"><Switch checked={draft.mandatory} onCheckedChange={(v) => setDraft({ ...draft, mandatory: v })} /><Label className="text-xs">Mandatory</Label></div>
            <div className="space-y-1"><Label className="text-xs">Notes</Label><Textarea rows={3} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>{editing ? "Save" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove qualification requirement?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => delId && del.mutate(delId)}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/* ============================================================
   Service Dates
============================================================ */
function ServiceDatesCard({ cr, onEdit }: { cr: CareReceiver; onEdit: () => void }) {
  return (
    <Card className="overflow-hidden border-t-2 border-t-primary/40">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">Service Dates</div>
        <Button size="sm" className="h-7 px-2.5 text-[11px] bg-amber-500 hover:bg-amber-600 text-white gap-1" onClick={onEdit}>
          <Pencil className="h-3 w-3" /> Edit
        </Button>
      </div>
      <div className="px-4 py-3 space-y-1">
        <Row label="Start Date" value={(cr as any).service_start_date} />
        <Row label="Account Status" value={(cr as any).account_status ?? "Active"} />
        <p className="text-[11px] text-muted-foreground italic pt-2">To change the status of this account, click edit above</p>
      </div>
    </Card>
  );
}

/* ============================================================
   User Preferences (caregiver star ratings)
============================================================ */
function UserPreferencesCard({ careReceiverId, careReceiverName }: { careReceiverId: string; careReceiverName: string }) {
  const qc = useQueryClient();
  const { data: caregivers = [] } = useCareGivers();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ care_giver_id: string; rating: number; description: string }>({ care_giver_id: "", rating: 0, description: "" });
  const [search, setSearch] = useState("");
  const [delId, setDelId] = useState<string | null>(null);

  const { data: prefs = [] } = useQuery({
    queryKey: ["receiver_user_prefs", careReceiverId],
    queryFn: async () => {
      const { data, error } = await supabase.from("receiver_user_preferences" as any).select("*").eq("care_receiver_id", careReceiverId).order("rating", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const cgById = useMemo(() => Object.fromEntries(caregivers.map((c: any) => [c.id, c])), [caregivers]);

  const enriched = useMemo(() =>
    prefs.map((p) => ({ ...p, caregiver_name: cgById[p.care_giver_id]?.name ?? "Unknown caregiver" }))
      .filter((r) => !search.trim() || r.caregiver_name.toLowerCase().includes(search.toLowerCase()))
  , [prefs, cgById, search]);

  const upsert = useMutation({
    mutationFn: async () => {
      if (!draft.care_giver_id) throw new Error("Select a caregiver");
      const { error } = await supabase
        .from("receiver_user_preferences" as any)
        .upsert({ care_receiver_id: careReceiverId, care_giver_id: draft.care_giver_id, rating: draft.rating, description: draft.description || null }, { onConflict: "care_receiver_id,care_giver_id" } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_user_prefs", careReceiverId] }); setOpen(false); toast.success("Preference saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("receiver_user_preferences" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_user_prefs", careReceiverId] }); setDelId(null); toast.success("Removed"); },
  });

  const updateRating = useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      const { error } = await supabase.from("receiver_user_preferences" as any).update({ rating }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["receiver_user_prefs", careReceiverId] }),
  });

  return (
    <Card className="overflow-hidden border-t-2 border-t-primary/40">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> User Preferences
        </div>
        <Button size="sm" className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => { setDraft({ care_giver_id: "", rating: 0, description: "" }); setOpen(true); }}>
          <Plus className="h-3 w-3" /> Add Preference
        </Button>
      </div>
      <div className="px-4 py-3 text-[12px] text-amber-700 dark:text-amber-500 space-y-1">
        <p>You have the setting turned on for locking team member pref. This means if this service user access a team member less than 3, that team member will not be allowed to be assigned to the call. This is something to be mindful of when using the bulk actions as there will be no warning the team member has not been assigned in some instances, you need to double check. If there is no preference set between the service user and the team member, the team member will be allowed to be assigned and a default rating will be created between the two accounts at the min star level set in settings.</p>
        <p className="pt-2">Preferences show the team member→service user/service user→team member preference for the corresponding user to aid judgment when assigning team member to rotas. To edit a users preference click on their name in the table. Hovering over the stars will display the description for that users preference.</p>
      </div>

      <div className="px-4 pb-2 flex items-center justify-end gap-2">
        <Label className="text-xs">Search:</Label>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-7 w-48 text-xs" />
      </div>

      <div className="px-4 pb-4 overflow-x-auto">
        <table className="w-full text-[12px] border border-border rounded overflow-hidden">
          <thead className="bg-cyan-500 text-white">
            <tr>
              <th className="w-10 px-2 py-2"></th>
              <th className="text-left px-3 py-2 font-semibold">Service User Name</th>
              <th className="text-center px-3 py-2 font-semibold">→</th>
              <th className="text-left px-3 py-2 font-semibold bg-violet-400">Preference</th>
              <th className="text-left px-3 py-2 font-semibold bg-violet-400">Team Member Name</th>
              <th className="text-center px-3 py-2 font-semibold bg-violet-400">→</th>
              <th className="text-left px-3 py-2 font-semibold bg-violet-400">Preference</th>
              <th className="w-12 px-2 py-2 bg-violet-400"></th>
            </tr>
          </thead>
          <tbody>
            {enriched.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground italic">No preferences set</td></tr>
            ) : enriched.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-2 py-2"><Pencil className="h-3 w-3 text-muted-foreground" /></td>
                <td className="px-3 py-2 text-foreground bg-amber-500/10">{careReceiverName}</td>
                <td className="px-3 py-2 text-center text-cyan-600">→</td>
                <td className="px-3 py-2 bg-amber-500/10"><StarRating value={r.rating} onChange={(v) => updateRating.mutate({ id: r.id, rating: v })} title={r.description ?? ""} /></td>
                <td className="px-3 py-2 text-primary">{r.caregiver_name}</td>
                <td className="px-3 py-2 text-center text-violet-600">→</td>
                <td className="px-3 py-2 text-muted-foreground italic">{r.description || "No Preference"}</td>
                <td className="px-2 py-2"><Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => setDelId(r.id)}><Trash2 className="h-3 w-3" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-muted-foreground pt-2">Showing {enriched.length === 0 ? 0 : 1} to {enriched.length} of {enriched.length} entries</p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Team Member Preference</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Team Member</Label>
              <Select value={draft.care_giver_id} onValueChange={(v) => setDraft({ ...draft, care_giver_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                <SelectContent>{caregivers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rating</Label>
              <StarRating value={draft.rating} onChange={(v) => setDraft({ ...draft, rating: v })} title="" large />
            </div>
            <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Why this preference" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove preference?</AlertDialogTitle><AlertDialogDescription>This will remove the rating between this team member and service user.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => delId && del.mutate(delId)}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function StarRating({ value, onChange, title, large }: { value: number; onChange: (v: number) => void; title?: string; large?: boolean }) {
  const sz = large ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5" title={title}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className="hover:scale-110 transition-transform">
          <Star className={`${sz} ${n <= value ? "text-amber-500 fill-amber-500" : "text-muted-foreground/40"}`} />
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   Edit Dialogs
============================================================ */
function EditDetailsDialog({ open, onOpenChange, cr, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; cr: CareReceiver; onSave: (p: any) => void }) {
  const [d, setD] = useState<any>({});
  useMemo(() => { if (open) setD({ ...cr }); }, [open, cr]);
  const set = (k: string, v: any) => setD((prev: any) => ({ ...prev, [k]: v }));

  const fields: { k: string; label: string; type?: string }[] = [
    { k: "title", label: "Title" }, { k: "forename", label: "Forename" }, { k: "surname", label: "Surname" },
    { k: "alias", label: "Alias" }, { k: "suffix", label: "Suffix" }, { k: "pref", label: "Pref" },
    { k: "sex_assigned_at_birth", label: "Sex Assigned At Birth" }, { k: "gender", label: "Gender" }, { k: "sexual_orientation", label: "Sexual Orientation" },
    { k: "dob", label: "DOB", type: "date" }, { k: "ethnicity", label: "Ethnicity" }, { k: "marital_status", label: "Marital Status" },
    { k: "religion", label: "Religion" }, { k: "ni_number", label: "NI Number" }, { k: "authority_ref", label: "Authority Ref" },
    { k: "social_services_id", label: "Social Services ID" }, { k: "cm2000_link", label: "CM2000 Link" }, { k: "keysafe", label: "Keysafe" },
    { k: "mediverify", label: "Mediverify" }, { k: "preferred_language", label: "Preferred Language" },
    { k: "phone_number", label: "Phone Number" }, { k: "mobile_num_1", label: "Mobile Num 1" }, { k: "mobile_num_2", label: "Mobile Num 2" },
    { k: "email_1", label: "Email 1", type: "email" }, { k: "email_2", label: "Email 2", type: "email" },
    { k: "preferred_hours", label: "Preferred Hours" },
    { k: "reference_no", label: "Reference No" }, { k: "carer_pref", label: "Carer Pref" }, { k: "risk_rating", label: "Risk Rating" },
    { k: "risk_rating_description", label: "Risk Rating Description" }, { k: "npc_number", label: "NPC number" }, { k: "contract_type", label: "Contract Type" },
    { k: "area_name", label: "Area Name" }, { k: "sub_status", label: "Sub Status" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Service User Details</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f.k} className="space-y-1">
              <Label className="text-xs">{f.label}</Label>
              <Input type={f.type ?? "text"} value={d[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} className="h-8 text-xs" />
            </div>
          ))}
          <div className="col-span-2 flex items-center gap-2 pt-1">
            <Switch checked={!!d.phone_appears_on_app} onCheckedChange={(v) => set("phone_appears_on_app", v)} />
            <Label className="text-xs">Phone appears on App</Label>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Switch checked={!!d.under_regulated_activity} onCheckedChange={(v) => set("under_regulated_activity", v)} />
            <Label className="text-xs">Under Regulated Activity</Label>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Switch checked={!!d.dnacpr} onCheckedChange={(v) => set("dnacpr", v)} />
            <Label className="text-xs">DNACPR</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(d); onOpenChange(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditAddressDialog({ open, onOpenChange, cr, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; cr: CareReceiver; onSave: (p: any) => void }) {
  const [v, setV] = useState({ address: cr.address ?? "", next_of_kin_address: cr.next_of_kin_address ?? "", doctor_address: cr.doctor_address ?? "", pharmacy_address: cr.pharmacy_address ?? "" });
  useMemo(() => { if (open) setV({ address: cr.address ?? "", next_of_kin_address: cr.next_of_kin_address ?? "", doctor_address: cr.doctor_address ?? "", pharmacy_address: cr.pharmacy_address ?? "" }); }, [open, cr]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Edit Addresses</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label className="text-xs">Service User Address</Label><Textarea rows={2} value={v.address} onChange={e => setV({ ...v, address: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Next of Kin Address</Label><Textarea rows={2} value={v.next_of_kin_address} onChange={e => setV({ ...v, next_of_kin_address: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Doctor Address</Label><Textarea rows={2} value={v.doctor_address} onChange={e => setV({ ...v, doctor_address: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Pharmacy Address</Label><Textarea rows={2} value={v.pharmacy_address} onChange={e => setV({ ...v, pharmacy_address: e.target.value })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => { onSave(v); onOpenChange(false); }}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditTagsDialog({ open, onOpenChange, cr, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; cr: CareReceiver; onSave: (p: any) => void }) {
  const [text, setText] = useState(((cr as any).tags ?? []).join(", "));
  useMemo(() => { if (open) setText(((cr as any).tags ?? []).join(", ")); }, [open, cr]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Tags</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label className="text-xs">Tags (comma separated)</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Care Service Contract Reaffirmed, Service User pack issued, ..." />
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => { onSave({ tags: text.split(",").map(s => s.trim()).filter(Boolean) }); onOpenChange(false); }}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditHoursDialog({ open, onOpenChange, cr, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; cr: CareReceiver; onSave: (p: any) => void }) {
  const initial = (cr as any).requested_hours
    ? typeof (cr as any).requested_hours === "string" ? JSON.parse((cr as any).requested_hours) : (cr as any).requested_hours
    : { week1: "00:00", week2: "00:00", week3: "00:00", week4: "00:00" };
  const [h, setH] = useState(initial);
  useMemo(() => { if (open) setH(initial); }, [open]); // eslint-disable-line
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Requested Weekly Hours</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {(["week1","week2","week3","week4"] as const).map((w, i) => (
            <div key={w} className="space-y-1"><Label className="text-xs">Week {i+1}</Label><Input value={h[w] ?? "00:00"} onChange={(e) => setH({ ...h, [w]: e.target.value })} placeholder="00:00" /></div>
          ))}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => { onSave({ requested_hours: h }); onOpenChange(false); }}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditMedicalDialog({ open, onOpenChange, cr, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; cr: CareReceiver; onSave: (p: any) => void }) {
  const [v, setV] = useState({ medical_company_number: (cr as any).medical_company_number ?? "", medical_service_user_number: (cr as any).medical_service_user_number ?? "", medical_password: (cr as any).medical_password ?? "" });
  useMemo(() => { if (open) setV({ medical_company_number: (cr as any).medical_company_number ?? "", medical_service_user_number: (cr as any).medical_service_user_number ?? "", medical_password: (cr as any).medical_password ?? "" }); }, [open, cr]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Medical Login Details</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label className="text-xs">Company Number</Label><Input value={v.medical_company_number} onChange={(e) => setV({ ...v, medical_company_number: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Service User Number</Label><Input value={v.medical_service_user_number} onChange={(e) => setV({ ...v, medical_service_user_number: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Password</Label><Input type="password" value={v.medical_password} onChange={(e) => setV({ ...v, medical_password: e.target.value })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => { onSave(v); onOpenChange(false); }}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditServiceDatesDialog({ open, onOpenChange, cr, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; cr: CareReceiver; onSave: (p: any) => void }) {
  const [v, setV] = useState({ service_start_date: (cr as any).service_start_date ?? "", account_status: (cr as any).account_status ?? "Active" });
  useMemo(() => { if (open) setV({ service_start_date: (cr as any).service_start_date ?? "", account_status: (cr as any).account_status ?? "Active" }); }, [open, cr]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Service Dates</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label className="text-xs">Start Date</Label><Input type="date" value={v.service_start_date} onChange={(e) => setV({ ...v, service_start_date: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Account Status</Label>
            <Select value={v.account_status} onValueChange={(s) => setV({ ...v, account_status: s })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Active","On Hold","Discharged"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => { onSave(v); onOpenChange(false); }}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
