import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, Calendar, FileText, UserMinus, ListChecks, Phone, Clock, Car, AlertCircle, StickyNote, Search, BarChart3, User, Users, ClipboardList, Pill, ShieldCheck, PoundSterling, Activity, ScrollText, FileBarChart, Cake, HeartHandshake, FileCheck, Plane, AlertTriangle, Smartphone, GraduationCap, BookOpen, BellRing, Route, Tag, FileWarning } from "lucide-react";

type ReportItem = { name: string; icon: any };
type ReportSection = {
  title: string;
  color: "purple" | "cyan" | "rose";
  items: ReportItem[];
};

const sections: ReportSection[] = [
  {
    title: "Team Member Reports",
    color: "purple",
    items: [
      { name: "Availability Report", icon: Calendar },
      { name: "Bradford Factor Report", icon: FileText },
      { name: "Cancelled Report", icon: UserMinus },
      { name: "Deleted Calls Report", icon: ListChecks },
      { name: "Handback Report", icon: ListChecks },
      { name: "Key Contacts Report", icon: Phone },
      { name: "Late / Early Report", icon: Calendar },
      { name: "Live Hours Report", icon: Clock },
      { name: "Mileage Report", icon: Car },
      { name: "Missed Report", icon: AlertCircle },
      { name: "Note Report", icon: StickyNote },
      { name: "Requested Hours vs Live Hours Report", icon: Calendar },
      { name: "Shadow Shift Report", icon: User },
      { name: "Short Visit Report", icon: Search },
      { name: "Task List", icon: ListChecks },
      { name: "Team Member DBS Report", icon: User },
    ],
  },
  {
    title: "Service User Reports",
    color: "cyan",
    items: [
      { name: "Active Medication Report", icon: Pill },
      { name: "Client Funder Report", icon: PoundSterling },
      { name: "Continuity Report", icon: Activity },
      { name: "Controlled Medication Report", icon: ShieldCheck },
      { name: "Invoice Report", icon: PoundSterling },
      { name: "Key Contacts Report", icon: Phone },
      { name: "Legacy Medication Report", icon: Pill },
      { name: "Live Hours Report", icon: Clock },
      { name: "MARChart Report", icon: ScrollText },
      { name: "Medication Report", icon: Pill },
      { name: "Medications Unverified", icon: AlertCircle },
      { name: "Mileage Report", icon: Car },
      { name: "Notes Report", icon: StickyNote },
      { name: "Programs Of Care Report", icon: ClipboardList },
      { name: "Service User Report", icon: HeartHandshake },
      { name: "Task List", icon: ListChecks },
    ],
  },
  {
    title: "General Reports",
    color: "rose",
    items: [
      { name: "Assessments Logs", icon: Eye },
      { name: "Birthday Report", icon: Cake },
      { name: "Care Portal Report", icon: Users },
      { name: "Communication Log Report", icon: Phone },
      { name: "CQC Contact List", icon: Phone },
      { name: "Document Report", icon: FileCheck },
      { name: "Holiday Report", icon: Plane },
      { name: "Incident List", icon: AlertTriangle },
      { name: "Manual Vs App Clocking Report", icon: Smartphone },
      { name: "Programs Of Care Report", icon: Eye },
      { name: "Qualification Report", icon: GraduationCap },
      { name: "Read Assessments Report", icon: BookOpen },
      { name: "Reminder List", icon: BellRing },
      { name: "Rota Duration Report", icon: BarChart3 },
      { name: "Run Route Report", icon: Route },
      { name: "Tags Report", icon: Tag },
    ],
  },
];

const colorMap = {
  purple: { text: "text-purple-500", border: "border-t-purple-500" },
  cyan: { text: "text-cyan-500", border: "border-t-cyan-500" },
  rose: { text: "text-rose-500", border: "border-t-rose-500" },
};

function ReportSectionCard({ section }: { section: ReportSection }) {
  const [search, setSearch] = useState("");
  const nav = useNavigate();
  const c = colorMap[section.color];

  const filtered = useMemo(
    () => section.items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())),
    [section.items, search],
  );

  const openReport = (name: string) => {
    nav(`/reports/${encodeURIComponent(name)}?category=${encodeURIComponent(section.title)}`);
  };

  return (
    <Card className={`border-t-4 ${c.border} flex flex-col`}>
      <div className="px-4 py-3 border-b">
        <h2 className="text-center text-sm font-medium text-foreground">{section.title}</h2>
      </div>
      <div className="px-4 py-2 flex items-center justify-end gap-2 border-b">
        <label className="text-xs font-semibold">Search:</label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 w-48 text-xs"
        />
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full text-xs">
          <tbody>
            {filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <tr
                  key={item.name + idx}
                  className={`border-b last:border-b-0 ${idx % 2 === 0 ? "bg-muted/30" : "bg-background"} hover:bg-muted/60 transition-colors cursor-pointer`}
                  onClick={() => openReport(item.name)}
                >
                  <td className="w-10 px-3 py-2">
                    <Icon className={`h-4 w-4 ${c.text}`} />
                  </td>
                  <td className="px-2 py-2">
                    <span className={`${c.text} hover:underline text-left`}>
                      {item.name}
                    </span>
                  </td>
                  <td className="w-10 px-3 py-2 text-right">
                    <span className={`${c.text} hover:opacity-70`} title="View">
                      <Eye className="h-4 w-4 inline" />
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-muted-foreground text-xs">
                  No reports found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function Reports() {
  return (
    <AppLayout>
      <div className="border-b bg-background">
        <div className="px-6 py-3">
          <h1 className="text-center text-base font-medium text-foreground">Reports</h1>
        </div>
        <div className="h-[2px] bg-rose-500" />
      </div>

      <div className="p-4 bg-muted/40 min-h-[calc(100vh-60px)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ReportSectionCard section={sections[0]} />
          <ReportSectionCard section={sections[1]} />
          <ReportSectionCard section={sections[2]} />
        </div>
      </div>
    </AppLayout>
  );
}
