import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  sentiment_breakdown: any[];
  agents: any[];
  top_objections: any[];
  top_strengths: any[];
  key_quote: string;
  key_quote_agent: string;
  sharpened_pitch: string;
  pitch_changes_made: string;
  recommended_actions: string[];
  usingMockData?: boolean;
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
        if (data?.error) throw new Error(data.error);

        setResult({ ...data, usingMockData: false });
      } catch (err) {
        console.error("Simulation API error, falling back to mock:", err);
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
