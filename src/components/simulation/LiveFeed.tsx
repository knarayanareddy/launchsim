import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FeedItem } from "@/data/simulationMocks";
import { EMERGING_THEMES } from "@/data/simulationMocks";

const BADGE_CHIP: Record<string, string> = {
  skeptic: "bg-destructive/15 text-destructive",
  advocate: "bg-success/15 text-success",
  pragmatist: "bg-warning/15 text-warning",
  analyst: "bg-primary/15 text-primary",
};

interface LiveFeedProps {
  items: FeedItem[];
  progress: number;
}

const LiveFeed = ({ items, progress }: LiveFeedProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibleThemes = Math.min(
    Math.floor((progress / 100) * EMERGING_THEMES.length) + 1,
    EMERGING_THEMES.length
  );

  // Sentiment ratios that shift as agents come in
  const excited = 35 + Math.min(progress * 0.1, 8);
  const skeptical = 28 - Math.min(progress * 0.05, 3);
  const neutral = 22;
  const hostile = 100 - excited - skeptical - neutral;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items.length]);

  return (
    <div className="flex flex-col min-h-0 glass-card rounded-xl p-4 lg:p-5">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Live Debate Feed
      </h2>

      {/* Emerging themes */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {EMERGING_THEMES.slice(0, visibleThemes).map((theme, i) => (
          <motion.span
            key={theme}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[11px] px-2.5 py-1 rounded-full glass-card font-medium text-muted-foreground"
          >
            {theme}
          </motion.span>
        ))}
      </div>

      {/* Feed scroll area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1"
        style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--muted)) transparent", maxHeight: "calc(100vh - 340px)" }}
      >
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-lg border border-border/50 bg-muted/20 p-3 ${item.isReply ? "ml-6 border-l-2 border-l-primary/30" : ""}`}
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-sm">{item.agentEmoji}</span>
                <span className="text-xs font-semibold">{item.agentName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${BADGE_CHIP[item.badge]}`}>
                  {item.badgeEmoji}
                </span>
                {item.isReply && (
                  <span className="text-[10px] text-muted-foreground">
                    → replying to {item.replyTo}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">{item.timestamp}</span>
              </div>
              <p className="font-mono text-xs text-foreground/80 leading-relaxed mb-2">
                {item.text}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>👍 {item.upvotes}</span>
                <span>👎 {item.downvotes}</span>
                {item.replies > 0 && <span>💬 {item.replies}</span>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sentiment meter */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
          <span>Live Sentiment</span>
          <span>{items.length} posts</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden flex bg-muted">
          <div
            className="h-full bg-success transition-all duration-1000"
            style={{ width: `${excited}%` }}
            title={`Excited ${Math.round(excited)}%`}
          />
          <div
            className="h-full bg-warning transition-all duration-1000"
            style={{ width: `${skeptical}%` }}
            title={`Skeptical ${Math.round(skeptical)}%`}
          />
          <div
            className="h-full bg-muted-foreground/30 transition-all duration-1000"
            style={{ width: `${neutral}%` }}
            title={`Neutral ${Math.round(neutral)}%`}
          />
          <div
            className="h-full bg-destructive transition-all duration-1000"
            style={{ width: `${hostile}%` }}
            title={`Hostile ${Math.round(hostile)}%`}
          />
        </div>
        <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1">
          <span>🟢 Excited</span>
          <span>🟡 Skeptical</span>
          <span>⚪ Neutral</span>
          <span>🔴 Hostile</span>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
