import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  PhoneCall,
  PlayCircle,
  CalendarDays,
  ListChecks,
  Info,
  Users,
  UsersRound,
  UserCog,
  Wrench,
  FileText,
  Settings as SettingsIcon,
  Stethoscope,
  Pill,
  Clock,
  Shield,
  Bell,
  Mail,
  CreditCard,
  Database,
  Globe,
  KeyRound,
  Search,
  ChevronRight,
  ArrowLeft,
  Save,
} from "lucide-react";

type TileKey =
  | "company"
  | "oncall"
  | "logged"
  | "rota"
  | "lists"
  | "logs"
  | "portal"
  | "legacy"
  | "my"
  | "permissions"
  | "forms"
  | "general"
  | "team"
  | "medtypes"
  | "medranges"
  | "notifications"
  | "billing"
  | "integrations"
  | "security"
  | "backup";

interface Tile {
  key: TileKey;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Company" | "Operations" | "Care" | "Account" | "System";
}

const TILES: Tile[] = [
  { key: "company", title: "Company Settings", description: "Business profile, branding & address", icon: Building2, group: "Company" },
  { key: "oncall", title: "On Call", description: "Out-of-hours phone & escalation", icon: PhoneCall, group: "Company" },
  { key: "logged", title: "Logged In Users", description: "Active sessions & device sign-out", icon: PlayCircle, group: "Account" },
  { key: "rota", title: "Rota & App Settings", description: "Scheduling rules and mobile app", icon: CalendarDays, group: "Operations" },
  { key: "lists", title: "All Lists", description: "Dropdowns, tags and reference data", icon: ListChecks, group: "System" },
  { key: "logs", title: "System Logs", description: "Audit trail & change history", icon: Info, group: "System" },
  { key: "portal", title: "Care Portal Accounts", description: "Family / service-user permissions", icon: Users, group: "Care" },
  { key: "legacy", title: "Legacy Care Portal", description: "Family login (legacy options)", icon: UsersRound, group: "Care" },
  { key: "my", title: "My Settings", description: "Personal profile & preferences", icon: UserCog, group: "Account" },
  { key: "permissions", title: "Permissions", description: "Role-based access control", icon: Wrench, group: "Account" },
  { key: "forms", title: "Forms", description: "Custom forms and assessments", icon: FileText, group: "Operations" },
  { key: "general", title: "General Settings", description: "Locale, currency and date format", icon: SettingsIcon, group: "System" },
  { key: "team", title: "Care Giver Portal", description: "Caregiver app permissions", icon: Stethoscope, group: "Care" },
  { key: "medtypes", title: "Medication Admin Types", description: "Routes, methods & PRN rules", icon: Pill, group: "Care" },
  { key: "medranges", title: "Medication Time Ranges", description: "Morning, lunch, tea & bed windows", icon: Clock, group: "Care" },
  { key: "notifications", title: "Notifications", description: "Email & in-app alert preferences", icon: Bell, group: "Account" },
  { key: "billing", title: "Billing & Plan", description: "Subscription, seats and invoices", icon: CreditCard, group: "Company" },
  { key: "integrations", title: "Integrations", description: "Connect external services", icon: Globe, group: "System" },
  { key: "security", title: "Security", description: "2FA, password and IP allow-list", icon: Shield, group: "Account" },
  { key: "backup", title: "Backup & Data", description: "Export, retention and restore", icon: Database, group: "System" },
];

const GROUPS: Tile["group"][] = ["Company", "Operations", "Care", "Account", "System"];

