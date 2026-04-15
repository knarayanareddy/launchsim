import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { MockAgent } from "@/data/simulationMocks";
import TypewriterText from "@/components/simulation/TypewriterText";

const BADGE_STYLES: Record<MockAgent["badge"], string> = {
  skeptic: "bg-destructive/15 text-destructive border-destructive/30",
  advocate: "bg-success/15 text-success border-success/30",
  pragmatist: "bg-warning/15 text-warning border-warning/30",
  analyst: "bg-primary/15 text-primary border-primary/30",
};

const BADGE_LABELS: Record<MockAgent["badge"], string> = {
  skeptic: "Skeptic",
  advocate: "Advocate",
  pragmatist: "Pragmatist",
  analyst: "Analyst",
};

interface AgentGridProps {
  agents: MockAgent[];
}

const UpvoteCounter = ({ target }: { target: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let current = 0;
    const step = Math.ceil(target / 15);
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(current);
      if (current >= target) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, [target]);

  return <>{count}</>;
};

const AgentGrid = ({ agents }: AgentGridProps) => {
  const [showAll, setShowAll] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const visibleAgents = isMobile && !showAll ? agents.slice(0, 6) : agents;

  return (
    <div className="flex flex-col min-h-0">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Active Agents ({agents.length})
      </h2>
      <div
        className="flex-1 overflow-y-auto pr-2 space-y-3"
        style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--muted)) transparent", maxHeight: "calc(100vh - 200px)" }}
      >
        {visibleAgents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.18, ease: [0.34, 1.56, 0.64, 1] }}
            className="glass-card rounded-xl p-4 !transform-none hover:!transform-none"
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 text-2xl mt-0.5">{agent.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm">{agent.name}</span>
                  <span className="text-xs text-muted-foreground">{agent.role}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${BADGE_STYLES[agent.badge]}`}>
                    {agent.badgeEmoji} {BADGE_LABELS[agent.badge]}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">{agent.company}</p>
                <div className="font-mono text-xs text-foreground/80 leading-relaxed">
                  <TypewriterText text={agent.reaction} speed={18} />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    👍 <UpvoteCounter target={agent.upvotes} />
                  </span>
                  <span className="text-xs text-muted-foreground">2 min ago</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {isMobile && !showAll && agents.length > 6 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 text-xs text-primary font-medium touch-target"
        >
          Show {agents.length - 6} more agents ↓
        </button>
      )}
    </div>
  );
};

export default AgentGrid;
