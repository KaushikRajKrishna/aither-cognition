import { motion } from "framer-motion";

const categories = [
  { label: "Frontend", items: ["React", "TailwindCSS", "Framer Motion"] },
  { label: "Backend", items: ["Node.js Microservices"] },
  { label: "Architecture", items: ["Service-Oriented Architecture"] },
  { label: "Database", items: ["MongoDB / PostgreSQL"] },
  { label: "AI Layer", items: ["NLP Chatbot"] },
  { label: "Deployment", items: ["Docker / Cloud Infrastructure"] },
];

export default function TechStackSection() {
  return (
    <section id="technology" className="section-padding">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="mb-2 font-display text-xs font-medium uppercase tracking-[0.3em] text-primary">
            Built With
          </p>
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
            Technology <span className="gradient-text">Stack</span>
          </h2>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, ci) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: ci * 0.1 }}
              className="glass-card-hover p-6"
            >
              <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-widest text-primary">
                {cat.label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {cat.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-primary/20 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/50 hover:shadow-[0_0_15px_hsl(210_100%_56%/0.2)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
