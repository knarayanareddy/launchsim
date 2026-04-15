import { motion } from "framer-motion";

const agents = [
  {
    name: "The Skeptic VC",
    handle: "@skeptic_vc",
    avatar: "🧐",
    message:
      "Market timing is off. You're competing with 3 well-funded players and your differentiation is a feature, not a product. Show me the moat.",
    sentiment: "destructive" as const,
    score: 4.2,
  },
  {
    name: "Early Adopter",
    handle: "@early_bird",
    avatar: "🚀",
    message:
      "I'd pay for this today. The onboarding flow is unclear but the core value prop is strong. Ship an MVP and I'm in.",
    sentiment: "success" as const,
    score: 8.1,
  },
  {
    name: "The Pragmatist",
    handle: "@pragmatic_pm",
    avatar: "📊",
    message:
      "Solid idea, weak go-to-market. Who's your first 100 users? Community-led growth could work here. Consider a Discord-first strategy.",
    sentiment: "warning" as const,
    score: 6.5,
  },
];

const sentimentColors = {
  destructive: "border-destructive/30 bg-destructive/5",
  success: "border-success/30 bg-success/5",
  warning: "border-warning/30 bg-warning/5",
};

const sentimentDots = {
  destructive: "bg-destructive",
  success: "bg-success",
  warning: "bg-warning",
};

const AgentPreviewSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Meet Your <span className="text-secondary">Critics</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Six AI agents with real opinions. Here's a taste.
          </p>
        </motion.div>

        <div className="space-y-4">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.handle}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`rounded-xl border p-5 ${sentimentColors[agent.sentiment]}`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl flex-shrink-0">{agent.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-semibold text-sm">{agent.name}</span>
                    <span className="text-muted-foreground text-xs font-mono">
                      {agent.handle}
                    </span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${sentimentDots[agent.sentiment]}`}
                      />
                      <span className="font-mono text-xs text-muted-foreground">
                        {agent.score}/10
                      </span>
                    </div>
                  </div>
                  <p className="font-mono text-sm text-foreground/80 leading-relaxed">
                    {agent.message}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgentPreviewSection;
