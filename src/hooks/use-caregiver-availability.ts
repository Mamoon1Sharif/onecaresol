import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AvailabilityReason =
  | { kind: "inactive"; label: string }
  | { kind: "holiday"; label: string; from: string; to: string | null }
  | { kind: "training"; label: string; from: string; to: string | null };

/** Fetch all approved holiday/absence/training entries for caregivers, used to gate rota assignment. */
export function useCaregiverHolidayEntries() {
  return useQuery({
    queryKey: ["caregiver_holidays_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caregiver_holidays")
        .select("id, care_giver_id, entry_type, start_date, end_date, status");
      if (error) throw error;
      return data as Array<{
        id: string;
        care_giver_id: string;
        entry_type: string;
        start_date: string;
        end_date: string | null;
        status: string;
      }>;
    },
  });
}

/** Returns reason caregiver is unavailable on `date` (YYYY-MM-DD) or null if available. */
export function caregiverUnavailableReason(
  cg: { id: string; status?: string | null; name?: string } | undefined,
  entries: Array<{ care_giver_id: string; entry_type: string; start_date: string; end_date: string | null; status: string }>,
  date: string,
): AvailabilityReason | null {
  if (!cg) return null;
  const status = (cg.status ?? "").toLowerCase();
  if (status && status !== "active") {
    return { kind: "inactive", label: cg.status || "Inactive" };
  }
  const target = date;
  const hit = entries.find((e) => {
    if (e.care_giver_id !== cg.id) return false;
    if (e.status === "rejected") return false;
    const from = e.start_date;
    const to = e.end_date ?? e.start_date;
    return target >= from && target <= to;
  });
  if (!hit) return null;
  const t = (hit.entry_type || "holiday").toLowerCase();
  if (t === "training") return { kind: "training", label: "On Training", from: hit.start_date, to: hit.end_date };
  return { kind: "holiday", label: t === "absence" ? "On Absence" : t === "late" ? "Late" : "On Holiday", from: hit.start_date, to: hit.end_date };
}
