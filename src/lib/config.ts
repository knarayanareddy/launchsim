/**
 * Single source of truth for the public app URL.
 *
 * Previously `https://launchsim.lovable.app` was hardcoded in SEO.tsx,
 * ReferralSection.tsx, index.html, robots.txt, sitemap.xml and the send-email
 * edge function, which meant preview builds emitted canonicals claiming to be
 * production and referral links generated on staging credited nothing.
 */
export const APP_URL = (
  import.meta.env.VITE_APP_URL ||
  (typeof window !== "undefined" ? window.location.origin : "")
).replace(/\/$/, "");

export const SITE_NAME = "LaunchSim";
export const DEFAULT_TITLE = "LaunchSim — Simulate Your Product Launch Before You Ship";
export const DEFAULT_DESCRIPTION =
  "LaunchSim uses swarm AI to simulate how 1,000 real users would react to your product — before you ship. Get a sentiment map, objections, and refined pitch in 60 seconds.";

/** Plan tier -> the feature level used across gating UI. */
export type PlanLevel = "free" | "pro" | "unlimited";

export function planLevel(planTier: string | null | undefined): PlanLevel {
  // Note: an unknown/unexpected tier must fall back to the *most restrictive*
  // level. Previously Results.tsx cast any unknown tier straight through, so a
  // bad value silently unlocked Pro features.
  switch (planTier) {
    case "enterprise":
    case "unlimited":
      return "unlimited";
    case "pro":
      return "pro";
    default:
      return "free";
  }
}

export interface PlanFeature {
  label: string;
  free: string;
  pro: string;
  unlimited: string;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { label: "Simulations", free: "3 total", pro: "30 / month", unlimited: "Unlimited" },
  { label: "Crowd size", free: "Up to 200 agents", pro: "Up to 500 agents", unlimited: "Up to 1,000 agents" },
  { label: "PDF export", free: "—", pro: "Included", unlimited: "Included" },
  { label: "Comparison mode", free: "—", pro: "Included", unlimited: "Included" },
  { label: "Notion export", free: "—", pro: "—", unlimited: "Included" },
  { label: "Custom personas", free: "5", pro: "Unlimited", unlimited: "Unlimited" },
];

export const PLAN_PRICING = [
  { tier: "Free" as const, price: "$0", cadence: "forever", cta: "Current plan" },
  { tier: "Pro" as const, price: "$19", cadence: "per month", cta: "Upgrade to Pro" },
  { tier: "Unlimited" as const, price: "$49", cadence: "per month", cta: "Go Unlimited" },
];
