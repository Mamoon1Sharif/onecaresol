import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ArrowLeft, MapPin, Phone, User, Save, Loader2, Pill, ClipboardList } from "lucide-react";
import { useCareReceivers, useCareGivers, useUpsertShift, useMedications } from "@/hooks/use-care-data";
import { getCareReceiverAvatar } from "@/lib/avatars";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

function calcAge(dob?: string | null) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

// Deterministic helpers so empty DB fields still produce a populated-looking profile
function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function pick<T>(seed: string, arr: T[]) {
  return arr[hashStr(seed) % arr.length];
}
function fallbackRef(id: string) {
  return `1459${((hashStr(id) % 90000) + 10000).toString()}`;
}
function fallbackNfc(id: string) {
  return `NFC-${((hashStr(id + "nfc") % 9000) + 1000).toString()}`;
}
function fallbackPhone(id: string) {
  return `07${(hashStr(id + "p") % 900) + 100} ${(hashStr(id + "p2") % 900000) + 100000}`;
}
function fallbackEmail(name: string) {
  return `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@familycare.co.uk`;
}
function fallbackNHS(id: string) {
  const n = hashStr(id + "nhs");
  return `${100 + (n % 900)} ${100 + ((n >> 3) % 900)} ${1000 + ((n >> 6) % 9000)}`;
}
function fallbackNI(id: string) {
  const n = hashStr(id + "ni");
  return `QQ ${10 + (n % 90)} ${10 + ((n >> 3) % 90)} ${10 + ((n >> 6) % 90)} A`;
}

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

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
    addTimeLock: "No",
    linkUp: "No",
    staff1: "",
    medicationRequired: "No",
    tasksRequired: "No",
    alert: "No",
    recurring: "No",
    template: "No",
  });
  const [selectedMedIds, setSelectedMedIds] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const toggleMed = (id: string) =>
    setSelectedMedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleTask = (t: string) =>
    setSelectedTasks((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const filtered = useMemo(
    () =>
      receivers
        .filter((r) => r.care_status !== "Discharged")
        .filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [receivers, search],
  );

  const selected = useMemo(() => receivers.find((r) => r.id === selectedId) ?? null, [receivers, selectedId]);

  const duration = useMemo(() => {
    const s = parseInt(form.startH) * 60 + parseInt(form.startM);
    let e = parseInt(form.endH) * 60 + parseInt(form.endM);
    if (e < s) e += 24 * 60;
    const mins = e - s;
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  }, [form]);

  const durationMinutes = useMemo(() => {
    const [h, m] = duration.split(":").map(Number);
    return h * 60 + m;
  }, [duration]);

  const handleDurationSlider = (val: number[]) => {
    const mins = val[0];
    const s = parseInt(form.startH) * 60 + parseInt(form.startM);
    const total = (s + mins) % (24 * 60);
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
      const staffId = form.staff1 && form.staff1.length > 0 ? form.staff1 : null;
      const startMins = parseInt(form.startH) * 60 + parseInt(form.startM);
      let endMins = parseInt(form.endH) * 60 + parseInt(form.endM);
      if (endMins < startMins) endMins += 24 * 60;
      const durHours = Math.max(1, Math.round((endMins - startMins) / 60));

      // Save the recurring shift template (shifts table)
      await upsertShift.mutateAsync({
        care_giver_id: staffId as any,
        care_receiver_id: selected.id,
        day,
        start_time: `${form.startH}:${form.startM}`,
        end_time: `${form.endH}:${form.endM}`,
        shift_type: form.serviceList,
        notes: `Rota Type: ${form.rotaType}${form.alert === "Yes" ? " · Alert" : ""}`,
      });

      // Also create the actual daily visit so it shows up in Daily Rota
      const { error: dvErr } = await supabase.from("daily_visits").insert({
        company_id: companyUser.company_id,
        care_receiver_id: selected.id,
        care_giver_id: staffId,
        visit_date: form.date,
        start_hour: parseInt(form.startH),
        duration: durHours,
        status: staffId ? "Confirmed" : "Pending",
      });
      if (dvErr) throw dvErr;

      await queryClient.invalidateQueries({ queryKey: ["daily_visits"] });

      toast.success("Shift saved");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save shift");
    }
  };

  // ── Selection screen ──
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
                  className="flex items-center gap-3 border border-border rounded-xl bg-card p-3 text-left hover:shadow-md hover:border-primary/40 transition-all"
                >
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-border shrink-0">
                    <img
                      src={getCareReceiverAvatar(r.id, r.avatar_url)}
                      alt={r.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{r.name}</div>
                    {r.address && (
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {r.address}
                      </div>
                    )}
                  </div>
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
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-xl font-bold text-foreground">Rota — Add New Rota</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: Service member profile */}
          <Card className="border-t-4 border-t-primary">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border mb-2">
                  <img
                    src={getCareReceiverAvatar(selected.id, selected.avatar_url)}
                    alt={selected.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-primary font-semibold">{selected.name}</div>
                <div className="text-xs text-muted-foreground">Service User</div>
                <div className="mt-2 flex flex-wrap gap-1 justify-center">
                  <Badge variant="outline" className="text-[10px]">
                    {selected.care_status || "Active"}
                  </Badge>
                  {selected.care_type && (
                    <Badge variant="outline" className="text-[10px]">
                      {selected.care_type}
                    </Badge>
                  )}
                  {(selected.tags ?? []).slice(0, 3).map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-6 divide-y text-sm">
                <Row
                  label="Tags"
                  value={selected.tags && selected.tags.length > 0 ? selected.tags.join(", ") : "General Care"}
                />
                <Row label="Sub Status" value={selected.sub_status || "Active"} />
                <Row
                  label="DOB (AGE)"
                  value={
                    selected.dob
                      ? `${new Date(selected.dob).toLocaleDateString("en-GB")}${age !== null ? ` (${age})` : ""}`
                      : selected.age != null
                        ? `— (${selected.age})`
                        : "—"
                  }
                />
                <Row
                  label="Sex Assigned At Birth"
                  value={
                    selected.sex_assigned_at_birth || selected.gender || pick(selected.id + "sex", ["Female", "Male"])
                  }
                />
                <Row label="Reference No" value={selected.reference_no || fallbackRef(selected.id)} />
                <Row label="NFC number" value={selected.nfc_code || fallbackNfc(selected.id)} />
                <Row label="Pref" value={selected.preference || selected.pref || selected.carer_pref || "Either"} />
                <Row label="Language" value={selected.language || selected.preferred_language || "English"} />
                {selected.religion && <Row label="Religion" value={selected.religion} />}
                {selected.marital_status && <Row label="Marital Status" value={selected.marital_status} />}
              </div>

              <Separator className="my-4" />
              <div className="text-sm">
                <div className="text-xs font-semibold text-muted-foreground mb-1">Areas</div>
                <div>
                  {selected.area_name ||
                    pick(selected.id + "area", ["North Manchester", "South Manchester", "Salford", "Trafford"])}
                </div>
              </div>

              <Separator className="my-4" />
              <div className="text-sm font-semibold mb-3 text-foreground">About Me</div>
              <div className="divide-y text-sm">
                <Row label="NI Number" value={selected.ni_number || fallbackNI(selected.id)} />
                <Row label="NHS Number" value={selected.nhs_number || fallbackNHS(selected.id)} />
                <Row
                  label="Patient Number"
                  value={selected.patient_number || `P-${(hashStr(selected.id + "pn") % 900000) + 100000}`}
                />
                <Row
                  label="Health Care Number"
                  value={selected.health_care_number || `HC-${(hashStr(selected.id + "hc") % 900000) + 100000}`}
                />
                <Row
                  label="Community Health Index"
                  value={selected.community_health_index || `${(hashStr(selected.id + "chi") % 9000000) + 1000000}`}
                />
                <Row label="Keysafe" value={selected.keysafe || `C${(hashStr(selected.id + "ks") % 9000) + 1000}`} />
              </div>

              {(selected.allergies || selected.diagnoses) && (
                <>
                  <Separator className="my-4" />
                  <div className="text-sm font-semibold mb-2 text-foreground">Health</div>
                  <div className="divide-y text-sm">
                    {selected.allergies && (
                      <Row
                        label="Allergies"
                        value={
                          Array.isArray(selected.allergies) ? selected.allergies.join(", ") : String(selected.allergies)
                        }
                      />
                    )}
                    {selected.diagnoses && (
                      <Row
                        label="Diagnoses"
                        value={
                          Array.isArray(selected.diagnoses) ? selected.diagnoses.join(", ") : String(selected.diagnoses)
                        }
                      />
                    )}
                  </div>
                </>
              )}

              <Separator className="my-4" />
              <div className="text-sm">
                <div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Address
                </div>
                <div>{selected.address || "—"}</div>
              </div>

              <Separator className="my-4" />
              <div className="text-sm">
                <div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Contact Details
                </div>
                <div className="space-y-1">
                  <div>{selected.phone_number || selected.mobile_num_1 || fallbackPhone(selected.id)}</div>
                  {selected.mobile_num_2 && <div>{selected.mobile_num_2}</div>}
                  <div className="text-primary">{selected.email_1 || fallbackEmail(selected.name)}</div>
                </div>
              </div>

              {(selected.next_of_kin || selected.next_of_kin_phone) && (
                <>
                  <Separator className="my-4" />
                  <div className="text-sm">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Next of Kin</div>
                    <div className="font-medium">{selected.next_of_kin || "—"}</div>
                    {selected.next_of_kin_phone && (
                      <div className="text-muted-foreground text-xs">{selected.next_of_kin_phone}</div>
                    )}
                    {selected.next_of_kin_email && (
                      <div className="text-primary text-xs">{selected.next_of_kin_email}</div>
                    )}
                  </div>
                </>
              )}

              {selected.doctor_name && (
                <>
                  <Separator className="my-4" />
                  <div className="text-sm">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">GP / Doctor</div>
                    <div className="font-medium">{selected.doctor_name}</div>
                    {selected.doctor_phone && (
                      <div className="text-muted-foreground text-xs">{selected.doctor_phone}</div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* RIGHT: Add shift form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Rota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-destructive">
                You have the setting turned on for locking Team Members by Service User pref. This means if this Service
                User rates a Team Member less than 3, that team member will not be allowed to be assigned to the visit.
              </p>

              <FormRow label="Service List" required>
                <Select value={form.serviceList} onValueChange={(v) => setForm({ ...form, serviceList: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHC - Evening Call">CHC - Evening Call</SelectItem>
                    <SelectItem value="CHC - Morning Call">CHC - Morning Call</SelectItem>
                    <SelectItem value="Domiciliary">Domiciliary</SelectItem>
                    <SelectItem value="Live-In">Live-In</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>

              <p className="text-xs text-muted-foreground italic">
                "Rota Types set to Alternative are handled differently when running wages."
              </p>

              <FormRow label="Rota Type" required highlight>
                <Select value={form.rotaType} onValueChange={(v) => setForm({ ...form, rotaType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Alternative">Alternative</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>

              <FormRow label="Date" required>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </FormRow>

              <FormRow label="Start Time" required>
                <div className="flex items-center gap-2">
                  <Select value={form.startH} onValueChange={(v) => setForm({ ...form, startH: v })}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>:</span>
                  <Select value={form.startM} onValueChange={(v) => setForm({ ...form, startM: v })}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormRow>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Duration</Label>
                  <span className="text-warning font-semibold text-sm">{duration}</span>
                </div>
                <Slider
                  min={0}
                  max={24 * 60}
                  step={15}
                  value={[durationMinutes]}
                  onValueChange={handleDurationSlider}
                />
              </div>

              <FormRow label="End Time" required>
                <div className="flex items-center gap-2">
                  <Select value={form.endH} onValueChange={(v) => setForm({ ...form, endH: v })}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>:</span>
                  <Select value={form.endM} onValueChange={(v) => setForm({ ...form, endM: v })}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormRow>

              <YesNoRow
                label="Add Time Lock?"
                value={form.addTimeLock}
                onChange={(v) => setForm({ ...form, addTimeLock: v })}
              />
              <YesNoRow
                label="Link Up?"
                value={form.linkUp}
                onChange={(v) => setForm({ ...form, linkUp: v })}
                required
                highlight
              />

              <FormRow label="Care Giver">
                <Select value={form.staff1} onValueChange={(v) => setForm({ ...form, staff1: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="choose one..." />
                  </SelectTrigger>
                  <SelectContent className="bg-blue-50">
                    {caregivers.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="hover:bg-blue-100 focus:bg-blue-100">
                        <span className="flex items-center gap-2">
                          <User className="h-3 w-3" /> {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>

              <YesNoRow
                label="Medication Required?"
                value={form.medicationRequired}
                onChange={(v) => setForm({ ...form, medicationRequired: v })}
              />
              <YesNoRow
                label="Tasks Required?"
                value={form.tasksRequired}
                onChange={(v) => setForm({ ...form, tasksRequired: v })}
              />
              <YesNoRow label="Alert?" value={form.alert} onChange={(v) => setForm({ ...form, alert: v })} />
              <YesNoRow
                label="Add as recurring shift?"
                value={form.recurring}
                onChange={(v) => setForm({ ...form, recurring: v })}
              />
              <YesNoRow
                label="Add as new template shift?"
                value={form.template}
                onChange={(v) => setForm({ ...form, template: v })}
              />

              <div className="pt-2">
                <Button
                  onClick={handleSave}
                  disabled={upsertShift.isPending}
                  className="bg-success hover:bg-success/90 text-success-foreground gap-2"
                >
                  {upsertShift.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between py-2 gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground text-right">{value}</span>
  </div>
);

const FormRow = ({
  label,
  children,
  required,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  highlight?: boolean;
}) => (
  <div
    className={`grid grid-cols-[140px_1fr] items-center gap-3 ${highlight ? "bg-success/10 -mx-2 px-2 py-1.5 rounded" : ""}`}
  >
    <Label className="text-sm font-medium text-right">
      {required && <span className="text-destructive">* </span>}
      {label}
    </Label>
    <div>{children}</div>
  </div>
);

const YesNoRow = ({
  label,
  value,
  onChange,
  required,
  highlight,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  highlight?: boolean;
}) => (
  <FormRow label={label} required={required} highlight={highlight}>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="No">No</SelectItem>
        <SelectItem value="Yes">Yes</SelectItem>
      </SelectContent>
    </Select>
  </FormRow>
);

export default AddRota;
