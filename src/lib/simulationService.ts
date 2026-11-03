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
  /** Group this run belongs to, for iteration tracking. */
  groupId?: string | null;
  /** Name for a brand-new iteration group. */
  newGroupName?: string | null;
}

export interface SaveSimulationResult {
  id: string;
  share_token: string | null;
  /** False when the result was demo data and therefore not persisted. */
  persisted: boolean;
}

/**
 * Persist a simulation.
 *
 * Two important behaviours:
 *  - Demo/mock results are never written to the database. Previously a failed AI
 *    call produced a mock report that was saved with the same shape as real
 *    data, so dashboards, comparisons and the public wiki mixed fabricated
 *    reports in with genuine ones.
 *  - No share token is minted here. Sharing is an explicit action
 *    (`shareSimulation`), because the old auto-generated token on every row is
 *    what made every user's pitch world-readable.
 */
export async function saveSimulation(params: SaveSimulationParams): Promise<SaveSimulationResult> {
  const ai = params.aiResult;

  // Already persisted by the edge function: skip the insert, but still honour
  // iteration grouping (the group linkage is client-driven either way).
  if (ai?._simulation_id) {
    if (params.groupId || params.newGroupName) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          await attachToGroup(user.id, ai._simulation_id, ai.overall_score ?? 0, params);
        } catch (groupError) {
          console.error("Failed to update simulation group:", groupError);
        }
      }
    }
    return { id: ai._simulation_id, share_token: ai._share_token ?? null, persisted: true };
  }

  if (!ai || ai.usingMockData) {
    return { id: "", share_token: null, persisted: false };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("simulations")
    .insert({
      user_id: user.id,
      product_description: params.description,
      simulation_question: params.question || null,
      crowd_size: params.crowdSize || 200,
      audience_mix: params.audienceMix || ["pm", "founders", "skeptics", "early-adopters"],
      platform: params.platform || "both",
      depth: params.depth || "standard",
      overall_score: ai.overall_score ?? 0,
      sentiment_breakdown: (ai.sentiment_breakdown ?? null) as never,
      top_objections: (ai.top_objections ?? null) as never,
      top_strengths: (ai.top_strengths ?? null) as never,
      sharpened_pitch: ai.sharpened_pitch ?? "",
      key_quote: ai.key_quote ?? "",
      key_quote_agent: ai.key_quote_agent ?? "",
      agent_posts: (ai.agents ?? null) as never,
      group_id: params.groupId ?? null,
    })
    .select("id, share_token")
    .single();

  if (error) throw error;

  if (ai.agents?.length) {
    const agents = ai.agents.slice(0, 40).map((a: any) => ({
      simulation_id: data.id,
      name: String(a.name ?? "Agent").slice(0, 120),
      archetype: String(a.archetype || a.role || "Unknown").slice(0, 120),
      personality_type: String(a.personality_type || a.badge || "pragmatist").slice(0, 40),
      reaction_post: String(a.reaction_post || a.text || "").slice(0, 4000),
      upvotes: Number.isFinite(a.upvotes) ? a.upvotes : 0,
      emoji: String(a.emoji ?? "👤").slice(0, 8),
    }));
    const { error: agentsError } = await supabase.from("agents").insert(agents);
    if (agentsError) console.error("Failed to save agents:", agentsError);
  }

  // Iteration tracking: attach this run to its group and refresh the group's
  // score rollup. Nothing wrote to simulation_groups before, which made the
  // Tracker and Compare features permanently empty.
  try {
    await attachToGroup(user.id, data.id, ai.overall_score ?? 0, params);
  } catch (groupError) {
    console.error("Failed to update simulation group:", groupError);
  }

  return { id: data.id, share_token: data.share_token, persisted: true };
}

async function attachToGroup(
  userId: string,
  simulationId: string,
  score: number,
  params: SaveSimulationParams,
) {
  let groupId = params.groupId ?? null;

  // Create a new group on demand.
  if (!groupId && params.newGroupName?.trim()) {
    const { data: created, error } = await supabase
      .from("simulation_groups")
      .insert({
        user_id: userId,
        product_name: params.newGroupName.trim().slice(0, 120),
        simulation_ids: [],
      })
      .select("id")
      .single();
    if (error) throw error;
    groupId = created.id;
  }

  if (!groupId) return;

  const { data: group } = await supabase
    .from("simulation_groups")
    .select("simulation_ids, latest_score")
    .eq("id", groupId)
    .maybeSingle();

  if (!group) return;

  const ids = Array.from(new Set([...(group.simulation_ids || []), simulationId]));

  await supabase
    .from("simulation_groups")
    .update({
      simulation_ids: ids,
      score_delta: score - (group.latest_score || 0),
      latest_score: score,
    })
    .eq("id", groupId);

  await supabase.from("simulations").update({ group_id: groupId }).eq("id", simulationId);
}

/**
 * Mint (or reuse) a public share token for one of the caller's simulations.
 * Enforced server-side by `share_simulation`, which checks ownership.
 */
export async function shareSimulation(simulationId: string): Promise<string> {
  const { data, error } = await supabase.rpc("share_simulation", { _simulation_id: simulationId });
  if (error) throw error;
  if (!data) throw new Error("Could not create a share link for this report");
  return data as string;
}

/**
 * Load a publicly shared report by token.
 *
 * Uses a token-scoped SECURITY DEFINER RPC rather than a table read: the old
 * `share_token IS NOT NULL` SELECT policy exposed every simulation to anyone
 * with the public anon key.
 */
export async function getSimulationByShareToken(token: string) {
  const { data, error } = await supabase.rpc("get_shared_simulation", { _token: token });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Simulation not found");
  return row;
}

/** Load one of the caller's own simulations (used by /results/:id). */
export async function getSimulationById(id: string) {
  const { data, error } = await supabase
    .from("simulations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Simulation not found");
  return data;
}

/**
 * Convert a persisted simulation row into the shape the results UI expects.
 */
export function simulationRowToResult(row: {
  overall_score: number;
  sentiment_breakdown: unknown;
  top_objections: unknown;
  top_strengths: unknown;
  sharpened_pitch: string | null;
  key_quote: string | null;
  key_quote_agent: string | null;
  agent_posts: unknown;
}): SimulationResult {
  const asArray = (v: unknown): any[] => (Array.isArray(v) ? (v as any[]) : []);
  const agents = asArray(row.agent_posts);

  return {
    overall_score: row.overall_score ?? 0,
    sentiment_breakdown: asArray(row.sentiment_breakdown),
    agents: agents.map((a: any) => ({
      ...a,
      reaction_post: a.reaction_post || a.text,
      archetype: a.archetype || a.role,
    })),
    top_objections: asArray(row.top_objections),
    top_strengths: asArray(row.top_strengths),
    key_quote: row.key_quote || "",
    key_quote_agent: row.key_quote_agent || "",
    sharpened_pitch: row.sharpened_pitch || "",
    pitch_changes_made: "",
    recommended_actions: [],
    emerging_themes: [],
    debate_posts: [],
    usingMockData: false,
  };
}
