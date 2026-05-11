import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { RosterViewSwitcher } from "@/components/RosterViewSwitcher";
import { useDailyVisitsRange } from "@/hooks/use-care-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const statusColors: Record<string, string> = {
  Confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  Due: "bg-sky-100 text-sky-800 border-sky-200",
  Cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  Completed: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const cells: Date[] = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }

  return cells;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatVisitTime(visit: any) {
  const hour = Number(visit.start_hour ?? 0);
  const minute = Number(visit.start_minute ?? 0);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatVisitEndTime(visit: any) {
  const startHour = Number(visit.start_hour ?? 0);
  const startMinute = Number(visit.start_minute ?? 0);
  const durationMins = Number(visit.duration_minutes ?? Number(visit.duration ?? 0) * 60);
  const total = startHour * 60 + startMinute + durationMins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function MonthlyRoster() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState<Date | null>(null);

  const cells = useMemo(() => getMonthGrid(cursor.year, cursor.month), [cursor]);
  const monthStart = useMemo(() => new Date(cursor.year, cursor.month, 1), [cursor]);
  const monthEnd = useMemo(() => new Date(cursor.year, cursor.month + 1, 0), [cursor]);
  const { data: visits = [] } = useDailyVisitsRange(dateKey(monthStart), dateKey(monthEnd));

  const monthLabel = monthStart.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  const visitsForCell = (d: Date) => {
    const key = dateKey(d);
    return visits.filter((v: any) => v.visit_date === key);
  };

  const goPrev = () =>
    setCursor((c) => {
      const m = c.month - 1;
      return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m };
    });

  const goNext = () =>
    setCursor((c) => {
      const m = c.month + 1;
      return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m };
    });

  const goToday = () => {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const selectedDayVisits = selected ? visitsForCell(selected) : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Roster</h1>
            <p className="text-sm text-muted-foreground mt-1">Monthly overview of caregiver shifts</p>
          </div>
          <RosterViewSwitcher />
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarDays className="h-4 w-4 text-primary" />
            {monthLabel}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={goToday}>Today</Button>
            <Button variant="outline" size="icon" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="border border-border shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 bg-muted/50 border-b">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-center py-2 text-xs font-semibold text-muted-foreground border-r last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[110px]">
            {cells.map((d, i) => {
              const inMonth = d.getMonth() === cursor.month;
              const cellVisits = inMonth ? visitsForCell(d) : [];

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(d)}
                  className={`text-left p-1.5 border-r border-b last:border-r-0 transition-colors hover:bg-muted/40 ${
                    inMonth ? "bg-card" : "bg-muted/20 text-muted-foreground/60"
                  } ${isToday(d) ? "ring-2 ring-inset ring-primary" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${isToday(d) ? "text-primary" : ""}`}>
                      {d.getDate()}
                    </span>
                    {cellVisits.length > 0 && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                        {cellVisits.length}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {cellVisits.slice(0, 2).map((v: any) => (
                      <div
                        key={v.id}
                        className={`text-[9px] rounded px-1 py-0.5 truncate border ${
                          statusColors[v.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {formatVisitTime(v)} {(v.care_givers as any)?.name?.split(" ")[0] ?? "Unassigned"}
                      </div>
                    ))}
                    {cellVisits.length > 2 && (
                      <div className="text-[9px] text-muted-foreground">
                        +{cellVisits.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selected?.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {selectedDayVisits.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No shifts scheduled for this day.
              </p>
            )}
            {selectedDayVisits.map((v: any) => (
              <div
                key={v.id}
                className={`rounded-md border p-3 text-sm ${
                  statusColors[v.status] ?? ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {(v.care_givers as any)?.name ?? "Unassigned"}
                  </span>
                  <Badge variant="outline" className="text-[10px] border-current">
                    {v.status ?? "Visit"}
                  </Badge>
                </div>
                <div className="text-xs mt-1 opacity-80">
                  To {(v.care_receivers as any)?.name ?? "Unknown service member"}
                </div>
                <div className="text-xs mt-1 opacity-80">
                  {formatVisitTime(v)} - {formatVisitEndTime(v)}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
