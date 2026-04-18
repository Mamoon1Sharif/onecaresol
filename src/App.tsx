import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import CareGivers from "./pages/CareGivers.tsx";
import CareGiverProfile from "./pages/CareGiverProfile.tsx";
import AddCareGiver from "./pages/AddCareGiver.tsx";
import CareGiverSchedule from "./pages/CareGiverSchedule.tsx";
import CareReceivers from "./pages/CareReceivers.tsx";
import CareReceiverProfile from "./pages/CareReceiverProfile.tsx";
import MemberProfile from "./pages/MemberProfile.tsx";
import Roster from "./pages/Roster.tsx";
import DailyRoster from "./pages/DailyRoster.tsx";
import HolidaysAbsence from "./pages/HolidaysAbsence.tsx";
import Messaging from "./pages/Messaging.tsx";
import Medication from "./pages/Medication.tsx";
import Qualifications from "./pages/Qualifications.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/caregivers" element={<ProtectedRoute><CareGivers /></ProtectedRoute>} />
            <Route path="/caregivers/new" element={<ProtectedRoute><AddCareGiver /></ProtectedRoute>} />
            <Route path="/caregivers/:id" element={<ProtectedRoute><CareGiverProfile /></ProtectedRoute>} />
            <Route path="/caregivers/:id/schedule" element={<ProtectedRoute><CareGiverSchedule /></ProtectedRoute>} />
            <Route path="/carereceivers" element={<ProtectedRoute><CareReceivers /></ProtectedRoute>} />
            <Route path="/carereceivers/:id" element={<ProtectedRoute><CareReceiverProfile /></ProtectedRoute>} />
            <Route path="/roster" element={<ProtectedRoute><Roster /></ProtectedRoute>} />
            <Route path="/daily-roster" element={<ProtectedRoute><DailyRoster /></ProtectedRoute>} />
            <Route path="/holidays-absence" element={<ProtectedRoute><HolidaysAbsence /></ProtectedRoute>} />
            <Route path="/caregivers/:id/messaging" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
            <Route path="/caregivers/:id/medication" element={<ProtectedRoute><Medication /></ProtectedRoute>} />
            <Route path="/caregivers/:id/qualifications" element={<ProtectedRoute><Qualifications /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
