import { motion } from "framer-motion";

const capabilities = [
  {
    emoji: "🧠",
    title: "Swarm Intelligence",
    description: "1,000 AI personas with distinct memories, biases, and expertise react to your product simultaneously.",
  },
  {
    emoji: "🎭",
    title: "Persona Diversity",
    description: "23 archetypes from skeptical VCs to enthusiastic early adopters. Custom personas on Unlimited.",
  },
  {
    emoji: "⚡",
    title: "Real-time Theater",
    description: "Watch agents debate your product live in a cinematic simulation theater with typewriter effects.",
  },
  {
    emoji: "📊",
    title: "Sentiment Analysis",
    description: "Granular breakdown of excited, skeptical, neutral, and hostile reactions with rationale.",
  },
  {
    emoji: "🔍",
    title: "Objection Mining",
    description: "Surface the exact objections real users would raise — specific to your product, market, and positioning.",
  },
  {
    emoji: "✍️",
    title: "Pitch Refinement",
    description: "AI-sharpened version of your pitch based on what resonated most with the simulated crowd.",
  },
  {
    emoji: "📈",
    title: "Score Tracking",
    description: "Track your launch confidence score across iterations. Compare simulations side by side.",
  },
  {
    emoji: "🔗",
    title: "Export & Share",
    description: "Export to PDF or Notion. Share public comparison links. Present to your team or investors.",
  },
  {
    emoji: "🛡️",
    title: "Industry-Aware",
    description: "Agents raise HIPAA for healthcare, SSO for enterprise, API docs for dev tools — automatically.",
  },
];

const CapabilitiesSection = () => {
  return (
    <section className="py-28 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <span className="text-xs text-muted-foreground tracking-widest uppercase">Capabilities</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 leading-tight"
        >
          Everything a founder needs<br className="hidden md:block" />{" "}
          <span className="text-primary">to launch with confidence.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground mb-16 max-w-lg mx-auto"
        >
          One simulation replaces weeks of user interviews, surveys, and guesswork.
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border/40 bg-card/50 p-6 hover:border-primary/20 transition-all duration-300"
            >
              <span className="text-2xl mb-3 block">{cap.emoji}</span>
              <h3 className="text-sm font-semibold mb-2 text-foreground">{cap.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{cap.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CapabilitiesSection;
