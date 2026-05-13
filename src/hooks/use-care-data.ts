import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type ReceiverDnarSetting = {
  care_receiver_id: string;
  status: string | null;
  applies_from: string | null;
  applies_until: string | null;
};

function todayIsoDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function isActiveDnarSetting(row: ReceiverDnarSetting, today = todayIsoDate()) {
  return (
    row.status?.toLowerCase() === "active" &&
    (!row.applies_from || row.applies_from <= today) &&
    (!row.applies_until || row.applies_until >= today)
  );
}

// ── Care Givers ──
export function useCareGivers() {
  return useQuery({
    queryKey: ["care_givers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("care_givers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useAddCareGiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cg: { name: string; email: string; phone: string }) => {
      const { data, error } = await supabase.from("care_givers").insert({ name: cg.name, email: cg.email, phone: cg.phone, status: "Active" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["care_givers"] }),
  });
}

export function useUpdateCareGiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Omit<import("@/integrations/supabase/types").Tables<"care_givers">, "id">>) => {
      const { error } = await supabase.from("care_givers").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["care_givers"] }),
  });
}

export function useDeleteCareGiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("care_givers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["care_givers"] }),
  });
}

export function useCareGiver(id: string | undefined) {
  return useQuery({
    queryKey: ["care_givers", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("care_givers").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });
}

// ── Care Receivers ──
export function useCareReceivers() {
  return useQuery({
    queryKey: ["care_receivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("care_receivers").select("*").order("name");
      if (error) throw error;
      const receiverIds = data.map((receiver) => receiver.id);
      if (receiverIds.length === 0) return data;

      const { data: dnarRows, error: dnarError } = await supabase
        .from("receiver_dnar_settings" as any)
        .select("care_receiver_id,status,applies_from,applies_until")
        .in("care_receiver_id", receiverIds);
      if (dnarError) throw dnarError;

      const today = todayIsoDate();
      const activeDnarReceiverIds = new Set(
        ((dnarRows ?? []) as unknown as ReceiverDnarSetting[])
          .filter((row) => isActiveDnarSetting(row, today))
          .map((row) => row.care_receiver_id)
      );

      return data.map((receiver) => ({
        ...receiver,
        dnacpr: receiver.dnacpr || activeDnarReceiverIds.has(receiver.id),
      }));
    },
  });
}

export function useAddCareReceiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cr: {
      name: string;
      address?: string;
      next_of_kin?: string;
      next_of_kin_phone?: string;
      care_status?: string;
      care_type?: string;
    }) => {
      // Resolve the current user's company so we satisfy tenant RLS.
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("You must be signed in to add a service member.");
      const { data: cu, error: cuErr } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (cuErr) throw cuErr;
      if (!cu?.company_id) throw new Error("Your account is not linked to a company.");

      const { data, error } = await supabase
        .from("care_receivers")
        .insert({
          name: cr.name,
          address: cr.address ?? null,
          next_of_kin: cr.next_of_kin ?? null,
          next_of_kin_phone: cr.next_of_kin_phone ?? null,
          care_status: cr.care_status ?? "Active",
          care_type: cr.care_type ?? "8h-morning",
          company_id: cu.company_id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["care_receivers"] }),
  });
}

export function useCareReceiver(id: string | undefined) {
  return useQuery({
    queryKey: ["care_receivers", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("care_receivers").select("*").eq("id", id!).single();
      if (error) throw error;
      const { data: dnarRows, error: dnarError } = await supabase
        .from("receiver_dnar_settings" as any)
        .select("care_receiver_id,status,applies_from,applies_until")
        .eq("care_receiver_id", id!);
      if (dnarError) throw dnarError;

      const hasActiveDnar = ((dnarRows ?? []) as unknown as ReceiverDnarSetting[]).some((row) => isActiveDnarSetting(row));
      return { ...data, dnacpr: data.dnacpr || hasActiveDnar };
    },
  });
}

export function useUpdateCareReceiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from("care_receivers").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["care_receivers", vars.id] });
      qc.invalidateQueries({ queryKey: ["care_receivers"] });
    },
  });
}

export function useDeleteCareReceiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("care_receivers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["care_receivers"] }),
  });
}

