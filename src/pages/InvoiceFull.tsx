import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Check, Pencil, Plus, Printer, Save, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

type ExtraCharge = {
  id: string;
  service: string;
  quantity: number;
  cost: number;
};

type Payment = {
  date: string;
  paidTo: string;
  referenceNum: string;
  method: string;
  amount: number;
};

type Visit = {
  date: string;
  call: string;
  start: string;
  end: string;
  duration: string;
  cost: number;
  total: number;
};

const initialPayments: Payment[] = [
  { date: "15/04/2026", paidTo: "Current Account", referenceNum: "", method: "Bank Transfer", amount: 400 },
];

const paidToOptions = ["Current Account", "Savings Account", "Cash Float", "Petty Cash"];
const paymentMethodOptions = ["Bank Transfer", "Cash", "Cheque", "Card Payment", "Direct Debit"];

const todayDdMmYyyy = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const visits: Visit[] = [
  { date: "01/04/2026", call: "CHC - Sitting", start: "07:30", end: "09:00", duration: "01:30", cost: 37.5, total: 37.5 },
  { date: "01/04/2026", call: "CHC - Sitting", start: "14:00", end: "19:30", duration: "05:30", cost: 137.5, total: 175 },
  { date: "02/04/2026", call: "CHC - Sitting", start: "12:00", end: "14:00", duration: "02:00", cost: 50, total: 225 },
  { date: "02/04/2026", call: "CHC - Sitting", start: "19:30", end: "23:30", duration: "04:00", cost: 100, total: 325 },
  { date: "05/04/2026", call: "CHC - Sitting", start: "17:00", end: "20:00", duration: "03:00", cost: 75, total: 400 },
];

const fmt = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

type SettingKey =
  | "invoiceLayout"
  | "serviceUserNameConfig"
  | "showServiceUserEmail"
  | "includeTerms"
  | "includeBanking"
  | "includeInvoiceBreakdown"
  | "showBreakdownTableOnInvoice"
  | "showTeamMemberInBreakdown"
  | "includeAmountRateBreakdown"
  | "includeNotes"
  | "showServiceUserAddress";

type SettingsState = Record<SettingKey, string>;

const settingFields: Array<{
  key: SettingKey;
  label: string;
  required?: boolean;
  options: string[];
}> = [
  { key: "invoiceLayout", label: "Invoice Layout", required: true, options: ["Mayfair Care (CHC)", "Mayfair Care (Private)", "Default"] },
  { key: "serviceUserNameConfig", label: "Service User Name Config", options: ["Show Only Service User Ref Number", "Show Full Name", "Show Initials Only"] },
  { key: "showServiceUserEmail", label: "Show Service User Email", options: ["No", "Yes"] },
  { key: "includeTerms", label: "Include Terms", options: ["Yes", "No"] },
  { key: "includeBanking", label: "Include Banking", options: ["Yes", "No"] },
  { key: "includeInvoiceBreakdown", label: "Include Invoice Breakdown", options: ["Yes", "No"] },
  { key: "showBreakdownTableOnInvoice", label: "Show Breakdown Table on Invoice", options: ["Yes", "No"] },
  { key: "showTeamMemberInBreakdown", label: "Show Care Giver In Breakdown", options: ["Don't Show Care Giver Name", "Show Care Giver Name"] },
  { key: "includeAmountRateBreakdown", label: "Include Amount/Rate Breakdown", options: ["No", "Yes"] },
  { key: "includeNotes", label: "Include Notes", options: ["No", "Yes"] },
  { key: "showServiceUserAddress", label: "Show Service User Address", options: ["No", "Yes"] },
];

const initialSettings: SettingsState = {
  invoiceLayout: "Mayfair Care (CHC)",
  serviceUserNameConfig: "Show Only Service User Ref Number",
  showServiceUserEmail: "No",
  includeTerms: "Yes",
  includeBanking: "Yes",
  includeInvoiceBreakdown: "Yes",
  showBreakdownTableOnInvoice: "Yes",
  showTeamMemberInBreakdown: "Don't Show Care Giver Name",
  includeAmountRateBreakdown: "No",
  includeNotes: "No",
  showServiceUserAddress: "No",
};

