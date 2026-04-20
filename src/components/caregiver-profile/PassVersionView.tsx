import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Printer, Plus, Calendar as CalendarIcon, Clock,
} from "lucide-react";
import { addDays, format, startOfWeek } from "date-fns";

interface Props {
  careGiverName?: string;
  receiverName?: string;
}

type TaskStatus = "done" | "missed" | "info";
interface Task { label: string; status: TaskStatus }
interface Visit {
  id: string;
  date: Date;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string;
  actualEnd: string;
  who: string;
  visitType: string;
  status: "COMPLETED" | "MISSED" | "IN_PROGRESS";
  reviewed: boolean;
  tasks: Task[];
}

// ====== DUMMY DATA ======
const CAREGIVERS = ["David Goliby", "Karren Lupton", "Christina Hyde"];
const VISIT_TYPES = [
  "Medication Stock Check Visit",
  "Bed Time Visit",
  "Morning Visit",
  "Lunch Visit",
  "Tea Visit",
];
const TASKS_POOL: Task[] = [
  { label: "General Information", status: "done" },
  { label: "Clear Via keysafe", status: "done" },
  { label: "PPE", status: "done" },
  { label: "Grace & Goin consent", status: "done" },
  { label: "Personal Care", status: "done" },
  { label: "Dry & Dress", status: "done" },
  { label: "Offer Breakfast meal & Drink", status: "done" },
  { label: "Skin Integrity", status: "info" },
  { label: "Oral Hygiene", status: "done" },
  { label: "Clean & Tidy", status: "done" },
  { label: "Medication Stock Check", status: "info" },
  { label: "Empty leg bag", status: "done" },
  { label: "Remove Night Bag and disposed appropriately", status: "done" },
  { label: "Check and Changed Pad", status: "done" },
  { label: "Ensure I have my hearing Aids on", status: "done" },
  { label: "Safe Exit", status: "done" },
  { label: "Snack & Drink", status: "missed" },
  { label: "Attach Night Bag", status: "done" },
];

function generateVisits(start: Date, count: number): Visit[] {
  const visits: Visit[] = [];
  for (let i = 0; i < count; i++) {
    const date = addDays(start, Math.floor(i / 2));
    const isMorning = i % 2 === 0;
    const cg = CAREGIVERS[i % CAREGIVERS.length];
    const vtype = isMorning ? VISIT_TYPES[2] : VISIT_TYPES[1];
    const scheduledStart = isMorning ? "06:30" : "18:30";
    const scheduledEnd = isMorning ? "06:55" : "18:55";
    const actualStart = isMorning ? `06:${30 + (i % 5)}` : `18:${21 + (i % 9)}`;
    const actualEnd = isMorning ? `06:${55 + (i % 4)}` : `18:${48 + (i % 9)}`;
    // Pick 10-16 tasks
    const tcount = 10 + (i % 7);
    const tasks = TASKS_POOL.slice(0, tcount).map((t, idx) => ({
      ...t,
      // randomly mark one as missed for variety
      status: idx === 1 && i % 3 === 1 ? "missed" : t.status,
    } as Task));
    visits.push({
      id: `v-${i}`,
      date,
      scheduledStart,
      scheduledEnd,
      actualStart,
      actualEnd,
      who: cg,
      visitType: vtype,
      status: "COMPLETED",
      reviewed: i % 4 !== 0,
      tasks,
    });
  }
  return visits;
}

const FILTER_OPTIONS = ["All", "Completed", "Missed", "In Progress"];
const VISIT_FILTER_OPTIONS = ["All", "Morning Visit", "Bed Time Visit", "Medication Stock Check Visit"];

