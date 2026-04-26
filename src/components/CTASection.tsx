import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function CTASection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(210 100% 56% / 0.08) 0%, transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(hsl(210 100% 56% / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(210 100% 56% / 0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="container relative mx-auto text-center"
      >
        <h2 className="mb-6 font-display text-3xl font-bold md:text-5xl">
          Start Your Journey Towards
          <br />
          <span className="gradient-text">Better Mental Wellness</span>
        </h2>
        <p className="mx-auto mb-10 max-w-lg text-muted-foreground">
          Join thousands who are already benefiting from AI-powered mental health support.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {!user && (
            <button
              onClick={() => navigate("/register")}
              className="glow-button pulse-glow font-display text-sm font-semibold tracking-wider"
            >
              Register Now
            </button>
          )}
        </div>
      </motion.div>
    </section>
  );
}
