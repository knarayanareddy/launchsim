import { useState } from "react";
import { AGENT_FEED_DATA } from "@/data/resultsMocks";

const FILTERS = ["All", "Skeptics", "Advocates", "Pragmatists", "Analysts"];
const FILTER_MAP: Record<string, string> = {
  Skeptics: "skeptic",
  Advocates: "advocate",
  Pragmatists: "pragmatist",
  Analysts: "analyst",
};

const BADGE_CHIP: Record<string, string> = {
  skeptic: "bg-destructive/15 text-destructive",
  advocate: "bg-success/15 text-success",
  pragmatist: "bg-warning/15 text-warning",
  analyst: "bg-primary/15 text-primary",
};

const BADGE_EMOJI: Record<string, string> = {
  skeptic: "🔴",
  advocate: "🟢",
  pragmatist: "🟡",
  analyst: "🔵",
};

interface AgentFeedTabProps {
  data?: any[];
}

const AgentFeedTab = ({ data }: AgentFeedTabProps) => {
  const [filter, setFilter] = useState("All");

  const agents = (data || AGENT_FEED_DATA).map((a: any, i: number) => ({
    id: a.id || i + 1,
    emoji: a.emoji || "🤖",
    name: a.name,
    role: a.role || a.archetype || "",
    badge: a.badge || a.personality_type || "pragmatist",
    badgeEmoji: a.badgeEmoji || BADGE_EMOJI[a.badge || a.personality_type] || "🟡",
    text: a.text || a.reaction_post || "",
    upvotes: a.upvotes || 0,
    downvotes: a.downvotes || 0,
    replies: a.replies || 0,
    isReply: a.isReply || false,
    replyTo: a.replyTo || null,
  }));

  const filtered = filter === "All"
    ? agents
    : agents.filter((a: any) => a.badge === FILTER_MAP[filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              filter === f
                ? "bg-primary/15 border-primary/40 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.map((post: any) => (
        <div
          key={post.id}
          className={`glass-card rounded-xl p-4 ${post.isReply ? "ml-8 border-l-2 border-l-primary/30" : ""}`}
        >
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-lg">{post.emoji}</span>
            <span className="text-sm font-semibold">{post.name}</span>
            <span className="text-xs text-muted-foreground">{post.role}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${BADGE_CHIP[post.badge]}`}>
              {post.badgeEmoji}
            </span>
            {post.isReply && post.replyTo && (
              <span className="text-[10px] text-muted-foreground">→ replying to {post.replyTo}</span>
            )}
          </div>
          <p className="font-mono text-sm text-foreground/80 leading-relaxed mb-3">{post.text}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>👍 {post.upvotes}</span>
            {post.downvotes > 0 && <span>👎 {post.downvotes}</span>}
            {post.replies > 0 && <span>💬 {post.replies} replies</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentFeedTab;
