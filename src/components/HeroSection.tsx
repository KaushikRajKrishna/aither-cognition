import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import heroVideo from "@/images/Animation_with_rotations_202603292146.mp4";

interface HeroProps {
  onRegisterClick?: () => void;
  onLoginClick?: () => void;
}

export default function HeroSection({ onRegisterClick, onLoginClick }: HeroProps) {
  const { user, logout } = useAuth();

  return (
    <section id="home" className="relative min-h-screen overflow-hidden pt-20">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(hsl(210 100% 56% / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(210 100% 56% / 0.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "800px",
          height: "800px",
          background: "radial-gradient(circle, hsl(210 100% 56% / 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="container relative mx-auto flex flex-col items-center px-4 lg:flex-row lg:gap-8">
        {/* Text */}
        <div className="flex-1 pt-8 text-center lg:pt-20 lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="mb-4 font-display text-xs font-medium uppercase tracking-[0.3em] text-primary">
              Next-Gen Mental Health Technology
            </p>
            <h1 className="mb-6 font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              <span className="gradient-text">AI Powered</span>
              <br />
              <span className="text-foreground">Mental Health Platform</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0 lg:text-lg">
              A Service-Oriented Architecture platform that provides emotional support, AI counseling assistance, mood tracking, and access to professional therapists.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 lg:justify-start"
          >
            {user ? (
              <>
                <span className="flex items-center font-display text-sm text-primary">
                  Welcome, {user.name}
                </span>
                <button
                  onClick={logout}
                  className="glow-button-outline font-display text-sm font-semibold tracking-wider"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onRegisterClick?.()}
                  className="glow-button pulse-glow font-display text-sm font-semibold tracking-wider"
                >
                  Register Now
                </button>
                <button
                  onClick={() => onLoginClick?.()}
                  className="glow-button-outline font-display text-sm font-semibold tracking-wider"
                >
                  Login
                </button>
              </>
            )}
          </motion.div>

          {/* Hero Video */}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex-1 overflow-hidden"
        >
          <video
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className="h-[320px] w-full object-cover object-center md:h-[380px] lg:h-[440px]"
          />
        </motion.div>
      </div>
    </section>
  );
}
