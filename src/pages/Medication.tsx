import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCareGiver } from "@/hooks/use-care-data";
import { MemberSidebar, MemberTopBar } from "@/components/member/MemberSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Plus, Syringe, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Vaccination = {
  id: string;
  care_giver_id: string;
  vaccine_name: string;
  dose: string | null;
  date_administered: string | null;
  expiry_date: string | null;
  batch_number: string | null;
  administered_by: string | null;
  notes: string | null;
};

const emptyDraft = {
  vaccine_name: "",
  dose: "",
  date_administered: "",
  expiry_date: "",
  batch_number: "",
  administered_by: "",
  notes: "",
};

export default function Medication() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: cg } = useCareGiver(id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vaccination | null>(null);
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: vaccinations = [] } = useQuery({
    queryKey: ["caregiver_vaccinations", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caregiver_vaccinations" as any)
        .select("*")
        .eq("care_giver_id", id!)
        .order("date_administered", { ascending: false });
      if (error) throw error;
      return data as unknown as Vaccination[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        care_giver_id: id!,
        vaccine_name: draft.vaccine_name.trim(),
        dose: draft.dose || null,
        date_administered: draft.date_administered || null,
        expiry_date: draft.expiry_date || null,
        batch_number: draft.batch_number || null,
        administered_by: draft.administered_by || null,
        notes: draft.notes || null,
      };
      if (editing) {
        const { error } = await supabase
          .from("caregiver_vaccinations" as any)
          .update(payload as any)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("caregiver_vaccinations" as any)
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver_vaccinations", id] });
      toast.success(editing ? "Vaccination updated" : "Vaccination added");
      setDialogOpen(false);
      setEditing(null);
      setDraft({ ...emptyDraft });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (vid: string) => {
      const { error } = await supabase
        .from("caregiver_vaccinations" as any)
        .delete()
        .eq("id", vid);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver_vaccinations", id] });
      toast.success("Vaccination removed");
      setDeletingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setDraft({ ...emptyDraft });
    setDialogOpen(true);
  };

  const openEdit = (v: Vaccination) => {
    setEditing(v);
    setDraft({
      vaccine_name: v.vaccine_name,
      dose: v.dose ?? "",
      date_administered: v.date_administered ?? "",
      expiry_date: v.expiry_date ?? "",
      batch_number: v.batch_number ?? "",
      administered_by: v.administered_by ?? "",
      notes: v.notes ?? "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <MemberTopBar title="Care Giver Medication" backTo={`/caregivers/${id}`} />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 p-4">
        <MemberSidebar cg={cg} basePath="medication" showServiceUserSelect />

        <Card className="p-4">
          <Tabs defaultValue="vaccinations" className="w-full">
            <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full justify-start gap-0">
              <TabsTrigger
                value="vaccinations"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none px-4 py-2 text-xs font-medium"
              >
                Vaccination Records
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vaccinations" className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Vaccination Records
                </h3>
                <Button
                  size="sm"
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  onClick={openCreate}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Vaccination Record
                </Button>
              </div>

              {vaccinations.length === 0 ? (
                <div className="py-8 text-sm text-muted-foreground">
                  No Vaccination Records
                </div>
              ) : (
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="grid grid-cols-[1.4fr_0.7fr_1fr_1fr_1fr_1fr_60px] gap-2 px-3 py-2 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                    <div>Vaccine</div>
                    <div>Dose</div>
                    <div>Date</div>
                    <div>Expiry</div>
                    <div>Batch</div>
                    <div>Administered By</div>
                    <div className="text-right">Actions</div>
                  </div>
                  {vaccinations.map((v, i) => (
                    <div
                      key={v.id}
                      className={`grid grid-cols-[1.4fr_0.7fr_1fr_1fr_1fr_1fr_60px] gap-2 px-3 py-2.5 text-xs items-center ${
                        i % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-foreground">
                        <Syringe className="h-3.5 w-3.5 text-primary" />
                        {v.vaccine_name}
                      </div>
                      <div className="text-muted-foreground">{v.dose || "—"}</div>
                      <div className="text-muted-foreground">
                        {v.date_administered ? format(new Date(v.date_administered), "dd/MM/yyyy") : "—"}
                      </div>
                      <div className="text-muted-foreground">
                        {v.expiry_date ? format(new Date(v.expiry_date), "dd/MM/yyyy") : "—"}
                      </div>
                      <div className="text-muted-foreground">{v.batch_number || "—"}</div>
                      <div className="text-muted-foreground">{v.administered_by || "—"}</div>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(v)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => setDeletingId(v.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Vaccination Record" : "Add Vaccination Record"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Vaccine Name *</Label>
              <Input
                value={draft.vaccine_name}
                onChange={(e) => setDraft({ ...draft, vaccine_name: e.target.value })}
                placeholder="e.g. COVID-19, Influenza, Hepatitis B"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dose</Label>
              <Input
                value={draft.dose}
                onChange={(e) => setDraft({ ...draft, dose: e.target.value })}
                placeholder="e.g. 1st, 2nd, Booster"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Batch Number</Label>
              <Input
                value={draft.batch_number}
                onChange={(e) => setDraft({ ...draft, batch_number: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date Administered</Label>
              <Input
                type="date"
                value={draft.date_administered}
                onChange={(e) => setDraft({ ...draft, date_administered: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Expiry Date</Label>
              <Input
                type="date"
                value={draft.expiry_date}
                onChange={(e) => setDraft({ ...draft, expiry_date: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Administered By</Label>
              <Input
                value={draft.administered_by}
                onChange={(e) => setDraft({ ...draft, administered_by: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!draft.vaccine_name.trim() || upsertMutation.isPending}
              onClick={() => upsertMutation.mutate()}
            >
              {editing ? "Save Changes" : "Add Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vaccination record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
