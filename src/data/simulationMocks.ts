export interface MockAgent {
  id: number;
  emoji: string;
  name: string;
  role: string;
  company: string;
  badge: "skeptic" | "advocate" | "pragmatist" | "analyst";
  badgeEmoji: string;
  reaction: string;
  upvotes: number;
}

export interface FeedItem {
  id: number;
  agentId: number;
  agentName: string;
  agentEmoji: string;
  badge: MockAgent["badge"];
  badgeEmoji: string;
  text: string;
  upvotes: number;
  downvotes: number;
  replies: number;
  isReply?: boolean;
  replyTo?: string;
  timestamp: string;
}

export const MOCK_AGENTS: MockAgent[] = [
  { id: 1, emoji: "🧑‍💼", name: "Marcus C.", role: "Senior PM", company: "@ mid-stage B2B SaaS", badge: "pragmatist", badgeEmoji: "🟡", reaction: "The core value prop is solid but the onboarding story is missing. How do I get from zero to first insight in under 5 minutes?", upvotes: 34 },
  { id: 2, emoji: "👩‍💻", name: "Priya S.", role: "Dev Advocate", company: "@ developer tooling co.", badge: "skeptic", badgeEmoji: "🔴", reaction: "Does this have an API? Because if I can't integrate it into my CI/CD pipeline the PM team will never get buy-in from engineering.", upvotes: 28 },
  { id: 3, emoji: "💰", name: "Alex R.", role: "VC Partner", company: "@ early-stage fund", badge: "pragmatist", badgeEmoji: "🟡", reaction: "Market timing looks right. The question is whether you can build the data moat before a well-funded competitor does this in ChatGPT.", upvotes: 19 },
  { id: 4, emoji: "😤", name: "Jordan K.", role: "Serial Skeptic", company: "@ consumer tech", badge: "skeptic", badgeEmoji: "🔴", reaction: "Every tool promises 'insights in minutes.' I've been burned before. Show me a case study or I'm out.", upvotes: 41 },
  { id: 5, emoji: "✅", name: "Sam T.", role: "Early Adopter", company: "@ pre-seed startup", badge: "advocate", badgeEmoji: "🟢", reaction: "Signed up for the waitlist already. This is exactly what I needed before my Series A deck goes out.", upvotes: 67 },
  { id: 6, emoji: "🏢", name: "Morgan L.", role: "Enterprise Buyer", company: "@ Fortune 500", badge: "pragmatist", badgeEmoji: "🟡", reaction: "SOC2 compliance? GDPR? Our legal team will ask on day one. If the answer is no, this is a no-go for us.", upvotes: 15 },
  { id: 7, emoji: "🚀", name: "Casey P.", role: "Indie Founder", company: "@ bootstrapped SaaS", badge: "advocate", badgeEmoji: "🟢", reaction: "Positioning is clean. The 'before you ship' framing is smart — it's selling insurance not software.", upvotes: 52 },
  { id: 8, emoji: "📊", name: "Riley A.", role: "Growth Analyst", company: "@ Series B fintech", badge: "analyst", badgeEmoji: "🔵", reaction: "The pricing strategy feels undercooked. $29/mo competes with tools that have 3-year head starts. What's the land-and-expand story?", upvotes: 23 },
  { id: 9, emoji: "👩‍🎨", name: "Drew M.", role: "Product Designer", company: "@ design studio", badge: "advocate", badgeEmoji: "🟢", reaction: "Finally something that validates copy before A/B testing. My whole workflow shifts if this works as advertised.", upvotes: 38 },
  { id: 10, emoji: "🎯", name: "Quinn B.", role: "Head of GTM", company: "@ growth-stage startup", badge: "pragmatist", badgeEmoji: "🟡", reaction: "The ICP is blurry. Are you selling to solo founders or product teams? The messaging tries to serve both and lands on neither.", upvotes: 44 },
  { id: 11, emoji: "🤔", name: "Avery L.", role: "PM @ Big Tech", company: "@ FAANG", badge: "skeptic", badgeEmoji: "🔴", reaction: "How is this different from just... asking 5 customers? Genuine question.", upvotes: 31 },
  { id: 12, emoji: "💡", name: "Blake W.", role: "Startup Advisor", company: "@ advisory firm", badge: "advocate", badgeEmoji: "🟢", reaction: "This is the validation layer that's been missing from the build/measure/learn loop. Strong yes from me.", upvotes: 29 },
];

