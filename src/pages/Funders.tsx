import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type FunderStatus = "Active" | "Pending" | "Inactive" | "Cancelled";

type AuthorityFunder = {
  id: string;
  name: string;
  address: string;
  reference: string;
  status: FunderStatus;
};

type DirectFunder = {
  id: string;
  funderName: string;
  clientName: string;
  address: string;
  reference: string;
  status: FunderStatus;
};

const initialAuthority: AuthorityFunder[] = [
  {
    id: "a1",
    name: "NHS Herefordshire and Worcestershire ICB",
    address: "QGH PAYABLES N245 NHS SHARED FINANCIAL SERVICES P O BOX 312 LEEDS LS11 1HP",
    reference: "ICB-2026-001",
    status: "Active",
  },
  {
    id: "a2",
    name: "Social Services",
    address: "ADULT AND COMMUNITY EXCHEQUER TEAM COUNTY HALL WORCESTER WR5 2NP",
    reference: "SS-WCC-014",
    status: "Active",
  },
];

const sampleClients = [
  "A Davies",
  "Angela Matthews",
  "Ann May",
  "Anthony Taylor",
  "Averill Mason",
  "Barbara Parker",
  "Berta Harris",
  "Betty Doncaster",
  "Brenda Prince",
  "Brian Cox",
  "Carol Singh",
  "David Owen",
  "Edith Brown",
  "Frank Wells",
  "Gloria Patel",
  "Harold Pike",
  "Iris Newman",
  "Jane Holt",
  "Kevin Foster",
  "Linda Reeve",
];

const sampleAddresses = [
  "21 HAWTHORN ROAD EVESHAM WR11 1HP",
  "7 WORCESTER ROAD EVESHAM WR11 4JU",
  "1 DOUGHMEADOW COTTAGES LAVERTON BROADWAY WR12 7NA",
  "NO 8 NEILSON PARK, DEFFORD ARMS UPTON ROAD DEFFORS WR8 9BD",
  "THE CROFT CROFT ROAD UPTON SNODSBURY UPTON SNODSURY WR7 4NS",
  "FLAT 23 HOMENASH HOUSE ST. GEORGES LANE NORTH WORCESTER WR1 1RG",
  "APARTMENT 24 THE AVENUE RICHMOND WOOD NORTON EVESHAM ROAD, WOOD NORTON EVESHAM WR11 4TY",
  "75 CRUMP WAY EVESHAM WR11 3JG",
  "28 COMER GARDENS WORCESTER WR2 6JH",
  "3A COTSWOLD MANOR COUNTRY PARK STRATFORD BRIDGE RIPPLE RIPPLE GL20 6HD",
];

const initialDirect: DirectFunder[] = sampleClients.map((c, i) => ({
  id: `d${i + 1}`,
  funderName: `(Direct) ${c}`,
  clientName: c,
  address: sampleAddresses[i % sampleAddresses.length],
  reference: "",
  status: i % 5 === 0 ? "Pending" : "Active",
}));

type SortKey = "name" | "address" | "reference";
type DirectSortKey = "funderName" | "clientName" | "address" | "reference";

export default function Funders() {
  const navigate = useNavigate();

  const [authority, setAuthority] = useState<AuthorityFunder[]>(initialAuthority);
  const [direct, setDirect] = useState<DirectFunder[]>(initialDirect);

  // Authority controls
  const [aSearch, setASearch] = useState("");
  const [aPage, setAPage] = useState(1);
  const [aPageSize, setAPageSize] = useState(10);
  const [aSort, setASort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });

  // Direct controls
  const [dSearch, setDSearch] = useState("");
  const [dPage, setDPage] = useState(1);
  const [dPageSize, setDPageSize] = useState(10);
  const [dSort, setDSort] = useState<{ key: DirectSortKey; dir: "asc" | "desc" }>({
    key: "funderName",
    dir: "asc",
  });

  // Dialogs
  const [authorityDialog, setAuthorityDialog] = useState<{
    open: boolean;
    funder: AuthorityFunder | null;
  }>({ open: false, funder: null });
  const [directDialog, setDirectDialog] = useState<{
    open: boolean;
    funder: DirectFunder | null;
  }>({ open: false, funder: null });
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "authority" | "direct";
    id: string;
    name: string;
  } | null>(null);
  const [authorityListOpen, setAuthorityListOpen] = useState(false);

  const sortIcon = <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-50" />;

