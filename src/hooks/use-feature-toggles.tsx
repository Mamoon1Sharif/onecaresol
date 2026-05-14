import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type FeatureKey =
  | "notifications"
  | "insights"
  | "bookings"
  | "locationTracking"
  | "communicationLog"
  | "timeline"
  | "liveRunRoutes"
  | "theMonitor"
  | "printableRota"
  | "buildRota";

export const FEATURE_LABELS: Record<FeatureKey, { label: string; description: string }> = {
  notifications: {
    label: "Notifications",
    description: "Bell icon and notification alerts in the header",
  },
  insights: {
    label: "Insights",
    description: "Insights dashboard in the sidebar",
  },
  bookings: {
    label: "Bookings",
    description: "Bookings page in the sidebar",
  },
  locationTracking: {
    label: "Location Tracking",
    description: "Location Tracking page in the sidebar",
  },
  communicationLog: {
    label: "Communication Log",
    description: "Communication Log page in the sidebar",
  },
  timeline: {
    label: "Timeline",
    description: "Timeline page in the sidebar",
  },
  liveRunRoutes: {
    label: "Live Run Routes",
    description: "Live Run Routes under Rota in the sidebar",
  },
  theMonitor: {
    label: "The Monitor",
    description: "The Monitor under Rota in the sidebar",
  },
  printableRota: {
    label: "Printable Rota",
    description: "Printable Rota under Rota in the sidebar",
  },
  buildRota: {
    label: "Build Rota",
    description: "Build Rota under Rota in the sidebar",
  },
};

const STORAGE_KEY = "feature_toggles_v1";
const DEFAULTS: Record<FeatureKey, boolean> = {
  notifications: false,
  insights: false,
  bookings: false,
  locationTracking: false,
  communicationLog: false,
  timeline: false,
  liveRunRoutes: false,
  theMonitor: false,
  printableRota: false,
  buildRota: false,
};

type Ctx = {
  features: Record<FeatureKey, boolean>;
  setFeature: (k: FeatureKey, v: boolean) => void;
  isEnabled: (k: FeatureKey) => boolean;
};

const FeatureCtx = createContext<Ctx>({
  features: DEFAULTS,
  setFeature: () => {},
  isEnabled: () => false,
});

export const FeatureTogglesProvider = ({ children }: { children: ReactNode }) => {
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFeatures({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const setFeature = useCallback((k: FeatureKey, v: boolean) => {
    setFeatures((prev) => {
      const next = { ...prev, [k]: v };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      // notify other tabs / consumers
      window.dispatchEvent(new CustomEvent("feature-toggles-changed", { detail: next }));
      return next;
    });
  }, []);

  // listen for cross-tab changes
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setFeatures(detail);
    };
    window.addEventListener("feature-toggles-changed", handler);
    return () => window.removeEventListener("feature-toggles-changed", handler);
  }, []);

  return (
    <FeatureCtx.Provider
      value={{ features, setFeature, isEnabled: (k) => features[k] }}
    >
      {children}
    </FeatureCtx.Provider>
  );
};

export const useFeatureToggles = () => useContext(FeatureCtx);
