import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { MOCK_WIKI_SIMULATIONS } from "@/data/wikiMocks";

const SCORE_FILTERS = [
  { label: "All", min: 0, max: 100 },
  { label: "Low (<50)", min: 0, max: 49 },
  { label: "Fair (50-70)", min: 50, max: 70 },
  { label: "Good (70-85)", min: 70, max: 85 },
  { label: "Excellent (85+)", min: 85, max: 100 },
];

const AUDIENCE_FILTERS = ["All", "Founders", "PMs", "Developers", "Enterprise"];
const AUDIENCE_MAP: Record<string, string> = {
  Founders: "founders",
  PMs: "pm",
  Developers: "developers",
  Enterprise: "enterprise",
};

const SORTS = ["Newest", "Highest Score", "Most Objections"];

const AUDIENCE_CHIPS: Record<string, { label: string; className: string }> = {
  founders: { label: "🚀 Founders", className: "bg-success/15 text-success" },
  pm: { label: "🧑‍💼 PMs", className: "bg-warning/15 text-warning" },
  developers: { label: "👩‍💻 Devs", className: "bg-primary/15 text-primary" },
  enterprise: { label: "🏢 Enterprise", className: "bg-secondary/15 text-secondary" },
  vcs: { label: "💰 VCs", className: "bg-warning/15 text-warning" },
  skeptics: { label: "😤 Skeptics", className: "bg-destructive/15 text-destructive" },
  "early-adopters": { label: "✅ Early Adopters", className: "bg-success/15 text-success" },
  consumers: { label: "👥 Consumers", className: "bg-muted text-muted-foreground" },
};

function scoreColor(score: number) {
  if (score >= 85) return "bg-success text-success-foreground";
  if (score >= 70) return "bg-primary text-primary-foreground";
  if (score >= 50) return "bg-warning text-warning-foreground";
  return "bg-destructive text-destructive-foreground";
}

function scoreGlow(score: number) {
  if (score >= 85) return "0 0 20px rgba(46,213,115,0.2)";
  if (score >= 70) return "0 0 20px rgba(79,142,247,0.2)";
  if (score >= 50) return "0 0 20px rgba(245,166,35,0.15)";
  return "0 0 20px rgba(255,71,87,0.15)";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

const Wiki = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState(0);
  const [audienceFilter, setAudienceFilter] = useState("All");
  const [sort, setSort] = useState("Newest");

  const filtered = useMemo(() => {
    let list = [...MOCK_WIKI_SIMULATIONS];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.topObjection.toLowerCase().includes(q) ||
          s.topStrength.toLowerCase().includes(q)
      );
    }

    // Score
    const sf = SCORE_FILTERS[scoreFilter];
    list = list.filter((s) => s.score >= sf.min && s.score <= sf.max);

    // Audience
    if (audienceFilter !== "All") {
      const key = AUDIENCE_MAP[audienceFilter];
      list = list.filter((s) => s.audienceMix.includes(key));
    }

    // Sort
    if (sort === "Highest Score") list.sort((a, b) => b.score - a.score);
    else if (sort === "Most Objections") list.sort((a, b) => b.objectionCount - a.objectionCount);
    else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list;
  }, [search, scoreFilter, audienceFilter, sort]);

  return (
    <div className="min-h-screen">
      <SEO
        title="Simulation Wiki — Market Intelligence Archive"
        description="Browse past LaunchSim simulations to see how the market reacted to real product pitches."
        path="/wiki"
      />
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">📚 Simulation Wiki</h1>
          <p className="text-muted-foreground">A living library of what the market thinks</p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search simulations..."
            className="bg-muted/30 border-border text-sm mb-4 placeholder:text-muted-foreground/40 focus-visible:ring-primary"
          />
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          {/* Score */}
          <div className="flex flex-wrap gap-1.5">
            {SCORE_FILTERS.map((sf, i) => (
              <button
                key={sf.label}
                onClick={() => setScoreFilter(i)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  scoreFilter === i
                    ? "bg-primary/15 border-primary/40 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>

          {/* Audience */}
          <div className="flex flex-wrap gap-1.5">
            {AUDIENCE_FILTERS.map((af) => (
              <button
                key={af}
                onClick={() => setAudienceFilter(af)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  audienceFilter === af
                    ? "bg-secondary/15 border-secondary/40 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {af}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex flex-wrap gap-1.5 md:ml-auto">
            {SORTS.map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  sort === s
                    ? "bg-muted border-muted-foreground/30 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((sim, i) => (
              <motion.div
                key={sim.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate(`/wiki/${sim.shareToken}`)}
                className="glass-card rounded-xl p-5 cursor-pointer hover:border-primary/25 transition-all group relative"
              >
                {/* Score badge */}
                <div
                  className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black font-mono ${scoreColor(sim.score)}`}
                  style={{ boxShadow: scoreGlow(sim.score) }}
                >
                  {sim.score}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-sm pr-12 mb-1 group-hover:text-primary transition-colors">
                  {sim.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">{timeAgo(sim.createdAt)}</p>

                {/* Audience chips */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {sim.audienceMix.map((a) => {
                    const chip = AUDIENCE_CHIPS[a];
                    return chip ? (
                      <span key={a} className={`text-[10px] px-2 py-0.5 rounded-full ${chip.className}`}>
                        {chip.label}
                      </span>
                    ) : null;
                  })}
                </div>

                {/* Objection */}
                <p className="text-xs text-muted-foreground italic mb-1 line-clamp-1">
                  🔴 {sim.topObjection}
                </p>
                {/* Strength */}
                <p className="text-xs text-success/80 italic mb-3 line-clamp-1">
                  🟢 {sim.topStrength}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {sim.agentCount} agents · {sim.objectionCount} objections
                  </span>
                  <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View Report →
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="glass-card rounded-xl p-8 text-center max-w-sm">
              <span className="text-4xl mb-4 block">🔍</span>
              <h3 className="font-semibold mb-2">No simulations match your search</h3>
              <p className="text-sm text-muted-foreground mb-4">Try different filters or run a new simulation</p>
              <Button
                onClick={() => navigate("/studio")}
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
              >
                Run a new simulation →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wiki;
