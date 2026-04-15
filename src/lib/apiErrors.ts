import { toast } from "sonner";

interface ApiErrorOptions {
  fallbackMessage?: string;
  redirectOnAuth?: boolean;
}

export function handleApiError(err: unknown, opts: ApiErrorOptions = {}) {
  const message = err instanceof Error ? err.message : String(err);
  const fallback = opts.fallbackMessage || "Something went wrong. Please try again.";

  if (message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("timeout")) {
    toast.error("Connection timed out. Check your internet connection.");
    return;
  }

  if (message.includes("429") || message.toLowerCase().includes("rate limit")) {
    toast.warning("Too many requests. Please wait 30 seconds and try again.");
    return;
  }

  if (message.includes("401") || message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("jwt expired")) {
    toast.error("Your session expired. Please sign in again.");
    if (opts.redirectOnAuth) {
      setTimeout(() => (window.location.href = "/"), 2000);
    }
    return;
  }

  if (message.includes("500") || message.toLowerCase().includes("internal server")) {
    toast.error("Our servers are having issues. We're on it.");
    return;
  }

  toast.error(fallback);
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}
