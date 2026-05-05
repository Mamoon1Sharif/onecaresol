import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Pencil, Upload } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

type InvoiceSettings = {
  invoiceLayout: string;
  defaultPaymentName: string;
  invoicePrefix: string;
  nextInvoiceNumber: string;
  includeTerms: boolean;
  includeBankingInfo: boolean;
  includeNotes: boolean;
  showFullServiceUserName: string;
  showInvoiceBreakdown: boolean;
  showBreakdownTableOnInvoice: boolean;
  showBreakdownWeekDayLayout: boolean;
  showStaffInBreakdown: string;
  showAmountRateBreakdown: boolean;
  toBePaidWithin: string;
  hoursFormat: string;
  showFullTariffNames: boolean;
  roundVisitCostAfterEachVisit: boolean;
  roundDownIf5: boolean;
  showEmail: boolean;
  showIcons: boolean;
  showServiceUserAddress: boolean;
};

type WageSettings = {
  wageLayout: string;
  showAmountRateBreakdown: boolean;
  showGrossPayBreakdown: boolean;
  showIndividualShiftBreakdown: boolean;
  showFullServiceUserName: string;
  enableSageExport: boolean;
  hoursFormat: string;
  minimumWageTopUp: boolean;
  roundVisitPayAfterEachVisit: boolean;
  roundDownIf5: boolean;
  groupTariffsByTimeBandRate: boolean;
  deductMileageFromWageTotals: boolean;
  payMileageOnClockedOrScheduled: string;
};

const initialInvoice: InvoiceSettings = {
  invoiceLayout: "Default Invoice",
  defaultPaymentName: "Domiciliary Care Services",
  invoicePrefix: "",
  nextInvoiceNumber: "29384",
  includeTerms: true,
  includeBankingInfo: true,
  includeNotes: false,
  showFullServiceUserName: "Show Full Service Member Name",
  showInvoiceBreakdown: true,
  showBreakdownTableOnInvoice: true,
  showBreakdownWeekDayLayout: true,
  showStaffInBreakdown: "Don't Show Staff Name",
  showAmountRateBreakdown: false,
  toBePaidWithin: "30",
  hoursFormat: "Default",
  showFullTariffNames: false,
  roundVisitCostAfterEachVisit: true,
  roundDownIf5: false,
  showEmail: false,
  showIcons: true,
  showServiceUserAddress: false,
};

const initialWage: WageSettings = {
  wageLayout: "Mayfair Care",
  showAmountRateBreakdown: true,
  showGrossPayBreakdown: true,
  showIndividualShiftBreakdown: true,
  showFullServiceUserName: "Show Full Service Member Name",
  enableSageExport: false,
  hoursFormat: "Decimal",
  minimumWageTopUp: false,
  roundVisitPayAfterEachVisit: true,
  roundDownIf5: false,
  groupTariffsByTimeBandRate: false,
  deductMileageFromWageTotals: false,
  payMileageOnClockedOrScheduled: "Clocked",
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-wrap gap-x-2 text-sm">
    <span className="font-semibold text-foreground">{label}:</span>
    <span className="text-primary">{value}</span>
  </div>
);

const yesNo = (v: boolean) => (v ? "Yes" : "No");

