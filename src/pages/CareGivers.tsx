import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, Phone, User, Clock, CalendarDays, Filter, Briefcase } from "lucide-react";
import { useCareGivers, useDailyVisits } from "@/hooks/use-care-data";
import { useCaregiverHolidayEntries, caregiverUnavailableReason } from "@/hooks/use-caregiver-availability";
import { getCareGiverAvatar } from "@/lib/avatars";

const STATUS_FILTERS = ["All", "Active", "Non-Active", "Onboarding"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const CareGivers = () => {
  const { data: careGivers = [], isLoading } = useCareGivers();
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: todayVisits = [] } = useDailyVisits(todayStr);
  const { data: holidayEntries = [] } = useCaregiverHolidayEntries();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  // Set of caregiver IDs currently on shift (checked in but not checked out)
  const onShiftIds = useMemo(() => {
    const ids = new Set<string>();
    todayVisits.forEach((v) => {
      if (v.care_giver_id && v.check_in_time && !v.check_out_time) {
        ids.add(v.care_giver_id);
      }
    });
    return ids;
  }, [todayVisits]);

  const tagColors: Record<string, string> = {
    "COS Letter Received": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "DBS Adult & Children": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "DBS Disclaimer": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "Has Full UK Driving Licence": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "Registered to DBS Update Service": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  };

  const shortenTag = (tag: string) => {
    const map: Record<string, string> = {
      "Has Full UK Driving Licence": "UK Licence",
      "Registered to DBS Update Service": "DBS Update",
      "DBS Adult & Children": "DBS A&C",
      "COS Letter Received": "COS Letter",
      "DBS Disclaimer": "DBS Discl.",
    };
    return map[tag] || tag;
  };

  // Sort so "mamoon" (case-insensitive) appears last
  const sorted = [...careGivers].sort((a, b) => {
    const aIsMamoon = a.name.toLowerCase().includes("mamoon") ? 1 : 0;
    const bIsMamoon = b.name.toLowerCase().includes("mamoon") ? 1 : 0;
    return aIsMamoon - bIsMamoon;
  });

  const filtered = sorted.filter((cg) => {
    const matchesSearch = cg.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === "All") return true;
    if (statusFilter === "Non-Active") return cg.status === "Non-Active" || cg.status === "Inactive";
    return cg.status === statusFilter;
  });

  const showResultCount = searchQuery.trim().length > 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Care Givers</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your care giving staff · {careGivers.length} total</p>
          </div>
          <Button onClick={() => navigate("/caregivers/new")} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Add New Care Giver
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-card border-border" />
          </div>
          <div className="flex items-center gap-1 border border-border rounded-lg p-1">
            {STATUS_FILTERS.map((sf) => (
              <Button
                key={sf}
                variant={statusFilter === sf ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-3"
                onClick={() => setStatusFilter(sf)}
              >
                {sf}
              </Button>
            ))}
          </div>
          {showResultCount && (
            <Badge variant="outline" className="text-sm px-3 py-1.5">
              <Search className="h-3.5 w-3.5 mr-1.5" /> {filtered.length} results
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No care givers found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cg) => {
              const reason = caregiverUnavailableReason(cg as any, holidayEntries, todayStr);
              const isOnShift = onShiftIds.has(cg.id);
              const badgeLabel = reason ? reason.label : cg.status;
              const isActiveAvailable = !reason && cg.status === "Active";
              return (
              <div
                key={cg.id}
                className="group border border-border rounded-xl bg-card cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col min-h-[260px]"
              >
                <div
                  className="p-5 flex-1"
                  onClick={() => navigate(`/caregivers/${cg.id}`)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        className={`text-xs px-2.5 py-0.5 border-0 ${
                          isActiveAvailable
                            ? "bg-success/15 text-success"
                            : reason?.kind === "holiday"
                            ? "bg-warning/15 text-warning"
                            : reason?.kind === "training"
                            ? "bg-info/15 text-info"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {badgeLabel}
                      </Badge>
                      {isOnShift && !reason && (
                        <Badge className="text-xs px-2.5 py-0.5 bg-info/15 text-info border-0 gap-1">
                          <Briefcase className="h-3 w-3" /> On Shift
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); navigate(`/caregivers/${cg.id}/schedule`); }}
                    >
                      <CalendarDays className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="h-24 w-24 rounded-full border-2 border-border overflow-hidden mb-3">
                      <img src={getCareGiverAvatar(cg.id, cg.avatar_url)} alt={cg.name} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <h3 className="font-bold text-foreground text-lg">{cg.name}</h3>
                    <div className="mt-2 space-y-1.5 w-full">
                      {cg.phone && (
                        <p className="flex items-center justify-center gap-1.5 text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span className="text-base">{cg.phone}</span>
                        </p>
                      )}
                      <p className="flex items-center justify-center gap-1.5 text-muted-foreground">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span className="text-base">{cg.last_check_in || "Never"}</span>
                      </p>
                      {cg.address && (
                        <p className="text-muted-foreground text-base leading-snug line-clamp-1 text-center">{cg.address}</p>
                      )}
                    </div>
                  </div>
                </div>
                {Array.isArray((cg as any).tags) && (cg as any).tags.length > 0 && (() => {
                  const tags = (cg as any).tags as string[];
                  const isExpanded = expandedTags[cg.id];
                  const visibleTags = isExpanded ? tags : tags.slice(0, 3);
                  const hasMore = tags.length > 3;
                  return (
                    <div
                      className="border-t border-border px-4 py-2.5 flex flex-wrap gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {visibleTags.map((tag: string) => (
                        <span key={tag} className={`text-xs font-semibold rounded-md px-2.5 py-1 whitespace-nowrap ${tagColors[tag] || "bg-muted text-muted-foreground"}`}>
                          {shortenTag(tag)}
                        </span>
                      ))}
                      {hasMore && (
                        <button
                          onClick={() => setExpandedTags(prev => ({ ...prev, [cg.id]: !prev[cg.id] }))}
                          className="text-[10px] font-medium text-primary hover:text-primary/80 px-2 py-1"
                        >
                          {isExpanded ? "Show less" : `+${tags.length - 3} more`}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            );})}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CareGivers;
