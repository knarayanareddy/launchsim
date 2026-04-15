import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { handleApiError } from "@/lib/apiErrors";
import {
  SENTIMENT_BY_AUDIENCE,
  TOP_OBJECTIONS,
  TOP_STRENGTHS,
  AGENT_FEED_DATA,
  REFINED_PITCH,
  REFINED_CHANGES,
  RECOMMENDED_ACTIONS,
} from "@/data/resultsMocks";

export interface SimulationResult {
  overall_score: number;
  score_rationale?: string;
  sentiment_breakdown: any[];
  agents: any[];
  top_objections: any[];
  top_strengths: any[];
  key_quote: string;
  key_quote_agent: string;
  key_quote_upvotes?: number;
  sharpened_pitch: string;
  pitch_changes_made: string;
  recommended_actions: string[];
  emerging_themes?: string[];
  persona_breakdown?: Record<string, number>;
  debate_posts?: any[];
  usingMockData?: boolean;
  _simulation_id?: string;
  _share_token?: string;
}

interface UseSimulationParams {
  description: string;
  question?: string;
  crowdSize?: number;
  audienceMix?: string[];
  platform?: string;
  depth?: string;
}

function buildMockResult(): SimulationResult {
  return {
    overall_score: 71,
    score_rationale: "This is demo data — run a real simulation to get AI-generated results specific to your product.",
    sentiment_breakdown: SENTIMENT_BY_AUDIENCE,
    agents: AGENT_FEED_DATA.map((a) => ({
      name: a.name,
      archetype: a.role,
      company_context: "",
      personality_type: a.badge,
      emoji: a.emoji,
      reaction_post: a.text,
      upvotes: a.upvotes,
    })),
    top_objections: TOP_OBJECTIONS.map((o) => ({
      text: o.text,
      agent_count: o.agents,
      category: o.category,
      quote: o.quote,
      agent: o.agent,
      role: o.role,
      badge: o.badge,
      emoji: o.emoji,
    })),
    top_strengths: TOP_STRENGTHS.map((s) => ({
      text: s.text,
      agent_count: s.agents,
      category: s.category,
      quote: s.quote,
      agent: s.agent,
      role: s.role,
      badge: s.badge,
      emoji: s.emoji,
    })),
    key_quote: "Positioning is clean. The 'before you ship' framing is smart — it's selling insurance not software.",
    key_quote_agent: "Casey P. — Indie Founder — 🟢 Advocate",
    sharpened_pitch: REFINED_PITCH,
    pitch_changes_made: REFINED_CHANGES,
    recommended_actions: RECOMMENDED_ACTIONS.map((a) => `${a.emoji} ${a.text}`),
    emerging_themes: ["💰 Pricing clarity", "🔗 Integrations", "🎯 ICP focus", "📈 Proof needed", "✅ Strong positioning"],
    debate_posts: [],
    usingMockData: true,
  };
}

export function useSimulation(params: UseSimulationParams | null) {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!params || calledRef.current) return;
    calledRef.current = true;

    const run = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("run-simulation", {
          body: {
            productDescription: params.description,
            simulationQuestion: params.question || "",
            crowdSize: params.crowdSize || 200,
            audienceMix: params.audienceMix || ["founders", "pms"],
            platform: params.platform || "both",
            depth: params.depth || "standard",
          },
        });

        if (fnError) throw new Error(fnError.message);
        if (data?.error || data?.fallback) throw new Error(data?.error || "Simulation failed");

        // Normalize the AI response
        const normalized: SimulationResult = {
          overall_score: data.overall_score ?? 50,
          score_rationale: data.score_rationale,
          sentiment_breakdown: data.sentiment_breakdown || [],
          agents: (data.agents || []).map((a: any) => ({
            ...a,
            // Ensure consistent field names
            reaction_post: a.reaction_post || a.text,
            archetype: a.archetype || a.role,
          })),
          top_objections: data.top_objections || [],
          top_strengths: data.top_strengths || [],
          key_quote: data.key_quote || "",
          key_quote_agent: data.key_quote_agent || "",
          key_quote_upvotes: data.key_quote_upvotes,
          sharpened_pitch: data.sharpened_pitch || "",
          pitch_changes_made: data.pitch_changes_made || "",
          recommended_actions: data.recommended_actions || [],
          emerging_themes: data.emerging_themes || [],
          persona_breakdown: data.persona_breakdown,
          debate_posts: data.debate_posts || [],
          usingMockData: false,
          _simulation_id: data._simulation_id,
          _share_token: data._share_token,
        };

        setResult(normalized);
      } catch (err) {
        console.error("Simulation API error, falling back to mock:", err);
        handleApiError(err, { fallbackMessage: "Simulation failed — showing demo results instead." });
        setError(err instanceof Error ? err.message : "Unknown error");
        setResult(buildMockResult());
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [params]);

  return { result, loading, error };
}
