import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Home, MessageCircle, CalendarPlus, Clock, Users, Stethoscope, Heart } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { motion, AnimatePresence } from "framer-motion";
import ChatBot from "@/components/ChatBot";
import BookAppointment from "@/components/BookAppointment";
import DoctorDashboard from "@/components/DoctorDashboard";
import MoodTracker from "@/components/MoodTracker";

type UserView = "home" | "chatbot" | "book-appointment" | "mood-tracker";
type DoctorView = "doctor-home" | "availability" | "appointments";
type ActiveView = UserView | DoctorView;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>(
    user?.role === "doctor" ? "appointments" : "home"
  );

  const isDoctor = user?.role === "doctor";

  // ── User menu items ────────────────────────────────────────────────────────
  const userMenu = [
    { icon: Home, label: "Home", view: "home" as UserView },
    { icon: Heart, label: "Mood Tracker", view: "mood-tracker" as UserView },
    { icon: MessageCircle, label: "ChatBot", view: "chatbot" as UserView },
    { icon: CalendarPlus, label: "Book Appointment", view: "book-appointment" as UserView },
  ];

  // ── Doctor menu items ──────────────────────────────────────────────────────
  const doctorMenu = [
    { icon: Users, label: "Manage Appointments", view: "appointments" as DoctorView },
    { icon: Clock, label: "Availability", view: "availability" as DoctorView },
  ];

  type MenuItem = { icon: React.ElementType; label: string; view: ActiveView };
  const menuItems: MenuItem[] = isDoctor ? doctorMenu : userMenu;

  const handleMenuClick = (view: ActiveView) => {
    if (view === "chatbot") {
      setChatOpen(true);
      return;
    }
    setActiveView(view);
  };

  return (
    <SidebarProvider defaultOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex w-full h-screen bg-background">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <div className="flex items-center gap-2">
              {isDoctor && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15">
                  <Stethoscope className="h-4 w-4 text-emerald-500" />
                </div>
              )}
              <div className="font-display text-lg font-bold gradient-text">
                Mind<span className="text-sidebar-foreground">Tech</span>
              </div>
            </div>
            {isDoctor && (
              <span className="mt-1 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                Doctor
              </span>
            )}
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeView === item.view}
                  >
                    <button
                      onClick={() => handleMenuClick(item.view)}
                      className="flex w-full items-center gap-3"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <div className="border-t border-sidebar-border p-4">
            <Button
              onClick={logout}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </Sidebar>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="border-b border-border bg-card p-4 flex items-center justify-between shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1" />
            <NotificationBell />
            <div className="text-sm text-muted-foreground">
              Welcome, <span className="font-semibold text-foreground">{user?.name}</span>
              {isDoctor && (
                <span className="ml-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                  Doctor
                </span>
              )}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {/* ── USER VIEWS ── */}
                {!isDoctor && activeView === "home" && <UserHome onStartChat={() => setChatOpen(true)} onBookAppointment={() => setActiveView("book-appointment")} onMoodTracker={() => setActiveView("mood-tracker")} />}
                {!isDoctor && activeView === "mood-tracker" && <MoodTracker />}
                {!isDoctor && activeView === "book-appointment" && <BookAppointment />}

                {/* ── DOCTOR VIEWS ── */}
                {isDoctor && (activeView === "availability" || activeView === "appointments") && (
                  <DoctorDashboard initialView={activeView} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ChatBot overlay — user only */}
      <AnimatePresence>
        {chatOpen && <ChatBot onClose={() => setChatOpen(false)} />}
      </AnimatePresence>
    </SidebarProvider>
  );
}

// ── User Home ──────────────────────────────────────────────────────────────────
function UserHome({
  onStartChat, onBookAppointment, onMoodTracker,
}: { onStartChat: () => void; onBookAppointment: () => void; onMoodTracker: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl"
    >
      <h1 className="font-display text-3xl font-bold mb-2">Welcome to Aither Cognition</h1>
      <p className="text-muted-foreground mb-6">Mental health support powered by AI</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Mood Tracker Card */}
        <div className="glass-card border border-glass-border rounded-lg p-6 hover:border-pink-500/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="h-6 w-6 text-pink-500" />
            <h2 className="font-display text-xl font-bold">Mood Tracker</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Track your daily emotions, get AI-powered insights, and monitor your mental well-being over time.
          </p>
          <button onClick={onMoodTracker} className="mt-4 glow-button text-sm">
            Track Mood
          </button>
        </div>

        {/* ChatBot Card */}
        <div className="glass-card border border-glass-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h2 className="font-display text-xl font-bold">ChatBot Counseling</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect with our AI-based chatbot for emotional support and helpful suggestions using advanced NLP models.
          </p>
          <button onClick={onStartChat} className="mt-4 glow-button text-sm">
            Start Chat
          </button>
        </div>

        {/* Book Appointment Card */}
        <div className="glass-card border border-glass-border rounded-lg p-6 hover:border-emerald-500/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <CalendarPlus className="h-6 w-6 text-emerald-500" />
            <h2 className="font-display text-xl font-bold">Book Appointment</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Browse verified mental health professionals and book an appointment on a day that works for you.
          </p>
          <button
            onClick={onBookAppointment}
            className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-500 transition-all hover:bg-emerald-500/20"
          >
            View Doctors
          </button>
        </div>

        
      </div>
    </motion.div>
  );
}
