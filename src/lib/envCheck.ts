const REQUIRED_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;

export function checkEnvVars(): { ok: boolean; missing: string[] } {
  const missing = REQUIRED_VARS.filter(
    (key) => !import.meta.env[key]
  );
  if (missing.length > 0) {
    console.error("[ENV] Missing required environment variables:", missing);
  }
  return { ok: missing.length === 0, missing };
}
