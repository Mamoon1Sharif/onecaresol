import { useState, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Clock, GripVertical, AlertTriangle, User,
} from "lucide-react";

// ── Types ──

interface Visit {
  id: number;
  careReceiver: string;
  careReceiverAvatar: string;
  dnacpr: boolean;
  status: "Pending" | "Confirmed";
  startHour: number;
  duration: number;
  careGiverId: string | null;
}

interface CareGiver {
  id: string;
  name: string;
}

// ── Data ──

const careGivers: CareGiver[] = [
  { id: "cg1", name: "Sarah Johnson" },
  { id: "cg2", name: "James Smith" },
  { id: "cg3", name: "Emily Davis" },
  { id: "cg4", name: "Michael Brown" },
  { id: "cg5", name: "Rachel Wilson" },
];

const initialVisits: Visit[] = [
  { id: 1, careReceiver: "Margaret Thompson", careReceiverAvatar: "MT", dnacpr: true, status: "Confirmed", startHour: 7, duration: 2, careGiverId: "cg1" },
  { id: 2, careReceiver: "John Davies", careReceiverAvatar: "JD", dnacpr: false, status: "Pending", startHour: 9, duration: 1, careGiverId: "cg1" },
  { id: 3, careReceiver: "Dorothy Williams", careReceiverAvatar: "DW", dnacpr: false, status: "Confirmed", startHour: 8, duration: 2, careGiverId: "cg2" },
  { id: 4, careReceiver: "Robert Evans", careReceiverAvatar: "RE", dnacpr: true, status: "Pending", startHour: 14, duration: 1, careGiverId: "cg3" },
  { id: 5, careReceiver: "Mary Clarke", careReceiverAvatar: "MC", dnacpr: false, status: "Pending", startHour: 10, duration: 2, careGiverId: null },
  { id: 6, careReceiver: "William Harris", careReceiverAvatar: "WH", dnacpr: false, status: "Pending", startHour: 16, duration: 1, careGiverId: null },
  { id: 7, careReceiver: "Elizabeth Taylor", careReceiverAvatar: "ET", dnacpr: true, status: "Pending", startHour: 12, duration: 2, careGiverId: null },
  { id: 8, careReceiver: "George Martin", careReceiverAvatar: "GM", dnacpr: false, status: "Confirmed", startHour: 18, duration: 1, careGiverId: "cg4" },
  { id: 9, careReceiver: "Patricia Jones", careReceiverAvatar: "PJ", dnacpr: false, status: "Pending", startHour: 7, duration: 1, careGiverId: "cg5" },
  { id: 10, careReceiver: "Thomas White", careReceiverAvatar: "TW", dnacpr: false, status: "Confirmed", startHour: 15, duration: 2, careGiverId: "cg2" },
];

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
const ROW_HEIGHT = 56;

const statusColors: Record<string, string> = {
  Pending: "bg-warning/15 text-warning border-warning/30",
  Confirmed: "bg-success/15 text-success border-success/30",
};

const statusCardBg: Record<string, string> = {
  Pending: "border-l-warning bg-warning/5 hover:bg-warning/10",
  Confirmed: "border-l-success bg-success/5 hover:bg-success/10",
};

const avatarColors = [
  "bg-primary/20 text-primary",
  "bg-accent text-accent-foreground",
  "bg-success/20 text-success",
  "bg-warning/20 text-warning",
  "bg-destructive/20 text-destructive",
];

