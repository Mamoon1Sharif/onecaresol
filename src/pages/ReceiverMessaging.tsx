import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCareReceiver } from "@/hooks/use-care-data";
import { ServiceUserSidebar, ServiceUserTopBar } from "@/components/member/ServiceUserSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function ReceiverMessaging() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: cr } = useCareReceiver(id);

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [draftNote, setDraftNote] = useState("");

  const { data: notifications = [] } = useQuery({
    queryKey: ["receiver_push_notifications", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receiver_push_notifications" as any)
        .select("*")
        .eq("care_receiver_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (note: string) => {
      const { error } = await supabase
        .from("receiver_push_notifications" as any)
        .insert({ care_receiver_id: id!, note, created_by: "Admin" } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receiver_push_notifications", id] });
      toast.success("Notification sent");
      setCreateOpen(false);
      setDraftNote("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return notifications;
    return notifications.filter(
      (n) => (n.note || "").toLowerCase().includes(q) || (n.created_by || "").toLowerCase().includes(q)
    );
  }, [notifications, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  return (
    <div className="min-h-screen bg-muted/30">
      <ServiceUserTopBar title="Service User - Send Message" backTo={`/carereceivers/${id}`} />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 p-4">
        <ServiceUserSidebar cr={cr} basePath="messaging" />

        <Card className="p-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-medium text-primary flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Send Notification To Service User
            </h3>
            <Button
              size="sm"
              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Create
            </Button>
          </div>

          <div className="flex items-center justify-between pt-3 pb-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-7 w-[64px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Search:</Label>
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-7 w-[180px] text-xs" />
            </div>
          </div>

          <div className="border-t border-b border-foreground/30">
            <div className="grid grid-cols-[140px_140px_1fr] text-xs font-semibold py-2 px-2 border-b border-foreground/30">
              <div>Created By</div>
              <div>Created</div>
              <div>Note</div>
            </div>
            {pageItems.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">No notifications yet.</div>
            ) : (
              pageItems.map((n, i) => (
                <div key={n.id} className={`grid grid-cols-[140px_140px_1fr] text-xs py-2.5 px-2 ${i % 2 === 0 ? "bg-muted/30" : "bg-background"}`}>
                  <div className="text-muted-foreground">{n.created_by || "—"}</div>
                  <div className="text-muted-foreground">{format(new Date(n.created_at), "dd/MM/yyyy HH:mm")}</div>
                  <div className="text-foreground break-words">{n.note}</div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
            <span>
              Showing {filtered.length === 0 ? 0 : pageStart + 1} to {Math.min(pageStart + pageSize, filtered.length)} of {filtered.length} entries
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-3 w-3" /> Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 6).map((p) => (
                <Button key={p} size="sm" variant={p === currentPage ? "default" : "outline"} className="h-7 w-7 p-0 text-xs" onClick={() => setPage(p)}>{p}</Button>
              ))}
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs">Note</Label>
            <Textarea value={draftNote} onChange={(e) => setDraftNote(e.target.value)} rows={5} placeholder="Type the message…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!draftNote.trim() || createMutation.isPending} onClick={() => createMutation.mutate(draftNote.trim())}>
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
