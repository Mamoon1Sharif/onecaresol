import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCareReceivers } from "@/hooks/use-care-data";
import {
  IdCard, FileBadge, Hash, MapPin, Phone, ArrowLeft, Heart,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CareReceiver = Tables<"care_receivers">;

interface Props {
  cr: CareReceiver | undefined;
  basePath: "messaging" | "medication" | "qualifications" | "incidents" | "files" | "changelog";
}

export function ServiceUserSidebar({ cr, basePath }: Props) {
  const navigate = useNavigate();
  const { data: receivers = [] } = useCareReceivers();

  return (
    <div className="space-y-3">
      <Card className="p-2 space-y-2">
        <Select
          value={cr?.id}
          onValueChange={(val) => navigate(`/carereceivers/${val}/${basePath}`)}
        >
          <SelectTrigger className="h-9 bg-muted/50 border-border">
            <SelectValue placeholder="Select Service User" />
          </SelectTrigger>
          <SelectContent>
            {receivers.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        {!cr ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <div className="flex flex-col items-center pt-6 pb-4 px-4">
              <div className="h-20 w-20 rounded-full bg-primary/15 border-2 border-primary/20 flex items-center justify-center">
                <Heart className="h-10 w-10 text-primary" />
              </div>
              <h2 className="mt-3 text-lg font-semibold text-primary">{cr.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cr.care_type || "Service User"}
              </p>
            </div>
            <Separator />

            <DetailRow label="Care Status">
              <span className={
                cr.care_status === "Active"
                  ? "text-emerald-600 dark:text-emerald-400 text-xs"
                  : "text-amber-600 dark:text-amber-400 text-xs"
              }>
                {cr.care_status}
              </span>
            </DetailRow>
            <DetailRow label="Risk Rating">
              <span className="text-amber-600 dark:text-amber-400 text-xs">
                {cr.risk_rating || "None"}
              </span>
            </DetailRow>
            <DetailRow label="DNACPR">
              <span className={cr.dnacpr ? "text-destructive text-xs font-semibold" : "text-muted-foreground text-xs"}>
                {cr.dnacpr ? "Yes" : "No"}
              </span>
            </DetailRow>
            <DetailRow label="Age">
              <span className="text-foreground text-xs">{cr.age ?? "—"}</span>
            </DetailRow>
            <DetailRow label="Language">
              <span className="text-foreground text-xs">{cr.language || "—"}</span>
            </DetailRow>
            <DetailRow label="Preference">
              <span className="text-foreground text-xs">{cr.preference || "—"}</span>
            </DetailRow>

            <SectionHeader title="About" />
            <IconRow icon={IdCard} label="NHS Number" value={cr.nhs_number} />
            <IconRow icon={FileBadge} label="Patient Number" value={cr.patient_number} />
            <IconRow icon={Hash} label="Health Care Number" value={cr.health_care_number} />
            <IconRow icon={Hash} label="Community Health Index" value={cr.community_health_index} />
            <IconRow icon={MapPin} label="Address" value={cr.address}>
              {cr.address && (
                <Link to="#" className="text-primary text-xs hover:underline mt-1 inline-block ml-5">
                  View Map
                </Link>
              )}
            </IconRow>
            <IconRow icon={Phone} label="Next of Kin" value={cr.next_of_kin}>
              {cr.next_of_kin_phone && (
                <p className="text-xs text-muted-foreground mt-0.5 ml-5">{cr.next_of_kin_phone}</p>
              )}
            </IconRow>
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

export function ServiceUserTopBar({ title, backTo }: { title: string; backTo?: string }) {
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
            onClick={() => navigate("/carereceivers")}
          >
            All Service Users
          </button>
        </div>
        <h1 className="text-base font-medium text-foreground">{title}</h1>
        <div className="w-[260px]" />
      </div>
    </header>
  );
}
