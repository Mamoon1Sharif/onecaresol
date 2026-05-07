import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Activity, AlertCircle, CalendarRange, CheckCircle2, ChevronDown, ChevronUp,
  Clock, Filter, Hand, MapPin, Pill, Search, Sparkles, TrendingUp, User, XCircle,
} from "lucide-react";
import { addDays, differenceInMinutes, format, isToday, isYesterday, parseISO, startOfDay, subDays } from "date-fns";

// =============== TYPES ===============
type EventCategory = "visit" | "medication";
type EventStatus =
  | "completed" | "missed" | "in_progress" | "late"
  | "given" | "refused" | "missed_med" | "partial";

interface TimelineEvent {
  id: string;
  category: EventCategory;
  status: EventStatus;
  member: string;
  memberId: string;
  caregiver?: string;
  title: string;
  subtitle?: string;
  startsAt: string;     // ISO
  endsAt?: string;      // ISO
  durationMin?: number;
  location?: string;
  notes?: string;
  // Visit-specific
  taskCount?: number;
  tasksCompleted?: number;
  // Medication-specific
  medication?: string;
  dose?: string;
  reasonCode?: string;
}

// =============== SEED ===============
const MEMBERS = [
  { id: "m1", name: "Mr Edward Allenby" },
  { id: "m2", name: "Mrs Mary Anderson" },
  { id: "m3", name: "Mr John Smith" },
];
const CAREGIVERS = ["David Goliby", "Karren Lupton", "Christina Hyde", "Sana Arshad"];
const VISIT_TYPES = ["Morning Visit", "Lunch Visit", "Tea Visit", "Bed Time Visit", "Medication Stock Check"];
const MEDS = [
  { name: "Paracetamol 500mg", dose: "2 tablets" },
  { name: "Atorvastatin 20mg", dose: "1 tablet" },
  { name: "Metformin 500mg", dose: "1 tablet with food" },
  { name: "Vitamin D 1000IU", dose: "1 capsule" },
  { name: "Amlodipine 5mg", dose: "1 tablet" },
];

function buildSeed(): TimelineEvent[] {
  const out: TimelineEvent[] = [];
  const now = new Date();

  for (let i = 0; i < 14; i++) {
    const day = subDays(startOfDay(now), i);

    // 3-4 visits per day
    const visitCount = 3 + (i % 2);
    for (let v = 0; v < visitCount; v++) {
      const cg = CAREGIVERS[(i + v) % CAREGIVERS.length];
      const m = MEMBERS[(i + v) % MEMBERS.length];
      const vtype = VISIT_TYPES[v % VISIT_TYPES.length];
      const startHour = [7, 12, 17, 21][v % 4];
      const startMin = (i * 7 + v * 3) % 30;
      const start = new Date(day);
      start.setHours(startHour, startMin, 0, 0);
      const dur = 25 + ((i + v) % 4) * 5;
      const end = new Date(start.getTime() + dur * 60_000);

      // status mix
      const r = (i * 3 + v) % 9;
      let status: EventStatus = "completed";
      if (r === 1) status = "late";
      else if (r === 4) status = "missed";
      else if (r === 6 && i === 0) status = "in_progress";

      const taskCount = 8 + ((i + v) % 6);
      const tasksCompleted =
        status === "missed" ? 0 :
        status === "in_progress" ? Math.floor(taskCount / 2) :
        status === "late" ? taskCount - 1 :
        taskCount;

      out.push({
        id: `v-${i}-${v}`,
        category: "visit",
        status,
        member: m.name,
        memberId: m.id,
        caregiver: cg,
        title: vtype,
        subtitle: `${dur} min`,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        durationMin: dur,
        location: "14 Raven Drive, Rotherham",
        taskCount,
        tasksCompleted,
        notes: status === "missed"
          ? "Caregiver did not check in. Office contacted family."
          : status === "late"
          ? "Arrived 12 minutes late due to traffic. All tasks completed."
          : "All scheduled tasks completed without issues.",
      });
    }

    // 2-3 medication events per day
    const medCount = 2 + (i % 2);
    for (let mi = 0; mi < medCount; mi++) {
      const m = MEMBERS[(i + mi) % MEMBERS.length];
      const med = MEDS[(i + mi) % MEDS.length];
      const cg = CAREGIVERS[(i + mi + 1) % CAREGIVERS.length];
      const start = new Date(day);
      start.setHours([8, 14, 20][mi % 3], (mi * 11) % 30, 0, 0);

      const r = (i + mi * 2) % 7;
      let status: EventStatus = "given";
      let reason: string | undefined;
      if (r === 2) { status = "refused"; reason = "Refused, will retry"; }
      else if (r === 4) { status = "missed_med"; }
      else if (r === 5) { status = "partial"; reason = "Partially taken"; }

      out.push({
        id: `m-${i}-${mi}`,
        category: "medication",
        status,
        member: m.name,
        memberId: m.id,
        caregiver: cg,
        title: med.name,
        subtitle: med.dose,
        startsAt: start.toISOString(),
        medication: med.name,
        dose: med.dose,
        reasonCode: reason,
        notes: status === "given"
          ? "Administered as prescribed."
          : status === "refused"
          ? "Service user declined the dose. Will retry next visit."
          : status === "missed_med"
          ? "Missed dose — added to handover."
          : "Half dose accepted; remainder noted in care notes.",
      });
    }
  }

  return out.sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));
}

