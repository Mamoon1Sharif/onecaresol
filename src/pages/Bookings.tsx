import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft, ChevronRight, Filter, Link2, Search, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useCareReceivers, useCareGivers } from "@/hooks/use-care-data";

// ─────────────────────────────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────────────────────────────
type BookingStatus = "COMPLETED" | "STARTED" | "SCHEDULED";

interface BookingChip {
  id: string;
  receiverId: string;
  dayIso: string; // yyyy-mm-dd
  start: string;  // HH:mm
  end: string;    // HH:mm
  carers: string[];
  status: BookingStatus;
  linked?: boolean;
  shadow?: string; // e.g. "↳ Shivani Shivani"
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfWeekThu(offsetWeeks: number): Date {
  // Screenshot starts on Thursday — anchor to nearest past Thursday + offset weeks
  const now = new Date();
  const dow = now.getDay(); // Sun=0…Sat=6
  // shift so Thu=0
  const diff = (dow - 4 + 7) % 7;
  const thu = new Date(now);
  thu.setHours(0, 0, 0, 0);
  thu.setDate(now.getDate() - diff + offsetWeeks * 7);
  return thu;
}

function fmtDayHeader(d: Date): { dow: string; ord: string } {
  const dow = d.toLocaleDateString("en-GB", { weekday: "short" });
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" :
    day % 10 === 2 && day !== 12 ? "nd" :
    day % 10 === 3 && day !== 13 ? "rd" : "th";
  return { dow, ord: `${dow} ${day}${suffix}` };
}

function fmtRange(d1: Date, d7: Date) {
  const a = d1.toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const b = d7.toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  return `${a} - ${b}`;
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────
// Dummy data generation — deterministic per receiver/day
// ─────────────────────────────────────────────────────────────────────
const CARER_POOL = [
  "David Golby", "Christine Hyde", "Dominique Glossop", "Adele Jackson",
  "Patricia Howell", "Christine Jowett", "Emily Smith", "Jessica Sharp",
  "Karen Lupton", "Sue Smith", "Stephanie Young", "Shivani Shivani",
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function buildDummyBookings(
  receivers: { id: string; name: string }[],
  weekDates: Date[],
): BookingChip[] {
  const out: BookingChip[] = [];
  receivers.forEach((r, ri) => {
    weekDates.forEach((d, di) => {
      const seed = hashStr(`${r.id}-${isoDay(d)}-${ri}-${di}`);
      // Guarantee 1-3 visits/day so the grid is never empty
      const visitsToday = 1 + (seed % 3);
      const today = new Date();
      const isPast = d < new Date(today.toDateString());
      const isToday = isoDay(d) === isoDay(today);
      for (let i = 0; i < visitsToday; i++) {
        const slot = (seed >> (i * 3)) & 0b111;
        const baseHour = [7, 8, 9, 12, 15, 16, 18, 19][slot];
        const startMin = ((seed >> (i + 2)) % 60);
        const durMin = 30 + ((seed >> (i + 4)) % 90);
        const startD = new Date(d);
        startD.setHours(baseHour, startMin, 0, 0);
        const endD = new Date(startD.getTime() + durMin * 60_000);
        const carerCount = 1 + ((seed >> i) & 1);
        const carers: string[] = [];
        for (let c = 0; c < carerCount; c++) {
          carers.push(CARER_POOL[(seed >> (c + i * 2)) % CARER_POOL.length]);
        }
        const linked = ((seed >> (i + 5)) & 1) === 1 && carerCount > 1;
        const shadow = linked ? `↳ ${CARER_POOL[(seed >> 7) % CARER_POOL.length]}` : undefined;

        let status: BookingStatus = "SCHEDULED";
        if (isPast) status = "COMPLETED";
        else if (isToday && baseHour < new Date().getHours()) status = "STARTED";

        out.push({
          id: `${r.id}-${di}-${i}`,
          receiverId: r.id,
          dayIso: isoDay(d),
          start: `${String(startD.getHours()).padStart(2, "0")}:${String(startD.getMinutes()).padStart(2, "0")}`,
          end: `${String(endD.getHours()).padStart(2, "0")}:${String(endD.getMinutes()).padStart(2, "0")}`,
          carers,
          status,
          linked,
          shadow,
        });
      }
    });
  });
  return out.sort((a, b) => a.start.localeCompare(b.start));
}

// Fallback receivers if DB is empty
const FALLBACK_RECEIVERS = [
  { id: "fb-1", name: "Allonby, Edward" },
  { id: "fb-2", name: "Anderson, Mary" },
  { id: "fb-3", name: "Athey, Karen" },
  { id: "fb-4", name: "Blackburn, Michael" },
  { id: "fb-5", name: "Brown, Sarah" },
  { id: "fb-6", name: "Carter, Joan" },
  { id: "fb-7", name: "Davies, Robert" },
  { id: "fb-8", name: "Edwards, Patricia" },
  { id: "fb-9", name: "Foster, Margaret" },
  { id: "fb-10", name: "Greene, William" },
  { id: "fb-11", name: "Harris, Elizabeth" },
  { id: "fb-12", name: "Jones, Thomas" },
];

// ─────────────────────────────────────────────────────────────────────
// Booking chip
// ─────────────────────────────────────────────────────────────────────
const statusBar: Record<BookingStatus, string> = {
  COMPLETED: "bg-success",
  STARTED: "bg-primary",
  SCHEDULED: "bg-muted-foreground/40",
};
const statusText: Record<BookingStatus, string> = {
  COMPLETED: "text-success",
  STARTED: "text-primary",
  SCHEDULED: "text-muted-foreground",
};
const statusBg: Record<BookingStatus, string> = {
  COMPLETED: "bg-success/10 hover:bg-success/15",
  STARTED: "bg-primary/10 hover:bg-primary/15",
  SCHEDULED: "bg-muted/40 hover:bg-muted/60",
};

function BookingCard({ b, onOpen }: { b: BookingChip; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative w-full text-left rounded-sm pl-2 pr-1.5 py-1 text-[10px] leading-tight transition-colors ${statusBg[b.status]}`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-0.5 ${statusBar[b.status]}`} />
      <div className="flex items-center justify-between gap-1">
        <span className="font-semibold text-foreground tabular-nums">
          {b.start}-{b.end}
        </span>
        {b.linked && <Link2 className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
      </div>
      <div className="space-y-0.5 mt-0.5">
        {b.carers.map((c, i) => (
          <div key={i} className="text-[10px] text-primary truncate">{c}</div>
        ))}
        {b.shadow && (
          <div className="text-[10px] text-muted-foreground truncate">{b.shadow}</div>
        )}
      </div>
      <div className={`text-[9px] font-bold tracking-wide mt-0.5 ${statusText[b.status]}`}>
        {b.status}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

export default function Bookings() {
  const { data: receivers = [] } = useCareReceivers();
  const { data: caregivers = [] } = useCareGivers();

  const [view, setView] = useState<"week" | "today">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [page, setPage] = useState(1);
  const [bookedOnly, setBookedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<BookingChip | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const weekStart = useMemo(() => startOfWeekThu(weekOffset), [weekOffset]);
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }),
    [weekStart],
  );

  const sortedReceivers = useMemo(() => {
    const list = receivers.length > 0
      ? receivers.map((r: any) => ({ id: r.id, name: r.name }))
      : FALLBACK_RECEIVERS;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [receivers]);

  const allBookings = useMemo(
    () => buildDummyBookings(sortedReceivers, weekDates),
    [sortedReceivers, weekDates],
  );

  const filteredReceivers = useMemo(() => {
    let list = sortedReceivers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }
    if (bookedOnly) {
      const booked = new Set(allBookings.map((b) => b.receiverId));
      list = list.filter((r) => booked.has(r.id));
    }
    return list;
  }, [sortedReceivers, allBookings, search, bookedOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredReceivers.length / PAGE_SIZE));
  const pageReceivers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredReceivers.slice(start, start + PAGE_SIZE);
  }, [filteredReceivers, page]);

  const todayIso = isoDay(new Date());
  const dayCols = view === "today" ? weekDates.filter((d) => isoDay(d) === todayIso) : weekDates;

  return (
    <AppLayout>
      <div className="space-y-3">
        {/* Top toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* View toggle (purple) */}
          <div className="inline-flex rounded-md overflow-hidden border bg-card">
            <button
              type="button"
              onClick={() => setView("week")}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                view === "week" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              }`}
              style={view === "week" ? { background: "hsl(265 70% 45%)" } : undefined}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setView("today")}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                view === "today" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              }`}
              style={view === "today" ? { background: "hsl(265 70% 45%)" } : undefined}
            >
              Today
            </button>
          </div>

