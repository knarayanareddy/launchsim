/**
 * Shared CORS + validation helpers for LaunchSim edge functions.
 *
 * Previously every function sent `Access-Control-Allow-Origin: *`, which let any
 * website call them with a logged-in user's credentials.
 */

const DEFAULT_ORIGINS = [
  "https://launchsim.lovable.app",
  "https://launchsim.app",
];

/**
 * Reads an env var without a hard dependency on the `Deno` global, so this
 * module can also be imported by the vitest suite (which runs on Node).
 */
function env(key: string): string {
  const deno = (globalThis as {
    Deno?: { env: { get(name: string): string | undefined } };
  }).Deno;
  return deno?.env.get(key) ?? "";
}

function allowedOrigins(): string[] {
  const configured = env("ALLOWED_ORIGINS")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const appUrl = env("APP_URL");

  return [
    ...new Set([
      ...(appUrl ? [appUrl] : []),
      ...DEFAULT_ORIGINS,
      ...configured,
    ]),
  ];
}

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins().includes(origin)) return true;
  // Local development (vite on :8080, vite preview on :4173, etc.)
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = origin && isAllowedOrigin(origin)
    ? origin
    : allowedOrigins()[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function preflight(req: Request): Response {
  return new Response(null, { headers: corsHeaders(req) });
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

/** Public-safe error response: never leaks internal messages or stack traces. */
export function serverError(req: Request, detail?: unknown): Response {
  if (detail) console.error("[edge] internal error:", detail);
  return json(req, { error: "Something went wrong. Please try again." }, 500);
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export function asString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
