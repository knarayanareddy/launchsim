import { supabase } from "@/integrations/supabase/client";
import {
  SENTIMENT_BY_AUDIENCE,
  TOP_OBJECTIONS,
  TOP_STRENGTHS,
  AGENT_FEED_DATA,
  REFINED_PITCH,
} from "@/data/resultsMocks";
import type { SimulationResult } from "@/hooks/useSimulation";

export interface SaveSimulationParams {
  description: string;
  question?: string;
  crowdSize?: number;
  audienceMix?: string[];
  platform?: string;
  depth?: string;
  aiResult?: SimulationResult;
}

export async function saveSimulation(params: SaveSimulationParams) {
  const ai = params.aiResult;

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("simulations")
    .insert({
      user_id: user?.id || null,
      product_description: params.description,
      simulation_question: params.question || null,
      crowd_size: params.crowdSize || 200,
      audience_mix: params.audienceMix || ["pm", "founders", "skeptics", "early-adopters"],
      platform: params.platform || "both",
      depth: params.depth || "standard",
      overall_score: ai?.overall_score ?? 71,
      sentiment_breakdown: (ai?.sentiment_breakdown ?? SENTIMENT_BY_AUDIENCE) as any,
      top_objections: (ai?.top_objections ?? TOP_OBJECTIONS) as any,
      top_strengths: (ai?.top_strengths ?? TOP_STRENGTHS) as any,
      sharpened_pitch: ai?.sharpened_pitch ?? REFINED_PITCH,
      key_quote: ai?.key_quote ?? "Positioning is clean. The 'before you ship' framing is smart — it's selling insurance not software.",
      key_quote_agent: ai?.key_quote_agent ?? "Casey P. — Indie Founder — 🟢 Advocate",
      agent_posts: (ai?.agents ?? AGENT_FEED_DATA) as any,
    })
    .select("id, share_token")
    .single();

  if (error) throw error;

  // Save agents
  const agentData = ai?.agents ?? AGENT_FEED_DATA;
  const agents = agentData.map((a: any) => ({
    simulation_id: data.id,
    name: a.name,
    archetype: a.archetype || a.role,
    personality_type: a.personality_type || a.badge,
    reaction_post: a.reaction_post || a.text,
    upvotes: a.upvotes,
    emoji: a.emoji,
  }));

  await supabase.from("agents").insert(agents);

  // Increment simulations_run on profile
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("simulations_run, credits_remaining").eq("id", user.id).single();
    if (profile) {
      await supabase.from("profiles").update({
        simulations_run: (profile.simulations_run || 0) + 1,
        credits_remaining: Math.max(0, (profile.credits_remaining || 0) - 1),
      }).eq("id", user.id);
    }
  }

  return data;
}

export async function getSimulationByShareToken(token: string) {
  const { data, error } = await supabase
    .from("simulations")
    .select("*")
    .eq("share_token", token)
    .single();

  if (error) throw error;
  return data;
}
