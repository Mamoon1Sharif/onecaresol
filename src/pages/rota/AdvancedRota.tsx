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
}

const STAFF = [
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

const ROW_HEIGHT = 56; // px
const PX_PER_HOUR = 64; // 24h * 64 = 1536px
const HEADER_H = 28;

const initialShifts: Shift[] = [
  // Unassigned
  { id: "s1", staff: "Unassigned Shifts", start: 7.083, end: 8.917, client: "Maryam Tariq", ref: "145632433", service: "CHC - Morning Call - Missed", status: "missed" },
  { id: "s2", staff: "Unassigned Shifts", start: 12.5, end: 13.75, client: "Janet Henda", ref: "145978404", service: "WCC - Lunch", status: "scheduled" },

  // Ewelina Delport
  { id: "s3", staff: "Ewelina Delport", start: 6.917, end: 8.917, client: "On Call", ref: "145879338", service: "On Call - Missed", status: "oncall" },
  { id: "s4", staff: "Ewelina Delport", start: 9, end: 21, client: "On Call", ref: "145978644", service: "On Call - Missed", status: "oncall" },
  { id: "s5", staff: "Ewelina Delport", start: 7.5, end: 8.25, client: "Raymond Goodall", ref: "145698523", service: "WCC - Morning", status: "complete" },
  { id: "s6", staff: "Ewelina Delport", start: 7.5, end: 8.25, client: "Peter Booth", ref: "145978721", service: "WCC - Morning", status: "complete" },
  { id: "s7", staff: "Ewelina Delport", start: 8.5, end: 9.25, client: "Eileen Thorn", ref: "145978856", service: "WCC - Morning", status: "complete" },
  { id: "s8", staff: "Ewelina Delport", start: 13, end: 13.75, client: "Marion Poulter", ref: "145641212", service: "WCC - Lunch", status: "complete" },
  { id: "s9", staff: "Ewelina Delport", start: 13.5, end: 14.25, client: "Peter Booth", ref: "145978721", service: "WCC - Lunch", status: "complete" },

  // Jodie Hawtin
  { id: "s10", staff: "Jodie Hawtin", start: 7.5, end: 8.25, client: "Raymond Goodall", ref: "145978664", service: "WCC - Morning", status: "complete" },
  { id: "s11", staff: "Jodie Hawtin", start: 8.25, end: 9, client: "Marion Poulter", ref: "145978611", service: "WCC - Morning", status: "complete" },
  { id: "s12", staff: "Jodie Hawtin", start: 9, end: 9.75, client: "Eileen Thorn", ref: "145978650", service: "WCC - Morning", status: "complete" },
  { id: "s13", staff: "Jodie Hawtin", start: 11, end: 11.75, client: "Marion Poulter", ref: "145978657", service: "WCC", status: "complete" },
  { id: "s14", staff: "Jodie Hawtin", start: 12.5, end: 13.25, client: "Raymond Goodall", ref: "145978664", service: "WCC", status: "complete" },
  { id: "s15", staff: "Jodie Hawtin", start: 16.5, end: 17.25, client: "Marion Poulter", ref: "145978657", service: "WCC", status: "complete" },
  { id: "s16", staff: "Jodie Hawtin", start: 17.25, end: 18, client: "Colin Evans", ref: "145978701", service: "WCC", status: "complete" },
  { id: "s17", staff: "Jodie Hawtin", start: 18, end: 18.75, client: "Joan Marcher", ref: "145978731", service: "WCC", status: "complete" },
  { id: "s18", staff: "Jodie Hawtin", start: 18.75, end: 19.5, client: "Peter Booth", ref: "145978721", service: "WCC", status: "complete" },
  { id: "s19", staff: "Jodie Hawtin", start: 19.5, end: 20.25, client: "Carol Sawyer", ref: "145978845", service: "WCC", status: "complete" },

  // Sukhleen Kaur
  { id: "s20", staff: "Sukhleen Kaur", start: 7, end: 7.75, client: "Wendy Rawlins", ref: "145978773", service: "WCC - Morning", status: "complete" },
  { id: "s21", staff: "Sukhleen Kaur", start: 7.75, end: 8.5, client: "Colin Evans", ref: "145978701", service: "WCC", status: "complete" },
  { id: "s22", staff: "Sukhleen Kaur", start: 8.5, end: 9.25, client: "Carol Sawyer", ref: "145978710", service: "WCC", status: "complete" },
  { id: "s23", staff: "Sukhleen Kaur", start: 9.5, end: 10.25, client: "James Hamilton", ref: "145978722", service: "WCC", status: "complete" },
  { id: "s24", staff: "Sukhleen Kaur", start: 10.25, end: 11, client: "Michael Taylor", ref: "145978745", service: "WCC", status: "complete" },
  { id: "s25", staff: "Sukhleen Kaur", start: 11, end: 11.75, client: "Dulcie Sadham", ref: "145978721", service: "WCC", status: "complete" },

  // Maria Khalil
  { id: "s26", staff: "Maria Khalil", start: 7.5, end: 8.25, client: "Norman Iles", ref: "145978827", service: "WCC", status: "complete" },
  { id: "s27", staff: "Maria Khalil", start: 8.25, end: 9, client: "Helen Hawks", ref: "145978876", service: "WCC", status: "complete" },
  { id: "s28", staff: "Maria Khalil", start: 9.5, end: 10.25, client: "Michael Taylor", ref: "145978701", service: "WCC", status: "complete" },
  { id: "s29", staff: "Maria Khalil", start: 11, end: 11.75, client: "Anthony Taylor", ref: "145978701", service: "WCC", status: "complete" },
  { id: "s30", staff: "Maria Khalil", start: 11.75, end: 12.5, client: "Helen Hawks", ref: "145978735", service: "WCC", status: "complete" },
  { id: "s31", staff: "Maria Khalil", start: 17, end: 17.75, client: "James Hamilton", ref: "145978744", service: "WCC", status: "complete" },
  { id: "s32", staff: "Maria Khalil", start: 17.75, end: 18.5, client: "Edna Morris", ref: "145978745", service: "WCC", status: "complete" },
  { id: "s33", staff: "Maria Khalil", start: 18.5, end: 19.25, client: "Michael Taylor", ref: "145978745", service: "WCC", status: "complete" },
  { id: "s34", staff: "Maria Khalil", start: 19.25, end: 20, client: "Wendy Rawlins", ref: "145978743", service: "WCC", status: "complete" },
  { id: "s35", staff: "Maria Khalil", start: 20, end: 20.75, client: "Dulcie Sadham", ref: "145978721", service: "WCC", status: "complete" },

  // Alison McBride
  { id: "s36", staff: "Alison McBride", start: 8, end: 8.75, client: "Christine Jagger", ref: "145978650", service: "WCC", status: "complete" },
  { id: "s37", staff: "Alison McBride", start: 8.75, end: 9.5, client: "Marion Such", ref: "145978701", service: "WCC", status: "complete" },
  { id: "s38", staff: "Alison McBride", start: 9.5, end: 10.25, client: "Brenda Prince", ref: "145978745", service: "WCC", status: "complete" },
  { id: "s39", staff: "Alison McBride", start: 13.5, end: 14.25, client: "Doreen Mason", ref: "145978701", service: "WCC", status: "complete" },
  { id: "s40", staff: "Alison McBride", start: 14.25, end: 15, client: "Pamela Davis", ref: "145978745", service: "WCC", status: "complete" },
  { id: "s41", staff: "Alison McBride", start: 15, end: 15.75, client: "Pamela Johnson", ref: "145978743", service: "WCC", status: "complete" },
  { id: "s42", staff: "Alison McBride", start: 15.75, end: 16.5, client: "Brenda Prince", ref: "145978745", service: "WCC", status: "complete" },
  { id: "s43", staff: "Alison McBride", start: 16.5, end: 17.25, client: "Christine Jagger", ref: "145978650", service: "WCC", status: "complete" },
  { id: "s44", staff: "Alison McBride", start: 17.25, end: 18, client: "Roger Pebar", ref: "145978745", service: "WCC", status: "complete" },

  // Ellie Milton
  { id: "s45", staff: "Ellie Milton", start: 7.5, end: 8.25, client: "Stella Orgee", ref: "145978611", service: "WCC", status: "complete" },
  { id: "s46", staff: "Ellie Milton", start: 8.25, end: 9, client: "Christine Jagger", ref: "145978650", service: "WCC", status: "complete" },
  { id: "s47", staff: "Ellie Milton", start: 9, end: 9.75, client: "Marion Such", ref: "145978701", service: "WCC", status: "complete" },
  { id: "s48", staff: "Ellie Milton", start: 10, end: 11, client: "Carol Taylor", ref: "145978735", service: "Private Morning", status: "complete" },
  { id: "s49", staff: "Ellie Milton", start: 11, end: 11.75, client: "Edna Morris", ref: "145978745", service: "WCC", status: "complete" },
  { id: "s50", staff: "Ellie Milton", start: 11.75, end: 12.5, client: "Christine Taylor", ref: "145978743", service: "WCC", status: "complete" },

  // Rita Muneeb
  { id: "s51", staff: "Rita Muneeb", start: 7, end: 7.75, client: "Thomas Iles", ref: "145978621", service: "WCC", status: "complete" },
  { id: "s52", staff: "Rita Muneeb", start: 7.75, end: 8.5, client: "Edna Morris", ref: "145978690", service: "WCC", status: "complete" },
  { id: "s53", staff: "Rita Muneeb", start: 8.5, end: 9.25, client: "Janet Henda", ref: "145978745", service: "WCC", status: "complete" },
  { id: "s54", staff: "Rita Muneeb", start: 9.25, end: 10, client: "Thomas Iles", ref: "145978701", service: "WCC", status: "complete" },
  { id: "s55", staff: "Rita Muneeb", start: 0, end: 8, client: "Betty Miles", ref: "145973330", service: "Private - Live-in Care (Basic) - Complete", status: "complete" },
  { id: "s56", staff: "Rita Muneeb", start: 8, end: 12, client: "Betty Miles", ref: "145978650", service: "Private - Live-in Care (Basic) - Complete", status: "complete" },
  { id: "s57", staff: "Rita Muneeb", start: 12, end: 14, client: "Betty Miles", ref: "145978666", service: "Private - Live-in Care (Basic) - Complete", status: "complete" },

  // Javeria Nisar
  { id: "s58", staff: "Javeria Nisar", start: 14, end: 16, client: "Betty Miles", ref: "145978670", service: "Private - Live-in Care (Basic) - Complete", status: "complete" },
  { id: "s59", staff: "Javeria Nisar", start: 16, end: 20, client: "Betty Miles", ref: "145978680", service: "Private - Live-in Care (Basic) - Complete", status: "complete" },
  { id: "s60", staff: "Javeria Nisar", start: 20, end: 24, client: "Betty Miles", ref: "145978677", service: "Private - Live-in Care (Basic) - In Progress", status: "in-progress" },

  // Magdalena Pawelska
  { id: "s61", staff: "Magdalena Pawelska", start: 20, end: 21, client: "Enid Joyce", ref: "145978691", service: "Private", status: "scheduled" },
  { id: "s62", staff: "Magdalena Pawelska", start: 21, end: 22.25, client: "Richard Peplow", ref: "145978763", service: "Private", status: "scheduled" },

  // Shaista Rafiq
  { id: "s63", staff: "Shaista Rafiq", start: 7.5, end: 8.25, client: "Winifred Griffiths", ref: "145978672", service: "Private", status: "scheduled" },
  { id: "s64", staff: "Shaista Rafiq", start: 8.5, end: 9.25, client: "Dorothy Smith", ref: "145978727", service: "WCC - Morning", status: "scheduled" },
  { id: "s65", staff: "Shaista Rafiq", start: 9.5, end: 10.5, client: "Pamela McCaddie", ref: "145978735", service: "WCC - Morning", status: "scheduled" },
  { id: "s66", staff: "Shaista Rafiq", start: 11, end: 12, client: "Carol Sawyer", ref: "145978769", service: "WCC", status: "scheduled" },
  { id: "s67", staff: "Shaista Rafiq", start: 16.5, end: 17.25, client: "Joan Lewis", ref: "145978721", service: "WCC", status: "scheduled" },
  { id: "s68", staff: "Shaista Rafiq", start: 17.25, end: 18, client: "Christine Taylor", ref: "145978745", service: "WCC", status: "scheduled" },
  { id: "s69", staff: "Shaista Rafiq", start: 18, end: 18.75, client: "Thomas Iles", ref: "145978701", service: "WCC", status: "scheduled" },
  { id: "s70", staff: "Shaista Rafiq", start: 18.75, end: 19.5, client: "Wendy Rawlins", ref: "145978690", service: "WCC", status: "scheduled" },
];

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
      return "bg-emerald-100 border-emerald-300 text-emerald-900";
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

export default function AdvancedRota() {
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [bulkSelect, setBulkSelect] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterTeam, setFilterTeam] = useState("today");
  const [filterCancelled, setFilterCancelled] = useState("hide");
  const [filterUncovered, setFilterUncovered] = useState("include");
  const [date, setDate] = useState(new Date(2026, 3, 26));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drag, setDrag] = useState<{
    id: string;
    offsetHours: number;
    rowOffsetY: number;
  } | null>(null);
  const [hoverGhost, setHoverGhost] = useState<{
    id: string;
    staff: string;
    start: number;
    end: number;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  const dateLabel = useMemo(() => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }, [date]);

  const totalGridWidth = 24 * PX_PER_HOUR;

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
    setDrag({ id: s.id, offsetHours, rowOffsetY });
    setHoverGhost({ id: s.id, staff: s.staff, start: s.start, end: s.end });
    target.setPointerCapture(e.pointerId);
  }

  function onPointerMoveGrid(e: React.PointerEvent) {
    if (!drag || !gridRef.current) return;
    const grid = gridRef.current.getBoundingClientRect();
    const x = e.clientX - grid.left + gridRef.current.scrollLeft;
    const y = e.clientY - grid.top;

    const shift = shifts.find((s) => s.id === drag.id);
    if (!shift) return;

    const length = shift.end - shift.start;
    let newStart = x / PX_PER_HOUR - drag.offsetHours;
    // snap to 15 min
    newStart = Math.max(0, Math.min(24 - length, Math.round(newStart * 4) / 4));

    const rowIdx = Math.max(
      0,
      Math.min(STAFF.length - 1, Math.floor((y - HEADER_H) / ROW_HEIGHT))
    );
    const newStaff = STAFF[rowIdx];

    setHoverGhost({
      id: shift.id,
      staff: newStaff,
      start: newStart,
      end: newStart + length,
    });
  }

  function onPointerUpGrid() {
    if (drag && hoverGhost) {
      setShifts((prev) =>
        prev.map((s) =>
          s.id === drag.id
            ? { ...s, staff: hoverGhost.staff, start: hoverGhost.start, end: hoverGhost.end }
            : s
        )
      );
    }
    setDrag(null);
    setHoverGhost(null);
  }

  /* ------------------------------- Render ---------------------------------- */

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
                <SelectItem value="today">Team Members Today...</SelectItem>
                <SelectItem value="all">All Team Members</SelectItem>
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
              onClick={() => setDate(new Date(date.getTime() - 86400000))}
              aria-label="Previous day"
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
              onClick={() => setDate(new Date(date.getTime() + 86400000))}
              aria-label="Next day"
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
                <DropdownMenuItem>Add Shift</DropdownMenuItem>
                <DropdownMenuItem>Bulk Reassign</DropdownMenuItem>
                <DropdownMenuItem>Cancel Selected</DropdownMenuItem>
                <DropdownMenuItem>Activate Selected</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Export CSV</DropdownMenuItem>
                <DropdownMenuItem>Print Rota</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Timeline grid */}
        <div className="border border-border rounded-md bg-card overflow-hidden">
          <div className="flex">
            {/* Sticky staff column */}
            <div className="shrink-0 w-44 border-r border-border bg-muted/30">
              <div
                className="h-7 px-2 flex items-center text-[11px] font-semibold uppercase border-b border-border bg-muted text-muted-foreground"
                style={{ height: HEADER_H }}
              >
                Staff / Today
              </div>
              {STAFF.map((name) => (
                <div
                  key={name}
                  className="px-2 flex items-center text-xs font-medium border-b border-border text-foreground"
                  style={{ height: ROW_HEIGHT }}
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
                onPointerMove={onPointerMoveGrid}
                onPointerUp={onPointerUpGrid}
              >
                {/* Hour header */}
                <div
                  className="flex border-b border-border bg-muted sticky top-0 z-10"
                  style={{ height: HEADER_H }}
                >
                  {HOURS.map((h, i) => (
                    <div
                      key={h}
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

                {/* Rows */}
                {STAFF.map((staff, rowIdx) => (
                  <div
                    key={staff}
                    className={cn(
                      "relative border-b border-border",
                      rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20"
                    )}
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* hour gridlines */}
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

                    {/* shifts in this row */}
                    {shifts
                      .filter((s) => s.staff === staff && (!hoverGhost || s.id !== hoverGhost.id))
                      .map((s) => (
                        <ShiftBlock
                          key={s.id}
                          shift={s}
                          selected={selected.has(s.id)}
                          onPointerDown={(e) => onPointerDownShift(e, s)}
                        />
                      ))}

                    {/* ghost while dragging */}
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
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground px-1">
          <LegendDot className="bg-green-300 border-green-500" label="Complete" />
          <LegendDot className="bg-cyan-300 border-cyan-500" label="In Progress" />
          <LegendDot className="bg-emerald-100 border-emerald-300" label="Scheduled" />
          <LegendDot className="bg-rose-300 border-rose-500" label="Missed" />
          <LegendDot className="bg-purple-300 border-purple-500" label="On Call" />
          <span className="ml-auto flex items-center gap-1">
            <GripVertical className="h-3.5 w-3.5" /> Drag any block to reschedule or reassign
          </span>
        </div>
      </div>
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
  onPointerDown,
}: {
  shift: Shift;
  selected: boolean;
  ghost?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
}) {
  const left = shift.start * PX_PER_HOUR;
  const width = Math.max(40, (shift.end - shift.start) * PX_PER_HOUR);
  return (
    <div
      onPointerDown={onPointerDown}
      className={cn(
        "absolute top-1 bottom-1 rounded-sm border px-1.5 py-0.5 cursor-grab active:cursor-grabbing overflow-hidden text-[10px] leading-tight shadow-sm",
        statusStyles(shift.status),
        selected && "ring-2 ring-primary ring-offset-1",
        ghost && "opacity-60 ring-2 ring-primary"
      )}
      style={{ left, width }}
      title={`${shift.client} • ${fmtTime(shift.start)}–${fmtTime(shift.end)} • ${shift.service}`}
    >
      <div className="font-semibold truncate">
        {shift.client} <span className="opacity-70 font-normal">{fmtTime(shift.start)}</span>
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
