import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  StickyNote, CalendarDays, Plus, Download, RefreshCw,
  ChevronLeft, ChevronRight, FileText, Trash2, Pencil,
} from "lucide-react";
import { useCareReceivers, useCareGiver } from "@/hooks/use-care-data";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PassVersionView } from "./PassVersionView";

interface Props {
  careGiverId: string;
}

interface PrivateNote {
  id: string;
  care_giver_id: string;
  service_user_id: string | null;
  note: string;
  note_date: string;
  created_at: string;
  updated_at: string;
}

interface RotaNote {
  id: string;
  care_giver_id: string;
  rota_ref: string | null;
  note_ref: string | null;
  staff_name: string;
  note: string;
  note_date: string;
  created_at: string;
}

const PAGE_SIZE = 10;

export function NotesTab({ careGiverId }: Props) {
  const qc = useQueryClient();
  const { data: receivers = [] } = useCareReceivers();
  const { data: caregiver } = useCareGiver(careGiverId);
  const [passVersion, setPassVersion] = useState(false);

  // ============== Private User Notes ==============
  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [appliedFrom, setAppliedFrom] = useState(today);
  const [appliedTo, setAppliedTo] = useState(today);
  const [serviceUserFilter, setServiceUserFilter] = useState<string>("all");
  const [bulkAction, setBulkAction] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<PrivateNote | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ note: "", service_user_id: "none", note_date: today });

  const { data: privateNotes = [], isLoading: loadingPrivate } = useQuery({
    queryKey: ["caregiver-private-notes", careGiverId, appliedFrom, appliedTo, serviceUserFilter],
    queryFn: async () => {
      let q = supabase
        .from("caregiver_private_notes")
        .select("*")
        .eq("care_giver_id", careGiverId)
        .gte("note_date", appliedFrom)
        .lte("note_date", appliedTo)
        .order("note_date", { ascending: false });
      if (serviceUserFilter !== "all") q = q.eq("service_user_id", serviceUserFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PrivateNote[];
    },
  });

  const upsertPrivate = useMutation({
    mutationFn: async (payload: { id?: string; note: string; service_user_id: string | null; note_date: string }) => {
      if (payload.id) {
        const { error } = await supabase
          .from("caregiver_private_notes")
          .update({ note: payload.note, service_user_id: payload.service_user_id, note_date: payload.note_date })
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("caregiver_private_notes").insert({
          care_giver_id: careGiverId,
          note: payload.note,
          service_user_id: payload.service_user_id,
          note_date: payload.note_date,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver-private-notes"] });
      toast.success(editing ? "Note updated" : "Note added");
      setAddOpen(false);
      setEditing(null);
      setDraft({ note: "", service_user_id: "none", note_date: today });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePrivate = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("caregiver_private_notes").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver-private-notes"] });
      setSelected(new Set());
      setDeletingId(null);
      toast.success("Note(s) deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleApplyDates = () => {
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
  };

  const handleBulkGo = () => {
    if (bulkAction === "delete" && selected.size > 0) {
      deletePrivate.mutate(Array.from(selected));
    }
    setBulkAction("");
  };

  const openAdd = () => {
    setEditing(null);
    setDraft({ note: "", service_user_id: "none", note_date: today });
    setAddOpen(true);
  };

  const openEdit = (n: PrivateNote) => {
    setEditing(n);
    setDraft({ note: n.note, service_user_id: n.service_user_id ?? "none", note_date: n.note_date });
    setAddOpen(true);
  };

  const handleSaveNote = () => {
    if (!draft.note.trim()) return toast.error("Note cannot be empty");
    upsertPrivate.mutate({
      id: editing?.id,
      note: draft.note.trim(),
      service_user_id: draft.service_user_id === "none" ? null : draft.service_user_id,
      note_date: draft.note_date,
    });
  };

  const exportPrivate = () => {
    const header = "Date,Service User,Note\n";
    const rows = privateNotes.map((n) => {
      const su = receivers.find((r) => r.id === n.service_user_id)?.name ?? "";
      const safe = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
      return [n.note_date, safe(su), safe(n.note)].join(",");
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `private-notes-${today}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = privateNotes.length > 0 && privateNotes.every((n) => selected.has(n.id));
  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(privateNotes.map((n) => n.id)));
  };

  // ============== Rota Notes ==============
  const [page, setPage] = useState(1);

  const { data: rotaNotes = [], isLoading: loadingRota } = useQuery({
    queryKey: ["caregiver-rota-notes", careGiverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caregiver_rota_notes")
        .select("*")
        .eq("care_giver_id", careGiverId)
        .order("note_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RotaNote[];
    },
  });

  const totalPages = Math.max(1, Math.ceil(rotaNotes.length / PAGE_SIZE));
  const pagedRota = useMemo(
    () => rotaNotes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rotaNotes, page]
  );

  const fmtRotaDate = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-GB");
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return { date, time };
  };

  return (
    <div className="space-y-6">
      {/* ======================= PASS VERSION TOGGLE ======================= */}
      <div className="flex items-center justify-end gap-3 px-1">
        <Label htmlFor="pass-version-toggle" className="text-sm font-medium cursor-pointer">
          Pass version
        </Label>
        <Switch
          id="pass-version-toggle"
          checked={passVersion}
          onCheckedChange={setPassVersion}
        />
      </div>

      {passVersion ? (
        <PassVersionView careGiverName={caregiver?.name} />
      ) : (
        <>
      {/* ======================= PRIVATE USER NOTES ======================= */}
      <Card className="border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/30 border-b flex-wrap">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary" /> Private User Notes
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 text-xs w-[130px]"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 text-xs w-[130px]"
            />
            <Button size="sm" className="h-8 gap-1.5 bg-success text-success-foreground hover:bg-success/90" onClick={handleApplyDates}>
              <RefreshCw className="h-3.5 w-3.5" /> Update
            </Button>
            <Button size="sm" className="h-8 gap-1.5" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5" /> Add New
            </Button>
            <Button size="sm" variant="secondary" className="h-8 gap-1.5" onClick={exportPrivate}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Service user filter + bulk action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={serviceUserFilter} onValueChange={setServiceUserFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Service User..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Service Users</SelectItem>
                {receivers.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="h-9 flex-1">
                  <SelectValue placeholder="Note Bulk Actions..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delete">Delete Selected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-9 px-4 bg-success text-success-foreground hover:bg-success/90"
                onClick={handleBulkGo}
                disabled={!bulkAction || selected.size === 0}
              >
                Go
              </Button>
            </div>
          </div>

          {/* Notes table */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[180px]">Service User</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPrivate && (
                  <TableRow>
                    <TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell>
                  </TableRow>
                )}
                {!loadingPrivate && privateNotes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      No notes in selected date range
                    </TableCell>
                  </TableRow>
                )}
                {privateNotes.map((n) => {
                  const su = receivers.find((r) => r.id === n.service_user_id);
                  return (
                    <TableRow key={n.id}>
                      <TableCell>
                        <Checkbox checked={selected.has(n.id)} onCheckedChange={() => toggleSelect(n.id)} />
                      </TableCell>
                      <TableCell className="text-sm font-mono">{new Date(n.note_date).toLocaleDateString("en-GB")}</TableCell>
                      <TableCell className="text-sm">{su?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-sm">{n.note}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(n)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(n.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ======================= TEAM MEMBER NOTES (ROTA) ======================= */}
      <Card className="border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Team Member Notes (Rota)</span>
        </div>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-info">
            Live rota notes from services involving this team member
          </p>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="w-[110px] font-semibold">Rota Ref</TableHead>
                  <TableHead className="w-[110px] font-semibold">Note Ref</TableHead>
                  <TableHead className="w-[140px] font-semibold">Staff</TableHead>
                  <TableHead className="w-[140px] font-semibold">Created</TableHead>
                  <TableHead className="font-semibold">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRota && (
                  <TableRow>
                    <TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell>
                  </TableRow>
                )}
                {!loadingRota && rotaNotes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      <StickyNote className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      No rota notes yet
                    </TableCell>
                  </TableRow>
                )}
                {pagedRota.map((n) => {
                  const { date, time } = fmtRotaDate(n.note_date);
                  return (
                    <TableRow key={n.id} className="align-top">
                      <TableCell className="text-info font-mono text-xs pt-3">{n.rota_ref ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs pt-3">{n.note_ref ?? "—"}</TableCell>
                      <TableCell className="text-sm pt-3">{n.staff_name}</TableCell>
                      <TableCell className="text-xs pt-3">
                        <div>{date}</div>
                        <div className="text-muted-foreground">{time}</div>
                      </TableCell>
                      <TableCell className="text-sm pt-3 leading-relaxed">{n.note}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 bg-success/10 text-success hover:bg-success/20"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={p === page ? "default" : "ghost"}
                className={p === page ? "h-8 w-8 p-0 bg-success text-success-foreground hover:bg-success/90" : "h-8 w-8 p-0"}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 bg-success/10 text-success hover:bg-success/20"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ============ Add/Edit Dialog ============ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Note" : "Add Private Note"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</label>
              <Input type="date" value={draft.note_date} onChange={(e) => setDraft({ ...draft, note_date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service User (optional)</label>
              <Select value={draft.service_user_id} onValueChange={(v) => setDraft({ ...draft, service_user_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Service User..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {receivers.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Note</label>
              <Textarea
                rows={5}
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                placeholder="Write your note..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNote} disabled={upsertPrivate.isPending}>
              {editing ? "Update" : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ Delete confirm ============ */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingId && deletePrivate.mutate([deletingId])}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </>
      )}
    </div>
  );
}
