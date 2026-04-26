import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import {
  Home, Calendar, Clock, Info, XCircle, ThumbsUp, Link2, Map, Users,
  AlertCircle, TrendingUp, FileText, Bell, PoundSterling, Camera,
  ListChecks, Tag, UserPlus, Briefcase, MessageSquare, Move,
  ArrowRight, User, CalendarRange, Lock, CalendarDays,
} from "lucide-react";
import { useCareReceivers, useCareGivers } from "@/hooks/use-care-data";

function IconCell({
  icon: Icon, label, className = "h-3.5 w-3.5 text-muted-foreground/70",
}: { icon: any; label: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center justify-center cursor-help">
          <Icon className={className} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

const FILTERS = [
  { value: "unallocated", label: "Show Unallocated" },
  { value: "cancelled", label: "Show Cancelled" },
  { value: "missing-clock", label: "Show Missing Clock In/Out" },
  { value: "double-booked", label: "Show Double Booked" },
  { value: "skill-mismatch", label: "Show Skill Mismatch" },
  { value: "all", label: "Show All Conflicts" },
];

const BULK_ACTIONS = [
  "Bulk Actions...",
  "Assign Team Member", "Reassign Visits", "Cancel Visits", "Activate Visits",
  "Reset Visits", "Delete Visits", "Add Rota Lock(s)", "Remove Rota Lock(s)",
  "Send Push Message", "Add Alerts", "Remove Alerts", "Edit Times",
  "Edit Duration", "Convert To Double Up", "Export",
];

const CALL_TYPES = [
  "WCC - Lunch Call (Z4-...", "WCC - Lunch Call (Z4-...", "WCC - Evening Call (...",
  "WCC - Morning Call (...", "Private Morning Call",
];

const SERVICE_USERS = [
  "Thomas Henderson - WR12 7BL", "Pamela Davis - WR9 8AB", "Wendy Rawlins - WR12 7QH",
  "Norman Heeks - WR8 9AD", "Roger Peberdy - WR9 8DE", "James Hamilton - CV37 8XH",
  "Winifred Griffiths - WR10 1AW", "Colin Evans - WR11 3JP", "Michael Taylor - WR12 7HT",
  "Joan Marchant - WR8 0HG", "Helen Heeks - WR8 9AD", "Peter Booth - WR11 2AA",
  "Edna Morris - WR12 7TT", "Lily Halpin - WR4 0PS", "Marion Poulter - WR11 2BB",
  "Dulcie Badham - WR1 1PP", "Carol Stevens - WR1 1QQ", "Patricia Barrett - WR9 8FG",
];

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB");
}

function makeRows(careReceivers: any[]) {
  // Build dummy conflicts list resembling the screenshot
  const today = new Date();
  const mk = (i: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + (i % 14) + 1);
    const isCancelled = i === 3 || i === 6;
    const startH = 7 + (i % 8);
    const startM = i % 2 === 0 ? 0 : 30;
    const durMin = [30, 45, 60, 15][i % 4];
    const endTotal = startH * 60 + startM + durMin;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    const fmt = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return {
      id: `cf-${i}`,
      ref: String(147039184 + i * 137),
      date: fmtDate(d),
      status: isCancelled ? "Cancelled" : "Due",
      isCancelled,
      serviceUser: SERVICE_USERS[i % SERVICE_USERS.length],
      start: fmt(startH, startM),
      end: fmt(endH, endM),
      duration: fmt(Math.floor(durMin / 60), durMin % 60),
      teamMember: "Unallocated",
      serviceCall: CALL_TYPES[i % CALL_TYPES.length],
      week: i % 9 === 7 ? "All Weeks" : "Week 2",
      weekNum: 18,
    };
  };
  return Array.from({ length: 26 }, (_, i) => mk(i));
}

