import { useState } from "react";
import { TOP_STRENGTHS } from "@/data/resultsMocks";

const CATEGORIES = ["All", "Positioning", "Clarity", "Market", "Design", "Problem-fit", "Demand"];

const BADGE_CHIP: Record<string, string> = {
  skeptic: "bg-destructive/15 text-destructive",
  advocate: "bg-success/15 text-success",
  pragmatist: "bg-warning/15 text-warning",
  analyst: "bg-primary/15 text-primary",
};

const CATEGORY_CHIP: Record<string, string> = {
  Positioning: "bg-primary/15 text-primary",
  Clarity: "bg-success/15 text-success",
  Market: "bg-primary/15 text-primary",
  Design: "bg-secondary/15 text-secondary",
  "Problem-fit": "bg-success/15 text-success",
  Demand: "bg-success/15 text-success",
};

const StrengthsTab = () => {
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All"
    ? TOP_STRENGTHS
    : TOP_STRENGTHS.filter((s) => s.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              filter === cat
                ? "bg-secondary/15 border-secondary/40 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.map((str, i) => (
        <div key={str.id} className="glass-card rounded-xl p-5 border-l-2 border-l-success/40">
          <div className="flex gap-3">
            <span className="text-2xl font-black text-muted-foreground/20 font-mono leading-none">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-2">{str.text}</p>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-mono">{str.agents} agents</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_CHIP[str.category] || ""}`}>{str.category} ✅</span>
              </div>
              <div className="rounded-lg bg-muted/20 p-3 border border-border/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">{str.emoji}</span>
                  <span className="text-xs font-semibold">{str.agent}</span>
                  <span className="text-xs text-muted-foreground">{str.role}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${BADGE_CHIP[str.badge]}`}>{str.badgeEmoji}</span>
                </div>
                <p className="font-mono text-xs text-foreground/70 italic">"{str.quote}"</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StrengthsTab;
