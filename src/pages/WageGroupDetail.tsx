import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Settings, Play, Check, Save, Printer, FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type WageRow = {
  ref: string;
  published: boolean;
  dateRange: string;
  surname: string;
  forename: string;
  totalHours: number;
  pay: number;
  mileageMiles: number;
  mileagePay: number;
  travelTimeMins: number;
  travelTimePay: number;
  waitingTimePay: number;
};

type TeamRow = {
  surname: string;
  forename: string;
  payroll: string;
  scheduled: number;
  clocked: number;
  included: number;
  excluded: number;
};

const dateRange = "24/02/2026 - 23/03/2026";

const initialWageRows: WageRow[] = [
  { ref: "1348060", published: false, dateRange, surname: "Archer", forename: "Lisa", totalHours: 121.55, pay: 1627.78, mileageMiles: 309.90, mileagePay: 139.48, travelTimeMins: 728.30, travelTimePay: 158.09, waitingTimePay: 157.71 },
  { ref: "1348063", published: false, dateRange, surname: "Biggart", forename: "Emily", totalHours: 67.73, pay: 850.79, mileageMiles: 436.16, mileagePay: 196.30, travelTimeMins: 994.60, travelTimePay: 208.83, waitingTimePay: 230.62 },
  { ref: "1348066", published: false, dateRange, surname: "Cannaway", forename: "Anne", totalHours: 65.28, pay: 842.35, mileageMiles: 276.41, mileagePay: 124.28, travelTimeMins: 904.08, travelTimePay: 195.69, waitingTimePay: 238.29 },
  { ref: "1348069", published: false, dateRange, surname: "Davis", forename: "Kirsty", totalHours: 66.68, pay: 840.59, mileageMiles: 367.29, mileagePay: 165.27, travelTimeMins: 794.50, travelTimePay: 166.75, waitingTimePay: 163.07 },
  { ref: "1348072", published: false, dateRange, surname: "Delport", forename: "Ewelina", totalHours: 147.94, pay: 288.51, mileageMiles: 57.71, mileagePay: 25.97, travelTimeMins: 125.67, travelTimePay: 30.29, waitingTimePay: 22.23 },
  { ref: "1348075", published: false, dateRange, surname: "Hardeman", forename: "Mollie-Mai", totalHours: 28.56, pay: 349.84, mileageMiles: 98.04, mileagePay: 44.11, travelTimeMins: 216.90, travelTimePay: 44.24, waitingTimePay: 67.57 },
  { ref: "1348078", published: false, dateRange, surname: "Hawtin", forename: "Jodie", totalHours: 39.48, pay: 483.29, mileageMiles: 259.51, mileagePay: 116.78, travelTimeMins: 586.88, travelTimePay: 119.70, waitingTimePay: 117.50 },
  { ref: "1348081", published: false, dateRange, surname: "Hill", forename: "Aimee", totalHours: 53.43, pay: 660.06, mileageMiles: 419.99, mileagePay: 188.98, travelTimeMins: 944.68, travelTimePay: 194.11, waitingTimePay: 170.57 },
  { ref: "1348084", published: false, dateRange, surname: "Hitchman", forename: "Carol", totalHours: 15.75, pay: 300.99, mileageMiles: 33.12, mileagePay: 14.90, travelTimeMins: 0, travelTimePay: 0, waitingTimePay: 0 },
  { ref: "1348087", published: false, dateRange, surname: "Jordan", forename: "Elizabeth", totalHours: 3.25, pay: 43.00, mileageMiles: 9.67, mileagePay: 4.35, travelTimeMins: 0, travelTimePay: 0, waitingTimePay: 0 },
  { ref: "1348090", published: false, dateRange, surname: "McBride", forename: "Alison", totalHours: 79.50, pay: 1042.65, mileageMiles: 388.27, mileagePay: 174.65, travelTimeMins: 1106.48, travelTimePay: 242.00, waitingTimePay: 220.47 },
  { ref: "1348093", published: false, dateRange, surname: "Milton", forename: "Ellie", totalHours: 63.18, pay: 822.22, mileageMiles: 396.72, mileagePay: 178.54, travelTimeMins: 913.85, travelTimePay: 200.73, waitingTimePay: 212.11 },
  { ref: "1348096", published: false, dateRange, surname: "New", forename: "Liberty", totalHours: 73.00, pay: 935.80, mileageMiles: 455.94, mileagePay: 205.20, travelTimeMins: 1031.18, travelTimePay: 218.75, waitingTimePay: 145.41 },
  { ref: "1348099", published: false, dateRange, surname: "Parker", forename: "Lynn", totalHours: 73.33, pay: 125.15, mileageMiles: 10.54, mileagePay: 4.74, travelTimeMins: 27.58, travelTimePay: 6.16, waitingTimePay: 6.33 },
  { ref: "1348102", published: false, dateRange, surname: "Pawelska", forename: "Magdalena", totalHours: 25.21, pay: 349.00, mileageMiles: 145.62, mileagePay: 65.51, travelTimeMins: 313.08, travelTimePay: 72.20, waitingTimePay: 78.63 },
  { ref: "1348105", published: false, dateRange, surname: "Sawich", forename: "Maya", totalHours: 158.58, pay: 719.25, mileageMiles: 190.03, mileagePay: 85.53, travelTimeMins: 0, travelTimePay: 0, waitingTimePay: 0 },
  { ref: "1348108", published: false, dateRange, surname: "Spires", forename: "Rod", totalHours: 2.00, pay: 27.30, mileageMiles: 0, mileagePay: 0, travelTimeMins: 0, travelTimePay: 0, waitingTimePay: 0 },
  { ref: "1348111", published: false, dateRange, surname: "Thrower", forename: "Karen", totalHours: 43.86, pay: 571.72, mileageMiles: 310.41, mileagePay: 139.63, travelTimeMins: 760.50, travelTimePay: 169.89, waitingTimePay: 129.94 },
  { ref: "1348114", published: false, dateRange, surname: "Whittle", forename: "Vanessa", totalHours: 148.13, pay: 291.13, mileageMiles: 5.51, mileagePay: 2.48, travelTimeMins: 22.20, travelTimePay: 5.35, waitingTimePay: 2.53 },
  { ref: "1348117", published: false, dateRange, surname: "Wood", forename: "Nicola", totalHours: 53.76, pay: 695.69, mileageMiles: 291.25, mileagePay: 131.03, travelTimeMins: 752.45, travelTimePay: 161.69, waitingTimePay: 116.21 },
  { ref: "1348120", published: false, dateRange, surname: "Young", forename: "Hayley", totalHours: 0, pay: 0, mileageMiles: 0, mileagePay: 0, travelTimeMins: 0, travelTimePay: 0, waitingTimePay: 0 },
];

