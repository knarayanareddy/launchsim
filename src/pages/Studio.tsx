import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import ProductInput from "@/components/studio/ProductInput";
import SimulationConfig from "@/components/studio/SimulationConfig";
import { Button } from "@/components/ui/button";

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

const Studio = () => {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [question, setQuestion] = useState("");
  const [settings, setSettings] = useState<SimulationSettings>(DEFAULT_SETTINGS);
  const [errors, setErrors] = useState<{ description?: string; audiences?: string }>({});

  const handleRun = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!description.trim()) newErrors.description = "Add your product description to continue";
    if (settings.audiences.length === 0) newErrors.audiences = "Select at least one audience type";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    navigate("/simulation", {
      state: { description, question, settings },
    });
  }, [description, question, settings, navigate]);

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
        >
          <Button
            size="lg"
            onClick={handleRun}
            className="w-full rounded-xl py-6 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 glow-primary group relative overflow-hidden transition-all"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            <span className="relative z-10">🐟 Run Simulation</span>
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
