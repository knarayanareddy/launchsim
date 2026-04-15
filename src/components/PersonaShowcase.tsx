import { motion } from "framer-motion";

const personas = [
  { emoji: "🧑‍💼", name: "Marcus Chen", role: "Senior PM", badge: "Pragmatist", badgeColor: "text-warning", quote: '"Show me the retention metrics first."' },
  { emoji: "👩‍💻", name: "Priya Sharma", role: "Developer", badge: "Skeptic", badgeColor: "text-destructive", quote: '"Another wrapper? What\'s actually novel here?"' },
  { emoji: "💰", name: "Alex Rivera", role: "VC Partner", badge: "Pragmatist", badgeColor: "text-warning", quote: '"Market size checks out. What\'s the moat?"' },
  { emoji: "😤", name: "Jordan Kim", role: "Skeptic", badge: "Skeptic", badgeColor: "text-destructive", quote: '"We\'ve seen this exact pitch 10 times this year."' },
  { emoji: "✅", name: "Sam Taylor", role: "Early Adopter", badge: "Advocate", badgeColor: "text-success", quote: '"I\'d switch from my current tool for this immediately."' },
  { emoji: "🏢", name: "Morgan Lee", role: "Enterprise Buyer", badge: "Pragmatist", badgeColor: "text-warning", quote: '"Does it integrate with Salesforce and have SSO?"' },
  { emoji: "🚀", name: "Casey Patel", role: "Founder", badge: "Advocate", badgeColor: "text-success", quote: '"Clean positioning. I get it in 5 seconds."' },
  { emoji: "📊", name: "Riley Adams", role: "Analyst", badge: "Analyst", badgeColor: "text-primary", quote: '"The unit economics story needs more work."' },
];

const PersonaShowcase = () => {
  return (
    <section id="personas" className="py-28 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <span className="text-xs text-muted-foreground tracking-widest uppercase">Persona Types</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-16 leading-tight"
        >
          Meet your <span className="text-secondary">critics</span>{" "}
          <span className="text-muted-foreground/60">before your real users do.</span>
        </motion.h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {personas.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border/40 bg-card/50 p-5 hover:border-primary/20 transition-all duration-300"
            >
              <div className="text-3xl mb-3">{p.emoji}</div>
              <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{p.role}</p>
              <span className={`text-[10px] font-mono ${p.badgeColor} tracking-wide`}>
                ● {p.badge}
              </span>
              <p className="font-mono text-xs text-muted-foreground/80 leading-relaxed mt-3 italic">
                {p.quote}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PersonaShowcase;
