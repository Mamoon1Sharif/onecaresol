import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { RosterViewSwitcher } from "@/components/RosterViewSwitcher";
import { useShifts } from "@/hooks/use-care-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const shiftTypeColors: Record<string, string> = {
  Morning: "bg-amber-100 text-amber-800 border-amber-200",
  Afternoon: "bg-sky-100 text-sky-800 border-sky-200",
  Night: "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Live-in": "bg-emerald-100 text-emerald-800 border-emerald-200",
};

function getMonthGrid(year: number, month: number) {
  // month is 0-indexed
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // make Monday the first column
  const start = new Date(year, month, 1 - offset);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

export default function MonthlyRoster() {
  const { data: shifts = [] } = useShifts();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState<Date | null>(null);

  const cells = useMemo(() => getMonthGrid(cursor.year, cursor.month), [cursor]);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  // Map shifts to days in this month — shift.day is 0..6 (Mon..Sun)
  const shiftsForCell = (d: Date) => {
    const dow = (d.getDay() + 6) % 7; // Mon=0
    return shifts.filter((s) => s.day === dow);
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

  const selectedDayShifts = selected ? shiftsForCell(selected) : [];

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
              const cellShifts = inMonth ? shiftsForCell(d) : [];
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
                    {cellShifts.length > 0 && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                        {cellShifts.length}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {cellShifts.slice(0, 2).map((s) => (
                      <div
                        key={s.id}
                        className={`text-[9px] rounded px-1 py-0.5 truncate border ${
                          shiftTypeColors[s.shift_type] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.start_time} {(s.care_givers as any)?.name?.split(" ")[0] ?? "—"}
                      </div>
                    ))}
                    {cellShifts.length > 2 && (
                      <div className="text-[9px] text-muted-foreground">
                        +{cellShifts.length - 2} more
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
            {selectedDayShifts.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No shifts scheduled for this day.
              </p>
            )}
            {selectedDayShifts.map((s) => (
              <div
                key={s.id}
                className={`rounded-md border p-3 text-sm ${
                  shiftTypeColors[s.shift_type] ?? ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {(s.care_givers as any)?.name ?? "Unassigned"}
                  </span>
                  <Badge variant="outline" className="text-[10px] border-current">
                    {s.shift_type}
                  </Badge>
                </div>
                <div className="text-xs mt-1 opacity-80">
                  → {(s.care_receivers as any)?.name ?? "—"}
                </div>
                <div className="text-xs mt-1 opacity-80">
                  {s.start_time} – {s.end_time}
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
