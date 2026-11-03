import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { preflight, json, serverError } from "../_shared/cors.ts";

/**
 * process-referral — awards +3 credits to the referrer and +1 to the referee.
 *
 * The award itself is performed by the `award_referral` Postgres function so the
 * ledger insert and both credit updates happen in a single transaction. The
 * previous implementation did three read-modify-write round trips, which both
 * double-awarded under concurrency and could record `credit_awarded = true`
 * while silently failing to move any credits.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return serverError(req, "Supabase env vars missing");
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // --- Identify the caller from their JWT -------------------------------
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json(req, { error: "Unauthorized" }, 401);
    }

    const { data: { user }, error: authError } = await createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    }).auth.getUser();

    if (authError || !user) return json(req, { error: "Unauthorized" }, 401);

    // --- Validate the referral code --------------------------------------
    let payload: { referral_code?: unknown };
    try {
      payload = await req.json();
    } catch {
      return json(req, { error: "Invalid JSON body" }, 400);
    }

    const referralCode = payload.referral_code;
    if (typeof referralCode !== "string" || !/^[a-zA-Z0-9]{4,32}$/.test(referralCode)) {
      return json(req, { error: "Invalid referral code" }, 400);
    }

    const { data: referrer } = await admin
      .from("profiles")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();

    if (!referrer) return json(req, { error: "Invalid referral code" }, 404);
    if (referrer.id === user.id) return json(req, { error: "You cannot refer yourself" }, 400);

    // --- Award atomically -------------------------------------------------
    const { error: awardError } = await admin.rpc("award_referral", {
      _referrer_id: referrer.id,
      _referred_id: user.id,
    });

    if (awardError) {
      // Postgres raises named exceptions for the two expected conflicts.
      if (awardError.message?.includes("referral_already_processed")) {
        return json(req, { error: "Already referred", already_processed: true }, 409);
      }
      if (awardError.message?.includes("self_referral_not_allowed")) {
        return json(req, { error: "You cannot refer yourself" }, 400);
      }
      return serverError(req, awardError);
    }

    return json(req, {
      success: true,
      referrer_credits_added: 3,
      referred_credits_added: 1,
    });
  } catch (error) {
    return serverError(req, error);
  }
});
