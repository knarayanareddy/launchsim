import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getSimulationByShareToken } from "@/lib/simulationService";

const WikiReport = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [simulation, setSimulation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getSimulationByShareToken(token)
      .then(setSimulation)
      .catch(() => setError("Simulation not found"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl mb-4 block animate-pulse-glow">🐟</span>
          <p className="text-muted-foreground font-mono text-sm">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !simulation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl mb-4 block">🔍</span>
          <h1 className="text-xl font-bold mb-2">Report Not Found</h1>
          <p className="text-muted-foreground text-sm mb-6">This simulation link may be invalid or expired.</p>
          <Button onClick={() => navigate("/")} className="rounded-full bg-primary text-primary-foreground">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← LaunchSim Home
            </button>
            <Button onClick={() => navigate("/studio")} size="sm" className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
              Run Your Own Simulation
            </Button>
          </div>
          <h1 className="text-2xl font-bold">Shared Simulation Report</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {simulation.crowd_size} agents · Score: {simulation.overall_score}/100
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 pt-6 space-y-6">
        {/* Score */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 text-center">
          <span className="text-5xl font-black font-mono text-warning">{simulation.overall_score}</span>
          <span className="text-muted-foreground text-lg ml-1">/100</span>
          <p className="text-xs text-muted-foreground mt-1">Launch Readiness Score</p>
        </motion.div>

        {/* Pitch */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-3">Product Description</h3>
          <p className="text-sm text-foreground/80 leading-relaxed">{simulation.product_description}</p>
        </div>

        {/* Key Quote */}
        {simulation.key_quote && (
          <div className="glass-card rounded-xl p-6 border border-primary/20">
            <p className="font-mono text-sm italic text-foreground/80 mb-2">"{simulation.key_quote}"</p>
            <p className="text-xs text-muted-foreground">{simulation.key_quote_agent}</p>
          </div>
        )}

        {/* Refined Pitch */}
        {simulation.sharpened_pitch && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">AI-Refined Pitch</h3>
            <p className="text-sm text-foreground leading-relaxed">{simulation.sharpened_pitch}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WikiReport;
