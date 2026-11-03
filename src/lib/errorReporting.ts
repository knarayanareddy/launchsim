import { supabase } from "@/integrations/supabase/client";

/**
 * Persist a client-side error to public.error_logs so the admin System Health
 * tab has something real to show. Previously ErrorBoundary told users
 * "We've logged this issue" while only calling console.error, and nothing in
 * the codebase ever wrote a row.
 *
 * Logging is best-effort and must never throw or block rendering.
 */
export async function reportError(
  error: unknown,
  context: { page?: string; componentStack?: string } = {},
): Promise<void> {
  try {
    const message = error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error);

    // Keep the row small; the table is for triage, not full stack capture.
    const detail = [message, context.componentStack?.trim().slice(0, 1200)]
      .filter(Boolean)
      .join("\n---\n")
      .slice(0, 2000);

    const { data: { user } } = await supabase.auth.getUser();

    // error_logs only accepts rows from authenticated users (anon inserts would
    // be an open log-spam vector), so skip logging for signed-out visitors.
    if (!user) return;

    await supabase.from("error_logs").insert({
      user_id: user.id,
      error_message: detail,
      page: context.page?.slice(0, 200) ?? null,
    });
  } catch {
    // Never let error reporting break the error UI.
  }
}
