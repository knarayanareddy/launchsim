import { motion } from "framer-motion";
import { Brain, MessageSquare, BarChart3, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Agent Panel",
    description:
      "Six distinct AI personas — from the skeptical VC to the early adopter — tear apart your idea and tell you what actually matters.",
    accent: "primary" as const,
  },
  {
    icon: MessageSquare,
    title: "Real-Time Feedback",
    description:
      "Watch agents debate your product in real-time. Monospace posts, heated threads, and signal you can't get from surveys.",
    accent: "secondary" as const,
  },
  {
    icon: BarChart3,
    title: "Launch Score",
    description:
      "A composite score from 0–10 across viability, market fit, timing, and defensibility. Backed by data, not vibes.",
    accent: "warning" as const,
  },
  {
    icon: Zap,
    title: "Iterate & Re-Run",
    description:
      "Tweak your pitch, adjust your positioning, and re-simulate. Track how your score changes across iterations.",
    accent: "success" as const,
  },
];

const accentStyles = {
  primary: "text-primary bg-primary/10 border-primary/20",
  secondary: "text-secondary bg-secondary/10 border-secondary/20",
  warning: "text-warning bg-warning/10 border-warning/20",
  success: "text-success bg-success/10 border-success/20",
};

const FeaturesSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Your Launch, <span className="text-primary">Stress-Tested</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Everything you need to validate before you build.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-6 hover:border-primary/20 transition-colors group"
            >
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border mb-4 ${accentStyles[feature.accent]}`}
              >
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
