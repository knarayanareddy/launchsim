import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import ProductInput from "@/components/studio/ProductInput";
import SimulationConfig from "@/components/studio/SimulationConfig";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { sanitizeInput } from "@/lib/apiErrors";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SimulationSettings {
  agentCount: number;
  audiences: string[];
  platform: string;
  depth: number;
}

const DEFAULT_SETTINGS: SimulationSettings = {
  agentCount: 200,
  audiences: ["pm", "founders", "skeptics", "early-adopters"],
  platform: "both",
  depth: 1,
};

const MIN_DESCRIPTION_CHARS = 50;
const RATE_LIMIT_MS = 10000;

interface SimGroup {
  id: string;
  product_name: string;
  latest_score: number;
  simulation_ids: string[];
}

const Studio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const launchRef = useRef<HTMLDivElement>(null);
  const [description, setDescription] = useState("");
  const [question, setQuestion] = useState("");
  const [settings, setSettings] = useState<SimulationSettings>(DEFAULT_SETTINGS);
  const [errors, setErrors] = useState<{ description?: string; audiences?: string }>({});
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Iteration state
  const [iterationType, setIterationType] = useState<"new" | "iteration">("new");
  const [groups, setGroups] = useState<SimGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");

  // Prefill from navigation state
  useEffect(() => {
    const state = location.state as any;
    if (state?.prefill) setDescription(state.prefill);
    if (state?.groupId) {
      setIterationType("iteration");
      setSelectedGroupId(state.groupId);
    }
  }, [location.state]);

  // Fetch groups when iteration selected
  useEffect(() => {
    if (iterationType === "iteration" && user) {
      supabase
        .from("simulation_groups")
        .select("id, product_name, latest_score, simulation_ids")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .then(({ data }) => {
          setGroups((data as any[]) || []);
        });
    }
  }, [iterationType, user]);

  const startCooldown = useCallback(() => {
    setCooldown(10);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleRun = useCallback(() => {
    if (cooldown > 0) return;

    const newErrors: typeof errors = {};
    const cleanDescription = sanitizeInput(description);

    if (!cleanDescription) {
      newErrors.description = "Add your product description to continue";
    } else if (cleanDescription.length < MIN_DESCRIPTION_CHARS) {
      newErrors.description = `Description must be at least ${MIN_DESCRIPTION_CHARS} characters (currently ${cleanDescription.length})`;
    }

    if (settings.audiences.length === 0) {
      newErrors.audiences = "Select at least one audience type";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      launchRef.current?.classList.add("shake");
      setTimeout(() => launchRef.current?.classList.remove("shake"), 500);
      return;
    }

    setErrors({});
    startCooldown();

    navigate("/simulation", {
      state: {
        description: cleanDescription,
        question: sanitizeInput(question),
        settings,
        groupId: iterationType === "iteration" ? selectedGroupId : null,
        newGroupName: iterationType === "iteration" && !selectedGroupId ? newGroupName : null,
      },
    });
  }, [description, question, settings, navigate, cooldown, startCooldown]);

  const charCount = description.length;
  const charGuidance =
    charCount > 0 && charCount < MIN_DESCRIPTION_CHARS
      ? `${MIN_DESCRIPTION_CHARS - charCount} more characters needed`
      : null;

  return (
    <div className="min-h-screen">
      <SEO title="Run a Simulation" description="Configure your product simulation — choose your crowd size, audience mix, and simulation depth." path="/studio" noIndex />
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-16">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm mb-8"
        >
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground">Studio</span>
        </motion.div>

        {/* Page title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-10"
        >
          Configure Your Simulation
        </motion.h1>

        {/* Two column layout */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ProductInput
              description={description}
              setDescription={setDescription}
              question={question}
              setQuestion={setQuestion}
              descriptionError={errors.description}
              clearError={() => setErrors((e) => ({ ...e, description: undefined }))}
              charGuidance={charGuidance}
            />

            {/* Iteration toggle */}
            <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              <p className="text-sm font-medium text-foreground">Is this a new idea or an iteration?</p>
              <RadioGroup
                value={iterationType}
                onValueChange={(v) => setIterationType(v as "new" | "iteration")}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="new" id="type-new" />
                  <Label htmlFor="type-new" className="text-sm text-foreground cursor-pointer">New product</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="iteration" id="type-iter" />
                  <Label htmlFor="type-iter" className="text-sm text-foreground cursor-pointer">Iteration of existing idea</Label>
                </div>
              </RadioGroup>

              {iterationType === "iteration" && (
                <div className="space-y-3 animate-fade-in">
                  <Label className="text-xs text-muted-foreground">Which product?</Label>
                  {groups.length > 0 ? (
                    <div className="space-y-2">
                      {groups.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setSelectedGroupId(g.id)}
                          className={`w-full text-left rounded-lg p-3 border transition-all text-sm ${
                            selectedGroupId === g.id
                              ? "border-primary bg-primary/10"
                              : "border-white/10 bg-white/[0.02] hover:border-white/20"
                          }`}
                        >
                          <span className="font-medium text-foreground">{g.product_name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            Score: {g.latest_score} · {g.simulation_ids.length} runs
                          </span>
                        </button>
                      ))}
                      <button
                        onClick={() => setSelectedGroupId(null)}
                        className={`w-full text-left rounded-lg p-3 border transition-all text-sm ${
                          selectedGroupId === null
                            ? "border-primary bg-primary/10"
                            : "border-white/10 bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        <span className="text-primary text-sm">+ Create new tracked product</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No tracked products yet. This will create your first one.</p>
                  )}

                  {(selectedGroupId === null || groups.length === 0) && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Product name</Label>
                      <input
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="e.g. LaunchSim, My Fitness App"
                        className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SimulationConfig
              settings={settings}
              setSettings={setSettings}
              audienceError={errors.audiences}
              clearAudienceError={() => setErrors((e) => ({ ...e, audiences: undefined }))}
            />
          </motion.div>
        </div>

        {/* Launch button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10"
          ref={launchRef}
        >
          <Button
            size="lg"
            onClick={handleRun}
            disabled={cooldown > 0}
            className="w-full rounded-xl py-6 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-primary group relative overflow-hidden transition-all disabled:opacity-50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            <span className="relative z-10">
              {cooldown > 0 ? `⏳ Wait ${cooldown}s` : "🐟 Run Simulation"}
            </span>
          </Button>
          <p className="text-center text-muted-foreground text-xs font-mono mt-3">
            Your results will be ready in under 60 seconds
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Studio;
