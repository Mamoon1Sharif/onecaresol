import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronLeft, ChevronRight, Printer, Calendar as CalendarIcon, Pill,
} from "lucide-react";
import { addMonths, endOfMonth, format, isToday, startOfMonth } from "date-fns";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type CareReceiver = Tables<"care_receivers">;

interface Props {
  cr: CareReceiver;
}

type Status = "completed" | "partial" | "incomplete" | "missed" | "future" | "multiple" | "self";

interface MarEntry {
  medication: string;
  dose: string;
  selfAdminister: boolean;
  /** Map of "yyyy-MM-dd-HH:mm" -> {status, code?} */
  schedule: Record<string, { time: string; status: Status; code?: string; initials?: string }>;
  times: string[];      // e.g. ["08:00", "12:00", "20:00"]
  carePlanChanges?: string[]; // dates "yyyy-MM-dd"
}

// =================== DEMO DATA ===================
function demoEntries(monthStart: Date): MarEntry[] {
  // Build a realistic-looking month of dummy data
  const days = endOfMonth(monthStart).getDate();
  const fmt = (d: number) => format(new Date(monthStart.getFullYear(), monthStart.getMonth(), d), "yyyy-MM-dd");

  const buildSchedule = (
    times: string[],
    pattern: (day: number, time: string) => { status: Status; code?: string; initials?: string }
  ) => {
    const out: MarEntry["schedule"] = {};
    for (let day = 1; day <= days; day++) {
      for (const t of times) {
        out[`${fmt(day)}-${t}`] = { time: t, ...pattern(day, t) };
      }
    }
    return out;
  };

  return [
    {
      medication: "Paracetamol 500mg",
      dose: "Take 2 tablets",
      selfAdminister: false,
      times: ["08:00", "14:00", "20:00"],
      carePlanChanges: [fmt(8)],
      schedule: buildSchedule(["08:00", "14:00", "20:00"], (day, t) => {
        if (day > new Date().getDate() && monthStart.getMonth() === new Date().getMonth()) return { status: "future" };
        if (day === 4 && t === "14:00") return { status: "missed" };
        if (day === 7 && t === "08:00") return { status: "partial", code: "1", initials: "DG" };
        if (day === 11) return { status: "incomplete", initials: "KL" };
        if (day === 15 && t === "20:00") return { status: "multiple" };
        return { status: "completed", initials: "DG" };
      }),
    },
    {
      medication: "Atorvastatin 20mg",
      dose: "Take 1 tablet at night",
      selfAdminister: false,
      times: ["20:00"],
      schedule: buildSchedule(["20:00"], (day) => {
        if (day > new Date().getDate() && monthStart.getMonth() === new Date().getMonth()) return { status: "future" };
        if (day === 9) return { status: "missed" };
        if (day === 18) return { status: "partial", code: "5", initials: "CH" };
        return { status: "completed", initials: "CH" };
      }),
    },
    {
      medication: "Vitamin D 1000IU",
      dose: "1 capsule",
      selfAdminister: true,
      times: ["09:00"],
      schedule: buildSchedule(["09:00"], () => ({ status: "self" })),
    },
    {
      medication: "Metformin 500mg",
      dose: "Take with breakfast & dinner",
      selfAdminister: false,
      times: ["08:00", "18:00"],
      carePlanChanges: [fmt(20)],
      schedule: buildSchedule(["08:00", "18:00"], (day, t) => {
        if (day > new Date().getDate() && monthStart.getMonth() === new Date().getMonth()) return { status: "future" };
        if (day === 6 && t === "18:00") return { status: "missed" };
        if (day === 13) return { status: "incomplete", initials: "DG" };
        if (day === 22 && t === "08:00") return { status: "partial", code: "8", initials: "KL" };
        return { status: "completed", initials: "KL" };
      }),
    },
  ];
}

// =================== STATUS BADGE ===================
const STATUS_STYLES: Record<Status, { bg: string; ring: string; label: string }> = {
  completed:  { bg: "bg-emerald-500", ring: "ring-emerald-700", label: "Task completed (employee initials/reason code)" },
  partial:    { bg: "bg-amber-400",   ring: "ring-amber-600",   label: "Task partially completed (reason code)" },
  incomplete: { bg: "bg-rose-500",    ring: "ring-rose-700",    label: "Task incomplete (employee initials)" },
  missed:     { bg: "bg-rose-300",    ring: "ring-rose-500",    label: "Task missed" },
  future:     { bg: "bg-muted",       ring: "ring-border",      label: "Task to be completed in the future" },
  multiple:   { bg: "bg-sky-500",     ring: "ring-sky-700",     label: "Multiple task records (see care notes)" },
  self:       { bg: "bg-muted-foreground/40", ring: "ring-muted-foreground/60", label: "Self-administered" },
};

