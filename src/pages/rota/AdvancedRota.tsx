import { useMemo, useRef, useState } from "react";
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
import { useCareGivers, useCareReceivers } from "@/hooks/use-care-data";
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
}

const STATIC_STAFF = [
  "Unassigned Shifts",
  "Ewelina Delport",
  "Jodie Hawtin",
  "Sukhleen Kaur",
  "Maria Khalil",
  "Alison McBride",
  "Ellie Milton",
  "Rita Muneeb",
  "Javeria Nisar",
  "Magdalena Pawelska",
  "Shaista Rafiq",
];

const ROW_HEIGHT = 56; // px (daily)
const WEEKLY_ROW_HEIGHT = 140; // px — taller so day cells can stack shifts
const PX_PER_HOUR = 64; // 24h * 64 = 1536px (daily timeline)
const WEEK_DAY_WIDTH = 180; // px per day column (weekly)
const HEADER_H = 28;

// Base shift templates per staff (without status — derived from date)
interface ShiftTemplate {
  staff: string;
  start: number;
  end: number;
  client: string;
  ref: string;
  service: string;
  kind?: "oncall" | "visit"; // oncall stays oncall regardless of date
}

const SHIFT_TEMPLATES: ShiftTemplate[] = [
  // Unassigned
  { staff: "Unassigned Shifts", start: 7.083, end: 8.917, client: "Maryam Tariq", ref: "145632433", service: "CHC - Morning Call" },
  { staff: "Unassigned Shifts", start: 12.5, end: 13.75, client: "Janet Henda", ref: "145978404", service: "WCC - Lunch" },

  // Ewelina Delport
  { staff: "Ewelina Delport", start: 6.917, end: 8.917, client: "On Call", ref: "145879338", service: "On Call", kind: "oncall" },
  { staff: "Ewelina Delport", start: 9, end: 21, client: "On Call", ref: "145978644", service: "On Call", kind: "oncall" },
  { staff: "Ewelina Delport", start: 7.5, end: 8.25, client: "Raymond Goodall", ref: "145698523", service: "WCC - Morning" },
  { staff: "Ewelina Delport", start: 7.5, end: 8.25, client: "Peter Booth", ref: "145978721", service: "WCC - Morning" },
  { staff: "Ewelina Delport", start: 8.5, end: 9.25, client: "Eileen Thorn", ref: "145978856", service: "WCC - Morning" },
  { staff: "Ewelina Delport", start: 13, end: 13.75, client: "Marion Poulter", ref: "145641212", service: "WCC - Lunch" },
  { staff: "Ewelina Delport", start: 13.5, end: 14.25, client: "Peter Booth", ref: "145978721", service: "WCC - Lunch" },

  // Jodie Hawtin
  { staff: "Jodie Hawtin", start: 7.5, end: 8.25, client: "Raymond Goodall", ref: "145978664", service: "WCC - Morning" },
  { staff: "Jodie Hawtin", start: 8.25, end: 9, client: "Marion Poulter", ref: "145978611", service: "WCC - Morning" },
  { staff: "Jodie Hawtin", start: 9, end: 9.75, client: "Eileen Thorn", ref: "145978650", service: "WCC - Morning" },
  { staff: "Jodie Hawtin", start: 11, end: 11.75, client: "Marion Poulter", ref: "145978657", service: "WCC" },
  { staff: "Jodie Hawtin", start: 12.5, end: 13.25, client: "Raymond Goodall", ref: "145978664", service: "WCC" },
  { staff: "Jodie Hawtin", start: 16.5, end: 17.25, client: "Marion Poulter", ref: "145978657", service: "WCC" },
  { staff: "Jodie Hawtin", start: 17.25, end: 18, client: "Colin Evans", ref: "145978701", service: "WCC" },
  { staff: "Jodie Hawtin", start: 18, end: 18.75, client: "Joan Marcher", ref: "145978731", service: "WCC" },
  { staff: "Jodie Hawtin", start: 18.75, end: 19.5, client: "Peter Booth", ref: "145978721", service: "WCC" },
  { staff: "Jodie Hawtin", start: 19.5, end: 20.25, client: "Carol Sawyer", ref: "145978845", service: "WCC" },

  // Sukhleen Kaur
  { staff: "Sukhleen Kaur", start: 7, end: 7.75, client: "Wendy Rawlins", ref: "145978773", service: "WCC - Morning" },
  { staff: "Sukhleen Kaur", start: 7.75, end: 8.5, client: "Colin Evans", ref: "145978701", service: "WCC" },
  { staff: "Sukhleen Kaur", start: 8.5, end: 9.25, client: "Carol Sawyer", ref: "145978710", service: "WCC" },
  { staff: "Sukhleen Kaur", start: 9.5, end: 10.25, client: "James Hamilton", ref: "145978722", service: "WCC" },
  { staff: "Sukhleen Kaur", start: 10.25, end: 11, client: "Michael Taylor", ref: "145978745", service: "WCC" },
  { staff: "Sukhleen Kaur", start: 11, end: 11.75, client: "Dulcie Sadham", ref: "145978721", service: "WCC" },

  // Maria Khalil
  { staff: "Maria Khalil", start: 7.5, end: 8.25, client: "Norman Iles", ref: "145978827", service: "WCC" },
  { staff: "Maria Khalil", start: 8.25, end: 9, client: "Helen Hawks", ref: "145978876", service: "WCC" },
  { staff: "Maria Khalil", start: 9.5, end: 10.25, client: "Michael Taylor", ref: "145978701", service: "WCC" },
  { staff: "Maria Khalil", start: 11, end: 11.75, client: "Anthony Taylor", ref: "145978701", service: "WCC" },
  { staff: "Maria Khalil", start: 11.75, end: 12.5, client: "Helen Hawks", ref: "145978735", service: "WCC" },
  { staff: "Maria Khalil", start: 17, end: 17.75, client: "James Hamilton", ref: "145978744", service: "WCC" },
  { staff: "Maria Khalil", start: 17.75, end: 18.5, client: "Edna Morris", ref: "145978745", service: "WCC" },
  { staff: "Maria Khalil", start: 18.5, end: 19.25, client: "Michael Taylor", ref: "145978745", service: "WCC" },
  { staff: "Maria Khalil", start: 19.25, end: 20, client: "Wendy Rawlins", ref: "145978743", service: "WCC" },
  { staff: "Maria Khalil", start: 20, end: 20.75, client: "Dulcie Sadham", ref: "145978721", service: "WCC" },

  // Alison McBride
  { staff: "Alison McBride", start: 8, end: 8.75, client: "Christine Jagger", ref: "145978650", service: "WCC" },
  { staff: "Alison McBride", start: 8.75, end: 9.5, client: "Marion Such", ref: "145978701", service: "WCC" },
  { staff: "Alison McBride", start: 9.5, end: 10.25, client: "Brenda Prince", ref: "145978745", service: "WCC" },
  { staff: "Alison McBride", start: 13.5, end: 14.25, client: "Doreen Mason", ref: "145978701", service: "WCC" },
  { staff: "Alison McBride", start: 14.25, end: 15, client: "Pamela Davis", ref: "145978745", service: "WCC" },
  { staff: "Alison McBride", start: 15, end: 15.75, client: "Pamela Johnson", ref: "145978743", service: "WCC" },
  { staff: "Alison McBride", start: 15.75, end: 16.5, client: "Brenda Prince", ref: "145978745", service: "WCC" },
  { staff: "Alison McBride", start: 16.5, end: 17.25, client: "Christine Jagger", ref: "145978650", service: "WCC" },
  { staff: "Alison McBride", start: 17.25, end: 18, client: "Roger Pebar", ref: "145978745", service: "WCC" },

  // Ellie Milton
  { staff: "Ellie Milton", start: 7.5, end: 8.25, client: "Stella Orgee", ref: "145978611", service: "WCC" },
  { staff: "Ellie Milton", start: 8.25, end: 9, client: "Christine Jagger", ref: "145978650", service: "WCC" },
  { staff: "Ellie Milton", start: 9, end: 9.75, client: "Marion Such", ref: "145978701", service: "WCC" },
  { staff: "Ellie Milton", start: 10, end: 11, client: "Carol Taylor", ref: "145978735", service: "Private Morning" },
  { staff: "Ellie Milton", start: 11, end: 11.75, client: "Edna Morris", ref: "145978745", service: "WCC" },
  { staff: "Ellie Milton", start: 11.75, end: 12.5, client: "Christine Taylor", ref: "145978743", service: "WCC" },

  // Rita Muneeb
  { staff: "Rita Muneeb", start: 7, end: 7.75, client: "Thomas Iles", ref: "145978621", service: "WCC" },
  { staff: "Rita Muneeb", start: 7.75, end: 8.5, client: "Edna Morris", ref: "145978690", service: "WCC" },
  { staff: "Rita Muneeb", start: 8.5, end: 9.25, client: "Janet Henda", ref: "145978745", service: "WCC" },
  { staff: "Rita Muneeb", start: 9.25, end: 10, client: "Thomas Iles", ref: "145978701", service: "WCC" },
  { staff: "Rita Muneeb", start: 0, end: 8, client: "Betty Miles", ref: "145973330", service: "Private - Live-in Care (Basic)" },
  { staff: "Rita Muneeb", start: 8, end: 12, client: "Betty Miles", ref: "145978650", service: "Private - Live-in Care (Basic)" },
  { staff: "Rita Muneeb", start: 12, end: 14, client: "Betty Miles", ref: "145978666", service: "Private - Live-in Care (Basic)" },

  // Javeria Nisar
  { staff: "Javeria Nisar", start: 14, end: 16, client: "Betty Miles", ref: "145978670", service: "Private - Live-in Care (Basic)" },
  { staff: "Javeria Nisar", start: 16, end: 20, client: "Betty Miles", ref: "145978680", service: "Private - Live-in Care (Basic)" },
  { staff: "Javeria Nisar", start: 20, end: 24, client: "Betty Miles", ref: "145978677", service: "Private - Live-in Care (Basic)" },

  // Magdalena Pawelska
  { staff: "Magdalena Pawelska", start: 20, end: 21, client: "Enid Joyce", ref: "145978691", service: "Private" },
  { staff: "Magdalena Pawelska", start: 21, end: 22.25, client: "Richard Peplow", ref: "145978763", service: "Private" },

  // Shaista Rafiq
  { staff: "Shaista Rafiq", start: 7.5, end: 8.25, client: "Winifred Griffiths", ref: "145978672", service: "Private" },
  { staff: "Shaista Rafiq", start: 8.5, end: 9.25, client: "Dorothy Smith", ref: "145978727", service: "WCC - Morning" },
  { staff: "Shaista Rafiq", start: 9.5, end: 10.5, client: "Pamela McCaddie", ref: "145978735", service: "WCC - Morning" },
  { staff: "Shaista Rafiq", start: 11, end: 12, client: "Carol Sawyer", ref: "145978769", service: "WCC" },
  { staff: "Shaista Rafiq", start: 16.5, end: 17.25, client: "Joan Lewis", ref: "145978721", service: "WCC" },
  { staff: "Shaista Rafiq", start: 17.25, end: 18, client: "Christine Taylor", ref: "145978745", service: "WCC" },
  { staff: "Shaista Rafiq", start: 18, end: 18.75, client: "Thomas Iles", ref: "145978701", service: "WCC" },
  { staff: "Shaista Rafiq", start: 18.75, end: 19.5, client: "Wendy Rawlins", ref: "145978690", service: "WCC" },
];

