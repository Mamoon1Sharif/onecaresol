import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCareGivers, useCareGiver } from "@/hooks/use-care-data";
import { getCareGiverAvatar } from "@/lib/avatars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft, LogOut, Plus, Bell, MapPin, Phone, IdCard, Hash,
  CalendarDays, Building2, FileBadge, ChevronLeft, ChevronRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function Messaging() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: careGivers = [] } = useCareGivers();
  const { data: cg, isLoading } = useCareGiver(id);

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [draftNote, setDraftNote] = useState("");

  // Notifications query
  const { data: notifications = [] } = useQuery({
    queryKey: ["caregiver_push_notifications", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caregiver_push_notifications" as any)
        .select("*")
        .eq("care_giver_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (note: string) => {
      const { error } = await supabase
        .from("caregiver_push_notifications" as any)
        .insert({ care_giver_id: id!, note, created_by: "Admin" } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver_push_notifications", id] });
      toast.success("Push notification sent");
      setCreateOpen(false);
      setDraftNote("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return notifications;
    return notifications.filter(
      (n) =>
        (n.note || "").toLowerCase().includes(q) ||
        (n.created_by || "").toLowerCase().includes(q)
    );
  }, [notifications, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  const age = cg?.dob
    ? Math.floor((Date.now() - new Date(cg.dob).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top toolbar */}
      <header className="bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              onClick={() => navigate("/caregivers")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Team Members
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-8 gap-1.5"
              onClick={() => toast.success("Handset logged out")}
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout of handset
            </Button>
          </div>
          <h1 className="text-base font-medium text-foreground">
            Team Member - Send Message
          </h1>
          <div className="w-[260px]" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 p-4">
        {/* LEFT — Profile column */}
        <div className="space-y-4">
          {/* Member selector */}
          <Card className="p-2">
            <Select
              value={id}
              onValueChange={(val) => navigate(`/caregivers/${val}/messaging`)}
            >
              <SelectTrigger className="h-9 bg-muted/50 border-border">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {careGivers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Profile card */}
          <Card className="overflow-hidden">
            {isLoading || !cg ? (
              <div className="p-6 text-sm text-muted-foreground">Loading…</div>
            ) : (
              <>
                <div className="flex flex-col items-center pt-6 pb-4 px-4">
                  <img
                    src={getCareGiverAvatar(cg.id)}
                    alt={cg.name}
                    className="h-20 w-20 rounded-full object-cover ring-1 ring-border"
                  />
                  <h2 className="mt-3 text-lg font-semibold text-primary">
                    {cg.name}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cg.permission || "Field User"}
                  </p>
                </div>
                <Separator />

                <DetailRow label="Tags">
                  <div className="flex flex-wrap gap-1 justify-end">
                    {(cg.tags ?? []).slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </DetailRow>
                <DetailRow label="Sub Status">
                  <span className="text-amber-600 dark:text-amber-400 text-xs">
                    References applied for
                  </span>
                </DetailRow>
                <DetailRow label="DOB (AGE)">
                  <span className="text-amber-600 dark:text-amber-400 text-xs">
                    {cg.dob ? format(parseISO(cg.dob), "dd/MM/yyyy") : "—"}
                    {age !== null && ` (${age})`}
                  </span>
                </DetailRow>
                <DetailRow label="Sex Assigned At Birth">
                  <span className="text-pink-500 text-sm">
                    {cg.sex_assigned_at_birth === "Male" ? "♂" : "♀"}
                  </span>
                </DetailRow>
                <DetailRow label="Reference No">
                  <span className="text-foreground text-xs">
                    {cg.reference_no || "—"}
                  </span>
                </DetailRow>
                <DetailRow label="Manager">
                  <span className="text-primary text-xs">
                    {cg.manager || "—"}
                  </span>
                </DetailRow>
                <DetailRow label="Areas">
                  <span className="text-muted-foreground text-xs">
                    {cg.town || "—"}
                  </span>
                </DetailRow>

                <SectionHeader title="About Me" />
                <IconRow icon={IdCard} label="NI Number" value={cg.ni_number} />
                <IconRow icon={FileBadge} label="NHS Number" value={(cg as any).nhs_number} />
                <IconRow icon={Hash} label="Patient Number" value={(cg as any).patient_number} />
                <IconRow icon={Hash} label="Health Care Number" value={(cg as any).health_care_number} />
                <IconRow icon={Hash} label="Community Health Index" value={(cg as any).community_health_index} />
                <IconRow icon={MapPin} label="Address" value={cg.address}>
                  {cg.address && (
                    <Link
                      to="#"
                      className="text-primary text-xs hover:underline mt-1 inline-block"
                    >
                      View Map
                    </Link>
                  )}
                </IconRow>
                <IconRow icon={Phone} label="Contact Details" value={cg.phone} />
              </>
            )}
          </Card>
        </div>

        {/* RIGHT — Push notifications panel */}
        <Card className="p-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-medium text-primary flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Send Push Notification To Device
            </h3>
            <Button
              size="sm"
              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Create
            </Button>
          </div>

          {/* Show entries + Search */}
          <div className="flex items-center justify-between pt-3 pb-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
              >
                <SelectTrigger className="h-7 w-[64px] text-xs">
                  <SelectValue />
                </SelectTrigger>
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
            <div className="grid grid-cols-[140px_140px_1fr] text-xs font-semibold py-2 px-2 border-b border-foreground/30">
              <div>Created By</div>
              <div>Created</div>
              <div>Note</div>
            </div>
            {pageItems.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              pageItems.map((n, i) => (
                <div
                  key={n.id}
                  className={`grid grid-cols-[140px_140px_1fr] text-xs py-2.5 px-2 ${
                    i % 2 === 0 ? "bg-muted/30" : "bg-background"
                  }`}
                >
                  <div className="text-muted-foreground">{n.created_by || "—"}</div>
                  <div className="text-muted-foreground">
                    {format(new Date(n.created_at), "dd/MM/yyyy HH:mm")}
                  </div>
                  <div className="text-foreground break-words">{n.note}</div>
                </div>
              ))
            )}
          </div>

          {/* Footer: count + pagination */}
          <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
            <span>
              Showing {filtered.length === 0 ? 0 : pageStart + 1} to{" "}
              {Math.min(pageStart + pageSize, filtered.length)} of {filtered.length} entries
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3 w-3" />
                Previous
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
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Push Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs">Note</Label>
            <Textarea
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              rows={5}
              placeholder="Type the message to send to this team member's device…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!draftNote.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate(draftNote.trim())}
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border text-xs">
      <span className="font-semibold text-foreground">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 py-2 border-b border-primary/40 text-xs font-semibold text-primary bg-primary/5">
      {title}
    </div>
  );
}

function IconRow({
  icon: Icon, label, value, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-2.5 border-b border-border">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </div>
      {value && (
        <p className="text-xs text-muted-foreground mt-0.5 ml-5">{value}</p>
      )}
      {children}
    </div>
  );
}
