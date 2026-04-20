import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Maximize2, Search } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type TabKey = "team" | "home";
type Person = {
  id: string;
  name: string;
  initials: string;
  lat: number;
  lng: number;
  kind: "team" | "service";
};

// UK postcode → rough coords (deterministic mock for demo) so pins land on the map
function seededCoord(seed: string): [number, number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  // Cluster around the West Midlands like the screenshot
  const lat = 52.0 + ((h % 1000) / 1000) * 1.6; // 52.0 - 53.6
  const lng = -2.6 + (((h >> 10) % 1000) / 1000) * 1.8; // -2.6 - -0.8
  return [lat, lng];
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

function pinIcon(label: string, color: "team" | "service") {
  const bg = color === "team" ? "#2563eb" : "#dc2626"; // blue / red
  const html = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="
        background:${bg};
        color:white;
        font-size:10px;
        font-weight:700;
        padding:3px 6px;
        border-radius:14px 14px 14px 4px;
        border:2px solid white;
        box-shadow:0 2px 4px rgba(0,0,0,.35);
        min-width:24px;
        text-align:center;
        letter-spacing:.3px;
      ">${label}</div>
      <div style="
        width:0;height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-top:7px solid ${bg};
        margin-top:-1px;
        filter: drop-shadow(0 1px 1px rgba(0,0,0,.3));
      "></div>
    </div>`;
  return L.divIcon({
    html,
    className: "location-pin",
    iconSize: [40, 30],
    iconAnchor: [20, 30],
  });
}

function FitToMarkers({ points }: { points: Person[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export default function LocationTracking() {
  const [tab, setTab] = useState<TabKey>("team");
  const [showTeam, setShowTeam] = useState(true);
  const [showHome, setShowHome] = useState(false);
  const [showService, setShowService] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: caregivers = [] } = useQuery({
    queryKey: ["loc-caregivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_givers")
        .select("id,name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: receivers = [] } = useQuery({
    queryKey: ["loc-receivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_receivers")
        .select("id,name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const teamPeople: Person[] = useMemo(
    () =>
      caregivers.map((c) => {
        const [lat, lng] = seededCoord(c.id);
        return { id: c.id, name: c.name, initials: initialsOf(c.name), lat, lng, kind: "team" };
      }),
    [caregivers],
  );

  const servicePeople: Person[] = useMemo(
    () =>
      receivers.map((r) => {
        const [lat, lng] = seededCoord(r.id + "-r");
        return { id: r.id, name: r.name, initials: initialsOf(r.name), lat, lng, kind: "service" };
      }),
    [receivers],
  );

  const listPeople = tab === "team" ? teamPeople : servicePeople;
  const filteredList = useMemo(
    () => listPeople.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [listPeople, search],
  );

  const visibleMarkers = useMemo(() => {
    const arr: Person[] = [];
    if (showTeam) arr.push(...teamPeople);
    if (showService) arr.push(...servicePeople);
    return arr;
  }, [showTeam, showService, teamPeople, servicePeople]);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Location Tracking</h1>
          <p className="text-sm text-muted-foreground">Live positions of team members and service users.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[560px]">
          {/* LEFT PANEL */}
          <div className="border border-border rounded-lg bg-card flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border bg-muted/40">
              <button
                onClick={() => setTab("team")}
                className={cn(
                  "flex-1 px-3 py-2.5 text-xs font-semibold transition-colors",
                  tab === "team"
                    ? "bg-card text-primary border-b-2 border-primary -mb-px"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Team Members
              </button>
              <button
                onClick={() => setTab("home")}
                className={cn(
                  "flex-1 px-3 py-2.5 text-xs font-semibold transition-colors",
                  tab === "home"
                    ? "bg-card text-primary border-b-2 border-primary -mb-px"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Team Member Home
              </button>
            </div>

            <div className="px-3 py-2 border-b border-border">
              <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
                {tab === "team" ? "Service Users" : "Team Member Homes"}
              </h3>
            </div>

            <div className="px-2 pt-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="h-8 pl-7 text-xs"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-1">
              {filteredList.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors border-l-2",
                    selectedId === p.id
                      ? "bg-primary/10 border-primary text-foreground font-medium"
                      : i % 2 === 0
                        ? "bg-card border-transparent text-foreground hover:bg-muted/50"
                        : "bg-muted/30 border-transparent text-foreground hover:bg-muted/50",
                  )}
                >
                  {p.name}
                </button>
              ))}
              {filteredList.length === 0 && (
                <div className="px-4 py-6 text-xs text-muted-foreground text-center">
                  No results
                </div>
              )}
            </div>
          </div>

          {/* MAP AREA */}
          <div className="border border-border rounded-lg bg-card flex flex-col overflow-hidden">
            {/* Top filter strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 border-b border-border bg-muted/30">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox
                  checked={showTeam}
                  onCheckedChange={(v) => setShowTeam(Boolean(v))}
                />
                Show Team Member
              </label>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox
                  checked={showHome}
                  onCheckedChange={(v) => setShowHome(Boolean(v))}
                />
                Team Member Home
              </label>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox
                  checked={showService}
                  onCheckedChange={(v) => setShowService(Boolean(v))}
                />
                Show Service Users
              </label>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox
                  checked={autoUpdate}
                  onCheckedChange={(v) => setAutoUpdate(Boolean(v))}
                />
                Update
              </label>
            </div>

            {/* Map */}
            <div className="relative flex-1">
              <MapContainer
                center={[52.5, -1.8]}
                zoom={7}
                scrollWheelZoom
                className="h-full w-full"
                style={{ background: "hsl(var(--muted))" }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitToMarkers points={visibleMarkers} />
                {visibleMarkers.map((p) => (
                  <Marker
                    key={`${p.kind}-${p.id}`}
                    position={[p.lat, p.lng]}
                    icon={pinIcon(p.initials, p.kind)}
                    eventHandlers={{ click: () => setSelectedId(p.id) }}
                  >
                    <Popup>
                      <div className="text-xs">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-muted-foreground capitalize">
                          {p.kind === "team" ? "Team Member" : "Service User"}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Top-left Map / Satellite toggle (visual only, OSM) */}
              <div className="absolute top-3 left-3 z-[400] bg-card border border-border rounded shadow-sm flex overflow-hidden">
                <button className="px-3 py-1 text-xs font-semibold bg-card text-foreground border-r border-border">
                  Map
                </button>
                <button className="px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted">
                  Satellite
                </button>
              </div>

              {/* Top-right fullscreen button */}
              <Button
                size="icon"
                variant="outline"
                className="absolute top-3 right-3 z-[400] h-8 w-8 bg-card"
                onClick={() => {
                  const el = document.querySelector(".leaflet-container") as HTMLElement | null;
                  el?.requestFullscreen?.();
                }}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
