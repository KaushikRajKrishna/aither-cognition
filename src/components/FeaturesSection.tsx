import { motion } from "framer-motion";
import { MessageSquare, BarChart3, Calendar, LineChart, Sparkles, Shield } from "lucide-react";

const features = [
  { icon: MessageSquare, title: "AI Mental Health Chatbot", desc: "A conversational assistant that provides emotional support and coping suggestions." },
  { icon: BarChart3, title: "Mood Tracking System", desc: "Users can log daily mood and track emotional patterns." },
  { icon: Calendar, title: "Counselor Appointment Booking", desc: "Schedule sessions with professional therapists easily." },
  { icon: LineChart, title: "Emotional Analytics Dashboard", desc: "Visualize emotional trends over time." },
  { icon: Sparkles, title: "Personalized Wellness", desc: "AI driven suggestions for improving mental well-being." },
  { icon: Shield, title: "Secure User Profiles", desc: "Authentication and encrypted data storage." },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="section-padding">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-[0.3em] text-primary">
            What We Offer
          </p>
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
            Platform <span className="gradient-text">Features</span>
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-card-hover group p-8"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 font-display text-sm font-semibold tracking-wide">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
