import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get the calling user from the auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { referral_code } = await req.json();

    if (!referral_code || typeof referral_code !== "string" || referral_code.length < 4) {
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the referrer by code
    const { data: referrer, error: refError } = await supabase
      .from("profiles")
      .select("id, credits_remaining, total_referrals")
      .eq("referral_code", referral_code)
      .single();

    if (refError || !referrer) {
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-referral
    if (referrer.id === user.id) {
      return new Response(JSON.stringify({ error: "Cannot refer yourself" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already referred
    const { data: existingEvent } = await supabase
      .from("referral_events")
      .select("id")
      .eq("referred_id", user.id)
      .maybeSingle();

    if (existingEvent) {
      return new Response(JSON.stringify({ error: "Already referred", already_processed: true }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create referral event
    const { error: insertError } = await supabase
      .from("referral_events")
      .insert({
        referrer_id: referrer.id,
        referred_id: user.id,
        credit_awarded: true,
      });

    if (insertError) {
      console.error("Insert referral event error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to process referral" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Award credits: +3 to referrer, +1 to referred user
    const { error: referrerUpdateError } = await supabase
      .from("profiles")
      .update({
        credits_remaining: referrer.credits_remaining + 3,
        total_referrals: referrer.total_referrals + 1,
      })
      .eq("id", referrer.id);

    if (referrerUpdateError) {
      console.error("Referrer credit update error:", referrerUpdateError);
    }

    // Award bonus credit to referred user and set referred_by
    const { data: referredProfile } = await supabase
      .from("profiles")
      .select("credits_remaining")
      .eq("id", user.id)
      .single();

    if (referredProfile) {
      const { error: referredUpdateError } = await supabase
        .from("profiles")
        .update({
          credits_remaining: referredProfile.credits_remaining + 1,
          referred_by: referrer.id,
        })
        .eq("id", user.id);

      if (referredUpdateError) {
        console.error("Referred user credit update error:", referredUpdateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        referrer_credits_added: 3,
        referred_credits_added: 1,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("process-referral error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
