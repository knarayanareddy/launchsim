import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AgentGrid from "@/components/simulation/AgentGrid";
import LiveFeed from "@/components/simulation/LiveFeed";
import CompletionOverlay from "@/components/simulation/CompletionOverlay";
import { MOCK_AGENTS, MOCK_FEED, STATUS_MESSAGES } from "@/data/simulationMocks";
import { useSimulation } from "@/hooks/useSimulation";

const SIMULATION_DURATION = 15000;
const AGENT_INTERVAL = 650;
const FEED_INTERVAL = 1200;
const STATUS_INTERVAL = 2500;

const Simulation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { description?: string; question?: string; settings?: any } | null;

  const depthLabels = ["quick", "standard", "deep"];
  const { result: aiResult, loading: aiLoading } = useSimulation(
    state?.description
      ? {
          description: state.description,
          question: state.question,
          crowdSize: state.settings?.agentCount,
          audienceMix: state.settings?.audiences,
          platform: state.settings?.platform,
          depth: depthLabels[state.settings?.depth ?? 1],
        }
      : null
  );

  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [visibleAgents, setVisibleAgents] = useState(0);
  const [visibleFeed, setVisibleFeed] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = 5;
  const startTimeRef = useRef(Date.now());

  const complete = animationComplete && !aiLoading;
  const finalizing = animationComplete && aiLoading;

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / SIMULATION_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(interval); setAnimationComplete(true); }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (animationComplete) return;
    const interval = setInterval(() => {
      setVisibleAgents((prev) => {
        if (prev >= MOCK_AGENTS.length) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, AGENT_INTERVAL);
    return () => clearInterval(interval);
  }, [animationComplete]);

  useEffect(() => {
    if (animationComplete) return;
    const interval = setInterval(() => {
      setVisibleFeed((prev) => {
        if (prev >= MOCK_FEED.length) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, FEED_INTERVAL);
    return () => clearInterval(interval);
  }, [animationComplete]);

  useEffect(() => {
    if (animationComplete) return;
    const interval = setInterval(() => {
      setStatusIdx((prev) => {
        const next = Math.min(prev + 1, STATUS_MESSAGES.length - 1);
        setCurrentRound(Math.min(Math.floor(next * (totalRounds / STATUS_MESSAGES.length)) + 1, totalRounds));
        return next;
      });
    }, STATUS_INTERVAL);
    return () => clearInterval(interval);
  }, [animationComplete]);

  const handleViewReport = useCallback(() => {
    navigate("/results", { state: { ...location.state, aiResult } });
  }, [navigate, location.state, aiResult]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col relative overflow-hidden"
    >
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <div className="h-full bg-primary transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>

      {/* Status header */}
      <div className="pt-6 pb-4 px-4 md:px-6 border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-sm">🐟</span>
            </div>
            <div className="min-w-0">
              <AnimatePresence mode="wait">
                <motion.p
                  key={finalizing ? "finalizing" : statusIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs md:text-sm font-mono text-foreground truncate"
                >
                  {complete ? "✅ Report ready!" : finalizing ? "⏳ Finalizing analysis..." : STATUS_MESSAGES[statusIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2 md:gap-4">
            <span className="text-[10px] md:text-xs font-mono text-muted-foreground">
              Round {complete ? totalRounds : currentRound}/{totalRounds}
            </span>
            <span className="text-xs font-mono text-primary font-bold">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main theater */}
      <div className="flex-1 container mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="grid lg:grid-cols-[3fr_2fr] gap-4 md:gap-6 h-full">
          <AgentGrid agents={MOCK_AGENTS.slice(0, visibleAgents)} />
          <LiveFeed items={MOCK_FEED.slice(0, visibleFeed)} progress={progress} />
        </div>
      </div>

      <AnimatePresence>
        {complete && (
          <CompletionOverlay
            onViewReport={handleViewReport}
            score={aiResult?.overall_score}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Simulation;
