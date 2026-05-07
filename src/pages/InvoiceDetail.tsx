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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, FileSpreadsheet, FileText, FileType, Plus, Settings } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";

type InvoiceLine = {
  ref: string;
  issueDate: string;
  dateRange: string;
  dueBy: string;
  authority: string;
  surname: string;
  forename: string;
  socialServicesId: string;
  billable: number;
  outstanding: number;
  paymentStatus: "Paid In Full" | "Outstanding" | "Partial";
};

type ServiceUserRow = {
  surname: string;
  forename: string;
  scheduled: string;
  clocked: string;
  difference: string;
  chargeable: number;
  notChargeable: number;
};

const invoiceLines: InvoiceLine[] = [
  {
    ref: "29333",
    issueDate: "07/04/2026",
    dateRange: "30/03/2026 - 05/04/2026",
    dueBy: "07/05/2026",
    authority: "NHS Herefordshire and Worcestershire ICB",
    surname: "Morris",
    forename: "Michael",
    socialServicesId: "",
    billable: 400,
    outstanding: 0,
    paymentStatus: "Paid In Full",
  },
];

const serviceUserRows: ServiceUserRow[] = [
  { surname: "Morris", forename: "Michael", scheduled: "16:00", clocked: "15:51", difference: "00:09", chargeable: 5, notChargeable: 3 },
];

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

function ExportButtons() {
  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
        <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel
      </Button>
      <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
        <FileType className="h-3.5 w-3.5 mr-1" /> PDF
      </Button>
      <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
        <FileText className="h-3.5 w-3.5 mr-1" /> CSV
      </Button>
    </div>
  );
}

