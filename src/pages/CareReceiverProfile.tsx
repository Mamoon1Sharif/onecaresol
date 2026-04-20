import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useCareReceiver } from "@/hooks/use-care-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReceiverProfileHeader } from "@/components/receiver-profile/ProfileHeader";
import { ReceiverOverviewTab } from "@/components/receiver-profile/OverviewTab";
import { ReceiverDetailedProfileTab } from "@/components/receiver-profile/DetailedProfileTab";
import { ReceiverRotaTab } from "@/components/receiver-profile/RotaTab";
import { ReceiverKeyContactsTab } from "@/components/receiver-profile/KeyContactsTab";
import { ReceiverRemindersTab } from "@/components/receiver-profile/RemindersTab";
import { ReceiverNotesTab } from "@/components/receiver-profile/NotesTab";
import { ReceiverAvailabilityTab } from "@/components/receiver-profile/AvailabilityTab";
import { ReceiverHolidaysTab } from "@/components/receiver-profile/HolidaysTab";
import { ReceiverPlaceholderTab } from "@/components/receiver-profile/PlaceholderTab";
import { CareManagementTab } from "@/components/receiver-profile/CareManagementTab";
import {
  LayoutDashboard, UserCog, CalendarDays, LayoutTemplate,
  Users, Bell, StickyNote, CalendarCheck, Plane,
  MessageSquare, Pill, GraduationCap, AlertTriangle, FileText, History,
  HeartPulse,
} from "lucide-react";

const CareReceiverProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: cr, isLoading } = useCareReceiver(id);

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

  if (!cr) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Service member not found.</p>
          <Button variant="link" onClick={() => navigate("/carereceivers")}>Back to list</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <ReceiverProfileHeader cr={cr} />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <LayoutDashboard className="h-3.5 w-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="care-management" className="gap-1.5 text-xs">
              <HeartPulse className="h-3.5 w-3.5" /> Care Management
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
            <button
              onClick={() => navigate(`/carereceivers/${cr.id}/messaging`)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Messaging
            </button>
            <button
              onClick={() => navigate(`/carereceivers/${cr.id}/medication`)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            >
              <Pill className="h-3.5 w-3.5" /> Medication
            </button>
            <button
              onClick={() => navigate(`/carereceivers/${cr.id}/qualifications`)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            >
              <GraduationCap className="h-3.5 w-3.5" /> Qualifications
            </button>
            <button
              onClick={() => navigate(`/carereceivers/${cr.id}/incidents`)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Incidents
            </button>
            <button
              onClick={() => navigate(`/carereceivers/${cr.id}/files`)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            >
              <FileText className="h-3.5 w-3.5" /> Files
            </button>
            <button
              onClick={() => navigate(`/carereceivers/${cr.id}/changelog`)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            >
              <History className="h-3.5 w-3.5" /> Changelog
            </button>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <ReceiverOverviewTab cr={cr} />
          </TabsContent>
          <TabsContent value="care-management" className="mt-4">
            <CareManagementTab careReceiverId={cr.id} careReceiverName={cr.name} />
          </TabsContent>
          <TabsContent value="detailed" className="mt-4">
            <ReceiverDetailedProfileTab cr={cr} />
          </TabsContent>
          <TabsContent value="rota" className="mt-4">
            <ReceiverRotaTab cr={cr} />
          </TabsContent>
          <TabsContent value="templates" className="mt-4">
            <ReceiverPlaceholderTab title="Templates" description="Manage care plan templates and recurring schedule patterns for this service member." />
          </TabsContent>
          <TabsContent value="contacts" className="mt-4">
            <ReceiverKeyContactsTab careReceiverId={cr.id} />
          </TabsContent>
          <TabsContent value="reminders" className="mt-4">
            <ReceiverRemindersTab careReceiverId={cr.id} careReceiverName={cr.name} />
          </TabsContent>
          <TabsContent value="notes" className="mt-4">
            <ReceiverNotesTab careReceiverId={cr.id} />
          </TabsContent>
          <TabsContent value="availability" className="mt-4">
            <ReceiverAvailabilityTab careReceiverId={cr.id} />
          </TabsContent>
          <TabsContent value="holidays" className="mt-4">
            <ReceiverHolidaysTab careReceiverId={cr.id} careReceiverName={cr.name} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default CareReceiverProfile;
