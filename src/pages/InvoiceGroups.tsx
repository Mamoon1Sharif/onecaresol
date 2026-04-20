import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ArrowLeft, CalendarIcon, FileText, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type InvoiceGroup = {
  groupName: string;
  funder?: string;
  totalInvoices: number;
  fullyPaid: number;
  startDate: string;
  endDate: string;
  cancelled: boolean;
};

const authorityRows: InvoiceGroup[] = [
  { groupName: "CHC Invoice M Morris 06/04/26", funder: "NHS Herefordshire and Worcestershire ICB", totalInvoices: 1, fullyPaid: 0, startDate: "06/04/2026", endDate: "12/04/2026", cancelled: false },
  { groupName: "Wcc Invoice 04/04/26-10/04/26", funder: "Social Services", totalInvoices: 22, fullyPaid: 21, startDate: "04/04/2026", endDate: "10/04/2026", cancelled: false },
  { groupName: "CHC Invoice M Morris 30/03/26", funder: "NHS Herefordshire and Worcestershire ICB", totalInvoices: 1, fullyPaid: 1, startDate: "30/03/2026", endDate: "05/04/2026", cancelled: false },
  { groupName: "Wcc Invoice 28/03/26-03/04/26", funder: "Social Services", totalInvoices: 20, fullyPaid: 19, startDate: "28/03/2026", endDate: "03/04/2026", cancelled: false },
  { groupName: "Wcc invoice Carol Stevens 21/03/26-27/03/26", funder: "Social Services", totalInvoices: 1, fullyPaid: 1, startDate: "21/03/2026", endDate: "27/03/2026", cancelled: false },
  { groupName: "Wcc invoice Carol Stevens 14/03/26-20/03/26", funder: "Social Services", totalInvoices: 1, fullyPaid: 1, startDate: "14/03/2026", endDate: "20/03/2026", cancelled: false },
  { groupName: "CHC Invoice M Morris 23/03/26", funder: "NHS Herefordshire and Worcestershire ICB", totalInvoices: 1, fullyPaid: 1, startDate: "23/03/2026", endDate: "29/03/2026", cancelled: false },
  { groupName: "Wcc Invoice 21/03/26-27/03/26", funder: "Social Services", totalInvoices: 20, fullyPaid: 20, startDate: "21/03/2026", endDate: "27/03/2026", cancelled: false },
  { groupName: "CHC Invoice Janet F 16/03/26", funder: "NHS Herefordshire and Worcestershire ICB", totalInvoices: 1, fullyPaid: 0, startDate: "16/03/2026", endDate: "22/03/2026", cancelled: false },
  { groupName: "Wcc invoice 14/03/26-20/03/26", funder: "Social Services", totalInvoices: 21, fullyPaid: 21, startDate: "14/03/2026", endDate: "20/03/2026", cancelled: false },
  { groupName: "Wcc invoice 07/03/26-13/03/26", funder: "Social Services", totalInvoices: 19, fullyPaid: 19, startDate: "07/03/2026", endDate: "13/03/2026", cancelled: false },
  { groupName: "CHC Invoice M Morris 09/03/26", funder: "NHS Herefordshire and Worcestershire ICB", totalInvoices: 1, fullyPaid: 1, startDate: "09/03/2026", endDate: "15/03/2026", cancelled: false },
  { groupName: "Wcc invoice 28/02/26-06/03/26", funder: "Social Services", totalInvoices: 18, fullyPaid: 18, startDate: "28/02/2026", endDate: "06/03/2026", cancelled: false },
];

const serviceUserRows: InvoiceGroup[] = [
  { groupName: "March Invoice Gillian Hunkin", totalInvoices: 1, fullyPaid: 0, startDate: "01/03/2026", endDate: "31/03/2026", cancelled: false },
  { groupName: "March Invoice Winifred Griffiths", totalInvoices: 1, fullyPaid: 0, startDate: "01/03/2026", endDate: "31/03/2026", cancelled: false },
  { groupName: "March Invoice John Franklin", totalInvoices: 1, fullyPaid: 0, startDate: "01/03/2026", endDate: "31/03/2026", cancelled: false },
  { groupName: "March Invoices 2026", totalInvoices: 34, fullyPaid: 23, startDate: "01/03/2026", endDate: "31/03/2026", cancelled: false },
  { groupName: "March Invoice 2026 Betty Bond", totalInvoices: 1, fullyPaid: 1, startDate: "01/03/2026", endDate: "18/03/2026", cancelled: false },
];

