import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, MapPin, Phone, Heart } from "lucide-react";
import { useCareReceivers } from "@/hooks/use-care-data";
import { getCareReceiverAvatar } from "@/lib/avatars";

const statusStyles: Record<string, string> = {
  Active: "bg-success/15 text-success border-0",
  "On Hold": "bg-warning/15 text-warning border-0",
  Discharged: "bg-muted text-muted-foreground border-0",
};

const CareReceivers = () => {
  const { data: careReceivers = [], isLoading } = useCareReceivers();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filtered = careReceivers
    .filter((cr) => cr.care_status !== "Discharged")
    .filter((cr) => cr.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Service Members</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage service members · {careReceivers.length} total</p>
          </div>
          <Button className="gap-2" onClick={() => navigate("/carereceivers/new")}>
            <Plus className="h-4 w-4" /> Add Service Member
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-card border-border" />
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1.5">
            <Search className="h-3.5 w-3.5 mr-1.5" /> {filtered.length} results
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No service members found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cr) => (
              <div
                key={cr.id}
                onClick={() => navigate(`/carereceivers/${cr.id}`)}
                className="group border border-border rounded-xl bg-card p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{cr.name}</h3>
                    {cr.dnacpr && (
                      <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0 gap-0.5">
                        <Heart className="h-2.5 w-2.5" /> DNACPR
                      </Badge>
                    )}
                  </div>
                  <Badge
                    variant="default"
                    className={`shrink-0 text-[10px] px-2 py-0.5 ${statusStyles[cr.account_status ?? cr.care_status ?? "Active"] ?? ""}`}
                  >
                    {cr.account_status ?? cr.care_status ?? "Active"}
                  </Badge>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 rounded-full border-2 border-border overflow-hidden shrink-0">
                    <img src={getCareReceiverAvatar(cr.id, cr.avatar_url)} alt={cr.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="min-w-0 space-y-1.5 text-sm">
                    {cr.address && (
                      <p className="text-muted-foreground text-xs leading-tight line-clamp-2 flex items-start gap-1.5">
                        <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                        {cr.address}
                      </p>
                    )}
                    {cr.next_of_kin_phone && (
                      <p className="flex items-center gap-1.5 text-foreground">
                        <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs">{cr.next_of_kin_phone}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CareReceivers;
