import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productDescription, simulationQuestion, crowdSize, audienceMix, platform, depth } =
      await req.json();

    if (!productDescription || typeof productDescription !== "string") {
      return new Response(
        JSON.stringify({ error: "productDescription is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const audienceList = (audienceMix || ["founders", "pms"]).join(", ");
    const size = crowdSize || 200;
    const question = simulationQuestion || "Would you use this product?";

    const systemPrompt = `You are a swarm intelligence simulation engine. You simulate how real product personas react to product pitches. Always return valid JSON matching the schema exactly. Be honest and critical. Real users are skeptical. Good products score 70-85. Most score 50-75.`;

    const userPrompt = `Simulate how a crowd of ${size} product personas would react to the following product pitch. Include personas from these types: ${audienceList}.

Product Pitch:
${productDescription}

Key Question: ${question}

Return a JSON object with this exact schema:
{
  "overall_score": number (0-100, honest assessment),
  "sentiment_breakdown": [
    { "audience": string, "excited": number, "skeptical": number, "neutral": number, "hostile": number }
  ],
  "agents": [
    {
      "name": "FirstName LastInitial.",
      "archetype": "Role Title",
      "company_context": "Company or context",
      "personality_type": "skeptic" | "advocate" | "pragmatist" | "analyst",
      "emoji": "single emoji",
      "reaction_post": "2-4 sentences, opinionated, in character",
      "upvotes": number (1-80)
    }
  ],
  "top_objections": [
    {
      "text": "objection summary",
      "agent_count": number,
      "category": "Pricing" | "Technical" | "Positioning" | "Trust" | "ICP",
      "quote": "direct agent quote",
      "agent": "agent name",
      "role": "agent role",
      "badge": "skeptic" | "advocate" | "pragmatist" | "analyst",
      "emoji": "single emoji"
    }
  ],
  "top_strengths": [
    {
      "text": "strength summary",
      "agent_count": number,
      "category": string,
      "quote": "direct agent quote",
      "agent": "agent name",
      "role": "agent role",
      "badge": "skeptic" | "advocate" | "pragmatist" | "analyst",
      "emoji": "single emoji"
    }
  ],
  "key_quote": "most insightful agent quote",
  "key_quote_agent": "Name — Role — Badge",
  "sharpened_pitch": "improved version of the pitch based on learnings",
  "pitch_changes_made": "what was improved and why",
  "recommended_actions": ["action 1", "action 2", "action 3"]
}

Generate exactly 12 diverse agents, 5 objections, and 5 strengths. One sentiment_breakdown entry per audience type in the mix. Each audience percentages should sum to 100.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited — please try again in a moment" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the AI response
    const simulationData = JSON.parse(content);

    return new Response(JSON.stringify(simulationData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("run-simulation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