export default function InvoiceDetail() {
  const navigate = useNavigate();
  const { groupName = "CHC Invoice M Morris 30/03/26" } = useParams();
  const decodedGroup = decodeURIComponent(groupName);

  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [suSearch, setSuSearch] = useState("");
  const [bulkAction, setBulkAction] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [suSelected, setSuSelected] = useState<Record<string, boolean>>({});

  const filteredInvoices = useMemo(
    () =>
      invoiceLines.filter((r) =>
        [r.ref, r.authority, r.surname, r.forename].some((v) =>
          v.toLowerCase().includes(invoiceSearch.toLowerCase()),
        ),
      ),
    [invoiceSearch],
  );

  const filteredServiceUsers = useMemo(
    () =>
      serviceUserRows.filter((r) =>
        [r.surname, r.forename].some((v) =>
          v.toLowerCase().includes(suSearch.toLowerCase()),
        ),
      ),
    [suSearch],
  );

  const totals = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, r) => ({ billable: acc.billable + r.billable, outstanding: acc.outstanding + r.outstanding }),
      { billable: 0, outstanding: 0 },
    );
  }, [filteredInvoices]);

  const suTotals = useMemo(() => {
    return filteredServiceUsers.reduce(
      (acc, r) => ({
        chargeable: acc.chargeable + r.chargeable,
        notChargeable: acc.notChargeable + r.notChargeable,
      }),
      { chargeable: 0, notChargeable: 0 },
    );
  }, [filteredServiceUsers]);

  const statusClass = (s: InvoiceLine["paymentStatus"]) =>
    s === "Paid In Full"
      ? "text-emerald-600"
      : s === "Outstanding"
      ? "text-destructive"
      : "text-amber-600";

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/invoicing/invoice-groups")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold">Invoices</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Invoices Chargeable Between 30/03/2026 - 05/04/2026 In Group:{" "}
                <span className="font-medium text-foreground">{decodedGroup}</span>
              </p>
            </div>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
              <Settings className="h-4 w-4 mr-1.5" /> Settings
            </Button>
          </div>
        </Card>

        {/* Invoices section */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" className="h-8">
              <Plus className="h-4 w-4 mr-1" /> Add Blank Invoice
            </Button>
            <Button size="sm" variant="secondary" className="h-8">
              <FileText className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="h-9 w-64">
                <SelectValue placeholder="Bulk Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mark-paid">Mark as Paid</SelectItem>
                <SelectItem value="mark-outstanding">Mark as Outstanding</SelectItem>
                <SelectItem value="send-email">Send by Email</SelectItem>
                <SelectItem value="download-pdf">Download as PDF</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">Go</Button>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <ExportButtons />
            <div className="flex items-center gap-2 text-sm">
              <span>Search:</span>
              <Input value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} className="h-8 w-56" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-10"><Checkbox /></TableHead>
                  <TableHead className="w-10" />
                  <TableHead className="font-medium">Invoice Ref</TableHead>
                  <TableHead className="font-medium">Issue Date</TableHead>
                  <TableHead className="font-medium">Date Range</TableHead>
                  <TableHead className="font-medium">Due By</TableHead>
                  <TableHead className="font-medium">Authority</TableHead>
                  <TableHead className="font-medium">Surname</TableHead>
                  <TableHead className="font-medium">Forename</TableHead>
                  <TableHead className="font-medium">Social Services ID</TableHead>
                  <TableHead className="font-medium text-right">Billable</TableHead>
                  <TableHead className="font-medium text-right">Outstanding</TableHead>
                  <TableHead className="font-medium">Payment Status</TableHead>
                  <TableHead className="font-medium">Extra Ref</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((r) => (
                  <TableRow key={r.ref} className="bg-emerald-50/40">
                    <TableCell>
                      <Checkbox
                        checked={!!selected[r.ref]}
                        onCheckedChange={(v) => setSelected((p) => ({ ...p, [r.ref]: !!v }))}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-sky-600">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <button
                        className="text-primary hover:underline"
                        onClick={() =>
                          navigate(
                            `/invoicing/invoice-groups/${encodeURIComponent(decodedGroup)}/invoice/${r.ref}`,
                          )
                        }
                      >
                        {r.ref}
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{r.issueDate}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.dateRange}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.dueBy}</TableCell>
                    <TableCell className="text-sm">{r.authority}</TableCell>
                    <TableCell>{r.surname}</TableCell>
                    <TableCell>{r.forename}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.socialServicesId || "—"}</TableCell>
                    <TableCell className="text-right">{fmtMoney(r.billable)}</TableCell>
                    <TableCell className="text-right">{fmtMoney(r.outstanding)}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${statusClass(r.paymentStatus)}`}>{r.paymentStatus}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Input placeholder="Enter Reference Name" className="h-7 text-xs w-36" />
                        <Input placeholder="Enter Reference" className="h-7 text-xs w-28" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-muted/30 font-medium">
                  <TableCell colSpan={2} />
                  <TableCell>Totals</TableCell>
                  <TableCell colSpan={7} />
                  <TableCell className="text-right">{fmtMoney(totals.billable)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(totals.outstanding)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing 1 to {filteredInvoices.length} of {filteredInvoices.length} entries
          </p>
        </Card>

        {/* All Service Members In Authority */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="max-w-4xl">
              <h2 className="font-semibold">All Service Members In Authority</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Below you will see a forecast of scheduled and clocked based on a copy of shifts in the live rota that
                are complete or cancelled and chargeable. The scheduled and clocked fields below are only showing
                chargeable totals. Any shifts set to not chargeable are not included in the totals. You can see a list
                of shifts that are not chargeable by clicking on the service members name.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Select your service members and click run now to run more invoices for this authority.
              </p>
            </div>
            <Button size="sm" variant="secondary" className="h-8">
              <FileText className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>

          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white">Run Invoices</Button>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <ExportButtons />
            <div className="flex items-center gap-2 text-sm">
              <span>Search:</span>
              <Input value={suSearch} onChange={(e) => setSuSearch(e.target.value)} className="h-8 w-56" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-10"><Checkbox /></TableHead>
                  <TableHead className="font-medium">Surname</TableHead>
                  <TableHead className="font-medium">Forename</TableHead>
                  <TableHead className="font-medium">Scheduled</TableHead>
                  <TableHead className="font-medium">Clocked</TableHead>
                  <TableHead className="font-medium">Difference</TableHead>
                  <TableHead className="font-medium">Chargeable</TableHead>
                  <TableHead className="font-medium">Not Chargeable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServiceUsers.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Checkbox
                        checked={!!suSelected[r.surname + r.forename]}
                        onCheckedChange={(v) =>
                          setSuSelected((p) => ({ ...p, [r.surname + r.forename]: !!v }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <button className="text-primary hover:underline">{r.surname}</button>
                    </TableCell>
                    <TableCell>{r.forename}</TableCell>
                    <TableCell>{r.scheduled}</TableCell>
                    <TableCell>{r.clocked}</TableCell>
                    <TableCell>{r.difference}</TableCell>
                    <TableCell>{r.chargeable}</TableCell>
                    <TableCell>{r.notChargeable}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-medium">
                  <TableCell />
                  <TableCell>Totals</TableCell>
                  <TableCell />
                  <TableCell>
                    {filteredServiceUsers.reduce((a, r) => a + parseInt(r.scheduled.split(":")[0]), 0)}
                    :00
                  </TableCell>
                  <TableCell>
                    {filteredServiceUsers[0]?.clocked ?? "00:00"}
                  </TableCell>
                  <TableCell>
                    {filteredServiceUsers[0]?.difference ?? "00:00"}
                  </TableCell>
                  <TableCell>{suTotals.chargeable}</TableCell>
                  <TableCell>{suTotals.notChargeable}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing 1 to {filteredServiceUsers.length} of {filteredServiceUsers.length} entries
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
