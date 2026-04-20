import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Check } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

type Row = {
  id: string;
  teamMember: string;
  role: string;
  payrollNo: string;
  type: string;
  subtype: string;
  start: string; // dd/mm/yyyy[ HH:mm]
  end: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;
  leave: string;
  note: string;
  status: "Approved" | "Pending" | "Rejected";
};

const TEAM_MEMBERS = [
  "Lisa Archer",
  "Mary Johnson",
  "Tom Patel",
  "Sarah Williams",
  "James Brown",
  "Emily Davis",
];

const TYPES = ["Holiday", "Sickness", "Unpaid Leave", "Training", "Other"];
const SUBTYPES = ["Standard", "Rota day off", "Bank Holiday", "Half Day", "Emergency"];

const ALL_DATA: Row[] = [
  {
    id: "1",
    teamMember: "Lisa Archer",
    role: "Homecare Assistant - Premium",
    payrollNo: "",
    type: "Holiday",
    subtype: "Standard",
    start: "18/04/2026",
    end: "18/04/2026",
    startDate: "2026-04-18",
    endDate: "2026-04-18",
    leave: "1 Days (4 hrs)",
    note: "",
    status: "Approved",
  },
  {
    id: "2",
    teamMember: "Lisa Archer",
    role: "Homecare Assistant - Premium",
    payrollNo: "",
    type: "Holiday",
    subtype: "Standard",
    start: "19/04/2026",
    end: "19/04/2026",
    startDate: "2026-04-19",
    endDate: "2026-04-19",
    leave: "1 Days (4 hrs)",
    note: "",
    status: "Approved",
  },
  {
    id: "3",
    teamMember: "Lisa Archer",
    role: "Homecare Assistant - Premium",
    payrollNo: "",
    type: "Holiday",
    subtype: "Half Day",
    start: "15/04/2026 14:00",
    end: "15/04/2026 23:59",
    startDate: "2026-04-15",
    endDate: "2026-04-15",
    leave: "0.5 Days (2.6 hrs)",
    note: "Mum has hospital",
    status: "Approved",
  },
  {
    id: "4",
    teamMember: "Lisa Archer",
    role: "Homecare Assistant - Premium",
    payrollNo: "",
    type: "Holiday",
    subtype: "Rota day off",
    start: "11/04/2026 07:00",
    end: "11/04/2026 14:00",
    startDate: "2026-04-11",
    endDate: "2026-04-11",
    leave: "0 Days (0 hrs)",
    note: "",
    status: "Approved",
  },
  {
    id: "5",
    teamMember: "Mary Johnson",
    role: "Senior Carer",
    payrollNo: "P0123",
    type: "Sickness",
    subtype: "Emergency",
    start: "08/04/2026",
    end: "10/04/2026",
    startDate: "2026-04-08",
    endDate: "2026-04-10",
    leave: "3 Days (24 hrs)",
    note: "Flu",
    status: "Approved",
  },
  {
    id: "6",
    teamMember: "Tom Patel",
    role: "Care Assistant",
    payrollNo: "P0456",
    type: "Training",
    subtype: "Standard",
    start: "14/04/2026",
    end: "14/04/2026",
    startDate: "2026-04-14",
    endDate: "2026-04-14",
    leave: "1 Days (8 hrs)",
    note: "Manual handling",
    status: "Pending",
  },
  {
    id: "7",
    teamMember: "Sarah Williams",
    role: "Homecare Assistant",
    payrollNo: "P0789",
    type: "Holiday",
    subtype: "Standard",
    start: "20/04/2026",
    end: "24/04/2026",
    startDate: "2026-04-20",
    endDate: "2026-04-24",
    leave: "5 Days (40 hrs)",
    note: "Family wedding",
    status: "Approved",
  },
];

type SortKey = keyof Pick<
  Row,
  "teamMember" | "role" | "payrollNo" | "type" | "start" | "end" | "leave" | "note" | "status"
>;

