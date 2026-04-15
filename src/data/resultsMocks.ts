export const SENTIMENT_BY_AUDIENCE = [
  { audience: "Founders", excited: 52, skeptical: 30, neutral: 18, hostile: 0 },
  { audience: "PMs", excited: 28, skeptical: 55, neutral: 12, hostile: 5 },
  { audience: "Developers", excited: 20, skeptical: 40, neutral: 25, hostile: 15 },
  { audience: "Early Adopters", excited: 68, skeptical: 20, neutral: 12, hostile: 0 },
  { audience: "Skeptics", excited: 5, skeptical: 45, neutral: 15, hostile: 35 },
];

export const TOP_OBJECTIONS = [
  { id: 1, text: "ICP is unclear — targeting both solo founders and enterprise teams dilutes the message", agents: 47, category: "Positioning", quote: "The ICP is blurry. Are you selling to solo founders or product teams? The messaging tries to serve both and lands on neither.", agent: "Quinn B.", role: "Head of GTM", badge: "pragmatist" as const, badgeEmoji: "🟡", emoji: "🎯" },
  { id: 2, text: "No proof points or case studies — hard to justify switching costs", agents: 44, category: "Trust", quote: "Every tool promises 'insights in minutes.' I've been burned before. Show me a case study or I'm out.", agent: "Jordan K.", role: "Serial Skeptic", badge: "skeptic" as const, badgeEmoji: "🔴", emoji: "😤" },
  { id: 3, text: "Pricing strategy feels undercooked at $29/mo vs established competitors", agents: 38, category: "Pricing", quote: "The pricing strategy feels undercooked. $29/mo competes with tools that have 3-year head starts. What's the land-and-expand story?", agent: "Riley A.", role: "Growth Analyst", badge: "analyst" as const, badgeEmoji: "🔵", emoji: "📊" },
  { id: 4, text: "Missing API/integration story — kills engineering buy-in", agents: 31, category: "Technical", quote: "Does this have an API? Because if I can't integrate it into my CI/CD pipeline the PM team will never get buy-in from engineering.", agent: "Priya S.", role: "Dev Advocate", badge: "skeptic" as const, badgeEmoji: "🔴", emoji: "👩‍💻" },
  { id: 5, text: "No mention of data security or compliance (SOC2/GDPR)", agents: 28, category: "Technical", quote: "SOC2 compliance? GDPR? Our legal team will ask on day one. If the answer is no, this is a no-go for us.", agent: "Morgan L.", role: "Enterprise Buyer", badge: "pragmatist" as const, badgeEmoji: "🟡", emoji: "🏢" },
  { id: 6, text: "Unclear how simulated feedback correlates with real user behavior", agents: 26, category: "Trust", quote: "Serious question: how do you validate that simulated feedback correlates with actual user behavior?", agent: "Avery L.", role: "PM @ Big Tech", badge: "skeptic" as const, badgeEmoji: "🔴", emoji: "🤔" },
  { id: 7, text: "Defensibility concern — what stops OpenAI from adding this?", agents: 24, category: "Positioning", quote: "The defensibility question is key. What stops OpenAI from adding a 'simulate audience' feature to ChatGPT next quarter?", agent: "Alex R.", role: "VC Partner", badge: "pragmatist" as const, badgeEmoji: "🟡", emoji: "💰" },
  { id: 8, text: "Onboarding story is missing — zero to first insight path unclear", agents: 22, category: "Technical", quote: "The core value prop is solid but the onboarding story is missing. How do I get from zero to first insight in under 5 minutes?", agent: "Marcus C.", role: "Senior PM", badge: "pragmatist" as const, badgeEmoji: "🟡", emoji: "🧑‍💼" },
  { id: 9, text: "GPT wrapper perception — what's novel about this?", agents: 19, category: "Positioning", quote: "Another wrapper? What's actually novel here?", agent: "Priya S.", role: "Dev Advocate", badge: "skeptic" as const, badgeEmoji: "🔴", emoji: "👩‍💻" },
  { id: 10, text: "Missing enterprise features — SSO, audit logs, team management", agents: 16, category: "Technical", quote: "Enterprise deal-breaker checklist: SSO ❌ SOC2 ❓ GDPR ❓ — need answers before I can bring this to procurement.", agent: "Morgan L.", role: "Enterprise Buyer", badge: "pragmatist" as const, badgeEmoji: "🟡", emoji: "🏢" },
  { id: 11, text: "Unclear differentiation from asking 5 real customers", agents: 14, category: "Trust", quote: "How is this different from just... asking 5 customers? Genuine question.", agent: "Avery L.", role: "PM @ Big Tech", badge: "skeptic" as const, badgeEmoji: "🔴", emoji: "🤔" },
  { id: 12, text: "Unit economics at $29/mo don't pencil out vs CAC", agents: 12, category: "Pricing", quote: "Running some quick numbers: at $29/mo with 10% monthly churn, LTV is ~$290. CAC needs to stay under $100 for this to work.", agent: "Riley A.", role: "Growth Analyst", badge: "analyst" as const, badgeEmoji: "🔵", emoji: "📊" },
];

