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
import { Menu, LogOut, Home, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { icon: Home, label: "Home", href: "#home" },
    { icon: MessageCircle, label: "ChatBot", href: "#chatbot" },
  ];

  return (
    <SidebarProvider defaultOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex w-full h-screen bg-background">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <div className="flex items-center justify-between">
              <div className="font-display text-lg font-bold gradient-text">
                Mind<span className="text-sidebar-foreground">Tech</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild>
                    <a href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </a>
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
        <main className="flex-1 flex flex-col">
          {/* Top bar with hamburger */}
          <div className="border-b border-border bg-card p-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1" />
            <div className="text-sm text-muted-foreground">
              Welcome, <span className="font-semibold text-foreground">{user?.name}</span>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl"
            >
              <h1 className="font-display text-3xl font-bold mb-2">Welcome to Aither Cognition</h1>
              <p className="text-muted-foreground mb-6">
                Mental health support powered by AI
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ChatBot Card */}
                <div className="glass-card border border-glass-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageCircle className="h-6 w-6 text-primary" />
                    <h2 className="font-display text-xl font-bold">ChatBot Counseling</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Connect with our AI-based chatbot for emotional support and helpful suggestions using advanced NLP models.
                  </p>
                  <button className="mt-4 glow-button text-sm">Start Chat</button>
                </div>

                {/* Mood Tracking Card */}
                <div className="glass-card border border-glass-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-6 w-6 text-primary">📊</div>
                    <h2 className="font-display text-xl font-bold">Mood Tracking</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Track your mood patterns and get insights into your emotional well-being over time.
                  </p>
                  <button className="mt-4 glow-button text-sm">View Moods</button>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
