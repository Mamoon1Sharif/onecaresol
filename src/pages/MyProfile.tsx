import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  RotateCw,
  Trash2,
  Pencil,
  History,
  Lock,
  Plus,
  Minus,
  HelpCircle,
  Save,
  ChevronDown,
} from "lucide-react";

interface Profile {
  status: "Active" | "Inactive";
  title: string;
  firstName: string;
  surname: string;
  sex: string;
  dob: string;
  address1: string;
  address2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
  email: string;
  mobile: string;
  tel: string;
  username: string;
  role: string;
  tags: string[];
  syncToPass: boolean;
  externalSystem: string;
  externalId: string;
}

interface PpeRow {
  type: string;
  units: number;
  daily: number; // average daily usage estimate
}

const INITIAL: Profile = {
  status: "Active",
  title: "Mr",
  firstName: "Abdul",
  surname: "Basit",
  sex: "Male",
  dob: "1988-04-12",
  address1: "14 Curzon Street",
  address2: "Mayfair",
  city: "London",
  county: "Greater London",
  postcode: "W1J 5HN",
  country: "United Kingdom",
  email: "abdul@mayfaircare.co.uk",
  mobile: "+44 7700 900111",
  tel: "+44 20 7123 4567",
  username: "Abdul",
  role: "Super User",
  tags: ["Manager", "On-Call"],
  syncToPass: false,
  externalSystem: "PASSroster",
  externalId: "abdulbasit",
};

const INITIAL_PPE: PpeRow[] = [
  { type: "Facemask", units: 0, daily: 4 },
  { type: "Apron", units: 0, daily: 6 },
  { type: "Long-sleeved disposable gown", units: 0, daily: 1 },
  { type: "Gloves", units: 0, daily: 12 },
  { type: "Eye protection (disposable goggles or full-face visor)", units: 0, daily: 1 },
  { type: "Hand sanitiser", units: 0, daily: 0.25 },
];

