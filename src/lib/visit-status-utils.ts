
export type VisitStatus = 
  | "Completed" 
  | "In Progress" 
  | "Late" 
  | "Missed" 
  | "Due" 
  | "Cancelled" 
  | "On Time" 
  | "Not Arrived"
  | "Pending";

export function getVisitStatus(v: any): VisitStatus {
  // 1. Cancelled always stays cancelled
  if (v.status === "Cancelled") return "Cancelled";

  // 2. Actual clock data takes priority over DB status
  //    - check_out_time present → shift is finished
  if (v.check_out_time) return "Completed";

  //    - check_in_time present (but no check_out) → shift is in progress
  if (v.check_in_time) return "In Progress";

  // 3. DB status "Completed" or "Complete" (explicit manual completion, no clock data)
  if (v.status === "Completed" || v.status === "Complete") return "Completed";

  // Note: "Confirmed" means the carer ACCEPTED the shift, not that it's done.
  // So we do NOT treat "Confirmed" as "Completed".

  // 4. Calculate based on scheduled time (no clock data, not manually completed)
  const now = new Date();
  
  const startH = v.start_hour ?? 0;
  const startM = v.start_minute ?? 0;
  const duration = v.duration ?? 0;
  const durationMins = v.duration_minutes ?? (duration * 60);
  
  // Construct visit start/end times
  const visitDateStr = v.visit_date || new Date().toISOString().split("T")[0];
  const [y, m, d] = visitDateStr.split("-").map(Number);
  const visitStart = new Date(y, m - 1, d, startH, startM);
  const visitEnd = new Date(visitStart.getTime() + durationMins * 60 * 1000);
  
  const nowMs = now.getTime();
  const startMs = visitStart.getTime();
  const endMs = visitEnd.getTime();

  if (nowMs < startMs) return "Due";
  
  // Grace period for being "Late" instead of "Missed"
  const gracePeriodMs = 5 * 60 * 1000; // 5 minutes (matching DailyRoster)
  
  if (nowMs <= startMs + gracePeriodMs) return "Late";
  
  if (nowMs > endMs) return "Missed";
  
  return "Late";
}
