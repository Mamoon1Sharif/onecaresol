import { useState, useCallback, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Clock, GripVertical, AlertTriangle, User, Sun, Moon, Sunrise,
} from "lucide-react";
import { useDailyVisits, useUpdateDailyVisit, useCareGivers } from "@/hooks/use-care-data";
import { supabase } from "@/integrations/supabase/client";

type CareType = "24h" | "12h-live-in" | "8h-morning" | "8h-night";

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
  "bg-primary/20 text-primary", "bg-accent text-accent-foreground",
  "bg-success/20 text-success", "bg-warning/20 text-warning", "bg-destructive/20 text-destructive",
];

const careTypeConfig: Record<CareType, { label: string; icon: typeof Sun; color: string; window: string }> = {
  "24h": { label: "24h Care", icon: Clock, color: "bg-primary/15 text-primary border-primary/30", window: "00:00–00:00" },
  "12h-live-in": { label: "12h Live-In", icon: Sun, color: "bg-accent text-accent-foreground border-accent", window: "08:00–20:00" },
  "8h-morning": { label: "8h Morning", icon: Sunrise, color: "bg-success/15 text-success border-success/30", window: "06:00–14:00" },
  "8h-night": { label: "8h Night", icon: Moon, color: "bg-muted text-muted-foreground border-border", window: "22:00–06:00" },
};

function formatHourShort(h: number) {
  const hr = ((h % 24) + 24) % 24;
  return `${hr.toString().padStart(2, "0")}:00`;
}

