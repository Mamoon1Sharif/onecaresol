import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCareReceiver } from "@/hooks/use-care-data";
import { ServiceUserSidebar, ServiceUserTopBar } from "@/components/member/ServiceUserSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, Plus, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const STATUS_OPTIONS = ["In Date", "Expired", "Never Expires", "Archived"] as const;
const SUB_STATUS_OPTIONS = ["None", "Mandatory Training", "No Action Required"] as const;

type Q = {
  id: string; care_receiver_id: string; qualification: string;
  start_date: string | null; expiry_date: string | null;
  never_expires: boolean; status: string; sub_status: string; notes: string | null;
};

const empty = { qualification: "", start_date: "", expiry_date: "", never_expires: false, status: "In Date", sub_status: "None", notes: "" };

export default function ReceiverQualifications() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: cr } = useCareReceiver(id);

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Q | null>(null);
  const [draft, setDraft] = useState({ ...empty });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["receiver_qualifications", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("receiver_qualifications" as any).select("*").eq("care_receiver_id", id!).order("qualification");
      if (error) throw error;
      return data as unknown as Q[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        care_receiver_id: id!,
        qualification: draft.qualification.trim(),
        start_date: draft.start_date || null,
        expiry_date: draft.never_expires ? null : (draft.expiry_date || null),
        never_expires: draft.never_expires,
        status: draft.never_expires ? "Never Expires" : draft.status,
        sub_status: draft.sub_status,
        notes: draft.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from("receiver_qualifications" as any).update(payload as any).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("receiver_qualifications" as any).insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receiver_qualifications", id] });
      toast.success("Saved"); setDialogOpen(false); setEditing(null); setDraft({ ...empty });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (qid: string) => {
      const { error } = await supabase.from("receiver_qualifications" as any).delete().eq("id", qid);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_qualifications", id] }); setDeletingId(null); toast.success("Removed"); },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((x) => [x.qualification, x.status, x.sub_status].some((v) => v.toLowerCase().includes(q)));
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  const openEdit = (q: Q) => {
    setEditing(q);
    setDraft({
      qualification: q.qualification, start_date: q.start_date ?? "", expiry_date: q.expiry_date ?? "",
      never_expires: q.never_expires, status: q.status, sub_status: q.sub_status, notes: q.notes ?? "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <ServiceUserTopBar title="Service User - All Qualifications" backTo={`/carereceivers/${id}`} />
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 p-4">
        <ServiceUserSidebar cr={cr} basePath="qualifications" />

        <Card className="p-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-medium text-primary flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Service User Qualifications
            </h3>
            <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={() => { setEditing(null); setDraft({ ...empty }); setDialogOpen(true); }}>
              <Plus className="h-3.5 w-3.5" /> Add Qualification
            </Button>
          </div>

          <div className="flex items-center justify-between pt-3 pb-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-7 w-[64px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{PAGE_SIZE_OPTIONS.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
              </Select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Search:</Label>
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-7 w-[180px] text-xs" />
            </div>
          </div>

          <div className="border-t border-b border-foreground/30">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr_60px] text-xs font-semibold py-2 px-2 border-b border-foreground/30">
              <div>Qualification</div><div>Start</div><div>Exp</div><div>Status</div><div>Sub-Status</div><div className="text-right">Actions</div>
            </div>
            {pageItems.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">No qualifications.</div>
            ) : (
              pageItems.map((q, i) => (
                <div key={q.id} className={`grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr_60px] text-xs py-2.5 px-2 items-center ${i % 2 === 0 ? "bg-muted/30" : "bg-background"}`}>
                  <div className="text-foreground">{q.qualification}</div>
                  <div className="text-muted-foreground">{q.start_date ? format(parseISO(q.start_date), "dd/MM/yyyy") : "—"}</div>
                  <div className="text-muted-foreground">{q.never_expires ? "Never Expires" : q.expiry_date ? format(parseISO(q.expiry_date), "dd/MM/yyyy") : "—"}</div>
                  <div className="text-muted-foreground">{q.status}</div>
                  <div className="text-muted-foreground">{q.sub_status}</div>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(q)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeletingId(q.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
            <span>Showing {filtered.length === 0 ? 0 : pageStart + 1} to {Math.min(pageStart + pageSize, filtered.length)} of {filtered.length} entries</span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft className="h-3 w-3" /> Previous</Button>
              <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded bg-primary text-primary-foreground text-xs">{currentPage}</span>
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next <ChevronRight className="h-3 w-3" /></Button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Qualification" : "Add Qualification"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label className="text-xs">Qualification *</Label><Input value={draft.qualification} onChange={(e) => setDraft({ ...draft, qualification: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Start Date</Label><Input type="date" value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Expiry Date</Label><Input type="date" value={draft.expiry_date} disabled={draft.never_expires} onChange={(e) => setDraft({ ...draft, expiry_date: e.target.value })} /></div>
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox id="ne" checked={draft.never_expires} onCheckedChange={(v) => setDraft({ ...draft, never_expires: !!v })} />
              <Label htmlFor="ne" className="text-xs cursor-pointer">Never expires</Label>
            </div>
            <div className="space-y-1"><Label className="text-xs">Status</Label>
              <Select value={draft.never_expires ? "Never Expires" : draft.status} disabled={draft.never_expires} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Sub-Status</Label>
              <Select value={draft.sub_status} onValueChange={(v) => setDraft({ ...draft, sub_status: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{SUB_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!draft.qualification.trim() || upsert.isPending} onClick={() => upsert.mutate()}>
              {editing ? "Save Changes" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete qualification?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deletingId && del.mutate(deletingId)}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
