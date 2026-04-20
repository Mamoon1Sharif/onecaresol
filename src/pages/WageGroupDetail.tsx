import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, FileText, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type WageRow = {
  staffName: string;
  hours: number;
  rate: number;
  gross: number;
};

const dummyRows: WageRow[] = [
  { staffName: "Alice Carter", hours: 38, rate: 14.5, gross: 551 },
  { staffName: "Brian Hughes", hours: 42, rate: 13.75, gross: 577.5 },
  { staffName: "Carla Mendes", hours: 36, rate: 15.0, gross: 540 },
  { staffName: "David O'Reilly", hours: 40, rate: 14.0, gross: 560 },
  { staffName: "Esha Kumar", hours: 30, rate: 16.0, gross: 480 },
];

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(n);

export default function WageGroupDetail() {
  const navigate = useNavigate();
  const { groupName } = useParams();
  const decoded = decodeURIComponent(groupName ?? "Wage Group");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => dummyRows.filter((r) => r.staffName.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const totals = useMemo(
    () => ({
      hours: filtered.reduce((s, r) => s + r.hours, 0),
      gross: filtered.reduce((s, r) => s + r.gross, 0),
    }),
    [filtered],
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/invoicing/wages")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
            <h1 className="text-lg font-semibold flex-1 text-center">{decoded}</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => toast.success("Printing…")}>
                <Printer className="h-4 w-4 mr-1.5" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.success("Export started")}>
                <Download className="h-4 w-4 mr-1.5" /> Export
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold">Wages in this group</h2>
              <p className="text-xs text-muted-foreground mt-1">
                All staff payslips that fall within this wage period.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>Search:</span>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-56" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-medium">Staff Name</TableHead>
                  <TableHead className="font-medium">Hours</TableHead>
                  <TableHead className="font-medium">Rate</TableHead>
                  <TableHead className="font-medium">Gross Pay</TableHead>
                  <TableHead className="font-medium text-right">Payslip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.staffName}>
                    <TableCell className="text-emerald-700">{r.staffName}</TableCell>
                    <TableCell>{r.hours}</TableCell>
                    <TableCell>{fmtGBP(r.rate)}</TableCell>
                    <TableCell>{fmtGBP(r.gross)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-amber-600"
                        onClick={() => toast.info(`Opening payslip for ${r.staffName}`)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-transparent hover:bg-transparent">
                  <TableCell className="font-semibold">Totals</TableCell>
                  <TableCell className="font-semibold">{totals.hours}</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="font-semibold">{fmtGBP(totals.gross)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
