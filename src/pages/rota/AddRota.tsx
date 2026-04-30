import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  ArrowLeft,
  MapPin,
  User,
  Save,
  Loader2,
  Pill,
  ClipboardList,
  CalendarDays,
  Clock,
  Briefcase,
  AlertTriangle,
  Repeat,
  FileText,
  ShieldCheck,
  ChevronRight,
  Info,
} from "lucide-react";
import { useCareReceivers, useCareGivers, useUpsertShift, useMedications } from "@/hooks/use-care-data";
import { getCareReceiverAvatar } from "@/lib/avatars";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutes = ["00", "15", "30", "45"];

const SERVICE_OPTIONS = [
  "CHC - Morning Call",
  "CHC - Lunch Call",
  "CHC - Tea Call",
  "CHC - Evening Call",
  "Domiciliary",
  "Live-In",
  "Respite",
  "Waking Night",
  "Sleeping Night",
];

const calcAge = (dob?: string | null) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
};

const AddRota = () => {
  const { data: receivers = [], isLoading } = useCareReceivers();
  const { data: caregivers = [] } = useCareGivers();
  const upsertShift = useUpsertShift();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: medications = [] } = useMedications(selectedId ?? undefined);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    serviceList: "CHC - Evening Call",
    rotaType: "Normal",
    date: today,
    startH: "20",
    startM: "00",
    endH: "21",
    endM: "00",
    staff1: "",
    medicationRequired: false,
    tasksRequired: false,
    addTimeLock: false,
    linkUp: false,
    alert: false,
    recurring: false,
    template: false,
  });
  const [selectedMedIds, setSelectedMedIds] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Dedup MAR medications by name+dosage+time so the same prescription isn't repeated.
  const uniqueMeds = useMemo(() => {
    const map = new Map<string, any>();
    for (const m of medications as any[]) {
      const key = `${(m.medication || "").toLowerCase()}|${(m.dosage || "").toLowerCase()}|${(m.time_of_day || "").toLowerCase()}`;
      if (!map.has(key)) map.set(key, m);
    }
    return Array.from(map.values());
  }, [medications]);

  // Bucket the shift's start time into a time-of-day window.
  const shiftWindow = useMemo(() => {
    const h = parseInt(form.startH, 10);
    if (h >= 6 && h < 11) return "Morning";
    if (h >= 11 && h < 14) return "Lunch";
    if (h >= 14 && h < 18) return "Tea";
    if (h >= 18 && h < 21) return "Evening";
    return "Night";
  }, [form.startH]);

  // Group medications by time-of-day for display.
  const TOD_ORDER = ["Morning", "Lunch", "Tea", "Evening", "Night"] as const;
  const medsByTod = useMemo(() => {
    const groups: Record<string, any[]> = { Morning: [], Lunch: [], Tea: [], Evening: [], Night: [], Other: [] };
    for (const m of uniqueMeds) {
      const t = (m as any).time_of_day || "Other";
      (groups[t] ??= []).push(m);
    }
    return groups;
  }, [uniqueMeds]);

  // Auto-select the meds that match the current shift window when medication is enabled.
  useEffect(() => {
    if (!form.medicationRequired) return;
    const matching = uniqueMeds
      .filter((m: any) => (m.time_of_day || "").toLowerCase() === shiftWindow.toLowerCase())
      .map((m: any) => m.id);
    setSelectedMedIds(matching);
  }, [form.medicationRequired, shiftWindow, uniqueMeds]);

  const toggleMed = (id: string) => setSelectedMedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleTask = (t: string) => setSelectedTasks((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const filtered = useMemo(
    () =>
      receivers
        .filter((r) => r.care_status !== "Discharged")
        .filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [receivers, search],
  );

  const selected = useMemo(() => receivers.find((r) => r.id === selectedId) ?? null, [receivers, selectedId]);
  const selectedCaregiver = useMemo(
    () => caregivers.find((c) => c.id === form.staff1) ?? null,
    [caregivers, form.staff1],
  );

  const startMins = parseInt(form.startH) * 60 + parseInt(form.startM);
  let endMinsAdj = parseInt(form.endH) * 60 + parseInt(form.endM);
  if (endMinsAdj < startMins) endMinsAdj += 24 * 60;
  const durationMinutes = endMinsAdj - startMins;
  const duration = `${String(Math.floor(durationMinutes / 60)).padStart(2, "0")}:${String(durationMinutes % 60).padStart(2, "0")}`;

  const handleDurationSlider = (val: number[]) => {
    const total = (startMins + val[0]) % (24 * 60);
    setForm({
      ...form,
      endH: String(Math.floor(total / 60)).padStart(2, "0"),
      endM: String(total % 60).padStart(2, "0"),
    });
  };

  const handleSave = async () => {
    if (!selected) return;
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("You must be signed in to save a rota.");

      const { data: companyUser, error: companyError } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (companyError) throw companyError;
      if (!companyUser?.company_id) throw new Error("Your account is not linked to a company.");

      const day = new Date(form.date).getDay();
      const staffId = form.staff1 || null;
      const durHours = Math.max(1, Math.round(durationMinutes / 60));

      await upsertShift.mutateAsync({
        care_giver_id: staffId as any,
        care_receiver_id: selected.id,
        day,
        start_time: `${form.startH}:${form.startM}`,
        end_time: `${form.endH}:${form.endM}`,
        shift_type: form.serviceList,
        notes: `Rota Type: ${form.rotaType}${form.alert ? " · Alert" : ""}`,
      });

      const { data: dvRow, error: dvErr } = await supabase
        .from("daily_visits")
        .insert({
          company_id: companyUser.company_id,
          care_receiver_id: selected.id,
          care_giver_id: staffId,
          visit_date: form.date,
          start_hour: parseInt(form.startH),
          duration: durHours,
          status: staffId ? "Confirmed" : "Pending",
        })
        .select("id")
        .single();
      if (dvErr) throw dvErr;

      const taskTitles: string[] = [];
      if (form.tasksRequired) taskTitles.push(...selectedTasks);
      if (form.medicationRequired) {
        for (const mid of selectedMedIds) {
          const m = uniqueMeds.find((x: any) => x.id === mid);
          if (m) taskTitles.push(`Administer ${m.medication}${m.dosage ? ` (${m.dosage})` : ""}`);
        }
      }
      if (dvRow?.id && taskTitles.length > 0) {
        const { error: stErr } = await supabase
          .from("shift_tasks")
          .insert(taskTitles.map((title) => ({ daily_visit_id: dvRow.id, title })));
        if (stErr) throw stErr;
      }

      await queryClient.invalidateQueries({ queryKey: ["daily_visits"] });
      await queryClient.invalidateQueries({ queryKey: ["shift_tasks"] });
      toast.success("Shift saved successfully");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save shift");
    }
  };

  // ── Service-member picker ──
  if (!selected) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add Rota</h1>
            <p className="text-sm text-muted-foreground mt-1">Select a service member to schedule a new shift.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search service members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card border-border"
              />
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1.5">
              {filtered.length} results
            </Badge>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No service members found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className="group flex items-center gap-3 border border-border rounded-xl bg-card p-3 text-left hover:shadow-md hover:border-primary/40 transition-all"
                >
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-border shrink-0">
                    <img
                      src={getCareReceiverAvatar(r.id, r.avatar_url)}
                      alt={r.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{r.name}</div>
                    {r.address && (
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {r.address}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // ── Add-shift screen ──
  const age = calcAge(selected.dob);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">New Rota</h1>
              <p className="text-xs text-muted-foreground">Schedule a shift for {selected.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={upsertShift.isPending} className="gap-2">
              {upsertShift.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Rota
            </Button>
          </div>
        </div>

        {/* Service-user banner */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-background shadow-sm shrink-0">
              <img
                src={getCareReceiverAvatar(selected.id, selected.avatar_url)}
                alt={selected.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{selected.name}</span>
                {age !== null && <span className="text-xs text-muted-foreground">· Age {age}</span>}
                <Badge variant="outline" className="text-[10px]">
                  {selected.care_status || "Active"}
                </Badge>
                {selected.care_type && (
                  <Badge variant="secondary" className="text-[10px]">
                    {selected.care_type}
                  </Badge>
                )}
              </div>
              {selected.address && (
                <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" /> {selected.address}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* MAIN: form sections */}
          <div className="lg:col-span-2 space-y-5">
            {/* 1. Service & Type */}
            <Section icon={Briefcase} title="Service & rota type" subtitle="What kind of visit is this?">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Service" required>
                  <Select value={form.serviceList} onValueChange={(v) => setForm({ ...form, serviceList: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Rota type" required>
                  <Select value={form.rotaType} onValueChange={(v) => setForm({ ...form, rotaType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Alternative">Alternative</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-1">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                Alternative rota types are handled differently when running wages.
              </p>
            </Section>

            {/* 2. When */}
            <Section icon={CalendarDays} title="When" subtitle="Date, start, end and duration.">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Date" required>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </Field>
                <Field label="Start time" required>
                  <TimePicker
                    h={form.startH}
                    m={form.startM}
                    onH={(v) => setForm({ ...form, startH: v })}
                    onM={(v) => setForm({ ...form, startM: v })}
                  />
                </Field>
                <Field label="End time" required>
                  <TimePicker
                    h={form.endH}
                    m={form.endM}
                    onH={(v) => setForm({ ...form, endH: v })}
                    onM={(v) => setForm({ ...form, endM: v })}
                  />
                </Field>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-primary" /> Duration
                  </Label>
                  <span className="text-primary font-semibold text-sm tabular-nums">{duration}</span>
                </div>
                <Slider
                  min={15}
                  max={24 * 60}
                  step={15}
                  value={[Math.max(15, durationMinutes)]}
                  onValueChange={handleDurationSlider}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>15m</span>
                  <span>6h</span>
                  <span>12h</span>
                  <span>18h</span>
                  <span>24h</span>
                </div>
              </div>
            </Section>

            {/* 3. Caregiver */}
            <Section icon={User} title="Care giver" subtitle="Assign or leave open for later.">
              <Field label="Assign caregiver">
                <Select value={form.staff1} onValueChange={(v) => setForm({ ...form, staff1: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a caregiver…" />
                  </SelectTrigger>
                  <SelectContent>
                    {caregivers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <User className="h-3 w-3" /> {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <p className="text-[11px] text-destructive flex items-start gap-1.5">
                <ShieldCheck className="h-3 w-3 mt-0.5 shrink-0" />
                Service-user preference lock is on — caregivers rated below 3 won't be available.
              </p>
            </Section>

            {/* 4. Medications */}
            <Section
              icon={Pill}
              title="Medication"
              subtitle="Pulled live from the MAR chart."
              right={
                <SwitchRow
                  checked={form.medicationRequired}
                  onChange={(v) => setForm({ ...form, medicationRequired: v })}
                />
              }
            >
              {form.medicationRequired ? (
                uniqueMeds.length === 0 ? (
                  <EmptyState text="No prescriptions on the MAR chart for this service member." />
                ) : (
                  <>
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 flex items-center gap-2 text-xs">
                      <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>
                        Shift starts at{" "}
                        <strong>
                          {form.startH}:{form.startM}
                        </strong>{" "}
                        · auto-selected <strong>{shiftWindow}</strong> medications.
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {uniqueMeds.length} prescription{uniqueMeds.length !== 1 ? "s" : ""} from MAR ·{" "}
                        {selectedMedIds.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedMedIds(
                            selectedMedIds.length === uniqueMeds.length ? [] : uniqueMeds.map((m: any) => m.id),
                          )
                        }
                        className="text-primary hover:underline font-medium"
                      >
                        {selectedMedIds.length === uniqueMeds.length ? "Clear all" : "Select all"}
                      </button>
                    </div>
                    <div className="space-y-3">
                      {TOD_ORDER.concat(["Other" as any]).map((tod) => {
                        const items = medsByTod[tod] || [];
                        if (items.length === 0) return null;
                        const isCurrent = tod === shiftWindow;
                        return (
                          <div key={tod} className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Badge variant={isCurrent ? "default" : "outline"} className="text-[10px]">
                                {tod}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {items.length} med{items.length !== 1 ? "s" : ""}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] text-primary font-medium">· matches this shift</span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {items.map((m: any) => {
                                const checked = selectedMedIds.includes(m.id);
                                return (
                                  <label
                                    key={m.id}
                                    className={cn(
                                      "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                                      checked
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/40 hover:bg-muted/40",
                                    )}
                                  >
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={() => toggleMed(m.id)}
                                      className="mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-2">
                                        <Pill className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                          <div className="text-sm font-semibold truncate">{m.medication}</div>
                                          {m.dosage && <div className="text-xs text-muted-foreground">{m.dosage}</div>}
                                          {m.scheduled_time && (
                                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                              <Clock className="h-2.5 w-2.5" /> {m.scheduled_time}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {m.notes && (
                                        <div className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">
                                          {m.notes}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )
              ) : (
                <p className="text-xs text-muted-foreground">
                  Toggle on to auto-pull doctor-approved medications from the MAR chart for this time of day.
                </p>
              )}
            </Section>

            {/* 5. Tasks */}
            <Section
              icon={ClipboardList}
              title="Tasks"
              subtitle="Pre-approved by the service member."
              right={
                <SwitchRow checked={form.tasksRequired} onChange={(v) => setForm({ ...form, tasksRequired: v })} />
              }
            >
              {form.tasksRequired ? (
                ((selected as any).approved_tasks ?? []).length === 0 ? (
                  <EmptyState text="No approved tasks set for this service member." />
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {((selected as any).approved_tasks as string[]).length} approved · {selectedTasks.length}{" "}
                        selected
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const all = (selected as any).approved_tasks as string[];
                          setSelectedTasks(selectedTasks.length === all.length ? [] : all);
                        }}
                        className="text-primary hover:underline font-medium"
                      >
                        {selectedTasks.length === ((selected as any).approved_tasks as string[]).length
                          ? "Clear all"
                          : "Select all"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {((selected as any).approved_tasks as string[]).map((t) => {
                        const checked = selectedTasks.includes(t);
                        return (
                          <label
                            key={t}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-all",
                              checked
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40 hover:bg-muted/40",
                            )}
                          >
                            <Checkbox checked={checked} onCheckedChange={() => toggleTask(t)} />
                            <span className="text-sm">{t}</span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )
              ) : (
                <p className="text-xs text-muted-foreground">No tasks will be assigned for this shift.</p>
              )}
            </Section>

            {/* 6. Options */}
            <Section icon={Repeat} title="Options" subtitle="Recurrence, alerts and templates.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ToggleCard
                  icon={Clock}
                  label="Add time lock"
                  checked={form.addTimeLock}
                  onChange={(v) => setForm({ ...form, addTimeLock: v })}
                />
                <ToggleCard
                  icon={Repeat}
                  label="Link up shifts"
                  checked={form.linkUp}
                  onChange={(v) => setForm({ ...form, linkUp: v })}
                />
                <ToggleCard
                  icon={AlertTriangle}
                  label="Mark as alert"
                  checked={form.alert}
                  onChange={(v) => setForm({ ...form, alert: v })}
                />
                <ToggleCard
                  icon={Repeat}
                  label="Recurring shift"
                  checked={form.recurring}
                  onChange={(v) => setForm({ ...form, recurring: v })}
                />
                <ToggleCard
                  icon={FileText}
                  label="Save as template"
                  checked={form.template}
                  onChange={(v) => setForm({ ...form, template: v })}
                />
              </div>
            </Section>
          </div>

          {/* SIDEBAR: live summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Rota summary</h3>
                    <Badge variant="outline" className="text-[10px]">
                      Preview
                    </Badge>
                  </div>

                  <SummaryRow label="Service" value={form.serviceList} />
                  <SummaryRow label="Rota type" value={form.rotaType} />
                  <SummaryRow
                    label="Date"
                    value={new Date(form.date).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  />
                  <SummaryRow label="Time" value={`${form.startH}:${form.startM} → ${form.endH}:${form.endM}`} />
                  <SummaryRow label="Duration" value={duration} highlight />
                  <SummaryRow
                    label="Caregiver"
                    value={selectedCaregiver?.name || <span className="text-muted-foreground italic">Unassigned</span>}
                  />

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Pill className="h-3 w-3" /> Medications
                      </span>
                      <Badge
                        variant={form.medicationRequired && selectedMedIds.length > 0 ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {form.medicationRequired ? `${selectedMedIds.length} selected` : "None"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <ClipboardList className="h-3 w-3" /> Tasks
                      </span>
                      <Badge
                        variant={form.tasksRequired && selectedTasks.length > 0 ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {form.tasksRequired ? `${selectedTasks.length} selected` : "None"}
                      </Badge>
                    </div>
                    {form.alert && (
                      <div className="flex items-center gap-1.5 text-xs text-warning">
                        <AlertTriangle className="h-3 w-3" /> Alert flagged
                      </div>
                    )}
                    {form.recurring && (
                      <div className="flex items-center gap-1.5 text-xs text-primary">
                        <Repeat className="h-3 w-3" /> Recurring
                      </div>
                    )}
                  </div>

                  <Button onClick={handleSave} disabled={upsertShift.isPending} className="w-full gap-2">
                    {upsertShift.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Rota
                  </Button>
                </CardContent>
              </Card>

              {form.medicationRequired && selectedMedIds.length > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Medications on this shift
                    </h3>
                    {selectedMedIds.map((id) => {
                      const m: any = uniqueMeds.find((x: any) => x.id === id);
                      if (!m) return null;
                      return (
                        <div key={id} className="flex items-start gap-2 text-xs">
                          <Pill className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                          <div>
                            <div className="font-medium">{m.medication}</div>
                            {m.dosage && <div className="text-muted-foreground">{m.dosage}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

// ── small presentational helpers ──
const Section = ({
  icon: Icon,
  title,
  subtitle,
  right,
  children,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Card>
    <CardContent className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      <div className="space-y-3">{children}</div>
    </CardContent>
  </Card>
);

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium text-muted-foreground">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {children}
  </div>
);

const TimePicker = ({
  h,
  m,
  onH,
  onM,
}: {
  h: string;
  m: string;
  onH: (v: string) => void;
  onM: (v: string) => void;
}) => (
  <div className="flex items-center gap-1.5">
    <Select value={h} onValueChange={onH}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {hours.map((x) => (
          <SelectItem key={x} value={x}>
            {x}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <span className="text-muted-foreground font-medium">:</span>
    <Select value={m} onValueChange={onM}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {minutes.map((x) => (
          <SelectItem key={x} value={x}>
            {x}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const SwitchRow = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-muted-foreground">{checked ? "Required" : "Not required"}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const ToggleCard = ({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: any;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label
    className={cn(
      "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all",
      checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/40",
    )}
  >
    <Icon className={cn("h-4 w-4 shrink-0", checked ? "text-primary" : "text-muted-foreground")} />
    <span className="text-sm flex-1">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </label>
);

const SummaryRow = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
  <div className="flex items-center justify-between gap-3 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className={cn("text-right font-medium tabular-nums", highlight && "text-primary text-sm")}>{value}</span>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-muted/20">
    {text}
  </div>
);

export default AddRota;