const statusStyles: Record<FunderStatus, string> = {
  Active: "bg-success/15 text-success border-0",
  Pending: "bg-warning/15 text-warning border-0",
  Inactive: "bg-muted/15 text-muted-foreground border-0",
  Cancelled: "bg-destructive/15 text-destructive border-0",
};

  const filteredAuthority = useMemo(() => {
    const q = aSearch.toLowerCase();
    const list = authority.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q) ||
        f.reference.toLowerCase().includes(q),
    );
    list.sort((a, b) => {
      const av = a[aSort.key].toLowerCase();
      const bv = b[aSort.key].toLowerCase();
      const cmp = av.localeCompare(bv);
      return aSort.dir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [authority, aSearch, aSort]);

  const filteredDirect = useMemo(() => {
    const q = dSearch.toLowerCase();
    const list = direct.filter(
      (f) =>
        f.funderName.toLowerCase().includes(q) ||
        f.clientName.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q) ||
        f.reference.toLowerCase().includes(q),
    );
    list.sort((a, b) => {
      const av = a[dSort.key].toLowerCase();
      const bv = b[dSort.key].toLowerCase();
      const cmp = av.localeCompare(bv);
      return dSort.dir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [direct, dSearch, dSort]);

  const aTotalPages = Math.max(1, Math.ceil(filteredAuthority.length / aPageSize));
  const dTotalPages = Math.max(1, Math.ceil(filteredDirect.length / dPageSize));
  const pagedAuthority = filteredAuthority.slice((aPage - 1) * aPageSize, aPage * aPageSize);
  const pagedDirect = filteredDirect.slice((dPage - 1) * dPageSize, dPage * dPageSize);

  const toggleSort = <T extends string>(
    key: T,
    state: { key: T; dir: "asc" | "desc" },
    setter: (s: { key: T; dir: "asc" | "desc" }) => void,
  ) => {
    if (state.key === key) setter({ key, dir: state.dir === "asc" ? "desc" : "asc" });
    else setter({ key, dir: "asc" });
  };

  // Authority CRUD
  const openAddAuthority = () =>
    setAuthorityDialog({
      open: true,
      funder: { id: `a${Date.now()}`, name: "", address: "", reference: "" },
    });
  const openEditAuthority = (f: AuthorityFunder) =>
    setAuthorityDialog({ open: true, funder: { ...f } });

  const saveAuthority = () => {
    const f = authorityDialog.funder;
    if (!f) return;
    if (!f.name.trim()) {
      toast.error("Funder name is required");
      return;
    }
    setAuthority((prev) => {
      const exists = prev.some((x) => x.id === f.id);
      return exists ? prev.map((x) => (x.id === f.id ? f : x)) : [...prev, f];
    });
    toast.success(`Authority funder "${f.name}" saved`);
    setAuthorityDialog({ open: false, funder: null });
  };

  // Direct CRUD
  const openAddDirect = () =>
    setDirectDialog({
      open: true,
      funder: {
        id: `d${Date.now()}`,
        funderName: "",
        clientName: "",
        address: "",
        reference: "",
      },
    });
  const openEditDirect = (f: DirectFunder) =>
    setDirectDialog({ open: true, funder: { ...f } });

  const saveDirect = () => {
    const f = directDialog.funder;
    if (!f) return;
    if (!f.clientName.trim()) {
      toast.error("Client name is required");
      return;
    }
    const finalised: DirectFunder = {
      ...f,
      funderName: f.funderName.trim() || `(Direct) ${f.clientName.trim()}`,
    };
    setDirect((prev) => {
      const exists = prev.some((x) => x.id === finalised.id);
      return exists
        ? prev.map((x) => (x.id === finalised.id ? finalised : x))
        : [...prev, finalised];
    });
    toast.success(`Direct funder "${finalised.funderName}" saved`);
    setDirectDialog({ open: false, funder: null });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "authority") {
      setAuthority((p) => p.filter((x) => x.id !== confirmDelete.id));
    } else {
      setDirect((p) => p.filter((x) => x.id !== confirmDelete.id));
    }
    toast.success(`Removed "${confirmDelete.name}"`);
    setConfirmDelete(null);
  };

  const renderPagination = (
    page: number,
    totalPages: number,
    total: number,
    pageSize: number,
    setPage: (n: number) => void,
  ) => {
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    const pages: (number | "…")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3, 4, 5, "…", totalPages);
    }
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20 text-xs">
        <span className="text-muted-foreground">
          Showing {start} to {end} of {total} entries
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-3 w-3 mr-1" /> Previous
          </Button>
          {pages.map((p, idx) =>
            p === "…" ? (
              <span key={`e${idx}`} className="px-2 text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                size="sm"
                variant={p === page ? "default" : "outline"}
                className="h-7 w-7 p-0 text-xs"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ),
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Next <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b pb-3">
          <Button size="sm" onClick={() => navigate("/invoicing")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Home
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">Funders</h1>
          <Button
            size="sm"
            onClick={() => setAuthorityListOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Shield className="h-4 w-4 mr-1.5" /> Authority List
          </Button>
        </div>

        {/* Authority Funders */}
        <section className="border-2 border-primary/60 rounded-md bg-card overflow-hidden">
          <header className="flex items-center justify-between px-4 py-2.5 border-b">
            <h2 className="text-sm font-semibold">Authority Funders</h2>
            <Button
              size="sm"
              onClick={openAddAuthority}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add New Authority Funder
            </Button>
          </header>

          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-xs">
              <span>Show</span>
              <Select
                value={String(aPageSize)}
                onValueChange={(v) => {
                  setAPageSize(Number(v));
                  setAPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Search:</Label>
              <Input
                value={aSearch}
                onChange={(e) => {
                  setASearch(e.target.value);
                  setAPage(1);
                }}
                className="h-8 w-48"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>
                  <button
                    className="font-semibold text-xs inline-flex items-center"
                    onClick={() => toggleSort<SortKey>("name", aSort, setASort)}
                  >
                    Authority Name {sortIcon}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="font-semibold text-xs inline-flex items-center"
                    onClick={() => toggleSort<SortKey>("address", aSort, setASort)}
                  >
                    Address {sortIcon}
                  </button>
                </TableHead>
                <TableHead className="w-40">
                  <button
                    className="font-semibold text-xs inline-flex items-center"
                    onClick={() => toggleSort<SortKey>("reference", aSort, setASort)}
                  >
                    Reference {sortIcon}
                  </button>
                </TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedAuthority.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No authority funders found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedAuthority.map((f) => (
                  <TableRow key={f.id} className="group">
                    <TableCell className="text-sm">
                      <button
                        onClick={() => navigate(`/invoicing/funders/${encodeURIComponent(f.name)}`)}
                        className="text-primary hover:underline text-left"
                      >
                        {f.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-foreground/80">{f.address}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {f.reference || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusStyles[f.status]} text-xs font-semibold`}>
                        {f.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex gap-1">
                        <button
                          onClick={() => openEditAuthority(f)}
                          className="h-7 w-7 inline-flex items-center justify-center rounded text-orange-500 hover:bg-orange-500/10"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmDelete({ type: "authority", id: f.id, name: f.name })
                          }
                          className="h-7 w-7 inline-flex items-center justify-center rounded text-destructive hover:bg-destructive/10"
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

          {renderPagination(aPage, aTotalPages, filteredAuthority.length, aPageSize, setAPage)}
        </section>

        {/* Direct Funders */}
        <section className="border-2 border-primary/60 rounded-md bg-card overflow-hidden">
          <header className="flex items-center justify-between px-4 py-2.5 border-b">
            <h2 className="text-sm font-semibold">Direct Funders</h2>
            <Button
              size="sm"
              onClick={openAddDirect}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Direct Funder
            </Button>
          </header>

          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-xs">
              <span>Show</span>
              <Select
                value={String(dPageSize)}
                onValueChange={(v) => {
                  setDPageSize(Number(v));
                  setDPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Search:</Label>
              <Input
                value={dSearch}
                onChange={(e) => {
                  setDSearch(e.target.value);
                  setDPage(1);
                }}
                className="h-8 w-48"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>
                  <button
                    className="font-semibold text-xs inline-flex items-center"
                    onClick={() =>
                      toggleSort<DirectSortKey>("funderName", dSort, setDSort)
                    }
                  >
                    Funder Name {sortIcon}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="font-semibold text-xs inline-flex items-center"
                    onClick={() =>
                      toggleSort<DirectSortKey>("clientName", dSort, setDSort)
                    }
                  >
                    Client Name {sortIcon}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="font-semibold text-xs inline-flex items-center"
                    onClick={() => toggleSort<DirectSortKey>("address", dSort, setDSort)}
                  >
                    Address {sortIcon}
                  </button>
                </TableHead>
                <TableHead className="w-40">
                  <button
                    className="font-semibold text-xs inline-flex items-center"
                    onClick={() =>
                      toggleSort<DirectSortKey>("reference", dSort, setDSort)
                    }
                  >
                    Reference {sortIcon}
                  </button>
                </TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedDirect.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No direct funders found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedDirect.map((f) => (
                  <TableRow key={f.id} className="group">
                    <TableCell className="text-sm">
                      <button
                        onClick={() => navigate(`/invoicing/funders/${encodeURIComponent(f.funderName)}`)}
                        className="text-primary hover:underline text-left"
                      >
                        {f.funderName}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">{f.clientName}</TableCell>
                    <TableCell className="text-sm text-foreground/80">{f.address}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {f.reference || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusStyles[f.status]} text-xs font-semibold`}>
                        {f.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex gap-1">
                        <button
                          onClick={() => openEditDirect(f)}
                          className="h-7 w-7 inline-flex items-center justify-center rounded text-orange-500 hover:bg-orange-500/10"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmDelete({ type: "direct", id: f.id, name: f.funderName })
                          }
                          className="h-7 w-7 inline-flex items-center justify-center rounded text-destructive hover:bg-destructive/10"
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

          {renderPagination(dPage, dTotalPages, filteredDirect.length, dPageSize, setDPage)}
        </section>
      </div>

      {/* Authority funder add/edit dialog */}
      <Dialog
        open={authorityDialog.open}
        onOpenChange={(o) => !o && setAuthorityDialog({ open: false, funder: null })}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {authority.some((x) => x.id === authorityDialog.funder?.id)
                ? "Edit Authority Funder"
                : "Add Authority Funder"}
            </DialogTitle>
            <DialogDescription>
              Authority funders are bodies (NHS / LA) that pay for care services.
            </DialogDescription>
          </DialogHeader>
          {authorityDialog.funder && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>
                  <span className="text-destructive">*</span> Authority name
                </Label>
                <Input
                  value={authorityDialog.funder.name}
                  onChange={(e) =>
                    setAuthorityDialog((p) => ({
                      ...p,
                      funder: p.funder ? { ...p.funder, name: e.target.value } : null,
                    }))
                  }
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Textarea
                  rows={3}
                  value={authorityDialog.funder.address}
                  onChange={(e) =>
                    setAuthorityDialog((p) => ({
                      ...p,
                      funder: p.funder ? { ...p.funder, address: e.target.value } : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reference</Label>
                <Input
                  value={authorityDialog.funder.reference}
                  onChange={(e) =>
                    setAuthorityDialog((p) => ({
                      ...p,
                      funder: p.funder ? { ...p.funder, reference: e.target.value } : null,
                    }))
                  }
                  placeholder="Optional internal reference"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAuthorityDialog({ open: false, funder: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={saveAuthority}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save funder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Direct funder add/edit dialog */}
      <Dialog
        open={directDialog.open}
        onOpenChange={(o) => !o && setDirectDialog({ open: false, funder: null })}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {direct.some((x) => x.id === directDialog.funder?.id)
                ? "Edit Direct Funder"
                : "Add Direct Funder"}
            </DialogTitle>
            <DialogDescription>
              Direct funders are clients who pay privately for their own care.
            </DialogDescription>
          </DialogHeader>
          {directDialog.funder && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>
                  <span className="text-destructive">*</span> Client name
                </Label>
                <Input
                  value={directDialog.funder.clientName}
                  onChange={(e) =>
                    setDirectDialog((p) => ({
                      ...p,
                      funder: p.funder ? { ...p.funder, clientName: e.target.value } : null,
                    }))
                  }
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Funder display name</Label>
                <Input
                  value={directDialog.funder.funderName}
                  onChange={(e) =>
                    setDirectDialog((p) => ({
                      ...p,
                      funder: p.funder ? { ...p.funder, funderName: e.target.value } : null,
                    }))
                  }
                  placeholder="(Direct) Client Name"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Address</Label>
                <Textarea
                  rows={3}
                  value={directDialog.funder.address}
                  onChange={(e) =>
                    setDirectDialog((p) => ({
                      ...p,
                      funder: p.funder ? { ...p.funder, address: e.target.value } : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Reference</Label>
                <Input
                  value={directDialog.funder.reference}
                  onChange={(e) =>
                    setDirectDialog((p) => ({
                      ...p,
                      funder: p.funder ? { ...p.funder, reference: e.target.value } : null,
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDirectDialog({ open: false, funder: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={saveDirect}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save funder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Authority list sheet */}
      <Sheet open={authorityListOpen} onOpenChange={setAuthorityListOpen}>
        <SheetContent className="w-[420px] sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Authority list</SheetTitle>
            <SheetDescription>
              Quick reference of all configured funding authorities.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {authority.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setAuthorityListOpen(false);
                  openEditAuthority(a);
                }}
                className="w-full text-left border rounded-md p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="font-medium text-sm">{a.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {a.address}
                </div>
                {a.reference && (
                  <div className="text-xs text-primary mt-1">Ref: {a.reference}</div>
                )}
              </button>
            ))}
            <Button
              onClick={() => {
                setAuthorityListOpen(false);
                openAddAuthority();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" /> New authority
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirm delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete funder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{confirmDelete?.name}&quot; from your funders list. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
