import { useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import ProductInput from "@/components/studio/ProductInput";
import SimulationConfig from "@/components/studio/SimulationConfig";
import { Button } from "@/components/ui/button";
import { sanitizeInput } from "@/lib/apiErrors";

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

const Studio = () => {
  const navigate = useNavigate();
  const launchRef = useRef<HTMLDivElement>(null);
  const [description, setDescription] = useState("");
  const [question, setQuestion] = useState("");
  const [settings, setSettings] = useState<SimulationSettings>(DEFAULT_SETTINGS);
  const [errors, setErrors] = useState<{ description?: string; audiences?: string }>({});
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      state: { description: cleanDescription, question: sanitizeInput(question), settings },
    });
  }, [description, question, settings, navigate, cooldown, startCooldown]);

  const charCount = description.length;
  const charGuidance =
    charCount > 0 && charCount < MIN_DESCRIPTION_CHARS
      ? `${MIN_DESCRIPTION_CHARS - charCount} more characters needed`
      : null;

  return (
    <div className="min-h-screen">
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