const Conflicts = () => {
  const nav = useNavigate();
  const { data: careReceivers = [] } = useCareReceivers();
  const { data: careGivers = [] } = useCareGivers();

  const [filter, setFilter] = useState("unallocated");
  const [search, setSearch] = useState("");
  const [bulk, setBulk] = useState("Bulk Actions...");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const today = new Date();
  const future = new Date(today);
  future.setDate(today.getDate() + 21);
  const [fromDate, setFromDate] = useState<string>(today.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState<string>(future.toISOString().slice(0, 10));

  const allRows = useMemo(() => makeRows(careReceivers), [careReceivers]);

  const rows = useMemo(() => {
    return allRows.filter((r) => {
      if (filter === "cancelled" && !r.isCancelled) return false;
      if (filter === "unallocated" && r.teamMember !== "Unallocated") return false;
      if (search && !r.serviceUser.toLowerCase().includes(search.toLowerCase()) && !r.ref.includes(search)) return false;
      return true;
    });
  }, [allRows, filter, search]);

  const totalMissing = 658;

  const toggleSel = (id: string) => {
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () =>
    setSelected((p) => p.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)));

  const dotColors = ["bg-emerald-500", "bg-orange-500", "bg-amber-400", "bg-red-500", "bg-purple-500", "bg-cyan-500", "bg-pink-500"];

  return (
    <AppLayout>
      <div className="space-y-3">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b-2 border-destructive/60 pb-3">
          <Button variant="default" size="sm" onClick={() => nav("/")} className="gap-1.5 h-8">
            <Home className="h-3.5 w-3.5" /> Home
          </Button>
          <h1 className="text-xl font-semibold text-foreground">All Conflicts</h1>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FILTERS.map((f) => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="h-8 w-[130px] text-xs bg-emerald-100 border-emerald-200"
            />
            <Input
              type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="h-8 w-[130px] text-xs bg-rose-100 border-rose-200"
            />
          </div>
        </div>

        {/* Conflict count */}
        <div className="text-sm font-semibold text-foreground px-1">
          ({totalMissing}) shifts missing team member
        </div>

        {/* Bulk actions + search */}
        <div className="flex items-center justify-between gap-3 flex-wrap px-1">
          <div className="flex items-center gap-2">
            <Select value={bulk} onValueChange={setBulk}>
              <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {BULK_ACTIONS.map((a) => <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground h-8 px-4 text-xs font-semibold">Go</Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">Search:</span>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-[220px] text-xs" />
          </div>
        </div>

        {/* Conflict spreadsheet */}
        <TooltipProvider delayDuration={150}>
          <Card className="border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="p-2 border-r border-border w-8">
                      <input type="checkbox" className="rounded" checked={selected.size === rows.length && rows.length > 0} onChange={toggleAll} />
                    </th>
                    <th className="p-2 border-r border-border text-center w-20"><IconCell icon={Info} label="Visit reference ID" /></th>
                    <th className="p-2 border-r border-border text-center w-20"><IconCell icon={Calendar} label="Visit date" /></th>
                    <th className="p-2 border-r border-border text-left w-20">Status</th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={XCircle} label="Cancelled / not accepted" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={ThumbsUp} label="Carer confirmed" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Link2} label="Linked visit" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Map} label="On run route" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Users} label="Care team tag" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={AlertCircle} label="Visit alert" /></th>
                    <th className="p-2 border-r border-border text-left">Service User</th>
                    <th className="p-2 border-r border-border text-center w-16 bg-emerald-100">
                      <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><Calendar className="h-3.5 w-3.5 text-emerald-700" /></span></TooltipTrigger><TooltipContent className="text-xs">Scheduled start</TooltipContent></Tooltip>
                    </th>
                    <th className="p-2 border-r border-border text-center w-16 bg-rose-100">
                      <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><Calendar className="h-3.5 w-3.5 text-rose-700" /></span></TooltipTrigger><TooltipContent className="text-xs">Scheduled end</TooltipContent></Tooltip>
                    </th>
                    <th className="p-2 border-r border-border text-center w-16"><IconCell icon={TrendingUp} label="Scheduled duration" /></th>
                    <th className="p-2 border-r border-border text-center w-16 bg-emerald-100">
                      <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><Clock className="h-3.5 w-3.5 text-emerald-700" /></span></TooltipTrigger><TooltipContent className="text-xs">Actual clock-in</TooltipContent></Tooltip>
                    </th>
                    <th className="p-2 border-r border-border text-center w-16 bg-rose-100">
                      <Tooltip><TooltipTrigger asChild><span className="inline-flex cursor-help"><Clock className="h-3.5 w-3.5 text-rose-700" /></span></TooltipTrigger><TooltipContent className="text-xs">Actual clock-out</TooltipContent></Tooltip>
                    </th>
                    <th className="p-2 border-r border-border text-center w-16"><IconCell icon={TrendingUp} label="Actual duration" /></th>
                    <th className="p-2 border-r border-border text-left">Team Member</th>
                    <th className="p-2 border-r border-border text-left">Service Call</th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Tag} label="Service tag" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={UserPlus} label="Double-up" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Briefcase} label="Care pack" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={FileText} label="Care notes" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Bell} label="Alerts" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={PoundSterling} label="Payroll status" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={MessageSquare} label="Messages" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={Move} label="Reassign" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={ArrowRight} label="Continues to next" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={User} label="Solo visit" /></th>
                    <th className="p-2 border-r border-border text-left w-20">Week</th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={CalendarRange} label="Weekly pattern" /></th>
                    <th className="p-2 border-r border-border text-center w-12 text-[11px]">Wk</th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={ListChecks} label="Tasks" /></th>
                    <th className="p-2 border-r border-border text-center w-8"><IconCell icon={CalendarDays} label="Care plan" /></th>
                    <th className="p-2 text-center w-8"><IconCell icon={Lock} label="Rota lock" /></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={35} className="p-8 text-center text-muted-foreground">No conflicts in this date range.</td></tr>
                  )}
                  {rows.map((r, i) => {
                    const isCancelled = r.isCancelled;
                    const rowBg = isCancelled ? "bg-muted-foreground/30" : "bg-purple-100/60";
                    const dot = dotColors[i % dotColors.length];
                    const isSel = selected.has(r.id);
                    const teamCellColor = isCancelled ? "text-destructive line-through" : "text-destructive";
                    return (
                      <tr key={r.id} className={`${rowBg} border-b border-border hover:bg-muted/40 transition-colors`}>
                        <td className="p-1.5 border-r border-border text-center">
                          <input type="checkbox" className="rounded" checked={isSel} onChange={() => toggleSel(r.id)} />
                        </td>
                        <td className="p-1.5 border-r border-border text-center">
                          <button type="button" className="text-primary hover:underline cursor-pointer font-mono text-[11px]">{r.ref}</button>
                        </td>
                        <td className="p-1.5 border-r border-border font-mono text-[11px] text-center">{r.date}</td>
                        <td className={`p-1.5 border-r border-border text-[11px] ${isCancelled ? "text-foreground font-medium" : "text-foreground/80"}`}>{r.status}</td>
                        <td className="p-1.5 border-r border-border text-center">
                          {isCancelled ? <IconCell icon={XCircle} label="Cancelled" className="h-3.5 w-3.5 text-destructive" /> :
                            <IconCell icon={XCircle} label="Not assigned" className="h-3 w-3 text-muted-foreground/70" />}
                        </td>
                        <td className="p-1.5 border-r border-border text-center">
                          <IconCell icon={User} label="No carer assigned" className="h-3 w-3 text-muted-foreground/70" />
                        </td>
                        <td className="p-1.5 border-r border-border text-center"></td>
                        <td className="p-1.5 border-r border-border text-center">
                          {i % 4 === 0 && <IconCell icon={Map} label="On run route" className="h-3 w-3 text-primary" />}
                        </td>
                        <td className="p-1.5 border-r border-border text-center">
                          <Tooltip><TooltipTrigger asChild><span className={`inline-block w-3 h-3 rounded-full cursor-help ${dot}`} /></TooltipTrigger><TooltipContent className="text-xs">Care team tag</TooltipContent></Tooltip>
                        </td>
                        <td className="p-1.5 border-r border-border text-center">
                          {i % 6 === 4 && (
                            <Tooltip><TooltipTrigger asChild><span className="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-cyan-500 cursor-help" /></TooltipTrigger><TooltipContent className="text-xs">Priority alert</TooltipContent></Tooltip>
                          )}
                          {i === 9 && (
                            <Tooltip><TooltipTrigger asChild><span className="inline-block w-3 h-3 bg-red-500 cursor-help" /></TooltipTrigger><TooltipContent className="text-xs">Critical conflict</TooltipContent></Tooltip>
                          )}
                        </td>
                        <td className="p-1.5 border-r border-border">
                          <a className="text-primary hover:underline cursor-pointer text-[11px]">{r.serviceUser}</a>
                        </td>
                        <td className="p-1.5 border-r border-border text-center font-mono text-[11px] bg-emerald-50">{r.start}</td>
                        <td className="p-1.5 border-r border-border text-center font-mono text-[11px] bg-rose-50">{r.end}</td>
                        <td className="p-1.5 border-r border-border text-center font-mono text-[11px]">{r.duration}</td>
                        <td className="p-1.5 border-r border-border text-center font-mono text-[11px] bg-emerald-50/40">—</td>
                        <td className="p-1.5 border-r border-border text-center font-mono text-[11px] bg-rose-50/40">—</td>
                        <td className="p-1.5 border-r border-border text-center font-mono text-[11px]">—</td>
                        <td className={`p-1.5 border-r border-border text-[11px] font-medium ${teamCellColor}`}>{r.teamMember}</td>
                        <td className="p-1.5 border-r border-border text-[11px] text-foreground/80">{r.serviceCall}</td>
                        <td className="p-1.5 border-r border-border text-center"></td>
                        <td className="p-1.5 border-r border-border text-center"></td>
                        <td className="p-1.5 border-r border-border text-center"></td>
                        <td className="p-1.5 border-r border-border text-center"></td>
                        <td className="p-1.5 border-r border-border text-center">
                          {i % 5 === 1 && <IconCell icon={Camera} label="Photo evidence" className="h-3 w-3 text-primary" />}
                        </td>
                        <td className="p-1.5 border-r border-border text-center">
                          <IconCell icon={Bell} label="Alert" className="h-3 w-3 text-muted-foreground/60" />
                        </td>
                        <td className="p-1.5 border-r border-border text-center"></td>
                        <td className="p-1.5 border-r border-border text-center"></td>
                        <td className="p-1.5 border-r border-border text-center">
                          <IconCell icon={ArrowRight} label="Continues" className="h-3 w-3 text-muted-foreground" />
                        </td>
                        <td className="p-1.5 border-r border-border text-center"></td>
                        <td className="p-1.5 border-r border-border text-[11px]">{r.week}</td>
                        <td className="p-1.5 border-r border-border text-center"></td>
                        <td className="p-1.5 border-r border-border text-center font-mono text-[11px]">{r.weekNum}</td>
                        <td className="p-1.5 border-r border-border text-center">
                          <IconCell icon={ListChecks} label="Tasks" className="h-3 w-3 text-success" />
                        </td>
                        <td className="p-1.5 border-r border-border text-center"></td>
                        <td className="p-1.5 text-center">
                          <IconCell icon={Lock} label="Lock" className="h-3 w-3 text-muted-foreground/70" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TooltipProvider>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Showing <strong className="text-foreground">1</strong> to <strong className="text-foreground">{rows.length}</strong> of <strong className="text-foreground">{totalMissing}</strong></span>
          {selected.size > 0 && <span className="text-primary font-medium">{selected.size} selected</span>}
        </div>

        {/* Clashing Rotas Section */}
        <ClashingRotasSection />
      </div>
    </AppLayout>
  );
};

const CLASHING_PAIRS = [
  {
    a: { staff: "Sumayyah Shafiq", ref: "147844258", date: "06/05/2026", start: "19:30", end: "20:00", client: "Thomas Henderson" },
    b: { ref: "147844276", date: "06/05/2026", start: "19:45", end: "20:00", client: "Edna Morris" },
  },
  {
    a: { staff: "Lisa Archer", ref: "147844660", date: "07/05/2026", start: "09:35", end: "10:20", client: "Michael Taylor" },
    b: { ref: "147844618", date: "07/05/2026", start: "10:00", end: "10:30", client: "Craig Murray" },
  },
];

function ClashingRotasSection() {
  return (
    <Card className="rounded-sm border border-border overflow-hidden">
      <div className="border-t-2 border-t-destructive/80 px-4 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-foreground">({CLASHING_PAIRS.length}) clashing rotas</h3>
      </div>
      <div className="px-4 pb-4">
        <p className="text-xs text-muted-foreground mb-3">
          These shifts <span className="text-warning font-medium">clash</span> with each other
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr>
                <th className="bg-[hsl(245_60%_92%)] text-left p-2 font-semibold text-foreground border border-border">Staff</th>
                <th className="bg-[hsl(200_70%_94%)] text-left p-2 font-semibold text-foreground border border-border">Ref</th>
                <th className="bg-[hsl(200_70%_94%)] text-left p-2 font-semibold text-foreground border border-border">Date</th>
                <th className="bg-[hsl(200_70%_94%)] text-left p-2 font-semibold text-foreground border border-border">Start</th>
                <th className="bg-[hsl(200_70%_94%)] text-left p-2 font-semibold text-foreground border border-border">End</th>
                <th className="bg-[hsl(200_70%_94%)] text-left p-2 font-semibold text-foreground border border-border">Client</th>
                <th className="bg-[hsl(0_70%_94%)] text-left p-2 font-semibold text-foreground border border-border">Ref</th>
                <th className="bg-[hsl(0_70%_94%)] text-left p-2 font-semibold text-foreground border border-border">Date</th>
                <th className="bg-[hsl(0_70%_94%)] text-left p-2 font-semibold text-foreground border border-border">Start</th>
                <th className="bg-[hsl(0_70%_94%)] text-left p-2 font-semibold text-foreground border border-border">End</th>
                <th className="bg-[hsl(0_70%_94%)] text-left p-2 font-semibold text-foreground border border-border">Client</th>
              </tr>
            </thead>
            <tbody>
              {CLASHING_PAIRS.map((p, i) => (
                <tr key={i}>
                  <td className="bg-[hsl(245_60%_96%)] p-2 border border-border">
                    <button className="text-primary hover:underline font-medium">{p.a.staff}</button>
                  </td>
                  <td className="bg-[hsl(200_70%_97%)] p-2 border border-border">
                    <button className="text-destructive hover:underline font-mono">{p.a.ref}</button>
                  </td>
                  <td className="bg-[hsl(200_70%_97%)] p-2 border border-border text-foreground">{p.a.date}</td>
                  <td className="bg-[hsl(200_70%_97%)] p-2 border border-border text-foreground">{p.a.start}</td>
                  <td className="bg-[hsl(200_70%_97%)] p-2 border border-border text-foreground">{p.a.end}</td>
                  <td className="bg-[hsl(200_70%_97%)] p-2 border border-border">
                    <button className="text-primary hover:underline">{p.a.client}</button>
                  </td>
                  <td className="bg-[hsl(0_70%_97%)] p-2 border border-border">
                    <button className="text-destructive hover:underline font-mono">{p.b.ref}</button>
                  </td>
                  <td className="bg-[hsl(0_70%_97%)] p-2 border border-border text-foreground">{p.b.date}</td>
                  <td className="bg-[hsl(0_70%_97%)] p-2 border border-border text-foreground">{p.b.start}</td>
                  <td className="bg-[hsl(0_70%_97%)] p-2 border border-border text-foreground">{p.b.end}</td>
                  <td className="bg-[hsl(0_70%_97%)] p-2 border border-border">
                    <button className="text-primary hover:underline">{p.b.client}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default Conflicts;
