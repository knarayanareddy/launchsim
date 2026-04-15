import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface CompletionOverlayProps {
  onViewReport: () => void;
}

const CompletionOverlay = ({ onViewReport }: CompletionOverlayProps) => {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      <div className="bg-background/95 backdrop-blur-xl border-t border-primary/30 px-6 py-8">
        <div className="container mx-auto text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-lg mb-2">
              🎉 Your simulation is complete — <span className="font-bold text-foreground">200 agents have spoken</span>
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-muted-foreground text-sm">Launch Readiness Score:</span>
              <span className="text-3xl font-black text-primary font-mono">71</span>
              <span className="text-muted-foreground text-sm">/ 100</span>
            </div>
            <Button
              size="lg"
              onClick={onViewReport}
              className="rounded-full px-10 py-6 text-base font-semibold glow-primary bg-primary text-primary-foreground hover:bg-primary/90 group relative overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              <span className="relative z-10">View Full Report →</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CompletionOverlay;
