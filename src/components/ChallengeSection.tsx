import { motion } from "framer-motion";
import { AlertTriangle, MapPin, ShieldOff, DollarSign } from "lucide-react";

const challenges = [
  { icon: AlertTriangle, title: "Stress & Anxiety", desc: "Rising stress levels among students and professionals worldwide." },
  { icon: MapPin, title: "Limited Accessibility", desc: "Mental health resources are scarce in many regions." },
  { icon: ShieldOff, title: "Social Stigma", desc: "Fear of judgment prevents many from seeking help." },
  { icon: DollarSign, title: "High Cost Therapy", desc: "Professional counseling remains unaffordable for many." },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6 },
  }),
};

export default function ChallengeSection() {
  return (
    <section className="section-padding">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-[0.3em] text-primary">
            The Problem
          </p>
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
            The Mental Health <span className="gradient-text">Challenge</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Mental health issues such as stress, anxiety, and depression are rapidly increasing among students and professionals. Many individuals hesitate to seek help due to stigma, accessibility issues, or high counseling costs.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {challenges.map((item, i) => (
            <motion.div
              key={item.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              className="glass-card-hover floating p-6 text-center"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <item.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-sm font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
