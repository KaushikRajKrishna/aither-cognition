import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import HeroSection from "@/components/HeroSection";
import ChallengeSection from "@/components/ChallengeSection";
import FeaturesSection from "@/components/FeaturesSection";
import ArchitectureSection from "@/components/ArchitectureSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TechStackSection from "@/components/TechStackSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import RegisterModal from "@/components/RegisterModal";

const Index = () => {
  const { user, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  // Show dashboard if user is logged in
  if (user) {
    return <Dashboard />;
  }

  // Show landing page if not logged in
  return (
    <div className="min-h-screen bg-background">
      <Navbar onLoginClick={() => setLoginOpen(true)} onRegisterClick={() => setRegisterOpen(true)} />
      <HeroSection />
      <ChallengeSection />
      <FeaturesSection />
      <ArchitectureSection />
      <HowItWorksSection />
      <TechStackSection />
      <CTASection />
      <Footer />
      
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToRegister={() => {
          setLoginOpen(false);
          setRegisterOpen(true);
        }}
      />
      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSwitchToLogin={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
      />
    </div>
  );
};

export default Index;
