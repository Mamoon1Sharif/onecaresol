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
  ChevronLeft, ChevronRight, Clock, GripVertical, AlertTriangle, User, Sun, Moon, Sunrise, Sunset,
} from "lucide-react";

// ── Types ──

type CareType = "24h" | "12h-live-in" | "8h-morning" | "8h-night";

interface Visit {
  id: number;
  careReceiver: string;
  careReceiverAvatar: string;
  dnacpr: boolean;
  careType: CareType;
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
  { id: 1, careReceiver: "Margaret Thompson", careReceiverAvatar: "MT", dnacpr: true, careType: "24h", status: "Confirmed", startHour: 0, duration: 8, careGiverId: "cg1" },
  { id: 11, careReceiver: "Margaret Thompson", careReceiverAvatar: "MT", dnacpr: true, careType: "24h", status: "Confirmed", startHour: 8, duration: 8, careGiverId: "cg2" },
  { id: 12, careReceiver: "Margaret Thompson", careReceiverAvatar: "MT", dnacpr: true, careType: "24h", status: "Pending", startHour: 16, duration: 8, careGiverId: null },
  { id: 2, careReceiver: "John Davies", careReceiverAvatar: "JD", dnacpr: false, careType: "12h-live-in", status: "Pending", startHour: 8, duration: 12, careGiverId: "cg1" },
  { id: 3, careReceiver: "Dorothy Williams", careReceiverAvatar: "DW", dnacpr: false, careType: "8h-morning", status: "Confirmed", startHour: 6, duration: 8, careGiverId: "cg2" },
  { id: 4, careReceiver: "Robert Evans", careReceiverAvatar: "RE", dnacpr: true, careType: "8h-night", status: "Pending", startHour: 22, duration: 8, careGiverId: "cg3" },
  { id: 5, careReceiver: "Mary Clarke", careReceiverAvatar: "MC", dnacpr: false, careType: "8h-morning", status: "Pending", startHour: 7, duration: 8, careGiverId: null },
  { id: 6, careReceiver: "William Harris", careReceiverAvatar: "WH", dnacpr: false, careType: "12h-live-in", status: "Pending", startHour: 9, duration: 12, careGiverId: null },
  { id: 7, careReceiver: "Elizabeth Taylor", careReceiverAvatar: "ET", dnacpr: true, careType: "24h", status: "Confirmed", startHour: 0, duration: 12, careGiverId: "cg4" },
  { id: 13, careReceiver: "Elizabeth Taylor", careReceiverAvatar: "ET", dnacpr: true, careType: "24h", status: "Pending", startHour: 12, duration: 12, careGiverId: null },
  { id: 8, careReceiver: "George Martin", careReceiverAvatar: "GM", dnacpr: false, careType: "8h-night", status: "Confirmed", startHour: 22, duration: 8, careGiverId: "cg4" },
  { id: 9, careReceiver: "Patricia Jones", careReceiverAvatar: "PJ", dnacpr: false, careType: "8h-morning", status: "Confirmed", startHour: 6, duration: 8, careGiverId: "cg5" },
  { id: 10, careReceiver: "Thomas White", careReceiverAvatar: "TW", dnacpr: false, careType: "12h-live-in", status: "Confirmed", startHour: 8, duration: 12, careGiverId: "cg3" },
];

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const COL_WIDTH = 60;
const ROW_HEIGHT = 80;

const statusColors: Record<string, string> = {
  Pending: "bg-warning/15 text-warning border-warning/30",
  Confirmed: "bg-success/15 text-success border-success/30",
};

const statusCardBg: Record<string, string> = {
  Pending: "border-t-warning bg-warning/5 hover:bg-warning/10",
  Confirmed: "border-t-success bg-success/5 hover:bg-success/10",
};

const avatarColors = [
  "bg-primary/20 text-primary",
  "bg-accent text-accent-foreground",
  "bg-success/20 text-success",
  "bg-warning/20 text-warning",
  "bg-destructive/20 text-destructive",
];

const careTypeConfig: Record<CareType, { label: string; icon: typeof Sun; color: string; window: string }> = {
  "24h": { label: "24h Care", icon: Clock, color: "bg-primary/15 text-primary border-primary/30", window: "00:00–00:00" },
  "12h-live-in": { label: "12h Live-In", icon: Sun, color: "bg-accent text-accent-foreground border-accent", window: "08:00–20:00" },
  "8h-morning": { label: "8h Morning", icon: Sunrise, color: "bg-success/15 text-success border-success/30", window: "06:00–14:00" },
  "8h-night": { label: "8h Night", icon: Moon, color: "bg-muted text-muted-foreground border-border", window: "22:00–06:00" },
};

function formatHour(h: number) {
  const hr = ((h % 24) + 24) % 24;
  if (hr === 0) return "12 AM";
  if (hr === 12) return "12 PM";
  return hr < 12 ? `${hr} AM` : `${hr - 12} PM`;
}

function formatHourShort(h: number) {
  const hr = ((h % 24) + 24) % 24;
  return `${hr.toString().padStart(2, "0")}:00`;
}

