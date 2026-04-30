import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCareGiver } from "@/hooks/use-care-data";
import { MemberSidebar, MemberTopBar } from "@/components/member/MemberSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  GraduationCap, Plus, ChevronLeft, ChevronRight, ArrowUpDown, Pencil, Trash2, Send, BookOpen,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const STATUS_OPTIONS = ["In Date", "Expired", "Never Expires", "Archived"] as const;
const SUB_STATUS_OPTIONS = ["None", "Mandatory Training", "No Action Required"] as const;

type Qualification = {
  id: string;
  care_giver_id: string;
  qualification: string;
  start_date: string | null;
  expiry_date: string | null;
  never_expires: boolean;
  status: string;
  sub_status: string;
  notes: string | null;
};

const emptyDraft = {
  qualification: "",
  start_date: "",
  expiry_date: "",
  never_expires: false,
  status: "In Date",
  sub_status: "None",
  notes: "",
};

export default function Qualifications() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: cg } = useCareGiver(id);

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof Qualification>("qualification");
  const [sortAsc, setSortAsc] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Qualification | null>(null);
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [subStatusOpen, setSubStatusOpen] = useState(false);
  const [trainingFor, setTrainingFor] = useState<Qualification | null>(null);
  const [trainStart, setTrainStart] = useState("");
  const [trainEnd, setTrainEnd] = useState("");
  const [trainNotes, setTrainNotes] = useState("");

  // Active training entries for this caregiver (for status badges)
  const { data: trainingEntries = [] } = useQuery({
    queryKey: ["caregiver_training_entries", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caregiver_holidays")
        .select("id, start_date, end_date, status, entry_type, reason, notes")
        .eq("care_giver_id", id!)
        .eq("entry_type", "training");
      if (error) throw error;
      return data as Array<{ id: string; start_date: string; end_date: string | null; status: string; entry_type: string; reason: string | null; notes: string | null }>;
    },
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const isOnTraining = trainingEntries.some(
    (t) => t.status !== "rejected" && today >= t.start_date && today <= (t.end_date ?? t.start_date),
  );
  const trainingByQual = (qualName: string) =>
    trainingEntries.find(
      (t) =>
        t.status !== "rejected" &&
        today >= t.start_date &&
        today <= (t.end_date ?? t.start_date) &&
        (t.reason ?? "").toLowerCase() === qualName.toLowerCase(),
    );

  const sendForTraining = useMutation({
    mutationFn: async () => {
      if (!trainingFor || !trainStart) throw new Error("Start date required");
      const { error } = await supabase.from("caregiver_holidays").insert({
        care_giver_id: id!,
        entry_type: "training",
        start_date: trainStart,
        end_date: trainEnd || trainStart,
        hours: 0,
        status: "approved",
        reason: trainingFor.qualification,
        notes: trainNotes || `Training scheduled for ${trainingFor.qualification}`,
      });
      if (error) throw error;
      // Mark qualification as Mandatory Training while underway
      await supabase
        .from("caregiver_qualifications" as any)
        .update({ sub_status: "Mandatory Training" } as any)
        .eq("id", trainingFor.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver_training_entries", id] });
      qc.invalidateQueries({ queryKey: ["caregiver_qualifications", id] });
      qc.invalidateQueries({ queryKey: ["caregiver_holidays_all"] });
      toast.success("Sent for training");
      setTrainingFor(null);
      setTrainStart("");
      setTrainEnd("");
      setTrainNotes("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const { data: qualifications = [] } = useQuery({
    queryKey: ["caregiver_qualifications", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caregiver_qualifications" as any)
        .select("*")
        .eq("care_giver_id", id!)
        .order("qualification");
      if (error) throw error;
      return data as unknown as Qualification[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        care_giver_id: id!,
        qualification: draft.qualification.trim(),
        start_date: draft.start_date || null,
        expiry_date: draft.never_expires ? null : (draft.expiry_date || null),
        never_expires: draft.never_expires,
        status: draft.never_expires ? "Never Expires" : draft.status,
        sub_status: draft.sub_status,
        notes: draft.notes || null,
      };
      if (editing) {
        const { error } = await supabase
          .from("caregiver_qualifications" as any)
          .update(payload as any)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("caregiver_qualifications" as any)
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver_qualifications", id] });
      toast.success(editing ? "Qualification updated" : "Qualification added");
      setDialogOpen(false);
      setEditing(null);
      setDraft({ ...emptyDraft });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (qid: string) => {
      const { error } = await supabase
        .from("caregiver_qualifications" as any)
        .delete()
        .eq("id", qid);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver_qualifications", id] });
      toast.success("Qualification removed");
      setDeletingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = qualifications;
    if (q) {
      list = list.filter(
        (x) =>
          x.qualification.toLowerCase().includes(q) ||
          x.status.toLowerCase().includes(q) ||
          x.sub_status.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const av = String(a[sortBy] ?? "");
      const bv = String(b[sortBy] ?? "");
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [qualifications, search, sortBy, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  // Sub-status counts
  const subStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    qualifications.forEach((q) => {
      counts[q.sub_status] = (counts[q.sub_status] ?? 0) + 1;
    });
    return counts;
  }, [qualifications]);

  const openCreate = () => {
    setEditing(null);
    setDraft({ ...emptyDraft });
    setDialogOpen(true);
  };

  const openEdit = (q: Qualification) => {
    setEditing(q);
    setDraft({
      qualification: q.qualification,
      start_date: q.start_date ?? "",
      expiry_date: q.expiry_date ?? "",
      never_expires: q.never_expires,
      status: q.status,
      sub_status: q.sub_status,
      notes: q.notes ?? "",
    });
    setDialogOpen(true);
  };

  const toggleSort = (col: keyof Qualification) => {
    if (sortBy === col) setSortAsc((s) => !s);
    else { setSortBy(col); setSortAsc(true); }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <MemberTopBar title="Team Member - All Qualifications" backTo={`/caregivers/${id}`} />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 p-4">
        <MemberSidebar cg={cg} basePath="qualifications" />

        <Card className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-medium text-primary flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Team Member Qualifications
            </h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => setSubStatusOpen(true)}
              >
                Qualification Sub Status
              </Button>
              <Button
                size="sm"
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={openCreate}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Qualification
              </Button>
            </div>
          </div>

          {/* Show entries + Search */}
          <div className="flex items-center justify-between pt-3 pb-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-7 w-[64px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Search:</Label>
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-7 w-[180px] text-xs"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border-t border-b border-foreground/30">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr_60px] text-xs font-semibold py-2 px-2 border-b border-foreground/30">
              <SortHeader label="Qualification" col="qualification" sortBy={sortBy} sortAsc={sortAsc} onClick={toggleSort} />
              <SortHeader label="Start" col="start_date" sortBy={sortBy} sortAsc={sortAsc} onClick={toggleSort} />
              <SortHeader label="Exp" col="expiry_date" sortBy={sortBy} sortAsc={sortAsc} onClick={toggleSort} />
              <SortHeader label="Status" col="status" sortBy={sortBy} sortAsc={sortAsc} onClick={toggleSort} />
              <SortHeader label="Sub-Status" col="sub_status" sortBy={sortBy} sortAsc={sortAsc} onClick={toggleSort} />
              <div className="text-right">Actions</div>
            </div>
            {pageItems.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No qualifications.
              </div>
            ) : (
              pageItems.map((q, i) => (
                <div
                  key={q.id}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr_60px] text-xs py-2.5 px-2 items-center ${
                    i % 2 === 0 ? "bg-muted/30" : "bg-background"
                  }`}
                >
                  <div className="text-foreground">{q.qualification}</div>
                  <div className="text-muted-foreground">
                    {q.start_date ? format(parseISO(q.start_date), "dd/MM/yyyy") : "—"}
                  </div>
                  <div className="text-muted-foreground">
                    {q.never_expires ? "Never Expires" : q.expiry_date ? format(parseISO(q.expiry_date), "dd/MM/yyyy") : "—"}
                  </div>
                  <div><StatusBadge status={q.status} /></div>
                  <div className="text-muted-foreground">{q.sub_status}</div>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(q)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => setDeletingId(q.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
            <span>
              Showing {filtered.length === 0 ? 0 : pageStart + 1} to{" "}
              {Math.min(pageStart + pageSize, filtered.length)} of {filtered.length} entries
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-3 w-3" /> Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 6)
                .map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === currentPage ? "default" : "outline"}
                    className="h-7 w-7 p-0 text-xs"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Qualification" : "Add Qualification"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Qualification *</Label>
              <Input
                value={draft.qualification}
                onChange={(e) => setDraft({ ...draft, qualification: e.target.value })}
                placeholder="e.g. Safeguarding of Adults"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={draft.start_date}
                onChange={(e) => setDraft({ ...draft, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Expiry Date</Label>
              <Input
                type="date"
                value={draft.expiry_date}
                disabled={draft.never_expires}
                onChange={(e) => setDraft({ ...draft, expiry_date: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox
                id="never-expires"
                checked={draft.never_expires}
                onCheckedChange={(v) => setDraft({ ...draft, never_expires: !!v })}
              />
              <Label htmlFor="never-expires" className="text-xs cursor-pointer">Never expires</Label>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select
                value={draft.never_expires ? "Never Expires" : draft.status}
                disabled={draft.never_expires}
                onValueChange={(v) => setDraft({ ...draft, status: v })}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sub-Status</Label>
              <Select
                value={draft.sub_status}
                onValueChange={(v) => setDraft({ ...draft, sub_status: v })}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUB_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!draft.qualification.trim() || upsertMutation.isPending}
              onClick={() => upsertMutation.mutate()}
            >
              {editing ? "Save Changes" : "Add Qualification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-status summary dialog */}
      <Dialog open={subStatusOpen} onOpenChange={setSubStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Qualification Sub Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {SUB_STATUS_OPTIONS.map((s) => (
              <div key={s} className="flex items-center justify-between px-3 py-2 rounded border border-border">
                <span className="text-sm text-foreground">{s}</span>
                <span className="text-sm font-semibold text-primary">{subStatusCounts[s] ?? 0}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubStatusOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete qualification?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this qualification record. This action cannot be undone.
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

function SortHeader({
  label, col, sortBy, sortAsc, onClick,
}: {
  label: string; col: keyof Qualification;
  sortBy: keyof Qualification; sortAsc: boolean;
  onClick: (c: keyof Qualification) => void;
}) {
  const active = sortBy === col;
  return (
    <button
      onClick={() => onClick(col)}
      className="flex items-center gap-1 hover:text-foreground text-left"
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${active ? "text-primary" : "text-muted-foreground/50"}`} />
      {active && <span className="text-[9px] text-primary">{sortAsc ? "▲" : "▼"}</span>}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "In Date": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    "Expired": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "Never Expires": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "Archived": "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${styles[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
