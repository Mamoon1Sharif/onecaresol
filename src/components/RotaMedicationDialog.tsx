import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export interface RotaMedicationContext {
  ref: string;
  date: string;
  start: string;
  end: string;
  client: string;
  slotLabel?: string; // e.g. "Early morning tablets"
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: RotaMedicationContext | null;
}

interface MedRow {
  name: string;
  status: "Due" | "Given" | "Missed";
  audited: boolean;
  auditNotes?: string;
  client: string;
  group: string;
  period?: string;
  planned: { admin: string; dose: string; instructions: string };
}

function buildRows(ctx: RotaMedicationContext): MedRow[] {
  const meds = [
    { name: "Bisoprolol Tablets", dose: "5mg", inst: "ONE to be taken every morning" },
    { name: "Carbamazepine Tablets", dose: "100mg", inst: "ONE to be taken Morning and Night" },
    { name: "Edoxaban Tablets", dose: "30mg", inst: "ONE to be taken in the morning" },
    { name: "Finasteride Tablets", dose: "5mg", inst: "ONE to be taken in the morning" },
    { name: "Furosemide Tablets", dose: "40mg", inst: "ONE to be taken in the morning" },
    { name: "Lansoprazole Capsules", dose: "30mg", inst: "ONE to be taken in the morning" },
    { name: "Levothyroxine Tablets", dose: "100mcg", inst: "ONE to be taken in the morning" },
  ];
  return meds.map((m, i) => ({
    name: m.name,
    status: "Due" as const,
    audited: false,
    client: ctx.client,
    group: ctx.slotLabel || "Early morning tablets",
    period: i === 4 ? "Morning: 04:00 - 12:00" : "",
    planned: { admin: "Administer", dose: m.dose, instructions: m.inst },
  }));
}

export function RotaMedicationDialog({ open, onOpenChange, context }: Props) {
  const [search, setSearch] = useState("");
  const rows = useMemo(() => (context ? buildRows(context) : []), [context]);
  const filtered = useMemo(
    () => rows.filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );

  if (!context) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col"
      >
        {/* Top bar */}
        <div className="bg-info text-info-foreground px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="text-sm font-semibold">Rota Medication</div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-sm opacity-90 hover:opacity-100 transition-opacity"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-background">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                Medication ({context.slotLabel || "Early morning tablets"})
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <label className="text-muted-foreground">Search:</label>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-[220px] text-xs"
                />
              </div>
            </div>

            <div className="border border-border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[1200px] border-collapse">
                  <thead className="bg-muted/60 border-b border-border">
                    <tr className="text-left">
                      {[
                        "Med Name",
                        "Status",
                        "Audited",
                        "Audit Notes",
                        "Admin Details",
                        "Client",
                        "Linked Areas",
                        "Rota Details",
                        "Med Group",
                        "Period",
                        "Planned",
                        "Body Map",
                      ].map((h) => (
                        <th key={h} className="px-3 py-2 font-semibold text-foreground border-r border-border last:border-r-0 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr
                        key={r.name}
                        className={`${i % 2 === 0 ? "bg-background" : "bg-muted/30"} border-b border-border`}
                      >
                        <td className="px-3 py-3 text-foreground border-r border-border align-top whitespace-nowrap">{r.name}</td>
                        <td className="px-3 py-3 border-r border-border align-top">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-info/15 text-info border border-info/30">
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 border-r border-border align-top text-destructive text-base leading-none">×</td>
                        <td className="px-3 py-3 border-r border-border align-top text-muted-foreground"></td>
                        <td className="px-3 py-3 border-r border-border align-top text-muted-foreground">
                          Medication Not Administered Through The System
                        </td>
                        <td className="px-3 py-3 border-r border-border align-top text-foreground whitespace-nowrap">{r.client}</td>
                        <td className="px-3 py-3 border-r border-border align-top text-muted-foreground"></td>
                        <td className="px-3 py-3 border-r border-border align-top text-[11px] leading-relaxed">
                          <a className="text-success underline font-mono">{context.ref}</a>
                          <div>Date: {context.date}</div>
                          <div>Start: {context.start}</div>
                          <div>End: {context.end}</div>
                          <div className="text-muted-foreground">Actual Start:</div>
                          <div className="text-muted-foreground">Actual End: Due</div>
                          <div className="text-muted-foreground">Status:</div>
                        </td>
                        <td className="px-3 py-3 border-r border-border align-top text-foreground whitespace-nowrap">{r.group}</td>
                        <td className="px-3 py-3 border-r border-border align-top text-foreground whitespace-nowrap">{r.period || ""}</td>
                        <td className="px-3 py-3 border-r border-border align-top text-[11px] leading-relaxed">
                          <div>{r.planned.admin}</div>
                          <div>{r.planned.dose}</div>
                          <div>{r.planned.instructions}</div>
                        </td>
                        <td className="px-3 py-3 align-top text-muted-foreground">-</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={12} className="text-center py-8 text-muted-foreground">
                          No medications match this search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-info h-3 shrink-0" />
      </DialogContent>
    </Dialog>
  );
}
