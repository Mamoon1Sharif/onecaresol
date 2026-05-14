import { useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCareGivers, useCareReceivers, useDailyVisitsRange } from "@/hooks/use-care-data";
import { getVisitStatus } from "@/lib/visit-status-utils";
import { supabase } from "@/integrations/supabase/client";
import { EditRotaDialog, type EditRotaShift } from "@/components/EditRotaDialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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

/* -------------------------------------------------------------------------- */
/*  Data                                                                       */
/* -------------------------------------------------------------------------- */

type ShiftStatus = "scheduled" | "complete" | "in-progress" | "missed" | "oncall";

interface Shift {
  id: string;
  staff: string; // staff row label (matches STAFF rows). "" = unassigned
  start: number; // hours since 00:00 (e.g. 7.5 = 07:30)
  end: number;
  client: string;
  ref: string;
  service: string;
  status: ShiftStatus;
  dayIndex: number;
  dbVisit?: any; // original DB row for mutations
}

const ROW_HEIGHT = 56; // px (daily)
const WEEKLY_ROW_HEIGHT = 140; // px — taller so day cells can stack shifts
const PX_PER_HOUR = 64; // 24h * 64 = 1536px (daily timeline)
const WEEK_DAY_WIDTH = 180; // px per day column (weekly)
const HEADER_H = 28;

function startOfWeekMonday(d: Date) {
  const out = new Date(d);
  const day = (out.getDay() + 6) % 7;
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - day);
  return out;
}

function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function formatDateShort(d: Date) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

