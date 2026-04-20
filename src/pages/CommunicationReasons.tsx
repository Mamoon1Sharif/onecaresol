import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Pencil, Trash2, Phone } from "lucide-react";
import { toast } from "sonner";

type CommReason = {
  id: string;
  name: string;
  color: string;
};

export default function CommunicationReasons() {
  const nav = useNavigate();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommReason | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [confirmDelete, setConfirmDelete] = useState<CommReason | null>(null);

  const { data: reasons = [], isLoading } = useQuery({
    queryKey: ["comm_reasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communication_reasons" as any)
        .select("*")
        .order("name");
      if (error) throw error;
      return data as unknown as CommReason[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Reason name is required");
      if (editing) {
        const { error } = await supabase
          .from("communication_reasons" as any)
          .update({ name: name.trim(), color })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("communication_reasons" as any)
          .insert({ name: name.trim(), color });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comm_reasons"] });
      toast.success(editing ? "Reason updated" : "Reason added");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("communication_reasons" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comm_reasons"] });
      toast.success("Reason deleted");
      setConfirmDelete(null);
    },
  });

  const openAdd = () => {
    setEditing(null);
    setName("");
    setColor("#6366f1");
    setDialogOpen(true);
  };

  const openEdit = (r: CommReason) => {
    setEditing(r);
    setName(r.name);
    setColor(r.color);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setName("");
    setColor("#6366f1");
  };

  return (
    <AppLayout>
      <div className="space-y-3">
        {/* Top bar */}
        <div className="flex items-center justify-between bg-muted/40 border border-border rounded-md px-3 py-2">
          <Button
            size="sm"
            onClick={() => nav("/communication-log")}
            className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
          </Button>
          <h1 className="text-lg font-medium text-foreground">Communication Log Reasons</h1>
          <Button
            size="sm"
            onClick={() => nav("/communication-log")}
            className="h-8 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Phone className="h-3.5 w-3.5 mr-1.5" /> Communication Log
          </Button>
        </div>

        {/* Reasons card */}
        <Card className="overflow-hidden border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">Custom Communication Log Reasons</h2>
            <Button
              size="sm"
              onClick={openAdd}
              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-background">
                <tr className="text-left border-b border-border">
                  <th className="px-4 py-2.5 font-semibold text-foreground w-16">Edit</th>
                  <th className="px-4 py-2.5 font-semibold text-foreground w-16">Delete</th>
                  <th className="px-4 py-2.5 font-semibold text-foreground">Custom Reason</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : reasons.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                      No custom reasons yet. Click Add to create one.
                    </td>
                  </tr>
                ) : (
                  reasons.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`border-b border-border ${idx % 2 === 0 ? "bg-muted/20" : "bg-background"}`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEdit(r)}
                          className="text-amber-500 hover:text-amber-600"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setConfirmDelete(r)}
                          className="text-destructive hover:text-destructive/80"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full border border-border"
                            style={{ background: r.color }}
                          />
                          {r.name}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => (v ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Reason" : "Add Reason"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Reason name *</Label>
              <Input
                className="h-8 text-xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-14 rounded border border-border cursor-pointer"
                />
                <Input
                  className="h-8 text-xs flex-1"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
              {editing ? "Save changes" : "Add reason"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete reason?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove <span className="font-medium text-foreground">{confirmDelete?.name}</span>.
          </p>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => confirmDelete && remove.mutate(confirmDelete.id)}
              disabled={remove.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
