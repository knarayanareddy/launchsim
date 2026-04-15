import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { SimulationSettings } from "@/pages/Studio";

interface SimulationConfigProps {
  settings: SimulationSettings;
  setSettings: React.Dispatch<React.SetStateAction<SimulationSettings>>;
  audienceError?: string;
  clearAudienceError: () => void;
}

const AGENT_COUNTS = [
  { value: 50, label: "⚡ Quick", sublabel: "50 agents" },
  { value: 200, label: "⚖️ Balanced", sublabel: "200 agents" },
  { value: 500, label: "🔬 Thorough", sublabel: "500 agents" },
  { value: 1000, label: "🌊 Full Swarm", sublabel: "1,000 agents" },
];

const AUDIENCES = [
  { id: "pm", emoji: "🧑‍💼", label: "Product Managers" },
  { id: "developers", emoji: "👩‍💻", label: "Developers" },
  { id: "founders", emoji: "🚀", label: "Founders" },
  { id: "vcs", emoji: "💰", label: "VCs/Investors" },
  { id: "skeptics", emoji: "😤", label: "Skeptics" },
  { id: "early-adopters", emoji: "✅", label: "Early Adopters" },
  { id: "enterprise", emoji: "🏢", label: "Enterprise" },
  { id: "consumers", emoji: "👥", label: "Consumers" },
];

const PLATFORMS = [
  { id: "twitter", emoji: "🐦", label: "Twitter-style" },
  { id: "reddit", emoji: "📋", label: "Reddit-style" },
  { id: "both", emoji: "⚡", label: "Both (Parallel)" },
];

const DEPTH_LABELS = ["Quick (2 rounds)", "Standard (5 rounds)", "Deep (10 rounds)"];
const DEPTH_TIMES = ["~20 seconds", "~45 seconds", "~90 seconds"];

interface CustomPersonaChip {
  id: string;
  name: string;
  emoji: string;
}

const SimulationConfig = ({
  settings,
  setSettings,
  audienceError,
  clearAudienceError,
}: SimulationConfigProps) => {
  const { user, profile } = useAuth();
  const [customPersonas, setCustomPersonas] = useState<CustomPersonaChip[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const isUnlimited = profile?.plan_tier === "unlimited" || profile?.plan_tier === "enterprise";

  useEffect(() => {
    if (!user || !isUnlimited) return;
    supabase
      .from("custom_personas")
      .select("id, name, emoji")
      .eq("user_id", user.id)
      .then(({ data }) => setCustomPersonas((data as CustomPersonaChip[]) || []));
  }, [user, isUnlimited]);

  const toggleAudience = (id: string) => {
    setSettings((prev) => {
      const next = prev.audiences.includes(id)
        ? prev.audiences.filter((a) => a !== id)
        : [...prev.audiences, id];
      if (next.length > 0 && audienceError) clearAudienceError();
      return { ...prev, audiences: next };
    });
  };

  return (
    <div className="glass-card rounded-xl p-6 space-y-6 lg:sticky lg:top-24">
      <h2 className="text-lg font-bold">⚙️ Simulation Settings</h2>

      {/* Agent Count */}
      <div>
        <label className="block text-sm font-semibold mb-3">Agent Count</label>
        <div className="grid grid-cols-2 gap-2">
          {AGENT_COUNTS.map((opt) => {
            const selected = settings.agentCount === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSettings((p) => ({ ...p, agentCount: opt.value }))}
                className={`rounded-xl p-3 text-center border transition-all ${
                  selected
                    ? "border-primary bg-primary/10 glow-primary"
                    : "border-border bg-muted/20 hover:border-muted-foreground/30"
                }`}
              >
                <div className={`text-xs font-medium ${selected ? "text-primary" : "text-muted-foreground"}`}>
                  {opt.sublabel}
                </div>
                <div className={`text-sm font-semibold mt-0.5 ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                  {opt.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audience Mix */}
      <div>
        <label className="block text-sm font-semibold mb-3">Who's in the room?</label>
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map((aud) => {
            const selected = settings.audiences.includes(aud.id);
            return (
              <button
                key={aud.id}
                onClick={() => toggleAudience(aud.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all touch-target active:scale-110 ${
                  selected
                    ? "bg-primary/15 border-primary/40 text-foreground scale-105"
                    : "bg-transparent border-border text-muted-foreground hover:border-muted-foreground/40"
                }`}
                style={{ transition: "all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
              >
                {aud.emoji} {aud.label}
              </button>
            );
          })}
        </div>
        {/* Custom personas */}
        {isUnlimited && customPersonas.length > 0 && (
          <>
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-primary/40 text-primary hover:bg-primary/10 transition-all"
            >
              <Plus className="w-3 h-3" /> {showCustom ? "Hide" : "Add"} Custom Personas
            </button>
            {showCustom && (
              <div className="flex flex-wrap gap-2 pt-1">
                {customPersonas.map((cp) => {
                  const selected = settings.audiences.includes(`custom:${cp.id}`);
                  return (
                    <button
                      key={cp.id}
                      onClick={() => toggleAudience(`custom:${cp.id}`)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selected
                          ? "bg-accent/15 border-accent/40 text-foreground scale-105"
                          : "bg-transparent border-border text-muted-foreground hover:border-muted-foreground/40"
                      }`}
                    >
                      {cp.emoji} {cp.name}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
        {audienceError && (
          <p className="text-destructive text-xs mt-2 font-mono">{audienceError}</p>
        )}
      </div>

      {/* Platform */}
      <div>
        <label className="block text-sm font-semibold mb-3">Simulated Environment</label>
        <div className="grid grid-cols-3 gap-2">
          {PLATFORMS.map((plat) => {
            const selected = settings.platform === plat.id;
            return (
              <button
                key={plat.id}
                onClick={() => setSettings((p) => ({ ...p, platform: plat.id }))}
                className={`rounded-xl p-3 text-center border transition-all ${
                  selected
                    ? "border-primary bg-primary/10 glow-primary"
                    : "border-border bg-muted/20 hover:border-muted-foreground/30"
                }`}
              >
                <div className="text-lg mb-1">{plat.emoji}</div>
                <div className={`text-xs font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                  {plat.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Depth slider */}
      <div>
        <label className="block text-sm font-semibold mb-3">Depth</label>
        <div className="space-y-3">
          {/* Custom 3-step slider */}
          <div className="relative h-8 flex items-center">
            <div className="absolute inset-x-0 h-1.5 rounded-full bg-muted" />
            <div
              className="absolute left-0 h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${settings.depth * 50}%` }}
            />
            {[0, 1, 2].map((step) => (
              <button
                key={step}
                onClick={() => setSettings((p) => ({ ...p, depth: step }))}
                className={`absolute w-5 h-5 rounded-full border-2 transition-all z-10 ${
                  settings.depth >= step
                    ? "bg-primary border-primary"
                    : "bg-background border-muted-foreground/30"
                }`}
                style={{ left: `calc(${step * 50}% - 10px)` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {DEPTH_LABELS.map((label, i) => (
              <span
                key={label}
                className={`cursor-pointer transition-colors ${
                  settings.depth === i ? "text-foreground font-medium" : ""
                }`}
                onClick={() => setSettings((p) => ({ ...p, depth: i }))}
              >
                {label}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-mono text-center">
            Est. time: {DEPTH_TIMES[settings.depth]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimulationConfig;
