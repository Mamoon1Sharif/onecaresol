import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface HolidayEntry {
  id: string;
  care_receiver_id: string;
  entry_type: string;
  start_date: string;
  end_date: string | null;
  hours: number | null;
  status: string;
  reason: string | null;
  notes: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  holiday: "Holiday", absence: "Absence", late: "Late", request: "Pending Request",
};

const fmt = (d: string | null) => (d ? format(new Date(d), "dd/MM/yyyy") : "-");

interface Props {
  careReceiverId: string;
  careReceiverName: string;
}

export const ReceiverHolidaysTab = ({ careReceiverId, careReceiverName }: Props) => {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState("holidays");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HolidayEntry | null>(null);
  const [defaultType, setDefaultType] = useState("holiday");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["receiver_holidays", careReceiverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receiver_holidays")
        .select("*")
        .eq("care_receiver_id", careReceiverId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as HolidayEntry[];
    },
  });

  const filtered = useMemo(() => {
    const byType = (t: string) =>
      t === "request"
        ? entries.filter((e) => e.status === "pending")
        : entries.filter((e) => e.entry_type === t && e.status !== "pending");
    return {
      holidays: byType("holiday"),
      absences: byType("absence"),
      lates: byType("late"),
      requests: byType("request"),
    };
  }, [entries]);

  const upsert = useMutation({
    mutationFn: async (e: Partial<HolidayEntry> & { id?: string }) => {
      if (e.id) {
        const { error } = await supabase.from("receiver_holidays").update(e).eq("id", e.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("receiver_holidays").insert({
          care_receiver_id: careReceiverId,
          entry_type: e.entry_type || "holiday",
          start_date: e.start_date!, end_date: e.end_date || null,
          hours: e.hours ?? 0, status: e.status || "approved",
          reason: e.reason || null, notes: e.notes || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receiver_holidays", careReceiverId] });
      setDialogOpen(false); setEditing(null); toast.success("Saved");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receiver_holidays").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receiver_holidays", careReceiverId] });
      toast.success("Removed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("receiver_holidays").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["receiver_holidays", careReceiverId] }),
    onError: (err: any) => toast.error(err.message),
  });

  const renderTable = (rows: HolidayEntry[], emptyMsg: string, isRequests = false) => (
    <div className="border rounded">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs">From</TableHead>
            <TableHead className="text-xs">To</TableHead>
            <TableHead className="text-xs text-right">Hours</TableHead>
            <TableHead className="text-xs">Reason</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs text-right w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">Loading...</TableCell></TableRow>
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-10 bg-muted/20">{emptyMsg}</TableCell></TableRow>
          ) : (
            rows.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs">{TYPE_LABEL[e.entry_type] || e.entry_type}</TableCell>
                <TableCell className="text-xs">{fmt(e.start_date)}</TableCell>
                <TableCell className="text-xs">{fmt(e.end_date)}</TableCell>
                <TableCell className="text-xs text-right">{Number(e.hours || 0).toFixed(1)}</TableCell>
                <TableCell className="text-xs max-w-xs truncate">{e.reason}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className={
                    e.status === "approved" ? "border-emerald-500 text-emerald-700" :
                    e.status === "rejected" ? "border-destructive text-destructive" :
                    "border-amber-500 text-amber-700"
                  }>{e.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isRequests && e.status === "pending" && (
                      <>
                        <button onClick={() => setStatus.mutate({ id: e.id, status: "approved" })} className="text-emerald-600" title="Approve">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setStatus.mutate({ id: e.id, status: "rejected" })} className="text-destructive" title="Reject">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    <button onClick={() => { setEditing(e); setDialogOpen(true); }} className="text-amber-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setConfirmDeleteId(e.id)} className="text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3 bg-muted/30 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Holidays & Absence
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <TabsList className="bg-muted/30">
                <TabsTrigger value="holidays" className="text-xs">All Holidays ({filtered.holidays.length})</TabsTrigger>
                <TabsTrigger value="absences" className="text-xs">All Absences ({filtered.absences.length})</TabsTrigger>
                <TabsTrigger value="lates" className="text-xs">All Lates ({filtered.lates.length})</TabsTrigger>
                <TabsTrigger value="requests" className="text-xs">Pending Requests ({filtered.requests.length})</TabsTrigger>
              </TabsList>
              <Button
                size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                onClick={() => {
                  setEditing(null);
                  setDefaultType(
                    activeSubTab === "absences" ? "absence" :
                    activeSubTab === "lates" ? "late" :
                    activeSubTab === "requests" ? "request" : "holiday"
                  );
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>

            <TabsContent value="holidays" className="mt-3">{renderTable(filtered.holidays, `No holidays for ${careReceiverName} so far`)}</TabsContent>
            <TabsContent value="absences" className="mt-3">{renderTable(filtered.absences, `No absences for ${careReceiverName} so far`)}</TabsContent>
            <TabsContent value="lates" className="mt-3">{renderTable(filtered.lates, `No lates for ${careReceiverName} so far`)}</TabsContent>
            <TabsContent value="requests" className="mt-3">{renderTable(filtered.requests, `No pending requests for ${careReceiverName} so far`, true)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Entry" : "Add Entry"}</DialogTitle></DialogHeader>
          <EntryForm initial={editing} defaultType={defaultType} onSubmit={(v) => upsert.mutate({ ...v, id: editing?.id })} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDeleteId) remove.mutate(confirmDeleteId); setConfirmDeleteId(null); }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const EntryForm = ({ initial, defaultType, onSubmit }: {
  initial: HolidayEntry | null; defaultType: string; onSubmit: (v: Partial<HolidayEntry>) => void;
}) => {
  const [type, setType] = useState(initial?.entry_type || defaultType);
  const [start, setStart] = useState(initial?.start_date || "");
  const [end, setEnd] = useState(initial?.end_date || "");
  const [hours, setHours] = useState(String(initial?.hours ?? "0"));
  const [status, setStatus] = useState(initial?.status || (defaultType === "request" ? "pending" : "approved"));
  const [reason, setReason] = useState(initial?.reason || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!start) return toast.error("Start date is required");
        onSubmit({
          entry_type: type, start_date: start, end_date: end || null,
          hours: Number(hours) || 0, status, reason: reason || null, notes: notes || null,
        });
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="holiday">Holiday</SelectItem>
              <SelectItem value="absence">Absence</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="request">Pending Request</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">From *</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
        </div>
        <div>
          <Label className="text-xs">To</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Hours</Label>
          <Input type="number" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Reason</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="text-xs">Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <DialogFooter>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
      </DialogFooter>
    </form>
  );
};
