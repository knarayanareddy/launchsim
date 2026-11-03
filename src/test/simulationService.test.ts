import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "./fakes";

let fake: FakeSupabase;

vi.mock("@/integrations/supabase/client", () => ({
  get supabase() {
    return fake;
  },
}));

const { saveSimulation, shareSimulation, getSimulationByShareToken, simulationRowToResult } =
  await import("@/lib/simulationService");

const liveResult = {
  overall_score: 64,
  sentiment_breakdown: [{ audience: "founders", excited: 40, skeptical: 30, neutral: 20, hostile: 10 }],
  agents: [{ name: "Dana K.", archetype: "PM", personality_type: "skeptic", reaction_post: "Hmm.", upvotes: 12, emoji: "🔴" }],
  top_objections: [{ text: "Pricing unclear", agent_count: 20 }],
  top_strengths: [{ text: "Sharp positioning", agent_count: 14 }],
  key_quote: "Who signs off on this?",
  key_quote_agent: "Dana K.",
  sharpened_pitch: "A better pitch",
  pitch_changes_made: "",
  recommended_actions: [],
  usingMockData: false,
};

beforeEach(() => {
  fake = createFakeSupabase({
    responses: {
      "simulations.insert": { data: { id: "sim-1", share_token: null }, error: null },
      "agents.insert": { data: null, error: null },
      "simulation_groups.select": { data: null, error: null },
      "simulations.update": { data: null, error: null },
    },
  });
});

