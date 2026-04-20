import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, Download, Settings, Play } from "lucide-react";
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

const dateRange = "24/02/2026 - 23/03/2026";

const wageRows: WageRow[] = [
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

  const filtered = useMemo(
    () =>
      wageRows.filter((r) =>
        [r.ref, r.surname, r.forename].some((v) =>
          v.toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [search],
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

  const runBulk = () => {
    if (!bulkAction) {
      toast.error("Choose a bulk action");
      return;
    }
    if (selected.size === 0) {
      toast.error("Select at least one wage");
      return;
    }
    toast.success(`${bulkAction} applied to ${selected.size} wage(s)`);
    setSelected(new Set());
    setBulkAction("");
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
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold">Wages</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Wages Between {dateRange} In Group: {decoded}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => toast.info("Settings panel")}
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
                {filtered.map((r) => (
                  <TableRow key={r.ref} className="bg-emerald-50/40">
                    <TableCell>
                      <Checkbox
                        checked={selected.has(r.ref)}
                        onCheckedChange={() => toggleOne(r.ref)}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        className="text-emerald-700 hover:underline"
                        onClick={() => toast.info(`Opening wage ${r.ref}`)}
                      >
                        {r.ref}
                      </button>
                    </TableCell>
                    <TableCell>{r.published ? "Yes" : "No"}</TableCell>
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
                ))}
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
              onClick={() => toast.success("CSV export started")}
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
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => toast.success("Wages run started")}
            >
              <Play className="h-4 w-4 mr-1.5" /> Run Wages
            </Button>
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
                    <Checkbox />
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
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-10">
                    Loading…
                  </TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-semibold">Totals</TableCell>
                  <TableCell className="text-right font-semibold">0</TableCell>
                  <TableCell className="text-right font-semibold">0</TableCell>
                  <TableCell className="text-right font-semibold">0</TableCell>
                  <TableCell className="text-right font-semibold">0</TableCell>
                  <TableCell className="text-right font-semibold">0</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <div className="text-xs text-muted-foreground">Showing 0 to 0 of 0 entries</div>
        </Card>
      </div>
    </AppLayout>
  );
}
