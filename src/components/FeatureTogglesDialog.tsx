import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  useFeatureToggles,
  FEATURE_LABELS,
  FeatureKey,
} from "@/hooks/use-feature-toggles";

export function FeatureTogglesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { features, setFeature } = useFeatureToggles();
  const keys = Object.keys(FEATURE_LABELS) as FeatureKey[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Feature Toggles</DialogTitle>
          <DialogDescription>
            Enable or disable modules across the app. Changes apply instantly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          {keys.map((k) => (
            <div
              key={k}
              className="flex items-start justify-between gap-4 py-3 border-b last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{FEATURE_LABELS[k].label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {FEATURE_LABELS[k].description}
                </p>
              </div>
              <Switch
                checked={features[k]}
                onCheckedChange={(v) => setFeature(k, v)}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
