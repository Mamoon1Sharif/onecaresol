import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Eye,
  Copy,
  Plus,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type ChargeTariff = { id: string; name: string };
type FunderLink = {
  id: string;
  funder: string;
  serviceName: string;
  chargeTariff: string;
  overrideWageTariff: string;
};

const initialTariffs: ChargeTariff[] = [
  { id: "t1", name: "CHC (HWICB)" },
  { id: "t2", name: "CHC (HWICB) (MM)" },
  { id: "t3", name: "CHC Night Sitting (Awake)" },
  { id: "t4", name: "No Charge" },
  { id: "t5", name: "Private" },
  { id: "t6", name: "Private (J.Fey)" },
  { id: "t7", name: "Private (Legacy 19/20)" },
  { id: "t8", name: "Private (Legacy AS)" },
  { id: "t9", name: "Private (Legacy BM)" },
  { id: "t10", name: "Private (Legacy EM)" },
  { id: "t11", name: "Private (Legacy Gen. Priv)" },
  { id: "t12", name: "Sponsored Care" },
  { id: "t13", name: "LA Standard" },
  { id: "t14", name: "LA Complex" },
  { id: "t15", name: "Direct Payments" },
];

const initialLinks: FunderLink[] = [
  { id: "l1", funder: "Direct (Client)", serviceName: "Private Evening Call", chargeTariff: "Private", overrideWageTariff: "Use Role Wage" },
  { id: "l2", funder: "Direct (Client)", serviceName: "Private Lunch Call", chargeTariff: "Private", overrideWageTariff: "Use Role Wage" },
  { id: "l3", funder: "Direct (Client)", serviceName: "Private Morning Call", chargeTariff: "Private", overrideWageTariff: "Use Role Wage" },
  { id: "l4", funder: "Direct (Client)", serviceName: "Private Tea Call", chargeTariff: "Private", overrideWageTariff: "Use Role Wage" },
  { id: "l5", funder: "Direct (Client)", serviceName: "Private Evening Call - (Legacy Gen. Priv)", chargeTariff: "Private (Legacy Gen. Priv)", overrideWageTariff: "Use Role Wage" },
  { id: "l6", funder: "Direct (Client)", serviceName: "Private Morning Call - (Legacy Gen. Priv)", chargeTariff: "Private (Legacy Gen. Priv)", overrideWageTariff: "Use Role Wage" },
  { id: "l7", funder: "Direct (Client)", serviceName: "Private Lunch Call - (Legacy 19/20)", chargeTariff: "Private (Legacy 19/20)", overrideWageTariff: "Use Role Wage" },
  { id: "l8", funder: "Direct (Client)", serviceName: "Private Morning Call - (Legacy 19/20)", chargeTariff: "Private (Legacy 19/20)", overrideWageTariff: "Use Role Wage" },
  { id: "l9", funder: "Direct (Client)", serviceName: "Private Evening Call - (Legacy EM)", chargeTariff: "Private (Legacy EM)", overrideWageTariff: "Use Role Wage" },
  { id: "l10", funder: "Direct (Client)", serviceName: "Private Lunch Call - (Legacy EM)", chargeTariff: "Private (Legacy EM)", overrideWageTariff: "Use Role Wage" },
  { id: "l11", funder: "HWICB", serviceName: "CHC Day Call", chargeTariff: "CHC (HWICB)", overrideWageTariff: "Use Role Wage" },
  { id: "l12", funder: "HWICB", serviceName: "CHC Night Sitting", chargeTariff: "CHC Night Sitting (Awake)", overrideWageTariff: "Night Rate" },
  { id: "l13", funder: "Local Authority", serviceName: "Standard Domiciliary", chargeTariff: "LA Standard", overrideWageTariff: "Use Role Wage" },
  { id: "l14", funder: "Local Authority", serviceName: "Complex Care", chargeTariff: "LA Complex", overrideWageTariff: "Complex Rate" },
];

const PAGE_SIZE = 10;