          {/* Week navigation */}
          <div className="inline-flex items-center gap-1">
            <Button
              size="icon"
              className="h-8 w-8 rounded-md text-primary-foreground"
              style={{ background: "hsl(265 70% 45%)" }}
              onClick={() => setWeekOffset((w) => w - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 h-8 flex items-center text-xs font-medium text-primary-foreground rounded-md tabular-nums"
                 style={{ background: "hsl(265 70% 45%)" }}>
              {fmtRange(weekDates[0], weekDates[6])}
            </div>
            <Button
              size="icon"
              className="h-8 w-8 rounded-md text-primary-foreground"
              style={{ background: "hsl(265 70% 45%)" }}
              onClick={() => setWeekOffset((w) => w + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Booked / All */}
          <div className="inline-flex rounded-md overflow-hidden border bg-card">
            <button
              type="button"
              onClick={() => setBookedOnly(true)}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                bookedOnly ? "bg-success text-success-foreground" : "text-foreground hover:bg-muted"
              }`}
            >
              Booked only
            </button>
            <button
              type="button"
              onClick={() => setBookedOnly(false)}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                !bookedOnly ? "bg-success text-success-foreground" : "text-foreground hover:bg-muted"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Pagination chips + add */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 mx-auto">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              First
            </Button>
            {Array.from({ length: totalPages }).slice(0, 6).map((_, i) => {
              const n = i + 1;
              const active = page === n;
              return (
                <Button
                  key={n}
                  size="sm"
                  className={`h-7 w-7 p-0 text-xs ${active ? "text-primary-foreground" : ""}`}
                  variant={active ? "default" : "outline"}
                  style={active ? { background: "hsl(265 70% 45%)" } : undefined}
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              );
            })}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              Last
            </Button>
          </div>

          <Button
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setNewOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> New booking
          </Button>
        </div>

        {/* Calendar grid */}
        <div className="border rounded-md overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <div
              className="min-w-[1100px] grid"
              style={{
                gridTemplateColumns: `220px repeat(${dayCols.length}, minmax(140px, 1fr))`,
              }}
            >
              {/* Header row */}
              <div
                className="text-xs font-semibold text-primary-foreground p-3 border-r border-primary-foreground/20"
                style={{ background: "hsl(265 70% 30%)" }}
              >
                <div className="mb-2">Customer</div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder=""
                    className="h-7 pl-7 pr-7 text-[11px] bg-card text-foreground"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 inline-flex items-center justify-center rounded hover:bg-muted"
                        aria-label="Filter"
                      >
                        <Filter className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 text-xs">
                      <div className="space-y-2">
                        <div className="font-medium text-foreground">Filter customers</div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={bookedOnly}
                            onChange={(e) => setBookedOnly(e.target.checked)}
                          />
                          Only booked this week
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-full text-xs"
                          onClick={() => { setSearch(""); toast.success("Filters reset"); }}
                        >
                          Reset
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {dayCols.map((d) => {
                const h = fmtDayHeader(d);
                const isToday = isoDay(d) === todayIso;
                return (
                  <div
                    key={d.toISOString()}
                    className={`text-xs font-semibold text-primary-foreground p-3 border-r border-primary-foreground/20 ${
                      isToday ? "ring-2 ring-inset ring-warning" : ""
                    }`}
                    style={{ background: "hsl(265 70% 30%)" }}
                  >
                    {h.ord}
                  </div>
                );
              })}

              {/* Body rows */}
              {pageReceivers.length === 0 && (
                <div
                  className="col-span-full p-12 text-center text-sm text-muted-foreground"
                  style={{ gridColumn: `1 / span ${dayCols.length + 1}` }}
                >
                  No customers match the current filters.
                </div>
              )}

              {pageReceivers.map((r, ri) => (
                <RowFragment
                  key={r.id}
                  receiver={r}
                  dayCols={dayCols}
                  bookings={allBookings.filter((b) => b.receiverId === r.id)}
                  onOpen={(b) => setOpen(b)}
                  zebra={ri % 2 === 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground px-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" /> Completed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-blue-500" /> Started
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-slate-300" /> Scheduled
          </span>
          <span className="inline-flex items-center gap-1.5 ml-auto">
            <Link2 className="h-3 w-3" /> Linked / multi-carer visit
          </span>
        </div>
      </div>

      {/* Booking detail dialog */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Booking details</DialogTitle>
          </DialogHeader>
          {open && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase">Time</div>
                  <div className="font-medium tabular-nums">{open.start} – {open.end}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase">Date</div>
                  <div className="font-medium">{open.dayIso}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase">Status</div>
                  <div className={`font-semibold ${statusText[open.status]}`}>{open.status}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase">Customer</div>
                  <div className="font-medium">
                    {sortedReceivers.find((r) => r.id === open.receiverId)?.name}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase mb-1">Carers</div>
                <div className="space-y-1">
                  {open.carers.map((c, i) => (
                    <div key={i} className="text-primary">{c}</div>
                  ))}
                  {open.shadow && <div className="text-muted-foreground">{open.shadow}</div>}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>Close</Button>
            <Button onClick={() => { toast.success("Booking saved (demo)"); setOpen(null); }}>
              Edit booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New booking dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">New booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="space-y-1">
              <Label className="text-xs">Customer</Label>
              <Input placeholder="Search customer…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" defaultValue={isoDay(new Date())} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Carer</Label>
                <Input
                  placeholder="Assign carer"
                  list="carers-dl"
                />
                <datalist id="carers-dl">
                  {(caregivers.length ? caregivers.map((c: any) => c.name) : CARER_POOL).map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start</Label>
                <Input type="time" defaultValue="08:30" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End</Label>
                <Input type="time" defaultValue="09:00" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast.success("Booking created (demo)"); setNewOpen(false); }}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Row fragment
// ─────────────────────────────────────────────────────────────────────
function RowFragment({
  receiver, dayCols, bookings, onOpen, zebra,
}: {
  receiver: { id: string; name: string };
  dayCols: Date[];
  bookings: BookingChip[];
  onOpen: (b: BookingChip) => void;
  zebra: boolean;
}) {
  const bg = zebra ? "bg-muted/20" : "bg-card";
  return (
    <>
      <div className={`p-3 border-t border-r ${bg}`}>
        <button
          type="button"
          className="text-xs font-medium text-primary hover:underline text-left"
          onClick={() => toast.info(`Open profile: ${receiver.name}`)}
        >
          {receiver.name}
        </button>
      </div>
      {dayCols.map((d) => {
        const dayBookings = bookings.filter((b) => b.dayIso === isoDay(d));
        return (
          <div key={d.toISOString()} className={`p-1 border-t border-r space-y-1 align-top ${bg}`}>
            {dayBookings.map((b) => (
              <BookingCard key={b.id} b={b} onOpen={() => onOpen(b)} />
            ))}
          </div>
        );
      })}
    </>
  );
}
