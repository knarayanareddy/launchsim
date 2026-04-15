import { useState } from "react";
import { TOP_OBJECTIONS } from "@/data/resultsMocks";

const CATEGORIES = ["All", "Positioning", "Trust", "Pricing", "Technical", "ICP"];

const BADGE_CHIP: Record<string, string> = {
  skeptic: "bg-destructive/15 text-destructive",
  advocate: "bg-success/15 text-success",
  pragmatist: "bg-warning/15 text-warning",
  analyst: "bg-primary/15 text-primary",
};

const CATEGORY_CHIP: Record<string, string> = {
  Positioning: "bg-primary/15 text-primary",
  Trust: "bg-warning/15 text-warning",
  Pricing: "bg-destructive/15 text-destructive",
  Technical: "bg-secondary/15 text-secondary",
  ICP: "bg-warning/15 text-warning",
};

interface ObjectionsTabProps {
  data?: any[];
}

const ObjectionsTab = ({ data }: ObjectionsTabProps) => {
  const [filter, setFilter] = useState("All");

  const objections = (data || TOP_OBJECTIONS).map((o: any, i: number) => ({
    id: o.id || i + 1,
    text: o.text,
    agents: o.agent_count || o.agents,
    category: o.category,
    quote: o.quote || o.text,
    agent: o.agent || "Agent",
    role: o.role || o.archetype || "",
    badge: o.badge || "pragmatist",
    badgeEmoji: o.badgeEmoji || (o.badge === "skeptic" ? "🔴" : o.badge === "advocate" ? "🟢" : o.badge === "analyst" ? "🔵" : "🟡"),
    emoji: o.emoji || "🎯",
  }));

  const filtered = filter === "All"
    ? objections
    : objections.filter((o: any) => o.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              filter === cat
                ? "bg-primary/15 border-primary/40 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.map((obj: any, i: number) => (
        <div key={obj.id} className="glass-card rounded-xl p-5 border-l-2 border-l-destructive/40">
          <div className="flex gap-3">
            <span className="text-2xl font-black text-muted-foreground/20 font-mono leading-none">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-2">{obj.text}</p>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-mono">{obj.agents} agents</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_CHIP[obj.category] || ""}`}>{obj.category}</span>
              </div>
              <div className="rounded-lg bg-muted/20 p-3 border border-border/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">{obj.emoji}</span>
                  <span className="text-xs font-semibold">{obj.agent}</span>
                  <span className="text-xs text-muted-foreground">{obj.role}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${BADGE_CHIP[obj.badge]}`}>{obj.badgeEmoji}</span>
                </div>
                <p className="font-mono text-xs text-foreground/70 italic">"{obj.quote}"</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ObjectionsTab;
