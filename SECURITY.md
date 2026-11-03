# Security Policy

## Reporting a vulnerability

Email **security@launchsim.app** with a description and reproduction steps.
Please do not open a public issue for security problems. We aim to respond
within 3 business days.

## Threat model notes for maintainers

### Client-held keys

The browser only ever holds `VITE_SUPABASE_PUBLISHABLE_KEY` (the anon key). That
key is public by design, which means **Row Level Security is the only thing
protecting user data**. Before loosening any policy, check:

- Does this policy let a user read a row they do not own?
- Does this `UPDATE` policy need column-level grants as well?
- Is a `SECURITY DEFINER` function safe if the caller passes arbitrary ids?

### Secrets inventory

| Secret | Stored | Used by |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Edge function env | All server-side writes |
| `LOVABLE_API_KEY` | Edge function env | `run-simulation` |
| `RESEND_API_KEY` | Edge function env | `send-email` |

`RESEND_API_KEY` is **not** needed by the client. If you see it referenced in
frontend code, that is a bug.

### Credit and referral integrity

Credits move through `spend_credit`, `refund_credit` and `award_referral`, all
`SECURITY DEFINER` with `EXECUTE` granted to `service_role` only. They are the
only sanctioned way to change `profiles.credits_remaining`; the API roles have
no `UPDATE` grant on that column.

### Share links

A simulation is private until `share_simulation()` mints a token. Public reads go
through `get_shared_simulation(token)`, which returns exactly one row. A share
token is 16 hex characters (64 bits from `gen_random_uuid()`) — treat it as a
bearer capability: anyone with the link can read that one report.

The token must be unguessable, because the URL *is* the authorisation. An
earlier implementation used `md5(random()::text || clock_timestamp())` truncated
to 8 chars; `random()` is not a CSPRNG and the search space was small enough to
enumerate. Client-side token minting now uses `crypto.getRandomValues()` in
`generateShareToken()` rather than `Math.random()`.

### Verifying policies

Policy mistakes are invisible until someone exploits them. `supabase/tests/`
contains executable assertions for every guarantee above; run them before
merging a migration. One trap worth remembering: `REVOKE ALL ... FROM PUBLIC`
leaves Supabase's default grants to `anon`/`authenticated` intact, so privileged
functions must also be revoked from those roles explicitly.

### Dependency hygiene

`npm audit --omit=dev --audit-level=moderate` runs in CI. Only **production**
dependencies are gated: a devDependency vulnerability cannot reach the shipped
bundle, and gating the full tree produces enough noise to be ignored. Advisories
that are build-time or Node-only (e.g. `postcss`, `ws` inside
`@supabase/realtime-js`) are still patched, just not build-breaking.

When an advisory has no fix inside the current major, `overrides` in
`package.json` pins the patched transitive version. Overrides must stay within a
package's existing major: forcing `brace-expansion@1` onto a `minimatch` v10 that
expects v4+ breaks ESLint at config load.

### Known gaps

- **No payment provider.** Upgrades are manual; `/pricing` does not take cards.
- **Rate limiting is per-request only.** `run-simulation` validates input size
  but there is no per-user request throttle yet — a user with credits can issue
  requests back to back. Put a gateway limit in front before scaling.
- **CSP is not configured.** Consider adding a `Content-Security-Policy` header
  at the hosting layer.
- **No formal red-team/pen-test has been performed.** Coverage is the 40
  executable RLS/grant assertions in `supabase/tests/security_test.py` plus the
  CI dependency audit. Auth/session logic, rate limiting and the payment flow
  have not been reviewed by an adversarial third party.
- **TypeScript is held at 6.x on purpose.** Latest is 7.0.2, but
  `typescript-eslint` (8.72.1, the newest release) hard-refuses it at import:
  "typescript-eslint does not support TS 7.0." Linting is part of CI, so
  adopting TS 7 today would mean disabling lint or pinning a separate older
  TypeScript just for ESLint. Revisit when typescript-eslint ships TS 7
  support; `npm install -D typescript@latest` will fail the lint step until
  then.