function getDateStr(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function getDateLabel(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const DailyRoster = () => {
  const { toast } = useToast();
  const [dayOffset, setDayOffset] = useState(0);
  const dateStr = getDateStr(dayOffset);
  const { data: rawVisits = [], refetch } = useDailyVisits(dateStr);
  const { data: careGiversList = [] } = useCareGivers();
  const updateVisit = useUpdateDailyVisit();

  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ receiver: string; hour: number } | null>(null);
  const [editingVisit, setEditingVisit] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; visitId: string; targetCgId: string | null; targetHour?: number;
  }>({ open: false, visitId: "", targetCgId: null });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("daily-visits-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_visits" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  // Transform DB data
  const visits = rawVisits.map((v) => ({
    id: v.id,
    careReceiver: (v.care_receivers as any)?.name ?? "Unknown",
    careReceiverAvatar: ((v.care_receivers as any)?.name ?? "??").split(" ").map((n: string) => n[0]).join(""),
    dnacpr: (v.care_receivers as any)?.dnacpr ?? false,
    careType: ((v.care_receivers as any)?.care_type ?? "8h-morning") as CareType,
    status: v.status as "Pending" | "Confirmed",
    startHour: v.start_hour,
    duration: v.duration,
    careGiverId: v.care_giver_id,
  }));

  const unassigned = visits.filter((v) => v.careGiverId === null);

  // Group by care receiver
  const groupByCareReceiver = () => {
    const map = new Map<string, { name: string; avatar: string; dnacpr: boolean; careType: CareType; visits: typeof visits }>();
    for (const v of visits) {
      if (!map.has(v.careReceiver)) {
        map.set(v.careReceiver, { name: v.careReceiver, avatar: v.careReceiverAvatar, dnacpr: v.dnacpr, careType: v.careType, visits: [] });
      }
      map.get(v.careReceiver)!.visits.push(v);
    }
    return Array.from(map.values());
  };
  const careReceiverGroups = groupByCareReceiver();

  const handleDragStart = useCallback((e: React.DragEvent, visitId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", visitId);
    setDragging(visitId);
  }, []);

  const handleDragEnd = useCallback(() => { setDragging(null); setDragOverTarget(null); }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }, []);

  const requestMove = useCallback((visitId: string, targetCgId: string | null, targetHour?: number) => {
    setConfirmDialog({ open: true, visitId, targetCgId, targetHour });
  }, []);

  const confirmMove = useCallback(async () => {
    const { visitId, targetCgId, targetHour } = confirmDialog;
    const visit = visits.find((v) => v.id === visitId);
    const wasAssigned = visit?.careGiverId !== null;
    const willBeAssigned = targetCgId !== null;
    let newStatus = visit?.status ?? "Pending";
    if (!wasAssigned && willBeAssigned) newStatus = "Confirmed";
    if (wasAssigned && !willBeAssigned) newStatus = "Pending";

    const updates: any = { id: visitId, care_giver_id: targetCgId, status: newStatus };
    if (targetHour !== undefined) updates.start_hour = targetHour;

    await updateVisit.mutateAsync(updates);

    const cg = careGiversList.find((c) => c.id === targetCgId);
    toast({
      title: targetCgId ? `✅ ${visit?.careReceiver} assigned to ${cg?.name}` : `↩️ ${visit?.careReceiver} moved to Unassigned`,
      description: targetCgId ? "Status → Confirmed" : "Status → Pending",
    });
    setConfirmDialog({ open: false, visitId: "", targetCgId: null });
  }, [confirmDialog, visits, careGiversList, toast, updateVisit]);

  const handleDrop = useCallback((e: React.DragEvent, careGiverId: string | null, hour?: number) => {
    e.preventDefault();
    const visitId = e.dataTransfer.getData("text/plain");
    if (!visitId) return;
    setDragging(null);
    setDragOverTarget(null);
    requestMove(visitId, careGiverId, hour);
  }, [requestMove]);

  const handleTimeChange = async (visitId: string, field: "start_hour" | "duration", value: number) => {
    await updateVisit.mutateAsync({ id: visitId, [field]: value });
  };

  const HorizontalVisitCard = ({ visit }: { visit: typeof visits[0] }) => {
    const cg = careGiversList.find((c) => c.id === visit.careGiverId);
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, visit.id)}
        onDragEnd={handleDragEnd}
        className={`absolute top-1 bottom-1 rounded-md border border-t-4 cursor-grab active:cursor-grabbing select-none transition-all duration-150 shadow-sm hover:shadow-md flex flex-col justify-between p-1.5 z-[5] ${statusCardBg[visit.status]} ${dragging === visit.id ? "opacity-40 scale-95" : "opacity-100"}`}
        style={{ left: visit.startHour * COL_WIDTH + 2, width: Math.min(visit.duration, 24 - visit.startHour) * COL_WIDTH - 4 }}
      >
        <div className="flex items-center gap-1 min-w-0">
          <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              {cg ? <p className="text-[10px] font-semibold text-foreground truncate">{cg.name}</p> : <p className="text-[10px] font-semibold text-warning truncate">Unassigned</p>}
            </div>
            {editingVisit === visit.id ? (
              <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                <Select value={String(visit.startHour)} onValueChange={(val) => handleTimeChange(visit.id, "start_hour", Number(val))}>
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
                <Clock className="h-2 w-2" />{formatHourShort(visit.startHour)}–{formatHourShort(visit.startHour + visit.duration)}
              </button>
            )}
          </div>
        </div>
        <Badge className={`${statusColors[visit.status]} border text-[8px] px-1 py-0 w-fit`}>{visit.status}</Badge>
      </div>
    );
  };

  const UnassignedCard = ({ visit }: { visit: typeof visits[0] }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, visit.id)}
      onDragEnd={handleDragEnd}
      className={`shrink-0 w-[180px] rounded-md border border-l-4 p-2 cursor-grab active:cursor-grabbing select-none transition-all duration-150 shadow-sm hover:shadow-md ${statusCardBg[visit.status]} ${dragging === visit.id ? "opacity-40 scale-95" : "opacity-100"}`}
    >
      <div className="flex items-center gap-1.5">
        <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-xs font-semibold text-foreground truncate">{visit.careReceiver}</p>
            {visit.dnacpr && <Badge className="bg-destructive/15 text-destructive border-destructive/30 border text-[8px] px-1 py-0 shrink-0">DNACPR</Badge>}
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-2.5 w-2.5" />{formatHourShort(visit.startHour)}–{formatHourShort(visit.startHour + visit.duration)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <Badge className={`${statusColors[visit.status]} border text-[9px] px-1.5 py-0 shrink-0`}>{visit.status}</Badge>
          <Badge className={`${careTypeConfig[visit.careType]?.color ?? ""} border text-[8px] px-1 py-0`}>{careTypeConfig[visit.careType]?.label ?? visit.careType}</Badge>
        </div>
      </div>
    </div>
  );

  const confirmVisit = visits.find((v) => v.id === confirmDialog.visitId);
  const confirmCg = careGiversList.find((c) => c.id === confirmDialog.targetCgId);

  return (
    <AppLayout>
      <div className="space-y-4">
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
              ) : unassigned.map((v) => <UnassignedCard key={v.id} visit={v} />)}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>

        <div className="flex flex-wrap gap-2">
          {(Object.entries(careTypeConfig) as [CareType, typeof careTypeConfig["24h"]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return <Badge key={key} className={`${cfg.color} border text-[10px] px-2 py-0.5 gap-1`}><Icon className="h-3 w-3" /> {cfg.label} <span className="text-muted-foreground ml-1">({cfg.window})</span></Badge>;
          })}
        </div>

        <Card className="border border-border shadow-sm overflow-hidden">
          <ScrollArea className="w-full">
            <div style={{ minWidth: 24 * COL_WIDTH + 200 }}>
              <div className="flex sticky top-0 z-10 bg-background border-b border-border">
                <div className="w-[200px] shrink-0 border-r border-border p-2 flex items-center">
                  <span className="text-[10px] text-muted-foreground font-medium">SERVICE MEMBER</span>
                </div>
                {HOURS_24.map((h) => (
                  <div key={h} className={`border-r border-border flex items-center justify-center ${h >= 6 && h < 18 ? "bg-background" : "bg-muted/30"}`} style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}>
                    <span className="text-[10px] text-muted-foreground font-medium">{formatHourShort(h)}</span>
                  </div>
                ))}
              </div>

              {careReceiverGroups.map((group, gi) => {
                const cfg = careTypeConfig[group.careType] ?? careTypeConfig["8h-morning"];
                const Icon = cfg.icon;
                return (
                  <div key={group.name} className="flex border-b border-border">
                    <div className="w-[200px] shrink-0 border-r border-border p-2 flex items-center gap-2">
                      <div className="relative shrink-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${avatarColors[gi % avatarColors.length]}`}>{group.avatar}</div>
                        {group.dnacpr && <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5" title="DNACPR"><AlertTriangle className="h-2.5 w-2.5" /></div>}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold text-foreground truncate">{group.name}</p>
                          {group.dnacpr && <Badge className="bg-destructive/15 text-destructive border-destructive/30 border text-[7px] px-1 py-0 shrink-0">DNACPR</Badge>}
                        </div>
                        <Badge className={`${cfg.color} border text-[8px] px-1 py-0 mt-0.5 gap-0.5`}><Icon className="h-2.5 w-2.5" /> {cfg.label}</Badge>
                      </div>
                    </div>

                    <div className="flex-1 relative" style={{ height: ROW_HEIGHT }}>
                      <div className="flex h-full">
                        {HOURS_24.map((h) => (
                          <div
                            key={h}
                            className={`border-r border-border transition-colors ${dragOverTarget?.receiver === group.name && dragOverTarget?.hour === h ? "bg-primary/10" : h >= 6 && h < 18 ? "bg-background" : "bg-muted/20"}`}
                            style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
                            onDragOver={(e) => { handleDragOver(e); setDragOverTarget({ receiver: group.name, hour: h }); }}
                            onDragLeave={() => setDragOverTarget(null)}
                            onDrop={(e) => {
                              const visitId = e.dataTransfer.getData("text/plain");
                              const visit = visits.find((v) => v.id === visitId);
                              if (!visit) return;
                              handleDrop(e, visit.careGiverId, h);
                            }}
                          />
                        ))}
                      </div>
                      {group.visits.map((v) => <HorizontalVisitCard key={v.id} visit={v} />)}
                    </div>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>

        <Card className="border border-border shadow-sm">
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Available Caregivers</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Drop a visit card onto a caregiver to assign</p>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-3 p-3">
              {careGiversList.filter((cg) => cg.status === "Active").map((cg, i) => {
                const cgVisits = visits.filter((v) => v.careGiverId === cg.id);
                const totalHours = cgVisits.reduce((sum, v) => sum + v.duration, 0);
                return (
                  <div key={cg.id} className="shrink-0 flex flex-col items-center gap-1.5 w-[90px] group" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, cg.id)}>
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
