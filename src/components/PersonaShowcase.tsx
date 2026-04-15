import { motion } from "framer-motion";
import { useRef } from "react";

const personas = [
  {
    emoji: "🧑‍💼",
    name: "Marcus Chen",
    role: "Senior PM",
    badge: "🟡 Pragmatist",
    quote: '"Show me the retention metrics first."',
  },
  {
    emoji: "👩‍💻",
    name: "Priya Sharma",
    role: "Developer",
    badge: "🔴 Tough Crowd",
    quote: '"Another wrapper? What\'s actually novel here?"',
  },
  {
    emoji: "💰",
    name: "Alex Rivera",
    role: "VC Partner",
    badge: "🟡 Pragmatist",
    quote: '"Market size checks out. What\'s the moat?"',
  },
  {
    emoji: "😤",
    name: "Jordan Kim",
    role: "Skeptic",
    badge: "🔴 Tough Crowd",
    quote: '"We\'ve seen this exact pitch 10 times this year."',
  },
  {
    emoji: "✅",
    name: "Sam Taylor",
    role: "Early Adopter",
    badge: "🟢 Early Adopter",
    quote: '"I\'d switch from my current tool for this immediately."',
  },
  {
    emoji: "🏢",
    name: "Morgan Lee",
    role: "Enterprise Buyer",
    badge: "🟡 Pragmatist",
    quote: '"Does it integrate with Salesforce and have SSO?"',
  },
  {
    emoji: "🚀",
    name: "Casey Patel",
    role: "Founder",
    badge: "🟢 Early Adopter",
    quote: '"Clean positioning. I get it in 5 seconds."',
  },
  {
    emoji: "📊",
    name: "Riley Adams",
    role: "Analyst",
    badge: "🟡 Pragmatist",
    quote: '"The unit economics story needs more work."',
  },
];

const PersonaShowcase = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section id="personas" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Meet your <span className="text-secondary">critics</span>{" "}
            <span className="text-muted-foreground">(before your real users do)</span>
          </h2>
        </motion.div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-6 pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Left spacer */}
        <div className="flex-shrink-0 w-[calc((100vw-1400px)/2)]" />

        {personas.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex-shrink-0 w-[280px] snap-start glass-card rounded-xl p-5 hover:border-primary/20 transition-colors"
          >
            <div className="text-3xl mb-3">{p.emoji}</div>
            <h3 className="font-semibold text-sm">{p.name}</h3>
            <p className="text-muted-foreground text-xs mb-2">{p.role}</p>
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-muted/50 mb-3">
              {p.badge}
            </span>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed italic">
              {p.quote}
            </p>
          </motion.div>
        ))}

        {/* Right spacer */}
        <div className="flex-shrink-0 w-6" />
      </div>
    </section>
  );
};

export default PersonaShowcase;
