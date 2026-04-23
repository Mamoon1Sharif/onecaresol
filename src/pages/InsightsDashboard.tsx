import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Filter, Sparkles, PencilLine, RefreshCw,
  Maximize2, MoreHorizontal, Search, Calendar as CalendarIcon, Info,
  AlertTriangle, FileWarning, TrendingDown, TrendingUp, Download, Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RTooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { PassDashboardView } from "@/components/insights/PassDashboardView";

// ─────────────────────────────────────────────────────────────────────
// Helpers / dummy data
// ─────────────────────────────────────────────────────────────────────
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const ROW_LABELS = ["M 26/04", "T 26/04", "W 26/04", "T 26/04", "F 26/04", "S 26/04", "S 26/04"];
const HOURS = Array.from({ length: 25 }, (_, i) => i);

function seededHeatmap(seed: number, hot = false) {
  // simple deterministic pseudo-random pattern
  return ROW_LABELS.map((_, r) =>
    HOURS.map((_, h) => {
      const x = Math.sin((r + 1) * (h + 1) * seed) * 10000;
      const v = x - Math.floor(x);
      if (hot && h >= 8 && h <= 18 && v > 0.35) return v > 0.7 ? "high" : "mid";
      if (v > 0.85) return "high";
      if (v > 0.55) return "mid";
      if (v > 0.25) return "low";
      return "none";
    })
  );
}

const heatColors: Record<string, string> = {
  none: "bg-emerald-100/70 dark:bg-emerald-900/20",
  low: "bg-emerald-200 dark:bg-emerald-800/40",
  mid: "bg-rose-200/80 dark:bg-rose-800/40",
  high: "bg-rose-400/80 dark:bg-rose-600/60",
};

const punctData = [
  { d: "21/04", manual: 5, late: 8, overstay: 12, deficit: 22, early: 8, undertime: 5 },
  { d: "22/04", manual: 6, late: 14, overstay: 18, deficit: 30, early: 10, undertime: 6 },
  { d: "23/04", manual: 7, late: 22, overstay: 24, deficit: 35, early: 12, undertime: 8 },
  { d: "24/04", manual: 8, late: 18, overstay: 22, deficit: 28, early: 14, undertime: 10 },
  { d: "25/04", manual: 5, late: 8, overstay: 14, deficit: 18, early: 6, undertime: 4 },
  { d: "26/04", manual: 2, late: 3, overstay: 4, deficit: 5, early: 2, undertime: 1 },
];

const punctTable = [
  { name: "Sienna…", done: "100%", early: "0%", late: "0%", under: "0%", over: "0%", manual: "100%" },
  { name: "Cla…", done: "100%", early: "85.7%", late: "0%", under: "33.3%", over: "0%", manual: "100%" },
  { name: "Sue…", done: "87.7%", early: "74.6%", late: "0%", under: "0%", over: "0%", manual: "100%" },
  { name: "Fati…", done: "85.3%", early: "85.7%", late: "8.7%", under: "60%", over: "0%", manual: "100%" },
  { name: "Shiv…", done: "85.7%", early: "0%", late: "57.1%", under: "71.4%", over: "14.2%", manual: "100%" },
  { name: "Jes…", done: "77.5%", early: "44.4%", late: "7.4%", under: "44.4%", over: "11.1%", manual: "100%" },
  { name: "Chri…", done: "75.5%", early: "55.6%", late: "0%", under: "55.5%", over: "0%", manual: "100%" },
  { name: "Don…", done: "73.7%", early: "0.1%", late: "45.5%", under: "15.2%", over: "0.1%", manual: "100%" },
];

const requiredHoursTable = [
  { unc: -8.75, period: "Fri 01:00 – 11:00", visits: 8.75, avail: 0, abs: 0 },
  { unc: -8.5, period: "Thu 11:00 – 17:00", visits: 5.5, avail: 0, abs: 0 },
  { unc: -8.5, period: "Fri 11:00 – 17:00", visits: 5.5, avail: 0, abs: 0 },
  { unc: -5.42, period: "Thu 06:00 – 09:00", visits: 5.42, avail: 0, abs: 0 },
  { unc: -5.33, period: "Wed 11:00 – 12:00", visits: 5.33, avail: 0, abs: 0 },
  { unc: -5.17, period: "Mon 06:00 – 09:00", visits: 5.17, avail: 0, abs: 0 },
  { unc: -5.17, period: "Tue 11:00 – 12:00", visits: 5.17, avail: 0, abs: 0 },
];

