import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Save, Eye, Lock, Sparkles } from "lucide-react";

interface CustomPersona {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  archetype: string;
  personality_type: string;
  skepticism_level: number;
  price_sensitivity: number;
  tech_savviness: number;
  cares_about: string[];
  rejection_triggers: string | null;
  signature_phrase: string | null;
  company_type: string | null;
  industry: string | null;
  company_size: string | null;
  seniority: string | null;
  created_at: string;
}

const EMOJI_GRID = [
  "👤", "👩‍💼", "👨‍💻", "🧑‍🔬", "👩‍🎨", "🧑‍💼", "👨‍🏫", "👩‍⚕️", "🧑‍🚀", "👨‍🍳",
  "🤖", "🦊", "🐙", "🧠", "💎", "🎯", "🔥", "⚡", "🌊", "🏔️",
  "🎪", "🎭", "🧩", "🔮", "🛡️", "⚔️", "🏆", "📡", "🧬", "🌟",
];

const PERSONALITY_TYPES = [
  { id: "skeptic", label: "Skeptic", emoji: "🔴", color: "bg-destructive/20 text-destructive" },
  { id: "advocate", label: "Advocate", emoji: "🟢", color: "bg-success/20 text-success" },
  { id: "pragmatist", label: "Pragmatist", emoji: "🟡", color: "bg-warning/20 text-warning" },
  { id: "analyst", label: "Analyst", emoji: "🔵", color: "bg-primary/20 text-primary" },
  { id: "innovator", label: "Innovator", emoji: "💡", color: "bg-accent/20 text-accent" },
  { id: "bureaucrat", label: "Bureaucrat", emoji: "🏛️", color: "bg-muted text-muted-foreground" },
];

const CARES_ABOUT_OPTIONS = [
  "ROI / Revenue", "Security / Compliance", "UX / Design", "Speed to value",
  "Integration", "Team adoption", "Cost savings",
];

const DEFAULT_PERSONAS = [
  { emoji: "🧑‍💼", name: "Alex", archetype: "Product Manager", personality_type: "pragmatist" },
  { emoji: "👩‍💻", name: "Morgan", archetype: "Developer", personality_type: "analyst" },
  { emoji: "🚀", name: "Jordan", archetype: "Founder", personality_type: "advocate" },
  { emoji: "💰", name: "Casey", archetype: "VC/Investor", personality_type: "skeptic" },
  { emoji: "😤", name: "Taylor", archetype: "Skeptic", personality_type: "skeptic" },
  { emoji: "✅", name: "Riley", archetype: "Early Adopter", personality_type: "innovator" },
  { emoji: "🏢", name: "Avery", archetype: "Enterprise Buyer", personality_type: "bureaucrat" },
  { emoji: "👥", name: "Sam", archetype: "Consumer", personality_type: "pragmatist" },
];

const EMPTY_FORM: Omit<CustomPersona, "id" | "user_id" | "created_at"> = {
  name: "",
  emoji: "👤",
  archetype: "",
  personality_type: "pragmatist",
  skepticism_level: 5,
  price_sensitivity: 5,
  tech_savviness: 5,
  cares_about: [],
  rejection_triggers: "",
  signature_phrase: "",
  company_type: null,
  industry: null,
  company_size: null,
  seniority: null,
};

