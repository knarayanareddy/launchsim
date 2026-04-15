import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, ArrowLeftRight, RotateCcw, Quote, Trophy, ArrowRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, Legend,
} from "recharts";

interface SimOption {
  id: string;
  product_description: string;
  created_at: string;
  overall_score: number;
  sentiment_breakdown: any;
  top_objections: any;
  top_strengths: any;
  sharpened_pitch: string | null;
  key_quote: string | null;
  key_quote_agent: string | null;
  agent_posts: any;
}

const SENTIMENT_COLORS: Record<string, string> = {
  excited: "#2ED573",
  supportive: "#4F8EF7",
  neutral: "#64748B",
  skeptical: "#F5A623",
  hostile: "#FF4757",
};

const Compare = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = profile?.plan_tier || "free";

  const [sims, setSims] = useState<SimOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [simA, setSimA] = useState<string>(searchParams.get("a") || "");
  const [simB, setSimB] = useState<string>(searchParams.get("b") || "");
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("simulations")
      .select("id, product_description, created_at, overall_score, sentiment_breakdown, top_objections, top_strengths, sharpened_pitch, key_quote, key_quote_agent, agent_posts")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSims((data as SimOption[]) || []);
        setLoading(false);
      });
  }, [user]);

  const dataA = useMemo(() => sims.find((s) => s.id === simA), [sims, simA]);
  const dataB = useMemo(() => sims.find((s) => s.id === simB), [sims, simB]);
  const ready = !!dataA && !!dataB;
  const showComparison = comparing && ready;

  // Auto-start comparison if both params present
  useEffect(() => {
    if (simA && simB && sims.length > 0) setComparing(true);
  }, [simA, simB, sims]);

  if (plan === "free") {
    return (
      <DashboardLayout>
        <div className="relative max-w-5xl mx-auto">
          {/* Blurred preview */}
          <div className="blur-sm opacity-40 pointer-events-none select-none">
            <FakeComparisonPreview />
          </div>
          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-8 max-w-md text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Comparison Mode is a Pro feature</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Upgrade to Pro to compare simulations, track your score improvements, and identify which pitch variant resonates most.
              </p>
              <Button onClick={() => navigate("/pricing")} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                Upgrade to Pro →
              </Button>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {!showComparison ? (
          <SelectionView
            sims={sims}
            loading={loading}
            simA={simA}
            simB={simB}
            setSimA={setSimA}
            setSimB={setSimB}
            onCompare={() => setComparing(true)}
            ready={ready}
          />
        ) : (
          <ComparisonDashboard
            a={dataA!}
            b={dataB!}
            onSwitch={() => { setSimA(simB); setSimB(simA); }}
            onReset={() => { setComparing(false); setSimA(""); setSimB(""); }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

/* ─── Selection View ─── */

function SelectionView({
  sims, loading, simA, simB, setSimA, setSimB, onCompare, ready,
}: {
  sims: SimOption[]; loading: boolean;
  simA: string; simB: string;
  setSimA: (v: string) => void; setSimB: (v: string) => void;
  onCompare: () => void; ready: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Choose Two Simulations to Compare</h1>
        <p className="text-sm text-muted-foreground mt-1">See how different pitches perform side by side</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      ) : sims.length < 2 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center">
          <p className="text-lg font-semibold mb-2">Not enough simulations yet</p>
          <p className="text-sm text-muted-foreground mb-4">You need at least 2 simulations to compare.</p>
          <Button onClick={() => window.location.href = "/studio"} className="bg-primary text-primary-foreground">
            Run a Simulation →
          </Button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <SimSelector label="Simulation A" value={simA} onChange={setSimA} sims={sims} excludeId={simB} />
            <SimSelector label="Simulation B" value={simB} onChange={setSimB} sims={sims} excludeId={simA} />
          </div>
          <div className="flex justify-center">
            <Button
              onClick={onCompare}
              disabled={!ready}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-10 text-base h-12"
            >
              Compare →
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
}

function SimSelector({
  label, value, onChange, sims, excludeId,
}: {
  label: string; value: string; onChange: (v: string) => void;
  sims: SimOption[]; excludeId: string;
}) {
  const scoreColor = (s: number) =>
    s >= 70 ? "text-success" : s >= 50 ? "text-warning" : "text-destructive";

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
      >
        <option value="">Select a simulation...</option>
        {sims
          .filter((s) => s.id !== excludeId)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {new Date(s.created_at).toLocaleDateString()} · Score {s.overall_score} · {s.product_description.slice(0, 40)}...
            </option>
          ))}
      </select>
    </div>
  );
}

/* ─── Comparison Dashboard ─── */

function ComparisonDashboard({
  a, b, onSwitch, onReset,
}: {
  a: SimOption; b: SimOption; onSwitch: () => void; onReset: () => void;
}) {
  const winner = a.overall_score >= b.overall_score ? "A" : "B";
  const delta = Math.abs(a.overall_score - b.overall_score);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <HeaderCard label="A" sim={a} />
          <HeaderCard label="B" sim={b} />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onSwitch} className="border-white/10 text-xs gap-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5" /> Switch A/B
          </Button>
          <Button variant="outline" size="sm" onClick={onReset} className="border-white/10 text-xs gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> New Comparison
          </Button>
        </div>
      </div>

      {/* Section 1: Score Comparison */}
      <ScoreSection a={a} b={b} winner={winner} delta={delta} />

      {/* Section 2: Sentiment */}
      <SentimentSection a={a} b={b} />

      {/* Section 3: Objections */}
      <ObjectionSection a={a} b={b} />

      {/* Section 4: Persona Breakdown */}
      <PersonaSection a={a} b={b} />

      {/* Section 5: Pitch Comparison */}
      <PitchSection a={a} b={b} />

      {/* Section 6: Key Quotes */}
      <QuoteSection a={a} b={b} />
    </motion.div>
  );
}

