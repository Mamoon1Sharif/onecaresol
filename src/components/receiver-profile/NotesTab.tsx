import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Download, RefreshCw, Trash2, Pencil, FileText,
  StickyNote, CalendarDays, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useCareGivers, useCareReceiver } from "@/hooks/use-care-data";
import { toast } from "sonner";
import { PassVersionView } from "@/components/caregiver-profile/PassVersionView";

interface PrivateNote {
  id: string;
  care_receiver_id: string;
  care_giver_id: string | null;
  note: string;
  note_date: string;
}

interface RotaNote {
  id: string;
  care_giver_id: string;
  rota_ref: string | null;
  note_ref: string | null;
  staff_name: string;
  note: string;
  note_date: string;
}

const PAGE_SIZE = 10;

export function ReceiverNotesTab({ careReceiverId }: { careReceiverId: string }) {
  const qc = useQueryClient();
  const { data: caregivers = [] } = useCareGivers();
  const { data: receiver } = useCareReceiver(careReceiverId);
  const [passVersion, setPassVersion] = useState(false);

  // ============== Private Notes ==============
  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [appliedFrom, setAppliedFrom] = useState(today);
  const [appliedTo, setAppliedTo] = useState(today);
  const [caregiverFilter, setCaregiverFilter] = useState("all");
  const [bulkAction, setBulkAction] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<PrivateNote | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ note: "", care_giver_id: "none", note_date: today });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["receiver-private-notes", careReceiverId, appliedFrom, appliedTo, caregiverFilter],
    queryFn: async () => {
      let q = supabase
        .from("receiver_private_notes")
        .select("*")
        .eq("care_receiver_id", careReceiverId)
        .gte("note_date", appliedFrom)
        .lte("note_date", appliedTo)
        .order("note_date", { ascending: false });
      if (caregiverFilter !== "all") q = q.eq("care_giver_id", caregiverFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PrivateNote[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (p: { id?: string; note: string; care_giver_id: string | null; note_date: string }) => {
      if (p.id) {
        const { error } = await supabase.from("receiver_private_notes").update({
          note: p.note, care_giver_id: p.care_giver_id, note_date: p.note_date,
        }).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("receiver_private_notes").insert({
          care_receiver_id: careReceiverId,
          note: p.note,
          care_giver_id: p.care_giver_id,
          note_date: p.note_date,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receiver-private-notes"] });
      toast.success(editing ? "Note updated" : "Note added");
      setAddOpen(false);
      setEditing(null);
      setDraft({ note: "", care_giver_id: "none", note_date: today });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeNotes = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("receiver_private_notes").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receiver-private-notes"] });
      setSelected(new Set());
      setDeletingId(null);
      toast.success("Note(s) deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openAdd = () => {
    setEditing(null);
    setDraft({ note: "", care_giver_id: "none", note_date: today });
    setAddOpen(true);
  };
  const openEdit = (n: PrivateNote) => {
    setEditing(n);
    setDraft({ note: n.note, care_giver_id: n.care_giver_id ?? "none", note_date: n.note_date });
    setAddOpen(true);
  };
  const handleSave = () => {
    if (!draft.note.trim()) return toast.error("Note cannot be empty");
    upsert.mutate({
      id: editing?.id, note: draft.note.trim(),
      care_giver_id: draft.care_giver_id === "none" ? null : draft.care_giver_id,
      note_date: draft.note_date,
    });
  };

  const exportCSV = () => {
    const header = "Date,Caregiver,Note\n";
    const rows = notes.map((n) => {
      const cg = caregivers.find((c) => c.id === n.care_giver_id)?.name ?? "";
      const safe = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
      return [n.note_date, safe(cg), safe(n.note)].join(",");
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `service-user-notes-${today}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allSelected = notes.length > 0 && notes.every((n) => selected.has(n.id));

  // ============== Care Giver Notes (Rota) ==============
  // Sourced from caregivers who have visited this receiver
  const [page, setPage] = useState(1);

  const { data: rotaNotes = [], isLoading: loadingRota } = useQuery({
    queryKey: ["receiver-rota-notes", careReceiverId],
    queryFn: async () => {
      // Find caregivers linked to this receiver via daily_visits
      const { data: visits, error: vErr } = await supabase
        .from("daily_visits")
        .select("care_giver_id")
        .eq("care_receiver_id", careReceiverId);
      if (vErr) throw vErr;

      const cgIds = Array.from(new Set((visits ?? []).map((v) => v.care_giver_id).filter(Boolean) as string[]));
      if (cgIds.length === 0) return [] as RotaNote[];

      const { data, error } = await supabase
        .from("caregiver_rota_notes")
        .select("*")
        .in("care_giver_id", cgIds)
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
        <PassVersionView receiverName={receiver?.name} />
      ) : (
        <>
      {/* ======================= PRIVATE NOTES ======================= */}
      <Card className="border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/30 border-b flex-wrap">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary" /> Private Notes
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 text-xs w-[170px] pr-2" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 text-xs w-[170px] pr-2" />
            <Button size="sm" className="h-8 gap-1.5 bg-success text-success-foreground hover:bg-success/90"
              onClick={() => { setAppliedFrom(fromDate); setAppliedTo(toDate); }}>
              <RefreshCw className="h-3.5 w-3.5" /> Update
            </Button>
            <Button size="sm" className="h-8 gap-1.5" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5" /> Add New
            </Button>
            <Button size="sm" variant="secondary" className="h-8 gap-1.5" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={caregiverFilter} onValueChange={setCaregiverFilter}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Filter by caregiver..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Caregivers</SelectItem>
                {caregivers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="h-9 flex-1"><SelectValue placeholder="Note Bulk Actions..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="delete">Delete Selected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-9 px-4 bg-success text-success-foreground hover:bg-success/90"
                onClick={() => { if (bulkAction === "delete" && selected.size > 0) removeNotes.mutate(Array.from(selected)); setBulkAction(""); }}
                disabled={!bulkAction || selected.size === 0}
              >Go</Button>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={() => {
                      if (allSelected) setSelected(new Set());
                      else setSelected(new Set(notes.map((n) => n.id)));
                    }} />
                  </TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[180px]">Caregiver</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (<TableRow><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>)}
                {!isLoading && notes.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">No notes in selected date range</TableCell></TableRow>
                )}
                {notes.map((n) => {
                  const cg = caregivers.find((c) => c.id === n.care_giver_id);
                  return (
                    <TableRow key={n.id}>
                      <TableCell><Checkbox checked={selected.has(n.id)} onCheckedChange={() => toggleSelect(n.id)} /></TableCell>
                      <TableCell className="text-sm font-mono">{new Date(n.note_date).toLocaleDateString("en-GB")}</TableCell>
                      <TableCell className="text-sm">{cg?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
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
          <span className="text-sm font-semibold text-foreground">Care Giver Notes (Rota)</span>
        </div>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-info">
            Live rota notes from care givers involved in this service member's care
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Note" : "Add Private Note"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</Label>
              <Input type="date" value={draft.note_date} onChange={(e) => setDraft({ ...draft, note_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Caregiver (optional)</Label>
              <Select value={draft.care_giver_id} onValueChange={(v) => setDraft({ ...draft, care_giver_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select Caregiver..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {caregivers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Note</Label>
              <Textarea rows={5} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Write your note..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>{editing ? "Update" : "Add Note"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              onClick={() => deletingId && removeNotes.mutate([deletingId])}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </>
      )}
    </div>
  );
}
