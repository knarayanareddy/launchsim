import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";
import { SENTIMENT_BY_AUDIENCE, TOP_OBJECTIONS, TOP_STRENGTHS } from "@/data/resultsMocks";
import { useNavigate } from "react-router-dom";
import { RECOMMENDED_ACTIONS } from "@/data/resultsMocks";
import { Button } from "@/components/ui/button";

const COLORS = { excited: "#2ED573", skeptical: "#F5A623", neutral: "#64748B", hostile: "#FF4757" };

const gaugeData = [
  { name: "score", value: 71 },
  { name: "remaining", value: 29 },
];

const CATEGORY_CHIP: Record<string, string> = {
  Positioning: "bg-primary/15 text-primary",
  Trust: "bg-warning/15 text-warning",
  Pricing: "bg-destructive/15 text-destructive",
  Technical: "bg-secondary/15 text-secondary",
  Clarity: "bg-success/15 text-success",
  Market: "bg-primary/15 text-primary",
  Design: "bg-secondary/15 text-secondary",
  "Problem-fit": "bg-success/15 text-success",
  Demand: "bg-success/15 text-success",
};

const OverviewTab = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Launch Readiness Gauge */}
        <div className="glass-card rounded-xl p-5 flex flex-col items-center justify-center" style={{ boxShadow: "0 0 30px rgba(245,166,35,0.08)" }}>
          <span className="text-xs text-muted-foreground mb-2">🎯 Launch Readiness</span>
          <div className="relative w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={44}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={0}
                  stroke="none"
                >
                  <Cell fill="#F5A623" />
                  <Cell fill="rgba(255,255,255,0.06)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black font-mono text-warning">71</span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1">out of 100</span>
        </div>

        {/* Excited */}
        <div className="glass-card rounded-xl p-5 flex flex-col items-center justify-center" style={{ boxShadow: "0 0 30px rgba(46,213,115,0.06)" }}>
          <span className="text-xs text-muted-foreground mb-2">💚 Excited</span>
          <span className="text-3xl font-black font-mono text-success">34%</span>
        </div>

        {/* Skeptical */}
        <div className="glass-card rounded-xl p-5 flex flex-col items-center justify-center" style={{ boxShadow: "0 0 30px rgba(245,166,35,0.06)" }}>
          <span className="text-xs text-muted-foreground mb-2">🟡 Skeptical</span>
          <span className="text-3xl font-black font-mono text-warning">41%</span>
        </div>

        {/* Hostile + Neutral */}
        <div className="glass-card rounded-xl p-5 flex flex-col items-center justify-center" style={{ boxShadow: "0 0 30px rgba(255,71,87,0.06)" }}>
          <span className="text-xs text-muted-foreground mb-2">🔴 Hostile</span>
          <span className="text-3xl font-black font-mono text-destructive">12%</span>
          <span className="text-xs text-muted-foreground mt-1">🩶 Neutral 13%</span>
        </div>
      </div>

      {/* Sentiment Breakdown */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-4">Sentiment Distribution</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={SENTIMENT_BY_AUDIENCE} layout="vertical" barCategoryGap="20%">
            <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="audience" tick={{ fill: "#E2E8F0", fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(222,40%,10%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "11px", color: "#E2E8F0" }}
              formatter={(value: number, name: string) => [`${value}%`, name]}
            />
            <Bar dataKey="excited" stackId="a" fill={COLORS.excited} radius={[0, 0, 0, 0]} />
            <Bar dataKey="skeptical" stackId="a" fill={COLORS.skeptical} />
            <Bar dataKey="neutral" stackId="a" fill={COLORS.neutral} />
            <Bar dataKey="hostile" stackId="a" fill={COLORS.hostile} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground justify-center">
          {Object.entries(COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
              <span className="capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Objections + Strengths columns */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Objections */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Objections</h3>
          {TOP_OBJECTIONS.slice(0, 5).map((obj, i) => (
            <div key={obj.id} className="glass-card rounded-xl p-4 border-l-2 border-l-destructive/40">
              <div className="flex gap-3">
                <span className="text-2xl font-black text-muted-foreground/30 font-mono leading-none">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-2">{obj.text}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-mono">{obj.agents} agents</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_CHIP[obj.category] || "bg-muted text-muted-foreground"}`}>{obj.category}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Strengths */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Strengths</h3>
          {TOP_STRENGTHS.slice(0, 5).map((str, i) => (
            <div key={str.id} className="glass-card rounded-xl p-4 border-l-2 border-l-success/40">
              <div className="flex gap-3">
                <span className="text-2xl font-black text-muted-foreground/30 font-mono leading-none">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-2">{str.text}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-mono">{str.agents} agents</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_CHIP[str.category] || "bg-muted text-muted-foreground"}`}>{str.category} ✅</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Quote */}
      <div className="glass-card rounded-xl p-6 border border-primary/20" style={{ boxShadow: "0 0 40px rgba(79,142,247,0.06)" }}>
        <p className="text-xs text-muted-foreground mb-3">💬 Most Upvoted Agent Reaction (67 upvotes)</p>
        <blockquote className="font-mono text-lg italic text-foreground/90 leading-relaxed mb-3">
          "Positioning is clean. The 'before you ship' framing is smart — it's selling insurance not software."
        </blockquote>
        <p className="text-sm text-muted-foreground">Casey P. — Indie Founder — 🟢 Advocate</p>
      </div>

      {/* Recommended Actions */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-4">What's next?</h3>
        <div className="space-y-3 mb-6">
          {RECOMMENDED_ACTIONS.map((action, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
              <span className="text-lg flex-shrink-0">{action.emoji}</span>
              <p className="text-sm text-foreground/90">{action.text}</p>
            </div>
          ))}
        </div>
        <Button
          onClick={() => navigate("/studio")}
          className="w-full rounded-xl py-5 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
        >
          Run Another Simulation with these fixes →
        </Button>
      </div>
    </div>
  );
};

export default OverviewTab;
