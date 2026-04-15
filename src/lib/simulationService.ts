import { supabase } from "@/integrations/supabase/client";
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

  // If the simulation was already saved by the edge function, return that
  if (ai?._simulation_id) {
    return { id: ai._simulation_id, share_token: ai._share_token || null };
  }

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
      sentiment_breakdown: (ai?.sentiment_breakdown) as any,
      top_objections: (ai?.top_objections) as any,
      top_strengths: (ai?.top_strengths) as any,
      sharpened_pitch: ai?.sharpened_pitch ?? "",
      key_quote: ai?.key_quote ?? "",
      key_quote_agent: ai?.key_quote_agent ?? "",
      agent_posts: (ai?.agents) as any,
    })
    .select("id, share_token")
    .single();

  if (error) throw error;

  // Save agents
  if (ai?.agents?.length) {
    const agents = ai.agents.map((a: any) => ({
      simulation_id: data.id,
      name: a.name,
      archetype: a.archetype || a.role,
      personality_type: a.personality_type || a.badge,
      reaction_post: a.reaction_post || a.text,
      upvotes: a.upvotes,
      emoji: a.emoji,
    }));
    await supabase.from("agents").insert(agents);
  }

  // Increment simulations_run on profile (only for mock/fallback — live sims are handled by edge function)
  if (user && ai?.usingMockData) {
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