function GroupTable({
  rows,
  search,
  pageSize,
}: {
  rows: InvoiceGroup[];
  search: string;
  pageSize: number;
}) {
  const navigate = useNavigate();
    () =>
      rows.filter((r) =>
        [r.groupName, r.funder ?? ""].some((v) =>
          v.toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [rows, search],
  );
  const visible = filtered.slice(0, pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const showFunder = rows.some((r) => r.funder);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-medium">Group Name</TableHead>
              {showFunder && <TableHead className="font-medium">Funder</TableHead>}
              <TableHead className="font-medium">Total Invoices</TableHead>
              <TableHead className="font-medium">Fully Paid Invoices</TableHead>
              <TableHead className="font-medium">Start Date</TableHead>
              <TableHead className="font-medium">End Date</TableHead>
              <TableHead className="font-medium">Cancelled</TableHead>
              <TableHead className="font-medium text-right">Options</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showFunder ? 8 : 7} className="text-center text-sm text-muted-foreground py-8">
                  No matching invoice groups.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((r, i) => {
                const fullyPaid = r.fullyPaid === r.totalInvoices && r.totalInvoices > 0;
                return (
                  <TableRow key={i} className={fullyPaid ? "bg-emerald-50/40" : "bg-rose-50/40"}>
                    <TableCell>
                      <button className="text-primary hover:underline text-left">
                        {r.groupName}
                      </button>
                    </TableCell>
                    {showFunder && <TableCell className="text-sm">{r.funder}</TableCell>}
                    <TableCell>{r.totalInvoices}</TableCell>
                    <TableCell>{r.fullyPaid}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.startDate}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.endDate}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing 1 to {visible.length} of {filtered.length} entries
        </span>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" onClick={(e) => e.preventDefault()} />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <PaginationItem key={idx}>
                <PaginationLink href="#" isActive={idx === 0} onClick={(e) => e.preventDefault()}>
                  {idx + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href="#" onClick={(e) => e.preventDefault()} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

export default function InvoiceGroups() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(2026, 2, 6));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(2026, 3, 20));
  const [authPageSize, setAuthPageSize] = useState("10");
  const [authSearch, setAuthSearch] = useState("");
  const [suPageSize, setSuPageSize] = useState("10");
  const [suSearch, setSuSearch] = useState("");

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Top toolbar */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/invoicing")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Home
            </Button>
            <h1 className="text-lg font-semibold flex-1 text-center">Invoice Groups</h1>
            <Button variant="destructive" size="sm">View All Invoices</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal h-9 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
                    !startDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-emerald-700" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal h-9 bg-rose-50 border-rose-200 hover:bg-rose-100",
                    !endDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-rose-700" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>

            <Button className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              <RefreshCw className="h-4 w-4 mr-1.5" /> Update
            </Button>
          </div>
        </Card>

        {/* Authority Invoice Group */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold">Authority Invoice Group</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
                We group invoices by the date the invoices were marked as. For example if the invoice run was for
                01/01/2017 to 30/01/2017 we will show you all invoices created for that period under one page. Please
                select the invoice period below.
              </p>
            </div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-1.5" /> Create Authority Invoice
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <span>Show</span>
              <Select value={authPageSize} onValueChange={setAuthPageSize}>
                <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["10", "25", "50", "100"].map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>Search:</span>
              <Input value={authSearch} onChange={(e) => setAuthSearch(e.target.value)} className="h-8 w-56" />
            </div>
          </div>

          <GroupTable rows={authorityRows} search={authSearch} pageSize={Number(authPageSize)} />
        </Card>

        {/* Service User Invoice Group */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold">Service User Invoice Group</h2>
              <p className="text-xs text-muted-foreground mt-1">Bill the service user for an invoice.</p>
            </div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-1.5" /> Create Service User Invoice
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <span>Show</span>
              <Select value={suPageSize} onValueChange={setSuPageSize}>
                <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["10", "25", "50", "100"].map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>Search:</span>
              <Input value={suSearch} onChange={(e) => setSuSearch(e.target.value)} className="h-8 w-56" />
            </div>
          </div>

          <GroupTable rows={serviceUserRows} search={suSearch} pageSize={Number(suPageSize)} />
        </Card>
      </div>
    </AppLayout>
  );
}