const Personas = () => {
  const { user, profile } = useAuth();
  const [personas, setPersonas] = useState<CustomPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // persona id or "new"
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isUnlimited = profile?.plan_tier === "unlimited" || profile?.plan_tier === "enterprise";

  useEffect(() => {
    if (!user) return;
    supabase
      .from("custom_personas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPersonas((data as CustomPersona[]) || []);
        setLoading(false);
      });
  }, [user]);

  const startNew = () => {
    setForm(EMPTY_FORM);
    setEditing("new");
  };

  const startEdit = (p: CustomPersona) => {
    setForm({
      name: p.name,
      emoji: p.emoji,
      archetype: p.archetype,
      personality_type: p.personality_type,
      skepticism_level: p.skepticism_level,
      price_sensitivity: p.price_sensitivity,
      tech_savviness: p.tech_savviness,
      cares_about: p.cares_about,
      rejection_triggers: p.rejection_triggers || "",
      signature_phrase: p.signature_phrase || "",
      company_type: p.company_type,
      industry: p.industry,
      company_size: p.company_size,
      seniority: p.seniority,
    });
    setEditing(p.id);
  };

  const handleSave = async () => {
    if (!user || !form.name.trim() || !form.archetype.trim()) {
      toast.error("Name and archetype are required");
      return;
    }
    setSaving(true);
    const payload = { ...form, user_id: user.id };

    if (editing === "new") {
      const { data, error } = await supabase
        .from("custom_personas")
        .insert(payload as any)
        .select()
        .single();
      if (error) {
        toast.error("Failed to save persona");
      } else {
        setPersonas((prev) => [data as CustomPersona, ...prev]);
        toast.success(`${form.emoji} ${form.name} created!`);
        setEditing(null);
      }
    } else {
      const { data, error } = await supabase
        .from("custom_personas")
        .update(payload as any)
        .eq("id", editing!)
        .select()
        .single();
      if (error) {
        toast.error("Failed to update persona");
      } else {
        setPersonas((prev) => prev.map((p) => (p.id === editing ? (data as CustomPersona) : p)));
        toast.success(`${form.emoji} ${form.name} updated!`);
        setEditing(null);
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("custom_personas").delete().eq("id", id);
    if (!error) {
      setPersonas((prev) => prev.filter((p) => p.id !== id));
      if (editing === id) setEditing(null);
      toast.success("Persona deleted");
    }
  };

  const toggleCaresAbout = (item: string) => {
    setForm((prev) => ({
      ...prev,
      cares_about: prev.cares_about.includes(item)
        ? prev.cares_about.filter((c) => c !== item)
        : [...prev.cares_about, item],
    }));
  };

  const personalityMeta = PERSONALITY_TYPES.find((p) => p.id === form.personality_type);

  // Upgrade gate
  if (!isUnlimited) {
    return (
      <DashboardLayout>
        <SEO title="Custom Personas | LaunchSim" noIndex />
        <div className="relative min-h-[80vh] flex items-center justify-center">
          {/* Blurred background preview */}
          <div className="absolute inset-0 opacity-20 blur-sm pointer-events-none">
            <div className="grid grid-cols-3 gap-4 p-8">
              {DEFAULT_PERSONAS.map((p) => (
                <div key={p.name} className="bg-card border border-border rounded-xl p-4">
                  <span className="text-2xl">{p.emoji}</span>
                  <p className="text-sm font-semibold mt-2">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.archetype}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 glass-card rounded-2xl p-8 max-w-md text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Custom Personas is an Unlimited Plan feature</h2>
            <p className="text-sm text-muted-foreground">
              Upgrade to Unlimited to build custom simulated user types, tune their personality sliders, and use them in your simulations.
            </p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Upgrade to Unlimited →
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SEO title="Custom Personas | LaunchSim" noIndex />
      <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-6rem)]">
        {/* LEFT PANEL — Library */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-foreground">Your Custom Personas</h1>
            <Button size="sm" onClick={startNew} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> New
            </Button>
          </div>

          {/* Custom personas */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-xs text-muted-foreground animate-pulse py-8 text-center">Loading…</div>
            ) : personas.length === 0 ? (
              <div className="glass-card rounded-xl p-6 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">No custom personas yet</p>
                <Button size="sm" variant="outline" onClick={startNew} className="text-xs">
                  Create your first →
                </Button>
              </div>
            ) : (
              personas.map((p) => {
                const meta = PERSONALITY_TYPES.find((t) => t.id === p.personality_type);
                return (
                  <motion.div
                    key={p.id}
                    layout
                    className={`glass-card rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all ${
                      editing === p.id ? "border-primary/50 bg-primary/5" : "hover:border-border/60"
                    }`}
                    onClick={() => startEdit(p)}
                  >
                    <span className="text-2xl">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.archetype}</p>
                    </div>
                    {meta && (
                      <Badge variant="secondary" className={`text-[10px] ${meta.color}`}>
                        {meta.emoji} {meta.label}
                      </Badge>
                    )}
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(p); }}
                        className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Default personas (read-only) */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Default Personas</p>
            <div className="space-y-1.5">
              {DEFAULT_PERSONAS.map((p) => {
                const meta = PERSONALITY_TYPES.find((t) => t.id === p.personality_type);
                return (
                  <div key={p.name} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/10 opacity-60">
                    <span className="text-lg">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.archetype}</p>
                    </div>
                    {meta && (
                      <span className="text-[10px] text-muted-foreground">{meta.emoji}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Editor */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div
                key={editing}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-lg font-bold text-foreground">
                  {editing === "new" ? "Build Your Persona" : "Edit Persona"}
                </h2>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
                  {/* Form */}
                  <div className="space-y-6">
                    {/* Identity */}
                    <section className="glass-card rounded-xl p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="text-base">🎭</span> Identity
                      </h3>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Emoji</label>
                        <div className="flex flex-wrap gap-1.5">
                          {EMOJI_GRID.map((e) => (
                            <button
                              key={e}
                              onClick={() => setForm((p) => ({ ...p, emoji: e }))}
                              className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                                form.emoji === e
                                  ? "bg-primary/20 ring-2 ring-primary scale-110"
                                  : "hover:bg-muted/30"
                              }`}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Name</label>
                          <Input
                            value={form.name}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Sophia"
                            className="bg-muted/20 border-border"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Archetype Label</label>
                          <Input
                            value={form.archetype}
                            onChange={(e) => setForm((p) => ({ ...p, archetype: e.target.value }))}
                            placeholder="Healthcare PM"
                            className="bg-muted/20 border-border"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Seniority</label>
                        <Select value={form.seniority || ""} onValueChange={(v) => setForm((p) => ({ ...p, seniority: v }))}>
                          <SelectTrigger className="bg-muted/20 border-border"><SelectValue placeholder="Select…" /></SelectTrigger>
                          <SelectContent>
                            {["Junior", "Mid", "Senior", "Executive"].map((s) => (
                              <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </section>

                    {/* Context */}
                    <section className="glass-card rounded-xl p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="text-base">🏢</span> Context
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Company Type</label>
                          <Select value={form.company_type || ""} onValueChange={(v) => setForm((p) => ({ ...p, company_type: v }))}>
                            <SelectTrigger className="bg-muted/20 border-border"><SelectValue placeholder="Select…" /></SelectTrigger>
                            <SelectContent>
                              {["Early-stage startup", "Series A/B", "Enterprise", "Agency", "Freelancer", "Government"].map((s) => (
                                <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Industry</label>
                          <Select value={form.industry || ""} onValueChange={(v) => setForm((p) => ({ ...p, industry: v }))}>
                            <SelectTrigger className="bg-muted/20 border-border"><SelectValue placeholder="Select…" /></SelectTrigger>
                            <SelectContent>
                              {["SaaS", "Fintech", "Healthcare", "E-commerce", "Dev Tools", "Consumer", "Other"].map((s) => (
                                <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Company Size</label>
                          <Select value={form.company_size || ""} onValueChange={(v) => setForm((p) => ({ ...p, company_size: v }))}>
                            <SelectTrigger className="bg-muted/20 border-border"><SelectValue placeholder="Select…" /></SelectTrigger>
                            <SelectContent>
                              {["1-10", "11-50", "51-200", "200+"].map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>

                    {/* Personality */}
                    <section className="glass-card rounded-xl p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="text-base">🧠</span> Personality
                      </h3>
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block">Primary Trait</label>
                        <div className="flex flex-wrap gap-2">
                          {PERSONALITY_TYPES.map((pt) => (
                            <button
                              key={pt.id}
                              onClick={() => setForm((p) => ({ ...p, personality_type: pt.id }))}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                form.personality_type === pt.id
                                  ? `${pt.color} border-current scale-105`
                                  : "bg-muted/20 border-border text-muted-foreground hover:border-muted-foreground/40"
                              }`}
                            >
                              {pt.emoji} {pt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        {[
                          { label: "Skepticism Level", key: "skepticism_level" as const, low: "Open-minded", high: "Very cynical" },
                          { label: "Price Sensitivity", key: "price_sensitivity" as const, low: "Price agnostic", high: "Very price-conscious" },
                          { label: "Tech Savviness", key: "tech_savviness" as const, low: "Non-technical", high: "Deeply technical" },
                        ].map((slider) => (
                          <div key={slider.key}>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs text-muted-foreground">{slider.label}</label>
                              <span className="text-xs font-mono text-foreground">{form[slider.key]}/10</span>
                            </div>
                            <Slider
                              value={[form[slider.key]]}
                              onValueChange={([v]) => setForm((p) => ({ ...p, [slider.key]: v }))}
                              min={1}
                              max={10}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                              <span>{slider.low}</span>
                              <span>{slider.high}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Behavior */}
                    <section className="glass-card rounded-xl p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="text-base">⚡</span> Behavior
                      </h3>
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block">Cares most about</label>
                        <div className="flex flex-wrap gap-2">
                          {CARES_ABOUT_OPTIONS.map((item) => (
                            <button
                              key={item}
                              onClick={() => toggleCaresAbout(item)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                form.cares_about.includes(item)
                                  ? "bg-primary/15 border-primary/40 text-foreground"
                                  : "bg-muted/20 border-border text-muted-foreground hover:border-muted-foreground/40"
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">What makes this persona reject products</label>
                        <Textarea
                          value={form.rejection_triggers || ""}
                          onChange={(e) => setForm((p) => ({ ...p, rejection_triggers: e.target.value.slice(0, 150) }))}
                          placeholder="No clear ROI story, missing enterprise SSO…"
                          className="bg-muted/20 border-border text-sm h-20 resize-none"
                          maxLength={150}
                        />
                        <p className="text-[10px] text-muted-foreground text-right mt-1">{(form.rejection_triggers || "").length}/150</p>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Signature phrase</label>
                        <Input
                          value={form.signature_phrase || ""}
                          onChange={(e) => setForm((p) => ({ ...p, signature_phrase: e.target.value }))}
                          placeholder={`"Where's the case study?"`}
                          className="bg-muted/20 border-border font-mono text-xs"
                        />
                      </div>
                    </section>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                        <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Persona"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditing(null)}
                        className="border-border text-muted-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="hidden xl:block">
                    <div className="sticky top-24 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> Live Preview
                      </p>
                      <div className="glass-card rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                            {form.emoji}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{form.name || "Unnamed"}</p>
                            <p className="text-xs text-muted-foreground">{form.archetype || "No archetype"}</p>
                          </div>
                        </div>
                        {personalityMeta && (
                          <Badge variant="secondary" className={`text-xs ${personalityMeta.color}`}>
                            {personalityMeta.emoji} {personalityMeta.label}
                          </Badge>
                        )}
                        {form.seniority && (
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{form.seniority} level</p>
                        )}

                        {/* Stat bars */}
                        <div className="space-y-2 pt-2 border-t border-border">
                          {[
                            { label: "Skepticism", value: form.skepticism_level, color: "bg-destructive" },
                            { label: "Price Sens.", value: form.price_sensitivity, color: "bg-warning" },
                            { label: "Tech Savvy", value: form.tech_savviness, color: "bg-primary" },
                          ].map((stat) => (
                            <div key={stat.label} className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground w-16 shrink-0">{stat.label}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-muted">
                                <div
                                  className={`h-full rounded-full ${stat.color} transition-all`}
                                  style={{ width: `${stat.value * 10}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground w-5 text-right">{stat.value}</span>
                            </div>
                          ))}
                        </div>

                        {form.cares_about.length > 0 && (
                          <div className="pt-2 border-t border-border">
                            <p className="text-[10px] text-muted-foreground mb-1">Cares about:</p>
                            <div className="flex flex-wrap gap-1">
                              {form.cares_about.map((c) => (
                                <span key={c} className="text-[10px] bg-muted/30 rounded-full px-2 py-0.5 text-muted-foreground">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {form.signature_phrase && (
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs italic text-muted-foreground font-mono">"{form.signature_phrase}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full min-h-[400px]"
              >
                <div className="text-center space-y-3">
                  <div className="text-4xl">🎭</div>
                  <p className="text-sm text-muted-foreground">Select a persona to edit or create a new one</p>
                  <Button size="sm" onClick={startNew} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" /> New Persona
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Personas;