function PanelHeader({
  title,
  onAdd,
  helpText,
}: {
  title: string;
  onAdd: () => void;
  helpText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-t-lg">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={onAdd}
          className="h-7 px-2 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="h-6 w-6 rounded-full inline-flex items-center justify-center hover:bg-primary-foreground/15"
              aria-label="Help"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <p className="text-xs">{helpText}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function Pagination({
  page,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
      <span>
        Showing {start} to {end} of {total} entries
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onPrev}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onNext}
          disabled={page >= maxPage}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function Tariffs() {
  const navigate = useNavigate();

  const [tariffs, setTariffs] = useState<ChargeTariff[]>(initialTariffs);
  const [links, setLinks] = useState<FunderLink[]>(initialLinks);

  const [tariffSearch, setTariffSearch] = useState("");
  const [linkSearch, setLinkSearch] = useState("");
  const [tariffPage, setTariffPage] = useState(1);
  const [linkPage, setLinkPage] = useState(1);

  // Add tariff dialog
  const [addTariffOpen, setAddTariffOpen] = useState(false);
  const [newTariffName, setNewTariffName] = useState("");

  // Add link dialog
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [newLink, setNewLink] = useState<Omit<FunderLink, "id">>({
    funder: "",
    serviceName: "",
    chargeTariff: "",
    overrideWageTariff: "Use Role Wage",
  });

  // View tariff
  const [viewTariff, setViewTariff] = useState<ChargeTariff | null>(null);

  const filteredTariffs = useMemo(
    () => tariffs.filter((t) => t.name.toLowerCase().includes(tariffSearch.toLowerCase())),
    [tariffs, tariffSearch],
  );
  const filteredLinks = useMemo(
    () =>
      links.filter(
        (l) =>
          l.funder.toLowerCase().includes(linkSearch.toLowerCase()) ||
          l.serviceName.toLowerCase().includes(linkSearch.toLowerCase()) ||
          l.chargeTariff.toLowerCase().includes(linkSearch.toLowerCase()),
      ),
    [links, linkSearch],
  );

  const pagedTariffs = filteredTariffs.slice((tariffPage - 1) * PAGE_SIZE, tariffPage * PAGE_SIZE);
  const pagedLinks = filteredLinks.slice((linkPage - 1) * PAGE_SIZE, linkPage * PAGE_SIZE);

  const handleAddTariff = () => {
    if (!newTariffName.trim()) {
      toast.error("Tariff name is required");
      return;
    }
    setTariffs((prev) => [...prev, { id: `t${Date.now()}`, name: newTariffName.trim() }]);
    toast.success(`Tariff "${newTariffName}" created`);
    setNewTariffName("");
    setAddTariffOpen(false);
  };

  const handleDuplicateTariff = (t: ChargeTariff) => {
    setTariffs((prev) => [...prev, { id: `t${Date.now()}`, name: `${t.name} (Copy)` }]);
    toast.success(`Duplicated "${t.name}"`);
  };

  const handleDeleteTariff = (t: ChargeTariff) => {
    setTariffs((prev) => prev.filter((x) => x.id !== t.id));
    toast.success(`Removed "${t.name}"`);
  };

  const handleAddLink = () => {
    if (!newLink.funder || !newLink.serviceName || !newLink.chargeTariff) {
      toast.error("All fields are required");
      return;
    }
    setLinks((prev) => [...prev, { id: `l${Date.now()}`, ...newLink }]);
    toast.success("Funder link created");
    setNewLink({ funder: "", serviceName: "", chargeTariff: "", overrideWageTariff: "Use Role Wage" });
    setAddLinkOpen(false);
  };

  const handleDeleteLink = (l: FunderLink) => {
    setLinks((prev) => prev.filter((x) => x.id !== l.id));
    toast.success("Link removed");
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b pb-3">
          <Button variant="default" size="sm" onClick={() => navigate("/invoicing")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Home
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">Invoicing And Wages Setup</h1>
          <div className="w-[88px]" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="invoicing" className="w-full">
          <TabsList className="bg-transparent p-0 h-auto border-b border-border w-full justify-start rounded-none gap-1">
            <TabsTrigger
              value="invoicing"
              className="data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:shadow-none rounded-b-none border border-transparent -mb-px px-4 py-2 text-sm"
            >
              Invoicing
            </TabsTrigger>
            <TabsTrigger
              value="wages"
              className="data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:shadow-none rounded-b-none border border-transparent -mb-px px-4 py-2 text-sm"
              onClick={() => navigate("/invoicing/wages")}
            >
              Wages
            </TabsTrigger>
            <TabsTrigger
              value="wage-master"
              className="data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:shadow-none rounded-b-none border border-transparent -mb-px px-4 py-2 text-sm"
            >
              Wage Master Costs
            </TabsTrigger>
            <TabsTrigger
              value="invoice-master"
              className="data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:shadow-none rounded-b-none border border-transparent -mb-px px-4 py-2 text-sm"
            >
              Invoice Master Costs
            </TabsTrigger>
            <TabsTrigger
              value="alt-wage"
              className="data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:shadow-none rounded-b-none border border-transparent -mb-px px-4 py-2 text-sm"
            >
              Alternative Wage Tariffs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoicing" className="mt-4 space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Charge Tariffs Panel */}
              <div className="border rounded-lg overflow-hidden bg-card">
                <PanelHeader
                  title="Charge Tariffs"
                  onAdd={() => setAddTariffOpen(true)}
                  helpText="Charge tariffs define how clients are billed for each service. Click 'Add' to create a new tariff with rates per service type and time band."
                />
                <div className="p-4 flex justify-end">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="tariff-search" className="text-xs text-muted-foreground">
                      Search:
                    </Label>
                    <Input
                      id="tariff-search"
                      value={tariffSearch}
                      onChange={(e) => {
                        setTariffSearch(e.target.value);
                        setTariffPage(1);
                      }}
                      className="h-8 w-48"
                    />
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-12 text-center">
                        <button className="inline-flex items-center gap-1 text-xs">
                          <Eye className="h-3.5 w-3.5" />
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="w-12 text-center">
                        <Copy className="h-3.5 w-3.5 inline" />
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 text-xs font-semibold">
                          Name <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="w-20 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedTariffs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No tariffs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedTariffs.map((t) => (
                        <TableRow key={t.id} className="group">
                          <TableCell className="text-center">
                            <button
                              onClick={() => navigate(`/invoicing/tariffs/${encodeURIComponent(t.name)}`)}
                              className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-accent"
                              aria-label="View"
                            >
                              <Eye className="h-4 w-4 text-primary" />
                            </button>
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => handleDuplicateTariff(t)}
                              className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-primary/10"
                              aria-label="Duplicate"
                            >
                              <Copy className="h-4 w-4 text-primary" />
                            </button>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => navigate(`/invoicing/tariffs/${encodeURIComponent(t.name)}`)}
                              className="text-primary hover:underline text-sm font-medium"
                            >
                              {t.name}
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex gap-1">
                              <button
                                onClick={() => navigate(`/invoicing/tariffs/${encodeURIComponent(t.name)}`)}
                                className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted"
                                aria-label="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTariff(t)}
                                className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-destructive/10 text-destructive"
                                aria-label="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <Pagination
                  page={tariffPage}
                  total={filteredTariffs.length}
                  onPrev={() => setTariffPage((p) => Math.max(1, p - 1))}
                  onNext={() =>
                    setTariffPage((p) =>
                      Math.min(Math.ceil(filteredTariffs.length / PAGE_SIZE), p + 1),
                    )
                  }
                />
              </div>

              {/* Funder Links Panel */}
              <div className="border rounded-lg overflow-hidden bg-card">
                <PanelHeader
                  title="Link Funders To Charge Tariffs And Service Types"
                  onAdd={() => setAddLinkOpen(true)}
                  helpText="Map a funder + service combination to a charge tariff. Optionally override the wage tariff used to pay carers for this service."
                />
                <div className="p-4 flex justify-end">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="link-search" className="text-xs text-muted-foreground">
                      Search:
                    </Label>
                    <Input
                      id="link-search"
                      value={linkSearch}
                      onChange={(e) => {
                        setLinkSearch(e.target.value);
                        setLinkPage(1);
                      }}
                      className="h-8 w-48"
                    />
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>
                        <button className="inline-flex items-center gap-1 text-xs font-semibold">
                          Funder <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 text-xs font-semibold">
                          Service Name <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 text-xs font-semibold">
                          Charge Tariff <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 text-xs font-semibold">
                          Override Wage Tariff <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedLinks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No links found
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedLinks.map((l) => (
                        <TableRow key={l.id} className="group">
                          <TableCell className="text-sm">{l.funder}</TableCell>
                          <TableCell>
                            <button
                              onClick={() => toast.info(`Service: ${l.serviceName}`)}
                              className="text-primary hover:underline text-sm"
                            >
                              {l.serviceName}
                            </button>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => navigate(`/invoicing/tariffs/${encodeURIComponent(l.chargeTariff)}`)}
                              className="text-primary hover:underline text-sm"
                            >
                              {l.chargeTariff}
                            </button>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {l.overrideWageTariff}
                          </TableCell>
                          <TableCell className="text-right">
                            <button
                              onClick={() => handleDeleteLink(l)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 inline-flex items-center justify-center rounded hover:bg-destructive/10 text-destructive"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <Pagination
                  page={linkPage}
                  total={filteredLinks.length}
                  onPrev={() => setLinkPage((p) => Math.max(1, p - 1))}
                  onNext={() =>
                    setLinkPage((p) =>
                      Math.min(Math.ceil(filteredLinks.length / PAGE_SIZE), p + 1),
                    )
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="wage-master" className="mt-4">
            <div className="border rounded-lg p-10 text-center text-sm text-muted-foreground bg-card">
              Wage Master Costs configuration — coming soon.
            </div>
          </TabsContent>
          <TabsContent value="invoice-master" className="mt-4">
            <div className="border rounded-lg p-10 text-center text-sm text-muted-foreground bg-card">
              Invoice Master Costs configuration — coming soon.
            </div>
          </TabsContent>
          <TabsContent value="alt-wage" className="mt-4">
            <div className="border rounded-lg p-10 text-center text-sm text-muted-foreground bg-card">
              Alternative Wage Tariffs — coming soon.
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Tariff dialog */}
      <Dialog open={addTariffOpen} onOpenChange={setAddTariffOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Charge Tariff</DialogTitle>
            <DialogDescription>
              Create a new charge tariff. You can configure rates and bands after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="tariff-name">Tariff name</Label>
            <Input
              id="tariff-name"
              value={newTariffName}
              onChange={(e) => setNewTariffName(e.target.value)}
              placeholder="e.g. Private (2026)"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTariffOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTariff}>Create tariff</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Link dialog */}
      <Dialog open={addLinkOpen} onOpenChange={setAddLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Funder To Tariff</DialogTitle>
            <DialogDescription>
              Map a funder and service to a charge tariff and (optionally) override the wage tariff.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Funder</Label>
              <Select
                value={newLink.funder}
                onValueChange={(v) => setNewLink((p) => ({ ...p, funder: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select funder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct (Client)">Direct (Client)</SelectItem>
                  <SelectItem value="HWICB">HWICB</SelectItem>
                  <SelectItem value="Local Authority">Local Authority</SelectItem>
                  <SelectItem value="NHS">NHS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Service name</Label>
              <Input
                value={newLink.serviceName}
                onChange={(e) => setNewLink((p) => ({ ...p, serviceName: e.target.value }))}
                placeholder="e.g. Private Morning Call"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Charge tariff</Label>
              <Select
                value={newLink.chargeTariff}
                onValueChange={(v) => setNewLink((p) => ({ ...p, chargeTariff: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tariff" />
                </SelectTrigger>
                <SelectContent>
                  {tariffs.map((t) => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Override wage tariff</Label>
              <Select
                value={newLink.overrideWageTariff}
                onValueChange={(v) => setNewLink((p) => ({ ...p, overrideWageTariff: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Use Role Wage">Use Role Wage</SelectItem>
                  <SelectItem value="Night Rate">Night Rate</SelectItem>
                  <SelectItem value="Complex Rate">Complex Rate</SelectItem>
                  <SelectItem value="Weekend Rate">Weekend Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLinkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLink}>Create link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View tariff dialog */}
      <Dialog open={!!viewTariff} onOpenChange={(o) => !o && setViewTariff(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewTariff?.name}</DialogTitle>
            <DialogDescription>
              Charge bands for this tariff. Rates apply per hour unless stated otherwise.
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Band</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Rate (£/hr)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Weekday Day</TableCell>
                  <TableCell>Mon–Fri</TableCell>
                  <TableCell>07:00 – 22:00</TableCell>
                  <TableCell className="text-right">£28.50</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Weekday Night</TableCell>
                  <TableCell>Mon–Fri</TableCell>
                  <TableCell>22:00 – 07:00</TableCell>
                  <TableCell className="text-right">£32.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Weekend</TableCell>
                  <TableCell>Sat–Sun</TableCell>
                  <TableCell>All day</TableCell>
                  <TableCell className="text-right">£34.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bank Holiday</TableCell>
                  <TableCell>Statutory</TableCell>
                  <TableCell>All day</TableCell>
                  <TableCell className="text-right">£42.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTariff(null)}>
              Close
            </Button>
            <Button onClick={() => toast.success("Tariff saved")}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