function formatHour(h: number) {
  if (h === 0 || h === 24) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function getDateLabel(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ── Component ──

const DailyRoster = () => {
  const { toast } = useToast();
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [dayOffset, setDayOffset] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ cgId: string | null; hour: number } | null>(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    visitId: number;
    targetCgId: string | null;
    targetHour?: number;
  }>({ open: false, visitId: 0, targetCgId: null });

  // Time slot editing
  const [editingVisit, setEditingVisit] = useState<number | null>(null);

  const unassigned = visits.filter((v) => v.careGiverId === null);
  const allCareReceivers = visits.map((v) => ({
    name: v.careReceiver,
    avatar: v.careReceiverAvatar,
    dnacpr: v.dnacpr,
    assigned: v.careGiverId !== null,
    visitId: v.id,
  }));

  const handleDragStart = useCallback((e: React.DragEvent, visitId: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(visitId));
    setDragging(visitId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setDragOverTarget(null);
  }, []);

  const requestMove = useCallback((visitId: number, targetCgId: string | null, targetHour?: number) => {
    setConfirmDialog({ open: true, visitId, targetCgId, targetHour });
  }, []);

  const confirmMove = useCallback(() => {
    const { visitId, targetCgId, targetHour } = confirmDialog;

    setVisits((prev) => prev.map((v) => {
      if (v.id !== visitId) return v;
      const wasAssigned = v.careGiverId !== null;
      const willBeAssigned = targetCgId !== null;

      let newStatus = v.status;
      if (!wasAssigned && willBeAssigned) newStatus = "Confirmed";
      if (wasAssigned && !willBeAssigned) newStatus = "Pending";

      const updated = { ...v, careGiverId: targetCgId, status: newStatus };
      if (targetHour !== undefined) updated.startHour = targetHour;
      return updated;
    }));

    const visit = visits.find((v) => v.id === visitId);
    const cg = careGivers.find((c) => c.id === targetCgId);
    toast({
      title: targetCgId
        ? `✅ ${visit?.careReceiver} assigned to ${cg?.name}`
        : `↩️ ${visit?.careReceiver} moved to Unassigned`,
      description: targetCgId
        ? "Status changed to Confirmed"
        : "Status changed to Pending",
    });
    setConfirmDialog({ open: false, visitId: 0, targetCgId: null });
  }, [confirmDialog, visits, toast]);

  const handleDrop = useCallback((e: React.DragEvent, careGiverId: string | null, hour?: number) => {
    e.preventDefault();
    const visitId = Number(e.dataTransfer.getData("text/plain"));
    if (!visitId) return;
    setDragging(null);
    setDragOverTarget(null);
    requestMove(visitId, careGiverId, hour);
  }, [requestMove]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleTimeChange = (visitId: number, field: "startHour" | "duration", value: number) => {
    setVisits((prev) => prev.map((v) => v.id === visitId ? { ...v, [field]: value } : v));
  };

  // ── Visit Card (grid overlay) ──
  const GridVisitCard = ({ visit }: { visit: Visit }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, visit.id)}
      onDragEnd={handleDragEnd}
      className={`
        h-full rounded-md border border-l-4 p-1.5 cursor-grab active:cursor-grabbing
        select-none transition-all duration-150 shadow-sm hover:shadow-md flex flex-col
        ${statusCardBg[visit.status]}
        ${dragging === visit.id ? "opacity-40 scale-95" : "opacity-100"}
      `}
    >
      <div className="flex items-start gap-1">
        <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-xs font-semibold text-foreground truncate">{visit.careReceiver}</p>
            {visit.dnacpr && (
              <Badge className="bg-destructive/15 text-destructive border-destructive/30 border text-[8px] px-1 py-0 shrink-0">
                DNACPR
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
            {editingVisit === visit.id ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Select
                  value={String(visit.startHour)}
                  onValueChange={(val) => handleTimeChange(visit.id, "startHour", Number(val))}
                >
                  <SelectTrigger className="h-5 w-[60px] text-[10px] px-1 border-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)} className="text-xs">{formatHour(h)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(visit.duration)}
                  onValueChange={(val) => handleTimeChange(visit.id, "duration", Number(val))}
                >
                  <SelectTrigger className="h-5 w-[45px] text-[10px] px-1 border-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((d) => (
                      <SelectItem key={d} value={String(d)} className="text-xs">{d}h</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1 text-[10px]"
                  onClick={() => setEditingVisit(null)}
                >
                  ✓
                </Button>
              </div>
            ) : (
              <button
                className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                onClick={() => setEditingVisit(visit.id)}
              >
                {formatHour(visit.startHour)} – {formatHour(visit.startHour + visit.duration)}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <Badge className={`${statusColors[visit.status]} border text-[9px] px-1.5 py-0`}>
          {visit.status}
        </Badge>
      </div>
    </div>
  );

  // ── Unassigned card (compact, for top bar) ──
  const UnassignedCard = ({ visit }: { visit: Visit }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, visit.id)}
      onDragEnd={handleDragEnd}
      className={`
        shrink-0 w-[180px] rounded-md border border-l-4 p-2 cursor-grab active:cursor-grabbing
        select-none transition-all duration-150 shadow-sm hover:shadow-md
        ${statusCardBg[visit.status]}
        ${dragging === visit.id ? "opacity-40 scale-95" : "opacity-100"}
      `}
    >
      <div className="flex items-center gap-1.5">
        <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-xs font-semibold text-foreground truncate">{visit.careReceiver}</p>
            {visit.dnacpr && (
              <Badge className="bg-destructive/15 text-destructive border-destructive/30 border text-[8px] px-1 py-0 shrink-0">
                DNACPR
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-2.5 w-2.5" />
            {formatHour(visit.startHour)} – {formatHour(visit.startHour + visit.duration)}
          </p>
        </div>
        <Badge className={`${statusColors[visit.status]} border text-[9px] px-1.5 py-0 shrink-0`}>
          {visit.status}
        </Badge>
      </div>
    </div>
  );

  const confirmVisit = visits.find((v) => v.id === confirmDialog.visitId);
  const confirmCg = careGivers.find((c) => c.id === confirmDialog.targetCgId);

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Daily Roster</h1>
            <p className="text-sm text-muted-foreground mt-1">Drag and drop visits to assign caregivers</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setDayOffset((d) => d - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-foreground min-w-[200px] text-center">
              {getDateLabel(dayOffset)}
            </span>
            {dayOffset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => setDayOffset(0)}>Today</Button>
            )}
            <Button variant="outline" size="icon" onClick={() => setDayOffset((d) => d + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Unassigned – top horizontal slideable bar */}
        <Card className="border border-border shadow-sm">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Unassigned Visits</h2>
            <Badge variant="secondary" className="ml-1 text-xs">{unassigned.length}</Badge>
          </div>
          <ScrollArea className="w-full">
            <div
              className={`flex gap-2 p-3 min-h-[72px] transition-colors ${
                dragOverTarget?.cgId === null ? "bg-accent/50" : ""
              }`}
              onDragOver={(e) => { handleDragOver(e); setDragOverTarget({ cgId: null, hour: 0 }); }}
              onDragLeave={() => setDragOverTarget(null)}
              onDrop={(e) => handleDrop(e, null)}
            >
              {unassigned.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 w-full text-center py-4">All visits assigned ✓</p>
              ) : (
                unassigned.map((v) => <UnassignedCard key={v.id} visit={v} />)
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>

        {/* Calendar Grid */}
        <Card className="border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="relative" style={{ minWidth: careGivers.length * 160 + 70 }}>
              {/* Header */}
              <div className="flex sticky top-0 z-10 bg-background border-b border-border">
                <div className="w-[70px] shrink-0 border-r border-border p-2 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground font-medium">TIME</span>
                </div>
                {careGivers.map((cg) => {
                  const cgVisits = visits.filter((v) => v.careGiverId === cg.id);
                  return (
                    <div key={cg.id} className="flex-1 min-w-[160px] border-r last:border-r-0 border-border p-2 text-center">
                      <p className="text-xs font-semibold text-foreground">{cg.name}</p>
                      <p className="text-[10px] text-muted-foreground">{cgVisits.length} visit{cgVisits.length !== 1 ? "s" : ""}</p>
                    </div>
                  );
                })}
              </div>

              {/* Grid body */}
              <div className="flex">
                <div className="w-[70px] shrink-0 border-r border-border">
                  {HOURS.map((h) => (
                    <div key={h} className="border-b border-border flex items-start justify-end pr-2 pt-1" style={{ height: ROW_HEIGHT }}>
                      <span className="text-[10px] text-muted-foreground font-medium">{formatHour(h)}</span>
                    </div>
                  ))}
                </div>

                {careGivers.map((cg) => (
                  <div key={cg.id} className="flex-1 min-w-[160px] border-r last:border-r-0 border-border relative">
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        className={`border-b border-border transition-colors ${
                          dragOverTarget?.cgId === cg.id && dragOverTarget?.hour === h
                            ? "bg-primary/10"
                            : h % 2 === 0 ? "bg-background" : "bg-muted/20"
                        }`}
                        style={{ height: ROW_HEIGHT }}
                        onDragOver={(e) => { handleDragOver(e); setDragOverTarget({ cgId: cg.id, hour: h }); }}
                        onDragLeave={() => setDragOverTarget(null)}
                        onDrop={(e) => handleDrop(e, cg.id, h)}
                      />
                    ))}

                    {visits
                      .filter((v) => v.careGiverId === cg.id)
                      .map((v) => (
                        <div
                          key={v.id}
                          className="absolute left-1 right-1 z-[5]"
                          style={{
                            top: (v.startHour - 6) * ROW_HEIGHT + 2,
                            height: v.duration * ROW_HEIGHT - 4,
                          }}
                        >
                          <GridVisitCard visit={v} />
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Patients panel at bottom */}
        <Card className="border border-border shadow-sm">
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Care Receivers</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">All patients scheduled today</p>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-3 p-3">
              {allCareReceivers.map((cr, i) => (
                <div key={cr.visitId} className="shrink-0 flex flex-col items-center gap-1.5 w-[80px] group">
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                        avatarColors[i % avatarColors.length]
                      } ring-2 ${cr.assigned ? "ring-success/50" : "ring-warning/50"} transition-all group-hover:scale-105`}
                    >
                      {cr.avatar}
                    </div>
                    {cr.dnacpr && (
                      <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5" title="DNACPR">
                        <AlertTriangle className="h-3 w-3" />
                      </div>
                    )}
                    <div
                      className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-background ${
                        cr.assigned ? "bg-success" : "bg-warning"
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-foreground font-medium text-center leading-tight truncate w-full">
                    {cr.name}
                  </p>
                  {cr.dnacpr && (
                    <Badge className="bg-destructive/15 text-destructive border-destructive/30 border text-[8px] px-1 py-0">
                      DNACPR
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog((s) => ({ ...s, open: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Assignment Change</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.targetCgId
                ? <>Move <strong>{confirmVisit?.careReceiver}</strong> to <strong>{confirmCg?.name}</strong>? Status will change to <Badge className="bg-success/15 text-success border-success/30 border text-xs px-1.5 py-0 mx-1 inline">Confirmed</Badge>.</>
                : <>Move <strong>{confirmVisit?.careReceiver}</strong> to <strong>Unassigned</strong>? Status will change to <Badge className="bg-warning/15 text-warning border-warning/30 border text-xs px-1.5 py-0 mx-1 inline">Pending</Badge>.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMove}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default DailyRoster;
