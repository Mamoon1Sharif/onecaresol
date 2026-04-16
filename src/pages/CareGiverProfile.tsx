import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useCareGiver } from "@/hooks/use-care-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { ProfileHeader } from "@/components/caregiver-profile/ProfileHeader";
import { OverviewTab } from "@/components/caregiver-profile/OverviewTab";
import { DetailedProfileTab } from "@/components/caregiver-profile/DetailedProfileTab";
import { PlaceholderTab } from "@/components/caregiver-profile/PlaceholderTab";
import {
  LayoutDashboard, UserCog, CalendarDays, LayoutTemplate,
  Users, Bell, StickyNote,
} from "lucide-react";

const CareGiverProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: cg, isLoading } = useCareGiver(id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto space-y-6">
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
      <div className="max-w-5xl mx-auto space-y-6">
        <ProfileHeader cg={cg} />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <LayoutDashboard className="h-3.5 w-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="detailed" className="gap-1.5 text-xs">
              <UserCog className="h-3.5 w-3.5" /> Detailed Profile
            </TabsTrigger>
            <TabsTrigger value="rota" className="gap-1.5 text-xs">
              <CalendarDays className="h-3.5 w-3.5" /> Rota
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5 text-xs">
              <LayoutTemplate className="h-3.5 w-3.5" /> Templates
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" /> Key Contacts
            </TabsTrigger>
            <TabsTrigger value="reminders" className="gap-1.5 text-xs">
              <Bell className="h-3.5 w-3.5" /> Reminders
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5 text-xs">
              <StickyNote className="h-3.5 w-3.5" /> Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <OverviewTab cg={cg} />
          </TabsContent>

          <TabsContent value="detailed" className="mt-4">
            <DetailedProfileTab cg={cg} />
          </TabsContent>

          <TabsContent value="rota" className="mt-4">
            <PlaceholderTab title="Rota" description="View and manage this caregiver's weekly rota assignments and shift patterns." />
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <PlaceholderTab title="Templates" description="Manage shift templates and recurring schedule patterns for this caregiver." />
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            <PlaceholderTab title="Key Contacts" description="View and manage important contacts associated with this caregiver." />
          </TabsContent>

          <TabsContent value="reminders" className="mt-4">
            <PlaceholderTab title="Reminders" description="Set up and manage reminders for training, DBS renewals, and other important dates." />
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <PlaceholderTab title="Notes" description="Add and review notes about this caregiver's performance, preferences, and other observations." />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default CareGiverProfile;
