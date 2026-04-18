import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useCareGiver } from "@/hooks/use-care-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { ScheduleView } from "@/components/caregiver-profile/ScheduleView";

const CareGiverSchedule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: cg, isLoading } = useCareGiver(id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!cg) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Care giver not found.</p>
          <Button variant="link" onClick={() => navigate("/caregivers")}>Back to list</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate(`/caregivers/${cg.id}`)} className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Button>
        </div>
        <ScheduleView cg={cg} showHeader />
      </div>
    </AppLayout>
  );
};

export default CareGiverSchedule;