export default function InvoiceWagesSettings() {
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [globalTerms, setGlobalTerms] = useState(
    "Payment terms are 30 days from date of Invoice",
  );
  const [invoice, setInvoice] = useState<InvoiceSettings>(initialInvoice);
  const [wage, setWage] = useState<WageSettings>(initialWage);

  const [logoOpen, setLogoOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [wageOpen, setWageOpen] = useState(false);

  const [draftLogo, setDraftLogo] = useState<string | null>(null);
  const [draftTerms, setDraftTerms] = useState(globalTerms);
  const [draftInvoice, setDraftInvoice] = useState<InvoiceSettings>(invoice);
  const [draftWage, setDraftWage] = useState<WageSettings>(wage);

  const onLogoFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setDraftLogo(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col bg-muted/30">
        {/* Header bar */}
        <div className="flex items-center border-b bg-background px-4 py-2">
          <Button
            size="sm"
            className="bg-sky-500 hover:bg-sky-600 text-white gap-1"
            onClick={() => navigate("/")}
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Button>
          <h1 className="flex-1 text-center text-lg font-medium">
            Invoice/Wages Settings
          </h1>
          <div className="w-16" />
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {/* Top row: Logo + Global Terms */}
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Invoice Logo */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
                <CardTitle className="text-sm font-semibold">
                  Invoice Logo
                </CardTitle>
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white gap-1 h-7"
                  onClick={() => {
                    setDraftLogo(logoUrl);
                    setLogoOpen(true);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                  Update
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <Separator className="mb-3" />
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Invoice logo"
                    className="h-16 object-contain"
                  />
                ) : (
                  <div className="flex h-16 items-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <div className="text-xs font-bold tracking-widest text-pink-600">
                        MAYFAIR
                      </div>
                      <div className="text-[8px] bg-pink-600 text-white px-1">
                        CARE AGENCY
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Global Terms */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
                <CardTitle className="text-sm font-semibold">
                  Global Terms
                </CardTitle>
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white gap-1 h-7"
                  onClick={() => {
                    setDraftTerms(globalTerms);
                    setTermsOpen(true);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <Separator className="mb-3" />
                <p className="text-sm">{globalTerms}</p>
              </CardContent>
            </Card>
          </div>

          {/* Global Invoice Settings */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
              <CardTitle className="text-sm font-semibold">
                Global Invoice Settings
              </CardTitle>
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white gap-1 h-7"
                onClick={() => {
                  setDraftInvoice(invoice);
                  setInvoiceOpen(true);
                }}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground italic mb-3">
                These are the settings automatically applied when running invoices on
                clients that pay for their own care i.e calls set to private pay.
              </p>
              <Separator className="mb-3" />
              <div className="grid gap-1.5">
                <Row label="Invoice Layout" value={invoice.invoiceLayout} />
                <Row label="Default Payment Name" value={invoice.defaultPaymentName} />
                <Row
                  label="Invoice Prefix"
                  value={invoice.invoicePrefix || <span className="text-muted-foreground">—</span>}
                />
                <Row label="Next Invoice Number" value={invoice.nextInvoiceNumber} />
                <Row label="Include Terms" value={yesNo(invoice.includeTerms)} />
                <Row label="Include Banking Info" value={yesNo(invoice.includeBankingInfo)} />
                <Row label="Include Notes" value={yesNo(invoice.includeNotes)} />
                <Row label="Show Full Service Member Name" value={invoice.showFullServiceUserName} />
                <Row label="Show Invoice Breakdown" value={yesNo(invoice.showInvoiceBreakdown)} />
                <Row label="Show Breakdown Table on Invoice" value={yesNo(invoice.showBreakdownTableOnInvoice)} />
                <Row label="Show Breakdown Table on Week/Day Layout" value={yesNo(invoice.showBreakdownWeekDayLayout)} />
                <Row label="Show Staff in Breakdown" value={invoice.showStaffInBreakdown} />
                <Row label="Show Amount/Rate Breakdown" value={yesNo(invoice.showAmountRateBreakdown)} />
                <Row label="To Be Paid Within (days)" value={`${invoice.toBePaidWithin} (Days)`} />
                <Row label="Hours Format" value={invoice.hoursFormat} />
                <Row label="Show Full Tariff names?" value={yesNo(invoice.showFullTariffNames)} />
                <Row label="Round visit cost after each visit?" value={yesNo(invoice.roundVisitCostAfterEachVisit)} />
                <Row
                  label="Round down if 5?"
                  value={
                    <>
                      {yesNo(invoice.roundDownIf5)}{" "}
                      <span className="text-muted-foreground">
                        – Rounds number down when it is half way there, making 1.675 into
                        1.67 setting No rounds 1.675 into 1.68
                      </span>
                    </>
                  }
                />
                <Row label="Show Email" value={yesNo(invoice.showEmail)} />
                <Row label="Show Icons" value={yesNo(invoice.showIcons)} />
                <Row label="Show Service Member Address (Authority Invoices)" value={yesNo(invoice.showServiceUserAddress)} />
              </div>
            </CardContent>
          </Card>

          {/* Global Wage Settings */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
              <CardTitle className="text-sm font-semibold">
                Global Wage Settings
              </CardTitle>
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white gap-1 h-7"
                onClick={() => {
                  setDraftWage(wage);
                  setWageOpen(true);
                }}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground italic mb-3">
                These are the settings automatically applied when running wages for staff.
              </p>
              <Separator className="mb-3" />
              <div className="grid gap-1.5">
                <Row label="Wage Layout" value={wage.wageLayout} />
                <Row label="Show Amount/Rate Breakdown" value={yesNo(wage.showAmountRateBreakdown)} />
                <Row label="Show Gross Pay Breakdown" value={yesNo(wage.showGrossPayBreakdown)} />
                <Row label="Show Individual Shift Breakdown" value={yesNo(wage.showIndividualShiftBreakdown)} />
                <Row label="Show Full Service Member Name" value={wage.showFullServiceUserName} />
                <Row label="Enable Sage Export" value={yesNo(wage.enableSageExport)} />
                <Row label="Hours Format" value={wage.hoursFormat} />
                <Row label="Minimum Wage Top Up" value={yesNo(wage.minimumWageTopUp)} />
                <Row label="Round visit pay after each visit?" value={yesNo(wage.roundVisitPayAfterEachVisit)} />
                <Row
                  label="Round down if 5?"
                  value={
                    <>
                      {yesNo(wage.roundDownIf5)}{" "}
                      <span className="text-muted-foreground">
                        – Rounds number down when it is half way there, making 1.675 into
                        1.67 setting No rounds 1.675 into 1.68
                      </span>
                    </>
                  }
                />
                <Row label="Group Tariffs by Time Band/Rate?" value={yesNo(wage.groupTariffsByTimeBandRate)} />
                <Row label="Deduct Mileage From Wage Totals?" value={yesNo(wage.deductMileageFromWageTotals)} />
                <Row label="Pay mileage on clocked hours or scheduled hours?" value={wage.payMileageOnClockedOrScheduled} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Logo Dialog */}
      <Dialog open={logoOpen} onOpenChange={setLogoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Invoice Logo</DialogTitle>
            <DialogDescription>
              Upload a logo to appear on invoices and wage slips.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {draftLogo && (
              <img src={draftLogo} alt="Preview" className="h-20 object-contain border rounded p-2" />
            )}
            <Label
              htmlFor="logo-upload"
              className="flex cursor-pointer items-center justify-center gap-2 rounded border-2 border-dashed p-6 hover:bg-muted"
            >
              <Upload className="h-4 w-4" />
              <span>Choose logo image</span>
            </Label>
            <Input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onLogoFile(f);
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setLogoUrl(draftLogo);
                setLogoOpen(false);
                toast({ title: "Logo updated" });
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terms Dialog */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Global Terms</DialogTitle>
          </DialogHeader>
          <Textarea
            value={draftTerms}
            onChange={(e) => setDraftTerms(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTermsOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setGlobalTerms(draftTerms);
                setTermsOpen(false);
                toast({ title: "Global terms updated" });
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Settings Dialog */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Global Invoice Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Invoice Layout</Label>
              <Select
                value={draftInvoice.invoiceLayout}
                onValueChange={(v) => setDraftInvoice({ ...draftInvoice, invoiceLayout: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Default Invoice">Default Invoice</SelectItem>
                  <SelectItem value="Compact Invoice">Compact Invoice</SelectItem>
                  <SelectItem value="Detailed Invoice">Detailed Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Default Payment Name</Label>
              <Input
                value={draftInvoice.defaultPaymentName}
                onChange={(e) => setDraftInvoice({ ...draftInvoice, defaultPaymentName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Invoice Prefix</Label>
              <Input
                value={draftInvoice.invoicePrefix}
                onChange={(e) => setDraftInvoice({ ...draftInvoice, invoicePrefix: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Next Invoice Number</Label>
              <Input
                value={draftInvoice.nextInvoiceNumber}
                onChange={(e) => setDraftInvoice({ ...draftInvoice, nextInvoiceNumber: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>To Be Paid Within (Days)</Label>
              <Input
                type="number"
                value={draftInvoice.toBePaidWithin}
                onChange={(e) => setDraftInvoice({ ...draftInvoice, toBePaidWithin: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Hours Format</Label>
              <Select
                value={draftInvoice.hoursFormat}
                onValueChange={(v) => setDraftInvoice({ ...draftInvoice, hoursFormat: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Default">Default</SelectItem>
                  <SelectItem value="Decimal">Decimal</SelectItem>
                  <SelectItem value="HH:MM">HH:MM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Show Full Service Member Name</Label>
              <Select
                value={draftInvoice.showFullServiceUserName}
                onValueChange={(v) => setDraftInvoice({ ...draftInvoice, showFullServiceUserName: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Show Full Service Member Name">Show Full Service Member Name</SelectItem>
                  <SelectItem value="Show Initials Only">Show Initials Only</SelectItem>
                  <SelectItem value="Hide Service Member Name">Hide Service Member Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Show Staff in Breakdown</Label>
              <Select
                value={draftInvoice.showStaffInBreakdown}
                onValueChange={(v) => setDraftInvoice({ ...draftInvoice, showStaffInBreakdown: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Don't Show Staff Name">Don't Show Staff Name</SelectItem>
                  <SelectItem value="Show Full Staff Name">Show Full Staff Name</SelectItem>
                  <SelectItem value="Show Initials Only">Show Initials Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["includeTerms", "Include Terms"],
              ["includeBankingInfo", "Include Banking Info"],
              ["includeNotes", "Include Notes"],
              ["showInvoiceBreakdown", "Show Invoice Breakdown"],
              ["showBreakdownTableOnInvoice", "Show Breakdown Table on Invoice"],
              ["showBreakdownWeekDayLayout", "Show Breakdown Table on Week/Day Layout"],
              ["showAmountRateBreakdown", "Show Amount/Rate Breakdown"],
              ["showFullTariffNames", "Show Full Tariff names?"],
              ["roundVisitCostAfterEachVisit", "Round visit cost after each visit?"],
              ["roundDownIf5", "Round down if 5?"],
              ["showEmail", "Show Email"],
              ["showIcons", "Show Icons"],
              ["showServiceUserAddress", "Show Service Member Address (Authority Invoices)"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded border p-2">
                <Label className="text-xs">{label}</Label>
                <Switch
                  checked={draftInvoice[key as keyof InvoiceSettings] as boolean}
                  onCheckedChange={(v) =>
                    setDraftInvoice({ ...draftInvoice, [key]: v } as InvoiceSettings)
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setInvoice(draftInvoice);
                setInvoiceOpen(false);
                toast({ title: "Invoice settings updated" });
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wage Settings Dialog */}
      <Dialog open={wageOpen} onOpenChange={setWageOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Global Wage Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Wage Layout</Label>
              <Select
                value={draftWage.wageLayout}
                onValueChange={(v) => setDraftWage({ ...draftWage, wageLayout: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mayfair Care">Mayfair Care</SelectItem>
                  <SelectItem value="Default">Default</SelectItem>
                  <SelectItem value="Compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Hours Format</Label>
              <Select
                value={draftWage.hoursFormat}
                onValueChange={(v) => setDraftWage({ ...draftWage, hoursFormat: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Decimal">Decimal</SelectItem>
                  <SelectItem value="Default">Default</SelectItem>
                  <SelectItem value="HH:MM">HH:MM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Show Full Service Member Name</Label>
              <Select
                value={draftWage.showFullServiceUserName}
                onValueChange={(v) => setDraftWage({ ...draftWage, showFullServiceUserName: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Show Full Service Member Name">Show Full Service Member Name</SelectItem>
                  <SelectItem value="Show Initials Only">Show Initials Only</SelectItem>
                  <SelectItem value="Hide Service Member Name">Hide Service Member Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Pay mileage on clocked / scheduled hours?</Label>
              <Select
                value={draftWage.payMileageOnClockedOrScheduled}
                onValueChange={(v) => setDraftWage({ ...draftWage, payMileageOnClockedOrScheduled: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clocked">Clocked</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["showAmountRateBreakdown", "Show Amount/Rate Breakdown"],
              ["showGrossPayBreakdown", "Show Gross Pay Breakdown"],
              ["showIndividualShiftBreakdown", "Show Individual Shift Breakdown"],
              ["enableSageExport", "Enable Sage Export"],
              ["minimumWageTopUp", "Minimum Wage Top Up"],
              ["roundVisitPayAfterEachVisit", "Round visit pay after each visit?"],
              ["roundDownIf5", "Round down if 5?"],
              ["groupTariffsByTimeBandRate", "Group Tariffs by Time Band/Rate?"],
              ["deductMileageFromWageTotals", "Deduct Mileage From Wage Totals?"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded border p-2">
                <Label className="text-xs">{label}</Label>
                <Switch
                  checked={draftWage[key as keyof WageSettings] as boolean}
                  onCheckedChange={(v) =>
                    setDraftWage({ ...draftWage, [key]: v } as WageSettings)
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWageOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setWage(draftWage);
                setWageOpen(false);
                toast({ title: "Wage settings updated" });
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
