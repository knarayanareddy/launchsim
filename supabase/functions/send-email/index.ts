import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = "https://launchsim.lovable.app";

type Template = "welcome" | "simulation-complete" | "low-credits" | "upgrade-confirmation";

interface EmailRequest {
  to: string;
  template: Template;
  data: Record<string, any>;
}

function buildWelcome(data: Record<string, any>) {
  const name = data.name || "there";
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { to, template, data }: EmailRequest = await req.json();

    if (!to || !template) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, template" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const builder = templateBuilders[template];
    if (!builder) {
      return new Response(JSON.stringify({ error: `Unknown template: ${template}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html, text } = builder(data || {});

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "LaunchSim <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", result);
      return new Response(JSON.stringify({ error: "Failed to send email", details: result }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