export const TOP_STRENGTHS = [
  { id: 1, text: "'Before you ship' framing — selling insurance not software", agents: 67, category: "Positioning", quote: "Positioning is clean. The 'before you ship' framing is smart — it's selling insurance not software.", agent: "Casey P.", role: "Indie Founder", badge: "advocate" as const, badgeEmoji: "🟢", emoji: "🚀" },
  { id: 2, text: "Core value prop is immediately clear", agents: 52, category: "Clarity", quote: "Clean positioning. I get it in 5 seconds.", agent: "Casey P.", role: "Indie Founder", badge: "advocate" as const, badgeEmoji: "🟢", emoji: "🚀" },
  { id: 3, text: "Strong market timing with AI validation wave", agents: 41, category: "Market", quote: "Market timing looks right.", agent: "Alex R.", role: "VC Partner", badge: "pragmatist" as const, badgeEmoji: "🟡", emoji: "💰" },
  { id: 4, text: "Clean, confidence-building aesthetic", agents: 38, category: "Design", quote: "Finally something that validates copy before A/B testing. My whole workflow shifts if this works as advertised.", agent: "Drew M.", role: "Product Designer", badge: "advocate" as const, badgeEmoji: "🟢", emoji: "👩‍🎨" },
  { id: 5, text: "Solves a pain point founders feel viscerally", agents: 35, category: "Problem-fit", quote: "This is the validation layer that's been missing from the build/measure/learn loop. Strong yes from me.", agent: "Blake W.", role: "Startup Advisor", badge: "advocate" as const, badgeEmoji: "🟢", emoji: "💡" },
  { id: 6, text: "Waitlist-worthy — immediate intent to sign up", agents: 31, category: "Demand", quote: "Signed up for the waitlist already. This is exactly what I needed before my Series A deck goes out.", agent: "Sam T.", role: "Early Adopter", badge: "advocate" as const, badgeEmoji: "🟢", emoji: "✅" },
  { id: 7, text: "Fills a real gap in the build/measure/learn loop", agents: 29, category: "Problem-fit", quote: "This is the validation layer that's been missing from the build/measure/learn loop.", agent: "Blake W.", role: "Startup Advisor", badge: "advocate" as const, badgeEmoji: "🟢", emoji: "💡" },
  { id: 8, text: "Strong emotional resonance with pre-launch anxiety", agents: 25, category: "Positioning", quote: "This is exactly what I needed before my Series A deck goes out.", agent: "Sam T.", role: "Early Adopter", badge: "advocate" as const, badgeEmoji: "🟢", emoji: "✅" },
];

