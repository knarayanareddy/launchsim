import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Save, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PersonaForm } from "./types";

const EMOJI_GRID = [
  "🧑‍💼","👩‍💼","🧑‍💻","👩‍💻","🧑‍🔬","👩‍🔬","🧑‍🎨","👩‍🎨",
  "💰","🚀","😤","✅","🏢","📊","🎯","💡",
  "🤔","😎","🧐","🥴","😤","🤯","🙄","😍",
  "🦈","🐂","🦅","🎪","🔥","⚡","🌊","🎭",
];

const JOB_CHIPS = ["PM","Dev","Designer","Founder","VC","CTO","Head of Growth","Data Analyst","Enterprise Buyer","Consultant","Agency Lead"];
const SENIORITY_OPTIONS = ["Intern","Junior","Mid-level","Senior","Lead","Director","VP","C-Suite","Founder"];
const COMPANY_TYPES = ["Pre-seed startup","Seed startup","Series A","Series B","Series C+","Public company","Enterprise (1000+)","Agency","Freelancer","VC Firm","Government","Non-profit"];
const INDUSTRY_OPTIONS = ["SaaS","Fintech","Healthcare","E-commerce","Dev Tools","Consumer","Enterprise Software","AI/ML","Crypto/Web3","Media","Education","Climate","Hardware","Cybersecurity"];
const COMPANY_SIZES = ["1","2-10","11-50","51-200","201-500","500+"];
const PERSONALITY_TYPES = [
  { id: "skeptic", label: "The Skeptic", emoji: "🔴", desc: "Assumes products are overhyped until proven otherwise. Will find the flaw in anything. Hard to impress.", color: "border-red-500/40 bg-red-500/10" },
  { id: "advocate", label: "The Advocate", emoji: "🟢", desc: "Gets excited about new ideas quickly. Champions innovation. Sees potential where others see risk.", color: "border-green-500/40 bg-green-500/10" },
  { id: "pragmatist", label: "The Pragmatist", emoji: "🟡", desc: "Needs to see real-world applicability. ROI-focused. Won't move without a business case.", color: "border-amber-500/40 bg-amber-500/10" },
  { id: "analyst", label: "The Analyst", emoji: "🔵", desc: "Data-driven and methodical. Asks hard technical questions. Needs proof, not promises.", color: "border-blue-500/40 bg-blue-500/10" },
];
const SECONDARY_TRAITS = ["Contrarian","Enthusiast","Perfectionist","Networker","Budget Guardian","Innovation Champion","Risk Manager","Status Quo Defender","Early Adopter","Trend Follower","Storyteller","Numbers Person"];
const DOMAIN_TAGS = ["Product Management","Software Engineering","Growth/Marketing","Sales","Finance","UX/Design","Data Science","Security","Legal/Compliance","Operations","Customer Success","DevOps","AI/ML","Blockchain","Mobile Dev","Cloud Infrastructure"];
const COMM_STYLES = [
  { id: "data-driven", label: "📊 Data-driven", desc: "Cites numbers and studies" },
  { id: "anecdotal", label: "💬 Anecdotal", desc: "Shares personal experiences" },
  { id: "blunt", label: "🗣️ Blunt", desc: "Says exactly what they think" },
  { id: "diplomatic", label: "🤝 Diplomatic", desc: "Softens criticism" },
  { id: "combative", label: "😤 Combative", desc: "Enjoys debate" },
  { id: "measured", label: "🧘 Measured", desc: "Considered, thoughtful" },
];
const VOCAB_LEVELS = [
  { id: "plain", label: "🏠 Plain English" },
  { id: "technical", label: "⚙️ Technical" },
  { id: "academic", label: "🎓 Academic" },
  { id: "casual", label: "😎 Casual" },
];
const POST_BEHAVIORS = [
  { id: "upvote-heavy", label: "⬆️ Upvote-heavy" },
  { id: "reply-heavy", label: "💬 Reply-heavy" },
  { id: "long-form", label: "📝 Long-form" },
  { id: "short-sharp", label: "🎯 Short and sharp" },
  { id: "thread-starter", label: "🌊 Thread-starter" },
];
const PITCHES_OPTIONS = ["Never","1-5","6-20","21-100","100+"];

