import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AgentGrid from "@/components/simulation/AgentGrid";
import LiveFeed from "@/components/simulation/LiveFeed";
import CompletionOverlay from "@/components/simulation/CompletionOverlay";
import { MOCK_AGENTS, MOCK_FEED, STATUS_MESSAGES } from "@/data/simulationMocks";
import { useSimulation } from "@/hooks/useSimulation";
import { X } from "lucide-react";

const SIMULATION_DURATION = 15000;
const AGENT_INTERVAL = 650;
const FEED_INTERVAL = 1200;
const STATUS_INTERVAL = 2500;

const Simulation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { description?: string; question?: string; settings?: any } | null;

  const depthLabels = ["quick", "standard", "deep"];
  const { result: aiResult, loading: aiLoading, error: aiError } = useSimulation(
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
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
  const totalRounds = 5;
  const startTimeRef = useRef(Date.now());

  const complete = animationComplete && !aiLoading;
  const finalizing = animationComplete && aiLoading;
  const isLiveMode = aiResult && !aiResult.usingMockData;
  const isDemoMode = aiResult?.usingMockData === true;

  // Use real agents when available, mock for animation
  const displayAgents = aiResult && !aiResult.usingMockData && complete
    ? aiResult.agents.map((a: any, i: number) => ({
        id: i + 1,
        emoji: a.emoji || "👤",
        name: a.name,
        role: a.archetype,
        company: a.company_context || "",
        badge: a.personality_type,
        badgeEmoji: a.personality_type === "skeptic" ? "🔴" : a.personality_type === "advocate" ? "🟢" : a.personality_type === "analyst" ? "🔵" : "🟡",
        reaction: a.reaction_post,
        upvotes: a.upvotes || 0,
      }))
    : MOCK_AGENTS;

  // Use real debate posts for feed when available
  const displayFeed = aiResult && !aiResult.usingMockData && complete && aiResult.debate_posts?.length
    ? aiResult.debate_posts.map((d: any, i: number) => ({
        id: i + 1,
        agentId: i + 1,
        agentName: d.agent_name,
        agentEmoji: aiResult.agents.find((a: any) => a.name === d.agent_name)?.emoji || "💬",
        badge: d.personality_type as any,
        badgeEmoji: d.personality_type === "skeptic" ? "🔴" : d.personality_type === "advocate" ? "🟢" : d.personality_type === "analyst" ? "🔵" : "🟡",
        text: d.post,
        upvotes: d.upvotes || 0,
        downvotes: d.downvotes || 0,
        replies: 0,
        isReply: d.is_reply,
        replyTo: d.reply_to,
        timestamp: `${i * 3}s ago`,
      }))
    : MOCK_FEED;

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

  // When complete + data ready, show all real agents at once
  useEffect(() => {
    if (complete && aiResult && !aiResult.usingMockData) {
      setVisibleAgents(displayAgents.length);
      setVisibleFeed(displayFeed.length);
    }
  }, [complete, aiResult]);

  const handleViewReport = useCallback(() => {
    navigate("/results", {
      state: {
        ...location.state,
        aiResult,
        // Pass the saved simulation ID so Results page doesn't re-save
        savedSimulationId: aiResult?._simulation_id,
        savedShareToken: aiResult?._share_token,
      },
    });
  }, [navigate, location.state, aiResult]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col relative overflow-hidden"
    >
      {/* Mode indicator */}
      <div className="fixed top-3 right-4 z-50">
        {complete && isLiveMode && (
          <div className="flex items-center gap-1.5 bg-success/10 border border-success/30 rounded-full px-3 py-1" title="Responses generated specifically for your product">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-mono text-success">Live AI Mode</span>
          </div>
        )}
        {complete && isDemoMode && !demoBannerDismissed && (
          <div className="flex items-center gap-1.5 bg-warning/10 border border-warning/30 rounded-full px-3 py-1" title="Showing example data — connect AI for personalized results">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-[10px] font-mono text-warning">Demo Mode</span>
          </div>
        )}
      </div>

      {/* Demo mode banner */}
      {isDemoMode && !demoBannerDismissed && complete && (
        <div className="bg-warning/10 border-b border-warning/30 px-4 py-2 flex items-center justify-center gap-3">
          <span className="text-xs text-warning font-mono">⚠️ Running in demo mode — AI generation failed or is unavailable</span>
          <button onClick={() => setDemoBannerDismissed(true)} className="text-warning/60 hover:text-warning">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
          <AgentGrid agents={displayAgents.slice(0, visibleAgents)} />
          <LiveFeed items={displayFeed.slice(0, visibleFeed)} progress={progress} />
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
