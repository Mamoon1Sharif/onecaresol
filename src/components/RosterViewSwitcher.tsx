import { useNavigate, useLocation } from "react-router-dom";
import { CalendarDays, CalendarRange, CalendarClock } from "lucide-react";

const tabs = [
  { id: "daily", label: "Daily", path: "/roster/daily", icon: CalendarClock },
  { id: "weekly", label: "Weekly", path: "/roster", icon: CalendarRange },
  { id: "monthly", label: "Monthly", path: "/roster/monthly", icon: CalendarDays },
];

export function RosterViewSwitcher() {
  const nav = useNavigate();
  const loc = useLocation();
  const active =
    loc.pathname === "/roster/daily" ? "daily" :
    loc.pathname === "/roster/monthly" ? "monthly" : "weekly";

  return (
    <div className="inline-flex rounded-md overflow-hidden border bg-card shadow-sm">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => nav(t.path)}
            className={`px-4 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
