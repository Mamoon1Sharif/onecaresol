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
import { NotesTab } from "@/components/caregiver-profile/NotesTab";
import { KeyContactsTab } from "@/components/caregiver-profile/KeyContactsTab";
import { RemindersTab } from "@/components/caregiver-profile/RemindersTab";
import { AvailabilityTab } from "@/components/caregiver-profile/AvailabilityTab";
import { HolidaysTab } from "@/components/caregiver-profile/HolidaysTab";
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
            <ScheduleView cg={cg} showHeader={false} />
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <PlaceholderTab title="Templates" description="Manage shift templates and recurring schedule patterns for this caregiver." />
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            <KeyContactsTab careGiverId={cg.id} />
          </TabsContent>

          <TabsContent value="reminders" className="mt-4">
            <RemindersTab careGiverId={cg.id} careGiverName={cg.name} />
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <NotesTab careGiverId={cg.id} />
          </TabsContent>

          <TabsContent value="availability" className="mt-4">
            <AvailabilityTab cg={cg} />
          </TabsContent>

          <TabsContent value="holidays" className="mt-4">
            <HolidaysTab careGiverId={cg.id} careGiverName={cg.name} />
          </TabsContent>

          <TabsContent value="messaging" className="mt-4">
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <MessageSquare className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">
                Send Message
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Open the full messaging view to send push notifications to this team member's device.
              </p>
              <a
                href={`/caregivers/${cg.id}/messaging`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Go To Messaging
              </a>
            </div>
          </TabsContent>

          <TabsContent value="medication" className="mt-4">
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <Pill className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">
                Medication & Vaccinations
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Open the full medication view to manage vaccination records and competency certifications.
              </p>
              <a
                href={`/caregivers/${cg.id}/medication`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Go To Medication
              </a>
            </div>
          </TabsContent>

          <TabsContent value="qualifications" className="mt-4">
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <GraduationCap className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">
                All Qualifications
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Open the full view to manage training records, certifications, and qualifications.
              </p>
              <a
                href={`/caregivers/${cg.id}/qualifications`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Go To Qualifications
              </a>
            </div>
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
