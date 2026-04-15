import { supabase } from "@/integrations/supabase/client";
import {
  SENTIMENT_BY_AUDIENCE,
  TOP_OBJECTIONS,
  TOP_STRENGTHS,
  AGENT_FEED_DATA,
  REFINED_PITCH,
} from "@/data/resultsMocks";

export interface SaveSimulationParams {
  description: string;
  question?: string;
  crowdSize?: number;
  audienceMix?: string[];
  platform?: string;
  depth?: string;
}

export async function saveSimulation(params: SaveSimulationParams) {
  const { data, error } = await supabase
    .from("simulations")
    .insert({
      product_description: params.description,
      simulation_question: params.question || null,
      crowd_size: params.crowdSize || 200,
      audience_mix: params.audienceMix || ["pm", "founders", "skeptics", "early-adopters"],
      platform: params.platform || "both",
      depth: params.depth || "standard",
      overall_score: 71,
      sentiment_breakdown: SENTIMENT_BY_AUDIENCE as any,
      top_objections: TOP_OBJECTIONS as any,
      top_strengths: TOP_STRENGTHS as any,
      sharpened_pitch: REFINED_PITCH,
      key_quote: "Positioning is clean. The 'before you ship' framing is smart — it's selling insurance not software.",
      key_quote_agent: "Casey P. — Indie Founder — 🟢 Advocate",
      agent_posts: AGENT_FEED_DATA as any,
    })
    .select("id, share_token")
    .single();

  if (error) throw error;

  // Also save agents
  const agents = AGENT_FEED_DATA.map((a) => ({
    simulation_id: data.id,
    name: a.name,
    archetype: a.role,
    personality_type: a.badge,
    reaction_post: a.text,
    upvotes: a.upvotes,
    emoji: a.emoji,
  }));

  await supabase.from("agents").insert(agents);

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
