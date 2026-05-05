import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Wallet,
  Tags,
  Building2,
  Settings,
  CalendarDays,
  Plane,
} from "lucide-react";

const sections = [
  {
    title: "Invoice Groups",
    description: "Create, view and manage authority and service user invoice groups.",
    icon: FileText,
    href: "/invoicing/invoice-groups",
    accent: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Wages",
    description: "Process and review care giver wages, payslips and exports.",
    icon: Wallet,
    href: "/invoicing/wages",
    accent: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Tariffs",
    description: "Configure pay rates and charge bands per service and time of day.",
    icon: Tags,
    href: "/invoicing/tariffs",
    accent: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    title: "Funders",
    description: "Manage funding bodies, contracts and billing references.",
    icon: Building2,
    href: "/invoicing/funders",
    accent: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    title: "Settings",
    description: "Invoice numbering, VAT, PDF templates and payment terms.",
    icon: Settings,
    href: "/invoicing/settings",
    accent: "text-slate-600",
    bg: "bg-slate-100",
  },
  {
    title: "Bank Holidays",
    description: "Define UK bank holidays that affect pay and charge calculations.",
    icon: CalendarDays,
    href: "/invoicing/bank-holidays",
    accent: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    title: "Holiday Report",
    description: "Annual leave accruals, taken hours and outstanding balances.",
    icon: Plane,
    href: "/invoicing/holiday-report",
    accent: "text-cyan-600",
    bg: "bg-cyan-50",
  },
];

export default function Invoicing() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoicing / Wages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage billing, payroll, tariffs and supporting reference data.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s) => (
            <Card
              key={s.title}
              role="button"
              tabIndex={0}
              onClick={() => navigate(s.href)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(s.href);
              }}
              className="p-5 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.accent}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