function formatDateISO(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Convert a raw daily_visit DB row into our Shift shape */
function dbVisitToShift(v: any, dayIndex: number): Shift {
  const startH = v.start_hour ?? 0;
  const startM = v.start_minute ?? 0;
  const durH = v.duration ?? 1;
  const durM = v.duration_minutes ?? (durH * 60);
  const start = startH + startM / 60;
  const end = start + durM / 60;

  const cgName = v.care_givers?.name ?? null;
  const crName = v.care_receivers?.name ?? "Unknown";

  // Map visit status to our ShiftStatus using getVisitStatus
  const vs = getVisitStatus(v);
  let status: ShiftStatus;
  if (vs === "Completed") status = "complete";
  else if (vs === "In Progress") status = "in-progress";
  else if (vs === "Missed") status = "missed";
  else if (vs === "Late") status = "in-progress";
  else status = "scheduled"; // Due, Pending, etc.

  const staff = cgName || "Unassigned Shifts";
  const service = v.shift_type || v.care_receivers?.care_type || "Visit";

  return {
    id: v.id,
    staff,
    start,
    end,
    client: crName,
    ref: v.id.slice(0, 10),
    service,
    status,
    dayIndex,
    dbVisit: v,
  };
}


/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function fmtTime(h: number) {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function statusStyles(s: ShiftStatus) {
  switch (s) {
    case "complete":
      return "bg-green-200/90 border-green-400 text-green-900";
    case "in-progress":
      return "bg-cyan-200/90 border-cyan-400 text-cyan-900";
    case "scheduled":
      return "bg-blue-200/90 border-blue-400 text-blue-900";
    case "missed":
      return "bg-rose-200/90 border-rose-400 text-rose-900";
    case "oncall":
      return "bg-purple-300/90 border-purple-500 text-purple-950";
  }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

const HOURS = Array.from({ length: 48 }, (_, i) => i / 2); // every 30 min, 00:00 → 23:30

function statusLabel(s: ShiftStatus): string {
  switch (s) {
    case "complete": return "Complete";
    case "in-progress": return "In Progress";
    case "scheduled": return "Scheduled";
    case "missed": return "Missed";
    case "oncall": return "On Call";
  }
}

export default function AdvancedRota() {
  const navigate = useNavigate();
  const { data: careGivers = [] } = useCareGivers();
  const { data: careReceivers = [] } = useCareReceivers();

  const UNASSIGNED = "Unassigned Shifts";
  const staffRows = useMemo(
    () => careGivers.map((cg: any) => cg.name || "Unnamed Caregiver"),
    [careGivers]
  );

  const [date, setDate] = useState(() => startOfWeekMonday(new Date()));
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('weekly');
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());
  // Overrides per day per shift id (stores edited start/end/staff after drag)
  const [overrides, setOverrides] = useState<Record<string, Partial<Shift>>>({});
  const [bulkSelect, setBulkSelect] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterTeam, setFilterTeam] = useState("today");
  const [filterCancelled, setFilterCancelled] = useState("hide");
  const [filterUncovered, setFilterUncovered] = useState("include");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drag, setDrag] = useState<{
    id: string;
    offsetHours: number;
    rowOffsetY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const [hoverGhost, setHoverGhost] = useState<{
    id: string;
    staff: string;
    start: number;
    end: number;
    dayIndex: number;
  } | null>(null);
  const [editing, setEditing] = useState<EditRotaShift | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    id: string;
    fromStaff: string;
    toStaff: string;
    fromStart: number;
    fromEnd: number;
    toStart: number;
    toEnd: number;
    fromDayIndex: number;
    toDayIndex: number;
    client: string;
    ref: string;
    service: string;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const unassignedPanelRef = useRef<HTMLDivElement>(null);

  const dateLabel = useMemo(() => {
    if (viewMode === 'daily') return formatDateShort(date);
    const weekEnd = addDays(date, 6);
    return `${formatDateShort(date)} - ${formatDateShort(weekEnd)}`;
  }, [date, viewMode]);

  const days = useMemo(() => {
    if (viewMode === 'daily') return [date];
    return Array.from({ length: 7 }, (_, i) => addDays(date, i));
  }, [date, viewMode]);

  const totalGridWidth =
    viewMode === 'daily' ? 24 * PX_PER_HOUR : days.length * WEEK_DAY_WIDTH;
  const headerHeight = HEADER_H;
  const rowHeight = viewMode === 'daily' ? ROW_HEIGHT : WEEKLY_ROW_HEIGHT;

  const dayStep = viewMode === 'daily' ? 1 : 7;

  // Fetch real visits from database for the visible date range
  const fromDateStr = formatDateISO(days[0]);
  const toDateStr = formatDateISO(days[days.length - 1]);
  const { data: rawVisits = [], refetch: refetchVisits } = useDailyVisitsRange(fromDateStr, toDateStr);

  // Real-time subscription to daily_visits changes
  useEffect(() => {
    if (!autoRefresh) return;
    const ch = supabase
      .channel("advanced-rota-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_visits" }, () => refetchVisits())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetchVisits, autoRefresh]);

  // Build shifts from database visits, then apply any user overrides
  const shifts = useMemo<Shift[]>(() => {
    const allShifts: Shift[] = [];
    (rawVisits as any[]).forEach((v) => {
      // Determine dayIndex based on visit_date
      const vDate = v.visit_date; // "YYYY-MM-DD"
      const dayIdx = days.findIndex(d => formatDateISO(d) === vDate);
      if (dayIdx < 0) return; // outside our visible range
      const shift = dbVisitToShift(v, dayIdx);
      const ov = overrides[shift.id];
      allShifts.push(ov ? { ...shift, ...ov } : shift);
    });
    return allShifts;
  }, [rawVisits, days, overrides]);

  // Detect per-caregiver overlapping shifts (conflicts).
  const conflicts = useMemo(() => {
    const map = new Map<string, Shift[]>(); // shift.id -> conflicting shifts
    const buckets = new Map<string, Shift[]>();
    for (const s of shifts) {
      if (cancelledIds.has(s.id)) continue;
      if (!s.staff || s.staff === "Unassigned Shifts") continue;
      const key = `${s.staff}|${s.dayIndex}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(s);
    }
    for (const list of buckets.values()) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          if (a.start < b.end && b.start < a.end) {
            if (!map.has(a.id)) map.set(a.id, []);
            if (!map.has(b.id)) map.set(b.id, []);
            map.get(a.id)!.push(b);
            map.get(b.id)!.push(a);
          }
        }
      }
    }
    return map;
  }, [shifts, cancelledIds]);

  /* ---------------------------- Drag & Drop -------------------------------- */

  function shiftHasStarted(s: Shift) {
    return s.status === "in-progress" || s.status === "complete" || s.status === "missed";
  }

  function onPointerDownShift(e: React.PointerEvent, s: Shift) {
    if (bulkSelect) {
      const next = new Set(selected);
      next.has(s.id) ? next.delete(s.id) : next.add(s.id);
      setSelected(next);
      return;
    }
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const offsetHours = (e.clientX - rect.left) / PX_PER_HOUR;
    const rowOffsetY = e.clientY - rect.top;
    setDrag({
      id: s.id,
      offsetHours,
      rowOffsetY,
      originX: e.clientX,
      originY: e.clientY,
      moved: false,
    });
    setHoverGhost({ id: s.id, staff: s.staff, start: s.start, end: s.end, dayIndex: s.dayIndex });
    target.setPointerCapture(e.pointerId);
  }

  function updatePointerDrag(clientX: number, clientY: number) {
    if (!drag || !gridRef.current) return;

    // Detect actual drag (>4px movement) — anything less is treated as a click
    if (!drag.moved) {
      const dx = Math.abs(clientX - drag.originX);
      const dy = Math.abs(clientY - drag.originY);
      if (dx < 4 && dy < 4) return;

      const s = shifts.find((x) => x.id === drag.id);
      if (s && shiftHasStarted(s)) {
        const msg = s.status === "complete" ? "Shift is complete — can't reassign or reallocate." : "Shift time already started — can't reassign or reallocate.";
        toast.error(msg);
        setDrag(null);
        return;
      }

      setDrag({ ...drag, moved: true });
    }

    const shift = shifts.find((s) => s.id === drag.id);
    if (!shift) return;
    const length = shift.end - shift.start;

    // If pointer is over the unassigned panel, mark this as unassigning
    const unPanel = unassignedPanelRef.current?.getBoundingClientRect();
    if (
      unPanel &&
      clientX >= unPanel.left &&
      clientX <= unPanel.right &&
      clientY >= unPanel.top &&
      clientY <= unPanel.bottom
    ) {
      setHoverGhost({
        id: shift.id,
        staff: UNASSIGNED,
        start: shift.start,
        end: shift.end,
        dayIndex: shift.dayIndex,
      });
      return;
    }

    const grid = gridRef.current.getBoundingClientRect();
    const x = clientX - grid.left + gridRef.current.scrollLeft;
    const y = clientY - grid.top;

    const dayWidth = 24 * PX_PER_HOUR;
    const dayIdx = Math.floor(x / dayWidth);
    const hourX = x % dayWidth;
    let newStart = hourX / PX_PER_HOUR - drag.offsetHours;
    // snap to 15 min
    newStart = Math.max(0, Math.min(24 - length, Math.round(newStart * 4) / 4));

    const rowIdx = Math.max(
      0,
      Math.min(staffRows.length - 1, Math.floor((y - headerHeight) / ROW_HEIGHT))
    );
    const newStaff = staffRows[rowIdx];

    setHoverGhost({
      id: shift.id,
      staff: newStaff,
      start: newStart,
      end: newStart + length,
      dayIndex: dayIdx,
    });
  }

  function onPointerMoveGrid(e: React.PointerEvent) {
    updatePointerDrag(e.clientX, e.clientY);
  }

  function finishPointerDrag() {
    if (drag) {
      if (drag.moved && hoverGhost) {
        const s = shifts.find((x) => x.id === drag.id);
        if (s) {
          const changed =
            hoverGhost.staff !== s.staff ||
            hoverGhost.start !== s.start ||
            hoverGhost.end !== s.end ||
            hoverGhost.dayIndex !== s.dayIndex;
          if (changed) {
            setPendingMove({
              id: s.id,
              fromStaff: s.staff,
              toStaff: hoverGhost.staff,
              fromStart: s.start,
              fromEnd: s.end,
              toStart: hoverGhost.start,
              toEnd: hoverGhost.end,
              fromDayIndex: s.dayIndex,
              toDayIndex: hoverGhost.dayIndex,
              client: s.client,
              ref: s.ref,
              service: s.service,
            });
          }
        }
      } else {
        // Treat as a click — open the edit dialog
        const s = shifts.find((x) => x.id === drag.id);
        if (s) {
          setEditing({
            id: s.id,
            ref: s.ref,
            date: dateLabel,
            status: statusLabel(s.status),
            client: s.client,
            start: s.start,
            end: s.end,
            staff: s.staff,
            service: s.service,
            checkIn: s.dbVisit?.check_in_time,
            checkOut: s.dbVisit?.check_out_time,
            duration_minutes: s.dbVisit?.duration_minutes,
            clockHours: s.dbVisit?.check_in_time && s.dbVisit?.check_out_time ? (() => {
              const mins = Math.round((new Date(s.dbVisit.check_out_time).getTime() - new Date(s.dbVisit.check_in_time).getTime()) / 60000);
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            })() : "00:00",
          });
        }
      }
    }
    setDrag(null);
    setHoverGhost(null);
  }

  function onPointerUpGrid() {
    finishPointerDrag();
  }

  useEffect(() => {
    if (!drag) return;

    const handlePointerMove = (e: PointerEvent) => updatePointerDrag(e.clientX, e.clientY);
    const handlePointerUp = () => finishPointerDrag();

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [drag, hoverGhost, shifts]);

  function confirmPendingMove() {
    if (!pendingMove) return;
    setOverrides((prev) => ({
      ...prev,
      [pendingMove.id]: {
        staff: pendingMove.toStaff,
        start: pendingMove.toStart,
        end: pendingMove.toEnd,
        dayIndex: pendingMove.toDayIndex,
      },
    }));
    const wasUnassigned = pendingMove.fromStaff === "Unassigned Shifts";
    toast.success(
      wasUnassigned
        ? `Shift assigned to ${pendingMove.toStaff}`
        : `Shift moved to ${pendingMove.toStaff}`,
      {
        description: `${pendingMove.client} • ${fmtTime(pendingMove.toStart)}–${fmtTime(pendingMove.toEnd)} • Ref ${pendingMove.ref}`,
      }
    );
    setPendingMove(null);
  }

  function handleSaveEdit(updates: {
    service: string;
    startH: number;
    startM: number;
    endH: number;
    endM: number;
  }) {
    if (!editing) return;
    const newStart = updates.startH + updates.startM / 60;
    const newEnd = updates.endH + updates.endM / 60;
    setOverrides((prev) => ({
      ...prev,
      [editing.id]: {
        ...(prev[editing.id] || {}),
        start: newStart,
        end: newEnd,
        service: updates.service,
      },
    }));
  }

  function assignDroppedShift(
    shiftId: string,
    toStaff: string,
    toDayIndex: number,
    toStart?: number
  ) {
    const s = shifts.find((x) => x.id === shiftId);
    if (!s) return;
    if (shiftHasStarted(s)) {
      toast.error("Shift time already started — can't reassign or reallocate.");
      return;
    }
    const length = s.end - s.start;
    let start = toStart ?? s.start;
    // snap to 15 min and clamp into 0..24
    start = Math.max(0, Math.min(24 - length, Math.round(start * 4) / 4));
    const end = start + length;
    setPendingMove({
      id: s.id,
      fromStaff: s.staff,
      toStaff,
      fromStart: s.start,
      fromEnd: s.end,
      toStart: start,
      toEnd: end,
      fromDayIndex: s.dayIndex,
      toDayIndex,
      client: s.client,
      ref: s.ref,
      service: s.service,
    });
  }

  /* ----------------------------- Actions ---------------------------------- */

  function requireSelection(): string[] | null {
    if (selected.size === 0) {
      toast.error("No shifts selected. Enable Bulk Select and pick some.");
      return null;
    }
    return Array.from(selected);
  }

  function handleAddShift() {
    navigate("/rota/add");
  }

  function handleBulkReassign() {
    const ids = requireSelection();
    if (!ids) return;
    const name = window.prompt(
      `Reassign ${ids.length} shift(s) to which care giver?\n\n${staffRows.join(", ")}`
    );
    if (!name) return;
    const match = staffRows.find((s) => s.toLowerCase() === name.trim().toLowerCase());
    if (!match) {
      toast.error("Unknown care giver.");
      return;
    }
    if (!window.confirm(`Reassign ${ids.length} shift(s) to ${match}?`)) return;
    setOverrides((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = { ...(next[id] || {}), staff: match };
      });
      return next;
    });
    setSelected(new Set());
    toast.success(`Reassigned ${ids.length} shift(s) to ${match}.`);
  }

  function handleCancelSelected() {
    const ids = requireSelection();
    if (!ids) return;
    if (!window.confirm(`Cancel ${ids.length} shift(s)?`)) return;
    setCancelledIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setSelected(new Set());
    toast.success(`Cancelled ${ids.length} shift(s).`);
  }

  function handleActivateSelected() {
    const ids = requireSelection();
    if (!ids) return;
    if (!window.confirm(`Activate ${ids.length} shift(s)?`)) return;
    setCancelledIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setSelected(new Set());
    toast.success(`Activated ${ids.length} shift(s).`);
  }

  function handleExportCsv() {
    const rows = shifts.filter((s) => !cancelledIds.has(s.id));
    const header = ["Date", "Staff", "Client", "Reference", "Service", "Start", "End", "Status"];
    const lines = [header.join(",")];
    rows.forEach((s) => {
      lines.push(
        [dateLabel, s.staff, s.client, s.ref, s.service, fmtTime(s.start), fmtTime(s.end), statusLabel(s.status)]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rota-${dateLabel.replace(/\//g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  }

  function handlePrintRota() {
    window.print();
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Advanced Rota</h1>
        </div>

        {/* Toolbar */}
        <div className="rounded-md border border-border bg-card p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Care Givers Today...</SelectItem>
                <SelectItem value="all">All Care Givers</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCancelled} onValueChange={setFilterCancelled}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hide">Hide Cancelled</SelectItem>
                <SelectItem value="show">Show Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterUncovered} onValueChange={setFilterUncovered}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="include">Include Uncovered</SelectItem>
                <SelectItem value="exclude">Exclude Uncovered</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center justify-end gap-3">
              <div className="flex items-center gap-2">
                <span className={cn("text-[11px] font-semibold uppercase rounded px-1.5 py-0.5",
                  bulkSelect ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground")}>
                  {bulkSelect ? "On" : "Off"}
                </span>
                <Switch checked={bulkSelect} onCheckedChange={setBulkSelect} />
                <span className="text-xs font-medium">Bulk Select</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-[11px] font-semibold uppercase rounded px-1.5 py-0.5",
                  autoRefresh ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground")}>
                  {autoRefresh ? "On" : "Off"}
                </span>
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                <span className="text-xs font-medium">Auto Refresh</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline" size="icon"
              className="h-8 w-8"
              onClick={() => setDate((d) => addDays(d, -dayStep))}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 flex items-center justify-center">
              <span className="text-sm font-semibold text-foreground border border-border rounded px-4 py-1 bg-muted/40">
                {dateLabel}
              </span>
            </div>

            <Button
              variant="outline" size="icon"
              className="h-8 w-8"
              onClick={() => setDate((d) => addDays(d, dayStep))}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-8 ml-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                  Actions...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuItem onSelect={handleAddShift}>Add Shift</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleBulkReassign}>Bulk Reassign</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleCancelSelected}>Cancel Selected</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleActivateSelected}>Activate Selected</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleExportCsv}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onSelect={handlePrintRota}>Print Rota</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'daily' ? 'default' : 'outline'}
              onClick={() => {
                setViewMode('daily');
                const today = new Date();
                today.setHours(0,0,0,0);
                setDate(today);
              }}
              size="sm"
            >
              Daily
            </Button>
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'outline'}
              onClick={() => {
                setViewMode('weekly');
                setDate(startOfWeekMonday(new Date()));
              }}
              size="sm"
            >
              Weekly
            </Button>
          </div>
        </div>

        {/* Unassigned shifts panel (separate box above the timeline) */}
        {(() => {
          const unassignedShifts = shifts.filter(
            (s) => s.staff === UNASSIGNED && (filterCancelled === "show" || !cancelledIds.has(s.id))
          );
          return (
            <div
              ref={unassignedPanelRef}
              className="border-2 border-yellow-500/70 rounded-md bg-yellow-50/40 dark:bg-yellow-950/10 overflow-hidden mb-3"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (!id) return;
                const s = shifts.find((x) => x.id === id);
                if (!s || s.staff === UNASSIGNED) return;
                assignDroppedShift(id, UNASSIGNED, s.dayIndex, s.start);
              }}
            >
              <div className="px-3 py-1.5 border-b border-yellow-500/50 bg-yellow-100/70 dark:bg-yellow-900/20 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-400 border border-yellow-600" />
                <span className="text-xs font-semibold uppercase tracking-wide text-yellow-900 dark:text-yellow-200">
                  Unassigned Shifts
                </span>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {unassignedShifts.length} pending · drag onto a caregiver to assign
                </span>
              </div>
              <div className="p-2 overflow-x-auto">
                {unassignedShifts.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground/70 px-1 py-2">
                    No unassigned shifts.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {unassignedShifts.map((s) => (
                      <div
                        key={s.id}
                        draggable={!shiftHasStarted(s)}
                        onDragStart={(e) => {
                          if (shiftHasStarted(s)) {
                            e.preventDefault();
                            const msg = s.status === "complete" ? "Shift is complete — can't reassign or reallocate." : "Shift time already started — can't reassign or reallocate.";
                            toast.error(msg);
                            return;
                          }
                          e.dataTransfer.setData("text/plain", s.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onClick={() =>
                          setEditing({
                            id: s.id,
                            ref: s.ref,
                            date: dateLabel,
                            status: statusLabel(s.status),
                            client: s.client,
                            start: s.start,
                            end: s.end,
                            staff: s.staff,
                            service: s.service,
                            checkIn: s.dbVisit?.check_in_time,
                            checkOut: s.dbVisit?.check_out_time,
                            duration_minutes: s.dbVisit?.duration_minutes,
                          })
                        }
                        title={`${s.client} • ${fmtTime(s.start)}–${fmtTime(s.end)} • ${s.service} — drag onto a caregiver to assign`}
                        className={cn(
                          "cursor-grab active:cursor-grabbing select-none rounded-md border px-2 py-1.5 text-[11px] leading-tight shadow-sm hover:ring-1 hover:ring-primary transition-all bg-yellow-200/90 border-yellow-500 text-yellow-950 min-w-[160px]",
                          cancelledIds.has(s.id) && "opacity-50 line-through"
                        )}
                      >
                        <div className="font-semibold truncate flex items-center gap-1">
                          <span className="opacity-60">⋮⋮</span>
                          <span className="truncate">{s.client}</span>
                        </div>
                        <div className="font-mono opacity-80">
                          {fmtTime(s.start)}–{fmtTime(s.end)}
                        </div>
                        <div className="opacity-70 truncate">{s.service}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Timeline grid */}
        <div className="border border-border rounded-md bg-card overflow-hidden">
          <div className="flex">
            {/* Sticky staff column */}
            <div className="shrink-0 w-44 border-r border-border bg-muted/30">
              <div
                className="px-2 flex items-center text-[11px] font-semibold uppercase border-b border-border bg-muted text-muted-foreground"
                style={{ height: viewMode === 'daily' ? HEADER_H : headerHeight + 28 }}
              >
                Staff / {viewMode === 'daily' ? 'Time' : 'Day'}
              </div>
              {staffRows.map((name) => (
                <div
                  key={name}
                  className="px-2 flex items-center text-xs font-medium border-b border-border text-foreground"
                  style={{ height: rowHeight }}
                >
                  <span className="truncate">{name}</span>
                </div>
              ))}
            </div>

            {/* Scrollable timeline */}
            <div className="overflow-x-auto flex-1">
              <div
                ref={gridRef}
                className="relative select-none"
                style={{ width: totalGridWidth }}
                onPointerMove={viewMode === 'daily' ? onPointerMoveGrid : undefined}
                onPointerUp={viewMode === 'daily' ? onPointerUpGrid : undefined}
              >
                {viewMode === 'daily' ? (
                  <>
                    {/* Hour header */}
                    <div
                      className="border-b border-border bg-muted sticky top-0 z-10"
                      style={{ height: HEADER_H }}
                    >
                      <div className="flex" style={{ height: HEADER_H }}>
                        {HOURS.map((h, i) => (
                          <div
                            key={i}
                            className={cn(
                              "shrink-0 text-[10px] text-center text-muted-foreground border-r border-border/60 flex items-center justify-center",
                              i % 2 === 0 ? "font-semibold text-foreground" : ""
                            )}
                            style={{ width: PX_PER_HOUR / 2 }}
                          >
                            {fmtTime(h)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rows (daily) */}
                    {staffRows.map((staff, rowIdx) => (
                      <div
                        key={staff}
                        className={cn(
                          "relative border-b border-border",
                          rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20"
                        )}
                        style={{ height: ROW_HEIGHT }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const id = e.dataTransfer.getData("text/plain");
                          if (!id) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const dropHour = x / PX_PER_HOUR;
                          assignDroppedShift(id, staff, 0, dropHour);
                        }}
                      >
                        {HOURS.map((h, i) => (
                          <div
                            key={h}
                            className={cn(
                              "absolute top-0 bottom-0 border-r",
                              i % 2 === 0 ? "border-border/70" : "border-border/30"
                            )}
                            style={{ left: h * PX_PER_HOUR, width: 0 }}
                          />
                        ))}

                        {shifts
                          .filter((s) => s.staff === staff && (!hoverGhost || s.id !== hoverGhost.id))
                          .filter((s) => filterCancelled === "show" || !cancelledIds.has(s.id))
                          .map((s) => (
                            <ShiftBlock
                              key={s.id}
                              shift={s}
                              selected={selected.has(s.id)}
                              cancelled={cancelledIds.has(s.id)}
                              conflictsWith={conflicts.get(s.id)}
                              onPointerDown={(e) => onPointerDownShift(e, s)}
                            />
                          ))}

                        {hoverGhost && hoverGhost.staff === staff && (
                          <ShiftBlock
                            shift={{
                              ...(shifts.find((s) => s.id === hoverGhost.id)!),
                              start: hoverGhost.start,
                              end: hoverGhost.end,
                              staff: hoverGhost.staff,
                            }}
                            selected={false}
                            ghost
                          />
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {/* Weekly: 7 day-column header */}
                    <div
                      className="border-b border-border bg-muted sticky top-0 z-10 flex"
                      style={{ height: headerHeight + 28 }}
                    >
                      {days.map((d, i) => {
                        const isToday = isSameDay(d, new Date());
                        return (
                          <div
                            key={i}
                            className={cn(
                              "border-r border-border flex flex-col items-center justify-center",
                              isToday && "bg-primary/10"
                            )}
                            style={{ width: WEEK_DAY_WIDTH }}
                          >
                            <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                              {d.toLocaleDateString("en-GB", { weekday: "short" })}
                            </span>
                            <span className={cn("text-xs font-medium", isToday && "text-primary")}>
                              {formatDateShort(d)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Weekly rows: staff x day grid */}
                    {staffRows.map((staff, rowIdx) => (
                      <div
                        key={staff}
                        className={cn(
                          "relative border-b border-border flex",
                          rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20"
                        )}
                        style={{ height: WEEKLY_ROW_HEIGHT }}
                      >
                        {days.map((_, dayIdx) => {
                          const cellShifts = shifts
                            .filter(
                              (s) =>
                                s.staff === staff &&
                                s.dayIndex === dayIdx &&
                                (filterCancelled === "show" || !cancelledIds.has(s.id))
                            )
                            .sort((a, b) => a.start - b.start);
                          return (
                            <div
                              key={dayIdx}
                              className="border-r border-border p-1 overflow-y-auto space-y-1"
                              style={{ width: WEEK_DAY_WIDTH }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const id = e.dataTransfer.getData("text/plain");
                                if (id) assignDroppedShift(id, staff, dayIdx);
                              }}
                            >
                              {cellShifts.length === 0 && (
                                <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground/40">
                                  —
                                </div>
                              )}
                              {cellShifts.map((s) => {
                                const conflictList = conflicts.get(s.id);
                                const hasConflict = !!conflictList?.length;
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    draggable={!shiftHasStarted(s)}
                                    onDragStart={(e) => {
                                      if (shiftHasStarted(s)) {
                                        e.preventDefault();
                                        const msg = s.status === "complete" ? "Shift is complete — can't reassign or reallocate." : "Shift time already started — can't reassign or reallocate.";
                                        toast.error(msg);
                                        return;
                                      }
                                      e.dataTransfer.setData("text/plain", s.id);
                                      e.dataTransfer.effectAllowed = "move";
                                    }}
                                    title={
                                      hasConflict
                                        ? `⚠ Shift conflict for ${s.staff}\n${s.client} ${fmtTime(s.start)}–${fmtTime(s.end)} overlaps with:\n` +
                                          conflictList!
                                            .map((c) => `• ${c.client} ${fmtTime(c.start)}–${fmtTime(c.end)} (${c.service})`)
                                            .join("\n")
                                        : `${s.client} • ${fmtTime(s.start)}–${fmtTime(s.end)} • ${s.service}`
                                    }
                                    onClick={() =>
                                      setEditing({
                                        id: s.id,
                                        ref: s.ref,
                                        date: dateLabel,
                                        status: statusLabel(s.status),
                                        client: s.client,
                                        start: s.start,
                                        end: s.end,
                                        staff: s.staff,
                                        service: s.service,
                                        checkIn: s.dbVisit?.check_in_time,
                                        checkOut: s.dbVisit?.check_out_time,
                                        duration_minutes: s.dbVisit?.duration_minutes,
                                        clockHours: s.dbVisit?.check_in_time && s.dbVisit?.check_out_time ? (() => {
                                          const mins = Math.round((new Date(s.dbVisit.check_out_time).getTime() - new Date(s.dbVisit.check_in_time).getTime()) / 60000);
                                          const h = Math.floor(mins / 60);
                                          const m = mins % 60;
                                          return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                                        })() : "00:00",
                                      })
                                    }
                                    className={cn(
                                      "w-full cursor-grab active:cursor-grabbing text-left rounded-sm border px-1.5 py-1 text-[10px] leading-tight shadow-sm hover:ring-1 hover:ring-primary transition-all",
                                      hasConflict
                                        ? "bg-red-200/90 border-red-500 text-red-950 ring-1 ring-red-500 animate-pulse"
                                        : s.staff === "Unassigned Shifts"
                                          ? "bg-yellow-200/90 border-yellow-500 text-yellow-950"
                                          : statusStyles(s.status),
                                      cancelledIds.has(s.id) && "opacity-50 line-through",
                                      selected.has(s.id) && "ring-2 ring-primary"
                                    )}
                                  >
                                    <div className="font-semibold truncate flex items-center gap-1">
                                      {hasConflict && <span aria-hidden>⚠</span>}
                                      <span className="truncate">{s.client}</span>
                                    </div>
                                    <div className="opacity-80 font-mono">
                                      {fmtTime(s.start)}–{fmtTime(s.end)}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground px-1">
          <LegendDot className="bg-green-300 border-green-500" label="Complete" />
          <LegendDot className="bg-cyan-300 border-cyan-500" label="In Progress" />
          <LegendDot className="bg-blue-300 border-blue-500" label="Scheduled" />
          <LegendDot className="bg-rose-300 border-rose-500" label="Missed" />
          <LegendDot className="bg-purple-300 border-purple-500" label="On Call" />
          <LegendDot className="bg-yellow-300 border-yellow-500" label="Unassigned" />
          <LegendDot className="bg-red-300 border-red-500" label="Conflict" />
          <span className="ml-auto flex items-center gap-1">
            <GripVertical className="h-3.5 w-3.5" /> Drag any block to reschedule or reassign
          </span>
        </div>
      </div>

      <EditRotaDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        shift={editing}
        onSave={handleSaveEdit}
      />

      <AlertDialog open={!!pendingMove} onOpenChange={(o) => !o && setPendingMove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingMove?.fromStaff === "Unassigned Shifts" ? "Assign shift?" : "Move shift?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1">
                  <div><span className="text-muted-foreground">Client:</span> <span className="font-medium text-foreground">{pendingMove?.client}</span></div>
                  <div><span className="text-muted-foreground">Reference:</span> <span className="font-mono text-foreground">{pendingMove?.ref}</span></div>
                  <div><span className="text-muted-foreground">Service:</span> <span className="text-foreground">{pendingMove?.service}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-border p-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">From</div>
                    <div className="font-medium text-foreground">{pendingMove?.fromStaff}</div>
                    <div className="text-xs text-muted-foreground">
                      {pendingMove && `${fmtTime(pendingMove.fromStart)}–${fmtTime(pendingMove.fromEnd)}`}
                    </div>
                  </div>
                  <div className="rounded-md border border-primary/40 bg-primary/5 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-primary">To</div>
                    <div className="font-medium text-foreground">{pendingMove?.toStaff}</div>
                    <div className="text-xs text-muted-foreground">
                      {pendingMove && `${fmtTime(pendingMove.toStart)}–${fmtTime(pendingMove.toEnd)}`}
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingMove}>
              {pendingMove?.fromStaff === "Unassigned Shifts" ? "Assign" : "Confirm move"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

/* -------------------------------------------------------------------------- */
/*  Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("inline-block h-3 w-3 rounded-sm border", className)} />
      {label}
    </span>
  );
}

function ShiftBlock({
  shift,
  selected,
  ghost,
  cancelled,
  conflictsWith,
  onPointerDown,
  onClick,
}: {
  shift: Shift;
  selected: boolean;
  ghost?: boolean;
  cancelled?: boolean;
  conflictsWith?: Shift[];
  onPointerDown?: (e: React.PointerEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const left = (shift.dayIndex * 24 + shift.start) * PX_PER_HOUR;
  const width = Math.max(40, (shift.end - shift.start) * PX_PER_HOUR);
  const hasConflict = !!conflictsWith?.length;
  const title = hasConflict
    ? `⚠ Shift conflict for ${shift.staff}\n${shift.client} ${fmtTime(shift.start)}–${fmtTime(shift.end)} overlaps with:\n` +
      conflictsWith!
        .map((c) => `• ${c.client} ${fmtTime(c.start)}–${fmtTime(c.end)} (${c.service})`)
        .join("\n")
    : `${shift.client} • ${fmtTime(shift.start)}–${fmtTime(shift.end)} • ${shift.service}`;
  return (
    <div
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={cn(
        "absolute top-1 bottom-1 rounded-sm border px-1.5 py-0.5 cursor-grab active:cursor-grabbing overflow-hidden text-[10px] leading-tight shadow-sm",
        hasConflict
          ? "bg-red-200/90 border-red-500 text-red-950 ring-1 ring-red-500 animate-pulse z-10"
          : shift.staff === "Unassigned Shifts"
            ? "bg-yellow-200/90 border-yellow-500 text-yellow-950"
            : statusStyles(shift.status),
        selected && "ring-2 ring-primary ring-offset-1",
        ghost && "opacity-60 ring-2 ring-primary",
        cancelled && "opacity-50 line-through"
      )}
      style={{ left, width }}
      title={title}
    >
      <div className="font-semibold truncate flex items-center gap-1">
        {hasConflict && <span aria-hidden>⚠</span>}
        <span className="truncate">
          {shift.client} <span className="opacity-70 font-normal">{fmtTime(shift.start)}</span>
        </span>
      </div>
      <div className="truncate opacity-80">{shift.ref}</div>
      <div className="flex items-center gap-0.5 mt-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 border border-yellow-600" />
        <span className="h-1.5 w-1.5 rounded-full bg-orange-400 border border-orange-600" />
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 border border-emerald-700" />
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 border border-blue-700" />
      </div>
    </div>
  );
}
