import { motion } from "framer-motion";

const steps = [
  {
    icon: "📝",
    title: "Paste Your Pitch",
    description:
      "Drop in your landing page copy, one-pager, or rough idea",
  },
  {
    icon: "🐟",
    title: "Swarm Activates",
    description:
      "1,000 AI agents with unique personalities, memories, and opinions react, debate, and vote",
  },
  {
    icon: "📊",
    title: "Get Your Report",
    description:
      "Sentiment map, top objections, refined pitch, and launch confidence score",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            From idea to insight in <span className="text-primary">3 steps</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card rounded-xl p-6 text-center group hover:border-primary/20 transition-colors"
            >
              <div className="text-4xl mb-4">{step.icon}</div>
              <div className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                Step {i + 1}
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
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
