import { useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Printer, CalendarIcon, Play, ChevronDown, Check } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const PEOPLE = [
  "Sarah Johnson",
  "Michael Chen",
  "Emma Williams",
  "James O'Connor",
  "Priya Patel",
  "David Kim",
  "Olivia Brown",
  "Marcus Taylor",
  "Sofia Rodriguez",
  "Ahmed Hassan",
];

const TYPE_OPTIONS = [
  "Active Care Givers",
  "Inactive Care Givers",
  "All Care Givers",
];

const FINANCE_TYPE_OPTIONS = [
  "Invoices",
  "Wages",
  "Tariffs",
  "Funders",
  "All Finance",
];

function MultiSelectPeople({
  selected,
  onChange,
  options = PEOPLE,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  options?: string[];
}) {
  const [open, setOpen] = useState(false);
  const label =
    selected.length === 0
      ? "None selected"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  const toggle = (name: string) => {
    if (selected.includes(name)) onChange(selected.filter((n) => n !== name));
    else onChange([...selected, name]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 w-full justify-between font-normal text-sm"
        >
          <span className={selected.length === 0 ? "text-muted-foreground" : ""}>
            {label}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onChange(options)}
          >
            Select all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        </div>
        <ScrollArea className="h-56">
          <div className="p-1">
            {options.map((p) => {
              const checked = selected.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggle(p)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted text-left"
                >
                  <Checkbox checked={checked} className="pointer-events-none" />
                  <span className="flex-1">{p}</span>
                  {checked && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function generateDummyRows(people: string[], start?: Date, end?: Date, category?: string) {
  if (!people.length || !start || !end) return [];
  if (category === "Finance Reports") {
    const financeRows: {
      name: string;
      date: string;
      location: string;
      duration: string;
      status: string;
    }[] = [];
    const statuses = ["Draft", "Ready", "Approved", "Paid", "Pending"];
    const days = Math.max(
      1,
      Math.min(7, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1),
    );
    people.forEach((group) => {
      for (let d = 0; d < days; d++) {
        const date = new Date(start);
        date.setDate(date.getDate() + d);
        financeRows.push({
          name: group,
          date: format(date, "dd/MM/yyyy"),
          location: `INV-${date.getFullYear()}${String(d + 1).padStart(3, "0")}`,
          duration: `£${(125 + group.length * 9 + d * 37).toLocaleString("en-GB")}`,
          status: statuses[(group.length + d) % statuses.length],
        });
      }
    });
    return financeRows;
  }

  const rows: {
    name: string;
    date: string;
    location: string;
    duration: string;
    status: string;
  }[] = [];
  const locations = ["12 Oak Street", "47 Pine Ave", "Hilltop Care Home", "5 Maple Rd", "Riverside Court"];
  const statuses = ["Completed", "Completed", "Completed", "Late", "Missed"];
  const days = Math.max(
    1,
    Math.min(7, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1),
  );
  people.forEach((person) => {
    for (let d = 0; d < days; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + d);
      rows.push({
        name: person,
        date: format(date, "dd/MM/yyyy"),
        location: locations[(person.length + d) % locations.length],
        duration: `${30 + ((d * 7) % 60)} min`,
        status: statuses[(person.length + d) % statuses.length],
      });
    }
  });
  return rows;
}

export default function ReportDetail() {
  const { name } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const reportName = name ? decodeURIComponent(name) : "Report";
  const category = params.get("category") ?? "Reports";
  const isFinance = category === "Finance Reports";

  const typeOptions = isFinance ? FINANCE_TYPE_OPTIONS : TYPE_OPTIONS;
  const peopleOptions = PEOPLE;
  const personLabel = category === "Service Member Reports" ? "Service Member" : "Care Giver";

  const [type, setType] = useState(typeOptions[0]);
  const [people, setPeople] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [hasRun, setHasRun] = useState(false);

  const rows = useMemo(
    () => (hasRun ? generateDummyRows(people, startDate, endDate, category) : []),
    [hasRun, people, startDate, endDate, category],
  );

  const onRun = () => {
    if (!people.length || !startDate || !endDate) return;
    setHasRun(true);
  };

  const onPrint = () => window.print();

  return (
    <AppLayout>
      {/* Header bar */}
      <div className="border-b bg-background">
        <div className="px-6 py-3 flex items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => nav("/reports")}
            className="h-8"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onPrint}
            className="h-8"
          >
            <Printer className="h-3.5 w-3.5 mr-1" /> Print
          </Button>
          <h1 className="flex-1 text-center text-base font-medium pr-24">
            {reportName}
          </h1>
        </div>
        <div className="h-[2px] bg-primary" />
      </div>

      {/* Body */}
      <div className="p-6 bg-muted/40 min-h-[calc(100vh-60px)]">
        <Card className="p-6 max-w-5xl mx-auto">
          <p className="text-xs text-muted-foreground mb-4">{category}</p>

          <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-x-4 gap-y-4 items-center max-w-2xl">
            <Label className="text-sm font-medium">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label className="text-sm font-medium">
              <span className="text-destructive mr-1">*</span>{personLabel}
            </Label>
            <MultiSelectPeople selected={people} onChange={setPeople} options={peopleOptions} />

            <Label className="text-sm font-medium">
              <span className="text-destructive mr-1">*</span>Start Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-start font-normal text-sm"
                >
                  <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : (
                    <span className="text-muted-foreground">Select date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => {
                    setStartDate(d);
                    if (d && endDate && endDate < d) setEndDate(undefined);
                  }}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Label className="text-sm font-medium">
              <span className="text-destructive mr-1">*</span>End Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-start font-normal text-sm"
                >
                  <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : (
                    <span className="text-muted-foreground">Select date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => {
                    if (d && startDate && d < startDate) {
                      toast.error("End date cannot be earlier than start date.");
                      return;
                    }
                    setEndDate(d);
                  }}
                  disabled={(date) => (startDate ? date < startDate : false)}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="mt-6 pt-4 border-t flex items-center gap-2">
            <Button
              onClick={onRun}
              disabled={!people.length || !startDate || !endDate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Play className="h-3.5 w-3.5 mr-1.5" /> Run
            </Button>
            {!people.length || !startDate || !endDate ? (
              <span className="text-xs text-muted-foreground">
                Select {personLabel.toLowerCase()}, start date and end date to run the report.
              </span>
            ) : null}
          </div>

          {/* Results */}
          {hasRun && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">
                Results <span className="text-muted-foreground font-normal">({rows.length})</span>
              </h3>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">{personLabel}</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">{isFinance ? "Reference" : "Location"}</TableHead>
                      <TableHead className="text-xs">{isFinance ? "Amount" : "Duration"}</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8 text-sm"
                        >
                          No results for the selected criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm py-2">{r.name}</TableCell>
                          <TableCell className="text-sm py-2">{r.date}</TableCell>
                          <TableCell className="text-sm py-2">{r.location}</TableCell>
                          <TableCell className="text-sm py-2">{r.duration}</TableCell>
                          <TableCell className="text-sm py-2">
                            <span
                              className={
                                r.status === "Missed"
                                  ? "text-destructive"
                                  : r.status === "Late"
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                              }
                            >
                              {r.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
