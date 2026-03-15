import { motion } from "framer-motion";

const services = [
  { name: "User Service", angle: 0 },
  { name: "Chatbot Service", angle: 60 },
  { name: "Mood Tracking", angle: 120 },
  { name: "Counselor Service", angle: 180 },
  { name: "Notification Service", angle: 240 },
  { name: "Analytics Service", angle: 300 },
];

const benefits = ["Loose Coupling", "Scalability", "Service Reusability", "Independent Deployment"];

export default function ArchitectureSection() {
  const radius = 160;

  return (
    <section id="architecture" className="section-padding overflow-hidden">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-[0.3em] text-primary">
            System Design
          </p>
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
            SOA <span className="gradient-text">Architecture</span>
          </h2>
        </motion.div>

        <div className="flex flex-col items-center gap-16 lg:flex-row lg:items-start lg:justify-center lg:gap-20">
          {/* Architecture diagram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
            style={{ width: radius * 2 + 140, height: radius * 2 + 140 }}
          >
            {/* Center node */}
            <div className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/40 bg-primary/10"
              style={{ boxShadow: "0 0 30px hsl(210 100% 56% / 0.3)" }}
            >
              <span className="font-display text-[10px] font-bold text-primary text-center leading-tight">API<br/>Gateway</span>
            </div>

            {/* Service nodes */}
            {services.map((s, i) => {
              const rad = (s.angle * Math.PI) / 180;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;
              const cx = radius + 70;
              const cy = radius + 70;

              return (
                <div key={s.name}>
                  {/* Line */}
                  <svg className="absolute inset-0 h-full w-full pointer-events-none" style={{ overflow: "visible" }}>
                    <line
                      x1={cx}
                      y1={cy}
                      x2={cx + x}
                      y2={cy + y}
                      stroke="hsl(210 100% 56% / 0.2)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    >
                      <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1s" repeatCount="indefinite" />
                    </line>
                  </svg>

                  {/* Node */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="glass-card absolute flex h-16 w-16 items-center justify-center rounded-full border-primary/20 p-2 floating"
                    style={{
                      left: cx + x - 32,
                      top: cy + y - 32,
                      animationDelay: `${i * 0.4}s`,
                    }}
                  >
                    <span className="font-display text-[8px] font-semibold text-center leading-tight text-primary">
                      {s.name}
                    </span>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 max-w-md"
          >
            <h3 className="mb-6 font-display text-lg font-semibold">
              SOA <span className="neon-text">Benefits</span>
            </h3>
            <div className="space-y-4">
              {benefits.map((b, i) => (
                <motion.div
                  key={b}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card flex items-center gap-4 p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-sm font-medium">{b}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
