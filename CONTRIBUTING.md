# Contributing to LaunchSim

## Setup

```bash
npm ci            # npm only — bun.lock was removed on purpose
npm run dev       # http://localhost:8080
```

Node 20+ and npm 10+ are required (`engines` in `package.json`).

## Before you push

```bash
npm run check     # typecheck + lint + test
```

CI (`.github/workflows/ci.yml`) runs the same four steps — install, typecheck,
lint, test, build — so a green local `npm run check` means a green PR.

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

## Commit style

Conventional-ish prefixes are appreciated: `fix:`, `feat:`, `chore:`, `docs:`,
`test:`, `sec:`. Keep the subject under ~72 characters and explain *why* in the
body for security-relevant changes.