export const AGENT_FEED_DATA = [
  { id: 1, emoji: "✅", name: "Sam T.", role: "Early Adopter", badge: "advocate" as const, badgeEmoji: "🟢", text: "First impression: this solves a real pain point. I've launched 3 products blind — never again.", upvotes: 23, downvotes: 2, replies: 3 },
  { id: 2, emoji: "😤", name: "Jordan K.", role: "Serial Skeptic", badge: "skeptic" as const, badgeEmoji: "🔴", text: "Cool concept but where's the proof? Anyone can spin up a GPT wrapper and call it 'swarm intelligence.'", upvotes: 18, downvotes: 7, replies: 5 },
  { id: 3, emoji: "🧑‍💼", name: "Marcus C.", role: "Senior PM", badge: "pragmatist" as const, badgeEmoji: "🟡", text: "Agreed with Jordan on needing proof, but disagree on the wrapper take. The persona layer adds real value.", upvotes: 14, downvotes: 1, replies: 0, isReply: true, replyTo: "Jordan K." },
  { id: 4, emoji: "🚀", name: "Casey P.", role: "Indie Founder", badge: "advocate" as const, badgeEmoji: "🟢", text: "The 'insurance for your launch' angle is genius. That's how I'd pitch this to other founders.", upvotes: 31, downvotes: 0, replies: 2 },
  { id: 5, emoji: "👩‍💻", name: "Priya S.", role: "Dev Advocate", badge: "skeptic" as const, badgeEmoji: "🔴", text: "No API docs anywhere on the site. If this stays a black box, engineering teams will never adopt it.", upvotes: 22, downvotes: 3, replies: 1 },
  { id: 6, emoji: "📊", name: "Riley A.", role: "Growth Analyst", badge: "analyst" as const, badgeEmoji: "🔵", text: "Running some quick numbers: at $29/mo with 10% monthly churn, LTV is ~$290. CAC needs to stay under $100 for this to work.", upvotes: 16, downvotes: 0, replies: 0 },
  { id: 7, emoji: "🎯", name: "Quinn B.", role: "Head of GTM", badge: "pragmatist" as const, badgeEmoji: "🟡", text: "Who is the buyer? The founder persona and the PM persona have totally different willingness-to-pay.", upvotes: 27, downvotes: 1, replies: 4 },
  { id: 8, emoji: "👩‍🎨", name: "Drew M.", role: "Product Designer", badge: "advocate" as const, badgeEmoji: "🟢", text: "From a UX perspective, seeing simulated reactions before writing final copy is a game-changer. Want this yesterday.", upvotes: 19, downvotes: 0, replies: 0 },
  { id: 9, emoji: "💰", name: "Alex R.", role: "VC Partner", badge: "pragmatist" as const, badgeEmoji: "🟡", text: "The defensibility question is key. What stops OpenAI from adding a 'simulate audience' feature to ChatGPT next quarter?", upvotes: 35, downvotes: 2, replies: 6 },
  { id: 10, emoji: "🤔", name: "Avery L.", role: "PM @ Big Tech", badge: "skeptic" as const, badgeEmoji: "🔴", text: "Serious question: how do you validate that simulated feedback correlates with actual user behavior?", upvotes: 28, downvotes: 1, replies: 3 },
  { id: 11, emoji: "🏢", name: "Morgan L.", role: "Enterprise Buyer", badge: "pragmatist" as const, badgeEmoji: "🟡", text: "Enterprise deal-breaker checklist: SSO ❌ SOC2 ❓ GDPR ❓ — need answers before I can bring this to procurement.", upvotes: 12, downvotes: 0, replies: 1 },
  { id: 12, emoji: "💡", name: "Blake W.", role: "Startup Advisor", badge: "advocate" as const, badgeEmoji: "🟢", text: "This fills the gap between 'I think users will love this' and 'I have data showing users will love this.' Massive unlock.", upvotes: 40, downvotes: 1, replies: 2 },
];

export const REFINED_PITCH = "LaunchSim helps early-stage founders and product teams simulate how specific user archetypes — PMs, developers, skeptics, and early adopters — will react to their product before launch. In under 60 seconds, you get a sentiment breakdown, ranked objections, and a sharpened pitch — so you ship with market intelligence, not just intuition.";

export const REFINED_CHANGES = "Changes made: Sharpened ICP, added social proof framing, clarified audience, added specificity to outcome";

export const RECOMMENDED_ACTIONS = [
  { emoji: "🎯", text: "Tighten your ICP — pick one: solo founders OR product teams" },
  { emoji: "📝", text: "Add 2-3 case studies or early customer quotes to address the trust gap" },
  { emoji: "💰", text: "Test a $49/mo price point with a clearer value ladder — 'unlimited simulations'" },
];
