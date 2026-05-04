import { useMemo, useState } from "react";
import { useDailyVisits } from "@/hooks/use-care-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft, ChevronRight, CalendarDays, Clock,
  CheckCircle2, XCircle, AlertCircle, Search, Timer,
  ClipboardList, Hourglass, User, CalendarIcon,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type CareReceiver = Tables<"care_receivers">;

const statusConfig: Record<string, { icon: typeof CheckCircle2; bg: string; text: string; label: string }> = {
  Complete:      { icon: CheckCircle2, bg: "bg-success/10", text: "text-success", label: "Complete" },
  Completed:     { icon: CheckCircle2, bg: "bg-success/10", text: "text-success", label: "Complete" },
  "In Progress": { icon: Timer, bg: "bg-warning/10", text: "text-warning", label: "In Progress" },
  Pending:       { icon: Clock, bg: "bg-muted", text: "text-muted-foreground", label: "Pending" },
  Cancelled:     { icon: XCircle, bg: "bg-destructive/10", text: "text-destructive", label: "Cancelled" },
  Due:           { icon: AlertCircle, bg: "bg-info/10", text: "text-info", label: "Due" },
};

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const fmtMins = (m: number) => {
  const h = Math.floor(m / 60);
  const mins = Math.round(m % 60);
  return `${String(h).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export function ReceiverRotaTab({ cr }: { cr: CareReceiver }) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dateStr = useMemo(() => toDateStr(selectedDate), [selectedDate]);
  const { data: dailyVisits = [] } = useDailyVisits(dateStr);

  const currentDate = selectedDate;
  const today = new Date();
  const isToday = isSameDay(currentDate, today);

  const shiftDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  const myVisits = useMemo(
    () => dailyVisits.filter((v) => v.care_receiver_id === cr.id),
    [dailyVisits, cr.id]
  );

  const filteredVisits = useMemo(() => {
    if (!search) return myVisits;
    const q = search.toLowerCase();
    return myVisits.filter((v) =>
      (v.care_givers as any)?.name?.toLowerCase().includes(q) ||
      v.status?.toLowerCase().includes(q)
    );
  }, [myVisits, search]);

  const scheduledMinutes = myVisits.reduce((sum, v) => sum + (v.duration ?? 0) * 60, 0);
  const completedCount = myVisits.filter((v) => v.status === "Completed" || v.status === "Complete").length;
  const inProgressCount = myVisits.filter((v) => v.status === "In Progress").length;
  const dueCount = myVisits.filter((v) => v.status === "Due" || v.status === "Pending").length;

  return (
    <div className="space-y-5">
      <Card className="border border-border">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDayOffset((o) => o - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-semibold text-primary">
                {currentDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDayOffset((o) => o + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              {dayOffset !== 0 && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDayOffset(0)}>Today</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border border-border"><CardContent className="py-3 px-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><ClipboardList className="h-4 w-4 text-primary" /></div>
          <div><p className="text-lg font-bold leading-none">{myVisits.length}</p><p className="text-[10px] text-muted-foreground uppercase mt-0.5">Total</p></div>
        </CardContent></Card>
        <Card className="border border-border"><CardContent className="py-3 px-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-success" /></div>
          <div><p className="text-lg font-bold text-success leading-none">{completedCount}</p><p className="text-[10px] text-muted-foreground uppercase mt-0.5">Complete</p></div>
        </CardContent></Card>
        <Card className="border border-border"><CardContent className="py-3 px-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center"><Timer className="h-4 w-4 text-warning" /></div>
          <div><p className="text-lg font-bold text-warning leading-none">{inProgressCount}</p><p className="text-[10px] text-muted-foreground uppercase mt-0.5">In Progress</p></div>
        </CardContent></Card>
        <Card className="border border-border"><CardContent className="py-3 px-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center"><AlertCircle className="h-4 w-4 text-info" /></div>
          <div><p className="text-lg font-bold text-info leading-none">{dueCount}</p><p className="text-[10px] text-muted-foreground uppercase mt-0.5">Due</p></div>
        </CardContent></Card>
        <Card className="border border-border"><CardContent className="py-3 px-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Hourglass className="h-4 w-4 text-primary" /></div>
          <div><p className="text-lg font-bold leading-none">{fmtMins(scheduledMinutes)}</p><p className="text-[10px] text-muted-foreground uppercase mt-0.5">Sched Hrs</p></div>
        </CardContent></Card>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by caregiver or status..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Badge variant="outline" className="text-xs px-2.5 py-1">
          {filteredVisits.length} visit{filteredVisits.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <Card className="border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Care Giver</TableHead>
                <TableHead className="font-semibold text-center">Sched Start</TableHead>
                <TableHead className="font-semibold text-center">Sched End</TableHead>
                <TableHead className="font-semibold text-center">Duration</TableHead>
                <TableHead className="font-semibold text-center">Check In</TableHead>
                <TableHead className="font-semibold text-center">Check Out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                    <div className="flex flex-col items-center gap-2">
                      <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
                      <p>No visits scheduled for this day</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {filteredVisits.map((v) => {
                const st = statusConfig[v.status] ?? statusConfig.Pending;
                const StIcon = st.icon;
                const schedEnd = `${String(v.start_hour + v.duration).padStart(2, "0")}:00`;
                return (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                        <StIcon className="h-3.5 w-3.5" />
                        {st.label}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        {(v.care_givers as any)?.name ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">{String(v.start_hour).padStart(2, "0")}:00</TableCell>
                    <TableCell className="text-center font-mono text-sm">{schedEnd}</TableCell>
                    <TableCell className="text-center font-mono text-sm">{String(v.duration).padStart(2, "0")}:00</TableCell>
                    <TableCell className="text-center font-mono text-sm">{fmtTime(v.check_in_time)}</TableCell>
                    <TableCell className="text-center font-mono text-sm">{fmtTime(v.check_out_time)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <Separator />
        <div className="flex items-center gap-6 px-4 py-3 bg-muted/20 text-sm">
          <div className="flex items-center gap-2">
            <Hourglass className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Sched Hrs:</span>
            <span className="font-semibold font-mono">{fmtMins(scheduledMinutes)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
