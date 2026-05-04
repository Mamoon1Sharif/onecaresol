import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Template {
  id: string;
  scope: "client" | "team";
  reminder_name: string;
  description: string | null;
  status: "Active" | "Inactive";
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export const ReminderSettingsDialog = ({ open, onOpenChange }: Props) => {
  const qc = useQueryClient();
  const [clientSearch, setClientSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [editing, setEditing] = useState<Template | null>(null);
  const [addingScope, setAddingScope] = useState<"client" | "team" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["reminder_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminder_templates")
        .select("*")
        .order("reminder_name");
      if (error) throw error;
      return data as Template[];
    },
    enabled: open,
  });

  const client = useMemo(
    () => rows.filter((r) => r.scope === "client").filter((r) =>
      clientSearch ? r.reminder_name.toLowerCase().includes(clientSearch.toLowerCase()) : true,
    ),
    [rows, clientSearch],
  );
  const team = useMemo(
    () => rows.filter((r) => r.scope === "team").filter((r) =>
      teamSearch ? r.reminder_name.toLowerCase().includes(teamSearch.toLowerCase()) : true,
    ),
    [rows, teamSearch],
  );

  const upsert = useMutation({
    mutationFn: async (t: Partial<Template> & { id?: string }) => {
      if (t.id) {
        const { error } = await supabase
          .from("reminder_templates")
          .update({
            reminder_name: t.reminder_name,
            description: t.description,
            status: t.status,
          })
          .eq("id", t.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reminder_templates").insert({
          scope: t.scope!,
          reminder_name: t.reminder_name!,
          description: t.description ?? null,
          status: t.status ?? "Active",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminder_templates"] });
      setEditing(null);
      setAddingScope(null);
      toast.success("Reminder template saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminder_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminder_templates"] });
      setDeleteId(null);
      toast.success("Deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const renderTable = (
    title: string,
    list: Template[],
    scope: "client" | "team",
    search: string,
    setSearch: (s: string) => void,
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-t-2 border-t-emerald-500">
        <CardTitle className="text-sm">{title}</CardTitle>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1 h-8" onClick={() => setAddingScope(scope)}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        <div className="flex justify-end items-center gap-2">
          <Label className="text-xs">Search:</Label>
          <Input className="h-8 w-48 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="border rounded max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow className="bg-muted/40">
                <TableHead className="w-12 text-xs">Edit</TableHead>
                <TableHead className="w-14 text-xs">Delete</TableHead>
                <TableHead className="text-xs">Reminder</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">Loading...</TableCell></TableRow>
              ) : list.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">No reminders</TableCell></TableRow>
              ) : list.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <button onClick={() => setEditing(r)} className="text-amber-500 hover:text-amber-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => setDeleteId(r.id)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                  <TableCell className="text-xs">{r.reminder_name}</TableCell>
                  <TableCell className={`text-xs ${r.status === "Active" ? "text-emerald-700" : "text-muted-foreground"}`}>{r.status}</TableCell>
                  <TableCell className="text-xs">{r.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="text-xs text-muted-foreground">Showing {list.length} {list.length === 1 ? "entry" : "entries"}</div>
        <div className="text-xs text-muted-foreground italic">Changes here will not impact current reminders</div>
      </CardContent>
    </Card>
  );

  const formOpen = !!editing || !!addingScope;
  const formInitial = editing ?? (addingScope ? { id: "", scope: addingScope, reminder_name: "", description: "", status: "Active" as const } : null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              <DialogTitle className="text-lg">Settings - Reminders List</DialogTitle>
              <div className="w-16" />
            </div>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {renderTable("Client Reminders", client, "client", clientSearch, setClientSearch)}
            {renderTable("Team Member Reminders", team, "team", teamSearch, setTeamSearch)}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={(v) => { if (!v) { setEditing(null); setAddingScope(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Reminder" : "Add Reminder"}</DialogTitle>
          </DialogHeader>
          {formInitial && (
            <TemplateForm
              initial={formInitial}
              onSubmit={(values) =>
                upsert.mutate({ ...values, id: editing?.id, scope: editing?.scope ?? addingScope! })
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reminder template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove it from the settings list. Existing reminders will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && del.mutate(deleteId)} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const TemplateForm = ({
  initial,
  onSubmit,
}: {
  initial: Template;
  onSubmit: (v: Partial<Template>) => void;
}) => {
  const [name, setName] = useState(initial.reminder_name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [status, setStatus] = useState<"Active" | "Inactive">(initial.status);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Reminder name required");
        onSubmit({ reminder_name: name.trim(), description: description.trim() || null, status });
      }}
      className="space-y-3"
    >
      <div>
        <Label className="text-xs">Reminder Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>
      <div>
        <Label className="text-xs">Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as "Active" | "Inactive")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
      </DialogFooter>
    </form>
  );
};