// ── Medications ──
export function useMedications(careReceiverId: string | undefined) {
  return useQuery({
    queryKey: ["medications", careReceiverId],
    enabled: !!careReceiverId,
    queryFn: async () => {
      const { data, error } = await supabase.from("medications").select("*").eq("care_receiver_id", careReceiverId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ── Visit Notes ──
export function useVisitNotes(careReceiverId: string | undefined) {
  return useQuery({
    queryKey: ["visit_notes", careReceiverId],
    enabled: !!careReceiverId,
    queryFn: async () => {
      const { data, error } = await supabase.from("visit_notes").select("*").eq("care_receiver_id", careReceiverId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ── Risk Assessments ──
export function useRiskAssessments(careReceiverId: string | undefined) {
  return useQuery({
    queryKey: ["risk_assessments", careReceiverId],
    enabled: !!careReceiverId,
    queryFn: async () => {
      const { data, error } = await supabase.from("risk_assessments").select("*").eq("care_receiver_id", careReceiverId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertRiskAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: { id?: string; care_receiver_id: string; category: string; description: string; level: string; mitigations: string; last_reviewed: string }) => {
      if (r.id) {
        const { error } = await supabase.from("risk_assessments").update({ category: r.category, description: r.description, level: r.level, mitigations: r.mitigations, last_reviewed: r.last_reviewed }).eq("id", r.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("risk_assessments").insert({ care_receiver_id: r.care_receiver_id, category: r.category, description: r.description, level: r.level, mitigations: r.mitigations, last_reviewed: r.last_reviewed });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["risk_assessments"] }),
  });
}

export function useDeleteRiskAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("risk_assessments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["risk_assessments"] }),
  });
}

// ── Health Goals ──
export function useHealthGoals(careReceiverId: string | undefined) {
  return useQuery({
    queryKey: ["health_goals", careReceiverId],
    enabled: !!careReceiverId,
    queryFn: async () => {
      const { data, error } = await supabase.from("health_goals").select("*").eq("care_receiver_id", careReceiverId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertHealthGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (g: { id?: string; care_receiver_id: string; goal: string; target: string; status: string; notes: string }) => {
      if (g.id) {
        const { error } = await supabase.from("health_goals").update({ goal: g.goal, target: g.target, status: g.status, notes: g.notes }).eq("id", g.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("health_goals").insert({ care_receiver_id: g.care_receiver_id, goal: g.goal, target: g.target, status: g.status, notes: g.notes });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["health_goals"] }),
  });
}

export function useDeleteHealthGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("health_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["health_goals"] }),
  });
}

// ── Shifts ──
export function useShifts() {
  return useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shifts").select("*, care_givers(*), care_receivers(*)").order("day").order("start_time");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { id?: string; care_giver_id: string | null; care_receiver_id: string; day: number; start_time: string; end_time: string; shift_type: string; notes: string }) => {
      if (s.id) {
        const { error } = await supabase.from("shifts").update({ care_giver_id: s.care_giver_id, care_receiver_id: s.care_receiver_id, day: s.day, start_time: s.start_time, end_time: s.end_time, shift_type: s.shift_type, notes: s.notes }).eq("id", s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shifts").insert({ care_giver_id: s.care_giver_id, care_receiver_id: s.care_receiver_id, day: s.day, start_time: s.start_time, end_time: s.end_time, shift_type: s.shift_type, notes: s.notes });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shifts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

// ── Daily Visits ──
export function useDailyVisits(dateStr?: string) {
  return useQuery({
    queryKey: ["daily_visits", dateStr],
    queryFn: async () => {
      let q = supabase.from("daily_visits").select("*, care_receivers(*), care_givers(*)");
      if (dateStr) q = q.eq("visit_date", dateStr);
      const { data, error } = await q.order("start_hour");
      if (error) throw error;
      return data;
    },
  });
}

export function useDailyVisitsRange(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ["daily_visits_range", fromDate, toDate],
    enabled: !!fromDate && !!toDate,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_visits")
        .select("*, care_receivers(*), care_givers(*)")
        .gte("visit_date", fromDate!)
        .lte("visit_date", toDate!)
        .order("start_hour");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateDailyVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; care_giver_id?: string | null; start_hour?: number; duration?: number; status?: string; check_in_time?: string | null; check_out_time?: string | null }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase.from("daily_visits").update(rest as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_visits"] }),
  });
}

// ── Shift Notes ──
export function useShiftNotes(dailyVisitId: string | undefined) {
  return useQuery({
    queryKey: ["shift_notes", dailyVisitId],
    enabled: !!dailyVisitId,
    queryFn: async () => {
      const { data, error } = await supabase.from("shift_notes").select("*").eq("daily_visit_id", dailyVisitId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddShiftNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (n: { daily_visit_id: string; note: string; author: string }) => {
      const { error } = await supabase.from("shift_notes").insert(n);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift_notes"] }),
  });
}

// ── Shift Tasks ──
export function useShiftTasks(dailyVisitId: string | undefined) {
  return useQuery({
    queryKey: ["shift_tasks", dailyVisitId],
    enabled: !!dailyVisitId,
    queryFn: async () => {
      const { data, error } = await supabase.from("shift_tasks").select("*").eq("daily_visit_id", dailyVisitId!).order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useAddShiftTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: { daily_visit_id: string; title: string }) => {
      const { error } = await supabase.from("shift_tasks").insert(t);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift_tasks"] }),
  });
}

export function useToggleShiftTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_completed, completed_by }: { id: string; is_completed: boolean; completed_by?: string }) => {
      const { error } = await supabase.from("shift_tasks").update({
        is_completed,
        completed_by: is_completed ? (completed_by ?? "") : null,
        completed_at: is_completed ? new Date().toISOString() : null,
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift_tasks"] }),
  });
}

// ── Completed Visits (for dashboard) ──
export function useCompletedVisitsToday() {
  return useQuery({
    queryKey: ["completed_visits_today"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("daily_visits")
        .select("*, care_receivers(*), care_givers(*)")
        .eq("visit_date", today)
        .not("check_out_time", "is", null)
        .order("check_out_time", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ── Dashboard Visits ──
export function useDashboardVisits() {
  return useQuery({
    queryKey: ["dashboard_visits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dashboard_visits").select("*").order("scheduled_time");
      if (error) throw error;
      return data;
    },
  });
}

// ── Stats ──
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const [cg, cr, dv] = await Promise.all([
        supabase.from("care_givers").select("id", { count: "exact", head: true }),
        supabase.from("care_receivers").select("id", { count: "exact", head: true }).eq("care_status", "Active"),
        supabase.from("daily_visits").select("id", { count: "exact", head: true }).eq("visit_date", new Date().toISOString().slice(0, 10)),
      ]);
      return {
        totalCareGivers: cg.count ?? 0,
        activeCareReceivers: cr.count ?? 0,
        visitsToday: dv.count ?? 0,
      };
    },
  });
}