describe("saveSimulation", () => {
  it("never persists demo data", async () => {
    const result = await saveSimulation({
      description: "A product",
      aiResult: { ...liveResult, usingMockData: true } as never,
    });

    expect(result).toEqual({ id: "", share_token: null, persisted: false });
    // No insert should have been attempted at all.
    expect(fake.from).not.toHaveBeenCalled();
  });

  it("returns the existing row when the edge function already saved it", async () => {
    const result = await saveSimulation({
      description: "A product",
      aiResult: { ...liveResult, _simulation_id: "edge-42" } as never,
    });

    expect(result).toEqual({ id: "edge-42", share_token: null, persisted: true });
    expect(fake.from).not.toHaveBeenCalled();
  });

  it("writes a real result and its agents", async () => {
    const result = await saveSimulation({
      description: "A product",
      aiResult: liveResult as never,
    });

    expect(result).toEqual({ id: "sim-1", share_token: null, persisted: true });

    // A share token must NOT be minted on save any more.
    const insertCall = fake._calls.find((c) => c.table === "simulations" && c.op === "insert");
    expect(insertCall).toBeDefined();
    const payload = insertCall!.args[0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("share_token");
    expect(payload.overall_score).toBe(64);

    const agentsCall = fake._calls.find((c) => c.table === "agents" && c.op === "insert");
    const agents = agentsCall!.args[0] as Array<Record<string, unknown>>;
    expect(agents).toHaveLength(1);
    expect(agents[0]).toMatchObject({ simulation_id: "sim-1", personality_type: "skeptic" });
  });

  it("throws when the user is not signed in", async () => {
    fake = createFakeSupabase({ user: null });
    await expect(
      saveSimulation({ description: "A product", aiResult: liveResult as never }),
    ).rejects.toThrow(/not signed in/i);
  });

  it("propagates database errors instead of pretending success", async () => {
    fake = createFakeSupabase({
      responses: { "simulations.insert": { data: null, error: { message: "RLS denied" } } },
    });
    await expect(
      saveSimulation({ description: "A product", aiResult: liveResult as never }),
    ).rejects.toMatchObject({ message: "RLS denied" });
  });

  it("creates an iteration group and links the run to it", async () => {
    fake = createFakeSupabase({
      responses: {
        "simulations.insert": { data: { id: "sim-9", share_token: null }, error: null },
        "agents.insert": { data: null, error: null },
        "simulation_groups.insert": { data: { id: "group-1" }, error: null },
        "simulation_groups.select": { data: { simulation_ids: ["sim-8"], latest_score: 50 }, error: null },
        "simulation_groups.update": { data: null, error: null },
        "simulations.update": { data: null, error: null },
      },
    });

    await saveSimulation({
      description: "A product",
      aiResult: liveResult as never,
      newGroupName: "Launch tracker",
    });

    const groupInsert = fake._calls.find((c) => c.table === "simulation_groups" && c.op === "insert");
    expect((groupInsert!.args[0] as Record<string, unknown>).product_name).toBe("Launch tracker");

    const groupUpdate = fake._calls.find((c) => c.table === "simulation_groups" && c.op === "update");
    const update = groupUpdate!.args[0] as Record<string, unknown>;
    expect(update.simulation_ids).toEqual(["sim-8", "sim-9"]);
    expect(update.latest_score).toBe(64);
    expect(update.score_delta).toBe(14);
  });
});

describe("shareSimulation", () => {
  it("calls the ownership-checked RPC", async () => {
    fake = createFakeSupabase({ responses: { "rpc:share_simulation": { data: "abc12345", error: null } } });
    await expect(shareSimulation("sim-1")).resolves.toBe("abc12345");
    expect(fake.rpc).toHaveBeenCalledWith("share_simulation", { _simulation_id: "sim-1" });
  });

  it("surfaces RPC failures", async () => {
    fake = createFakeSupabase({
      responses: { "rpc:share_simulation": { data: null, error: { message: "not owned" } } },
    });
    await expect(shareSimulation("sim-1")).rejects.toMatchObject({ message: "not owned" });
  });

  it("rejects an empty token", async () => {
    fake = createFakeSupabase({ responses: { "rpc:share_simulation": { data: null, error: null } } });
    await expect(shareSimulation("sim-1")).rejects.toThrow(/share link/i);
  });
});

describe("getSimulationByShareToken", () => {
  it("uses the token-scoped RPC, not a table read", async () => {
    fake = createFakeSupabase({
      responses: { "rpc:get_shared_simulation": { data: [{ id: "sim-1", overall_score: 70 }], error: null } },
    });

    const row = await getSimulationByShareToken("tok123");
    expect(row).toMatchObject({ id: "sim-1" });
    expect(fake.rpc).toHaveBeenCalledWith("get_shared_simulation", { _token: "tok123" });
    // The old implementation read the simulations table directly, which was
    // world-readable because every row had a share token.
    expect(fake.from).not.toHaveBeenCalled();
  });

  it("throws when the token matches nothing", async () => {
    fake = createFakeSupabase({ responses: { "rpc:get_shared_simulation": { data: [], error: null } } });
    await expect(getSimulationByShareToken("nope")).rejects.toThrow(/not found/i);
  });
});

describe("simulationRowToResult", () => {
  it("normalises a database row into the results shape", () => {
    const result = simulationRowToResult({
      overall_score: 81,
      sentiment_breakdown: [{ audience: "developers" }],
      top_objections: [{ text: "Docs?" }],
      top_strengths: [{ text: "Fast" }],
      sharpened_pitch: "Pitch",
      key_quote: "Quote",
      key_quote_agent: "Sam T.",
      agent_posts: [{ name: "Sam T.", role: "Dev", text: "nice" }],
    });

    expect(result.overall_score).toBe(81);
    expect(result.usingMockData).toBe(false);
    expect(result.agents[0]).toMatchObject({ archetype: "Dev", reaction_post: "nice" });
    expect(result.sentiment_breakdown).toHaveLength(1);
  });

  it("tolerates nulls and non-array JSON columns", () => {
    const result = simulationRowToResult({
      overall_score: 0,
      sentiment_breakdown: null,
      top_objections: { not: "an array" },
      top_strengths: null,
      sharpened_pitch: null,
      key_quote: null,
      key_quote_agent: null,
      agent_posts: null,
    });

    expect(result.sentiment_breakdown).toEqual([]);
    expect(result.top_objections).toEqual([]);
    expect(result.agents).toEqual([]);
    expect(result.key_quote).toBe("");
  });
});

describe("iteration grouping for edge-saved runs", () => {
  it("links a pre-saved run to its group without re-inserting", async () => {
    fake = createFakeSupabase({
      responses: {
        "simulation_groups.select": { data: { simulation_ids: [], latest_score: 40 }, error: null },
        "simulation_groups.update": { data: null, error: null },
        "simulations.update": { data: null, error: null },
      },
    });

    const result = await saveSimulation({
      description: "A product",
      aiResult: { ...liveResult, _simulation_id: "edge-7" } as never,
      groupId: "group-9",
    });

    expect(result.id).toBe("edge-7");
    // No new simulation row...
    expect(fake._calls.some((c) => c.table === "simulations" && c.op === "insert")).toBe(false);
    // ...but the group rollup is updated.
    const groupUpdate = fake._calls.find((c) => c.table === "simulation_groups" && c.op === "update");
    expect(groupUpdate).toBeDefined();
    expect((groupUpdate!.args[0] as Record<string, unknown>).simulation_ids).toEqual(["edge-7"]);
  });

  it("does nothing when no group is requested", async () => {
    fake = createFakeSupabase();
    await saveSimulation({
      description: "A product",
      aiResult: { ...liveResult, _simulation_id: "edge-8" } as never,
    });
    expect(fake.from).not.toHaveBeenCalled();
  });
});
