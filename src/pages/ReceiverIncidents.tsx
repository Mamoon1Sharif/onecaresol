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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

type Incident = {
  id: string; care_receiver_id: string; incident_ref: string; severity: string; status: string;
  created_by: string | null; created_for: string | null; description: string;
  incident_date: string; closed_at: string | null; created_at: string; updated_at: string;
};

const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function ReceiverIncidents() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: cr } = useCareReceiver(id);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["receiver_incidents", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("receiver_incidents" as any).select("*").eq("care_receiver_id", id!).order("incident_date", { ascending: false });
      if (error) throw error;
      return data as unknown as Incident[];
    },
  });

  const open = useMemo(() => incidents.filter((i) => i.status === "Open"), [incidents]);
  const closed = useMemo(() => incidents.filter((i) => i.status === "Closed"), [incidents]);

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const filteredClosed = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return closed;
    return closed.filter((i) => [i.incident_ref, i.severity, i.created_by, i.created_for, i.description].filter(Boolean).some((v) => v!.toLowerCase().includes(q)));
  }, [closed, search]);

  const totalPages = Math.max(1, Math.ceil(filteredClosed.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageItems = filteredClosed.slice(pageStart, pageStart + pageSize);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Incident | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Incident>>({});

  const openCreate = () => {
    setEditing(null);
    setForm({
      incident_ref: String(Math.floor(100000 + Math.random() * 900000)),
      severity: "Low", status: "Open", created_by: cr?.name ?? "",
      created_for: "", description: "", incident_date: new Date().toISOString().slice(0, 16),
    });
    setDialogOpen(true);
  };
  const openEdit = (i: Incident) => {
    setEditing(i);
    setForm({ ...i, incident_date: i.incident_date.slice(0, 16) });
    setDialogOpen(true);
  };

  const upsertMut = useMutation({
    mutationFn: async (payload: Partial<Incident>) => {
      const data = {
        incident_ref: payload.incident_ref,
        severity: payload.severity,
        status: payload.status,
        created_by: payload.created_by,
        created_for: payload.created_for,
        description: payload.description,
        incident_date: payload.incident_date ? new Date(payload.incident_date).toISOString() : new Date().toISOString(),
        closed_at: payload.status === "Closed" ? (payload.closed_at ?? new Date().toISOString()) : null,
      };
      if (payload.id) {
        const { error } = await supabase.from("receiver_incidents" as any).update(data as any).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("receiver_incidents" as any).insert({ care_receiver_id: id!, ...data } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_incidents", id] }); setDialogOpen(false); setEditing(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (incId: string) => {
      const { error } = await supabase.from("receiver_incidents" as any).delete().eq("id", incId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_incidents", id] }); setDeleteId(null); toast.success("Deleted"); },
  });

  const closeIncident = (incId: string) => {
    const i = incidents.find((x) => x.id === incId);
    if (i) upsertMut.mutate({ ...i, status: "Closed", closed_at: new Date().toISOString() });
  };

  const sevBadge = (sev: string) => {
    const styles: Record<string, string> = {
      Low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
      Medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
      High: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
      Critical: "bg-destructive/15 text-destructive",
    };
    return <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${styles[sev] ?? "bg-muted text-muted-foreground"}`}>{sev}</span>;
  };

  const renderTable = (rows: Incident[], showClose?: boolean) => (
    <table className="w-full text-xs">
      <thead className="bg-muted/40">
        <tr className="text-left text-foreground">
          <th className="px-3 py-2 font-semibold">Incident Ref</th>
          <th className="px-3 py-2 font-semibold">Severity</th>
          <th className="px-3 py-2 font-semibold">Creation</th>
          <th className="px-3 py-2 font-semibold">Created By</th>
          <th className="px-3 py-2 font-semibold">Created For</th>
          <th className="px-3 py-2 font-semibold">Description</th>
          <th className="px-3 py-2 font-semibold text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((i) => (
          <tr key={i.id} className="border-t border-border hover:bg-muted/20">
            <td className="px-3 py-2 font-medium text-foreground">{i.incident_ref}</td>
            <td className="px-3 py-2">{sevBadge(i.severity)}</td>
            <td className="px-3 py-2 text-muted-foreground">{format(parseISO(i.incident_date), "dd/MM/yyyy HH:mm")}</td>
            <td className="px-3 py-2 text-foreground">{i.created_by || "—"}</td>
            <td className="px-3 py-2 text-foreground">{i.created_for || "—"}</td>
            <td className="px-3 py-2 text-foreground max-w-md">{i.description}</td>
            <td className="px-3 py-2">
              <div className="flex items-center gap-1 justify-end">
                {showClose && <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => closeIncident(i.id)}><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /></Button>}
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(i)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDeleteId(i.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <ServiceUserTopBar title="Service Member Incidents" backTo={`/carereceivers/${id}`} />
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 p-4">
        <ServiceUserSidebar cr={cr} basePath="incidents" />

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
              <h2 className="text-sm font-semibold text-foreground">Open Incidents</h2>
              <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Add New
              </Button>
            </div>
            {open.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">No Open Incidents</div>
            ) : (
              <div className="overflow-x-auto">{renderTable(open, true)}</div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
              <h2 className="text-sm font-semibold text-foreground">Closed Incidents</h2>
            </div>

            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20 text-xs">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{PAGE_SIZE_OPTIONS.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <span>entries</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Search:</span>
                <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-7 w-48 text-xs" />
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? <div className="px-4 py-8 text-sm text-muted-foreground text-center">Loading…</div>
                : pageItems.length === 0 ? <div className="px-4 py-8 text-sm text-muted-foreground text-center">No closed incidents</div>
                : renderTable(pageItems)}
            </div>

            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border text-xs">
              <span className="text-muted-foreground">Showing {pageItems.length === 0 ? 0 : pageStart + 1} to {pageStart + pageItems.length} of {filteredClosed.length}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <span className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded bg-primary text-primary-foreground text-xs">{currentPage}</span>
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Incident" : "Add New Incident"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Incident Ref *</Label><Input value={form.incident_ref ?? ""} onChange={(e) => setForm({ ...form, incident_ref: e.target.value })} className="h-8 text-xs" /></div>
              <div><Label className="text-xs">Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Created By</Label><Input value={form.created_by ?? ""} onChange={(e) => setForm({ ...form, created_by: e.target.value })} className="h-8 text-xs" /></div>
              <div><Label className="text-xs">Created For</Label><Input value={form.created_for ?? ""} onChange={(e) => setForm({ ...form, created_for: e.target.value })} className="h-8 text-xs" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Incident Date</Label><Input type="datetime-local" value={form.incident_date ?? ""} onChange={(e) => setForm({ ...form, incident_date: e.target.value })} className="h-8 text-xs" /></div>
              <div><Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Open">Open</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Description</Label><Textarea rows={4} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="text-xs" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { if (!form.incident_ref?.trim()) return toast.error("Incident Ref required"); upsertMut.mutate({ ...form, id: editing?.id }); }} disabled={upsertMut.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this incident?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
