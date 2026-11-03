# LaunchSim

> **Simulate Your Product Launch Before You Ship.**
>
> LaunchSim is a swarm-intelligence simulation engine that puts your product pitch in front of a virtual crowd of AI personas — skeptics, advocates, pragmatists, and analysts — and gives you brutally honest, context-aware feedback before a single real user sees it.

---

## Table of Contents

1. [What is LaunchSim?](#what-is-launchsim)
2. [Core Features](#core-features)
3. [Tech Stack](#tech-stack)
4. [Architecture Overview](#architecture-overview)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [Database Schema](#database-schema)
9. [Security model](#security-model)
10. [Edge Functions](#edge-functions)
11. [Testing](#testing)
12. [Design System](#design-system)
13. [Key User Flows](#key-user-flows)
14. [Deployment](#deployment)
15. [Roadmap](#roadmap)

---

## What is LaunchSim?

LaunchSim solves a painful problem for founders, PMs, and indie hackers: **you don't know how the market will react to your pitch until you ship — and by then, it's expensive to be wrong.**

LaunchSim runs your product description through a swarm of AI-generated personas that mimic real-world reactions on platforms like Twitter and Reddit. Each persona has its own personality matrix, domain expertise, communication style, and biases. The output is a full simulated launch report:

- A **0–100 launch readiness score** with rationale
- **Sentiment breakdown** (excited / skeptical / neutral / hostile)
- **Top objections and strengths** specific to *your* product
- An **AI-sharpened version** of your pitch with explanations
- A live **debate feed** showing personas arguing with each other
- **Recommended next steps** based on what the swarm pushed back on

Think *Bloomberg Terminal meets Product Hunt* — cinematic, data-dense, and unapologetically opinionated.

---

## Core Features

### 🎬 The Simulation Theater
A live, animated experience where 12+ AI personas appear one by one, post their reactions, and debate each other in real time. Powered by Google Gemini through the Lovable AI Gateway.

### 📊 Results Dashboard
Multi-tab report with:
- **Overview** — score, rationale, sentiment donut, persona breakdown
- **Objections** — categorized pushback with specific agents who raised it
- **Strengths** — what the room loved, ranked by agent count
- **Refined Pitch** — side-by-side original vs. AI-sharpened version
- **Agent Feed** — full debate transcript

### 🧬 Persona Studio (`/personas`)
A fully-featured persona builder where users can craft custom simulated users beyond the 8 default archetypes:
- 6-section builder (Identity, Personality Matrix, Type & Archetype, Knowledge, Voice, Backstory)
- Live preview with an animated **8-axis radar chart**
- Community Library to share and remix personas
- Free plan: 5 personas · Pro/Unlimited: unlimited

### 🔁 Comparison Mode
Run the same pitch through different audience mixes or compare iterations of your pitch side-by-side.

### 📚 Wiki & Reports
Persistent, shareable simulation reports with public share tokens for posting on Twitter or sending to investors.

### 🎁 Referral System
Every user gets a unique referral code. Referrers earn +3 simulation credits per signup; referred users get +1 bonus credit.

### 🛡️ Hidden Admin Dashboard (`/admin`)
Gated by `profiles.is_admin`. Includes user management, simulation analytics, error logs, feature flags, and a maintenance-mode toggle.

### 📤 Notion Export
One-click export of any simulation report into a Notion page via the `notion-export` edge function.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + Vite 8 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v3 + shadcn/ui |
| **Animation** | Framer Motion |
| **Charts** | Recharts |
| **Routing** | React Router v7 |
| **State / Data** | TanStack Query + React Context |
| **Backend** | Lovable Cloud (Supabase: Postgres, Auth, Edge Functions, Storage) |
| **AI** | Lovable AI Gateway (Google Gemini 2.5 Flash) |
| **Email** | Resend (via `send-email` edge function) |
| **Testing** | Vitest 5 + Testing Library |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    React + Vite (SPA)                    │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │
│  │   Studio   │→ │ Simulation │→ │     Results      │   │
│  └────────────┘  └─────┬──────┘  └──────────────────┘   │
│                        │                                  │
│                        ▼                                  │
│              useSimulation() hook                         │
└────────────────────────┬─────────────────────────────────┘
                         │ supabase.functions.invoke
                         ▼
┌──────────────────────────────────────────────────────────┐
│           Supabase Edge Function: run-simulation         │
│  1. Build system + user prompts from inputs              │
│  2. Call Lovable AI Gateway (Gemini 2.5 Flash)           │
│  3. Parse JSON response                                  │
│  4. Persist to `simulations` + `agents` tables           │
│  5. Decrement profiles.credits_remaining                 │
│  6. Return result + simulation_id + share_token          │
└────────────────────────┬─────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────┐
│                    Supabase Postgres                     │
│  profiles · simulations · agents · custom_personas       │
│  referral_events · simulation_groups                     │
│  All tables protected by Row Level Security (RLS)        │
└──────────────────────────────────────────────────────────┘
```

**Fallback path**: If the AI gateway fails, the edge function **refunds the credit** and returns an error. The frontend falls back to mock data with a visible **"Demo Mode"** indicator, and demo results are **never persisted** to the database. Hard failures (out of credits, suspended account, unauthenticated) show an actionable error instead of demo data.

---

## Project Structure

```
launchsim/
├── public/                       # Static assets, robots.txt, sitemap
├── src/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives
│   │   ├── dashboard/            # Sidebar, layout shells
│   │   ├── personas/             # Persona Builder + types
│   │   ├── results/              # Results page tabs
│   │   ├── simulation/           # Theater (AgentGrid, LiveFeed, etc.)
│   │   ├── settings/             # Referral, account components
│   │   ├── studio/               # Pitch input + simulation config
│   │   ├── HeroSection.tsx       # Landing hero (terminal-style)
│   │   ├── CapabilitiesSection.tsx
│   │   ├── PersonaShowcase.tsx
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.tsx       # Supabase auth wrapper
│   ├── data/                     # Mock data for demo mode
│   ├── hooks/
│   │   └── useSimulation.ts      # Core AI invocation hook
│   ├── lib/
│   │   ├── config.ts             # App URL, plan resolution, pricing matrix
│   │   ├── simulationService.ts  # DB persistence + sharing
│   │   ├── errorReporting.ts     # Client errors → public.error_logs
│   │   ├── pdfExport.ts          # Report → PDF
│   │   └── apiErrors.ts
│   ├── pages/                    # Route-level components (all lazy-loaded)
│   │   ├── Index.tsx             # Landing page
│   │   ├── Pricing.tsx           # Public pricing
│   │   ├── Studio.tsx            # Pitch input
│   │   ├── Simulation.tsx        # Live theater
│   │   ├── Results.tsx           # Report
│   │   ├── Personas.tsx          # Persona Studio
│   │   ├── Dashboard.tsx
│   │   ├── Admin.tsx             # Hidden admin panel
│   │   └── ...
│   ├── integrations/supabase/    # Auto-generated client + types
│   ├── test/                     # Vitest suites + fake Supabase client
│   ├── index.css                 # Design tokens (HSL)
│   └── main.tsx
├── supabase/
│   ├── config.toml
│   ├── migrations/               # SQL migrations
│   └── functions/
│       ├── _shared/cors.ts       # Shared CORS origin allowlist + validation
│       ├── run-simulation/       # Core AI engine
│       ├── notion-export/        # Notion integration
│       ├── process-referral/     # Referral credit logic
│       └── send-email/           # Transactional emails
├── tailwind.config.ts
└── vite.config.ts
```

---

## Getting Started

LaunchSim is built on **Lovable Cloud**, so the backend (Postgres, Auth, Edge Functions) is provisioned automatically — no separate Supabase account needed.

### Prerequisites

- **Node.js 22.12+** (see `engines` in `package.json`; `.nvmrc` pins 22) —
  Vitest 5 and ESLint 10 require it
- **npm 10+** — this repo uses **npm only**. `bun.lock` was removed because
  maintaining two lockfiles meant `npm ci` silently drifted out of sync and
  failed for anyone not using Bun.

### Local development

```bash
npm ci                  # install exactly what the lockfile pins
npm run dev             # http://localhost:8080

npm run typecheck       # tsc --noEmit (app + node configs)
npm run lint            # eslint
npm run test            # vitest (single run)
npm run test:watch      # vitest watch mode
npm run build           # production bundle
npm run check           # typecheck + lint + test — run this before pushing
```

### Environment

Copy `.env.example` to `.env` and fill in your Supabase project values.
`.env` is **gitignored** and must never be committed.

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_APP_URL=http://localhost:8080
```

> The anon/publishable key is safe to expose **only** because Row Level Security
> is correct. See [Security model](#security-model) before loosening any policy.

### Backend (optional, for full parity)

```bash
supabase start                  # local Postgres + Auth + Storage on :54321
supabase db reset               # apply supabase/migrations/*.sql
supabase functions serve run-simulation --env-file supabase/.env.local
```

Edge-function secrets (`LOVABLE_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`,
`APP_URL`, `ALLOWED_ORIGINS`) are set with `supabase secrets set` — never in the
repo. Locally, put them in `supabase/.env.local` (gitignored).

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend `.env` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend `.env` | Anon/publishable key (public) |
| `VITE_SUPABASE_PROJECT_ID` | Frontend `.env` | Project ref |
| `VITE_APP_URL` | Frontend `.env` | Public origin for canonicals + referral links. Falls back to `window.location.origin`. |
| `LOVABLE_API_KEY` | Edge secret | Auth for Lovable AI Gateway |
| `RESEND_API_KEY` | Edge secret | Outbound email |
| `EMAIL_FROM` | Edge secret | Verified Resend sender. Defaults to the Resend sandbox address. |
| `APP_URL` | Edge secret | Origin embedded in email links |
| `ALLOWED_ORIGINS` | Edge secret | Extra CORS origins (comma separated). `localhost` is always allowed. |

There is **no `NOTION_API_KEY`**: the Notion integration uses a token supplied by
the user at export time (see below).

---

## Database Schema

All tables live in the `public` schema and are protected by Row Level Security.
Schema changes are versioned SQL in `supabase/migrations/`; the security
hardening pass lives in `20261103090000_security_hardening.sql`.

### `profiles`
Mirrors `auth.users`. Stores credits, plan tier, referral code, admin flag,
onboarding state, and email preferences.

**Column-level grants:** RLS cannot restrict *columns*, so `authenticated` only
holds table `SELECT` plus `UPDATE` on
`(full_name, avatar_url, email_prefs, onboarding_completed, user_type)`.
`plan_tier`, `credits_remaining`, `is_admin`, `is_suspended`, `referral_code`
and `total_referrals` are writable **only** by the service role. Before this,
any signed-in user could PATCH their own row and become an admin.

### `simulations`
One row per simulation run. `share_token` is `NULL` until the owner explicitly
shares the report, and reading it requires the `get_shared_simulation(token)`
RPC. Unshared reports are visible to their owner only.

### `agents`
Individual persona reactions linked to a simulation via `simulation_id`. Both
read and write require ownership of the parent simulation.

### `custom_personas`
User-built personas with the 8-dimension personality matrix. RLS allows reading
your own plus any `is_public = true` persona; writes are owner-scoped with
`WITH CHECK`. `industry` is `text[]`.

### `simulation_groups`
Groups simulations of the same product to track `score_delta` across iterations.
`user_id` defaults to `auth.uid()`. Written by `simulationService.attachToGroup`.

### `referral_events`
Tracks who referred whom. Insert is **service-role only**; awards happen through
the `award_referral(referrer, referred)` function so the ledger row and both
credit updates commit atomically.

### Operational tables
`feature_flags`, `system_settings`, `error_logs`. Readable by authenticated
users; written by admins (`error_logs` additionally accepts a user's own error
reports, which is what `src/lib/errorReporting.ts` does).

### Functions
| Function | Caller | Purpose |
|---|---|---|
| `is_admin(user_id)` | SQL only | Backs admin RLS policies. Not executable by `anon`. |
| `spend_credit(user_id)` | service role | Atomic conditional decrement; returns `false` when out of credits. |
| `refund_credit(user_id)` | service role | Reverses a failed run. |
| `share_simulation(id)` | authenticated | Mints/reuses a share token; ownership enforced. |
| `get_shared_simulation(token)` | anon + authenticated | Token-scoped read of one shared report. |
| `award_referral(referrer, referred)` | service role | Transactional +3 / +1 credit award. |

---

## Security model

- **Edge functions authenticate every caller.** `run-simulation`,
  `process-referral`, `send-email` and `notion-export` verify the JWT themselves
  (or accept the service-role key for internal calls) — anon access is rejected.
- **Credits are enforced server-side.** A credit is spent atomically *before* the
  AI call and refunded on any failure. The Studio pre-check is a convenience.
- **CORS is an allowlist.** `supabase/functions/_shared/cors.ts` reflects only
  configured origins plus localhost. There is no `Access-Control-Allow-Origin: *`.
- **Share links are opt-in.** A report is private until the owner clicks Share.
- **Errors are redacted.** 500 responses never return internal messages; details
  go to function logs only.
- **Notion tokens are never stored.** The user supplies their integration token
  per export; it is held in component state only and cleared after the request.
  The report is loaded server-side from the caller's own simulations, so only the
  `simulationId` crosses the wire.

---

## Edge Functions

All edge functions live under `supabase/functions/` and deploy automatically.
Shared helpers (CORS allowlist, input clamping, HTML escaping, redacted errors)
live in `supabase/functions/_shared/cors.ts`.

### `run-simulation`
The core AI engine. Requires an authenticated, non-suspended user; validates and
clamps every input (`productDescription` ≤ 4000 chars, `crowdSize` 10–1000,
audience mix restricted to known values); spends a credit atomically before
calling Gemini 2.5 Flash through the Lovable AI Gateway; persists the result and
refunds the credit on any failure.

### `notion-export`
Requires the **Unlimited** plan. Body: `{ notionToken, parentPageId,
simulationId, title?, recommendedActions? }`. It loads the report server-side
from the caller's own `simulations` row, validates the token shape, and clamps
every string to Notion's 2000-character `rich_text` limit.

### `process-referral`
Validates a referral code for the signed-in caller and delegates to
`award_referral` (+3 to the referrer, +1 to the referee) in one transaction.
Self-referral and duplicate awards are rejected in SQL as well as in the handler.

### `send-email`
Transactional email sender (Resend). Callable by the service role, or by a
signed-in user for **their own** `welcome` email only. `simulation-complete` and
`low-credits` honour `profiles.email_prefs`. User-supplied strings are
HTML-escaped before interpolation.

---

## Testing

```bash
npm run test               # 31 tests across 3 suites
npm run test:coverage      # with v8 coverage
```

| Suite | Covers |
|---|---|
| `src/test/simulationService.test.ts` | Demo-data suppression, agent persistence, iteration groups, sharing RPCs, row normalisation |
| `src/test/edgeHelpers.test.ts` | CORS allowlist, input clamping, HTML escaping, env-free helpers |
| `src/test/config.test.ts` | Plan resolution (fails closed) and pricing matrix |

`src/test/fakes.ts` provides a chainable fake of the Supabase client, so service
code can be tested without a live project.

### Database tests

Migrations are validated against a real PostgreSQL engine, so you don't need
Docker or the Supabase CLI:

```bash
pip install pgserver          # ships a PostgreSQL binary as a wheel
cd supabase/tests
python3 verify_migrations.py  # applies every migration + asserts schema invariants
python3 security_test.py      # 37 RLS/grant assertions as anon + authenticated
```

`verify_migrations.py` catches statements that don't apply; `security_test.py`
proves the guarantees hold by attempting the attacks the hardening was meant to
stop (self-promotion to admin, minting credits, reading someone else's pitch,
double-awarding referrals, and so on). Both run in CI on any change under
`supabase/`.

`supabase/tests/bootstrap.sql` recreates the parts of a Supabase database these
tests depend on (the `anon`/`authenticated`/`service_role` roles, `auth.uid()`,
`storage.*`, and Supabase's default table/function grants).

> **Why not `supabase db reset`?** It needs Docker. `pgserver` needs neither
> Docker nor a system Postgres, which makes the checks runnable anywhere,
> including CI and sandboxes. Run the real `supabase db reset` too if you have it.

### Adding a migration

1. Create `supabase/migrations/<timestamp>_<name>.sql`.
2. Add/adjust RLS policies **and** the column grants in the same file — a policy
   alone does not stop a client from writing columns it can `UPDATE`.
3. Regenerate `src/integrations/supabase/types.ts` if the schema changed.
4. Revoke new privileged functions from the API roles **by name**
   (`REVOKE ALL ON FUNCTION f() FROM PUBLIC, anon, authenticated;`).
   `FROM PUBLIC` alone does not remove Supabase's explicit default grant.
5. Run `npm run check` **and** the two scripts in `supabase/tests/`.

---

## Design System

LaunchSim's visual identity is **dark, cinematic, and technical** — Bloomberg Terminal meets Product Hunt.

### Palette (HSL semantic tokens in `src/index.css`)

| Token | Value | Use |
|---|---|---|
| `--background` | Deep navy `#0A0F1E` | App background |
| `--primary` | Electric blue `#4F8EF7` | CTAs, accents |
| `--success` | Green `#2ED573` | Live AI / advocate |
| `--warning` | Amber `#F5A623` | Demo mode / pragmatist |
| `--destructive` | Red `#FF4757` | Errors / skeptic |
| Teal accent | `#00D4AA` | Analyst persona, secondary highlights |

### Typography
- **Inter** for UI
- **JetBrains Mono** for code, agent posts, data, and timestamps

### Conventions
- `rounded-xl` for cards, `rounded-full` for pills
- Card surface: `rgba(255,255,255,0.04)` with `rgba(255,255,255,0.08)` border
- Subtle glow shadows using accent colors at low opacity
- **Always** use semantic tokens — never hard-coded colors in components
- All animations via Framer Motion, deliberate over decorative
- Mobile-first responsive

---

## Key User Flows

### 1. Run a Simulation
`/studio` → enter product description + question → configure crowd size, audience mix, platform → **Run Simulation** → `/simulation` (live theater) → `/results` (full report)

### 2. Build a Custom Persona
`/personas` → **Build New Persona +** → fill 6 sections with live radar preview → **Save Persona** → use in next simulation

### 3. Share a Report
On `/results` → **Share** → `share_simulation` mints a token (once) → public URL
`/wiki/:token` → recipients view a read-only report via `get_shared_simulation`.

### 4. Reopen a Saved Report
`/results/:id` loads the report from the database. The completion email and the
admin panel both link here directly.

### 5. Refer a Friend
`/settings` → copy referral link → friend signs up → both accounts auto-credited

---

## Deployment

LaunchSim is deployed via **Lovable**.

- **Preview**: every change is live at the project preview URL
- **Production**: published to [launchsim.lovable.app](https://launchsim.lovable.app)
- **Custom domain**: configurable from the Lovable project settings

Edge functions deploy automatically on save. Database changes are applied through versioned SQL migrations in `supabase/migrations/`.

---

## Roadmap

- [x] Self-serve pricing page (`/pricing`) — checkout still manual
- [x] Deep links to saved reports (`/results/:id`)
- [x] Server-enforced credits with automatic refunds
- [x] Row-level security hardening + column grants
- [ ] Self-serve billing / payment provider integration
- [ ] Streaming agent reactions (Server-Sent Events from edge function)
- [ ] AI-generated sample reactions in the Persona Builder preview
- [ ] Custom persona selection in the Studio audience mix
- [ ] Public persona marketplace with upvoting
- [ ] Slack & Discord integrations for sharing reports
- [ ] Multi-language pitch support

---

## License

Proprietary. © LaunchSim. All rights reserved.