function getDateLabel(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// Group visits by unique care receiver
function groupByCareReceiver(visits: Visit[]) {
  const map = new Map<string, { name: string; avatar: string; dnacpr: boolean; careType: CareType; visits: Visit[] }>();
  for (const v of visits) {
    if (!map.has(v.careReceiver)) {
      map.set(v.careReceiver, { name: v.careReceiver, avatar: v.careReceiverAvatar, dnacpr: v.dnacpr, careType: v.careType, visits: [] });
    }
    map.get(v.careReceiver)!.visits.push(v);
  }
  return Array.from(map.values());
}

// ── Component ──

const DailyRoster = () => {
  const { toast } = useToast();
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [dayOffset, setDayOffset] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ receiver: string; hour: number } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    visitId: number;
    targetCgId: string | null;
    targetHour?: number;
  }>({ open: false, visitId: 0, targetCgId: null });

  const [editingVisit, setEditingVisit] = useState<number | null>(null);

  const unassigned = visits.filter((v) => v.careGiverId === null);
  const careReceiverGroups = groupByCareReceiver(visits);

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
      const updated: Visit = { ...v, careGiverId: targetCgId, status: newStatus };
      if (targetHour !== undefined) updated.startHour = targetHour;
      return updated;
    }));
    const visit = visits.find((v) => v.id === visitId);
    const cg = careGivers.find((c) => c.id === targetCgId);
    toast({
      title: targetCgId
        ? `✅ ${visit?.careReceiver} assigned to ${cg?.name}`
        : `↩️ ${visit?.careReceiver} moved to Unassigned`,
      description: targetCgId ? "Status → Confirmed" : "Status → Pending",
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

  // ── Horizontal Visit Card (inside grid) ──
  const HorizontalVisitCard = ({ visit }: { visit: Visit }) => {
    const cg = careGivers.find((c) => c.id === visit.careGiverId);
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, visit.id)}
        onDragEnd={handleDragEnd}
        className={`
          absolute top-1 bottom-1 rounded-md border border-t-4 cursor-grab active:cursor-grabbing
          select-none transition-all duration-150 shadow-sm hover:shadow-md flex flex-col justify-between p-1.5 z-[5]
          ${statusCardBg[visit.status]}
          ${dragging === visit.id ? "opacity-40 scale-95" : "opacity-100"}
        `}
        style={{
          left: visit.startHour * COL_WIDTH + 2,
          width: Math.min(visit.duration, 24 - visit.startHour) * COL_WIDTH - 4,
        }}
      >
        <div className="flex items-center gap-1 min-w-0">
          <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              {cg ? (
                <p className="text-[10px] font-semibold text-foreground truncate">{cg.name}</p>
              ) : (
                <p className="text-[10px] font-semibold text-warning truncate">Unassigned</p>
              )}
            </div>
            {editingVisit === visit.id ? (
              <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                <Select value={String(visit.startHour)} onValueChange={(val) => handleTimeChange(visit.id, "startHour", Number(val))}>
                  <SelectTrigger className="h-4 w-[50px] text-[9px] px-0.5 border-muted"><SelectValue /></SelectTrigger>
                  <SelectContent>{HOURS_24.map((h) => <SelectItem key={h} value={String(h)} className="text-xs">{formatHourShort(h)}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={String(visit.duration)} onValueChange={(val) => handleTimeChange(visit.id, "duration", Number(val))}>
                  <SelectTrigger className="h-4 w-[38px] text-[9px] px-0.5 border-muted"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,6,8,10,12].map((d) => <SelectItem key={d} value={String(d)} className="text-xs">{d}h</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="h-4 px-1 text-[9px]" onClick={() => setEditingVisit(null)}>✓</Button>
              </div>
            ) : (
              <button className="text-[9px] text-muted-foreground hover:text-foreground hover:underline flex items-center gap-0.5 mt-0.5" onClick={() => setEditingVisit(visit.id)}>
                <Clock className="h-2 w-2" />
                {formatHourShort(visit.startHour)}–{formatHourShort(visit.startHour + visit.duration)}
              </button>
            )}
          </div>
        </div>
        <Badge className={`${statusColors[visit.status]} border text-[8px] px-1 py-0 w-fit`}>
          {visit.status}
        </Badge>
      </div>
    );
  };

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
              <Badge className="bg-destructive/15 text-destructive border-destructive/30 border text-[8px] px-1 py-0 shrink-0">DNACPR</Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-2.5 w-2.5" />
            {formatHourShort(visit.startHour)}–{formatHourShort(visit.startHour + visit.duration)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <Badge className={`${statusColors[visit.status]} border text-[9px] px-1.5 py-0 shrink-0`}>{visit.status}</Badge>
          <Badge className={`${careTypeConfig[visit.careType].color} border text-[8px] px-1 py-0`}>{careTypeConfig[visit.careType].label}</Badge>
        </div>
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
            <p className="text-sm text-muted-foreground mt-1">24-hour timeline · Drag visits to assign caregivers</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setDayOffset((d) => d - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium text-foreground min-w-[200px] text-center">{getDateLabel(dayOffset)}</span>
            {dayOffset !== 0 && <Button variant="ghost" size="sm" onClick={() => setDayOffset(0)}>Today</Button>}
            <Button variant="outline" size="icon" onClick={() => setDayOffset((d) => d + 1)}><ChevronRight className="h-4 w-4" /></Button>
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
              className={`flex gap-2 p-3 min-h-[72px] transition-colors ${dragOverTarget?.receiver === "__unassigned" ? "bg-accent/50" : ""}`}
              onDragOver={(e) => { handleDragOver(e); setDragOverTarget({ receiver: "__unassigned", hour: 0 }); }}
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

        {/* Care Type Legend */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(careTypeConfig) as [CareType, typeof careTypeConfig["24h"]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <Badge key={key} className={`${cfg.color} border text-[10px] px-2 py-0.5 gap-1`}>
                <Icon className="h-3 w-3" /> {cfg.label} <span className="text-muted-foreground ml-1">({cfg.window})</span>
              </Badge>
            );
          })}
        </div>

        {/* Horizontal 24h Timeline Grid: Y = Care Receivers, X = Hours */}
        <Card className="border border-border shadow-sm overflow-hidden">
          <ScrollArea className="w-full">
            <div style={{ minWidth: 24 * COL_WIDTH + 200 }}>
              {/* Header row: time labels */}
              <div className="flex sticky top-0 z-10 bg-background border-b border-border">
                <div className="w-[200px] shrink-0 border-r border-border p-2 flex items-center">
                  <span className="text-[10px] text-muted-foreground font-medium">CARE RECEIVER</span>
                </div>
                {HOURS_24.map((h) => (
                  <div
                    key={h}
                    className={`border-r border-border flex items-center justify-center ${h >= 6 && h < 18 ? "bg-background" : "bg-muted/30"}`}
                    style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
                  >
                    <span className="text-[10px] text-muted-foreground font-medium">{formatHourShort(h)}</span>
                  </div>
                ))}
              </div>

              {/* Rows: one per care receiver */}
              {careReceiverGroups.map((group, gi) => {
                const cfg = careTypeConfig[group.careType];
                const Icon = cfg.icon;
                return (
                  <div key={group.name} className="flex border-b border-border">
                    {/* Patient info cell */}
                    <div className="w-[200px] shrink-0 border-r border-border p-2 flex items-center gap-2">
                      <div className="relative shrink-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${avatarColors[gi % avatarColors.length]}`}>
                          {group.avatar}
                        </div>
                        {group.dnacpr && (
                          <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5" title="DNACPR">
                            <AlertTriangle className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold text-foreground truncate">{group.name}</p>
                          {group.dnacpr && (
                            <Badge className="bg-destructive/15 text-destructive border-destructive/30 border text-[7px] px-1 py-0 shrink-0">DNACPR</Badge>
                          )}
                        </div>
                        <Badge className={`${cfg.color} border text-[8px] px-1 py-0 mt-0.5 gap-0.5`}>
                          <Icon className="h-2.5 w-2.5" /> {cfg.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Time cells + visit overlay */}
                    <div className="flex-1 relative" style={{ height: ROW_HEIGHT }}>
                      {/* Background hour cells */}
                      <div className="flex h-full">
                        {HOURS_24.map((h) => (
                          <div
                            key={h}
                            className={`border-r border-border transition-colors ${
                              dragOverTarget?.receiver === group.name && dragOverTarget?.hour === h ? "bg-primary/10" : h >= 6 && h < 18 ? "bg-background" : "bg-muted/20"
                            }`}
                            style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
                            onDragOver={(e) => { handleDragOver(e); setDragOverTarget({ receiver: group.name, hour: h }); }}
                            onDragLeave={() => setDragOverTarget(null)}
                            onDrop={(e) => {
                              const visitId = Number(e.dataTransfer.getData("text/plain"));
                              const visit = visits.find((v) => v.id === visitId);
                              if (!visit) return;
                              // If dropping onto a receiver row, keep existing caregiver or set null
                              handleDrop(e, visit.careGiverId, h);
                            }}
                          />
                        ))}
                      </div>

                      {/* Visit cards overlaid */}
                      {group.visits.map((v) => (
                        <HorizontalVisitCard key={v.id} visit={v} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>

        {/* Caregivers available today */}
        <Card className="border border-border shadow-sm">
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Available Caregivers</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Drop a visit card onto a caregiver to assign</p>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-3 p-3">
              {careGivers.map((cg, i) => {
                const cgVisits = visits.filter((v) => v.careGiverId === cg.id);
                const totalHours = cgVisits.reduce((sum, v) => sum + v.duration, 0);
                return (
                  <div
                    key={cg.id}
                    className="shrink-0 flex flex-col items-center gap-1.5 w-[90px] group"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, cg.id)}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${avatarColors[i % avatarColors.length]} ring-2 ring-primary/30 transition-all group-hover:scale-105`}>
                      {cg.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <p className="text-[10px] text-foreground font-medium text-center leading-tight truncate w-full">{cg.name}</p>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{cgVisits.length} visits · {totalHours}h</Badge>
                  </div>
                );
              })}
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
