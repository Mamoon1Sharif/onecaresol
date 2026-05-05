import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users, Plus, Pencil, Trash2, Check, FileSpreadsheet, FileText, Phone,
} from "lucide-react";
import { toast } from "sonner";

interface KeyContact {
  id: string;
  care_receiver_id: string;
  is_nok: boolean;
  lives_with: boolean;
  is_ice: boolean;
  show_on_app: boolean;
  contact_type: string | null;
  name: string;
  tel1: string | null;
  tel2: string | null;
  mobile: string | null;
  email: string | null;
  address1: string | null;
  address2: string | null;
  area: string | null;
  postcode: string | null;
  note: string | null;
}

const emptyDraft: Omit<KeyContact, "id" | "care_receiver_id"> = {
  is_nok: false, lives_with: false, is_ice: false, show_on_app: false,
  contact_type: "", name: "", tel1: "", tel2: "", mobile: "", email: "",
  address1: "", address2: "", area: "", postcode: "", note: "",
};

export function ReceiverKeyContactsTab({ careReceiverId }: { careReceiverId: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<KeyContact | null>(null);
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["receiver-key-contacts", careReceiverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receiver_key_contacts")
        .select("*")
        .eq("care_receiver_id", careReceiverId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as KeyContact[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: typeof emptyDraft & { id?: string }) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("receiver_key_contacts").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("receiver_key_contacts")
          .insert({ ...payload, care_receiver_id: careReceiverId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receiver-key-contacts"] });
      toast.success(editing ? "Contact updated" : "Contact added");
      setDialogOpen(false);
      setEditing(null);
      setDraft({ ...emptyDraft });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receiver_key_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receiver-key-contacts"] });
      toast.success("Contact deleted");
      setDeletingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openAdd = () => {
    setEditing(null);
    setDraft({ ...emptyDraft });
    setDialogOpen(true);
  };

  const openEdit = (c: KeyContact) => {
    setEditing(c);
    setDraft({
      is_nok: c.is_nok, lives_with: c.lives_with, is_ice: c.is_ice, show_on_app: c.show_on_app,
      contact_type: c.contact_type ?? "", name: c.name,
      tel1: c.tel1 ?? "", tel2: c.tel2 ?? "", mobile: c.mobile ?? "", email: c.email ?? "",
      address1: c.address1 ?? "", address2: c.address2 ?? "",
      area: c.area ?? "", postcode: c.postcode ?? "", note: c.note ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!draft.name.trim()) return toast.error("Name is required");
    if (!draft.tel1?.trim()) return toast.error("Tel 1 is required");
    upsert.mutate({ ...draft, id: editing?.id });
  };

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [c.name, c.contact_type, c.tel1, c.mobile, c.email, c.area, c.postcode]
      .some((v) => v?.toLowerCase().includes(q));
  });

  const exportCSV = () => {
    const headers = ["Type", "Name", "Tel 1", "Tel 2", "Mobile", "Email", "Address 1", "Address 2", "Area", "Postcode", "NOK", "Lives With", "ICE", "Show On App", "Note"];
    const rows = filtered.map((c) => [
      c.contact_type, c.name, c.tel1, c.tel2, c.mobile, c.email, c.address1, c.address2,
      c.area, c.postcode, c.is_nok ? "Y" : "N", c.lives_with ? "Y" : "N",
      c.is_ice ? "Y" : "N", c.show_on_app ? "Y" : "N", c.note,
    ].map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `service-user-key-contacts.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const Yes = () => <Check className="h-4 w-4 text-success mx-auto" strokeWidth={3} />;

  return (
    <Card className="border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/30 border-b flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="h-4 w-4 text-primary" /> Key Contacts
        </div>
        <Button size="sm" className="h-8 gap-1.5 bg-success text-success-foreground hover:bg-success/90" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5" /> Add New
        </Button>
      </div>

      <CardContent className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Add key contacts for this service member: family, friends, GP, district nurse, social worker, or any emergency contact.
        </p>
        <p className="text-sm text-destructive">Tel 1 will be the contact number shown in the app.</p>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={exportCSV}>
            <FileText className="h-3.5 w-3.5" /> CSV
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Search:</span>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-[200px]" />
          </div>
        </div>

        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[60px] font-bold">Edit</TableHead>
                <TableHead className="w-[60px] font-bold">Delete</TableHead>
                <TableHead className="w-[80px] font-bold text-center">Is NOK</TableHead>
                <TableHead className="w-[100px] font-bold text-center">Lives With</TableHead>
                <TableHead className="w-[70px] font-bold text-center">I.C.E</TableHead>
                <TableHead className="w-[110px] font-bold text-center">Show On App</TableHead>
                <TableHead className="font-bold">Type</TableHead>
                <TableHead className="font-bold">Name</TableHead>
                <TableHead className="font-bold">Tel 1 <span className="text-destructive">*</span></TableHead>
                <TableHead className="font-bold">Tel 2</TableHead>
                <TableHead className="font-bold">Mobile</TableHead>
                <TableHead className="font-bold">Email</TableHead>
                <TableHead className="font-bold">Postcode</TableHead>
                <TableHead className="font-bold">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (<TableRow><TableCell colSpan={14}><Skeleton className="h-12 w-full" /></TableCell></TableRow>)}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={14} className="text-center text-muted-foreground py-10">
                    <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    No contacts yet. Click "Add New" to create one.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-warning" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">{c.is_nok && <Yes />}</TableCell>
                  <TableCell className="text-center">{c.lives_with && <Yes />}</TableCell>
                  <TableCell className="text-center">
                    {c.is_ice && (
                      <div className="inline-flex items-center justify-center h-6 w-6 rounded bg-success/15 text-success">
                        <Phone className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{c.show_on_app && <Yes />}</TableCell>
                  <TableCell className="text-sm">{c.contact_type ?? "—"}</TableCell>
                  <TableCell className="text-sm font-semibold">{c.name}</TableCell>
                  <TableCell className="text-sm font-mono">{c.tel1 ?? "—"}</TableCell>
                  <TableCell className="text-sm font-mono">{c.tel2 ?? ""}</TableCell>
                  <TableCell className="text-sm font-mono">{c.mobile ?? ""}</TableCell>
                  <TableCell className="text-sm">{c.email ?? ""}</TableCell>
                  <TableCell className="text-sm font-mono">{c.postcode ?? ""}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate" title={c.note ?? ""}>{c.note ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Contact" : "Add Key Contact"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Type / Relationship">
              <Input value={draft.contact_type ?? ""} onChange={(e) => setDraft({ ...draft, contact_type: e.target.value })} placeholder="e.g. Husband, Doctor" />
            </Field>
            <Field label="Name *"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
            <Field label="Tel 1 *"><Input value={draft.tel1 ?? ""} onChange={(e) => setDraft({ ...draft, tel1: e.target.value })} /></Field>
            <Field label="Tel 2"><Input value={draft.tel2 ?? ""} onChange={(e) => setDraft({ ...draft, tel2: e.target.value })} /></Field>
            <Field label="Mobile"><Input value={draft.mobile ?? ""} onChange={(e) => setDraft({ ...draft, mobile: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
            <Field label="Address 1"><Input value={draft.address1 ?? ""} onChange={(e) => setDraft({ ...draft, address1: e.target.value })} /></Field>
            <Field label="Address 2"><Input value={draft.address2 ?? ""} onChange={(e) => setDraft({ ...draft, address2: e.target.value })} /></Field>
            <Field label="Area"><Input value={draft.area ?? ""} onChange={(e) => setDraft({ ...draft, area: e.target.value })} /></Field>
            <Field label="Postcode"><Input value={draft.postcode ?? ""} onChange={(e) => setDraft({ ...draft, postcode: e.target.value })} /></Field>
            <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-md bg-muted/30">
              <Flag label="Is NOK" checked={draft.is_nok} onChange={(v) => setDraft({ ...draft, is_nok: v })} />
              <Flag label="Lives With" checked={draft.lives_with} onChange={(v) => setDraft({ ...draft, lives_with: v })} />
              <Flag label="I.C.E" checked={draft.is_ice} onChange={(v) => setDraft({ ...draft, is_ice: v })} />
              <Flag label="Show On App" checked={draft.show_on_app} onChange={(v) => setDraft({ ...draft, show_on_app: v })} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Note"><Textarea rows={3} value={draft.note ?? ""} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>{editing ? "Update" : "Add Contact"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this contact?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingId && remove.mutate(deletingId)}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Flag({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
