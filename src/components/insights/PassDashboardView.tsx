import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Download, Calendar as CalendarIcon, CheckCircle2, AlertTriangle, Clock, Users } from "lucide-react";
import { toast } from "sonner";

const summary = [
  { label: "Travel time", value: "6.7%", tone: "good" as const, sub: "below threshold" },
  { label: "Punctuality deficit", value: "75.1%", tone: "bad" as const, sub: "above threshold" },
  { label: "Cancelled hours", value: "16", tone: "neutral" as const, sub: "this week" },
  { label: "Overdue / missed", value: "27 / 15", tone: "bad" as const, sub: "needs attention" },
];

const teamRows = [
  { name: "Sienna Adams", done: "100%", late: "0%", over: "0%", status: "On track" },
  { name: "Claire Roberts", done: "100%", late: "0%", over: "0%", status: "On track" },
  { name: "Sue Harris", done: "87.7%", late: "0%", over: "0%", status: "Watch" },
  { name: "Fatima Khan", done: "85.3%", late: "8.7%", over: "0%", status: "Watch" },
  { name: "Shivani Patel", done: "85.7%", late: "57.1%", over: "14.2%", status: "Action" },
  { name: "Jess Lee", done: "77.5%", late: "7.4%", over: "11.1%", status: "Watch" },
  { name: "Christine Yu", done: "75.5%", late: "0%", over: "0%", status: "Watch" },
  { name: "Don Brown", done: "73.7%", late: "45.5%", over: "0.1%", status: "Action" },
];

const statusTone: Record<string, string> = {
  "On track": "bg-success/15 text-success border-0",
  "Watch": "bg-warning/15 text-warning border-0",
  "Action": "bg-destructive/15 text-destructive border-0",
};

const highlights = [
  { icon: AlertTriangle, tone: "destructive", title: "15 missed visits", body: "Across 6 service members. Review allocation and travel routes." },
  { icon: Clock, tone: "warning", title: "Punctuality 75.1%", body: "Above the 50% threshold. Most affected: late starts after 11:00." },
  { icon: CheckCircle2, tone: "success", title: "738 bookings logged", body: "Operations on schedule for the week." },
  { icon: Users, tone: "info", title: "16 cancelled hours", body: "Mostly Tuesday afternoons — confirm with funders." },
];

export function PassDashboardView({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Insights
          </Button>
          <Badge variant="secondary" className="text-[10px]">Pass version</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => toast.success("PDF export queued")}>
            <Download className="h-3.5 w-3.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Title block */}
      <Card className="px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Care 4U Care Limited
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Weekly performance summary
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5" />
              Mon 20 Apr – Sun 26 Apr
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Generated just now</p>
          </div>
        </div>

        <Separator className="my-5" />

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summary.map((k) => (
            <button
              key={k.label}
              onClick={() => toast.info(`${k.label}: ${k.value}`)}
              className="text-left rounded-lg border bg-card hover:bg-muted/40 transition-colors p-4"
            >
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {k.label}
              </div>
              <div className={`text-2xl font-semibold mt-1 ${
                k.tone === "bad" ? "text-destructive" :
                k.tone === "good" ? "text-success" : "text-foreground"
              }`}>
                {k.value}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Highlights */}
      <Card className="px-6 py-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Key highlights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {highlights.map((h) => (
            <button
              key={h.title}
              onClick={() => toast.info(h.title)}
              className={`flex items-start gap-3 rounded-md border p-3 text-left hover:bg-muted/40 transition-colors`}
            >
              <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 bg-${h.tone}/15 text-${h.tone}`}>
                <h.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-foreground">{h.title}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{h.body}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Team performance table */}
      <Card className="px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Team performance</h2>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.info("Open full team report")}>
            View full report
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px]">Employee</TableHead>
              <TableHead className="text-[11px] text-right">Done</TableHead>
              <TableHead className="text-[11px] text-right">Late</TableHead>
              <TableHead className="text-[11px] text-right">Overstay</TableHead>
              <TableHead className="text-[11px] text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamRows.map((r) => (
              <TableRow
                key={r.name}
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => toast.info(`Open ${r.name}`)}
              >
                <TableCell className="text-xs font-medium">{r.name}</TableCell>
                <TableCell className="text-xs text-right">{r.done}</TableCell>
                <TableCell className="text-xs text-right">{r.late}</TableCell>
                <TableCell className="text-xs text-right">{r.over}</TableCell>
                <TableCell className="text-right">
                  <Badge className={`text-[10px] ${statusTone[r.status]}`}>{r.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Footer */}
      <Card className="px-6 py-4">
        <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-muted-foreground">
          <span>Care 4U Care Limited • Confidential</span>
          <span>Page 1 of 1</span>
        </div>
      </Card>
    </div>
  );
}