const initialTeamRows: TeamRow[] = [
  { surname: "Archer", forename: "Lisa", payroll: "PR-1001", scheduled: 122.00, clocked: 121.55, included: 121.55, excluded: 0.45 },
  { surname: "Biggart", forename: "Emily", payroll: "PR-1002", scheduled: 68.00, clocked: 67.73, included: 67.73, excluded: 0.27 },
  { surname: "Cannaway", forename: "Anne", payroll: "PR-1003", scheduled: 66.00, clocked: 65.28, included: 65.28, excluded: 0.72 },
  { surname: "Davis", forename: "Kirsty", payroll: "PR-1004", scheduled: 67.00, clocked: 66.68, included: 66.68, excluded: 0.32 },
  { surname: "Hill", forename: "Aimee", payroll: "PR-1005", scheduled: 54.00, clocked: 53.43, included: 53.43, excluded: 0.57 },
  { surname: "McBride", forename: "Alison", payroll: "PR-1006", scheduled: 80.00, clocked: 79.50, included: 79.50, excluded: 0.50 },
  { surname: "Wood", forename: "Nicola", payroll: "PR-1007", scheduled: 54.00, clocked: 53.76, included: 53.76, excluded: 0.24 },
];

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);
const fmtNum = (n: number, d = 2) =>
  new Intl.NumberFormat("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

export default function WageGroupDetail() {
  const navigate = useNavigate();
  const { groupName } = useParams();
  const decoded = decodeURIComponent(groupName ?? "Wage Group");

  const [search, setSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [bulkAction, setBulkAction] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [teamSelected, setTeamSelected] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<WageRow[]>(initialWageRows);
  const [teamRows] = useState<TeamRow[]>(initialTeamRows);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [payslip, setPayslip] = useState<WageRow | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [running, setRunning] = useState(false);

  const [settings, setSettings] = useState({
    payDate: "31/03/2026",
    includeMileage: true,
    includeTravelTime: true,
    includeWaitingTime: true,
    autoPublish: false,
    notifyStaff: true,
  });

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        [r.ref, r.surname, r.forename].some((v) =>
          v.toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [rows, search],
  );

  const filteredTeam = useMemo(
    () =>
      teamRows.filter((r) =>
        [r.surname, r.forename, r.payroll].some((v) =>
          v.toLowerCase().includes(teamSearch.toLowerCase()),
        ),
      ),
    [teamRows, teamSearch],
  );

  const totals = useMemo(
    () => ({
      hours: filtered.reduce((s, r) => s + r.totalHours, 0),
      pay: filtered.reduce((s, r) => s + r.pay, 0),
      miles: filtered.reduce((s, r) => s + r.mileageMiles, 0),
      mileagePay: filtered.reduce((s, r) => s + r.mileagePay, 0),
      travelMins: filtered.reduce((s, r) => s + r.travelTimeMins, 0),
      travelPay: filtered.reduce((s, r) => s + r.travelTimePay, 0),
      waitingPay: filtered.reduce((s, r) => s + r.waitingTimePay, 0),
    }),
    [filtered],
  );

  const teamTotals = useMemo(
    () => ({
      scheduled: filteredTeam.reduce((s, r) => s + r.scheduled, 0),
      clocked: filteredTeam.reduce((s, r) => s + r.clocked, 0),
      included: filteredTeam.reduce((s, r) => s + r.included, 0),
      excluded: filteredTeam.reduce((s, r) => s + r.excluded, 0),
    }),
    [filteredTeam],
  );

  const grandTotal = (r: WageRow) =>
    r.pay + r.mileagePay + r.travelTimePay + r.waitingTimePay;

  const totalsGrand =
    totals.pay + totals.mileagePay + totals.travelPay + totals.waitingPay;

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.ref));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.ref)));
  };
  const toggleOne = (ref: string) => {
    const next = new Set(selected);
    if (next.has(ref)) next.delete(ref);
    else next.add(ref);
    setSelected(next);
  };

  const allTeamSelected =
    filteredTeam.length > 0 && filteredTeam.every((r) => teamSelected.has(r.payroll));
  const toggleAllTeam = () => {
    if (allTeamSelected) setTeamSelected(new Set());
    else setTeamSelected(new Set(filteredTeam.map((r) => r.payroll)));
  };
  const toggleOneTeam = (payroll: string) => {
    const next = new Set(teamSelected);
    if (next.has(payroll)) next.delete(payroll);
    else next.add(payroll);
    setTeamSelected(next);
  };

  const runBulk = () => {
    if (!bulkAction) {
      toast.error("Choose a bulk action");
      return;
    }
    if (selected.size === 0) {
      toast.error("Select at least one wage");
      return;
    }
    if (bulkAction === "publish") {
      setRows((prev) => prev.map((r) => (selected.has(r.ref) ? { ...r, published: true } : r)));
      toast.success(`Published ${selected.size} wage(s)`);
    } else if (bulkAction === "unpublish") {
      setRows((prev) => prev.map((r) => (selected.has(r.ref) ? { ...r, published: false } : r)));
      toast.success(`Unpublished ${selected.size} wage(s)`);
    } else if (bulkAction === "delete") {
      setRows((prev) => prev.filter((r) => !selected.has(r.ref)));
      toast.success(`Deleted ${selected.size} wage(s)`);
    } else if (bulkAction === "export") {
      toast.success(`Exported ${selected.size} wage(s) to CSV`);
    }
    setSelected(new Set());
    setBulkAction("");
  };

  const togglePublishOne = (ref: string) => {
    setRows((prev) => prev.map((r) => (r.ref === ref ? { ...r, published: !r.published } : r)));
    const row = rows.find((r) => r.ref === ref);
    toast.success(`Wage ${ref} ${row?.published ? "unpublished" : "published"}`);
  };

  const handleRun = () => {
    if (teamSelected.size === 0) {
      toast.error("Select at least one team member");
      return;
    }
    setRunOpen(true);
  };

  const confirmRun = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setRunOpen(false);
      toast.success(`Wages run completed for ${teamSelected.size} member(s)`);
      setTeamSelected(new Set());
    }, 900);
  };

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-5">
        {/* Top toolbar */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/invoicing/wages")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> All Wages
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => toast.success("CSV export started")}
            >
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.print();
                toast.info("Opening print preview");
              }}
            >
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold">Wages</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Wages Between {dateRange} In Group: {decoded}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-1.5" /> Settings
            </Button>
          </div>
        </Card>

        {/* Wages table */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="h-9 w-48">
                  <SelectValue placeholder="Bulk Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publish">Publish</SelectItem>
                  <SelectItem value="unpublish">Unpublish</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={runBulk}
              >
                Go
              </Button>
              {selected.size > 0 && (
                <Badge variant="secondary" className="h-7">
                  {selected.size} selected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>Search:</span>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="font-medium">Wage Ref</TableHead>
                  <TableHead className="font-medium">Published</TableHead>
                  <TableHead className="font-medium">Date Range</TableHead>
                  <TableHead className="font-medium">Surname</TableHead>
                  <TableHead className="font-medium">Forename</TableHead>
                  <TableHead className="font-medium text-right">Total Hours</TableHead>
                  <TableHead className="font-medium text-right">Pay</TableHead>
                  <TableHead className="font-medium text-right">Mileage</TableHead>
                  <TableHead className="font-medium text-right">Mileage £</TableHead>
                  <TableHead className="font-medium text-right">Travel Time (mins)</TableHead>
                  <TableHead className="font-medium text-right">Travel Time £</TableHead>
                  <TableHead className="font-medium text-right">Waiting Time £</TableHead>
                  <TableHead className="font-medium text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center text-sm text-muted-foreground py-8">
                      No wages found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.ref} className="bg-emerald-50/40">
                      <TableCell>
                        <Checkbox
                          checked={selected.has(r.ref)}
                          onCheckedChange={() => toggleOne(r.ref)}
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          className="text-emerald-700 hover:underline font-medium"
                          onClick={() => setPayslip(r)}
                        >
                          {r.ref}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => togglePublishOne(r.ref)}
                          className="cursor-pointer"
                        >
                          <Badge
                            variant={r.published ? "default" : "outline"}
                            className={r.published ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                          >
                            {r.published ? "Yes" : "No"}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{r.dateRange}</TableCell>
                      <TableCell>{r.surname}</TableCell>
                      <TableCell>{r.forename}</TableCell>
                      <TableCell className="text-right">{fmtNum(r.totalHours)}</TableCell>
                      <TableCell className="text-right">{fmtGBP(r.pay)}</TableCell>
                      <TableCell className="text-right">{fmtNum(r.mileageMiles)}</TableCell>
                      <TableCell className="text-right">{fmtGBP(r.mileagePay)}</TableCell>
                      <TableCell className="text-right">{fmtNum(r.travelTimeMins)}</TableCell>
                      <TableCell className="text-right">{fmtGBP(r.travelTimePay)}</TableCell>
                      <TableCell className="text-right">{fmtGBP(r.waitingTimePay)}</TableCell>
                      <TableCell className="text-right font-medium">{fmtGBP(grandTotal(r))}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="font-semibold">Totals</TableCell>
                  <TableCell className="text-right font-semibold">{fmtNum(totals.hours)} hrs</TableCell>
                  <TableCell className="text-right font-semibold">{fmtGBP(totals.pay)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtNum(totals.miles)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtGBP(totals.mileagePay)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtNum(totals.travelMins)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtGBP(totals.travelPay)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtGBP(totals.waitingPay)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtGBP(totalsGrand)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <div className="text-xs text-muted-foreground">
            Showing 1 to {filtered.length} of {filtered.length} entries
          </div>
        </Card>

        {/* All Team Member section */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-semibold">All Team Member</h2>
            <Button
              size="sm"
              className="bg-sky-600 hover:bg-sky-700 text-white"
              onClick={() => toast.success("Team CSV export started")}
            >
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
          </div>

          <div className="space-y-1 text-xs">
            <p className="text-rose-600">
              Any shifts/team member that have not been linked to their corresponding tariffs will not be run.
            </p>
            <p className="text-muted-foreground">
              Below you will see a forecast of scheduled and clocked based on a copy of shifts in the live rota that are
              complete or cancelled and chargeable. The scheduled and clocked fields below are only showing chargeable
              totals. Any shifts set to not chargeable are not included in the totals. You can see a list of shifts that
              are not chargeable by clicking on the clients name.
            </p>
            <p className="text-muted-foreground">
              Select your clients and click run now to run more invoices for this authority.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleRun}
              >
                <Play className="h-4 w-4 mr-1.5" /> Run Wages
              </Button>
              {teamSelected.size > 0 && (
                <Badge variant="secondary" className="h-7">
                  {teamSelected.size} selected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>Search:</span>
              <Input
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="h-8 w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-10">
                    <Checkbox checked={allTeamSelected} onCheckedChange={toggleAllTeam} />
                  </TableHead>
                  <TableHead className="font-medium">Surname</TableHead>
                  <TableHead className="font-medium">Forename</TableHead>
                  <TableHead className="font-medium">Payroll Number</TableHead>
                  <TableHead className="font-medium text-right">Scheduled</TableHead>
                  <TableHead className="font-medium text-right">Clocked</TableHead>
                  <TableHead className="font-medium text-right">Difference</TableHead>
                  <TableHead className="font-medium text-right">Included</TableHead>
                  <TableHead className="font-medium text-right">Excluded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeam.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                      No team members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeam.map((r) => {
                    const diff = r.scheduled - r.clocked;
                    return (
                      <TableRow key={r.payroll}>
                        <TableCell>
                          <Checkbox
                            checked={teamSelected.has(r.payroll)}
                            onCheckedChange={() => toggleOneTeam(r.payroll)}
                          />
                        </TableCell>
                        <TableCell>{r.surname}</TableCell>
                        <TableCell>{r.forename}</TableCell>
                        <TableCell className="font-mono text-xs">{r.payroll}</TableCell>
                        <TableCell className="text-right">{fmtNum(r.scheduled)}</TableCell>
                        <TableCell className="text-right">{fmtNum(r.clocked)}</TableCell>
                        <TableCell className={`text-right ${diff > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                          {fmtNum(diff)}
                        </TableCell>
                        <TableCell className="text-right">{fmtNum(r.included)}</TableCell>
                        <TableCell className="text-right">{fmtNum(r.excluded)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-semibold">Totals</TableCell>
                  <TableCell className="text-right font-semibold">{fmtNum(teamTotals.scheduled)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtNum(teamTotals.clocked)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtNum(teamTotals.scheduled - teamTotals.clocked)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtNum(teamTotals.included)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtNum(teamTotals.excluded)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <div className="text-xs text-muted-foreground">
            Showing 1 to {filteredTeam.length} of {filteredTeam.length} entries
          </div>
        </Card>
      </div>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Wage Group Settings</DialogTitle>
            <DialogDescription>
              Configure how wages in this group are calculated and published.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-[160px_1fr] items-center gap-3">
              <Label htmlFor="payDate">Pay date</Label>
              <Input
                id="payDate"
                value={settings.payDate}
                onChange={(e) => setSettings({ ...settings, payDate: e.target.value })}
              />
            </div>
            {[
              { key: "includeMileage", label: "Include mileage" },
              { key: "includeTravelTime", label: "Include travel time" },
              { key: "includeWaitingTime", label: "Include waiting time" },
              { key: "autoPublish", label: "Auto-publish on run" },
              { key: "notifyStaff", label: "Notify staff via app" },
            ].map((opt) => (
              <div key={opt.key} className="flex items-center justify-between border-t pt-3">
                <Label htmlFor={opt.key}>{opt.label}</Label>
                <Switch
                  id={opt.key}
                  checked={settings[opt.key as keyof typeof settings] as boolean}
                  onCheckedChange={(v) =>
                    setSettings({ ...settings, [opt.key]: v })
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setSettingsOpen(false);
                toast.success("Settings saved");
              }}
            >
              <Save className="h-4 w-4 mr-1.5" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payslip dialog */}
      <Dialog open={!!payslip} onOpenChange={(o) => !o && setPayslip(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-700" />
              Payslip {payslip?.ref}
            </DialogTitle>
            <DialogDescription>
              {payslip?.forename} {payslip?.surname} · {payslip?.dateRange}
            </DialogDescription>
          </DialogHeader>
          {payslip && (
            <div className="space-y-2 text-sm">
              {[
                ["Total hours", `${fmtNum(payslip.totalHours)} hrs`],
                ["Base pay", fmtGBP(payslip.pay)],
                ["Mileage", `${fmtNum(payslip.mileageMiles)} mi · ${fmtGBP(payslip.mileagePay)}`],
                ["Travel time", `${fmtNum(payslip.travelTimeMins)} min · ${fmtGBP(payslip.travelTimePay)}`],
                ["Waiting time", fmtGBP(payslip.waitingTimePay)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <span className="font-semibold">Grand total</span>
                <span className="font-semibold text-emerald-700">
                  {fmtGBP(grandTotal(payslip))}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayslip(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                toast.success(`Payslip ${payslip?.ref} downloaded`);
                setPayslip(null);
              }}
            >
              <Download className="h-4 w-4 mr-1.5" /> Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run Wages confirm dialog */}
      <Dialog open={runOpen} onOpenChange={setRunOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Run wages now?</DialogTitle>
            <DialogDescription>
              This will generate wages for {teamSelected.size} selected team member(s) in
              this group.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunOpen(false)} disabled={running}>
              Cancel
            </Button>
            <Button
              onClick={confirmRun}
              disabled={running}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="h-4 w-4 mr-1.5" />
              {running ? "Running…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
