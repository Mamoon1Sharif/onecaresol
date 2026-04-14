import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import CareGivers from "./pages/CareGivers.tsx";
import CareReceivers from "./pages/CareReceivers.tsx";
import MemberProfile from "./pages/MemberProfile.tsx";
import Roster from "./pages/Roster.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/caregivers" element={<CareGivers />} />
          <Route path="/carereceivers" element={<CareReceivers />} />
          <Route path="/carereceivers/:id" element={<MemberProfile />} />
          <Route path="/roster" element={<Roster />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
