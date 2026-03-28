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
import RoleSelectModal from "@/components/RoleSelectModal";
import DoctorRegisterModal from "@/components/DoctorRegisterModal";
import LoginRoleSelectModal from "@/components/LoginRoleSelectModal";
import DoctorLoginModal from "@/components/DoctorLoginModal";

const Index = () => {
  const { user, loading } = useAuth();
  const [loginRoleOpen, setLoginRoleOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [doctorLoginOpen, setDoctorLoginOpen] = useState(false);
  const [roleSelectOpen, setRoleSelectOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [doctorRegisterOpen, setDoctorRegisterOpen] = useState(false);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    return <Dashboard />;
  }

  const openRoleSelect = () => setRoleSelectOpen(true);
  const openLoginRoleSelect = () => setLoginRoleOpen(true);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onLoginClick={openLoginRoleSelect} onRegisterClick={openRoleSelect} />
      <HeroSection onRegisterClick={openRoleSelect} onLoginClick={openLoginRoleSelect} />
      <ChallengeSection />
      <FeaturesSection />
      <ArchitectureSection />
      <HowItWorksSection />
      <TechStackSection />
      <CTASection />
      <Footer />

      {/* Role selection – appears first on "Register Now" */}
      <RoleSelectModal
        open={roleSelectOpen}
        onClose={() => setRoleSelectOpen(false)}
        onSelectUser={() => {
          setRoleSelectOpen(false);
          setRegisterOpen(true);
        }}
        onSelectDoctor={() => {
          setRoleSelectOpen(false);
          setDoctorRegisterOpen(true);
        }}
      />

      {/* User registration */}
      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSwitchToLogin={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
      />

      {/* Doctor registration */}
      <DoctorRegisterModal
        open={doctorRegisterOpen}
        onClose={() => setDoctorRegisterOpen(false)}
        onSwitchToLogin={() => {
          setDoctorRegisterOpen(false);
          setLoginOpen(true);
        }}
      />

      {/* Login role selector */}
      <LoginRoleSelectModal
        open={loginRoleOpen}
        onClose={() => setLoginRoleOpen(false)}
        onPatient={() => { setLoginRoleOpen(false); setLoginOpen(true); }}
        onDoctor={() => { setLoginRoleOpen(false); setDoctorLoginOpen(true); }}
      />

      {/* Patient login */}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToRegister={() => {
          setLoginOpen(false);
          setRoleSelectOpen(true);
        }}
      />

      {/* Doctor login */}
      <DoctorLoginModal
        open={doctorLoginOpen}
        onClose={() => setDoctorLoginOpen(false)}
        onBack={() => { setDoctorLoginOpen(false); setLoginRoleOpen(true); }}
        onSwitchToRegister={() => { setDoctorLoginOpen(false); setDoctorRegisterOpen(true); }}
      />
    </div>
  );
};

export default Index;