export default function MyProfile() {
  const { toast } = useToast();
  const [p, setP] = useState<Profile>(INITIAL);
  const [ppe, setPpe] = useState<PpeRow[]>(INITIAL_PPE);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [pwdLocked, setPwdLocked] = useState(true);
  const [propertiesLocked, setPropertiesLocked] = useState(true);

  const update = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((s) => ({ ...s, [k]: v }));

  const toggleTag = (t: string) => {
    setP((s) => ({
      ...s,
      tags: s.tags.includes(t) ? s.tags.filter((x) => x !== t) : [...s.tags, t],
    }));
  };

  const generateTempPassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const pwd = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    navigator.clipboard?.writeText(pwd);
    toast({ title: "Temporary password generated", description: `${pwd} — copied to clipboard` });
  };

  const onAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setAvatar(String(r.result));
    r.readAsDataURL(f);
  };

  const adjustPpe = (i: number, d: number) =>
    setPpe((rows) => rows.map((r, idx) => (idx === i ? { ...r, units: Math.max(0, r.units + d) } : r)));

  const setPpeValue = (i: number, v: string) =>
    setPpe((rows) => rows.map((r, idx) => (idx === i ? { ...r, units: Math.max(0, Number(v) || 0) } : r)));

  const daysRemaining = (r: PpeRow) =>
    r.units === 0 ? "Unknown" : `${Math.floor(r.units / Math.max(0.01, r.daily))} days`;

  const save = () => toast({ title: "Profile saved", description: "Your changes have been updated." });

  return (
    <AppLayout>
      <TooltipProvider delayDuration={150}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Account</p>
              <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
              <p className="text-sm text-muted-foreground mt-1">Personal details, login, role and PPE allocation.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setP(INITIAL)}>
                Reset
              </Button>
              <Button onClick={save}>
                <Save className="h-4 w-4 mr-2" /> Save changes
              </Button>
            </div>
          </div>

          {/* Two-column layout matching the SS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* LEFT COLUMN */}
            <div className="space-y-5">
              {/* Main details */}
              <Section title="Main details">
                <div className="space-y-3">
                  <FieldBlock label="Status">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          p.status === "Active"
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {p.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => update("status", p.status === "Active" ? "Inactive" : "Active")}
                      >
                        <Pencil className="h-3 w-3 mr-1" /> Update
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <History className="h-3 w-3 mr-1" /> History
                      </Button>
                    </div>
                  </FieldBlock>

                  <FieldBlock label="Title">
                    <Select value={p.title} onValueChange={(v) => update("title", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Mr", "Mrs", "Ms", "Miss", "Dr", "Prof"].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldBlock>

                  <div className="grid grid-cols-2 gap-3">
                    <FieldBlock label="First Name">
                      <Input value={p.firstName} onChange={(e) => update("firstName", e.target.value)} />
                    </FieldBlock>
                    <FieldBlock label="Surname">
                      <Input value={p.surname} onChange={(e) => update("surname", e.target.value)} />
                    </FieldBlock>
                  </div>

                  <FieldBlock label="Sex">
                    <Select value={p.sex} onValueChange={(v) => update("sex", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Male", "Female", "Prefer not to say"].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldBlock>

                  <FieldBlock label="DOB">
                    <Input type="date" value={p.dob} onChange={(e) => update("dob", e.target.value)} />
                  </FieldBlock>
                </div>
              </Section>

              {/* Contact information */}
              <Section title="Contact information">
                <div className="space-y-3">
                  <FieldBlock label="Address 1">
                    <Input value={p.address1} onChange={(e) => update("address1", e.target.value)} />
                  </FieldBlock>
                  <FieldBlock label="Address 2">
                    <Input value={p.address2} onChange={(e) => update("address2", e.target.value)} />
                  </FieldBlock>
                  <div className="grid grid-cols-2 gap-3">
                    <FieldBlock label="City">
                      <Input value={p.city} onChange={(e) => update("city", e.target.value)} />
                    </FieldBlock>
                    <FieldBlock label="County">
                      <Input value={p.county} onChange={(e) => update("county", e.target.value)} />
                    </FieldBlock>
                    <FieldBlock label="Postcode">
                      <Input value={p.postcode} onChange={(e) => update("postcode", e.target.value)} />
                    </FieldBlock>
                    <FieldBlock label="Country">
                      <Input value={p.country} onChange={(e) => update("country", e.target.value)} />
                    </FieldBlock>
                  </div>
                  <FieldBlock label="Email">
                    <Input type="email" value={p.email} onChange={(e) => update("email", e.target.value)} />
                  </FieldBlock>
                  <FieldBlock label="Mobile">
                    <Input value={p.mobile} onChange={(e) => update("mobile", e.target.value)} />
                  </FieldBlock>
                  <FieldBlock label="Tel">
                    <Input value={p.tel} onChange={(e) => update("tel", e.target.value)} />
                  </FieldBlock>
                </div>
              </Section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-5">
              {/* Image */}
              <Section title="Image">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-accent cursor-pointer transition-colors">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      <input type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
                    </label>
                    <button
                      onClick={() => setAvatar(null)}
                      className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                      title="Reset"
                    >
                      <RotateCw className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setAvatar(null)}
                      className="h-9 w-9 rounded-full border border-destructive/40 flex items-center justify-center hover:bg-destructive/10 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                  <div className="w-full aspect-[4/3] rounded-md border border-border bg-muted/40 flex items-center justify-center overflow-hidden">
                    {avatar ? (
                      <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Camera className="h-10 w-10 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">No photo uploaded</p>
                        <p className="text-[11px] opacity-70">JPG or PNG, up to 5 MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </Section>

              {/* Tags */}
              <Section title="Tags">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                    {p.tags.length === 0 && <span className="text-xs text-muted-foreground">No tags selected</span>}
                    {p.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="gap-1">
                        {t}
                        <button onClick={() => toggleTag(t)} className="hover:text-destructive">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Select onValueChange={(v) => toggleTag(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Manager", "On-Call", "Trainer", "Driver", "First Aider", "Mentor"].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t} {p.tags.includes(t) ? "✓" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Section>

              {/* Login details */}
              <Section title="Login details">
                <div className="space-y-3">
                  <FieldBlock label="Username">
                    <Input
                      value={p.username}
                      onChange={(e) => update("username", e.target.value)}
                      className="bg-muted/60"
                    />
                  </FieldBlock>
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                    <FieldBlock label="Password">
                      <div className="relative">
                        <Input
                          type="password"
                          value="••••••"
                          readOnly={pwdLocked}
                          onFocus={() => setPwdLocked(false)}
                        />
                      </div>
                    </FieldBlock>
                    <Button onClick={generateTempPassword}>Generate temp password</Button>
                  </div>
                  <button className="text-xs text-primary hover:underline">Show password policy</button>
                </div>
              </Section>

              {/* Role */}
              <Section title="Role">
                <Select value={p.role} onValueChange={(v) => update("role", v)}>
                  <SelectTrigger className="bg-muted/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Super User", "Registered Manager", "Care Coordinator", "Senior Carer", "Carer"].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Section>

              {/* Care Groups */}
              <Section title="Care Groups">
                <CareGroups />
              </Section>

              {/* Integration details */}
              <Section
                title="Integration details"
                action={
                  <button
                    className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-accent"
                    title="Lock"
                  >
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                }
              >
                <div className="space-y-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary/10">
                        <TableHead className="text-foreground font-semibold">External System</TableHead>
                        <TableHead className="text-foreground font-semibold">External ID</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Select value={p.externalSystem} onValueChange={(v) => update("externalSystem", v)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["PASSroster", "Xero", "NHS Spine", "Google Calendar"].map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={p.externalId}
                            onChange={(e) => update("externalId", e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <label className="flex items-center gap-2 text-xs">
                    <Checkbox checked={p.syncToPass} onCheckedChange={(c) => update("syncToPass", !!c)} />
                    Sync details changes to PASSroster
                  </label>
                </div>
              </Section>

              {/* Properties */}
              <Section
                title="Properties"
                action={
                  <Button size="icon" variant="outline" className="h-7 w-7">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                }
              >
                <p className="text-xs text-muted-foreground">No custom properties yet.</p>
              </Section>
            </div>
          </div>

          {/* PPE STOCK — full width */}
          <Section
            title="PPE stock"
            subtitle={
              <span className="text-xs text-muted-foreground">
                Last updated at <span className="font-medium text-foreground">2025-12-02 14:47</span>
              </span>
            }
          >
            <div className="space-y-3">
              <div className="rounded-md bg-accent/40 border border-accent p-3 text-xs text-foreground/80 leading-relaxed">
                Days remaining is an approximation based on your PPE stock history and the current PPE stock. It's
                important to update your office PPE stock levels regularly in order for PASS to calculate this more
                accurately.
                <br />
                Please ensure the unit recorded is consistent across your organisation.
                <br />
                <span className="italic">
                  E.g. if you choose to record in packs of 10, everyone should record in packs of 10.
                </span>
              </div>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10 hover:bg-primary/10">
                      <TableHead className="text-foreground font-semibold">Type</TableHead>
                      <TableHead className="text-foreground font-semibold w-56">Units</TableHead>
                      <TableHead className="text-foreground font-semibold w-44">
                        <span className="inline-flex items-center gap-1">
                          Days Remaining
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>Based on average daily usage across your organisation.</TooltipContent>
                          </Tooltip>
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ppe.map((r, i) => (
                      <TableRow key={r.type}>
                        <TableCell className="font-medium text-sm">{r.type}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => adjustPpe(i, -1)}>
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <Input
                              type="number"
                              min={0}
                              value={r.units}
                              onChange={(e) => setPpeValue(i, e.target.value)}
                              className="h-8 w-20 text-center"
                            />
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => adjustPpe(i, 1)}>
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              r.units === 0 ? "border-muted text-muted-foreground" : "border-success text-success"
                            }
                          >
                            {daysRemaining(r)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground italic">
                <span className="font-semibold">*</span> Based on estimated daily usage levels.
              </p>
            </div>
          </Section>
        </div>
      </TooltipProvider>
    </AppLayout>
  );
}

/* ---------- helpers ---------- */

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/40">
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h2>
          {subtitle}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</Label>
      {children}
    </div>
  );
}

function CareGroups() {
  const groups = ["North London", "South London", "Westminster", "City of London", "Greenwich"];
  const [all, setAll] = useState(false);
  const [sel, setSel] = useState<string[]>(["Westminster"]);
  const toggle = (g: string) => setSel((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={all}
          onCheckedChange={(c) => {
            setAll(!!c);
            setSel(c ? groups : []);
          }}
        />
        Select all care groups
      </label>
      <div className="grid grid-cols-2 gap-1.5 pl-1">
        {groups.map((g) => (
          <label key={g} className="flex items-center gap-2 text-sm">
            <Checkbox checked={sel.includes(g)} onCheckedChange={() => toggle(g)} />
            {g}
          </label>
        ))}
      </div>
    </div>
  );
}