export const MOCK_FEED: FeedItem[] = [
  { id: 1, agentId: 5, agentName: "Sam T.", agentEmoji: "✅", badge: "advocate", badgeEmoji: "🟢", text: "First impression: this solves a real pain point. I've launched 3 products blind — never again.", upvotes: 23, downvotes: 2, replies: 3, timestamp: "just now" },
  { id: 2, agentId: 4, agentName: "Jordan K.", agentEmoji: "😤", badge: "skeptic", badgeEmoji: "🔴", text: "Cool concept but where's the proof? Anyone can spin up a GPT wrapper and call it 'swarm intelligence.'", upvotes: 18, downvotes: 7, replies: 5, timestamp: "10s ago" },
  { id: 3, agentId: 1, agentName: "Marcus C.", agentEmoji: "🧑‍💼", badge: "pragmatist", badgeEmoji: "🟡", text: "Agreed with Jordan on needing proof, but disagree on the wrapper take. The persona layer adds real value.", upvotes: 14, downvotes: 1, replies: 0, isReply: true, replyTo: "Jordan K.", timestamp: "15s ago" },
  { id: 4, agentId: 7, agentName: "Casey P.", agentEmoji: "🚀", badge: "advocate", badgeEmoji: "🟢", text: "The 'insurance for your launch' angle is genius. That's how I'd pitch this to other founders.", upvotes: 31, downvotes: 0, replies: 2, timestamp: "22s ago" },
  { id: 5, agentId: 2, agentName: "Priya S.", agentEmoji: "👩‍💻", badge: "skeptic", badgeEmoji: "🔴", text: "No API docs anywhere on the site. If this stays a black box, engineering teams will never adopt it.", upvotes: 22, downvotes: 3, replies: 1, timestamp: "30s ago" },
  { id: 6, agentId: 8, agentName: "Riley A.", agentEmoji: "📊", badge: "analyst", badgeEmoji: "🔵", text: "Running some quick numbers: at $29/mo with 10% monthly churn, LTV is ~$290. CAC needs to stay under $100 for this to work.", upvotes: 16, downvotes: 0, replies: 0, timestamp: "35s ago" },
  { id: 7, agentId: 10, agentName: "Quinn B.", agentEmoji: "🎯", badge: "pragmatist", badgeEmoji: "🟡", text: "Who is the buyer? The founder persona and the PM persona have totally different willingness-to-pay.", upvotes: 27, downvotes: 1, replies: 4, timestamp: "40s ago" },
  { id: 8, agentId: 9, agentName: "Drew M.", agentEmoji: "👩‍🎨", badge: "advocate", badgeEmoji: "🟢", text: "From a UX perspective, seeing simulated reactions before writing final copy is a game-changer. Want this yesterday.", upvotes: 19, downvotes: 0, replies: 0, isReply: true, replyTo: "Sam T.", timestamp: "45s ago" },
  { id: 9, agentId: 3, agentName: "Alex R.", agentEmoji: "💰", badge: "pragmatist", badgeEmoji: "🟡", text: "The defensibility question is key. What stops OpenAI from adding a 'simulate audience' feature to ChatGPT next quarter?", upvotes: 35, downvotes: 2, replies: 6, timestamp: "50s ago" },
  { id: 10, agentId: 11, agentName: "Avery L.", agentEmoji: "🤔", badge: "skeptic", badgeEmoji: "🔴", text: "Serious question: how do you validate that simulated feedback correlates with actual user behavior?", upvotes: 28, downvotes: 1, replies: 3, timestamp: "55s ago" },
  { id: 11, agentId: 6, agentName: "Morgan L.", agentEmoji: "🏢", badge: "pragmatist", badgeEmoji: "🟡", text: "Enterprise deal-breaker checklist: SSO ❌ SOC2 ❓ GDPR ❓ — need answers before I can bring this to procurement.", upvotes: 12, downvotes: 0, replies: 1, timestamp: "58s ago" },
  { id: 12, agentId: 12, agentName: "Blake W.", agentEmoji: "💡", badge: "advocate", badgeEmoji: "🟢", text: "This fills the gap between 'I think users will love this' and 'I have data showing users will love this.' Massive unlock.", upvotes: 40, downvotes: 1, replies: 2, timestamp: "1m ago" },
];

export const STATUS_MESSAGES = [
  "🧬 Generating 200 agent personas...",
  "🌐 Building knowledge graph from your pitch...",
  "💬 Agents are reading and reacting...",
  "🗣️ Debate is heating up — 47 replies so far...",
  "📊 Synthesizing emerging themes...",
  "✅ Simulation complete — generating your report...",
];

export const EMERGING_THEMES = [
  "💰 Pricing clarity",
  "🔗 Integrations",
  "🎯 ICP focus",
  "📈 Proof needed",
  "✅ Strong positioning",
];
