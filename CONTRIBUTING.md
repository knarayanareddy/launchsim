# Contributing to LaunchSim

## Setup

```bash
npm ci            # npm only — bun.lock was removed on purpose
npm run dev       # http://localhost:8080
```

Node 22.12+ and npm 10+ are required (`engines` in `package.json`, `.nvmrc`
pins 22). Vitest 5 and ESLint 10 dropped Node 20 support.

## Before you push

```bash
npm run check     # typecheck + lint + test
```

CI (`.github/workflows/ci.yml`) runs the same steps — install, typecheck,
audit, lint, test, build — so a green local `npm run check` means a green PR.

## Styling (Tailwind v4)

The theme lives in `src/index.css`, not in a JS config: v4 has no
`tailwind.config.ts` and no `postcss.config.js`. Colours are declared in
`@theme inline` as `--color-*`, so `bg-primary` resolves through
`hsl(var(--primary))` and opacity modifiers (`bg-primary/50`) go through
`color-mix` with a solid fallback.

Two things to know before changing styling:

- **Dark mode is class-based**, re-declared with
  `@custom-variant dark (&:where(.dark, .dark *))`. v4 defaults to
  `prefers-color-scheme`; deleting that line silently breaks every `dark:`
  utility.
- **The blur and shadow scales were renumbered in v4.** v3's `blur-sm` is v4's
  `blur-xs`, and v3's `shadow-sm` is v4's `shadow-xs`. `--blur-sm` and
  `--shadow-sm` are pinned in `@theme` to their v3 values so existing call
  sites keep rendering identically. Removing those pins shifts every blur by
  4px and every shadow by a step.

`outline-none` also changed meaning: v4 makes it a true `outline-style: none`,
whereas v3 kept a transparent outline so Windows high-contrast mode still drew
a focus ring. Use `outline-hidden` for the old behaviour — that is what the
codebase uses.

### Checking a Tailwind change

Utility regressions are silent: a dropped class renders as "no styles" without
erroring. `scripts/css-manifest.mjs` compiles the stylesheet and records every
selector with its resolved declarations, then diffs two runs:

```bash
npm run css:manifest -- --out /tmp/before.json
# ...change styling...
npm run css:manifest -- --out /tmp/after.json
npm run css:manifest -- --diff /tmp/before.json /tmp/after.json
```

The diff exits non-zero if a class the app actually references stops producing
CSS. Use it before upgrading Tailwind or touching the theme.

## Ground rules

### Security

- **Never commit `.env` or any credential.** `.env` is gitignored; use
  `.env.example` as the template.
- **Edge functions must authenticate their caller.** Add new functions to
  `supabase/config.toml` explicitly and verify the JWT (or the service-role key)
  before doing any work. Do not add `Access-Control-Allow-Origin: *`; import the
  allowlist from `supabase/functions/_shared/cors.ts`.
- **Validate and clamp every input** that reaches a paid API or the database.
  `asString`, `clampInt` and `oneOf` in `_shared/cors.ts` are the toolkit.
- **Never return internal error messages** to the client — log them, return a
  generic message via `serverError()`.

### Database changes

RLS policies do **not** restrict columns on `UPDATE`. If a table holds
privileged columns (plan tier, credits, admin flags), the column grant is what
protects them:

```sql
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;
```

Every migration lives in `supabase/migrations/` with a timestamp prefix, and it
should include its own policies and grants. Regenerate
`src/integrations/supabase/types.ts` when the schema changes.

Test database changes locally without Docker:

```bash
pip install pgserver
cd supabase/tests
python3 verify_migrations.py   # migrations apply + schema invariants
python3 security_test.py       # RLS / grant assertions
```

Both run in CI (`.github/workflows/migrations.yml`). Note that
`REVOKE ... FROM PUBLIC` does **not** remove Supabase's default `EXECUTE` grant to
`anon`/`authenticated`; revoke those roles by name.

### Frontend

- **No demo data as a silent fallback.** If a real result cannot be produced,
  show an error. Mock data is only for the explicit "Demo Mode" path and is
  never persisted.
- Use `planLevel()` from `src/lib/config.ts` for plan gating — it fails closed
  for unknown tiers.
- Keep pages behind `React.lazy()`; the router is already code-split.
- Reduced `any` is preferred; new `any` shows up as a lint warning and CI counts
  warnings, so please don't add more.

### Tests

Add a test when you touch:

- a module in `src/lib/` or a `supabase/functions/_shared/` helper
- credit, referral or sharing logic
- anything that decides whether data is persisted

`src/test/fakes.ts` gives you a chainable fake Supabase client.

`src/test/render.test.tsx` mounts real component trees — Radix portals, Recharts
charts, the Sonner toaster — and fails if React logs an error while mounting.
This is the safety net for framework upgrades, where the unit tests happily pass
while a component throws at runtime. Add a case when you adopt a new UI
primitive. Two jsdom caveats it already handles: `ResizeObserver` is stubbed,
and Recharts charts need `isAnimationActive={false}` or their sectors never
mount.

## Commit style

Conventional-ish prefixes are appreciated: `fix:`, `feat:`, `chore:`, `docs:`,
`test:`, `sec:`. Keep the subject under ~72 characters and explain *why* in the
body for security-relevant changes.
