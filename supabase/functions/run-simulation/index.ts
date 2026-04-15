import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Get calling user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("authorization") || "";

    let userId: string | null = null;
    if (authHeader) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id || null;
    }

    const audienceList = (audienceMix || ["founders", "pms"]).join(", ");
    const size = crowdSize || 200;
    const question = simulationQuestion || "Would you use this product?";
    const simPlatform = platform || "both";
    const simDepth = depth || "standard";

    const systemPrompt = `You are a swarm intelligence engine that simulates how real product personas react to startup pitches. You produce brutally honest, highly specific feedback that reflects real market reactions.

Rules:
- NEVER give generic feedback. Every objection must be SPECIFIC to the exact product described.
- If the product is in healthcare, agents raise HIPAA/compliance concerns.
- If it's a dev tool, agents ask about API docs, GitHub stars, self-hosting.
- If it's consumer, agents ask about App Store presence, onboarding UX.
- If it's B2B, agents ask about integrations, SLAs, procurement process.
- Skeptics are genuinely harsh and specific — not just "needs more proof."
- Advocates are enthusiastically specific — they name real competitors they'd switch from.
- Score honestly: most ideas score 45-72. A truly great pitch scores 80+.
- All persona names, companies, and reactions must feel like real people.
- The key_quote must be the single most insightful reaction — the one that captures what the room actually thinks.`;

    const userPrompt = `Simulate how a crowd of ${size} product personas would react to this specific product pitch.

PRODUCT DESCRIPTION:
${productDescription}

SIMULATION FOCUS QUESTION:
${question}

AUDIENCE MIX: ${audienceList}
PLATFORM: ${simPlatform}
SIMULATION DEPTH: ${simDepth}

Generate personas that specifically match the AUDIENCE MIX selected. If "Developers" is in the mix, include developers who ask developer-specific questions. If "Enterprise" is selected, include enterprise buyers who ask about procurement and compliance.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "overall_score": <integer 0-100, honest assessment>,
  "score_rationale": "<2 sentences explaining why this specific score was given>",
  "sentiment_breakdown": [
    { "audience": "<audience type>", "excited": <int%>, "skeptical": <int%>, "neutral": <int%>, "hostile": <int%> }
  ],
  "agents": [
    {
      "name": "<realistic first name + last initial>",
      "archetype": "<specific job title>",
      "company_context": "<type and stage of company>",
      "personality_type": "<skeptic|advocate|pragmatist|analyst>",
      "emoji": "<single relevant emoji>",
      "reaction_post": "<3-5 sentences, highly specific to THIS product, in character, no generic phrases>",
      "upvotes": <integer 5-80>,
      "platform_style": "<twitter|reddit>"
    }
  ],
  "top_objections": [
    {
      "text": "<specific objection to THIS product — not generic>",
      "agent_count": <integer 10-60>,
      "category": "<Pricing|Technical|Positioning|Trust|ICP|Compliance|Market>",
      "specific_agents": ["<agent name>", "<agent name>"],
      "quote": "<direct quote from an agent>",
      "agent": "<agent name>",
      "role": "<agent role>",
      "badge": "<personality_type>",
      "emoji": "<emoji>"
    }
  ],
  "top_strengths": [
    {
      "text": "<specific strength of THIS product>",
      "agent_count": <integer 10-60>,
      "category": "<Positioning|Problem-fit|Timing|Design|Technical|Market>",
      "quote": "<direct quote from an agent>",
      "agent": "<agent name>",
      "role": "<agent role>",
      "badge": "<personality_type>",
      "emoji": "<emoji>"
    }
  ],
  "emerging_themes": ["<theme 1>", "<theme 2>", "<theme 3>", "<theme 4>", "<theme 5>"],
  "key_quote": "<the single most insightful reaction from any agent>",
  "key_quote_agent": "<agent name and archetype>",
  "key_quote_upvotes": <integer>,
  "sharpened_pitch": "<improved version of their EXACT pitch — rewrite it based on what the agents responded to best>",
  "pitch_changes_made": "<bullet list of 3-4 specific changes made and why, based on agent reactions>",
  "recommended_actions": [
    "<specific, actionable next step #1 based on top objection>",
    "<specific, actionable next step #2>",
    "<specific, actionable next step #3>"
  ],
  "persona_breakdown": {
    "founders": <integer percent excited>,
    "pms": <integer percent excited>,
    "developers": <integer percent excited>,
    "skeptics": <integer percent excited>,
    "enterprise": <integer percent excited>,
    "early_adopters": <integer percent excited>
  },
  "debate_posts": [
    {
      "agent_name": "<name>",
      "personality_type": "<type>",
      "post": "<short post, 1-2 sentences, specific to product>",
      "upvotes": <integer>,
      "downvotes": <integer>,
      "is_reply": false
    },
    {
      "agent_name": "<name>",
      "personality_type": "<type>",
      "post": "<reply to previous post, specific>",
      "upvotes": <integer>,
      "downvotes": <integer>,
      "is_reply": true,
      "reply_to": "<agent name>"
    }
  ]
}

Generate exactly 12 agents (at least 3 from the selected audience types, at least 2 skeptics and 2 advocates).
Generate exactly 5 objections and 5 strengths.
Generate 15-20 debate posts with a mix of top-level and replies showing genuine disagreement.
One sentiment_breakdown entry per audience type. Each row's percentages must sum to 100.`;

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
          JSON.stringify({ error: "Rate limited — please try again in a moment", fallback: true }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage.", fallback: true }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "simulation_failed", fallback: true }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    const simulationData = JSON.parse(content);

    // Save to database using service role
    if (userId) {
      const supabase = createClient(supabaseUrl, serviceKey);

      // Save simulation
      const { data: simRow, error: simError } = await supabase
        .from("simulations")
        .insert({
          user_id: userId,
          product_description: productDescription,
          simulation_question: question,
          crowd_size: size,
          audience_mix: audienceMix || ["founders", "pms"],
          platform: simPlatform,
          depth: simDepth,
          overall_score: simulationData.overall_score || 0,
          sentiment_breakdown: simulationData.sentiment_breakdown,
          top_objections: simulationData.top_objections,
          top_strengths: simulationData.top_strengths,
          sharpened_pitch: simulationData.sharpened_pitch,
          key_quote: simulationData.key_quote,
          key_quote_agent: simulationData.key_quote_agent,
          agent_posts: simulationData.agents,
        })
        .select("id, share_token")
        .single();

      if (simError) {
        console.error("Error saving simulation:", simError);
      } else {
        // Save agents
        if (simulationData.agents?.length) {
          const agents = simulationData.agents.map((a: any) => ({
            simulation_id: simRow.id,
            name: a.name,
            archetype: a.archetype,
            personality_type: a.personality_type,
            reaction_post: a.reaction_post,
            upvotes: a.upvotes,
            emoji: a.emoji,
          }));
          await supabase.from("agents").insert(agents);
        }

        // Decrement credits
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits_remaining, simulations_run")
          .eq("id", userId)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              credits_remaining: Math.max(0, (profile.credits_remaining || 0) - 1),
              simulations_run: (profile.simulations_run || 0) + 1,
            })
            .eq("id", userId);
        }

        // Add simulation ID and share_token to the response
        simulationData._simulation_id = simRow.id;
        simulationData._share_token = simRow.share_token;
      }
    }

    return new Response(JSON.stringify(simulationData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("run-simulation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", fallback: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
