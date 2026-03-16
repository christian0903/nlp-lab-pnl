import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/lab/Header";
import Footer from "@/components/lab/Footer";
import Index from "./pages/Index";
import Library from "./pages/Library";
import ModelDetail from "./pages/ModelDetail";
import Community from "./pages/Community";
import Auth from "./pages/Auth";
import Resources from "./pages/Resources";
import Contribute from "./pages/Contribute";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Events from "./pages/Events";
import ImportModel from "./pages/ImportModel";
import AdminUsers from "./pages/AdminUsers";
import Help from "./pages/Help";
import Soutenir from "./pages/Soutenir";
import AdminDonations from "./pages/AdminDonations";
import HelpAdmin from "./pages/HelpAdmin";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/library" element={<Library />} />
            <Route path="/model/:id" element={<ModelDetail />} />
            <Route path="/community" element={<Community />} />
            <Route path="/contribute" element={<Contribute />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/import" element={<ImportModel />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/donations" element={<AdminDonations />} />
            <Route path="/admin/guide" element={<HelpAdmin />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profil/:userId" element={<PublicProfile />} />
            <Route path="/events" element={<Events />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/aide" element={<Help />} />
            <Route path="/soutenir" element={<Soutenir />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </main>
          <Footer />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
