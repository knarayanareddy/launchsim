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
9. [Edge Functions](#edge-functions)
10. [Design System](#design-system)
11. [Key User Flows](#key-user-flows)
12. [Deployment](#deployment)
13. [Roadmap](#roadmap)

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
| **Framework** | React 18 + Vite 5 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v3 + shadcn/ui |
| **Animation** | Framer Motion |
| **Charts** | Recharts |
| **Routing** | React Router v6 |
| **State / Data** | TanStack Query + React Context |
| **Backend** | Lovable Cloud (Supabase: Postgres, Auth, Edge Functions, Storage) |
| **AI** | Lovable AI Gateway (Google Gemini 2.5 Flash) |
| **Email** | Resend (via `send-email` edge function) |
| **Testing** | Vitest |

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

**Fallback path**: If the AI gateway fails or times out, the edge function returns `{ usingMockData: true }` and the frontend gracefully falls back to mock data with a visible **"Demo Mode"** indicator.

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
│   │   ├── simulationService.ts  # DB persistence helpers
│   │   ├── pdfExport.ts          # Report → PDF
│   │   └── apiErrors.ts
│   ├── pages/                    # Route-level components
│   │   ├── Index.tsx             # Landing page
│   │   ├── Studio.tsx            # Pitch input
│   │   ├── Simulation.tsx        # Live theater
│   │   ├── Results.tsx           # Report
│   │   ├── Personas.tsx          # Persona Studio
│   │   ├── Dashboard.tsx
│   │   ├── Admin.tsx             # Hidden admin panel
│   │   └── ...
│   ├── integrations/supabase/    # Auto-generated client + types
│   ├── index.css                 # Design tokens (HSL)
│   └── main.tsx
├── supabase/
│   ├── config.toml
│   ├── migrations/               # SQL migrations
│   └── functions/
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

### Local development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

The `.env` file is auto-generated by Lovable Cloud and contains:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

> ⚠️ Never edit `.env`, `src/integrations/supabase/client.ts`, or `src/integrations/supabase/types.ts` manually — they are regenerated automatically.

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend `.env` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend `.env` | Anon/publishable key |
| `LOVABLE_API_KEY` | Edge Function secret | Auth for Lovable AI Gateway |
| `RESEND_API_KEY` | Edge Function secret | Outbound email |
| `NOTION_API_KEY` | Edge Function secret | Notion export integration |

---

## Database Schema

All tables live in the `public` schema and are protected by Row Level Security.

### `profiles`
Mirrors `auth.users`. Stores credits, plan tier, referral code, admin flag, onboarding state, and email preferences.

### `simulations`
One row per simulation run. Stores the pitch, settings, full AI result (score, sentiment, objections, strengths, sharpened pitch, agent posts), and an optional `share_token` for public sharing.

### `agents`
Individual persona reactions linked to a simulation via `simulation_id`.

### `custom_personas`
User-built personas with the full 8-dimension personality matrix, knowledge tags, voice settings, and backstory. RLS allows users to read their own + any `is_public = true` personas.

### `simulation_groups`
Groups multiple simulations of the same product to track score deltas across iterations.

### `referral_events`
Tracks who referred whom and whether the credit reward was awarded.

### Functions
- `is_admin(user_id)` — security-definer function used in RLS policies and route guards.

---

## Edge Functions

All edge functions live under `supabase/functions/` and deploy automatically.

### `run-simulation`
The core AI engine. Accepts product description + simulation config, calls Gemini 2.5 Flash through the Lovable AI Gateway with a strict JSON schema, persists the result, decrements credits, and returns the full report. Falls back to `usingMockData: true` on any failure.

### `notion-export`
Takes a `simulation_id` and exports a formatted report to the user's Notion workspace.

### `process-referral`
Validates a referral code at signup, awards +3 credits to the referrer and +1 bonus to the referee, and logs the event.

### `send-email`
Transactional email sender (Resend) for welcome emails, simulation-complete notifications, and referral rewards.

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
On `/results` → **Share** → public URL with `share_token` → recipients view the full read-only report

### 4. Refer a Friend
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

- [ ] Streaming agent reactions (Server-Sent Events from edge function)
- [ ] AI-generated sample reactions in the Persona Builder preview
- [ ] Custom persona selection in the Studio audience mix
- [ ] Public persona marketplace with upvoting
- [ ] Slack & Discord integrations for sharing reports
- [ ] Multi-language pitch support

---

## License

Proprietary. © LaunchSim. All rights reserved.
