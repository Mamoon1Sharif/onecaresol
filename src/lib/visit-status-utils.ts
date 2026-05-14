
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
  // 1. Explicit status from database
  if (v.status === "Cancelled") return "Cancelled";
  if (v.status === "Completed" || v.status === "Complete" || v.status === "Confirmed") return "Completed";

  // 2. Clock-out means it's finished
  if (v.check_out_time) return "Completed";

  // 3. Clock-in means it's in progress
  if (v.check_in_time) {
    return "In Progress";
  }

  // 4. Calculate based on time if not clocked in
  const now = new Date();
  
  // Handle start hour/minute
  const startH = v.start_hour ?? 0;
  const startM = v.start_minute ?? 0;
  const duration = v.duration ?? 0;
  const durationMins = v.duration_minutes ?? (duration * 60);
  
  // Construct visit start/end times
  // Note: visit_date is expected to be YYYY-MM-DD
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