const pendingAllocationTable = [
  { time: 12, customer: "Andr…", visits: "Cm…", time2: "We…", time3: 5, dur: 4 },
  { time: 10.5, customer: "Don…", visits: "Bed…", time2: "We…", time3: 0.75, dur: 14 },
  { time: 10.5, customer: "Lan…", visits: "1c1…", time2: "We…", time3: 0.75, dur: 12 },
  { time: 9, customer: "Lan…", visits: "Mor…", time2: "We…", time3: 0.75, dur: 12 },
  { time: 9, customer: "Cas…", visits: "Mor…", time2: "We…", time3: 0.5, dur: 14 },
  { time: 8, customer: "Adn…", visits: "Bed…", time2: "We…", time3: 0.5, dur: 5 },
  { time: 8, customer: "Don…", visits: "Bed…", time2: "We…", time3: 0.5, dur: 5 },
];

const visitsDonut = [
  { name: "Support", value: 12, color: "hsl(var(--muted-foreground))" },
  { name: "Complete (partial)", value: 28, color: "hsl(var(--warning))" },
  { name: "In progress", value: 18, color: "hsl(var(--info))" },
  { name: "Complete", value: 142, color: "hsl(var(--success))" },
];

const tasksDonut = [
  { name: "Partial", value: 36, color: "hsl(var(--warning))" },
  { name: "Complete", value: 264, color: "hsl(var(--success))" },
];

const operations = [
  { label: "Assessments in progress", value: 0 },
  { label: "Employee supervisions completed", value: 0 },
  { label: "Bookings", value: 738 },
  { label: "Assessments completed", value: 0 },
  { label: "Documents due for review", value: 0 },
  { label: "New enquiries", value: 0 },
  { label: "New customers", value: 0 },
  { label: "Customer reviews completed", value: 0 },
];

