import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
import { Label } from "@/components/ui/label";
import { ArrowLeft, CalendarIcon, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type WageGroup = {
  groupName: string;
  startDate: string;
  endDate: string;
  totalWages: number;
  totalCost: number;
};

const initialWageGroups: WageGroup[] = [
  {
    groupName: "23 March 2026",
    startDate: "24/02/2026",
    endDate: "23/03/2026",
    totalWages: 21,
    totalCost: 18248.3,
  },
  {
    groupName: "23 March 2026 Sponsored",
    startDate: "24/02/2026",
    endDate: "23/03/2026",
    totalWages: 15,
    totalCost: 41875.49,
  },
];

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(n);

const toDdMmYyyy = (d?: Date) => (d ? format(d, "dd/MM/yyyy") : "");

export default function Wages() {
  const navigate = useNavigate();

  const [filterStart, setFilterStart] = useState<Date | undefined>(new Date(2026, 2, 9));
  const [filterEnd, setFilterEnd] = useState<Date | undefined>(new Date(2026, 3, 20));
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<WageGroup[]>(initialWageGroups);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState<Date | undefined>(new Date());
  const [newEnd, setNewEnd] = useState<Date | undefined>(new Date());

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        r.groupName.toLowerCase().includes(search.toLowerCase()),
      ),
    [rows, search],
  );

  const totals = useMemo(
    () => ({
      wages: filtered.reduce((s, r) => s + r.totalWages, 0),
      cost: filtered.reduce((s, r) => s + r.totalCost, 0),
    }),
    [filtered],
  );

  const handleCreate = () => {
    if (!newName.trim() || !newStart || !newEnd) {
      toast.error("Please fill in all fields");
      return;
    }
    const created: WageGroup = {
      groupName: newName.trim(),
      startDate: toDdMmYyyy(newStart),
      endDate: toDdMmYyyy(newEnd),
      totalWages: 0,
      totalCost: 0,
    };
    setRows((prev) => [created, ...prev]);
    toast.success("Wage group created");
    setCreateOpen(false);
    setNewName("");
    setNewStart(new Date());
    setNewEnd(new Date());
  };

  const handleDelete = (name: string) => {
    setRows((prev) => prev.filter((r) => r.groupName !== name));
    toast.success("Wage group deleted");
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Top toolbar */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/invoicing")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Dashboard
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Create Wage Group
            </Button>
            <h1 className="text-lg font-semibold flex-1 text-center">Wage Groups</h1>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 font-normal bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
                      !filterStart && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                    {filterStart ? format(filterStart, "dd/MM/yyyy") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={filterStart} onSelect={setFilterStart} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 font-normal bg-rose-50 border-rose-200 hover:bg-rose-100",
                      !filterEnd && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-rose-700" />
                    {filterEnd ? format(filterEnd, "dd/MM/yyyy") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={filterEnd} onSelect={setFilterEnd} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </Card>

        {/* Wage Groups table card */}
        <Card className="p-5 space-y-4">
          <div>
            <h2 className="font-semibold">Wage Groups</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-4xl leading-relaxed">
              We group wages by the date the wages were marked as. For example if the wages run was for
              01/01/2017 to 30/01/2017 we will show you all invoices created for that period under one page that
              belong to the group. Please select the wage period below.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 text-sm">
            <span>Search:</span>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-56" />
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="font-medium">Group Name</TableHead>
                  <TableHead className="font-medium">Start Date</TableHead>
                  <TableHead className="font-medium">End Date</TableHead>
                  <TableHead className="font-medium">Total Wages</TableHead>
                  <TableHead className="font-medium">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                      No matching wage groups.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.groupName}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(r.groupName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <button
                          className="text-emerald-700 hover:underline text-left"
                          onClick={() =>
                            navigate(`/invoicing/wages/${encodeURIComponent(r.groupName)}`)
                          }
                        >
                          {r.groupName}
                        </button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-emerald-700">{r.startDate}</TableCell>
                      <TableCell className="whitespace-nowrap text-emerald-700">{r.endDate}</TableCell>
                      <TableCell>{r.totalWages}</TableCell>
                      <TableCell>{fmtGBP(r.totalCost)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {filtered.length > 0 && (
                <TableFooter>
                  <TableRow className="bg-transparent hover:bg-transparent">
                    <TableCell colSpan={4}></TableCell>
                    <TableCell className="font-semibold">{totals.wages}</TableCell>
                    <TableCell className="font-semibold">{fmtGBP(totals.cost)}</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>

          <div className="text-xs text-muted-foreground">
            Showing 1 to {filtered.length} of {filtered.length} entries
          </div>
        </Card>
      </div>

      {/* Create Wage Group dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Wage Group</DialogTitle>
            <DialogDescription>
              Define the period this wage group will cover.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="wg-name">Group name</Label>
              <Input
                id="wg-name"
                placeholder="e.g. April 2026"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newStart ? format(newStart, "dd/MM/yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={newStart} onSelect={setNewStart} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newEnd ? format(newEnd, "dd/MM/yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={newEnd} onSelect={setNewEnd} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-1.5" /> Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
