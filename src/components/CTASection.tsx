import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6 max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Stop Guessing.
            <br />
            <span className="text-secondary">Start Simulating.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Your next product deserves more than a hunch. Run the simulation.
          </p>
          <Button
            size="lg"
            className="rounded-full px-10 py-6 text-base font-semibold glow-primary bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Launch Your Simulation →
          </Button>
          <p className="text-muted-foreground text-xs mt-4 font-mono">
            Free to try · No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
