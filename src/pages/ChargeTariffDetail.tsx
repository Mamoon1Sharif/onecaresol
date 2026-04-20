import { useMemo, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Ban,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Copy,
  HelpCircle,
  History,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TimeBand = {
  id: string;
  name: string;
  color: string;
  from: string; // dd/MM/yyyy
  until: string;
  startDay: string;
  startTime: string;
  costHr: number;
  flatRate: boolean;
  billingType: string;
  durations: boolean;
  status: "active" | "future" | "expired";
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const initialBands: TimeBand[] = [
  {
    id: "b1",
    name: "Default",
    color: "#111827",
    from: "21/06/2025",
    until: "",
    startDay: "Mon",
    startTime: "00:00",
    costHr: 26,
    flatRate: false,
    billingType: "Scheduled",
    durations: true,
    status: "active",
  },
  {
    id: "b2",
    name: "Weekend Premium",
    color: "#0ea5e9",
    from: "01/01/2025",
    until: "",
    startDay: "Sat",
    startTime: "00:00",
    costHr: 32,
    flatRate: false,
    billingType: "Scheduled",
    durations: true,
    status: "active",
  },
  {
    id: "b3",
    name: "Bank Holiday",
    color: "#a855f7",
    from: "01/01/2026",
    until: "31/12/2026",
    startDay: "Mon",
    startTime: "00:00",
    costHr: 42,
    flatRate: true,
    billingType: "Actual",
    durations: false,
    status: "future",
  },
  {
    id: "b4",
    name: "2024 Legacy",
    color: "#6b7280",
    from: "01/01/2024",
    until: "31/12/2024",
    startDay: "Mon",
    startTime: "00:00",
    costHr: 22,
    flatRate: false,
    billingType: "Scheduled",
    durations: true,
    status: "expired",
  },
];

export default function ChargeTariffDetail() {
  const navigate = useNavigate();
  const { tariffName: rawName } = useParams();
  const tariffName = decodeURIComponent(rawName ?? "CHC (HWICB)");

  const [name, setName] = useState(tariffName);
  const [splitBands, setSplitBands] = useState<"Yes" | "No">("Yes");
  const [overrideMaster, setOverrideMaster] = useState<"Yes" | "No">("No");
  const [effectiveDate, setEffectiveDate] = useState<Date>(new Date(2026, 3, 20));

  const [bands, setBands] = useState<TimeBand[]>(initialBands);
  const [tab, setTab] = useState<"active" | "future" | "expired">("active");

  // Dialogs
  const [bandDialog, setBandDialog] = useState<{ open: boolean; band: TimeBand | null }>({
    open: false,
    band: null,
  });
  const [confirmDelete, setConfirmDelete] = useState<TimeBand | null>(null);
  const [confirmTariffDelete, setConfirmTariffDelete] = useState(false);
  const [historyOpen, setHistoryOpen] = useState<TimeBand | null>(null);

  const filteredBands = useMemo(() => bands.filter((b) => b.status === tab), [bands, tab]);

  // Day grid: which day each band covers (single-day mock)
  const bandsByDay = useMemo(() => {
    const map: Record<string, TimeBand[]> = {};
    DAY_SHORT.forEach((d) => (map[d] = []));
    filteredBands.forEach((b) => map[b.startDay]?.push(b));
    return map;
  }, [filteredBands]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Tariff name is required");
      return;
    }
    toast.success(`Tariff "${name}" saved`);
  };

  const handleDeleteTariff = () => {
    setConfirmTariffDelete(false);
    toast.success(`Tariff "${name}" deleted`);
    navigate("/invoicing/tariffs");
  };

  const openAddBand = () => {
    setBandDialog({
      open: true,
      band: {
        id: `b${Date.now()}`,
        name: "",
        color: "#0ea5e9",
        from: format(new Date(), "dd/MM/yyyy"),
        until: "",
        startDay: "Mon",
        startTime: "00:00",
        costHr: 0,
        flatRate: false,
        billingType: "Scheduled",
        durations: true,
        status: tab,
      },
    });
  };

  const openEditBand = (b: TimeBand) => setBandDialog({ open: true, band: { ...b } });

  const saveBand = () => {
    const b = bandDialog.band;
    if (!b) return;
    if (!b.name.trim()) {
      toast.error("Band name is required");
      return;
    }
    setBands((prev) => {
      const exists = prev.some((x) => x.id === b.id);
      return exists ? prev.map((x) => (x.id === b.id ? b : x)) : [...prev, b];
    });
    toast.success(`Band "${b.name}" saved`);
    setBandDialog({ open: false, band: null });
  };

  const duplicateBand = (b: TimeBand) => {
    setBands((prev) => [
      ...prev,
      { ...b, id: `b${Date.now()}`, name: `${b.name} (Copy)` },
    ]);
    toast.success(`Duplicated "${b.name}"`);
  };

  const expireBand = (b: TimeBand) => {
    setBands((prev) =>
      prev.map((x) =>
        x.id === b.id
          ? { ...x, status: "expired", until: format(new Date(), "dd/MM/yyyy") }
          : x,
      ),
    );
    toast.success(`Band "${b.name}" expired`);
  };

  const deleteBand = (b: TimeBand) => {
    setBands((prev) => prev.filter((x) => x.id !== b.id));
    setConfirmDelete(null);
    toast.success(`Band "${b.name}" deleted`);
  };

  const shiftDate = (delta: number) => {
    const d = new Date(effectiveDate);
    d.setDate(d.getDate() + delta);
    setEffectiveDate(d);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Top toolbar */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => navigate("/invoicing/tariffs")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirmTariffDelete(true)}
            >
              <Ban className="h-4 w-4 mr-1.5" /> Delete
            </Button>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Charge Tariff</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
              onClick={() => shiftDate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "h-8 px-3 rounded border bg-muted/40 text-sm tabular-nums inline-flex items-center gap-2",
                    "hover:bg-muted",
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  {format(effectiveDate, "dd/MM/yyyy")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={effectiveDate}
                  onSelect={(d) => d && setEffectiveDate(d)}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
              onClick={() => shiftDate(1)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Header card */}
        <div className="border-2 border-primary/70 rounded-md p-4 bg-card">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4 space-y-1.5">
              <Label className="text-xs">
                <span className="text-destructive">*</span> Tariff Name
              </Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
            </div>
            <div className="md:col-span-3 space-y-1.5">
              <Label className="text-xs">Split Time Bands?</Label>
              <Select value={splitBands} onValueChange={(v) => setSplitBands(v as "Yes" | "No")}>
                <SelectTrigger className="h-9 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4 space-y-1.5">
              <Label className="text-xs">Override With Master Charge?</Label>
              <Select
                value={overrideMaster}
                onValueChange={(v) => setOverrideMaster(v as "Yes" | "No")}
              >
                <SelectTrigger className="h-9 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1 flex justify-end">
              <Button
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs + Add */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <div className="flex items-end justify-between border-b">
            <TabsList className="bg-transparent p-0 h-auto rounded-none gap-1">
              <TabsTrigger
                value="active"
                className="data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:shadow-none rounded-b-none border border-transparent -mb-px px-4 py-2 text-sm"
              >
                Active Time Bands
              </TabsTrigger>
              <TabsTrigger
                value="future"
                className="data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:shadow-none rounded-b-none border border-transparent -mb-px px-4 py-2 text-sm"
              >
                Future Time Bands
              </TabsTrigger>
              <TabsTrigger
                value="expired"
                className="data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:shadow-none rounded-b-none border border-transparent -mb-px px-4 py-2 text-sm"
              >
                Expired Time Bands
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 pb-1.5">
              <Button
                size="sm"
                onClick={openAddBand}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-7"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="h-6 w-6 rounded-full inline-flex items-center justify-center text-muted-foreground hover:bg-muted"
                    aria-label="Help"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-xs">
                    Time bands define the cost per hour for each weekday & start time. Use Future
                    bands to schedule rate changes in advance.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <TabsContent value={tab} className="mt-0">
            {/* Day grid header */}
            <div className="grid grid-cols-7 border-b bg-card">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center font-semibold text-sm py-2.5 border-r last:border-r-0"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-b bg-foreground min-h-[44px]">
              {DAY_SHORT.map((d) => (
                <div
                  key={d}
                  className="border-r border-background/10 last:border-r-0 flex items-center px-1 gap-1"
                >
                  {bandsByDay[d]?.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => openEditBand(b)}
                      className="text-[11px] font-medium px-2 py-1 rounded text-white truncate"
                      style={{ backgroundColor: b.color }}
                      title={`${b.name} • ${b.startTime} • £${b.costHr}/hr`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Bands table */}
            <div className="border rounded-b-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-32">Actions</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Until</TableHead>
                    <TableHead>Start Day</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Cost/Hr</TableHead>
                    <TableHead>Flat Rate</TableHead>
                    <TableHead>Billing Type</TableHead>
                    <TableHead>Durations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBands.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                        No {tab} time bands. Click <span className="font-medium">+ Add</span> to
                        create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBands.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => openEditBand(b)}
                                  className="h-7 w-7 inline-flex items-center justify-center rounded text-orange-500 hover:bg-orange-500/10"
                                  aria-label="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setConfirmDelete(b)}
                                  className="h-7 w-7 inline-flex items-center justify-center rounded text-destructive hover:bg-destructive/10"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => duplicateBand(b)}
                                  className="h-7 w-7 inline-flex items-center justify-center rounded text-primary hover:bg-primary/10"
                                  aria-label="Duplicate"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Duplicate</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setHistoryOpen(b)}
                                  className="h-7 w-7 inline-flex items-center justify-center rounded text-emerald-600 hover:bg-emerald-600/10"
                                  aria-label="History"
                                >
                                  <History className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>History</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full inline-block"
                              style={{ backgroundColor: b.color }}
                            />
                            <span className="text-sm">{b.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{b.from}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.until || "—"}
                        </TableCell>
                        <TableCell className="text-sm">{b.startDay}</TableCell>
                        <TableCell className="text-sm tabular-nums">{b.startTime}</TableCell>
                        <TableCell className="text-sm tabular-nums">{b.costHr}</TableCell>
                        <TableCell className="text-sm">{b.flatRate ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-sm">{b.billingType}</TableCell>
                        <TableCell className="text-sm">{b.durations ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {tab === "active" && filteredBands.length > 0 && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => filteredBands[0] && expireBand(filteredBands[0])}
                >
                  Expire oldest band
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Band edit/add dialog */}
      <Dialog
        open={bandDialog.open}
        onOpenChange={(o) => !o && setBandDialog({ open: false, band: null })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {bands.some((x) => x.id === bandDialog.band?.id) ? "Edit Time Band" : "Add Time Band"}
            </DialogTitle>
            <DialogDescription>
              Configure the rate, day, and effective dates for this charge band.
            </DialogDescription>
          </DialogHeader>
          {bandDialog.band && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Band name</Label>
                <Input
                  value={bandDialog.band.name}
                  onChange={(e) =>
                    setBandDialog((p) => ({
                      ...p,
                      band: p.band ? { ...p.band, name: e.target.value } : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <Input
                  type="color"
                  value={bandDialog.band.color}
                  onChange={(e) =>
                    setBandDialog((p) => ({
                      ...p,
                      band: p.band ? { ...p.band, color: e.target.value } : null,
                    }))
                  }
                  className="h-9 p-1"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cost / hour (£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={bandDialog.band.costHr}
                  onChange={(e) =>
                    setBandDialog((p) => ({
                      ...p,
                      band: p.band ? { ...p.band, costHr: parseFloat(e.target.value) || 0 } : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>From (dd/mm/yyyy)</Label>
                <Input
                  value={bandDialog.band.from}
                  onChange={(e) =>
                    setBandDialog((p) => ({
                      ...p,
                      band: p.band ? { ...p.band, from: e.target.value } : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Until (optional)</Label>
                <Input
                  value={bandDialog.band.until}
                  onChange={(e) =>
                    setBandDialog((p) => ({
                      ...p,
                      band: p.band ? { ...p.band, until: e.target.value } : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Start day</Label>
                <Select
                  value={bandDialog.band.startDay}
                  onValueChange={(v) =>
                    setBandDialog((p) => ({
                      ...p,
                      band: p.band ? { ...p.band, startDay: v } : null,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_SHORT.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Start time</Label>
                <Input
                  type="time"
                  value={bandDialog.band.startTime}
                  onChange={(e) =>
                    setBandDialog((p) => ({
                      ...p,
                      band: p.band ? { ...p.band, startTime: e.target.value } : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Billing type</Label>
                <Select
                  value={bandDialog.band.billingType}
                  onValueChange={(v) =>
                    setBandDialog((p) => ({
                      ...p,
                      band: p.band ? { ...p.band, billingType: v } : null,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Actual">Actual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Flat rate</Label>
                <Select
                  value={bandDialog.band.flatRate ? "Yes" : "No"}
                  onValueChange={(v) =>
                    setBandDialog((p) => ({
                      ...p,
                      band: p.band ? { ...p.band, flatRate: v === "Yes" } : null,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Use durations</Label>
                <Select
                  value={bandDialog.band.durations ? "Yes" : "No"}
                  onValueChange={(v) =>
                    setBandDialog((p) => ({
                      ...p,
                      band: p.band ? { ...p.band, durations: v === "Yes" } : null,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBandDialog({ open: false, band: null })}>
              Cancel
            </Button>
            <Button
              onClick={saveBand}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save band
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={!!historyOpen} onOpenChange={(o) => !o && setHistoryOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change history — {historyOpen?.name}</DialogTitle>
            <DialogDescription>Recent updates to this band.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">21/06/2025 09:14</span>
              <span>Created by S. Patel</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">14/11/2025 11:02</span>
              <span>Cost/Hr changed from £24 → £26</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">02/03/2026 16:45</span>
              <span>Billing type set to Scheduled</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm delete band */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete time band?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the band &quot;{confirmDelete?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteBand(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete tariff */}
      <AlertDialog open={confirmTariffDelete} onOpenChange={setConfirmTariffDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this charge tariff?</AlertDialogTitle>
            <AlertDialogDescription>
              All bands and funder links using &quot;{name}&quot; will be unlinked. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTariff}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete tariff
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