export default function InvoiceFull() {
  const navigate = useNavigate();
  const { groupName = "", invoiceRef = "29333" } = useParams();

  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [chargeService, setChargeService] = useState("");
  const [chargeQty, setChargeQty] = useState("");
  const [chargeCost, setChargeCost] = useState("");

  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(todayDdMmYyyy());
  const [payPaidTo, setPayPaidTo] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [payRef, setPayRef] = useState("");

  const [settings, setSettings] = useState<SettingsState>(initialSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftSettings, setDraftSettings] = useState<SettingsState>(initialSettings);

  const openSettings = () => {
    setDraftSettings(settings);
    setSettingsOpen(true);
  };

  const handleUpdateSettings = () => {
    setSettings(draftSettings);
    setSettingsOpen(false);
    toast({ title: "Settings updated", description: "Invoice settings have been saved." });
  };

  const extraTotal = extraCharges.reduce((a, c) => a + c.quantity * c.cost, 0);
  const baseRequired = 400;
  const totalRequired = baseRequired + extraTotal;
  const totalPaid = payments.reduce((a, p) => a + p.amount, 0);
  const outstanding = Math.max(0, totalRequired - totalPaid);
  const visitTotal = visits.reduce((a, v) => a + v.cost, 0);
  const totalDuration = visits.reduce((acc, v) => {
    const [h, m] = v.duration.split(":").map(Number);
    return acc + h * 60 + m;
  }, 0);
  const totalDurationFmt = `${String(Math.floor(totalDuration / 60)).padStart(2, "0")}:${String(totalDuration % 60).padStart(2, "0")}`;

  const resetChargeForm = () => {
    setChargeService("");
    setChargeQty("");
    setChargeCost("");
  };

  const handleAddCharge = () => {
    const qty = Number(chargeQty);
    const cost = Number(chargeCost);
    if (!chargeService.trim() || !chargeQty || !chargeCost || isNaN(qty) || isNaN(cost)) {
      toast({ title: "Missing details", description: "Please fill in service, quantity and cost.", variant: "destructive" });
      return;
    }
    setExtraCharges((prev) => [
      ...prev,
      { id: crypto.randomUUID(), service: chargeService.trim(), quantity: qty, cost },
    ]);
    toast({ title: "Charge added", description: `${chargeService} added to invoice.` });
    resetChargeForm();
    setChargeOpen(false);
  };

  const resetPaymentForm = () => {
    setPayAmount("");
    setPayDate(todayDdMmYyyy());
    setPayPaidTo("");
    setPayMethod("");
    setPayRef("");
  };

  const handleCreatePayment = () => {
    const amount = Number(payAmount);
    if (!payAmount || isNaN(amount) || amount <= 0 || !payPaidTo) {
      toast({ title: "Missing details", description: "Amount and Paid To are required.", variant: "destructive" });
      return;
    }
    setPayments((prev) => [
      ...prev,
      { date: payDate, paidTo: payPaidTo, referenceNum: payRef.trim(), method: payMethod || "—", amount },
    ]);
    toast({ title: "Payment recorded", description: `${fmt(amount)} added to invoice.` });
    resetPaymentForm();
    setPaymentOpen(false);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-5 print:space-y-3">
        {/* Top toolbar */}
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Button>
          <Button size="sm" variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1.5" /> Print
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setChargeOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Extra Charge
          </Button>
        </div>

        {/* Add New Charge Dialog */}
        <Dialog
          open={chargeOpen}
          onOpenChange={(o) => {
            setChargeOpen(o);
            if (!o) resetChargeForm();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Charge</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground -mt-1">
              Add a custom charge to this invoice. The total is calculated as quantity × cost per quantity.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="charge-service">
                  Service <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="charge-service"
                  value={chargeService}
                  onChange={(e) => setChargeService(e.target.value)}
                  placeholder="Service description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="charge-qty">
                    Quantity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="charge-qty"
                    type="number"
                    value={chargeQty}
                    onChange={(e) => setChargeQty(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="charge-cost">
                    Cost per Quantity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="charge-cost"
                    type="number"
                    value={chargeCost}
                    onChange={(e) => setChargeCost(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setChargeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCharge}>
                <Check className="h-4 w-4 mr-1.5" /> Add Charge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Make A Payment Dialog */}
        <Dialog
          open={paymentOpen}
          onOpenChange={(o) => {
            setPaymentOpen(o);
            if (!o) resetPaymentForm();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Make a Payment</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground -mt-1">
              Record a new payment against this invoice.
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pay-amount">
                    Amount <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pay-amount"
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pay-date">Payment Date</Label>
                  <Input
                    id="pay-date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>
                  Paid To <span className="text-destructive">*</span>
                </Label>
                <Select value={payPaidTo} onValueChange={setPayPaidTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose one..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paidToOptions.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose one..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-ref">Reference Number</Label>
                <Input
                  id="pay-ref"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setPaymentOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePayment}>
                <Save className="h-4 w-4 mr-1.5" /> Create Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Top two-column: Payments Made + Invoice Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 print:hidden">
          {/* Payments Made */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Payments Made</h2>
              <Button
                size="sm"
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setPaymentOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="flex justify-between text-xs">
              <span><span className="font-medium">Total Required:</span> {fmt(totalRequired)}</span>
              <span><span className="font-medium">To Be Paid By:</span> 07/05/2026</span>
            </div>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-medium">Date</TableHead>
                    <TableHead className="font-medium">Paid To</TableHead>
                    <TableHead className="font-medium">Reference Num</TableHead>
                    <TableHead className="font-medium">Method</TableHead>
                    <TableHead className="font-medium text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="whitespace-nowrap">{p.date}</TableCell>
                      <TableCell><button className="text-primary hover:underline">{p.paidTo}</button></TableCell>
                      <TableCell className="text-muted-foreground">{p.referenceNum || "—"}</TableCell>
                      <TableCell>{p.method}</TableCell>
                      <TableCell className="text-right">{fmt(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-medium">
                    <TableCell colSpan={3} />
                    <TableCell>Total Paid</TableCell>
                    <TableCell className="text-right">{fmt(totalPaid)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30 font-medium">
                    <TableCell colSpan={3} />
                    <TableCell>Outstanding</TableCell>
                    <TableCell className="text-right">{fmt(outstanding)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Invoice Settings */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Invoice Settings</h2>
              <Button
                size="sm"
                className="h-8 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={openSettings}
              >
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            </div>
            <dl className="space-y-1.5 text-xs">
              {settingFields.map((f) => (
                <div key={f.key} className="flex gap-2">
                  <dt className="font-medium min-w-[210px]">{f.label}:</dt>
                  <dd className={f.key === "invoiceLayout" ? "text-primary" : "text-muted-foreground"}>
                    {settings[f.key] || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        {/* Edit Invoice Settings Dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Invoice Settings</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground -mt-1">
              Configure how this invoice is displayed and printed.
            </p>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 -mr-1">
              {settingFields.map((f) => (
                <div key={f.key} className="grid grid-cols-1 sm:grid-cols-[200px_1fr] sm:items-center gap-2 sm:gap-3">
                  <Label className="text-sm">
                    {f.label}
                    {f.required && <span className="text-destructive ml-0.5">*</span>}
                  </Label>
                  <Select
                    value={draftSettings[f.key]}
                    onValueChange={(v) => setDraftSettings((p) => ({ ...p, [f.key]: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSettings}>
                <Save className="h-4 w-4 mr-1.5" /> Update Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status banner */}
        <div
          className={`rounded-md py-2 text-center text-sm font-medium ${
            outstanding === 0
              ? "bg-emerald-600 text-white"
              : "bg-rose-500 text-white"
          }`}
        >
          Invoice Payment Status: {outstanding === 0 ? "Paid In Full" : "Outstanding"}
        </div>

        {/* Printable invoice */}
        <Card className="p-8 space-y-6 bg-muted/20 print:bg-white print:shadow-none">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">Invoice</h2>
              <div className="w-20 h-20 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                LOGO
              </div>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <div className="font-semibold text-sm">Mayfair Care Agency Ltd</div>
              <div>UNIT 7, BRIAR CLOSE BUSINESS PARK</div>
              <div>EVESHAM</div>
              <div>WORCESTERSHIRE</div>
              <div>WR114JT</div>
            </div>
          </div>

          <div className="border-t border-emerald-500" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-xs space-y-0.5 text-primary">
              <div className="font-semibold">NHS Herefordshire and Worcestershire ICB</div>
              <div>QGH PAYABLES N245</div>
              <div>NHS SHARED FINANCIAL SERVICES</div>
              <div>P O BOX 312</div>
              <div>LEEDS</div>
              <div>WEST YORKSHIRE</div>
              <div>LS11 1HP</div>
            </div>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableBody>
                  {[
                    ["Invoice No", invoiceRef],
                    ["Invoice Date", "07/04/2026"],
                    ["Service User Ref", "UID 64288 (XXJCARTER)"],
                    ["Date Range", "30/03/2026 - 05/04/2026"],
                    ["Due By", "07/05/2026"],
                  ].map(([k, v]) => (
                    <TableRow key={k}>
                      <TableCell className="font-medium bg-muted/30 w-1/2">{k}</TableCell>
                      <TableCell>{v}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-medium">Item</TableHead>
                  <TableHead className="font-medium text-right">Hours (H:m)</TableHead>
                  <TableHead className="font-medium text-right">Rate / Freq (H:m)</TableHead>
                  <TableHead className="font-medium text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    Domiciliary Care Services{" "}
                    <span className="text-muted-foreground">(30/03/2026 - 05/04/2026)</span>
                  </TableCell>
                  <TableCell className="text-right">16:00 Hrs:mins</TableCell>
                  <TableCell className="text-right">N/A</TableCell>
                  <TableCell className="text-right">{fmt(400)}</TableCell>
                </TableRow>
                {extraCharges.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.service}</TableCell>
                    <TableCell className="text-right">{c.quantity}</TableCell>
                    <TableCell className="text-right">{fmt(c.cost)}</TableCell>
                    <TableCell className="text-right">{fmt(c.quantity * c.cost)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-medium">
                  <TableCell colSpan={3} className="text-right">Total</TableCell>
                  <TableCell className="text-right">{fmt(totalRequired)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="border-t border-emerald-500" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-primary">Invoice No: {invoiceRef}</div>
              </div>
              <div>
                <div className="font-semibold text-primary">Payment Made To:</div>
                <div><span className="font-medium">Acc:</span> 02269672</div>
                <div><span className="font-medium">Sort:</span> 30-93-11</div>
                <div><span className="font-medium">Acc Name:</span> Mayfair Care Agency Ltd</div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-primary">Terms:</div>
              <div>Payment terms are 30 days from date of invoice</div>
            </div>
          </div>

          <div className="border-t border-emerald-500" />

          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <span><span className="font-medium">T:</span> 0138641492</span>
            <span><span className="font-medium">E:</span> admin@mayfaircareagency.co.uk</span>
            <span>NHS Herefordshire and Worcestershire ICB</span>
          </div>

          {/* Visit breakdown */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="font-medium">Call</TableHead>
                  <TableHead className="font-medium">Start</TableHead>
                  <TableHead className="font-medium">End</TableHead>
                  <TableHead className="font-medium">Duration</TableHead>
                  <TableHead className="font-medium text-right">Cost</TableHead>
                  <TableHead className="font-medium text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((v, i) => (
                  <TableRow key={i} className="text-xs">
                    <TableCell className="whitespace-nowrap">{v.date}</TableCell>
                    <TableCell>{v.call}</TableCell>
                    <TableCell>{v.start}</TableCell>
                    <TableCell>{v.end}</TableCell>
                    <TableCell>{v.duration}</TableCell>
                    <TableCell className="text-right">{fmt(v.cost)}</TableCell>
                    <TableCell className="text-right">{fmt(v.total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-medium">
                  <TableCell>Total</TableCell>
                  <TableCell colSpan={3} />
                  <TableCell>{totalDurationFmt}</TableCell>
                  <TableCell />
                  <TableCell className="text-right">{fmt(visitTotal)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-xs flex-wrap gap-2 pt-2 border-t">
            <span><span className="font-medium">T:</span> 0138641492</span>
            <span><span className="font-medium">E:</span> admin@mayfaircareagency.co.uk</span>
            <span>NHS Herefordshire and Worcestershire ICB</span>
          </div>

          {groupName && (
            <p className="text-[10px] text-muted-foreground text-center">
              Group: {decodeURIComponent(groupName)}
            </p>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
