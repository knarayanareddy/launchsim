import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SocialProofCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      <div className="container mx-auto px-6 max-w-2xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Don't launch blind
          </h2>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
            Every objection your simulated users raise is one less surprise on
            launch day.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/studio")}
            className="w-full sm:w-auto rounded-full px-10 py-6 text-base font-semibold glow-primary bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Run Your First Simulation — Free
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProofCTA;
