import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCareGivers, useCareReceivers } from "@/hooks/use-care-data";
import { getCareGiverAvatar } from "@/lib/avatars";
import { format, parseISO } from "date-fns";
import {
  IdCard, FileBadge, Hash, MapPin, Phone, ArrowLeft,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CareGiver = Tables<"care_givers">;

interface Props {
  cg: CareGiver | undefined;
  /** Path used when switching team members from the dropdown, e.g. "messaging" or "medication". */
  basePath: "messaging" | "medication" | "qualifications" | "incidents" | "files" | "changelog";
  /** Whether to show the "Select Service User..." secondary dropdown. */
  showServiceUserSelect?: boolean;
}

export function MemberSidebar({ cg, basePath, showServiceUserSelect }: Props) {
  const navigate = useNavigate();
  const { data: careGivers = [] } = useCareGivers();
  const { data: careReceivers = [] } = useCareReceivers();

  const age = cg?.dob
    ? Math.floor((Date.now() - new Date(cg.dob).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="space-y-3">
      <Card className="p-2 space-y-2">
        <Select
          value={cg?.id}
          onValueChange={(val) => navigate(`/caregivers/${val}/${basePath}`)}
        >
          <SelectTrigger className="h-9 bg-muted/50 border-border">
            <SelectValue placeholder="Select team member" />
          </SelectTrigger>
          <SelectContent>
            {careGivers.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showServiceUserSelect && (
          <Select onValueChange={() => {}}>
            <SelectTrigger className="h-9 bg-muted/30 border-border text-muted-foreground">
              <SelectValue placeholder="Select Service User..." />
            </SelectTrigger>
            <SelectContent>
              {careReceivers.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Card>

      <Card className="overflow-hidden">
        {!cg ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <div className="flex flex-col items-center pt-6 pb-4 px-4">
              <img
                src={getCareGiverAvatar(cg.id, cg.avatar_url)}
                alt={cg.name}
                className="h-20 w-20 rounded-full object-cover ring-1 ring-border"
              />
              <h2 className="mt-3 text-lg font-semibold text-primary">{cg.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cg.permission || "Field User"}
              </p>
            </div>
            <Separator />

            <DetailRow label="Tags">
              <div className="flex flex-wrap gap-1 justify-end">
                {(cg.tags ?? []).slice(0, 2).map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </DetailRow>
            <DetailRow label="Sub Status">
              <span className="text-amber-600 dark:text-amber-400 text-xs">References applied for</span>
            </DetailRow>
            <DetailRow label="DOB (AGE)">
              <span className="text-amber-600 dark:text-amber-400 text-xs">
                {cg.dob ? format(parseISO(cg.dob), "dd/MM/yyyy") : "—"}
                {age !== null && ` (${age})`}
              </span>
            </DetailRow>
            <DetailRow label="Sex Assigned At Birth">
              <span className="text-pink-500 text-sm">
                {cg.sex_assigned_at_birth === "Male" ? "♂" : "♀"}
              </span>
            </DetailRow>
            <DetailRow label="Reference No">
              <span className="text-foreground text-xs">{cg.reference_no || "—"}</span>
            </DetailRow>
            <DetailRow label="Manager">
              <span className="text-primary text-xs">{cg.manager || "—"}</span>
            </DetailRow>
            <DetailRow label="Areas">
              <span className="text-muted-foreground text-xs">{cg.town || "—"}</span>
            </DetailRow>

            <SectionHeader title="About Me" />
            <IconRow icon={IdCard} label="NI Number" value={cg.ni_number} />
            <IconRow icon={FileBadge} label="NHS Number" value={(cg as any).nhs_number} />
            <IconRow icon={Hash} label="Patient Number" value={(cg as any).patient_number} />
            <IconRow icon={Hash} label="Health Care Number" value={(cg as any).health_care_number} />
            <IconRow icon={Hash} label="Community Health Index" value={(cg as any).community_health_index} />
            <IconRow icon={MapPin} label="Address" value={cg.address}>
              {cg.address && (
                <Link to="#" className="text-primary text-xs hover:underline mt-1 inline-block ml-5">
                  View Map
                </Link>
              )}
            </IconRow>
            <IconRow icon={Phone} label="Contact Details" value={cg.phone} />
          </>
        )}
      </Card>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border text-xs">
      <span className="font-semibold text-foreground">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 py-2 border-b border-primary/40 text-xs font-semibold text-primary bg-primary/5">
      {title}
    </div>
  );
}

function IconRow({
  icon: Icon, label, value, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-2.5 border-b border-border">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </div>
      {value && <p className="text-xs text-muted-foreground mt-0.5 ml-5">{value}</p>}
      {children}
    </div>
  );
}

export function MemberTopBar({ title, backTo }: { title: string; backTo?: string }) {
  const navigate = useNavigate();
  return (
    <header className="bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          {backTo && (
            <button
              className="h-8 px-3 text-xs rounded border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1.5"
              onClick={() => navigate(backTo)}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Profile
            </button>
          )}
          <button
            className="h-8 px-3 text-xs rounded bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => navigate("/caregivers")}
          >
            All Team Members
          </button>
          <button
            className="h-8 px-3 text-xs rounded bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            Logout of handset
          </button>
        </div>
        <h1 className="text-base font-medium text-foreground">{title}</h1>
        <div className="w-[260px]" />
      </div>
    </header>
  );
}
