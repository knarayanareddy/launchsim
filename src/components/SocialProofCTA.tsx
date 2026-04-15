import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SocialProofCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6 max-w-2xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-5 leading-tight">
            Start simulating{" "}
            <br className="hidden sm:block" />
            your dream launch.
          </h2>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed max-w-md mx-auto">
            Every objection your simulated users raise is one less surprise on
            launch day. Free to start. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/studio")}
              className="rounded-full px-10 py-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Run Your First Simulation — Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/results")}
              className="rounded-full px-10 py-6 text-base font-semibold border-border/60 text-foreground hover:bg-muted/20 transition-colors"
            >
              View Example →
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProofCTA;
