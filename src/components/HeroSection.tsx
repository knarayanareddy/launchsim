import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AgentSwarm from "@/components/AgentSwarm";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Radial glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Copy */}
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-8">
                <span className="h-2 w-2 rounded-full bg-secondary animate-pulse-glow" />
                <span className="font-mono text-xs text-primary tracking-wider uppercase">
                  Powered by Swarm Intelligence
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6"
            >
              What if 1,000 users reacted to your idea{" "}
              <span className="text-primary">RIGHT NOW?</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground mb-8 leading-relaxed"
            >
              Paste your product description. Watch AI personas debate it. Ship
              with confidence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 mb-6"
            >
              <Button
                size="lg"
                onClick={() => navigate("/studio")}
                className="rounded-full px-8 py-6 text-base font-semibold glow-primary bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Simulate My Launch →
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/results")}
                className="rounded-full px-8 py-6 text-base font-semibold border-border text-foreground hover:bg-muted/30"
              >
                See Example Report
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-muted-foreground text-xs font-mono"
            >
              Join 847 founders who've already simulated their launch
            </motion.p>
          </div>

          {/* Right side - Agent swarm */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <AgentSwarm />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