// Seeded PRNG for stable per-day variation
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dayKey(d: Date) {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

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

function buildShiftsForDate(date: Date, receiverNames: string[], staffNameMap: Record<string, string>, dayIndex: number = 0): Shift[] {
  const today = new Date();
  const todayKey = dayKey(today);
  const dKey = dayKey(date);
  const isPast = dKey < todayKey;
  const isToday = dKey === todayKey;
  const isFuture = dKey > todayKey;
  const nowHours = today.getHours() + today.getMinutes() / 60;

  const rng = mulberry32(dKey);

  return SHIFT_TEMPLATES
    // For future days, drop a random subset to make every day look different
    .filter((t) => {
      if (t.kind === "oncall") return true;
      if (isFuture) return rng() > 0.15; // ~85% kept
      if (isPast) return rng() > 0.05;
      return true;
    })
    .map((t, idx) => {
      // Slight per-day jitter on start time (-15..+15 min) for realism, except live-in/oncall
      let start = t.start;
      let end = t.end;
      if (t.kind !== "oncall" && end - start <= 2) {
        const jitter = (Math.round((rng() - 0.5) * 2) * 0.25); // -0.25, 0, 0.25
        start = Math.max(0, Math.min(23.5, start + jitter));
        end = Math.max(start + 0.25, end + jitter);
      }

      const isUnassigned = t.staff === "Unassigned Shifts";
      let status: ShiftStatus;
      if (t.kind === "oncall") {
        status = isFuture ? "scheduled" : isPast ? "complete" : "oncall";
      } else if (isUnassigned) {
        // Unassigned shifts can never be "complete" or "in-progress" — if their
        // time has passed (or is currently passing) they are missed.
        if (isFuture) {
          status = "scheduled";
        } else if (isPast) {
          status = "missed";
        } else {
          status = start <= nowHours ? "missed" : "scheduled";
        }
      } else if (isFuture) {
        status = "scheduled";
      } else if (isPast) {
        // Mostly complete, occasional missed
        status = rng() < 0.06 ? "missed" : "complete";
      } else {
        // Today: based on current time
        if (end <= nowHours) {
          status = rng() < 0.05 ? "missed" : "complete";
        } else if (start <= nowHours && nowHours < end) {
          status = "in-progress";
        } else {
          status = "scheduled";
        }
      }

      // Build per-day unique id
      const client = receiverNames.length > 0
        ? receiverNames[idx % receiverNames.length]
        : t.client;
      const staff = staffNameMap[t.staff] || t.staff;
      return {
        id: `${dKey}-${idx}`,
        staff,
        start,
        end,
        client,
        ref: t.ref,
        service: t.service + statusSuffix(status),
        status,
        dayIndex,
      };
    });
}

function statusSuffix(s: ShiftStatus) {
  switch (s) {
    case "complete": return " - Complete";
    case "in-progress": return " - In Progress";
    case "missed": return " - Missed";
    case "oncall": return " - On Call";
    default: return "";
  }
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
  // All rows used for shift generation (unassigned + caregivers)
  const allRows = useMemo(() => [UNASSIGNED, ...staffRows], [staffRows]);

  const receiverNames = useMemo(
    () => careReceivers.map((cr: any) => cr.name || "Unknown Service Member"),
    [careReceivers]
  );

  const staffNameMap = useMemo(() => {
    return STATIC_STAFF.reduce<Record<string, string>>((map, name, index) => {
      if (index === 0) {
        map[name] = name; // Unassigned stays as-is
      } else {
        // STATIC_STAFF[1..] -> staffRows[0..]
        map[name] = staffRows[index - 1] || name;
      }
      return map;
    }, {});
  }, [staffRows]);

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

  // Build shifts for the current days, then apply any user overrides
  const shifts = useMemo<Shift[]>(() => {
    const allShifts: Shift[] = [];
    days.forEach((d, i) => {
      const dayShifts = buildShiftsForDate(d, receiverNames, staffNameMap, i);
      dayShifts.forEach(s => {
        const ov = overrides[s.id];
        allShifts.push(ov ? { ...s, ...ov } : s);
      });
    });
    return allShifts;
  }, [days, overrides]);

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

  function onPointerMoveGrid(e: React.PointerEvent) {
    if (!drag || !gridRef.current) return;

    // Detect actual drag (>4px movement) — anything less is treated as a click
    if (!drag.moved) {
      const dx = Math.abs(e.clientX - drag.originX);
      const dy = Math.abs(e.clientY - drag.originY);
      if (dx < 4 && dy < 4) return;
      setDrag({ ...drag, moved: true });
    }

    const grid = gridRef.current.getBoundingClientRect();
    const x = e.clientX - grid.left + gridRef.current.scrollLeft;
    const y = e.clientY - grid.top;

    const shift = shifts.find((s) => s.id === drag.id);
    if (!shift) return;

    const length = shift.end - shift.start;
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

  function onPointerUpGrid() {
    if (drag) {
      if (drag.moved && hoverGhost) {
        const s = shifts.find((x) => x.id === drag.id);
        if (s) {
          const changed =
            hoverGhost.staff !== s.staff ||
            hoverGhost.start !== s.start ||
            hoverGhost.end !== s.end;
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
          });
        }
      }
    }
    setDrag(null);
    setHoverGhost(null);
  }

  function confirmPendingMove() {
    if (!pendingMove) return;
    setOverrides((prev) => ({
      ...prev,
      [pendingMove.id]: {
        staff: pendingMove.toStaff,
        start: pendingMove.toStart,
        end: pendingMove.toEnd,
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

  function assignDroppedShift(shiftId: string, toStaff: string, toDayIndex: number) {
    const s = shifts.find((x) => x.id === shiftId);
    if (!s) return;
    setPendingMove({
      id: s.id,
      fromStaff: s.staff,
      toStaff,
      fromStart: s.start,
      fromEnd: s.end,
      toStart: s.start,
      toEnd: s.end,
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
              onClick={() => setViewMode('daily')}
              size="sm"
            >
              Daily
            </Button>
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'outline'}
              onClick={() => setViewMode('weekly')}
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
            <div className="border-2 border-yellow-500/70 rounded-md bg-yellow-50/40 dark:bg-yellow-950/10 overflow-hidden mb-3">
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
                        draggable
                        onDragStart={(e) => {
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
                                      })
                                    }
                                    className={cn(
                                      "w-full text-left rounded-sm border px-1.5 py-1 text-[10px] leading-tight shadow-sm hover:ring-1 hover:ring-primary transition-all",
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