function MultiSelect({
  options,
  value,
  onChange,
  placeholderSingle,
  placeholderMulti,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholderSingle: string;
  placeholderMulti: string;
}) {
  const [open, setOpen] = useState(false);
  const label =
    value.length === 0
      ? placeholderSingle
      : value.length === 1
      ? value[0]
      : `${placeholderMulti} ▾`;
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-center rounded-md border border-input bg-muted px-3 text-sm text-primary hover:bg-muted/70"
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
        <div className="max-h-64 overflow-auto">
          {options.map((opt) => {
            const checked = value.includes(opt);
            return (
              <button
                type="button"
                key={opt}
                onClick={() => toggle(opt)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Checkbox checked={checked} className="pointer-events-none" />
                <span className="flex-1 text-left">{opt}</span>
                {checked && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const FieldRow = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="grid grid-cols-12 items-center gap-3 py-1">
    <Label className="col-span-4 justify-self-end text-sm font-medium">
      {required && <span className="text-red-500 mr-1">*</span>}
      {label}
    </Label>
    <div className="col-span-7">{children}</div>
  </div>
);

export default function HolidayReport() {
  const navigate = useNavigate();

  const [userType, setUserType] = useState("Team Member");
  const [activity, setActivity] = useState("Active Users");
  const [members, setMembers] = useState<string[]>(TEAM_MEMBERS.slice(0, 3));
  const [reportType, setReportType] = useState("Holiday Report");
  const [types, setTypes] = useState<string[]>(["Holiday", "Sickness"]);
  const [subtypes, setSubtypes] = useState<string[]>(["Standard", "Half Day"]);
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2026-04-20");

  const [results, setResults] = useState<Row[]>(ALL_DATA.slice(0, 4));
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("teamMember");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [exportTab, setExportTab] = useState<"Excel" | "CSV">("Excel");

  const runReport = () => {
    if (members.length === 0) {
      toast({ title: "Select at least one team member", variant: "destructive" });
      return;
    }
    if (types.length === 0) {
      toast({ title: "Select at least one type", variant: "destructive" });
      return;
    }
    const sd = new Date(startDate);
    const ed = new Date(endDate);
    const filtered = ALL_DATA.filter((r) => {
      const d = new Date(r.startDate);
      return (
        members.includes(r.teamMember) &&
        types.includes(r.type) &&
        (subtypes.length === 0 || subtypes.includes(r.subtype)) &&
        d >= sd &&
        d <= ed
      );
    });
    setResults(filtered);
    toast({ title: `Report ran – ${filtered.length} entries` });
  };

  const sorted = useMemo(() => {
    const filtered = results.filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return [r.teamMember, r.role, r.payrollNo, r.type, r.start, r.end, r.leave, r.note, r.status]
        .some((v) => v.toLowerCase().includes(q));
    });
    return [...filtered].sort((a, b) => {
      const av = (a[sortKey] || "").toString().toLowerCase();
      const bv = (b[sortKey] || "").toString().toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [results, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const exportFile = (fmt: "Excel" | "CSV") => {
    setExportTab(fmt);
    const headers = [
      "Team Member Name",
      "Role",
      "Payroll No.",
      "Type",
      "Start",
      "End",
      "Leave",
      "Note",
      "Status",
    ];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      headers.join(","),
      ...sorted.map((r) =>
        [r.teamMember, r.role, r.payrollNo, r.type, r.start, r.end, r.leave, r.note, r.status]
          .map(escape)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: fmt === "CSV" ? "text/csv" : "application/vnd.ms-excel",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `holiday-report.${fmt === "CSV" ? "csv" : "xls"}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `Exported as ${fmt}` });
  };

  const SortHeader = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 text-left font-semibold"
    >
      {children}
      <span className="flex flex-col leading-none text-muted-foreground">
        <ChevronUp className={`h-3 w-3 ${sortKey === k && sortDir === "asc" ? "text-foreground" : ""}`} />
        <ChevronDown className={`h-3 w-3 -mt-1 ${sortKey === k && sortDir === "desc" ? "text-foreground" : ""}`} />
      </span>
    </button>
  );

  return (
    <AppLayout>
      <div className="flex h-full flex-col bg-muted/30">
        {/* Header */}
        <div className="relative flex items-center border-b bg-background px-4 py-2">
          <Button
            size="sm"
            className="bg-sky-500 hover:bg-sky-600 text-white gap-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-medium text-pink-700">
            Holiday Report
          </h1>
          <div className="ml-auto" />
        </div>
        <div className="h-0.5 bg-pink-600" />

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Filter card */}
          <div className="rounded-md border bg-background p-6">
            <div className="mx-auto max-w-3xl">
              <FieldRow label="Select User Type" required>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger className="text-primary"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Team Member">Team Member</SelectItem>
                    <SelectItem value="Service User">Service User</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow label="User Type">
                <Select value={activity} onValueChange={setActivity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active Users">Active Users</SelectItem>
                    <SelectItem value="Inactive Users">Inactive Users</SelectItem>
                    <SelectItem value="All Users">All Users</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow label="Select Team Member" required>
                <MultiSelect
                  options={TEAM_MEMBERS}
                  value={members}
                  onChange={setMembers}
                  placeholderSingle="Select team member"
                  placeholderMulti="Multiple Team Member selected"
                />
              </FieldRow>

              <div className="my-3" />

              <FieldRow label="Report Type" required>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="text-primary"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Holiday Report">Holiday Report</SelectItem>
                    <SelectItem value="Sickness Report">Sickness Report</SelectItem>
                    <SelectItem value="Absence Summary">Absence Summary</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow label="Type" required>
                <MultiSelect
                  options={TYPES}
                  value={types}
                  onChange={setTypes}
                  placeholderSingle="Select type"
                  placeholderMulti="Multiple Types Selected"
                />
              </FieldRow>

              <FieldRow label="Subtype" required>
                <MultiSelect
                  options={SUBTYPES}
                  value={subtypes}
                  onChange={setSubtypes}
                  placeholderSingle="Select subtype"
                  placeholderMulti="Multiple Types Selected"
                />
              </FieldRow>

              <FieldRow label="Start Date" required>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </FieldRow>

              <FieldRow label="End Date" required>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </FieldRow>

              <div className="mt-4 flex justify-end">
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={runReport}
                >
                  Run Report
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="rounded-md border bg-background p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex">
                {(["Excel", "CSV"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => exportFile(tab)}
                    className={`border px-3 py-1 text-xs ${
                      exportTab === tab
                        ? "bg-muted font-semibold"
                        : "bg-background hover:bg-muted/50"
                    } ${tab === "Excel" ? "rounded-l" : "rounded-r border-l-0"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="search" className="text-xs">Search:</Label>
                <Input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-7 w-48"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><SortHeader k="teamMember">Team Member Name</SortHeader></TableHead>
                  <TableHead><SortHeader k="role">Role</SortHeader></TableHead>
                  <TableHead><SortHeader k="payrollNo">Payroll No.</SortHeader></TableHead>
                  <TableHead><SortHeader k="type">Type</SortHeader></TableHead>
                  <TableHead><SortHeader k="start">Start</SortHeader></TableHead>
                  <TableHead><SortHeader k="end">End</SortHeader></TableHead>
                  <TableHead><SortHeader k="leave">Leave</SortHeader></TableHead>
                  <TableHead><SortHeader k="note">Note</SortHeader></TableHead>
                  <TableHead><SortHeader k="status">Status</SortHeader></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => (
                  <TableRow key={r.id} className="bg-emerald-50/60 hover:bg-emerald-100/60">
                    <TableCell className="text-sm">{r.teamMember}</TableCell>
                    <TableCell className="text-sm">{r.role}</TableCell>
                    <TableCell className="text-sm">{r.payrollNo}</TableCell>
                    <TableCell className="text-sm">
                      {r.type}
                      {r.subtype === "Rota day off" ? " (Rota day off)" : ""}
                    </TableCell>
                    <TableCell className="text-sm">{r.start}</TableCell>
                    <TableCell className="text-sm">{r.end}</TableCell>
                    <TableCell className="text-sm">{r.leave}</TableCell>
                    <TableCell className="text-sm">{r.note}</TableCell>
                    <TableCell
                      className={`text-sm ${
                        r.status === "Approved"
                          ? "text-emerald-700"
                          : r.status === "Pending"
                          ? "text-amber-700"
                          : "text-red-700"
                      }`}
                    >
                      {r.status}
                    </TableCell>
                  </TableRow>
                ))}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-6">
                      No entries match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="mt-2 text-xs text-muted-foreground">
              Showing {sorted.length === 0 ? 0 : 1} to {sorted.length} of {sorted.length} entries
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