const SLIDERS = [
  { key: "skepticism" as const, label: "Skepticism", emoji: "😤", low: "Open-minded", high: "Trust nothing" },
  { key: "tech_savviness" as const, label: "Tech Savviness", emoji: "💻", low: "Non-technical", high: "Deep technical" },
  { key: "price_sensitivity" as const, label: "Price Sensitivity", emoji: "💰", low: "Price blind", high: "Extremely frugal" },
  { key: "risk_tolerance" as const, label: "Risk Tolerance", emoji: "🎲", low: "Very conservative", high: "Risk hungry" },
  { key: "early_adopter_score" as const, label: "Early Adopter Score", emoji: "⚡", low: "Late majority", high: "First in line" },
  { key: "enterprise_mindset" as const, label: "Enterprise Mindset", emoji: "🏢", low: "Move fast", high: "Process everything" },
  { key: "influence_level" as const, label: "Influence Level", emoji: "📢", low: "Quiet observer", high: "Loud opinion leader" },
  { key: "domain_expertise_level" as const, label: "Domain Expertise", emoji: "🎯", low: "Generalist", high: "Deep specialist" },
];

interface Props {
  initial: PersonaForm;
  isNew: boolean;
  onSave: (form: PersonaForm) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

const Section = ({ title, emoji, children, defaultOpen = true }: { title: string; emoji: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted/20 transition-colors">
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="text-base">{emoji}</span> {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
};

const ChipSelect = ({ options, selected, onToggle, max }: { options: string[]; selected: string[]; onToggle: (v: string) => void; max?: number }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((opt) => {
      const active = selected.includes(opt);
      const disabled = !active && max !== undefined && selected.length >= max;
      return (
        <button
          key={opt}
          onClick={() => !disabled && onToggle(opt)}
          disabled={disabled}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
            active ? "bg-primary/15 border-primary/40 text-foreground" : disabled ? "opacity-30 cursor-not-allowed bg-muted/10 border-border text-muted-foreground" : "bg-muted/20 border-border text-muted-foreground hover:border-muted-foreground/40"
          }`}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

const toggleInArray = (arr: string[], item: string) =>
  arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

const RadarChart = ({ values }: { values: number[] }) => {
  const size = 220;
  const center = size / 2;
  const radius = 85;
  const labels = ["SKP","TCH","PRC","RSK","EAD","ENT","INF","DOM"];
  const n = 8;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (i: number, r: number) => {
    const angle = -Math.PI / 2 + i * angleStep;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = values.map((v, i) => getPoint(i, (v / 10) * radius));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[220px] mx-auto">
      {gridLevels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, radius * level));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
        return <path key={level} d={path} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />;
      })}
      {Array.from({ length: n }, (_, i) => {
        const p = getPoint(i, radius);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth="0.5" />;
      })}
      <path d={dataPath} fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="hsl(var(--primary))" />
      ))}
      {labels.map((label, i) => {
        const p = getPoint(i, radius + 16);
        return <text key={label} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[8px] font-mono">{label}</text>;
      })}
    </svg>
  );
};

const getSampleReaction = (form: PersonaForm): string => {
  const name = form.name || "This persona";
  if (form.personality_type === "skeptic" || form.skepticism >= 7) {
    return `"I've seen at least five tools pitch this exact thing in the last year. What's the actual moat here? And don't say 'AI-powered' — everyone says that. Show me retention numbers or a case study, not a landing page."`;
  }
  if (form.personality_type === "advocate" || form.early_adopter_score >= 7) {
    return `"Okay, this is actually interesting. Reminds me of what Linear did to Jira — take a bloated category and make it feel magical. I'd sign up for the beta today. Would love to see how this integrates with my existing stack."`;
  }
  if (form.enterprise_mindset >= 7) {
    return `"Before I even evaluate this, I need to know: SOC 2? SAML SSO? What's your data residency story? My procurement team won't look at anything without those boxes checked. Also, do you have a security whitepaper?"`;
  }
  return `"Interesting concept. The value prop is clear but I'd want to see how it performs at scale with a real team. What does onboarding look like? How long until we see ROI? I need to justify this to my CFO."`;
};

export default function PersonaBuilder({ initial, isNew, onSave, onCancel, saving }: Props) {
  const [form, setForm] = useState<PersonaForm>(initial);

  useEffect(() => setForm(initial), [initial]);

  const set = useCallback(<K extends keyof PersonaForm>(key: K, value: PersonaForm[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  }, []);

  const radarValues = [form.skepticism, form.tech_savviness, form.price_sensitivity, form.risk_tolerance, form.early_adopter_score, form.enterprise_mindset, form.influence_level, form.domain_expertise_level];

  const personalityMeta = PERSONALITY_TYPES.find((p) => p.id === form.personality_type);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h2 className="text-lg font-bold text-foreground">{isNew ? "Build New Persona" : "Edit Persona"}</h2>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground"><X className="w-5 h-5" /></button>
      </div>

      {/* Body: form + preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: form */}
        <ScrollArea className="flex-1 lg:w-[60%]">
          <div className="p-6 space-y-4 max-w-2xl">
            {/* Section 1: Identity */}
            <Section title="Identity" emoji="🎭">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Avatar Emoji</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_GRID.map((e, i) => (
                    <button key={`${e}-${i}`} onClick={() => set("emoji", e)}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${form.emoji === e ? "bg-primary/20 ring-2 ring-primary scale-110" : "hover:bg-muted/30"}`}
                    >{e}</button>
                  ))}
                </div>
                <div className="mt-2">
                  <Input value={form.emoji} onChange={(e) => set("emoji", e.target.value.slice(0, 2))} placeholder="Or type an emoji" className="w-32 bg-muted/20 border-border text-center text-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">First Name *</label>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Marcus" className="bg-muted/20 border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Last Initial</label>
                  <Input value={form.last_initial || ""} onChange={(e) => set("last_initial", e.target.value.slice(0, 2))} placeholder="C." className="bg-muted/20 border-border w-20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Age Range</label>
                  <Select value={form.age_range || ""} onValueChange={(v) => set("age_range", v)}>
                    <SelectTrigger className="bg-muted/20 border-border"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{["22-27","28-34","35-44","45-54","55+"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Pronouns</label>
                  <Select value={form.gender_presentation || ""} onValueChange={(v) => set("gender_presentation", v)}>
                    <SelectTrigger className="bg-muted/20 border-border"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{["He/Him","She/Her","They/Them","Unspecified"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Job Title *</label>
                <Input value={form.archetype} onChange={(e) => set("archetype", e.target.value)} placeholder="Senior Product Manager" className="bg-muted/20 border-border" />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {JOB_CHIPS.map(j => (
                    <button key={j} onClick={() => set("archetype", j)} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">{j}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Seniority</label>
                  <Select value={form.seniority || ""} onValueChange={(v) => set("seniority", v)}>
                    <SelectTrigger className="bg-muted/20 border-border"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{SENIORITY_OPTIONS.map(s => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Years of Experience: {form.years_experience}</label>
                  <Slider value={[form.years_experience]} onValueChange={([v]) => set("years_experience", v)} min={0} max={20} step={1} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Company Type</label>
                  <Select value={form.company_type || ""} onValueChange={(v) => set("company_type", v)}>
                    <SelectTrigger className="bg-muted/20 border-border"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{COMPANY_TYPES.map(s => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Company Size</label>
                  <Select value={form.company_size || ""} onValueChange={(v) => set("company_size", v)}>
                    <SelectTrigger className="bg-muted/20 border-border"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{COMPANY_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Industry (up to 3)</label>
                <ChipSelect options={INDUSTRY_OPTIONS} selected={form.industry || []} onToggle={(v) => set("industry", toggleInArray(form.industry || [], v))} max={3} />
              </div>
            </Section>

            {/* Section 2: Personality Matrix */}
            <Section title="Personality Matrix" emoji="🧠">
              <p className="text-xs text-muted-foreground">These 8 dimensions shape every reaction this persona gives</p>
              <div className="space-y-4">
                {SLIDERS.map((s) => (
                  <div key={s.key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-muted-foreground">{s.emoji} {s.label}</label>
                      <span className="text-xs font-mono text-foreground">{form[s.key]}/10</span>
                    </div>
                    <Slider value={[form[s.key]]} onValueChange={([v]) => set(s.key, v)} min={0} max={10} step={1} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span>{s.low}</span><span>{s.high}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Section 3: Personality Type */}
            <Section title="Personality Type" emoji="🎭">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PERSONALITY_TYPES.map((pt) => (
                  <button key={pt.id} onClick={() => set("personality_type", pt.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${form.personality_type === pt.id ? pt.color + " ring-1 ring-current" : "border-border/40 bg-muted/10 hover:border-border"}`}
                  >
                    <div className="text-lg mb-1">{pt.emoji} {pt.label}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{pt.desc}</p>
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Secondary Traits (up to 2)</label>
                <ChipSelect options={SECONDARY_TRAITS} selected={form.secondary_traits} onToggle={(v) => set("secondary_traits", toggleInArray(form.secondary_traits, v))} max={2} />
              </div>
            </Section>

            {/* Section 4: Knowledge */}
            <Section title="Knowledge & Context" emoji="📚" defaultOpen={false}>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Domain Expertise (up to 5)</label>
                <ChipSelect options={DOMAIN_TAGS} selected={form.domain_expertise_tags} onToggle={(v) => set("domain_expertise_tags", toggleInArray(form.domain_expertise_tags, v))} max={5} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tools They Use Daily</label>
                <Input value={(form.tools_used || []).join(", ")} onChange={(e) => set("tools_used", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="Notion, Linear, Figma, Slack" className="bg-muted/20 border-border text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Products They Love</label>
                <Input value={(form.products_loved || []).join(", ")} onChange={(e) => set("products_loved", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="Vercel, Stripe, Linear" className="bg-muted/20 border-border text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Products They Hate/Distrust</label>
                <Input value={(form.products_hated || []).join(", ")} onChange={(e) => set("products_hated", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="Jira, Salesforce" className="bg-muted/20 border-border text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Biggest Pain Points</label>
                <Textarea value={form.pain_points || ""} onChange={(e) => set("pain_points", e.target.value.slice(0, 200))} placeholder="Context switching between too many tools..." className="bg-muted/20 border-border text-sm h-20 resize-none" maxLength={200} />
                <p className="text-[10px] text-muted-foreground text-right mt-0.5">{(form.pain_points || "").length}/200</p>
              </div>
            </Section>

            {/* Section 5: Voice */}
            <Section title="Voice & Behavior" emoji="🗣️" defaultOpen={false}>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Communication Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {COMM_STYLES.map((cs) => (
                    <button key={cs.id} onClick={() => set("communication_style", cs.id)}
                      className={`px-3 py-2 rounded-lg border text-left text-xs transition-all ${form.communication_style === cs.id ? "bg-primary/10 border-primary/40 text-foreground" : "bg-muted/10 border-border text-muted-foreground hover:border-border/80"}`}
                    >
                      <div className="font-medium">{cs.label}</div>
                      <div className="text-[10px] mt-0.5 opacity-70">{cs.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Vocabulary Level</label>
                <div className="flex flex-wrap gap-2">
                  {VOCAB_LEVELS.map((vl) => (
                    <button key={vl.id} onClick={() => set("vocabulary_level", vl.id)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${form.vocabulary_level === vl.id ? "bg-primary/15 border-primary/40 text-foreground" : "bg-muted/20 border-border text-muted-foreground hover:border-muted-foreground/40"}`}
                    >{vl.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Signature Phrases (up to 3)</label>
                {[0, 1, 2].map((i) => (
                  <Input key={i} value={(form.signature_phrases || [])[i] || ""} onChange={(e) => {
                    const arr = [...(form.signature_phrases || [])];
                    arr[i] = e.target.value;
                    set("signature_phrases", arr.filter((_, idx) => idx <= i || arr[idx]));
                  }} placeholder={i === 0 ? '"Show me the data."' : i === 1 ? '"We tried this at my last company..."' : '"What\'s the moat here?"'} className="bg-muted/20 border-border text-xs font-mono mb-1.5" />
                ))}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">What Wins Them Over</label>
                <Input value={form.wins_them_over || ""} onChange={(e) => set("wins_them_over", e.target.value.slice(0, 150))} placeholder="A live demo that works. Real customer logos." className="bg-muted/20 border-border text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">What Turns Them Off</label>
                <Input value={form.turns_them_off || ""} onChange={(e) => set("turns_them_off", e.target.value.slice(0, 150))} placeholder="Vague claims like 'AI-powered'. No pricing." className="bg-muted/20 border-border text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Posting Behavior</label>
                <div className="flex flex-wrap gap-2">
                  {POST_BEHAVIORS.map((pb) => (
                    <button key={pb.id} onClick={() => set("posting_behavior", pb.id)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${form.posting_behavior === pb.id ? "bg-primary/15 border-primary/40 text-foreground" : "bg-muted/20 border-border text-muted-foreground hover:border-muted-foreground/40"}`}
                    >{pb.label}</button>
                  ))}
                </div>
              </div>
            </Section>

            {/* Section 6: Backstory */}
            <Section title="Backstory (Optional)" emoji="📖" defaultOpen={false}>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Professional Backstory</label>
                <Textarea value={form.backstory || ""} onChange={(e) => set("backstory", e.target.value.slice(0, 300))} placeholder="Spent 6 years at Stripe as a PM before joining a Series B fintech..." className="bg-muted/20 border-border text-sm h-24 resize-none" maxLength={300} />
                <p className="text-[10px] text-muted-foreground text-right mt-0.5">{(form.backstory || "").length}/300</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Pitches Evaluated</label>
                  <Select value={form.pitches_evaluated || ""} onValueChange={(v) => set("pitches_evaluated", v)}>
                    <SelectTrigger className="bg-muted/20 border-border"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{PITCHES_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                {([
                  { key: "has_built_product" as const, label: "Has built a product before?" },
                  { key: "has_invested" as const, label: "Has invested in startups?" },
                  { key: "has_been_burned" as const, label: "Has been burned by overhyped tools?" },
                ]).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Switch checked={!!form[key]} onCheckedChange={(v) => set(key, v)} />
                  </div>
                ))}
                {form.has_been_burned && (
                  <Input value={form.burn_story || ""} onChange={(e) => set("burn_story", e.target.value.slice(0, 100))} placeholder="What happened?" className="bg-muted/20 border-border text-sm" />
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Current Mission</label>
                <Textarea value={form.current_mission || ""} onChange={(e) => set("current_mission", e.target.value.slice(0, 200))} placeholder="Trying to reduce tooling costs by 30% before Q3..." className="bg-muted/20 border-border text-sm h-16 resize-none" maxLength={200} />
              </div>
            </Section>
          </div>
        </ScrollArea>

        {/* Right: preview */}
        <div className="hidden lg:block w-[40%] border-l border-border bg-muted/5 overflow-y-auto">
          <div className="p-6 space-y-6 sticky top-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview</p>

            {/* Card preview */}
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <div className={`h-16 ${form.personality_type === "skeptic" ? "bg-red-500/20" : form.personality_type === "advocate" ? "bg-green-500/20" : form.personality_type === "analyst" ? "bg-blue-500/20" : "bg-amber-500/20"} flex items-end justify-center`}>
                <span className="text-5xl -mb-5">{form.emoji}</span>
              </div>
              <div className="pt-8 px-4 pb-4 text-center">
                <p className="font-bold text-foreground">{form.name || "Unnamed"}{form.last_initial ? ` ${form.last_initial}` : ""}</p>
                <p className="text-xs text-muted-foreground">{form.archetype || "No title"}</p>
                {personalityMeta && (
                  <Badge variant="secondary" className={`mt-2 text-[10px] ${personalityMeta.color}`}>
                    {personalityMeta.emoji} {personalityMeta.label}
                  </Badge>
                )}
              </div>
              {/* Trait bars */}
              <div className="px-4 pb-4 space-y-1.5">
                {SLIDERS.slice(0, 3).map((s) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-14 shrink-0 truncate">{s.label.split(" ")[0]}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${form[s.key] * 10}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground w-5 text-right">{form[s.key]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Personality Radar</p>
              <RadarChart values={radarValues} />
            </div>

            {/* Sample reaction */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">{form.name || "This persona"} would likely say:</p>
              <div className="rounded-lg bg-muted/20 border border-border/40 p-3">
                <p className="text-xs font-mono text-foreground/80 leading-relaxed italic">{getSampleReaction(form)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">Share to Community Library</Label>
          <Switch checked={form.is_public} onCheckedChange={(v) => set("is_public", v)} />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="border-border text-muted-foreground">Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={saving || !form.name.trim() || !form.archetype.trim()} className="gap-1.5">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Persona"}
          </Button>
        </div>
      </div>
    </div>
  );
}
