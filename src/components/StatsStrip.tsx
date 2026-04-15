import { motion } from "framer-motion";
import AnimatedCounter from "@/components/AnimatedCounter";

const stats = [
  { label: "Simulations", value: 1247, suffix: "" },
  { label: "Persona Types", value: 23, suffix: "" },
  { label: "Objections Found", value: 94, suffix: "%" },
  { label: "Avg. Insight Time", value: 8, suffix: " min" },
];

const StatsStrip = () => {
  return (
    <section className="py-10 border-y border-border/30">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-black text-foreground font-mono tracking-tight">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} duration={1000} />
              </div>
              <div className="text-xs text-muted-foreground mt-1.5 tracking-wide">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsStrip;