// ─────────────────────────────────────────────────────────────────────
// Reusable widget header
// ─────────────────────────────────────────────────────────────────────
function WidgetHeader({
  title,
  subtitle,
  right,
  onRefresh,
  onExpand,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onRefresh?: () => void;
  onExpand?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 border-b">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[13px] font-semibold text-foreground truncate">{title}</h3>
          {subtitle && (
            <span className="text-[11px] text-muted-foreground truncate">{subtitle}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {right}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => {
            onRefresh?.();
            toast.success("Widget refreshed");
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => {
            onExpand?.();
            toast.info("Expanded view (demo)");
          }}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => toast.success("Exported to CSV")}>
              <Download className="h-3.5 w-3.5 mr-2" /> Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success("Snapshot saved")}>
              <Eye className="h-3.5 w-3.5 mr-2" /> View snapshot
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Settings opened (demo)")}>
              <PencilLine className="h-3.5 w-3.5 mr-2" /> Configure
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// KPI card
// ─────────────────────────────────────────────────────────────────────
function KpiCard({
  title, value, deltaText, deltaTone, isAlert = false,
}: {
  title: string;
  value: string;
  deltaText?: string;
  deltaTone?: "good" | "bad";
  isAlert?: boolean;
}) {
  return (
    <Card className={`relative overflow-hidden ${isAlert ? "bg-destructive/10 border-destructive/30" : ""}`}>
      <WidgetHeader title={title} />
      <div className="px-4 py-5 flex items-center justify-center">
        <div className="text-4xl font-semibold tracking-tight text-foreground">{value}</div>
      </div>
      {deltaText && (
        <div className="px-4 pb-3 -mt-2">
          <div className={`flex items-center gap-1.5 text-[11px] ${
            deltaTone === "bad" ? "text-destructive" : "text-success"
          }`}>
            {deltaTone === "bad" ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            <span>{deltaText}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Heatmap
// ─────────────────────────────────────────────────────────────────────
function Heatmap({ seed, hot = false }: { seed: number; hot?: boolean }) {
  const grid = useMemo(() => seededHeatmap(seed, hot), [seed, hot]);
  return (
    <div className="px-4 pt-3 pb-1 overflow-x-auto">
      <div className="min-w-[680px]">
        <div className="flex items-center pl-12 mb-1">
          {HOURS.filter((h) => h % 6 === 0).map((h) => (
            <div key={h} className="flex-1 text-[10px] text-muted-foreground">{h}</div>
          ))}
          <div className="text-[10px] text-muted-foreground w-6 text-right">25</div>
        </div>
        <div className="space-y-[3px]">
          {grid.map((row, ri) => (
            <div key={ri} className="flex items-center gap-1">
              <div className="w-12 text-[10px] text-muted-foreground tabular-nums">
                {ROW_LABELS[ri]}
              </div>
              <div className="flex-1 grid grid-cols-25 gap-[2px]" style={{ gridTemplateColumns: "repeat(25, minmax(0, 1fr))" }}>
                {row.map((cell, ci) => (
                  <button
                    key={ci}
                    type="button"
                    onClick={() => toast.info(`${ROW_LABELS[ri]} • ${ci}:00 (${cell})`)}
                    className={`h-4 rounded-[2px] transition-transform hover:scale-110 ${heatColors[cell]}`}
                    aria-label={`${ROW_LABELS[ri]} ${ci}:00`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 pl-12">
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
            <input type="checkbox" className="h-3 w-3 accent-primary" />
            Highlight uncovered
          </label>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Tiny pagination
// ─────────────────────────────────────────────────────────────────────
function Pager({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-end gap-2 px-4 py-2 text-[11px] text-muted-foreground border-t">
      <span>Page Size:</span>
      <Select defaultValue="10">
        <SelectTrigger className="h-6 w-14 text-[11px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="25">25</SelectItem>
          <SelectItem value="50">50</SelectItem>
        </SelectContent>
      </Select>
      <span>1 to 10 of {total}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toast.info("Previous")}>
        <ChevronLeft className="h-3 w-3" />
      </Button>
      <span>Page 1 of {Math.max(1, Math.ceil(total / 10))}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toast.info("Next")}>
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────
export default function InsightsDashboard() {
  const [view, setView] = useState<"insights" | "pass">("insights");
  const [period, setPeriod] = useState("weekly");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ care: true, office: true, urgent: false });

  if (view === "pass") {
    return (
      <AppLayout>
        <PassDashboardView onBack={() => setView("insights")} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-3">
        {/* Top toolbar */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <h1 className="text-base font-semibold text-foreground">
            Care 4U Care Limited dashboard
          </h1>

          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => toast.info("Previous week")}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Mon 20 Apr – Sun 26 Apr
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 text-xs">
                Pick a date range (demo). Use the chevrons to navigate.
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => toast.info("Next week")}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                  <Filter className="h-3.5 w-3.5" /> Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Show</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={filters.care}
                  onCheckedChange={(v) => setFilters((f) => ({ ...f, care: !!v }))}
                >Care</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.office}
                  onCheckedChange={(v) => setFilters((f) => ({ ...f, office: !!v }))}
                >Office</DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={filters.urgent}
                  onCheckedChange={(v) => setFilters((f) => ({ ...f, urgent: !!v }))}
                >Urgent only</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => toast.info("How to read this dashboard")}
            >
              <Info className="h-3.5 w-3.5" />
            </Button>

            <div className="h-6 w-px bg-border" />

            {/* View switcher */}
            <Tabs value={view} onValueChange={(v) => setView(v as "insights" | "pass")}>
              <TabsList className="h-8">
                <TabsTrigger value="insights" className="text-xs gap-1.5">
                  <Sparkles className="h-3 w-3" /> Insights
                </TabsTrigger>
                <TabsTrigger value="pass" className="text-xs gap-1.5">
                  <PencilLine className="h-3 w-3" /> Pass version
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => toast.success("Edit mode enabled (demo)")}
            >
              <PencilLine className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        </div>

        {/* Top KPI row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <KpiCard
            title="Average travel time"
            value="6.7%"
            deltaText="6.5% below threshold"
            deltaTone="good"
          />
          <KpiCard
            title="Average punctuality deficit"
            value="75.1%"
            deltaText="38.1% above threshold"
            deltaTone="bad"
          />
          <KpiCard
            title="Cancelled visit hours"
            value="16"
            deltaText="1500 next 7 days"
            deltaTone="good"
          />
          <KpiCard
            title="Overdue and missed visits"
            value="27 / 15"
            deltaText="4.5% below threshold"
            deltaTone="bad"
            isAlert
          />
        </div>

        {/* Required hours + Journal + Alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <Card className="overflow-hidden">
            <WidgetHeader
              title="Required hours"
              subtitle="(436.5 hours / 773 visits)"
              right={
                <Badge variant="secondary" className="text-[10px] h-5">
                  Updated as of 17:18 ago
                </Badge>
              }
            />
            <Heatmap seed={3} hot />
            <div className="px-4 pb-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">Unc…</TableHead>
                    <TableHead className="text-[10px]">Period</TableHead>
                    <TableHead className="text-[10px] text-right">Visits</TableHead>
                    <TableHead className="text-[10px] text-right">Avail…</TableHead>
                    <TableHead className="text-[10px] text-right">Abs…</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requiredHoursTable.map((r, i) => (
                    <TableRow
                      key={i}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => toast.info(`Open period ${r.period}`)}
                    >
                      <TableCell className="text-[11px] text-destructive font-medium">{r.unc}</TableCell>
                      <TableCell className="text-[11px]">{r.period}</TableCell>
                      <TableCell className="text-[11px] text-right">{r.visits}</TableCell>
                      <TableCell className="text-[11px] text-right">{r.avail}</TableCell>
                      <TableCell className="text-[11px] text-right">{r.abs}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pager total={17} />
          </Card>

          <Card className="overflow-hidden xl:col-span-1">
            <WidgetHeader title="Journal" />
            <div className="px-4 pt-3 pb-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="h-8 pl-7 text-xs"
                />
              </div>
              <Tabs defaultValue="all">
                <TabsList className="h-7">
                  <TabsTrigger value="all" className="text-[11px] px-2">All <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">0</Badge></TabsTrigger>
                  <TabsTrigger value="me" className="text-[11px] px-2">Created by me <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">0</Badge></TabsTrigger>
                  <TabsTrigger value="ass" className="text-[11px] px-2">Assigned to me <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">0</Badge></TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="px-4 py-16 text-center text-xs text-muted-foreground">
              No journal items to display within the selected date range
            </div>
          </Card>

          <Card className="overflow-hidden">
            <WidgetHeader
              title="Alerts"
              right={
                <Tabs defaultValue="care">
                  <TabsList className="h-7">
                    <TabsTrigger value="care" className="text-[11px] px-2">
                      Care <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">0</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="office" className="text-[11px] px-2">
                      Office <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">0</Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              }
            />
            <div className="px-4 py-6 space-y-3">
              <button
                onClick={() => toast.warning("View alerts page")}
                className="w-full flex items-center gap-3 rounded-md bg-warning/15 hover:bg-warning/25 transition-colors p-3 text-left"
              >
                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground">300 active alerts</div>
                  <div className="text-[10px] text-muted-foreground">Tap to review</div>
                </div>
              </button>
              <button
                onClick={() => toast.warning("View alerts page")}
                className="w-full flex items-center gap-3 rounded-md bg-warning/15 hover:bg-warning/25 transition-colors p-3 text-left"
              >
                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground">156 unresolved</div>
                  <div className="text-[10px] text-muted-foreground">Tap to review</div>
                </div>
              </button>

              <p className="text-[11px] text-muted-foreground text-center pt-2">
                No urgent alerts for today.<br />
                Go to the alerts page for a full list of alerts.
              </p>
            </div>
            <div className="border-t" />
            <div className="px-4 py-4">
              <h4 className="text-[11px] font-semibold text-foreground mb-2">Document Alerts</h4>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <FileWarning className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-[11px] text-muted-foreground">No data available</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Hours pending allocation + Punctuality */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <Card className="overflow-hidden">
            <WidgetHeader
              title="Hours pending allocation"
              subtitle="(203.75 hours / 268 visits)"
              right={
                <Badge variant="secondary" className="text-[10px] h-5">
                  Updated as of 17:18 ago
                </Badge>
              }
            />
            <Heatmap seed={5} />
            <div className="px-4 pb-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">T…</TableHead>
                    <TableHead className="text-[10px]">Cust…</TableHead>
                    <TableHead className="text-[10px]">Visit…</TableHead>
                    <TableHead className="text-[10px]">Tim…</TableHead>
                    <TableHead className="text-[10px] text-right">Visit…</TableHead>
                    <TableHead className="text-[10px] text-right">Dura…</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingAllocationTable.map((r, i) => (
                    <TableRow
                      key={i}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => toast.info(`Open visit ${r.customer}`)}
                    >
                      <TableCell className="text-[11px] font-medium">{r.time}</TableCell>
                      <TableCell className="text-[11px]">{r.customer}</TableCell>
                      <TableCell className="text-[11px]">{r.visits}</TableCell>
                      <TableCell className="text-[11px]">{r.time2}</TableCell>
                      <TableCell className="text-[11px] text-right">{r.time3}</TableCell>
                      <TableCell className="text-[11px] text-right">{r.dur}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pager total={64} />
          </Card>

          <Card className="overflow-hidden xl:col-span-2">
            <WidgetHeader
              title="Punctuality per employee"
              right={
                <Badge variant="secondary" className="text-[10px] h-5">
                  Updated as of 17:18 ago
                </Badge>
              }
            />
            <div className="px-2 pt-3 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={punctData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={28} />
                  <RTooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      fontSize: 11,
                      borderRadius: 6,
                    }}
                  />
                  <Area type="monotone" dataKey="manual" stackId="1" stroke="hsl(var(--muted-foreground))" fill="url(#g1)" />
                  <Area type="monotone" dataKey="late" stackId="1" stroke="hsl(var(--warning))" fill="url(#g2)" />
                  <Area type="monotone" dataKey="overstay" stackId="1" stroke="hsl(var(--destructive))" fill="url(#g3)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="px-4 pt-1 pb-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
              {[
                ["Manual", "muted-foreground"],
                ["Late", "warning"],
                ["Overstay", "destructive"],
                ["Deficit", "info"],
                ["Early", "success"],
                ["Undertime", "primary"],
              ].map(([l, c]) => (
                <span key={l} className="inline-flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-sm bg-${c}`} /> {l}
                </span>
              ))}
            </div>
            <div className="px-4 pb-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">Emp…</TableHead>
                    <TableHead className="text-[10px] text-right">D…</TableHead>
                    <TableHead className="text-[10px] text-right">Earl…</TableHead>
                    <TableHead className="text-[10px] text-right">Late…</TableHead>
                    <TableHead className="text-[10px] text-right">Und…</TableHead>
                    <TableHead className="text-[10px] text-right">Over…</TableHead>
                    <TableHead className="text-[10px] text-right">Man…</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {punctTable.map((r, i) => (
                    <TableRow
                      key={i}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => toast.info(`Open employee ${r.name}`)}
                    >
                      <TableCell className="text-[11px] font-medium">{r.name}</TableCell>
                      <TableCell className="text-[11px] text-right">{r.done}</TableCell>
                      <TableCell className="text-[11px] text-right">{r.early}</TableCell>
                      <TableCell className="text-[11px] text-right">{r.late}</TableCell>
                      <TableCell className="text-[11px] text-right">{r.under}</TableCell>
                      <TableCell className="text-[11px] text-right">{r.over}</TableCell>
                      <TableCell className="text-[11px] text-right">{r.manual}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pager total={16} />
          </Card>
        </div>

        {/* Bottom row: Visits, Tasks, Operations */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <Card className="overflow-hidden">
            <WidgetHeader title="Visits" />
            <div className="h-56 px-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visitsDonut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    onClick={(d: any) => toast.info(`${d.name}: ${d.value}`)}
                  >
                    {visitsDonut.map((d, i) => (
                      <Cell key={i} fill={d.color} className="cursor-pointer" />
                    ))}
                  </Pie>
                  <RTooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      fontSize: 11,
                      borderRadius: 6,
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <WidgetHeader title="Tasks" />
            <div className="h-56 px-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasksDonut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    onClick={(d: any) => toast.info(`${d.name}: ${d.value}`)}
                  >
                    {tasksDonut.map((d, i) => (
                      <Cell key={i} fill={d.color} className="cursor-pointer" />
                    ))}
                  </Pie>
                  <RTooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      fontSize: 11,
                      borderRadius: 6,
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <WidgetHeader title="Operations" />
            <div className="divide-y">
              {operations.map((o) => (
                <button
                  key={o.label}
                  onClick={() => toast.info(`${o.label}: ${o.value}`)}
                  className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-muted/40 transition-colors"
                >
                  <span className="text-[11px] text-foreground">{o.label}</span>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] tabular-nums ${
                      o.value > 0 ? "bg-primary/15 text-primary" : ""
                    }`}
                  >
                    {o.value}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
