import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Plus, Pencil, Settings, Users } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Reminder {
  id: string;
  care_receiver_id: string;
  reminder_name: string;
  account: string | null;
  first_due: string | null;
  repeat_interval: string;
  end_date: string | null;
  status: string;
  was_set_for: string | null;
  completed_at: string | null;
  completed_by: string | null;
  completion_notes: string | null;
}

const REPEAT_OPTIONS = ["Never", "Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];

const fmt = (d: string | null) => (d ? format(new Date(d), "dd/MM/yyyy") : "-");
const fmtDateTime = (d: string | null) => (d ? format(new Date(d), "HH:mm dd/MM/yyyy") : "-");

interface Props {
  careReceiverId: string;
  careReceiverName: string;
}

export const ReceiverRemindersTab = ({ careReceiverId, careReceiverName }: Props) => {
  const queryClient = useQueryClient();
  const [activeSearch, setActiveSearch] = useState("");
  const [bulkAction, setBulkAction] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["receiver_reminders", careReceiverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receiver_reminders")
        .select("*")
        .eq("care_receiver_id", careReceiverId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Reminder[];
    },
  });

  const active = useMemo(
    () => reminders.filter((r) => r.status === "active").filter((r) =>
      activeSearch ? r.reminder_name.toLowerCase().includes(activeSearch.toLowerCase()) : true,
    ),
    [reminders, activeSearch],
  );
  const complete = reminders.filter((r) => r.status === "complete");
  const cancelled = reminders.filter((r) => r.status === "cancelled");

  const upsert = useMutation({
    mutationFn: async (r: Partial<Reminder> & { id?: string }) => {
      if (r.id) {
        const { error } = await supabase.from("receiver_reminders").update(r).eq("id", r.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("receiver_reminders").insert({
          care_receiver_id: careReceiverId,
          account: careReceiverName,
          reminder_name: r.reminder_name!,
          first_due: r.first_due || null,
          repeat_interval: r.repeat_interval || "Never",
          end_date: r.end_date || null,
          status: "active",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receiver_reminders", careReceiverId] });
      setDialogOpen(false);
      setEditing(null);
      toast.success("Reminder saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkMutate = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
      if (action === "delete") {
        const { error } = await supabase.from("receiver_reminders").delete().in("id", ids);
        if (error) throw error;
      } else if (action === "complete" || action === "cancel") {
        const { error } = await supabase.from("receiver_reminders").update({
          status: action === "complete" ? "complete" : "cancelled",
          completed_at: new Date().toISOString(),
          completed_by: "Admin User",
        }).in("id", ids);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receiver_reminders", careReceiverId] });
      setSelectedIds(new Set());
      setBulkAction("");
      toast.success("Bulk action applied");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleId = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };
  const toggleAll = (rows: Reminder[]) => {
    const allSelected = rows.every((r) => selectedIds.has(r.id));
    const next = new Set(selectedIds);
    rows.forEach((r) => (allSelected ? next.delete(r.id) : next.add(r.id)));
    setSelectedIds(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" className="gap-1.5">
          <Users className="h-3.5 w-3.5" /> All Service Members
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 bg-amber-500 text-white border-amber-500 hover:bg-amber-600 hover:text-white">
          <Settings className="h-3.5 w-3.5" /> Reminder Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between py-3 bg-muted/30 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" /> Reminders
            </CardTitle>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="h-8 w-44 text-xs">
                    <SelectValue placeholder="Bulk Actions......" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="complete">Mark Complete</SelectItem>
                    <SelectItem value="cancel">Cancel</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!bulkAction || selectedIds.size === 0}
                  onClick={() => bulkMutate.mutate({ ids: Array.from(selectedIds), action: bulkAction })}
                >Go</Button>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Search:</Label>
                <Input className="h-8 w-48 text-xs" value={activeSearch} onChange={(e) => setActiveSearch(e.target.value)} />
              </div>
            </div>

            <div className="border rounded">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-8">
                      <Checkbox
                        checked={active.length > 0 && active.every((r) => selectedIds.has(r.id))}
                        onCheckedChange={() => toggleAll(active)}
                      />
                    </TableHead>
                    <TableHead className="w-12 text-xs">Edit</TableHead>
                    <TableHead className="text-xs">Reminder</TableHead>
                    <TableHead className="text-xs">First Due</TableHead>
                    <TableHead className="text-xs">Repeat</TableHead>
                    <TableHead className="text-xs">End</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">Loading...</TableCell></TableRow>
                  ) : active.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">No reminders</TableCell></TableRow>
                  ) : (
                    active.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell><Checkbox checked={selectedIds.has(r.id)} onCheckedChange={() => toggleId(r.id)} /></TableCell>
                        <TableCell>
                          <button onClick={() => { setEditing(r); setDialogOpen(true); }} className="text-amber-500">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                        <TableCell className="text-xs text-emerald-700 font-medium">{r.reminder_name}</TableCell>
                        <TableCell className="text-xs">{fmt(r.first_due)}</TableCell>
                        <TableCell className="text-xs">{r.repeat_interval}</TableCell>
                        <TableCell className="text-xs">{fmt(r.end_date)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 bg-muted/30 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" /> Active Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            {active.length === 0 ? (
              <p className="text-xs text-muted-foreground">No Active Reminders</p>
            ) : (
              <ul className="space-y-2">
                {active.map((r) => (
                  <li key={r.id} className="text-xs border rounded p-2">
                    <div className="font-medium text-emerald-700">{r.reminder_name}</div>
                    <div className="text-muted-foreground">Due: {fmt(r.first_due)}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-3 bg-muted/30 border-b">
          <CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" /> Complete Reminders</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {complete.length === 0 ? (
            <p className="text-xs text-muted-foreground">No Reminders</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Reminder</TableHead>
                  <TableHead className="text-xs">Account</TableHead>
                  <TableHead className="text-xs">Was Set For</TableHead>
                  <TableHead className="text-xs">Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complete.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-emerald-700">{r.reminder_name}</TableCell>
                    <TableCell className="text-xs text-emerald-700">{r.account}</TableCell>
                    <TableCell className="text-xs">{fmt(r.was_set_for)}</TableCell>
                    <TableCell className="text-xs">{fmtDateTime(r.completed_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Reminder" : "Add Reminder"}</DialogTitle>
          </DialogHeader>
          <ReminderForm initial={editing} onSubmit={(values) => upsert.mutate({ ...values, id: editing?.id })} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ReminderForm = ({ initial, onSubmit }: { initial: Reminder | null; onSubmit: (v: Partial<Reminder>) => void }) => {
  const [name, setName] = useState(initial?.reminder_name || "");
  const [firstDue, setFirstDue] = useState(initial?.first_due || "");
  const [repeat, setRepeat] = useState(initial?.repeat_interval || "Never");
  const [end, setEnd] = useState(initial?.end_date || "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name) return toast.error("Reminder name required");
        onSubmit({ reminder_name: name, first_due: firstDue || null, repeat_interval: repeat, end_date: end || null });
      }}
      className="space-y-3"
    >
      <div>
        <Label className="text-xs">Reminder Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">First Due</Label>
          <Input type="date" value={firstDue} onChange={(e) => setFirstDue(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">End Date</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Repeat</Label>
          <Select value={repeat} onValueChange={setRepeat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {REPEAT_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
      </DialogFooter>
    </form>
  );
};
