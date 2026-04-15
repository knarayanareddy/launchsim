import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Copy, LayoutGrid, List, Lock } from "lucide-react";
import PersonaBuilder from "@/components/personas/PersonaBuilder";
import { EMPTY_FORM, type PersonaForm } from "@/components/personas/types";

const PERSONALITY_META: Record<string, { emoji: string; label: string; color: string; banner: string }> = {
  skeptic: { emoji: "🔴", label: "Skeptic", color: "bg-red-500/15 text-red-400 border-red-500/30", banner: "bg-red-500/20" },
  advocate: { emoji: "🟢", label: "Advocate", color: "bg-green-500/15 text-green-400 border-green-500/30", banner: "bg-green-500/20" },
  pragmatist: { emoji: "🟡", label: "Pragmatist", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", banner: "bg-amber-500/20" },
  analyst: { emoji: "🔵", label: "Analyst", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", banner: "bg-blue-500/20" },
};

interface DBPersona {
  id: string;
  user_id: string;
  name: string;
  last_initial: string | null;
  age_range: string | null;
  gender_presentation: string | null;
  emoji: string;
  archetype: string;
  personality_type: string;
  seniority: string | null;
  years_experience: number;
  company_type: string | null;
  company_size: string | null;
  industry: string[] | string | null;
  secondary_traits: string[];
  skepticism_level: number;
  tech_savviness: number;
  price_sensitivity: number;
  risk_tolerance: number;
  early_adopter_score: number;
  enterprise_mindset: number;
  influence_level: number;
  domain_expertise_level: number;
  domain_expertise_tags: string[];
  tools_used: string[];
  products_loved: string[];
  products_hated: string[];
  pain_points: string | null;
  communication_style: string | null;
  vocabulary_level: string | null;
  signature_phrases: string[];
  wins_them_over: string | null;
  turns_them_off: string | null;
  posting_behavior: string | null;
  backstory: string | null;
  pitches_evaluated: string | null;
  has_built_product: boolean;
  has_invested: boolean;
  has_been_burned: boolean;
  burn_story: string | null;
  current_mission: string | null;
  is_public: boolean;
  times_used: number;
  created_at: string;
  cares_about: string[];
  rejection_triggers: string | null;
  signature_phrase: string | null;
}

const dbToForm = (p: DBPersona): PersonaForm => ({
  name: p.name,
  last_initial: p.last_initial,
  age_range: p.age_range,
  gender_presentation: p.gender_presentation,
  emoji: p.emoji,
  archetype: p.archetype,
  seniority: p.seniority,
  years_experience: p.years_experience ?? 5,
  company_type: p.company_type,
  company_size: p.company_size,
  industry: Array.isArray(p.industry) ? p.industry : p.industry ? [p.industry] : [],
  personality_type: p.personality_type,
  secondary_traits: p.secondary_traits || [],
  skepticism: p.skepticism_level ?? 5,
  tech_savviness: p.tech_savviness ?? 5,
  price_sensitivity: p.price_sensitivity ?? 5,
  risk_tolerance: p.risk_tolerance ?? 5,
  early_adopter_score: p.early_adopter_score ?? 5,
  enterprise_mindset: p.enterprise_mindset ?? 5,
  influence_level: p.influence_level ?? 5,
  domain_expertise_level: p.domain_expertise_level ?? 5,
  domain_expertise_tags: p.domain_expertise_tags || [],
  tools_used: p.tools_used || [],
  products_loved: p.products_loved || [],
  products_hated: p.products_hated || [],
  pain_points: p.pain_points,
  communication_style: p.communication_style,
  vocabulary_level: p.vocabulary_level,
  signature_phrases: p.signature_phrases || [],
  wins_them_over: p.wins_them_over,
  turns_them_off: p.turns_them_off,
  posting_behavior: p.posting_behavior,
  backstory: p.backstory,
  pitches_evaluated: p.pitches_evaluated,
  has_built_product: p.has_built_product ?? false,
  has_invested: p.has_invested ?? false,
  has_been_burned: p.has_been_burned ?? false,
  burn_story: p.burn_story,
  current_mission: p.current_mission,
  is_public: p.is_public ?? false,
});

const formToDb = (form: PersonaForm, userId: string) => ({
  user_id: userId,
  name: form.name,
  last_initial: form.last_initial,
  age_range: form.age_range,
  gender_presentation: form.gender_presentation,
  emoji: form.emoji,
  archetype: form.archetype,
  personality_type: form.personality_type,
  seniority: form.seniority,
  years_experience: form.years_experience,
  company_type: form.company_type,
  company_size: form.company_size,
  industry: form.industry,
  secondary_traits: form.secondary_traits,
  skepticism_level: form.skepticism,
  tech_savviness: form.tech_savviness,
  price_sensitivity: form.price_sensitivity,
  risk_tolerance: form.risk_tolerance,
  early_adopter_score: form.early_adopter_score,
  enterprise_mindset: form.enterprise_mindset,
  influence_level: form.influence_level,
  domain_expertise_level: form.domain_expertise_level,
  domain_expertise_tags: form.domain_expertise_tags,
  tools_used: form.tools_used,
  products_loved: form.products_loved,
  products_hated: form.products_hated,
  pain_points: form.pain_points,
  communication_style: form.communication_style,
  vocabulary_level: form.vocabulary_level,
  signature_phrases: form.signature_phrases,
  wins_them_over: form.wins_them_over,
  turns_them_off: form.turns_them_off,
  posting_behavior: form.posting_behavior,
  backstory: form.backstory,
  pitches_evaluated: form.pitches_evaluated,
  has_built_product: form.has_built_product,
  has_invested: form.has_invested,
  has_been_burned: form.has_been_burned,
  burn_story: form.burn_story,
  current_mission: form.current_mission,
  is_public: form.is_public,
});

const Personas = () => {
  const { user, profile } = useAuth();
  const [personas, setPersonas] = useState<DBPersona[]>([]);
  const [communityPersonas, setCommunityPersonas] = useState<DBPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PersonaForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const isFree = profile?.plan_tier === "free";
  const canCreate = !isFree || personas.length < 5;

  useEffect(() => {
    if (!user) return;
    const fetchPersonas = async () => {
      const [own, community] = await Promise.all([
        supabase.from("custom_personas").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("custom_personas").select("*").eq("is_public", true).neq("user_id", user.id).order("times_used", { ascending: false }).limit(50),
      ]);
      setPersonas((own.data as DBPersona[]) || []);
      setCommunityPersonas((community.data as DBPersona[]) || []);
      setLoading(false);
    };
    fetchPersonas();
  }, [user]);

  const startNew = () => {
    if (!canCreate) {
      toast.error("Free plan limit: 5 personas. Upgrade for unlimited.");
      return;
    }
    setEditForm(EMPTY_FORM);
    setEditing("new");
  };

  const startEdit = (p: DBPersona) => {
    setEditForm(dbToForm(p));
    setEditing(p.id);
  };

  const handleDuplicate = (p: DBPersona) => {
    if (!canCreate) {
      toast.error("Free plan limit reached.");
      return;
    }
    const f = dbToForm(p);
    f.name = `${f.name} (copy)`;
    f.is_public = false;
    setEditForm(f);
    setEditing("new");
  };

  const handleSave = async (form: PersonaForm) => {
    if (!user) return;
    setSaving(true);
    const payload = formToDb(form, user.id);

    if (editing === "new") {
      const { data, error } = await supabase.from("custom_personas").insert(payload as any).select().single();
      if (error) {
        toast.error("Failed to save persona");
      } else {
        setPersonas((prev) => [data as DBPersona, ...prev]);
        toast.success(`${form.emoji} ${form.name} created!`);
        setEditing(null);
      }
    } else {
      const { data, error } = await supabase.from("custom_personas").update(payload as any).eq("id", editing!).select().single();
      if (error) {
        toast.error("Failed to update persona");
      } else {
        setPersonas((prev) => prev.map((p) => (p.id === editing ? (data as DBPersona) : p)));
        toast.success(`${form.emoji} ${form.name} updated!`);
        setEditing(null);
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this persona?")) return;
    const { error } = await supabase.from("custom_personas").delete().eq("id", id);
    if (!error) {
      setPersonas((prev) => prev.filter((p) => p.id !== id));
      toast.success("Persona deleted");
    }
  };

  const meta = (type: string) => PERSONALITY_META[type] || PERSONALITY_META.pragmatist;

  const PersonaCard = ({ p, isOwn = true }: { p: DBPersona; isOwn?: boolean }) => {
    const m = meta(p.personality_type);
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 bg-card overflow-hidden hover:border-border transition-colors group"
      >
        <div className={`h-14 ${m.banner} flex items-end justify-center relative`}>
          <span className="text-4xl -mb-4 relative z-10">{p.emoji}</span>
        </div>
        <div className="pt-6 px-4 pb-4 space-y-2">
          <div className="text-center">
            <p className="font-semibold text-foreground text-sm">{p.name}{p.last_initial ? ` ${p.last_initial}` : ""}</p>
            <p className="text-xs text-muted-foreground">{p.archetype}</p>
          </div>
          <div className="flex justify-center">
            <Badge variant="outline" className={`text-[10px] ${m.color}`}>{m.emoji} {m.label}</Badge>
          </div>
          {p.times_used > 0 && (
            <p className="text-[10px] text-muted-foreground text-center">Used in {p.times_used} sims</p>
          )}
          {/* Trait bars */}
          <div className="space-y-1 pt-1">
            {[
              { label: "Skepticism", value: p.skepticism_level, color: "bg-red-400" },
              { label: "Tech savvy", value: p.tech_savviness, color: "bg-blue-400" },
              { label: "Price sens", value: p.price_sensitivity, color: "bg-amber-400" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="text-[9px] text-muted-foreground w-14 shrink-0">{s.label}</span>
                <div className="flex-1 h-1 rounded-full bg-muted">
                  <div className={`h-full rounded-full ${s.color} transition-all`} style={{ width: `${(s.value ?? 5) * 10}%` }} />
                </div>
                <span className="text-[9px] font-mono text-muted-foreground w-4 text-right">{s.value ?? 5}</span>
              </div>
            ))}
          </div>
          {/* Actions */}
          {isOwn ? (
            <div className="flex gap-1 pt-2 border-t border-border/40">
              <Button variant="ghost" size="sm" className="flex-1 text-xs h-7 gap-1" onClick={() => startEdit(p)}>
                <Pencil className="w-3 h-3" /> Edit
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-xs h-7 gap-1" onClick={() => handleDuplicate(p)}>
                <Copy className="w-3 h-3" /> Copy
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-1 pt-2 border-t border-border/40">
              <Button variant="ghost" size="sm" className="flex-1 text-xs h-7 gap-1" onClick={() => handleDuplicate(p)}>
                <Copy className="w-3 h-3" /> Save Copy
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const PersonaRow = ({ p }: { p: DBPersona }) => {
    const m = meta(p.personality_type);
    return (
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border/30 hover:bg-muted/10 transition-colors">
        <span className="text-2xl">{p.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
          <p className="text-xs text-muted-foreground truncate">{p.archetype}</p>
        </div>
        <Badge variant="outline" className={`text-[10px] hidden sm:flex ${m.color}`}>{m.emoji} {m.label}</Badge>
        <span className="text-xs text-muted-foreground hidden md:block w-20">{Array.isArray(p.industry) ? p.industry[0] : p.industry || "—"}</span>
        <span className="text-xs font-mono text-muted-foreground w-8 text-center">{p.skepticism_level ?? 5}</span>
        <span className="text-xs text-muted-foreground w-12 text-center">{p.times_used || 0}</span>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => handleDuplicate(p)} className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <SEO title="Persona Studio | LaunchSim" description="Build and manage custom AI personas for your product launch simulations." noIndex />

      <div className="space-y-6">
        <Tabs defaultValue="my" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList className="bg-muted/30">
              <TabsTrigger value="my" className="gap-1.5 text-xs">🧬 My Personas</TabsTrigger>
              <TabsTrigger value="community" className="gap-1.5 text-xs">🌐 Community Library</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={`p-1.5 ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode("list")} className={`p-1.5 ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}><List className="w-4 h-4" /></button>
              </div>
              <Button size="sm" onClick={startNew} className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Build New Persona
              </Button>
            </div>
          </div>

          <TabsContent value="my">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">Your Persona Library</h2>
              <p className="text-xs text-muted-foreground">{personas.length} personas created{isFree ? ` · ${5 - personas.length} of 5 free slots remaining` : ""}</p>
            </div>

            {loading ? (
              <div className="text-sm text-muted-foreground animate-pulse py-12 text-center">Loading personas…</div>
            ) : personas.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 space-y-4">
                <span className="text-6xl">🧬</span>
                <h3 className="text-lg font-semibold text-foreground">Your persona library is empty</h3>
                <p className="text-sm text-muted-foreground max-w-md text-center">Build your first persona and add them to any simulation for more authentic, tailored feedback.</p>
                <Button onClick={startNew} className="gap-1.5"><Plus className="w-4 h-4" /> Build New Persona</Button>
              </motion.div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {personas.map((p) => <PersonaCard key={p.id} p={p} />)}
                {/* Free plan lock slot */}
                {isFree && personas.length >= 5 && (
                  <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden flex flex-col items-center justify-center p-6 text-center opacity-60 blur-[1px] relative">
                    <div className="absolute inset-0 flex items-center justify-center z-10 blur-0">
                      <div className="text-center space-y-2">
                        <Lock className="w-6 h-6 text-muted-foreground mx-auto" />
                        <p className="text-xs text-muted-foreground font-medium">Upgrade for unlimited</p>
                      </div>
                    </div>
                    <span className="text-4xl">🔒</span>
                    <p className="text-sm font-medium text-foreground mt-2">Locked</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-2 border-b border-border/50 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span className="w-8" />
                  <span className="flex-1">Persona</span>
                  <span className="hidden sm:block w-16">Type</span>
                  <span className="hidden md:block w-20">Industry</span>
                  <span className="w-8 text-center">Skp</span>
                  <span className="w-12 text-center">Used</span>
                  <span className="w-24" />
                </div>
                {personas.map((p) => <PersonaRow key={p.id} p={p} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="community">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">Community Library</h2>
              <p className="text-xs text-muted-foreground">Personas shared by other LaunchSim users. Save a copy to use in your simulations.</p>
            </div>
            {communityPersonas.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <span className="text-5xl">🌐</span>
                <p className="text-sm text-muted-foreground">No community personas yet. Be the first to share one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {communityPersonas.map((p) => <PersonaCard key={p.id} p={p} isOwn={false} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Builder modal */}
      <AnimatePresence>
        {editing && (
          <PersonaBuilder
            initial={editForm}
            isNew={editing === "new"}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default Personas;
