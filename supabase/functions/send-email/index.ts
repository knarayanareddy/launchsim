import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { preflight, json, serverError, escapeHtml } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = Deno.env.get("APP_URL") || "https://launchsim.lovable.app";
const FROM_ADDRESS = Deno.env.get("EMAIL_FROM") || "LaunchSim <onboarding@resend.dev>";

type Template = "welcome" | "simulation-complete" | "low-credits" | "upgrade-confirmation";

interface EmailRequest {
  to: string;
  template: Template;
  data: Record<string, unknown>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Which profile.email_prefs key gates each template. `welcome` and
 * `upgrade-confirmation` are transactional and always sent.
 */
const PREF_KEY: Partial<Record<Template, string>> = {
  "simulation-complete": "simulation_complete",
  "low-credits": "credit_warnings",
};

/** Templates accepted from a browser session (fire-and-forget after signup). */
const CLIENT_ALLOWED: Template[] = ["welcome"];

function buildWelcome(data: Record<string, any>) {
  const name = escapeHtml(String(data.name || "there")).slice(0, 80);
  return {
    subject: "🐟 Welcome to LaunchSim — your first simulation awaits",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:Arial,Helvetica,sans-serif;color:#E2E8F0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
<tr><td style="padding:40px 32px 0;">
  <h1 style="margin:0 0 4px;font-size:28px;font-weight:800;color:#4F8EF7;">Launch<span style="color:#E2E8F0;">Sim</span></h1>
  <p style="margin:0 0 24px;font-size:12px;color:#64748B;font-family:'Courier New',monospace;">SIMULATE YOUR LAUNCH</p>
</td></tr>
<tr><td style="padding:0 32px;">
  <h2 style="font-size:22px;margin:0 0 16px;color:#fff;">Hey ${name},</h2>
  <p style="font-size:15px;line-height:1.6;color:#E2E8F0;margin:0 0 20px;">Welcome to LaunchSim — the AI-powered launch simulator that gives you real feedback before you ship.</p>
  <ul style="padding-left:20px;margin:0 0 24px;color:#E2E8F0;font-size:14px;line-height:2;">
    <li>🧬 Spin up a crowd of AI personas that match your target market</li>
    <li>💬 Watch them debate, critique, and champion your idea</li>
    <li>📊 Get a launch readiness score in under 60 seconds</li>
  </ul>
  <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;"><tr><td style="background:#4F8EF7;border-radius:8px;">
    <a href="${APP_URL}/studio" style="display:inline-block;padding:14px 28px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;">Run Your First Simulation →</a>
  </td></tr></table>
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);">
  <p style="margin:0;font-size:11px;color:#64748B;line-height:1.6;">Built in Amsterdam 🇳🇱 · <a href="${APP_URL}/settings" style="color:#64748B;">Unsubscribe</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`,
    text: `Hey ${name},\n\nWelcome to LaunchSim!\n\n• Spin up AI personas matching your target market\n• Watch them debate your idea\n• Get a launch readiness score in under 60 seconds\n\nRun your first simulation: ${APP_URL}/studio\n\n— LaunchSim team`,
  };
}

function buildSimulationComplete(data: Record<string, any>) {
  const { score = 0, simulation_id = "", objections = [], top_strength = "" } = data;
  const label = score >= 80 ? "Strong" : score >= 60 ? "Fair" : "Needs Work";
  const objList = (objections as string[]).slice(0, 3).map((o: string) => `<li style="margin-bottom:6px;">${o}</li>`).join("");
  return {
    subject: `📊 Your LaunchSim report is ready — Score: ${score}/100`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:Arial,Helvetica,sans-serif;color:#E2E8F0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
<tr><td style="padding:40px 32px 0;">
  <h1 style="margin:0 0 4px;font-size:28px;font-weight:800;color:#4F8EF7;">Launch<span style="color:#E2E8F0;">Sim</span></h1>
</td></tr>
<tr><td style="padding:16px 32px;">
  <h2 style="font-size:20px;margin:0 0 20px;color:#fff;">Your simulation results are in</h2>
  <div style="text-align:center;padding:24px;background:rgba(79,142,247,0.08);border-radius:12px;margin-bottom:24px;">
    <p style="font-size:48px;font-weight:800;margin:0;color:#4F8EF7;">${score}<span style="font-size:20px;color:#64748B;"> / 100</span></p>
    <p style="margin:8px 0 0;font-size:14px;color:#E2E8F0;">${label} Launch Readiness</p>
  </div>
  ${objList ? `<h3 style="font-size:14px;color:#F5A623;margin:0 0 8px;">Top Objections</h3><ul style="padding-left:20px;margin:0 0 20px;color:#E2E8F0;font-size:13px;line-height:1.8;">${objList}</ul>` : ""}
  ${top_strength ? `<h3 style="font-size:14px;color:#2ED573;margin:0 0 8px;">Top Strength</h3><p style="font-size:13px;color:#E2E8F0;margin:0 0 24px;">✅ ${top_strength}</p>` : ""}
  <table cellpadding="0" cellspacing="0" style="margin:0 0 12px;"><tr><td style="background:#4F8EF7;border-radius:8px;">
    <a href="${APP_URL}/results/${simulation_id}" style="display:inline-block;padding:14px 28px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;">View Full Report →</a>
  </td></tr></table>
  <p style="margin:0 0 24px;"><a href="${APP_URL}/studio" style="color:#4F8EF7;font-size:13px;">Run Another Simulation →</a></p>
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);">
  <p style="margin:0;font-size:11px;color:#64748B;">Built in Amsterdam 🇳🇱 · <a href="${APP_URL}/settings" style="color:#64748B;">Unsubscribe</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`,
    text: `Your simulation results are in!\n\nScore: ${score}/100 — ${label} Launch Readiness\n\nView your full report: ${APP_URL}/results/${simulation_id}\n\n— LaunchSim team`,
  };
}

