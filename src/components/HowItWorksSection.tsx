import { motion } from "framer-motion";

const steps = [
  {
    icon: "📝",
    title: "Paste Your Pitch",
    description:
      "Drop in your landing page copy, one-pager, or rough product idea. No formatting required — just your story.",
  },
  {
    icon: "🐟",
    title: "Swarm Activates",
    description:
      "1,000 AI agents with unique personalities, memories, and biases react, debate, and vote on your product in real-time.",
  },
  {
    icon: "📊",
    title: "Get Your Report",
    description:
      "Sentiment map, top objections, refined pitch copy, and a launch confidence score — all in under 2 minutes.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-28 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <span className="text-xs text-muted-foreground tracking-widest uppercase">The Process</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-16 leading-tight"
        >
          From idea to insight in{" "}
          <span className="text-primary">3 steps.</span>
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border/40 bg-card/50 p-8 group hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-3xl">{step.icon}</span>
                <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
