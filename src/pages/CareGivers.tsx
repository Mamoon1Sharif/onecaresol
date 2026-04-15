import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, Phone, User, Clock, CalendarDays, Filter } from "lucide-react";
import { useCareGivers } from "@/hooks/use-care-data";

const STATUS_FILTERS = ["All", "Active", "Non-Active", "Onboarding"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const CareGivers = () => {
  const { data: careGivers = [], isLoading } = useCareGivers();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

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
            {filtered.map((cg) => (
              <div
                key={cg.id}
                onClick={() => navigate(`/caregivers/${cg.id}`)}
                className="group border border-border rounded-xl bg-card p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col min-h-[220px]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm truncate pr-2">{cg.name}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant={cg.status === "Active" ? "default" : "secondary"}
                      className={`text-[10px] px-2 py-0.5 ${cg.status === "Active" ? "bg-success/15 text-success border-0" : "bg-muted text-muted-foreground border-0"}`}
                    >
                      {cg.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); navigate(`/caregivers/${cg.id}/schedule`); }}
                    >
                      <CalendarDays className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 rounded-full bg-muted border-2 border-border flex items-center justify-center shrink-0">
                    <User className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 space-y-1.5 text-sm">
                    {cg.address && (
                      <p className="text-muted-foreground text-xs leading-tight line-clamp-2">{cg.address}</p>
                    )}
                    {cg.phone && (
                      <p className="flex items-center gap-1.5 text-foreground">
                        <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs">{cg.phone}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span className="text-xs">{cg.last_check_in || "Never"}</span>
                    </p>
                  </div>
                </div>
                {Array.isArray((cg as any).tags) && (cg as any).tags.length > 0 && (() => {
                  const tags = (cg as any).tags as string[];
                  const isExpanded = expandedTags[cg.id];
                  const visibleTags = isExpanded ? tags : tags.slice(0, 2);
                  const hasMore = tags.length > 2;
                  return (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {visibleTags.map((tag: string) => (
                        <span key={tag} className="text-[10px] font-medium text-muted-foreground bg-muted rounded-md px-2 py-1 truncate max-w-[120px]">
                          {shortenTag(tag)}
                        </span>
                      ))}
                      {hasMore && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedTags(prev => ({ ...prev, [cg.id]: !prev[cg.id] })); }}
                          className="text-[10px] font-medium text-primary hover:text-primary/80 px-2 py-1"
                        >
                          {isExpanded ? "Show less" : `+${tags.length - 2} more`}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CareGivers;
