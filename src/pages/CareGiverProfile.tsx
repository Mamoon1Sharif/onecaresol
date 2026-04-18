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
import { ScheduleView } from "@/components/caregiver-profile/ScheduleView";
import {
  LayoutDashboard, UserCog, CalendarDays, LayoutTemplate,
  Users, Bell, StickyNote,
  CalendarCheck, Plane, MessageSquare, Pill,
  GraduationCap, AlertTriangle, FileText, History,
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
            <TabsTrigger value="availability" className="gap-1.5 text-xs">
              <CalendarCheck className="h-3.5 w-3.5" /> Availability
            </TabsTrigger>
            <TabsTrigger value="holidays" className="gap-1.5 text-xs">
              <Plane className="h-3.5 w-3.5" /> Holidays
            </TabsTrigger>
            <TabsTrigger value="messaging" className="gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" /> Messaging
            </TabsTrigger>
            <TabsTrigger value="medication" className="gap-1.5 text-xs">
              <Pill className="h-3.5 w-3.5" /> Medication
            </TabsTrigger>
            <TabsTrigger value="qualifications" className="gap-1.5 text-xs">
              <GraduationCap className="h-3.5 w-3.5" /> Qualifications
            </TabsTrigger>
            <TabsTrigger value="incidents" className="gap-1.5 text-xs">
              <AlertTriangle className="h-3.5 w-3.5" /> Incidents
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" /> Files
            </TabsTrigger>
            <TabsTrigger value="changelog" className="gap-1.5 text-xs">
              <History className="h-3.5 w-3.5" /> Changelog
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

          <TabsContent value="availability" className="mt-4">
            <PlaceholderTab title="Availability" description="Manage this caregiver's working availability, preferred hours, and unavailable periods." />
          </TabsContent>

          <TabsContent value="holidays" className="mt-4">
            <PlaceholderTab title="Holidays" description="Track holiday entitlement, booked time off, and remaining annual leave balance." />
          </TabsContent>

          <TabsContent value="messaging" className="mt-4">
            <PlaceholderTab title="Messaging" description="Send and review messages exchanged with this caregiver." />
          </TabsContent>

          <TabsContent value="medication" className="mt-4">
            <PlaceholderTab title="Medication" description="View medication administration records and competency certifications for this caregiver." />
          </TabsContent>

          <TabsContent value="qualifications" className="mt-4">
            <PlaceholderTab title="Qualifications" description="Manage training records, certifications, and professional qualifications." />
          </TabsContent>

          <TabsContent value="incidents" className="mt-4">
            <PlaceholderTab title="Incidents" description="Log and review incidents, accidents, and safeguarding reports involving this caregiver." />
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <PlaceholderTab title="Files" description="Upload and manage documents, contracts, and supporting files for this caregiver." />
          </TabsContent>

          <TabsContent value="changelog" className="mt-4">
            <PlaceholderTab title="Changelog" description="Audit trail of all changes made to this caregiver's profile and records." />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default CareGiverProfile;
