import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

type FunderKind = "direct" | "authority";

type FunderForm = {
  kind: FunderKind;
  name: string;
  client: string;
  isActive: "Yes" | "No";
  externalRef: string;
  internalRef: string;
  reference: string;
  address1: string;
  address2: string;
  address3: string;
  town: string;
  county: string;
  postcode: string;
  email: string;
  shortVisitOffsetMins: number;
  shortVisitValuePct: string;
  useGlobalBankHolidays: "Yes" | "No";
  useGlobalInvoiceSettings: "Yes" | "No";
  useDefaultBankAccount: "Yes" | "No";
};

const COUNTIES = [
  "Worcestershire",
  "Herefordshire",
  "Gloucestershire",
  "Warwickshire",
  "Shropshire",
  "Other",
];

const CLIENT_OPTIONS = [
  "Davies A.",
  "Matthews A.",
  "May A.",
  "Taylor A.",
  "Mason A.",
  "Parker B.",
  "Harris B.",
  "Doncaster B.",
  "Prince B.",
  "Cox B.",
];

function FieldRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-12 gap-3 items-center py-1.5">
      <Label className="col-span-4 text-sm text-right pr-2 font-medium">
        {required && <span className="text-destructive mr-0.5">*</span>}
        {label}
      </Label>
      <div className="col-span-8">{children}</div>
    </div>
  );
}

export default function FunderProfile() {
  const navigate = useNavigate();
  const { funderName: rawName } = useParams();
  const funderName = decodeURIComponent(rawName ?? "(Direct) A Davies");
  const isAuthority = !funderName.toLowerCase().startsWith("(direct)");

  const initial = useMemo<FunderForm>(() => {
    const cleanName = funderName.replace(/^\(Direct\)\s*/i, "");
    return {
      kind: isAuthority ? "authority" : "direct",
      name: funderName,
      client: cleanName ? `${cleanName.split(" ").reverse().join(" ")}` : "",
      isActive: "Yes",
      externalRef: "",
      internalRef: "",
      reference: "0",
      address1: "21 HAWTHORN ROAD",
      address2: "",
      address3: "",
      town: "EVESHAM",
      county: "Worcestershire",
      postcode: "WR11 1HP",
      email: "",
      shortVisitOffsetMins: 0,
      shortVisitValuePct: "",
      useGlobalBankHolidays: "Yes",
      useGlobalInvoiceSettings: "Yes",
      useDefaultBankAccount: "Yes",
    };
  }, [funderName, isAuthority]);

  const [form, setForm] = useState<FunderForm>(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const update = <K extends keyof FunderForm>(key: K, value: FunderForm[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const validate = () => {
    if (!form.name.trim()) return "Funder name is required";
    if (form.kind === "direct" && !form.client.trim()) return "Client is required";
    if (!form.address1.trim()) return "Address 1 is required";
    if (!form.town.trim()) return "Town/City is required";
    if (!form.county.trim()) return "County is required";
    if (form.shortVisitOffsetMins === undefined || isNaN(Number(form.shortVisitOffsetMins)))
      return "Short visit offset is required";
    if (!form.shortVisitValuePct.toString().trim()) return "Short visit value is required";
    return null;
  };

  const handleUpdate = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    toast.success(`Funder "${form.name}" updated`);
  };

  const handleDelete = () => {
    setConfirmDelete(false);
    toast.success(`Funder "${form.name}" deleted`);
    navigate("/invoicing/funders");
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Top bar */}
        <div>
          <Button size="sm" onClick={() => navigate("/invoicing/funders")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Button>
        </div>

        {/* Card */}
        <section className="border-2 border-primary/60 rounded-md bg-card overflow-hidden">
          <header className="flex items-center justify-between px-4 py-2.5 border-b">
            <h2 className="text-sm font-semibold">
              Funder - <span className="text-primary">{form.name}</span>
            </h2>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              className="h-8"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Funder
            </Button>
          </header>

          <div className="p-6 max-w-3xl mx-auto">
            <FieldRow
              label={form.kind === "direct" ? "Direct Funder Name" : "Authority Funder Name"}
              required
            >
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="border-primary/70 focus-visible:ring-primary"
              />
            </FieldRow>

            {form.kind === "direct" && (
              <FieldRow label="Client" required>
                <Select value={form.client} onValueChange={(v) => update("client", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    {form.client && !CLIENT_OPTIONS.includes(form.client) && (
                      <SelectItem value={form.client}>{form.client}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FieldRow>
            )}

            <FieldRow label="Is Active">
              <Select
                value={form.isActive}
                onValueChange={(v) => update("isActive", v as "Yes" | "No")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="External Ref">
              <Input
                value={form.externalRef}
                onChange={(e) => update("externalRef", e.target.value)}
                placeholder="A reference given to you by the funder if any exists"
              />
            </FieldRow>

            <FieldRow label="Internal Ref">
              <Input
                value={form.internalRef}
                onChange={(e) => update("internalRef", e.target.value)}
                placeholder="A reference you hold internally for this funder if any exists"
              />
            </FieldRow>

            <FieldRow label="Reference">
              <Input
                value={form.reference}
                onChange={(e) => update("reference", e.target.value)}
              />
            </FieldRow>

            <FieldRow label="Address 1" required>
              <Input
                value={form.address1}
                onChange={(e) => update("address1", e.target.value)}
              />
            </FieldRow>

            <FieldRow label="Address 2">
              <Input
                value={form.address2}
                onChange={(e) => update("address2", e.target.value)}
              />
            </FieldRow>

            <FieldRow label="Address 3">
              <Input
                value={form.address3}
                onChange={(e) => update("address3", e.target.value)}
              />
            </FieldRow>

            <FieldRow label="Town/City" required>
              <Input value={form.town} onChange={(e) => update("town", e.target.value)} />
            </FieldRow>

            <FieldRow label="County" required>
              <Select value={form.county} onValueChange={(v) => update("county", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select county" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="Postcode">
              <Input
                value={form.postcode}
                onChange={(e) => update("postcode", e.target.value.toUpperCase())}
              />
            </FieldRow>

            <FieldRow label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="Funder email address"
              />
            </FieldRow>

            <FieldRow label="Funder Short Visit Offset (Mins)" required>
              <Input
                type="number"
                value={form.shortVisitOffsetMins}
                onChange={(e) =>
                  update("shortVisitOffsetMins", parseInt(e.target.value || "0", 10))
                }
              />
            </FieldRow>

            <FieldRow label="Funder Short Visit Value (%)" required>
              <Input
                value={form.shortVisitValuePct}
                onChange={(e) => update("shortVisitValuePct", e.target.value)}
                placeholder="e.g. 50"
              />
            </FieldRow>

            <FieldRow label="Use Global Bank Holidays">
              <Select
                value={form.useGlobalBankHolidays}
                onValueChange={(v) => update("useGlobalBankHolidays", v as "Yes" | "No")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="Use Global Invoice Settings" required>
              <Select
                value={form.useGlobalInvoiceSettings}
                onValueChange={(v) => update("useGlobalInvoiceSettings", v as "Yes" | "No")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="Use Default bank Account On Invoice" required>
              <Select
                value={form.useDefaultBankAccount}
                onValueChange={(v) => update("useDefaultBankAccount", v as "Yes" | "No")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>

            <div className="pt-5">
              <Button
                onClick={handleUpdate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Save className="h-4 w-4 mr-1.5" /> Update
              </Button>
            </div>
          </div>
        </section>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this funder?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{form.name}&quot; will be removed from your funders list. Any linked services
              will need to be reassigned. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete funder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
