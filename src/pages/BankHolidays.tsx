import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Plus, Copy, Pencil, Trash2, Users, Minus } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

type Holiday = {
  id: string;
  name: string;
  date: string; // dd/mm/yyyy
  rateMultiplier: number;
  rateBase: string;
  groups: string[];
  repeated: boolean;
};

type Section = "client" | "staff";

const baseHolidays: Omit<Holiday, "id" | "repeated">[] = [
  { name: "New Year's Day", date: "01/01/2024", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Christmas Day", date: "25/12/2024", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Boxing Day", date: "26/12/2024", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Good Friday", date: "29/03/2024", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Easter Monday", date: "01/04/2024", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "May Bank Holiday", date: "06/05/2024", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Spring Bank Holiday", date: "27/05/2024", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Summer Bank Holiday", date: "26/08/2024", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "New Year's Day", date: "01/01/2025", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Good Friday", date: "18/04/2025", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Easter Monday", date: "21/04/2025", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "May Bank Holiday", date: "05/05/2025", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Spring Bank Holiday", date: "26/05/2025", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Summer Bank Holiday", date: "25/08/2025", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Christmas Day", date: "25/12/2025", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Boxing day", date: "26/12/2025", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "New Years day", date: "01/01/2026", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Good Friday", date: "03/04/2026", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Easter Monday", date: "06/04/2026", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "May Bank Holiday", date: "04/05/2026", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Spring Bank Holiday", date: "25/05/2026", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Summer Bank Holiday", date: "31/08/2026", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
];

const repeated: Omit<Holiday, "id" | "repeated">[] = [
  { name: "Christmas Day", date: "25/12/2026", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "Boxing Day", date: "26/12/2026", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
  { name: "New Year's Day", date: "01/01/2027", rateMultiplier: 1.5, rateBase: "hourly rate", groups: [] },
];

const seed = (): Holiday[] => [
  ...baseHolidays.map((h, i) => ({ ...h, id: `c-${i}`, repeated: false })),
  ...repeated.map((h, i) => ({ ...h, id: `cr-${i}`, repeated: true })),
];

const seedStaff = (): Holiday[] => [
  ...baseHolidays.map((h, i) => ({ ...h, id: `s-${i}`, repeated: false })),
  ...repeated.map((h, i) => ({ ...h, id: `sr-${i}`, repeated: true })),
];

const ALL_GROUPS = ["Group A", "Group B", "Group C", "Private Pay", "Authority"];

type FormState = {
  name: string;
  date: string;
  rateMultiplier: string;
  rateBase: string;
  groups: string[];
  repeated: boolean;
};

const emptyForm: FormState = {
  name: "",
  date: "",
  rateMultiplier: "1.5",
  rateBase: "hourly rate",
  groups: [],
  repeated: false,
};

function HolidayTable({
  rows,
  onDuplicate,
  onEdit,
  onDelete,
  onGroups,
}: {
  rows: Holiday[];
  onDuplicate: (h: Holiday) => void;
  onEdit: (h: Holiday) => void;
  onDelete: (h: Holiday) => void;
  onGroups: (h: Holiday) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28" />
          <TableHead>Name</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Rate</TableHead>
          <TableHead>Groups</TableHead>
          <TableHead>Repeated?</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((h) => (
          <TableRow key={h.id} className="hover:bg-muted/40">
            <TableCell className="py-2">
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                  title="Duplicate"
                  onClick={() => onDuplicate(h)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  title="Edit"
                  onClick={() => onEdit(h)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete"
                  onClick={() => onDelete(h)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  title="Manage groups"
                  onClick={() => onGroups(h)}
                >
                  <Users className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
            <TableCell className="text-sky-600 text-sm">{h.name}</TableCell>
            <TableCell className="text-sky-600 text-sm">{h.date}</TableCell>
            <TableCell className="text-sky-600 text-sm">
              {h.rateMultiplier} x ( {h.rateBase} )
            </TableCell>
            <TableCell className="text-sky-600 text-sm">{h.groups.length}</TableCell>
            <TableCell className="text-sky-600 text-sm">{h.repeated ? "Yes" : "No"}</TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
              No bank holidays defined.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default function BankHolidays() {
  const navigate = useNavigate();
  const [client, setClient] = useState<Holiday[]>(seed());
  const [staff, setStaff] = useState<Holiday[]>(seedStaff());
  const [clientCollapsed, setClientCollapsed] = useState(false);
  const [staffCollapsed, setStaffCollapsed] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSection, setEditorSection] = useState<Section>("client");
  const [editorMode, setEditorMode] = useState<"add" | "edit">("add");
  const [editorId, setEditorId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [groupsOpen, setGroupsOpen] = useState(false);
  const [groupsSection, setGroupsSection] = useState<Section>("client");
  const [groupsId, setGroupsId] = useState<string | null>(null);
  const [groupsDraft, setGroupsDraft] = useState<string[]>([]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSection, setDeleteSection] = useState<Section>("client");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [addPickerOpen, setAddPickerOpen] = useState(false);

  const setter = (s: Section) => (s === "client" ? setClient : setStaff);
  const list = (s: Section) => (s === "client" ? client : staff);

  const openAdd = (section: Section) => {
    setEditorSection(section);
    setEditorMode("add");
    setEditorId(null);
    setForm(emptyForm);
    setEditorOpen(true);
    setAddPickerOpen(false);
  };

  const openEdit = (section: Section, h: Holiday) => {
    setEditorSection(section);
    setEditorMode("edit");
    setEditorId(h.id);
    setForm({
      name: h.name,
      date: h.date,
      rateMultiplier: String(h.rateMultiplier),
      rateBase: h.rateBase,
      groups: h.groups,
      repeated: h.repeated,
    });
    setEditorOpen(true);
  };

  const duplicate = (section: Section, h: Holiday) => {
    const newRow: Holiday = { ...h, id: `${section}-${Date.now()}` };
    setter(section)((prev) => [newRow, ...prev]);
    toast({ title: "Holiday duplicated", description: `${h.name} duplicated.` });
  };

  const askDelete = (section: Section, h: Holiday) => {
    setDeleteSection(section);
    setDeleteId(h.id);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setter(deleteSection)((prev) => prev.filter((x) => x.id !== deleteId));
    toast({ title: "Holiday deleted" });
    setDeleteOpen(false);
    setDeleteId(null);
  };

  const openGroups = (section: Section, h: Holiday) => {
    setGroupsSection(section);
    setGroupsId(h.id);
    setGroupsDraft(h.groups);
    setGroupsOpen(true);
  };

  const saveGroups = () => {
    if (!groupsId) return;
    setter(groupsSection)((prev) =>
      prev.map((x) => (x.id === groupsId ? { ...x, groups: groupsDraft } : x)),
    );
    toast({ title: "Groups updated" });
    setGroupsOpen(false);
  };

  const saveEditor = () => {
    if (!form.name.trim() || !form.date.trim()) {
      toast({ title: "Name and date are required", variant: "destructive" });
      return;
    }
    const mult = parseFloat(form.rateMultiplier) || 1;
    if (editorMode === "add") {
      const row: Holiday = {
        id: `${editorSection}-${Date.now()}`,
        name: form.name,
        date: form.date,
        rateMultiplier: mult,
        rateBase: form.rateBase,
        groups: form.groups,
        repeated: form.repeated,
      };
      setter(editorSection)((prev) => [row, ...prev]);
      toast({ title: "Bank holiday added" });
    } else if (editorId) {
      setter(editorSection)((prev) =>
        prev.map((x) =>
          x.id === editorId
            ? {
                ...x,
                name: form.name,
                date: form.date,
                rateMultiplier: mult,
                rateBase: form.rateBase,
                groups: form.groups,
                repeated: form.repeated,
              }
            : x,
        ),
      );
      toast({ title: "Bank holiday updated" });
    }
    setEditorOpen(false);
  };

  const groupsTitle = useMemo(() => {
    const row = list(groupsSection).find((x) => x.id === groupsId);
    return row ? `Groups – ${row.name} (${row.date})` : "Groups";
  }, [groupsId, groupsSection, client, staff]);

  return (
    <AppLayout>
      <div className="flex h-full flex-col bg-muted/30">
        {/* Header */}
        <div className="flex items-center border-b bg-background px-4 py-2">
          <Button
            size="sm"
            className="bg-sky-500 hover:bg-sky-600 text-white gap-1"
            onClick={() => navigate("/")}
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Button>
          <h1 className="flex-1 text-center text-lg font-medium">Bank Holidays</h1>
          <Button
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1"
            onClick={() => setAddPickerOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Bank Holiday
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Client section */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
                <CardTitle className="text-sm font-semibold">
                  Client Bank Holiday Charges
                </CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setClientCollapsed((v) => !v)}
                >
                  {clientCollapsed ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                </Button>
              </CardHeader>
              {!clientCollapsed && (
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground italic mb-3">
                    If you charge clients different rates for bank holidays please enter the
                    dates in this section
                  </p>
                  <HolidayTable
                    rows={client}
                    onDuplicate={(h) => duplicate("client", h)}
                    onEdit={(h) => openEdit("client", h)}
                    onDelete={(h) => askDelete("client", h)}
                    onGroups={(h) => openGroups("client", h)}
                  />
                </CardContent>
              )}
            </Card>

            {/* Staff section */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
                <CardTitle className="text-sm font-semibold">
                  Staff Bank Holiday Payments (Wages)
                </CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setStaffCollapsed((v) => !v)}
                >
                  {staffCollapsed ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                </Button>
              </CardHeader>
              {!staffCollapsed && (
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground italic mb-3">
                    If you pay staff different rates on bank holidays please enter them here.
                  </p>
                  <HolidayTable
                    rows={staff}
                    onDuplicate={(h) => duplicate("staff", h)}
                    onEdit={(h) => openEdit("staff", h)}
                    onDelete={(h) => askDelete("staff", h)}
                    onGroups={(h) => openGroups("staff", h)}
                  />
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Add picker */}
      <Dialog open={addPickerOpen} onOpenChange={setAddPickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Bank Holiday</DialogTitle>
            <DialogDescription>Where should this bank holiday be added?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button onClick={() => openAdd("client")} className="bg-sky-500 hover:bg-sky-600 text-white">
              Client Bank Holiday Charges
            </Button>
            <Button onClick={() => openAdd("staff")} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              Staff Bank Holiday Payments
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Editor */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editorMode === "add" ? "Add" : "Edit"} Bank Holiday –{" "}
              {editorSection === "client" ? "Client Charges" : "Staff Payments"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Christmas Day"
              />
            </div>
            <div className="space-y-1">
              <Label>Date (dd/mm/yyyy)</Label>
              <Input
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                placeholder="25/12/2026"
              />
            </div>
            <div className="space-y-1">
              <Label>Rate Multiplier</Label>
              <Input
                type="number"
                step="0.05"
                value={form.rateMultiplier}
                onChange={(e) => setForm({ ...form, rateMultiplier: e.target.value })}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Rate Base</Label>
              <Select
                value={form.rateBase}
                onValueChange={(v) => setForm({ ...form, rateBase: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly rate">hourly rate</SelectItem>
                  <SelectItem value="daily rate">daily rate</SelectItem>
                  <SelectItem value="visit rate">visit rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded border p-2 sm:col-span-2">
              <Label>Repeated annually?</Label>
              <Switch
                checked={form.repeated}
                onCheckedChange={(v) => setForm({ ...form, repeated: v })}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Apply to groups</Label>
              <div className="grid grid-cols-2 gap-2 rounded border p-2">
                {ALL_GROUPS.map((g) => {
                  const checked = form.groups.includes(g);
                  return (
                    <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          setForm({
                            ...form,
                            groups: v
                              ? [...form.groups, g]
                              : form.groups.filter((x) => x !== g),
                          });
                        }}
                      />
                      {g}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={saveEditor}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Groups dialog */}
      <Dialog open={groupsOpen} onOpenChange={setGroupsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{groupsTitle}</DialogTitle>
            <DialogDescription>
              Select which groups this bank holiday rate applies to.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 rounded border p-3">
            {ALL_GROUPS.map((g) => {
              const checked = groupsDraft.includes(g);
              return (
                <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => {
                      setGroupsDraft(
                        v ? [...groupsDraft, g] : groupsDraft.filter((x) => x !== g),
                      );
                    }}
                  />
                  {g}
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupsOpen(false)}>Cancel</Button>
            <Button onClick={saveGroups}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bank holiday?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The holiday will be removed from this section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