const REASON_CODES: { code: string; label: string }[] = [
  { code: "1", label: "Refused, will retry" },
  { code: "2", label: "Refused, will not be retried" },
  { code: "3", label: "Refused" },
  { code: "4", label: "Nausea or Vomiting" },
  { code: "5", label: "Hospitalised" },
  { code: "6", label: "Social Leave" },
  { code: "7", label: "Refused and Destroyed" },
  { code: "8", label: "Dose not available" },
  { code: "9", label: "Customer cancelled" },
  { code: "10", label: "Customer not available" },
  { code: "11", label: "Task already completed" },
  { code: "12", label: "Not Required" },
  { code: "13", label: "Other" },
];

function StatusDot({ entry, dayDate, time }: { entry: MarEntry; dayDate: Date; time: string }) {
  const key = `${format(dayDate, "yyyy-MM-dd")}-${time}`;
  const cell = entry.schedule[key];
  if (!cell) return <div className="h-7 w-7" />;
  const style = STATUS_STYLES[cell.status];
  const inner = cell.status === "partial"
    ? cell.code
    : cell.status === "self"
    ? "X"
    : cell.status === "multiple"
    ? "•••"
    : cell.status === "future"
    ? ""
    : cell.initials || "XX";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`h-7 w-7 rounded-full ${style.bg} ring-1 ${style.ring} flex items-center justify-center text-[9px] font-bold text-white hover:scale-110 transition-transform`}
          title={style.label}
        >
          {inner}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-xs space-y-1">
        <div className="font-semibold">{entry.medication}</div>
        <div className="text-muted-foreground">{entry.dose}</div>
        <div className="flex justify-between border-t pt-1">
          <span>{format(dayDate, "EEE dd MMM yyyy")} • {time}</span>
        </div>
        <div>Status: <span className="font-medium">{style.label}</span></div>
        {cell.code && <div>Reason: <span className="font-medium">{REASON_CODES.find((r) => r.code === cell.code)?.label}</span></div>}
        {cell.initials && <div>By: <span className="font-medium">{cell.initials}</span></div>}
      </PopoverContent>
    </Popover>
  );
}

