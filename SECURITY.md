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
token is 8 hex characters — treat it as a bearer capability: anyone with the
link can read that one report.

### Verifying policies

Policy mistakes are invisible until someone exploits them. `supabase/tests/`
contains executable assertions for every guarantee above; run them before
merging a migration. One trap worth remembering: `REVOKE ALL ... FROM PUBLIC`
leaves Supabase's default grants to `anon`/`authenticated` intact, so privileged
functions must also be revoked from those roles explicitly.

### Known gaps

- **No payment provider.** Upgrades are manual; `/pricing` does not take cards.
- **Rate limiting is per-request only.** `run-simulation` validates input size
  but there is no per-user request throttle yet — a user with credits can issue
  requests back to back. Put a gateway limit in front before scaling.
- **CSP is not configured.** Consider adding a `Content-Security-Policy` header
  at the hosting layer.