export default function Settings() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<TileKey | null>(null);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TILES;
    return TILES.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const m = new Map<Tile["group"], Tile[]>();
    GROUPS.forEach((g) => m.set(g, []));
    filtered.forEach((t) => m.get(t.group)!.push(t));
    return m;
  }, [filtered]);

  const activeTile = TILES.find((t) => t.key === active) ?? null;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Admin
            </p>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your company, operations and personal preferences.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search settings…"
              className="pl-9"
            />
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Active users" value="42" hint="3 invited" />
          <Stat label="Roles" value="8" hint="2 custom" />
          <Stat label="Storage used" value="6.2 GB" hint="of 50 GB" />
          <Stat label="Plan" value="Professional" hint="Renews 12 May" />
        </div>

        {/* Grouped tile grid */}
        <div className="space-y-8">
          {GROUPS.map((g) => {
            const items = grouped.get(g) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={g} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    {g}
                  </h2>
                  <span className="text-xs text-muted-foreground">{items.length} options</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((t) => (
                    <SettingTile key={t.key} tile={t} onClick={() => setActive(t.key)} />
                  ))}
                </div>
              </section>
            );
          })}
          {filtered.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground">
              No settings match “{query}”.
            </Card>
          )}
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 flex flex-col"
        >
          {activeTile && (
            <>
              <SheetHeader className="px-6 py-4 border-b bg-muted/40">
                <button
                  onClick={() => setActive(null)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit"
                >
                  <ArrowLeft className="h-3 w-3" /> All settings
                </button>
                <div className="flex items-start gap-3 mt-2">
                  <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <activeTile.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{activeTile.title}</SheetTitle>
                    <SheetDescription>{activeTile.description}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <PanelBody tileKey={activeTile.key} />
              </div>
              <SheetFooter className="px-6 py-3 border-t bg-card">
                <Button variant="outline" onClick={() => setActive(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      title: "Saved",
                      description: `${activeTile.title} updated successfully.`,
                    });
                    setActive(null);
                  }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save changes
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </Card>
  );
}

function SettingTile({ tile, onClick }: { tile: Tile; onClick: () => void }) {
  const Icon = tile.icon;
  return (
    <button
      onClick={onClick}
      className="group text-left bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-sm transition-all flex items-start gap-3 w-full"
    >
      <div className="h-10 w-10 rounded-md bg-accent text-accent-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm leading-tight">{tile.title}</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tile.description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
    </button>
  );
}

/* ---------------- Panels ---------------- */

function PanelBody({ tileKey }: { tileKey: TileKey }) {
  switch (tileKey) {
    case "company":
      return <CompanyPanel />;
    case "oncall":
      return <OnCallPanel />;
    case "logged":
      return <LoggedInPanel />;
    case "rota":
      return <RotaPanel />;
    case "lists":
      return <ListsPanel />;
    case "logs":
      return <LogsPanel />;
    case "portal":
      return <PortalPanel />;
    case "legacy":
      return <LegacyPanel />;
    case "my":
      return <MyPanel />;
    case "permissions":
      return <PermissionsPanel />;
    case "forms":
      return <FormsPanel />;
    case "general":
      return <GeneralPanel />;
    case "team":
      return <TeamPanel />;
    case "medtypes":
      return <MedTypesPanel />;
    case "medranges":
      return <MedRangesPanel />;
    case "notifications":
      return <NotificationsPanel />;
    case "billing":
      return <BillingPanel />;
    case "integrations":
      return <IntegrationsPanel />;
    case "security":
      return <SecurityPanel />;
    case "backup":
      return <BackupPanel />;
  }
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  defaultChecked,
}: {
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  const [v, setV] = useState(!!defaultChecked);
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <Switch checked={v} onCheckedChange={setV} />
    </div>
  );
}

function CompanyPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company name"><Input defaultValue="Mayfair Care Agency Ltd" /></Field>
        <Field label="Trading name"><Input defaultValue="Mayfair Care" /></Field>
        <Field label="CQC Registration"><Input defaultValue="1-1234567890" /></Field>
        <Field label="Companies House"><Input defaultValue="08765432" /></Field>
      </div>
      <Field label="Registered address">
        <Textarea rows={3} defaultValue="14 Curzon Street, Mayfair, London W1J 5HN" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Main phone"><Input defaultValue="+44 20 7123 4567" /></Field>
        <Field label="Support email"><Input defaultValue="support@mayfaircare.co.uk" /></Field>
      </div>
      <Separator />
      <ToggleRow label="Show company logo on invoices" defaultChecked />
      <ToggleRow label="Display CQC rating badge in portal" defaultChecked />
    </div>
  );
}

function OnCallPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="On-call number"><Input defaultValue="+44 7700 900123" /></Field>
        <Field label="Escalation number"><Input defaultValue="+44 7700 900456" /></Field>
      </div>
      <Field label="Active rota week">
        <Input defaultValue="Week 17 — H. Hassan (Mon–Sun)" />
      </Field>
      <Field label="Auto-divert hours">
        <Input defaultValue="18:00 – 08:00 weekdays, all weekend" />
      </Field>
      <Separator />
      <ToggleRow label="SMS alert on missed call" defaultChecked />
      <ToggleRow label="Record on-call calls" />
      <ToggleRow label="Notify duty manager via push" defaultChecked />
    </div>
  );
}

function LoggedInPanel() {
  const sessions = [
    { user: "Hassan Hassan", device: "Chrome • macOS", ip: "82.13.5.10", when: "Active now", current: true },
    { user: "Sarah Lewis", device: "iPhone 15 • iOS App", ip: "31.124.8.4", when: "12 min ago" },
    { user: "Tom Edwards", device: "Edge • Windows 11", ip: "92.40.18.221", when: "1 h ago" },
    { user: "Priya Shah", device: "Pixel 8 • Android App", ip: "188.29.55.7", when: "3 h ago" },
  ];
  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>Last seen</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((s) => (
            <TableRow key={s.user}>
              <TableCell className="font-medium">
                {s.user}
                {s.current && <Badge className="ml-2" variant="secondary">You</Badge>}
              </TableCell>
              <TableCell className="text-xs">{s.device}</TableCell>
              <TableCell className="text-xs font-mono">{s.ip}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{s.when}</TableCell>
              <TableCell>
                {!s.current && (
                  <Button size="sm" variant="ghost" className="text-destructive">
                    Sign out
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button variant="outline" className="w-full">Sign out all other sessions</Button>
    </div>
  );
}

function RotaPanel() {
  return (
    <div className="space-y-2">
      <ToggleRow label="Allow caregivers to swap shifts" hint="Subject to manager approval" defaultChecked />
      <ToggleRow label="Auto-publish rota on Friday 17:00" defaultChecked />
      <ToggleRow label="Block bookings outside availability" defaultChecked />
      <ToggleRow label="Require check-in within 100 m of address" defaultChecked />
      <ToggleRow label="Allow PRN medication recording on app" defaultChecked />
      <Separator />
      <div className="grid grid-cols-2 gap-3 pt-3">
        <Field label="Default visit length"><Input defaultValue="30 minutes" /></Field>
        <Field label="Travel time buffer"><Input defaultValue="10 minutes" /></Field>
        <Field label="Minimum break"><Input defaultValue="20 minutes" /></Field>
        <Field label="Late threshold"><Input defaultValue="5 minutes" /></Field>
      </div>
    </div>
  );
}

function ListsPanel() {
  const lists = [
    { name: "Visit types", count: 12 },
    { name: "Cancellation reasons", count: 8 },
    { name: "Tags & flags", count: 24 },
    { name: "Languages spoken", count: 31 },
    { name: "Allergy categories", count: 17 },
    { name: "Equipment in use", count: 22 },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {lists.map((l) => (
        <button
          key={l.name}
          className="flex items-center justify-between border border-border rounded-md p-3 hover:border-primary/50 hover:bg-accent/40 transition-colors text-left"
        >
          <div>
            <p className="text-sm font-medium">{l.name}</p>
            <p className="text-xs text-muted-foreground">{l.count} entries</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

function LogsPanel() {
  const logs = [
    { who: "Hassan Hassan", what: "Updated rota for 28 Apr", when: "Just now" },
    { who: "Sarah Lewis", what: "Created service user — J. Patel", when: "12 min ago" },
    { who: "System", what: "Backup completed (6.2 GB)", when: "2 h ago" },
    { who: "Tom Edwards", what: "Signed in from 92.40.18.221", when: "3 h ago" },
    { who: "Priya Shah", what: "Recorded MAR for visit #44218", when: "5 h ago" },
  ];
  return (
    <div className="divide-y border rounded-md">
      {logs.map((l, i) => (
        <div key={i} className="flex items-start justify-between gap-3 p-3">
          <div>
            <p className="text-sm">
              <span className="font-medium">{l.who}</span> — {l.what}
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">{l.when}</span>
        </div>
      ))}
    </div>
  );
}

function PortalPanel() {
  return (
    <div className="space-y-3">
      <ToggleRow label="Allow family to view rota" defaultChecked />
      <ToggleRow label="Allow family to view MAR chart" defaultChecked />
      <ToggleRow label="Allow family to message office" defaultChecked />
      <ToggleRow label="Allow family to upload documents" />
      <ToggleRow label="Show photos taken during visits" />
    </div>
  );
}

function LegacyPanel() {
  return (
    <div className="space-y-3">
      <Card className="p-4 bg-warning/10 border-warning/30">
        <p className="text-sm font-semibold text-foreground">Legacy portal will be retired 31 Dec 2026</p>
        <p className="text-xs text-muted-foreground mt-1">
          Please migrate accounts to the new Care Portal.
        </p>
      </Card>
      <ToggleRow label="Keep legacy portal accessible" defaultChecked />
      <ToggleRow label="Show migration banner to family users" defaultChecked />
    </div>
  );
}

function MyPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Display name"><Input defaultValue="Hassan Hassan" /></Field>
        <Field label="Job title"><Input defaultValue="Registered Manager" /></Field>
        <Field label="Email"><Input defaultValue="hassan@mayfaircare.co.uk" /></Field>
        <Field label="Mobile"><Input defaultValue="+44 7700 900111" /></Field>
      </div>
      <Separator />
      <ToggleRow label="Dark mode" />
      <ToggleRow label="Compact data tables" defaultChecked />
      <ToggleRow label="Show keyboard shortcuts hints" defaultChecked />
    </div>
  );
}

function PermissionsPanel() {
  const roles = [
    { name: "Owner", users: 1, perms: "Full access" },
    { name: "Registered Manager", users: 2, perms: "All except billing" },
    { name: "Care Coordinator", users: 5, perms: "Rota, clients, caregivers" },
    { name: "Senior Carer", users: 8, perms: "View + record visits" },
    { name: "Carer", users: 26, perms: "App access only" },
  ];
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Role</TableHead>
          <TableHead>Users</TableHead>
          <TableHead>Scope</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((r) => (
          <TableRow key={r.name}>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell>{r.users}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{r.perms}</TableCell>
            <TableCell>
              <Button size="sm" variant="ghost">Edit</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function FormsPanel() {
  const forms = ["Initial assessment", "Risk assessment", "Care plan review", "Body map", "Incident report"];
  return (
    <div className="space-y-2">
      {forms.map((f) => (
        <div key={f} className="flex items-center justify-between border rounded-md p-3">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{f}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Published</Badge>
            <Button size="sm" variant="ghost">Edit</Button>
          </div>
        </div>
      ))}
      <Button variant="outline" className="w-full">+ New form</Button>
    </div>
  );
}

function GeneralPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Language"><Input defaultValue="English (United Kingdom)" /></Field>
        <Field label="Timezone"><Input defaultValue="Europe/London (GMT+1)" /></Field>
        <Field label="Currency"><Input defaultValue="GBP — £" /></Field>
        <Field label="Date format"><Input defaultValue="DD MMM YYYY" /></Field>
        <Field label="Week starts"><Input defaultValue="Monday" /></Field>
        <Field label="Time format"><Input defaultValue="24-hour" /></Field>
      </div>
    </div>
  );
}

function TeamPanel() {
  return (
    <div className="space-y-2">
      <ToggleRow label="Carers can view future rota" defaultChecked />
      <ToggleRow label="Carers can request leave from app" defaultChecked />
      <ToggleRow label="Carers can view payslips" defaultChecked />
      <ToggleRow label="Carers can message office" defaultChecked />
      <ToggleRow label="Carers can view colleague rota" />
      <ToggleRow label="Allow profile photo upload from app" defaultChecked />
    </div>
  );
}

function MedTypesPanel() {
  const types = ["Oral", "Topical", "Inhaled", "Sub-cutaneous", "PRN", "Controlled drug", "Eye drops", "Patch"];
  return (
    <div className="flex flex-wrap gap-2">
      {types.map((t) => (
        <Badge key={t} variant="secondary" className="px-3 py-1.5 text-sm">
          {t}
        </Badge>
      ))}
      <Button variant="outline" size="sm">+ Add type</Button>
    </div>
  );
}

function MedRangesPanel() {
  const ranges = [
    { name: "Morning", start: "06:00", end: "11:00" },
    { name: "Lunchtime", start: "11:00", end: "14:00" },
    { name: "Tea-time", start: "14:00", end: "18:00" },
    { name: "Bedtime", start: "18:00", end: "23:00" },
    { name: "Overnight", start: "23:00", end: "06:00" },
  ];
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Slot</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ranges.map((r) => (
          <TableRow key={r.name}>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell><Input defaultValue={r.start} className="h-8 w-24" /></TableCell>
            <TableCell><Input defaultValue={r.end} className="h-8 w-24" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function NotificationsPanel() {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
        Email
      </p>
      <ToggleRow label="Daily summary digest" defaultChecked />
      <ToggleRow label="Late check-in alerts" defaultChecked />
      <ToggleRow label="Incident reports" defaultChecked />
      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-4 mb-2">
        In-app
      </p>
      <ToggleRow label="New message from family" defaultChecked />
      <ToggleRow label="Rota changes affecting me" defaultChecked />
      <ToggleRow label="Weekly KPI report" />
    </div>
  );
}

function BillingPanel() {
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-accent/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Current plan</p>
            <p className="text-xl font-bold">Professional</p>
            <p className="text-xs text-muted-foreground mt-0.5">£249 / month • renews 12 May 2026</p>
          </div>
          <Button>Manage plan</Button>
        </div>
      </Card>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Seats used" value="42 / 50" />
        <Stat label="This month" value="£249.00" />
        <Stat label="Last invoice" value="Paid" />
      </div>
      <Field label="Billing email"><Input defaultValue="finance@mayfaircare.co.uk" /></Field>
    </div>
  );
}

function IntegrationsPanel() {
  const items = [
    { name: "Xero", status: "Connected", icon: Mail },
    { name: "Google Calendar", status: "Connected", icon: CalendarDays },
    { name: "Stripe Payments", status: "Not connected", icon: CreditCard },
    { name: "NHS Spine", status: "Pending approval", icon: Shield },
  ];
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.name} className="flex items-center justify-between border rounded-md p-3">
          <div className="flex items-center gap-3">
            <i.icon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{i.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={i.status === "Connected" ? "default" : "secondary"}
              className={i.status === "Connected" ? "bg-success text-success-foreground" : ""}
            >
              {i.status}
            </Badge>
            <Button size="sm" variant="ghost">
              {i.status === "Connected" ? "Manage" : "Connect"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SecurityPanel() {
  return (
    <div className="space-y-3">
      <ToggleRow label="Require two-factor authentication" defaultChecked />
      <ToggleRow label="Force password change every 90 days" />
      <ToggleRow label="Lock account after 5 failed attempts" defaultChecked />
      <ToggleRow label="Restrict login to allow-listed IPs" />
      <Separator />
      <Field label="IP allow-list" hint="One CIDR per line">
        <Textarea rows={3} placeholder="82.13.5.0/24" />
      </Field>
      <Button variant="outline" className="w-full">
        <KeyRound className="h-4 w-4 mr-2" /> Rotate API keys
      </Button>
    </div>
  );
}

function BackupPanel() {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Last backup</p>
            <p className="text-xs text-muted-foreground">28 Apr 2026 • 02:00 • 6.2 GB • Healthy</p>
          </div>
          <Badge className="bg-success text-success-foreground">OK</Badge>
        </div>
      </Card>
      <ToggleRow label="Automatic nightly backups" defaultChecked />
      <ToggleRow label="Encrypt backups at rest" defaultChecked />
      <Field label="Retention period"><Input defaultValue="90 days" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline">Download backup</Button>
        <Button variant="outline">Restore from file</Button>
      </div>
    </div>
  );
}
