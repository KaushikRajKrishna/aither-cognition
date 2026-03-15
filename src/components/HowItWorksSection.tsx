import { motion } from "framer-motion";

const steps = [
  { step: 1, title: "Register", desc: "User registers on the platform." },
  { step: 2, title: "AI Chat", desc: "User interacts with AI chatbot." },
  { step: 3, title: "Log Mood", desc: "User records daily mood." },
  { step: 4, title: "AI Analysis", desc: "AI analyzes emotional patterns." },
  { step: 5, title: "Book Sessions", desc: "User books counseling sessions." },
  { step: 6, title: "Wellness Plan", desc: "Platform provides personalized recommendations." },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section-padding">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-[0.3em] text-primary">
            User Journey
          </p>
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
            How It <span className="gradient-text">Works</span>
          </h2>
        </motion.div>

        <div className="relative mx-auto max-w-3xl">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent md:left-1/2 md:block" />

          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative mb-8 flex items-start gap-4 md:mb-12 ${
                i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } md:items-center`}
            >
              {/* Content card */}
              <div className={`glass-card-hover flex-1 p-5 ${i % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                <h3 className="mb-1 font-display text-sm font-semibold">
                  Step {s.step}: {s.title}
                </h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>

              {/* Circle */}
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-background"
                style={{ boxShadow: "0 0 15px hsl(210 100% 56% / 0.3)" }}
              >
                <span className="font-display text-xs font-bold text-primary">{s.step}</span>
              </div>

              {/* Spacer */}
              <div className="hidden flex-1 md:block" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
