import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface VisitRow {
  id: string;
  ref: string;
  date: string;
  status: string;
  serviceUserRaw: string;
  scheduledStart: string;
  scheduledEnd: string;
  duration: string;
  actualStart: string;
  actualEnd: string;
  actualDuration: string;
  teamMember: string;
  serviceCall: string;
  isFuture: boolean;
}

interface Props {
  visit: VisitRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function VisitDetailDialog({ visit, open, onOpenChange }: Props) {
  if (!visit) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Visit {visit.ref}</span>
            <Badge variant="outline">{visit.status}</Badge>
          </DialogTitle>
          <DialogDescription>Full visit details and check-in records.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Visit ID" value={visit.ref} />
          <Field label="Date" value={visit.date} />
          <Field label="Service User" value={visit.serviceUserRaw} />
          <Field label="Team Member" value={visit.teamMember} />
          <Field label="Service Call" value={visit.serviceCall} />
          <Field label="Status" value={visit.status} />
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold text-sm mb-2">Scheduled</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <Field label="Scheduled Start" value={visit.scheduledStart} />
            <Field label="Scheduled End" value={visit.scheduledEnd} />
            <Field label="Scheduled Duration" value={visit.duration} />
          </div>
        </div>

        {!visit.isFuture && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Actual</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <Field label="Actual Start" value={visit.actualStart || "—"} />
              <Field label="Actual End" value={visit.actualEnd || "—"} />
              <Field label="Actual Duration" value={visit.actualDuration || "—"} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
