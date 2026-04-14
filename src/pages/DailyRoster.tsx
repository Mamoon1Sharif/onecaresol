import { useState, useRef, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, ChevronRight, User, Clock, GripVertical,
} from "lucide-react";

// ── Types ──

interface Visit {
  id: number;
  careReceiver: string;
  status: "Pending" | "Confirmed";
  startHour: number; // 6-21
  duration: number;  // in hours (1 or 2)
  careGiverId: string | null; // null = unassigned
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
  { id: 1, careReceiver: "Margaret Thompson", status: "Confirmed", startHour: 7, duration: 2, careGiverId: "cg1" },
  { id: 2, careReceiver: "John Davies", status: "Pending", startHour: 9, duration: 1, careGiverId: "cg1" },
  { id: 3, careReceiver: "Dorothy Williams", status: "Confirmed", startHour: 8, duration: 2, careGiverId: "cg2" },
  { id: 4, careReceiver: "Robert Evans", status: "Pending", startHour: 14, duration: 1, careGiverId: "cg3" },
  { id: 5, careReceiver: "Mary Clarke", status: "Confirmed", startHour: 10, duration: 2, careGiverId: null },
  { id: 6, careReceiver: "William Harris", status: "Pending", startHour: 16, duration: 1, careGiverId: null },
  { id: 7, careReceiver: "Elizabeth Taylor", status: "Pending", startHour: 12, duration: 2, careGiverId: null },
  { id: 8, careReceiver: "George Martin", status: "Confirmed", startHour: 18, duration: 1, careGiverId: "cg4" },
  { id: 9, careReceiver: "Patricia Jones", status: "Pending", startHour: 7, duration: 1, careGiverId: "cg5" },
  { id: 10, careReceiver: "Thomas White", status: "Confirmed", startHour: 15, duration: 2, careGiverId: "cg2" },
];

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6-22
const ROW_HEIGHT = 56; // px per hour slot
const HEADER_HEIGHT = 48;

const statusColors: Record<string, string> = {
  Pending: "bg-warning/15 text-warning border-warning/30",
  Confirmed: "bg-success/15 text-success border-success/30",
};

const statusCardBg: Record<string, string> = {
  Pending: "border-l-warning bg-warning/5 hover:bg-warning/10",
  Confirmed: "border-l-success bg-success/5 hover:bg-success/10",
};

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
  const gridRef = useRef<HTMLDivElement>(null);

  const unassigned = visits.filter((v) => v.careGiverId === null);

  const handleDragStart = useCallback((e: React.DragEvent, visitId: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(visitId));
    setDragging(visitId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setDragOverTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, careGiverId: string | null, hour?: number) => {
    e.preventDefault();
    const visitId = Number(e.dataTransfer.getData("text/plain"));
    if (!visitId) return;

    setVisits((prev) => prev.map((v) => {
      if (v.id !== visitId) return v;
      const updated = { ...v, careGiverId };
      if (hour !== undefined) updated.startHour = hour;
      return updated;
    }));

    const cg = careGivers.find((c) => c.id === careGiverId);
    toast({
      title: careGiverId ? `Assigned to ${cg?.name}` : "Moved to Unassigned",
    });
    setDragging(null);
    setDragOverTarget(null);
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // Visit card component
  const VisitCard = ({ visit, compact = false }: { visit: Visit; compact?: boolean }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, visit.id)}
      onDragEnd={handleDragEnd}
      className={`
        rounded-md border border-l-4 p-2 cursor-grab active:cursor-grabbing select-none
        transition-all duration-150 shadow-sm hover:shadow-md
        ${statusCardBg[visit.status]}
        ${dragging === visit.id ? "opacity-40 scale-95" : "opacity-100"}
        ${compact ? "" : ""}
      `}
    >
      <div className="flex items-center gap-1.5">
        <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{visit.careReceiver}</p>
          {!compact && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5" />
              {formatHour(visit.startHour)} – {formatHour(visit.startHour + visit.duration)}
            </p>
          )}
        </div>
        <Badge className={`${statusColors[visit.status]} border text-[9px] px-1.5 py-0 shrink-0`}>
          {visit.status}
        </Badge>
      </div>
    </div>
  );

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

        {/* Main layout */}
        <div className="flex gap-4 items-start">
          {/* Left panel: Unassigned */}
          <div className="w-[220px] shrink-0">
            <Card className="border border-border shadow-sm sticky top-4">
              <div className="p-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Unassigned
                  <Badge variant="secondary" className="ml-auto text-xs">{unassigned.length}</Badge>
                </h2>
              </div>
              <div
                className={`p-2 space-y-2 min-h-[200px] transition-colors ${
                  dragOverTarget?.cgId === null ? "bg-accent/50" : ""
                }`}
                onDragOver={(e) => { handleDragOver(e); setDragOverTarget({ cgId: null, hour: 0 }); }}
                onDragLeave={() => setDragOverTarget(null)}
                onDrop={(e) => handleDrop(e, null)}
              >
                {unassigned.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 text-center py-8">
                    All visits assigned
                  </p>
                )}
                {unassigned.map((v) => (
                  <VisitCard key={v.id} visit={v} compact />
                ))}
              </div>
            </Card>
          </div>

          {/* Calendar grid */}
          <div className="flex-1 overflow-x-auto">
            <Card className="border border-border shadow-sm overflow-hidden">
              <div ref={gridRef} className="relative" style={{ minWidth: careGivers.length * 160 + 70 }}>
                {/* Header row */}
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

                {/* Time grid */}
                <div className="flex">
                  {/* Time labels */}
                  <div className="w-[70px] shrink-0 border-r border-border">
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        className="border-b border-border flex items-start justify-end pr-2 pt-1"
                        style={{ height: ROW_HEIGHT }}
                      >
                        <span className="text-[10px] text-muted-foreground font-medium">{formatHour(h)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Caregiver columns */}
                  {careGivers.map((cg) => (
                    <div key={cg.id} className="flex-1 min-w-[160px] border-r last:border-r-0 border-border relative">
                      {/* Hour slots (drop targets) */}
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          className={`border-b border-border transition-colors ${
                            dragOverTarget?.cgId === cg.id && dragOverTarget?.hour === h
                              ? "bg-primary/10"
                              : h % 2 === 0 ? "bg-background" : "bg-muted/20"
                          }`}
                          style={{ height: ROW_HEIGHT }}
                          onDragOver={(e) => {
                            handleDragOver(e);
                            setDragOverTarget({ cgId: cg.id, hour: h });
                          }}
                          onDragLeave={() => setDragOverTarget(null)}
                          onDrop={(e) => handleDrop(e, cg.id, h)}
                        />
                      ))}

                      {/* Visit cards overlaid */}
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
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, v.id)}
                              onDragEnd={handleDragEnd}
                              className={`
                                h-full rounded-md border border-l-4 p-1.5 cursor-grab active:cursor-grabbing
                                select-none transition-all duration-150 shadow-sm hover:shadow-md flex flex-col
                                ${statusCardBg[v.status]}
                                ${dragging === v.id ? "opacity-40 scale-95" : "opacity-100"}
                              `}
                            >
                              <div className="flex items-start gap-1">
                                <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-foreground truncate">{v.careReceiver}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {formatHour(v.startHour)} – {formatHour(v.startHour + v.duration)}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-auto">
                                <Badge className={`${statusColors[v.status]} border text-[9px] px-1.5 py-0`}>
                                  {v.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DailyRoster;