// =============== STYLE HELPERS ===============
const statusMeta: Record<
  EventStatus,
  { label: string; ring: string; pill: string; icon: typeof CheckCircle2 }
> = {
  completed:   { label: "Completed",     ring: "ring-emerald-500", pill: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle2 },
  late:        { label: "Late",          ring: "ring-amber-500",   pill: "bg-amber-100 text-amber-900 border-amber-300",      icon: Clock },
  in_progress: { label: "In progress",   ring: "ring-sky-500",     pill: "bg-sky-100 text-sky-800 border-sky-300",            icon: Activity },
  missed:      { label: "Missed",        ring: "ring-rose-500",    pill: "bg-rose-100 text-rose-800 border-rose-300",         icon: XCircle },
  given:       { label: "Given",         ring: "ring-emerald-500", pill: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle2 },
  refused:     { label: "Refused",       ring: "ring-rose-500",    pill: "bg-rose-100 text-rose-800 border-rose-300",         icon: XCircle },
  missed_med:  { label: "Missed dose",   ring: "ring-rose-500",    pill: "bg-rose-100 text-rose-800 border-rose-300",         icon: AlertCircle },
  partial:     { label: "Partial",       ring: "ring-amber-500",   pill: "bg-amber-100 text-amber-900 border-amber-300",      icon: AlertCircle },
};

function dayLabel(d: Date) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, dd MMM yyyy");
}

