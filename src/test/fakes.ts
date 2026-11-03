import { vi } from "vitest";

/**
 * Minimal fake of the Supabase browser client. Each test configures the
 * responses it needs and asserts on the calls that were made.
 */
type Response = { data?: unknown; error?: unknown };

export interface FakeSupabase {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
  };
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
  functions: { invoke: ReturnType<typeof vi.fn> };
  storage: { from: ReturnType<typeof vi.fn> };
  _calls: Array<{ table: string; op: string; args: unknown[] }>;
}

/**
 * Builds a chainable query stub: `supabase.from("x").select("y").eq("a", 1).single()`.
 * The terminal resolver returns the configured response for that op.
 */
export function createFakeSupabase(config: {
  user?: { id: string } | null;
  responses?: Record<string, Response | Response[]>;
} = {}): FakeSupabase {
  const calls: FakeSupabase["_calls"] = [];
  const responses = config.responses ?? {};
  const queues = new Map<string, Response[]>();

  const resolveFor = (table: string, op: string): Response => {
    const key = `${table}.${op}`;
    const queued = queues.get(key);
    if (queued && queued.length > 0) return queued.shift()!;

    const configured = responses[key] ?? responses[table] ?? { data: null, error: null };
    if (Array.isArray(configured)) {
      return configured.length > 0 ? configured.shift()! : { data: null, error: null };
    }
    return configured;
  };

  // Pre-load array responses into a queue so sequential calls differ.
  for (const [key, value] of Object.entries(responses)) {
    if (Array.isArray(value)) {
      queues.set(key, [...(value as Response[])]);
    }
  }

  const makeQuery = (table: string, initialOp: string) => {
    // The op is tracked on the builder so `insert(...).select().single()`
    // resolves against the insert response rather than the select one.
    let currentOp = initialOp;
    const result = () => resolveFor(table, currentOp);

    const builder: Record<string, unknown> = {};
    Object.assign(builder, {
      select: vi.fn(() => builder),
      insert: vi.fn((...args: unknown[]) => {
        currentOp = "insert";
        calls.push({ table, op: "insert", args });
        return builder;
      }),
      update: vi.fn((...args: unknown[]) => {
        currentOp = "update";
        calls.push({ table, op: "update", args });
        return builder;
      }),
      delete: vi.fn(() => builder),
      upsert: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      neq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      gte: vi.fn(() => builder),
      lt: vi.fn(() => builder),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      single: vi.fn(async () => result()),
      maybeSingle: vi.fn(async () => result()),
      then: (onFulfilled: (v: Response) => unknown) => Promise.resolve(result()).then(onFulfilled),
    });
    return builder;
  };

  const client: FakeSupabase = {
    auth: {
      // `null` must mean "signed out" — note ?? would swallow it.
      getUser: vi.fn(async () => ({
        data: { user: config.user !== undefined ? config.user : { id: "user-1" } },
      })),
      getSession: vi.fn(async () => ({ data: { session: null } })),
    },
    from: vi.fn((table: string) => {
      calls.push({ table, op: "from", args: [] });
      return makeQuery(table, "select");
    }),
    rpc: vi.fn(async (fn: string, args: unknown) => {
      calls.push({ table: `rpc:${fn}`, op: "rpc", args: [args] });
      return resolveFor(`rpc:${fn}`, "rpc");
    }),
    functions: { invoke: vi.fn() },
    storage: { from: vi.fn() },
    _calls: calls,
  };

  return client;
}

export function resetFakeCalls(client: FakeSupabase) {
  client._calls.length = 0;
  client.from.mockClear();
  client.rpc.mockClear();
}