function HeaderCard({ label, sim }: { label: string; sim: SimOption }) {
  const scoreColor = sim.overall_score >= 70 ? "text-success bg-success/10" : sim.overall_score >= 50 ? "text-warning bg-warning/10" : "text-destructive bg-destructive/10";
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{label}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{sim.product_description.slice(0, 50)}</p>
        <p className="text-xs text-muted-foreground">{new Date(sim.created_at).toLocaleDateString()}</p>
      </div>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${scoreColor}`}>{sim.overall_score}</span>
    </div>
  );
}

/* ─── Sections ─── */

function ScoreSection({ a, b, winner, delta }: { a: SimOption; b: SimOption; winner: string; delta: number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-sm font-semibold mb-6 text-muted-foreground uppercase tracking-wider">Score Comparison</h3>
      <div className="grid grid-cols-2 gap-8">
        <ScoreGauge label="A" score={a.overall_score} />
        <ScoreGauge label="B" score={b.overall_score} />
      </div>
      <div className="mt-6 text-center space-y-1">
        <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-2">
          <Trophy className="w-4 h-4 text-warning" />
          Simulation {winner} scores higher
        </p>
        <p className={`text-xs font-mono ${delta > 0 ? "text-success" : "text-muted-foreground"}`}>
          +{delta} points
        </p>
      </div>
    </div>
  );
}

function ScoreGauge({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? "#2ED573" : score >= 50 ? "#F5A623" : "#FF4757";
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
          <motion.circle
            cx="60" cy="60" r="50" stroke={color} strokeWidth="8" fill="none"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{score}</span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-muted-foreground mt-2">Simulation {label}</span>
    </div>
  );
}

function SentimentSection({ a, b }: { a: SimOption; b: SimOption }) {
  const sentA = parseSentiment(a.sentiment_breakdown);
  const sentB = parseSentiment(b.sentiment_breakdown);
  const keys = ["excited", "supportive", "neutral", "skeptical", "hostile"];

  const chartData = keys.map((key) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    A: sentA[key] || 0,
    B: sentB[key] || 0,
  }));

  // Find biggest difference
  let maxDiffKey = keys[0];
  let maxDiff = 0;
  keys.forEach((k) => {
    const diff = Math.abs((sentA[k] || 0) - (sentB[k] || 0));
    if (diff > maxDiff) { maxDiff = diff; maxDiffKey = k; }
  });
  const diffWinner = (sentB[maxDiffKey] || 0) > (sentA[maxDiffKey] || 0) ? "B" : "A";

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-sm font-semibold mb-6 text-muted-foreground uppercase tracking-wider">Sentiment Comparison</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barGap={4}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip
            contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="A" fill="#4F8EF7" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="B" fill="#00D4AA" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
      {maxDiff > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          {diffWinner} has <span className="text-foreground font-semibold">{Math.round(maxDiff)}% more '{maxDiffKey}'</span> responses
        </p>
      )}
    </div>
  );
}

function ObjectionSection({ a, b }: { a: SimOption; b: SimOption }) {
  const objA = parseObjections(a.top_objections);
  const objB = parseObjections(b.top_objections);

  const categoriesA = new Set(objA.map((o) => o.category?.toLowerCase()));
  const categoriesB = new Set(objB.map((o) => o.category?.toLowerCase()));
  const shared = [...categoriesA].filter((c) => categoriesB.has(c));
  const uniqueA = [...categoriesA].filter((c) => !categoriesB.has(c));
  const uniqueB = [...categoriesB].filter((c) => !categoriesA.has(c));

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Objection Comparison</h3>
      <p className="text-xs text-muted-foreground mb-5">
        {shared.length} objections in common · {uniqueA.length} unique to A · {uniqueB.length} unique to B
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-primary mb-2">Simulation A</p>
          {objA.map((o, i) => (
            <ObjectionCard
              key={i}
              objection={o}
              isShared={categoriesB.has(o.category?.toLowerCase())}
            />
          ))}
          {objA.length === 0 && <p className="text-xs text-muted-foreground">No objections</p>}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-accent mb-2">Simulation B</p>
          {objB.map((o, i) => (
            <ObjectionCard
              key={i}
              objection={o}
              isShared={categoriesA.has(o.category?.toLowerCase())}
            />
          ))}
          {objB.length === 0 && <p className="text-xs text-muted-foreground">No objections</p>}
        </div>
      </div>
    </div>
  );
}

function ObjectionCard({ objection, isShared }: { objection: any; isShared: boolean }) {
  return (
    <div className={`p-3 rounded-lg border text-xs ${
      isShared
        ? "bg-warning/5 border-warning/20"
        : "bg-white/[0.02] border-white/10"
    }`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-foreground">{objection.category || "General"}</span>
        {isShared && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-warning/20 text-warning uppercase">Shared</span>
        )}
      </div>
      <p className="text-muted-foreground line-clamp-2">{objection.detail || objection.description || objection.text || ""}</p>
    </div>
  );
}

function PersonaSection({ a, b }: { a: SimOption; b: SimOption }) {
  const postsA = parseAgentPosts(a.agent_posts);
  const postsB = parseAgentPosts(b.agent_posts);

  const archetypesA = groupByArchetype(postsA);
  const archetypesB = groupByArchetype(postsB);

  const allTypes = [...new Set([...Object.keys(archetypesA), ...Object.keys(archetypesB)])];

  const chartData = allTypes.map((type) => ({
    name: type,
    A: archetypesA[type]?.excitedPct || 0,
    B: archetypesB[type]?.excitedPct || 0,
  }));

  if (chartData.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-sm font-semibold mb-6 text-muted-foreground uppercase tracking-wider">Persona Reaction Breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barGap={4}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip
            contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="A" name="Sim A (% Excited)" fill="#4F8EF7" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="B" name="Sim B (% Excited)" fill="#00D4AA" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PitchSection({ a, b }: { a: SimOption; b: SimOption }) {
  const pitchA = a.sharpened_pitch || "No refined pitch available";
  const pitchB = b.sharpened_pitch || "No refined pitch available";

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Pitch Comparison</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <p className="text-xs font-semibold text-primary mb-2">Simulation A — Refined Pitch</p>
          <p className="text-sm text-foreground leading-relaxed font-mono">{pitchA}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
          <p className="text-xs font-semibold text-accent mb-2">Simulation B — Refined Pitch</p>
          <p className="text-sm text-foreground leading-relaxed font-mono">{pitchB}</p>
        </div>
      </div>
    </div>
  );
}

function QuoteSection({ a, b }: { a: SimOption; b: SimOption }) {
  if (!a.key_quote && !b.key_quote) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Key Quotes</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {a.key_quote && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <Quote className="w-4 h-4 text-primary mb-2" />
            <p className="text-sm text-foreground italic font-mono leading-relaxed">"{a.key_quote}"</p>
            {a.key_quote_agent && (
              <p className="text-xs text-muted-foreground mt-2">— {a.key_quote_agent}</p>
            )}
          </div>
        )}
        {b.key_quote && (
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
            <Quote className="w-4 h-4 text-accent mb-2" />
            <p className="text-sm text-foreground italic font-mono leading-relaxed">"{b.key_quote}"</p>
            {b.key_quote_agent && (
              <p className="text-xs text-muted-foreground mt-2">— {b.key_quote_agent}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Blurred preview for free users ─── */

function FakeComparisonPreview() {
  return (
    <div className="space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Comparison Dashboard</h1>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl h-40" />
        <div className="bg-white/5 border border-white/10 rounded-xl h-40" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl h-60" />
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl h-48" />
        <div className="bg-white/5 border border-white/10 rounded-xl h-48" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl h-40" />
    </div>
  );
}

/* ─── Helpers ─── */

function parseSentiment(data: any): Record<string, number> {
  if (!data || typeof data !== "object") return {};
  return data as Record<string, number>;
}

function parseObjections(data: any): any[] {
  if (!data || !Array.isArray(data)) return [];
  return data;
}

function parseAgentPosts(data: any): any[] {
  if (!data || !Array.isArray(data)) return [];
  return data;
}

function groupByArchetype(posts: any[]): Record<string, { excitedPct: number }> {
  const groups: Record<string, { total: number; excited: number }> = {};
  posts.forEach((p) => {
    const arch = p.archetype || p.persona || "Unknown";
    if (!groups[arch]) groups[arch] = { total: 0, excited: 0 };
    groups[arch].total++;
    const sentiment = (p.sentiment || p.reaction || "").toLowerCase();
    if (sentiment.includes("excit") || sentiment.includes("support") || sentiment.includes("positive")) {
      groups[arch].excited++;
    }
  });
  const result: Record<string, { excitedPct: number }> = {};
  Object.entries(groups).forEach(([k, v]) => {
    result[k] = { excitedPct: v.total > 0 ? Math.round((v.excited / v.total) * 100) : 0 };
  });
  return result;
}

export default Compare;
