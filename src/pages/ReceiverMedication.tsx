import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCareReceiver, useMedications } from "@/hooks/use-care-data";
import { ServiceUserSidebar, ServiceUserTopBar } from "@/components/member/ServiceUserSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Plus, Pill, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Medication = {
  id: string;
  care_receiver_id: string;
  medication: string;
  dosage: string;
  date: string;
  administered_by: string | null;
  notes: string | null;
};

const emptyDraft = {
  medication: "",
  dosage: "",
  date: new Date().toISOString().slice(0, 10),
  administered_by: "",
  notes: "",
};

export default function ReceiverMedication() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: cr } = useCareReceiver(id);
  const { data: meds = [] } = useMedications(id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        care_receiver_id: id!,
        medication: draft.medication.trim(),
        dosage: draft.dosage.trim(),
        date: draft.date,
        administered_by: draft.administered_by || null,
        notes: draft.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from("medications").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("medications").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications", id] });
      toast.success(editing ? "Medication updated" : "Medication added");
      setDialogOpen(false);
      setEditing(null);
      setDraft({ ...emptyDraft });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (mid: string) => {
      const { error } = await supabase.from("medications").delete().eq("id", mid);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications", id] });
      toast.success("Medication removed");
      setDeletingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setDraft({ ...emptyDraft });
    setDialogOpen(true);
  };

  const openEdit = (m: Medication) => {
    setEditing(m);
    setDraft({
      medication: m.medication,
      dosage: m.dosage,
      date: m.date,
      administered_by: m.administered_by ?? "",
      notes: m.notes ?? "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <ServiceUserTopBar title="Service User Medication" backTo={`/carereceivers/${id}`} />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 p-4">
        <ServiceUserSidebar cr={cr} basePath="medication" />

        <Card className="p-4">
          <Tabs defaultValue="meds" className="w-full">
            <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full justify-start gap-0">
              <TabsTrigger value="meds" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary rounded-none px-4 py-2 text-xs font-medium">
                Medication Records
              </TabsTrigger>
            </TabsList>

            <TabsContent value="meds" className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Medication Records</h3>
                <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={openCreate}>
                  <Plus className="h-3.5 w-3.5" /> Add Medication
                </Button>
              </div>

              {meds.length === 0 ? (
                <div className="py-8 text-sm text-muted-foreground">No Medication Records</div>
              ) : (
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_1.2fr_60px] gap-2 px-3 py-2 bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                    <div>Medication</div>
                    <div>Dosage</div>
                    <div>Date</div>
                    <div>Administered By</div>
                    <div>Notes</div>
                    <div className="text-right">Actions</div>
                  </div>
                  {meds.map((m: any, i) => (
                    <div key={m.id} className={`grid grid-cols-[1.4fr_0.8fr_1fr_1fr_1.2fr_60px] gap-2 px-3 py-2.5 text-xs items-center ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                      <div className="flex items-center gap-2 text-foreground">
                        <Pill className="h-3.5 w-3.5 text-primary" />
                        {m.medication}
                      </div>
                      <div className="text-muted-foreground">{m.dosage}</div>
                      <div className="text-muted-foreground">{m.date ? format(new Date(m.date), "dd/MM/yyyy") : "—"}</div>
                      <div className="text-muted-foreground">{m.administered_by || "—"}</div>
                      <div className="text-muted-foreground truncate">{m.notes || "—"}</div>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(m)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeletingId(m.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Medication Record" : "Add Medication Record"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Medication Name *</Label>
              <Input value={draft.medication} onChange={(e) => setDraft({ ...draft, medication: e.target.value })} placeholder="e.g. Paracetamol" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dosage *</Label>
              <Input value={draft.dosage} onChange={(e) => setDraft({ ...draft, dosage: e.target.value })} placeholder="e.g. 500mg twice daily" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Administered By</Label>
              <Input value={draft.administered_by} onChange={(e) => setDraft({ ...draft, administered_by: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!draft.medication.trim() || !draft.dosage.trim() || upsertMutation.isPending} onClick={() => upsertMutation.mutate()}>
              {editing ? "Save Changes" : "Add Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete medication record?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this record. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deletingId && deleteMutation.mutate(deletingId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
