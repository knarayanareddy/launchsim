import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { preflight, json, serverError } from "../_shared/cors.ts";

/**
 * notion-export — creates a Notion page from a saved LaunchSim report.
 *
 * Security posture:
 *  - requires an authenticated user whose plan allows Notion export
 *  - the report is loaded server-side from the caller's own simulations, so a
 *    caller cannot exfiltrate someone else's report into their Notion workspace
 *  - the Notion token is never logged
 */

const NOTION_VERSION = "2022-06-28";

/** Notion rejects rich_text over 2000 chars, so clamp every user/AI string. */
const rt = (value: unknown): string => {
  const text = typeof value === "string" ? value : String(value ?? "");
  return text.length > 1900 ? `${text.slice(0, 1899)}…` : text;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) return serverError(req, "Supabase env vars missing");

    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json(req, { error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: { user } } = await createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    }).auth.getUser();
    if (!user) return json(req, { error: "Unauthorized" }, 401);

    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      return json(req, { error: "Invalid JSON body" }, 400);
    }

    const notionToken = typeof payload.notionToken === "string" ? payload.notionToken.trim() : "";
    const parentPageId = typeof payload.parentPageId === "string" ? payload.parentPageId.trim() : "";
    const simulationId = typeof payload.simulationId === "string" ? payload.simulationId : "";

    if (!notionToken || !parentPageId || !simulationId) {
      return json(req, { error: "notionToken, parentPageId and simulationId are required" }, 400);
    }

    // Only known Notion secret/integration token shapes are forwarded.
    if (!/^(secret_[A-Za-z0-9]{20,}|ntn_[A-Za-z0-9]{20,})$/.test(notionToken)) {
      return json(req, { error: "That does not look like a Notion integration token" }, 400);
    }
    if (!/^[0-9a-fA-F-]{32,36}$/.test(parentPageId.replace(/-/g, "-"))) {
      return json(req, { error: "Invalid Notion page id" }, 400);
    }

    // --- Plan gate -------------------------------------------------------
    const { data: profile } = await admin
      .from("profiles")
      .select("plan_tier, is_suspended")
      .eq("id", user.id)
      .single();

    if (profile?.is_suspended) return json(req, { error: "Account suspended" }, 403);
    if (profile?.plan_tier !== "enterprise") {
      return json(req, { error: "Notion export requires the Unlimited plan" }, 403);
    }

    // --- Load the report server-side, scoped to the caller ----------------
    const { data: sim, error: simError } = await admin
      .from("simulations")
      .select("product_description, overall_score, sentiment_breakdown, top_objections, top_strengths, sharpened_pitch")
      .eq("id", simulationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (simError) return serverError(req, simError);
    if (!sim) return json(req, { error: "Simulation not found" }, 404);

    const title = String(payload.title || sim.product_description).slice(0, 200);
    const score = sim.overall_score;
    const sentimentBreakdown = (sim.sentiment_breakdown as any[]) || [];
    const objections = (sim.top_objections as any[]) || [];
    const strengths = (sim.top_strengths as any[]) || [];
    const refinedPitch = sim.sharpened_pitch || "";
    const recommendedActions: string[] = Array.isArray(payload.recommendedActions)
      ? (payload.recommendedActions as unknown[]).filter((a): a is string => typeof a === "string").slice(0, 10)
      : [];

    // Format sentiment text
    const sentimentText = (sentimentBreakdown || [])
      .map((s: any) => `${s.audience}: ${s.excited}% Excited, ${s.skeptical}% Skeptical, ${s.neutral}% Neutral, ${s.hostile || 0}% Hostile`)
      .join("\n");

    const children: any[] = [
      // Score heading
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: `Launch Readiness Score: ${score}/100` } }],
        },
      },
      // Sentiment
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: rt(sentimentText || "No sentiment data") } }],
        },
      },
      // Objections heading
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "Top Objections" } }],
        },
      },
      // Objection bullets
      ...(objections || []).map((o: any) => ({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: rt(`${o.text} (${o.agent_count || o.agents || 0} agents, ${o.category || ""})`) } }],
        },
      })),
      // Strengths heading
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "Top Strengths" } }],
        },
      },
      ...(strengths || []).map((s: any) => ({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: rt(`${s.text} (${s.agent_count || s.agents || 0} agents, ${s.category || ""})`) } }],
        },
      })),
      // Refined pitch
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "Refined Pitch" } }],
        },
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: rt(refinedPitch || "N/A") } }],
        },
      },
      // Next steps
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "Recommended Next Steps" } }],
        },
      },
      ...(recommendedActions || []).map((a: string) => ({
        object: "block",
        type: "to_do",
        to_do: {
          rich_text: [{ type: "text", text: { content: rt(a) } }],
          checked: false,
        },
      })),
    ];

    // Create page in Notion
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { page_id: parentPageId },
        properties: {
          title: {
            title: [{ text: { content: rt(`LaunchSim Report — ${title || "Simulation"}`) } }],
          },
        },
        children,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Notion API error:", response.status, errBody);
      return json(req, { error: `Notion rejected the export (${response.status}). Check the token and page id.` }, 502);
    }

    const page = await response.json();

    return json(req, { success: true, url: page.url, pageId: page.id });
  } catch (err) {
    return serverError(req, err);
  }
});