function buildLowCredits(data: Record<string, any>) {
  const { credits_remaining = 1, simulations_run = 0, plan = "free" } = data;
  return {
    subject: "⚠️ You have 1 simulation credit left",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:Arial,Helvetica,sans-serif;color:#E2E8F0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
<tr><td style="padding:40px 32px 0;">
  <h1 style="margin:0 0 4px;font-size:28px;font-weight:800;color:#4F8EF7;">Launch<span style="color:#E2E8F0;">Sim</span></h1>
</td></tr>
<tr><td style="padding:16px 32px;">
  <h2 style="font-size:20px;margin:0 0 16px;color:#F5A623;">⚠️ You're almost out of simulations</h2>
  <p style="font-size:15px;line-height:1.6;color:#E2E8F0;margin:0 0 20px;">You have <strong>${credits_remaining}</strong> credit remaining on your <strong>${plan}</strong> plan.</p>
  <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:16px;margin-bottom:24px;">
    <p style="margin:0 0 4px;font-size:13px;color:#64748B;">Usage this period</p>
    <p style="margin:0;font-size:15px;color:#E2E8F0;font-weight:600;">${simulations_run} simulations run · ${credits_remaining} credit left</p>
  </div>
  <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="background:#4F8EF7;border-radius:8px;">
    <a href="${APP_URL}/pricing" style="display:inline-block;padding:14px 28px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;">Upgrade to Pro — 30 simulations/mo</a>
  </td></tr></table>
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);">
  <p style="margin:0;font-size:11px;color:#64748B;">Built in Amsterdam 🇳🇱 · <a href="${APP_URL}/settings" style="color:#64748B;">Unsubscribe</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`,
    text: `You have ${credits_remaining} simulation credit left on your ${plan} plan.\n\n${simulations_run} simulations run this period.\n\nUpgrade to Pro for 30 simulations/month: ${APP_URL}/pricing\n\n— LaunchSim team`,
  };
}

function buildUpgradeConfirmation(data: Record<string, any>) {
  const { plan = "pro", credits = 30 } = data;
  const features = plan === "unlimited"
    ? ["Unlimited simulations", "1,000-agent swarms", "PDF + Notion export", "Custom personas", "Priority processing"]
    : ["30 simulations/month", "Up to 500 agents", "PDF export", "Comparison mode"];
  const featureList = features.map(f => `<li style="margin-bottom:6px;">✅ ${f}</li>`).join("");
  return {
    subject: `🎉 You're now on LaunchSim ${plan.charAt(0).toUpperCase() + plan.slice(1)}!`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:Arial,Helvetica,sans-serif;color:#E2E8F0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
<tr><td style="padding:40px 32px 0;">
  <h1 style="margin:0 0 4px;font-size:28px;font-weight:800;color:#4F8EF7;">Launch<span style="color:#E2E8F0;">Sim</span></h1>
</td></tr>
<tr><td style="padding:16px 32px;">
  <h2 style="font-size:22px;margin:0 0 16px;color:#2ED573;">🎉 Welcome to ${plan.charAt(0).toUpperCase() + plan.slice(1)}!</h2>
  <p style="font-size:15px;line-height:1.6;color:#E2E8F0;margin:0 0 12px;">Your plan has been upgraded. You now have <strong>${credits} credits</strong>.</p>
  <h3 style="font-size:14px;color:#E2E8F0;margin:16px 0 8px;">Features now unlocked:</h3>
  <ul style="padding-left:20px;margin:0 0 24px;color:#E2E8F0;font-size:13px;line-height:2;">${featureList}</ul>
  <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="background:#4F8EF7;border-radius:8px;">
    <a href="${APP_URL}/studio" style="display:inline-block;padding:14px 28px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;">Start Simulating →</a>
  </td></tr></table>
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);">
  <p style="margin:0;font-size:11px;color:#64748B;">Built in Amsterdam 🇳🇱 · <a href="${APP_URL}/settings" style="color:#64748B;">Unsubscribe</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`,
    text: `You're now on LaunchSim ${plan.charAt(0).toUpperCase() + plan.slice(1)}!\n\nYou have ${credits} credits.\n\nFeatures unlocked:\n${features.map(f => `• ${f}`).join("\n")}\n\nStart simulating: ${APP_URL}/studio\n\n— LaunchSim team`,
  };
}