// =================== MAIN ===================
export function MarChartTab({ cr }: Props) {
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()));
  const [hideSelf, setHideSelf] = useState(false);
  const [view, setView] = useState<"chart" | "empty">("chart");

  const entries = useMemo(() => demoEntries(monthStart), [monthStart]);
  const visibleEntries = useMemo(() => hideSelf ? entries.filter((e) => !e.selfAdminister) : entries, [entries, hideSelf]);

  const days = useMemo(() => {
    const total = endOfMonth(monthStart).getDate();
    return Array.from({ length: total }, (_, i) => new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1));
  }, [monthStart]);

  const periodLabel = `${format(monthStart, "EEE MMM dd yyyy")} - ${format(endOfMonth(monthStart), "EEE MMM dd yyyy")}`;

  const handlePrint = () => {
    toast.success("Preparing MAR chart for print");
    setTimeout(() => window.print(), 200);
  };

  return (
    <Card className="border border-border shadow-sm overflow-hidden p-0">
      {/* Patient strip */}
      <div className="bg-card border-b px-4 py-3 flex items-center gap-4 flex-wrap">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold uppercase text-muted-foreground">
          {cr.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{cr.name}</span>
            <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded uppercase tracking-wide">{cr.care_status || "Active"}</span>
          </div>
          <div className="text-xs text-muted-foreground">Tel: {cr.phone_number || "—"} · DOB: {cr.dob ? format(new Date(cr.dob), "dd/MM/yyyy") : "—"}</div>
          <div className="text-xs text-muted-foreground">{cr.address || "—"}</div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={handlePrint}
        >
          <Printer className="h-3.5 w-3.5" /> Print
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-background border-b px-4 py-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-3 gap-y-1 text-xs">
          <div className="text-muted-foreground font-semibold">DOB</div>
          <div className="font-medium">{cr.dob ? format(new Date(cr.dob), "dd/MM/yyyy") : "—"}</div>
          <div className="text-muted-foreground font-semibold">Address</div>
          <div className="font-medium">{cr.address || "—"}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => setMonthStart((d) => startOfMonth(addMonths(d, -1)))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-3 py-1.5 text-xs font-semibold rounded bg-muted border min-w-[260px] text-center">
              {periodLabel}
            </div>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => setMonthStart((d) => startOfMonth(addMonths(d, 1)))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer text-muted-foreground">
            <Checkbox checked={hideSelf} onCheckedChange={(v) => setHideSelf(!!v)} />
            Hide self-administer medications
          </label>
        </div>
      </div>

      {/* Secondary toolbar: view mode + jump */}
      <div className="bg-muted/40 border-b px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">View:</span>
          <Select value={view} onValueChange={(v) => setView(v as "chart" | "empty")}>
            <SelectTrigger className="h-7 w-[180px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="chart">MAR Chart (with data)</SelectItem>
              <SelectItem value="empty">Empty period</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{visibleEntries.length} medication{visibleEntries.length !== 1 ? "s" : ""} for this period</span>
        </div>
      </div>

      {/* Chart body */}
      <div className="px-4 py-4 bg-background">
        {view === "empty" || visibleEntries.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-16">
            No medication data for the selected period
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header row: day numbers */}
              <div className="grid" style={{ gridTemplateColumns: `260px 90px repeat(${days.length}, minmax(34px, 1fr))` }}>
                <div className="px-2 py-2 text-[11px] font-semibold text-muted-foreground border-b">Medication</div>
                <div className="px-2 py-2 text-[11px] font-semibold text-muted-foreground border-b">Time</div>
                {days.map((d) => {
                  const today = isToday(d);
                  return (
                    <div
                      key={d.toISOString()}
                      className={`px-1 py-2 text-[10px] font-semibold text-center border-b ${
                        today ? "bg-amber-50 text-amber-900" : "text-muted-foreground"
                      }`}
                    >
                      <div>{format(d, "EEEEE")}</div>
                      <div className="text-foreground font-bold">{format(d, "d")}</div>
                    </div>
                  );
                })}
              </div>

              {/* Rows */}
              {visibleEntries.map((entry) => (
                entry.times.map((t, ti) => (
                  <div
                    key={`${entry.medication}-${t}`}
                    className="grid items-center border-b last:border-b-0 hover:bg-muted/20"
                    style={{ gridTemplateColumns: `260px 90px repeat(${days.length}, minmax(34px, 1fr))` }}
                  >
                    {ti === 0 ? (
                      <div className="px-2 py-2" style={{ gridRow: `span ${entry.times.length}` }}>
                        <div className="flex items-start gap-1.5">
                          <Pill className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">{entry.medication}</div>
                            <div className="text-[10px] text-muted-foreground">{entry.dose}</div>
                            {entry.selfAdminister && (
                              <div className="text-[9px] text-muted-foreground italic mt-0.5">Self-administered</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {ti !== 0 && <div className="hidden" />}
                    <div className="px-2 py-2 text-[11px] font-medium text-muted-foreground">{t}</div>
                    {days.map((d) => {
                      const dateStr = format(d, "yyyy-MM-dd");
                      const isCarePlanDay = entry.carePlanChanges?.includes(dateStr);
                      const today = isToday(d);
                      return (
                        <div
                          key={d.toISOString()}
                          className={`flex items-center justify-center px-0.5 py-1 ${
                            today ? "bg-amber-50" : isCarePlanDay ? "bg-rose-50" : ""
                          }`}
                        >
                          <StatusDot entry={entry} dayDate={d} time={t} />
                        </div>
                      );
                    })}
                  </div>
                ))
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-4 border-t bg-muted/20 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px]">
          {(["completed", "partial", "incomplete", "missed", "future", "multiple"] as Status[]).map((s) => {
            const style = STATUS_STYLES[s];
            const inner = s === "completed" ? "XX" : s === "partial" ? "1" : s === "incomplete" ? "XX" : s === "multiple" ? "•••" : "";
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full ${style.bg} ring-1 ${style.ring} flex items-center justify-center text-[9px] font-bold text-white`}>
                  {inner}
                </div>
                <span className="text-foreground">{style.label}</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px]">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-muted-foreground/40 ring-1 ring-muted-foreground/60 flex items-center justify-center text-[9px] font-bold text-white">X</div>
            <span className="text-foreground">This medication is self-administered. Any schedule shown indicates the prescribed time for when the medication should be taken.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-8 bg-accent border border-accent/50" />
            <span>Current date</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-8 bg-muted border border-border" />
            <span>Care Plan change on day</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Reason Code:</span>
          {REASON_CODES.map((r, i) => (
            <span key={r.code}>
              <span className="font-semibold text-foreground">{r.code}:</span> {r.label}
              {i < REASON_CODES.length - 1 && <span className="text-border"> ·</span>}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
