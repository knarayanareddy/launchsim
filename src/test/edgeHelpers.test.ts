import { describe, it, expect } from "vitest";

// The shared edge-function module has no Deno-specific imports at module scope,
// so it can be exercised directly with vitest.
import {
  asString,
  clampInt,
  oneOf,
  escapeHtml,
  corsHeaders,
  json,
} from "../../supabase/functions/_shared/cors.ts";

describe("asString", () => {
  it("trims and accepts strings within the limit", () => {
    expect(asString("  hello  ", 10)).toBe("hello");
  });

  it("rejects non-strings, blanks and over-long input", () => {
    expect(asString(undefined, 10)).toBeNull();
    expect(asString(42, 10)).toBeNull();
    expect(asString({}, 10)).toBeNull();
    expect(asString("   ", 10)).toBeNull();
    expect(asString("x".repeat(11), 10)).toBeNull();
  });

  it("enforces the prompt-size cap that protects the AI bill", () => {
    // run-simulation caps productDescription at 4000 characters.
    expect(asString("x".repeat(4001), 4000)).toBeNull();
    expect(asString("x".repeat(4000), 4000)).toHaveLength(4000);
  });
});

describe("clampInt", () => {
  it("clamps to the allowed range", () => {
    expect(clampInt(5000, 10, 1000, 200)).toBe(1000);
    expect(clampInt(1, 10, 1000, 200)).toBe(10);
    expect(clampInt(42, 10, 1000, 200)).toBe(42);
  });

  it("accepts numeric strings and truncates fractions", () => {
    expect(clampInt("250", 10, 1000, 200)).toBe(250);
    expect(clampInt(12.9, 10, 1000, 200)).toBe(12);
  });

  it("falls back for nonsense", () => {
    expect(clampInt("abc", 10, 1000, 200)).toBe(200);
    expect(clampInt(null, 10, 1000, 200)).toBe(200);
    expect(clampInt(Number.NaN, 10, 1000, 200)).toBe(200);
    // Non-finite input is treated as "not provided" rather than clamped to max.
    expect(clampInt(Infinity, 10, 1000, 200)).toBe(200);
  });
});

describe("oneOf", () => {
  const allowed = ["twitter", "reddit", "both"] as const;

  it("returns allowed values", () => {
    expect(oneOf("reddit", allowed, "both")).toBe("reddit");
  });

  it("falls back for unknown or non-string values", () => {
    expect(oneOf("myspace", allowed, "both")).toBe("both");
    expect(oneOf(undefined, allowed, "both")).toBe("both");
    expect(oneOf(7, allowed, "both")).toBe("both");
  });
});

describe("escapeHtml", () => {
  it("neutralises the characters that matter inside an email body", () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    expect(escapeHtml("Tom & Jerry's")).toBe("Tom &amp; Jerry&#39;s");
  });
});

describe("corsHeaders", () => {
  const req = (origin?: string) =>
    new Request("https://example.com/", {
      method: "POST",
      headers: origin ? { origin } : {},
    });

  it("echoes an allowed production origin", () => {
    const headers = corsHeaders(req("https://launchsim.app"));
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://launchsim.app");
    expect(headers["Vary"]).toBe("Origin");
  });

  it("allows localhost for development", () => {
    const headers = corsHeaders(req("http://localhost:8080"));
    expect(headers["Access-Control-Allow-Origin"]).toBe("http://localhost:8080");
  });

  it("does not reflect arbitrary origins (the previous behaviour)", () => {
    const headers = corsHeaders(req("https://evil.example"));
    expect(headers["Access-Control-Allow-Origin"]).not.toBe("https://evil.example");
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://launchsim.lovable.app");
  });

  it("falls back cleanly with no origin header", () => {
    expect(corsHeaders(req())["Access-Control-Allow-Origin"]).toBeTruthy();
  });
});

describe("json", () => {
  it("serialises the body with the right content type and status", async () => {
    const res = json(new Request("https://example.com/", { method: "POST" }), { ok: true }, 201);
    expect(res.status).toBe(201);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