const templateBuilders: Record<Template, (data: Record<string, any>) => { subject: string; html: string; text: string }> = {
  welcome: buildWelcome,
  "simulation-complete": buildSimulationComplete,
  "low-credits": buildLowCredits,
  "upgrade-confirmation": buildUpgradeConfirmation,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    if (!RESEND_API_KEY) {
      return serverError(req, "RESEND_API_KEY is not configured");
    }

    // --- Authorisation ---------------------------------------------------
    // This function used to be callable by anyone with the public anon key,
    // which turned it into an open relay for phishing through our Resend
    // account. Callers must now either present the service-role key (internal
    // calls) or be an authenticated admin (dashboard).
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    if (!token) return json(req, { error: "Unauthorized" }, 401);

    const isInternal = serviceKey.length > 0 && token === serviceKey;
    let callerId: string | null = null;

    if (!isInternal) {
      const { data: { user } } = await createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      }).auth.getUser();
      if (!user) return json(req, { error: "Unauthorized" }, 401);
      callerId = user.id;
    }

    let body: EmailRequest;
    try {
      body = await req.json();
    } catch {
      return json(req, { error: "Invalid JSON body" }, 400);
    }

    const { to, template } = body;
    const data = (body.data && typeof body.data === "object" ? body.data : {}) as Record<string, any>;

    if (typeof to !== "string" || !EMAIL_RE.test(to)) {
      return json(req, { error: "A valid `to` address is required" }, 400);
    }

    const builder = templateBuilders[template];
    if (!builder) return json(req, { error: `Unknown template: ${template}` }, 400);

    // Session callers may only trigger their own welcome email, and only to
    // the address on their own account.
    if (callerId) {
      if (!CLIENT_ALLOWED.includes(template)) {
        return json(req, { error: "Not permitted for this template" }, 403);
      }
      const admin = createClient(supabaseUrl, serviceKey);
      const { data: callerProfile } = await admin
        .from("profiles")
        .select("email, email_prefs, is_admin")
        .eq("id", callerId)
        .single();

      if (!callerProfile?.is_admin) {
        const ownEmail = (callerProfile?.email || "").toLowerCase();
        if (!ownEmail || ownEmail !== to.toLowerCase()) {
          return json(req, { error: "Not permitted" }, 403);
        }
      }

      // Honour the user's marketing/notification preference.
      const prefKey = PREF_KEY[template];
      if (prefKey && callerProfile?.email_prefs && callerProfile.email_prefs[prefKey] === false) {
        return json(req, { success: true, skipped: "preference_disabled" });
      }
    }

    const { subject, html, text } = builder(data);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html, text }),
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Resend API error:", res.status, result);
      return json(req, { error: "Failed to send email" }, 502);
    }

    return json(req, { success: true, id: (result as any).id });
  } catch (error) {
    return serverError(req, error);
  }
});