// =============== MAIN ===============
const Timeline = () => {
  const [events] = useState<TimelineEvent[]>(() => buildSeed());
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | EventCategory>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rangeDays, setRangeDays] = useState<number>(14);
  const [openEvent, setOpenEvent] = useState<TimelineEvent | null>(null);
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});

  // Filter
  const filtered = useMemo(() => {
    const cutoff = subDays(startOfDay(new Date()), rangeDays);
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (new Date(e.startsAt) < cutoff) return false;
      if (memberFilter !== "all" && e.memberId !== memberFilter) return false;
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (q && !`${e.title} ${e.member} ${e.caregiver ?? ""} ${e.notes ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, rangeDays, memberFilter, categoryFilter, statusFilter, search]);

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const e of filtered) {
      const key = format(parseISO(e.startsAt), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      date: parseISO(key),
      items: items.sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt)),
    }));
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    const visits = filtered.filter((e) => e.category === "visit");
    const meds = filtered.filter((e) => e.category === "medication");
    const visitOk = visits.filter((e) => e.status === "completed").length;
    const visitMissed = visits.filter((e) => e.status === "missed").length;
    const medsGiven = meds.filter((e) => e.status === "given").length;
    const medsIssue = meds.filter((e) => ["refused", "missed_med", "partial"].includes(e.status)).length;
    const completionRate = visits.length ? Math.round((visitOk / visits.length) * 100) : 0;
    return { visits: visits.length, meds: meds.length, visitOk, visitMissed, medsGiven, medsIssue, completionRate };
  }, [filtered]);

  const toggleDay = (key: string) =>
    setCollapsedDays((p) => ({ ...p, [key]: !p[key] }));

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Timeline
            </h1>
            <p className="text-sm text-muted-foreground">
              Unified feed of care visits and medication events across all service members.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(rangeDays)} onValueChange={(v) => setRangeDays(Number(v))}>
              <SelectTrigger className="h-9 w-[160px]">
                <CalendarRange className="h-3.5 w-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 days</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Hand} label="Care visits" value={stats.visits} accent="text-primary" />
          <StatCard icon={CheckCircle2} label="Visits completed" value={stats.visitOk} accent="text-emerald-600" />
          <StatCard icon={XCircle} label="Visits missed" value={stats.visitMissed} accent="text-rose-600" />
          <StatCard icon={Pill} label="Meds given" value={stats.medsGiven} accent="text-emerald-600" />
          <StatCard icon={TrendingUp} label="Completion" value={`${stats.completionRate}%`} accent="text-sky-600" />
        </div>

        {/* Filters */}
        <Card className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_160px_160px] gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search title, member, caregiver, or notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="h-9"><User className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All service members</SelectItem>
                {MEMBERS.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
              <SelectTrigger className="h-9"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All event types</SelectItem>
                <SelectItem value="visit">Care visits only</SelectItem>
                <SelectItem value="medication">Medication only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="given">Given</SelectItem>
                <SelectItem value="refused">Refused</SelectItem>
                <SelectItem value="missed_med">Missed dose</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Feed */}
        {grouped.length === 0 ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            No events match the current filters. Try widening the date range or clearing filters.
          </Card>
        ) : (
          <div className="relative">
            {/* The vertical rail */}
            <div className="absolute left-[88px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-border to-transparent hidden md:block" />

            <div className="space-y-6">
              {grouped.map(({ key, date, items }) => {
                const collapsed = collapsedDays[key];
                return (
                  <section key={key} className="relative">
                    {/* Sticky day header */}
                    <div className="sticky top-0 z-10 -mx-2 px-2 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="md:ml-[64px] inline-flex items-center gap-2">
                          <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow">
                            {format(date, "dd")}
                          </div>
                          <div className="leading-tight">
                            <div className="text-sm font-semibold">{dayLabel(date)}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {items.length} event{items.length === 1 ? "" : "s"} · {format(date, "EEE")}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => toggleDay(key)}>
                        {collapsed ? <><ChevronDown className="h-3.5 w-3.5" /> Expand</> : <><ChevronUp className="h-3.5 w-3.5" /> Collapse</>}
                      </Button>
                    </div>

                    {!collapsed && (
                      <div className="mt-3 space-y-2.5">
                        {items.map((e) => (
                          <EventRow key={e.id} event={e} onClick={() => setOpenEvent(e)} />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!openEvent} onOpenChange={(o) => !o && setOpenEvent(null)}>
        <DialogContent className="max-w-lg">
          {openEvent && <EventDetail e={openEvent} />}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

// =============== ROW ===============
function EventRow({ event, onClick }: { event: TimelineEvent; onClick: () => void }) {
  const meta = statusMeta[event.status];
  const Icon = event.category === "visit" ? Hand : Pill;
  const time = format(parseISO(event.startsAt), "HH:mm");
  const endTime = event.endsAt ? format(parseISO(event.endsAt), "HH:mm") : null;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left grid grid-cols-[80px_36px_1fr] gap-3 items-stretch hover:bg-muted/30 rounded-lg px-2 py-2 transition"
    >
      {/* Time column */}
      <div className="text-right text-xs text-muted-foreground pt-1">
        <div className="font-semibold text-foreground">{time}</div>
        {endTime && <div className="text-[10px]">{endTime}</div>}
      </div>

      {/* Bullet on rail */}
      <div className="relative">
        <div className={`absolute left-1/2 -translate-x-1/2 top-2 h-7 w-7 rounded-full bg-background border-2 ring-2 ${meta.ring} border-background flex items-center justify-center group-hover:scale-110 transition`}>
          <Icon className="h-3.5 w-3.5 text-foreground" />
        </div>
      </div>

      {/* Card */}
      <Card className="p-3 hover:shadow-md transition">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{event.title}</span>
              <Badge variant="outline" className={`text-[10px] ${meta.pill}`}>
                <meta.icon className="h-3 w-3 mr-1" /> {meta.label}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {event.category === "visit" ? "Visit" : "Medication"}
              </Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {event.member}</span>
              {event.caregiver && (
                <span className="inline-flex items-center gap-1"><Hand className="h-3 w-3" /> {event.caregiver}</span>
              )}
              {event.location && event.category === "visit" && (
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
              )}
              {event.subtitle && (
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {event.subtitle}</span>
              )}
            </div>
          </div>

          {/* Right-hand mini stat */}
          {event.category === "visit" && typeof event.taskCount === "number" && (
            <div className="text-right text-[11px] text-muted-foreground">
              <div className="font-semibold text-foreground">
                {event.tasksCompleted}/{event.taskCount}
              </div>
              <div>tasks</div>
            </div>
          )}
        </div>
      </Card>
    </button>
  );
}

// =============== STAT CARD ===============
function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Hand; label: string; value: string | number; accent: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2.5">
        <div className={`h-9 w-9 rounded-md bg-muted flex items-center justify-center ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="text-lg font-bold">{value}</div>
        </div>
      </div>
    </Card>
  );
}

// =============== DETAIL DIALOG ===============
function EventDetail({ e }: { e: TimelineEvent }) {
  const meta = statusMeta[e.status];
  const start = parseISO(e.startsAt);
  const end = e.endsAt ? parseISO(e.endsAt) : null;
  const dur = end ? differenceInMinutes(end, start) : e.durationMin;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          {e.category === "visit" ? <Hand className="h-4 w-4 text-primary" /> : <Pill className="h-4 w-4 text-primary" />}
          {e.title}
          <Badge variant="outline" className={`text-[10px] ml-1 ${meta.pill}`}>
            <meta.icon className="h-3 w-3 mr-1" /> {meta.label}
          </Badge>
        </DialogTitle>
      </DialogHeader>
      <ScrollArea className="max-h-[60vh] pr-3">
        <div className="space-y-3 text-sm">
          <Row label="When">
            {format(start, "EEEE, dd MMM yyyy 'at' HH:mm")}
            {end && <> — {format(end, "HH:mm")}</>}
            {dur && <span className="text-muted-foreground"> · {dur} min</span>}
          </Row>
          <Row label="Service user">{e.member}</Row>
          {e.caregiver && <Row label="Caregiver">{e.caregiver}</Row>}
          {e.category === "visit" && (
            <>
              {e.location && <Row label="Location">{e.location}</Row>}
              {typeof e.taskCount === "number" && (
                <Row label="Tasks">
                  <span className="font-semibold">{e.tasksCompleted}/{e.taskCount}</span> completed
                </Row>
              )}
            </>
          )}
          {e.category === "medication" && (
            <>
              {e.medication && <Row label="Medication">{e.medication}</Row>}
              {e.dose && <Row label="Dose">{e.dose}</Row>}
              {e.reasonCode && <Row label="Reason">{e.reasonCode}</Row>}
            </>
          )}
          {e.notes && (
            <div className="pt-2 border-t">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Notes</div>
              <p className="text-sm leading-relaxed">{e.notes}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground pt-0.5">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export default Timeline;
