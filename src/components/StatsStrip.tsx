import { motion } from "framer-motion";
import AnimatedCounter from "@/components/AnimatedCounter";

const stats = [
  { value: 1247, label: "Simulations Run", suffix: "" },
  { value: 23, label: "Persona Types", suffix: "" },
  { value: 94, label: "Found Critical Objections", suffix: "%" },
  { value: 8, label: "Avg. Time to Insight", suffix: " min" },
];

const StatsStrip = () => {
  return (
    <section className="relative py-8 border-y border-border/50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-2xl md:text-3xl font-black text-foreground">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} duration={1000} />
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-1 uppercase tracking-wider">
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
