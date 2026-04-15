import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      notionToken,
      parentPageId,
      title,
      score,
      sentimentBreakdown,
      objections,
      strengths,
      refinedPitch,
      recommendedActions,
    } = await req.json();

    if (!notionToken || !parentPageId) {
      return new Response(
        JSON.stringify({ error: "Missing notionToken or parentPageId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
          rich_text: [{ type: "text", text: { content: sentimentText || "No sentiment data" } }],
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
          rich_text: [{ type: "text", text: { content: `${o.text} (${o.agent_count || o.agents || 0} agents, ${o.category || ""})` } }],
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
          rich_text: [{ type: "text", text: { content: `${s.text} (${s.agent_count || s.agents || 0} agents, ${s.category || ""})` } }],
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
          rich_text: [{ type: "text", text: { content: refinedPitch || "N/A" } }],
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
          rich_text: [{ type: "text", text: { content: a } }],
          checked: false,
        },
      })),
    ];

    // Create page in Notion
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { page_id: parentPageId },
        properties: {
          title: {
            title: [{ text: { content: `LaunchSim Report — ${title || "Simulation"}` } }],
          },
        },
        children,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Notion API error:", response.status, errBody);
      return new Response(
        JSON.stringify({ error: `Notion API error (${response.status}): ${errBody}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const page = await response.json();

    return new Response(
      JSON.stringify({ success: true, url: page.url, pageId: page.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("notion-export error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
