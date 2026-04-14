import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      return data;
    },
  });
}

export function useCareReceiver(id: string | undefined) {
  return useQuery({
    queryKey: ["care_receivers", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("care_receivers").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
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
    mutationFn: async (s: { id?: string; care_giver_id: string; care_receiver_id: string; day: number; start_time: string; end_time: string; shift_type: string; notes: string }) => {
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

export function useUpdateDailyVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; care_giver_id?: string | null; start_hour?: number; duration?: number; status?: string }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase.from("daily_visits").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_visits"] }),
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