export function PassVersionView({ careGiverName = "Mr Edward Allenby", receiverName }: Props) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 2 }));
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showMissed, setShowMissed] = useState(false);
  const [unreviewedOnly, setUnreviewedOnly] = useState(false);

  const visits = useMemo(() => generateVisits(weekStart, 14), [weekStart]);

  const filtered = useMemo(() => {
    return visits.filter((v) => {
      if (statusFilter !== "All" && v.status.toLowerCase() !== statusFilter.toLowerCase().replace(" ", "_")) {
        // simple match
      }
      if (typeFilter !== "All" && v.visitType !== typeFilter) return false;
      if (showMissed && !v.tasks.some((t) => t.status === "missed")) return false;
      if (unreviewedOnly && v.reviewed) return false;
      return true;
    });
  }, [visits, statusFilter, typeFilter, showMissed, unreviewedOnly]);

  const rangeLabel = `${format(weekStart, "EEE MMM d yyyy")} - ${format(addDays(weekStart, 6), "EEE MMM d yyyy")}`;

  const handlePrint = () => window.print();

  const taskColor = (s: TaskStatus) => {
    if (s === "done") return "bg-emerald-600 text-white border-emerald-700";
    if (s === "missed") return "bg-orange-500 text-white border-orange-600";
    return "bg-slate-200 text-slate-800 border-slate-300";
  };

  return (
    <Card className="border border-border shadow-sm overflow-hidden p-0">
      {/* Patient/Header strip */}
      <div className="bg-[hsl(280,55%,28%)] text-white px-4 py-3 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
          EA
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{careGiverName}</span>
            <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded uppercase tracking-wide">Active</span>
          </div>
          <div className="text-xs text-white/80">DOB: 29/04/1944</div>
          <div className="text-xs text-white/80">14, Raven Drive, Rotherham, S81 2UD</div>
        </div>
        <nav className="hidden lg:flex items-center gap-4 text-xs">
          {[
            "Dashboard","Care Management","Care Notes","MAR Chart","Timeline",
            "Documents","About Me","Details","Checklists","Rostering",
            "Communications","Medical History","Customer File","openPASS",
          ].map((n) => (
            <button
              key={n}
              className={`hover:text-white/100 ${n === "Care Notes" ? "text-white border-b-2 border-white pb-0.5 font-semibold" : "text-white/85"}`}
            >
              {n}
            </button>
          ))}
        </nav>
      </div>

      {/* Toolbar */}
      <div className="bg-background border-b px-4 py-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            onClick={() => setWeekStart((d) => addDays(d, -7))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <div className="px-3 py-1 text-xs font-semibold rounded border border-[hsl(280,55%,28%)] text-[hsl(280,55%,28%)] bg-[hsl(280,55%,96%)]">
            {rangeLabel}
          </div>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            onClick={() => setWeekStart((d) => addDays(d, 7))}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          <span className="ml-4 text-xs text-muted-foreground">Filter:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 w-[110px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-7 w-[180px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {VISIT_FILTER_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>

          <span className="ml-3 text-xs text-muted-foreground">Show:</span>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Checkbox checked={showMissed} onCheckedChange={(v) => setShowMissed(!!v)} />
            Missed
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <Checkbox checked={unreviewedOnly} onCheckedChange={(v) => setUnreviewedOnly(!!v)} />
            Unreviewed only
          </label>
        </div>

        <Button
          size="sm"
          className="h-7 gap-1.5 bg-[hsl(280,55%,28%)] hover:bg-[hsl(280,55%,22%)] text-white text-xs"
          onClick={handlePrint}
        >
          <Printer className="h-3.5 w-3.5" /> Print
        </Button>
      </div>

      {/* Table header */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          <div className="grid grid-cols-[140px_140px_110px_1fr] bg-[hsl(280,55%,28%)] text-white text-xs font-semibold">
            <div className="px-3 py-2">When</div>
            <div className="px-3 py-2">Who</div>
            <div className="px-3 py-2">Status</div>
            <div className="px-3 py-2 text-center border-l border-white/10">Visit</div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground bg-background">
              No visits match the current filters.
            </div>
          ) : (
            filtered.map((v, idx) => (
              <div
                key={v.id}
                className={`grid grid-cols-[140px_140px_110px_1fr] text-xs border-b border-border ${
                  idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                }`}
              >
                {/* When */}
                <div className="px-3 py-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-foreground">
                    <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{format(v.date, "dd MMM yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <Clock className="h-3 w-3" />
                    <span>{v.scheduledStart}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-orange-600">{v.actualStart}</span>
                  </div>
                </div>

                {/* Who */}
                <div className="px-3 py-3 text-foreground">{v.who}</div>

                {/* Status */}
                <div className="px-3 py-3">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-300 text-amber-900 border border-amber-400">
                    {v.status}
                  </span>
                </div>

                {/* Visit pills */}
                <div className="px-3 py-3 border-l border-border">
                  <div className="text-[11px] text-foreground font-medium mb-2">{v.visitType}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {v.tasks.map((t, i) => (
                      <button
                        key={i}
                        className={`px-2 py-1 text-[10px] font-semibold rounded border ${taskColor(t.status)} hover:opacity-90 transition`}
                        title={t.label}
                      >
                        ✓ {t.label}
                      </button>
                    ))}
                  </div>
                  <button className="mt-2 inline-flex items-center gap-1 text-[11px] text-info hover:underline">
                    <Plus className="h-3 w-3" /> Add review note
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
