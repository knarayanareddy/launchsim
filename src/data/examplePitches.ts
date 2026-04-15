export const EXAMPLE_PITCHES = {
  ecommerce: `ShopFlow is an AI-powered e-commerce optimization platform that helps DTC brands increase conversion rates by 30%. We analyze every step of the buyer journey — from ad click to checkout — and surface the exact friction points costing you revenue.

Our smart recommendations engine A/B tests pricing, copy, and layout changes automatically. Integrates with Shopify, WooCommerce, and BigCommerce in one click.

Pricing: $49/mo for Starter, $149/mo for Growth, $399/mo for Enterprise.
Target: DTC brands doing $50K-$5M in monthly revenue.`,

  aidev: `CodePilot AI is a developer productivity suite that goes beyond autocomplete. It understands your entire codebase, your team's coding patterns, and your architecture decisions to suggest not just code — but better engineering choices.

Features: PR review automation, tech debt scoring, architecture diagram generation, and "what if" refactoring simulations. Works with VS Code, JetBrains, and Neovim.

Pricing: Free for solo devs, $19/seat/mo for teams, $49/seat/mo for enterprise.
Target: Engineering teams of 5-100 developers at Series A+ startups.`,

  analytics: `MetricStream is a real-time analytics platform built for product teams who are tired of waiting for data engineering. Connect your app, define events in plain English, and get dashboards in minutes — not sprints.

Key differentiator: Natural language query builder. Ask "show me users who signed up last week and haven't completed onboarding" and get an instant cohort with retention curves.

Pricing: $99/mo up to 10M events, $299/mo up to 100M events.
Target: Product managers and growth leads at B2B SaaS companies.`,
};

export type ExampleKey = keyof typeof EXAMPLE_PITCHES;
