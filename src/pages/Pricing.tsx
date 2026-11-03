import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { PLAN_FEATURES, PLAN_PRICING, planLevel } from "@/lib/config";
import { toast } from "sonner";

/**
 * Public pricing page.
 *
 * This route was linked from five places (Results, Compare, Settings, the
 * dashboard sidebar and the low-credits email) but never existed, so every
 * upgrade CTA landed on the 404 page.
 *
 * Checkout is not wired up yet — there is no payment provider in the codebase.
 * Rather than pretend, the CTAs surface a waitlist message and the page states
 * plainly that upgrades are handled manually for now.
 */
const Pricing = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const current = planLevel(profile?.plan_tier);
  const isSignedIn = Boolean(user);

  const handleChoose = (tier: string) => {
    if (!isSignedIn) {
      navigate("/signup");
      return;
    }
    if (tier.toLowerCase() === current) return;
    toast.info("Upgrade requests are handled manually", {
      description: "Email support@launchsim.app and we'll upgrade your workspace within one business day.",
      duration: 8000,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Pricing"
        description="LaunchSim pricing — start free with 3 simulations, upgrade to Pro for 30 simulations a month, or go Unlimited for 1,000-agent swarms and Notion export."
        path="/pricing"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-6 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <Badge variant="outline" className="mb-4 gap-1.5 border-primary/30 text-primary">
            <Sparkles className="w-3 h-3" /> Simple pricing
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Simulate before you ship</h1>
          <p className="text-muted-foreground">
            Every plan includes the full swarm engine — score, sentiment map, objections,
            strengths, refined pitch and the debate feed.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {PLAN_PRICING.map((plan) => {
            const tier = plan.tier.toLowerCase();
            const isCurrent = isSignedIn && tier === current;
            const isHighlight = plan.tier === "Pro";

            return (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * PLAN_PRICING.indexOf(plan) }}
                className={`rounded-2xl border p-6 flex flex-col ${
                  isHighlight
                    ? "border-primary/50 bg-primary/5 shadow-[0_0_40px_-12px] shadow-primary/40"
                    : "border-border bg-card/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">{plan.tier}</h2>
                  {isCurrent && <Badge className="bg-success/20 text-success border-success/30 text-[10px]">Current</Badge>}
                  {isHighlight && !isCurrent && <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">Popular</Badge>}
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-2">/ {plan.cadence}</span>
                </div>

                <ul className="space-y-2.5 text-sm flex-1 mb-6">
                  {PLAN_FEATURES.map((f) => {
                    const value = f[tier as "free" | "pro" | "unlimited"];
                    const included = value !== "—";
                    return (
                      <li key={f.label} className="flex items-start gap-2">
                        <Check
                          className={`w-4 h-4 mt-0.5 shrink-0 ${included ? "text-success" : "text-muted-foreground/40"}`}
                        />
                        <span className={included ? "text-foreground/90" : "text-muted-foreground/60 line-through"}>
                          {f.label}
                          {included && <span className="text-muted-foreground"> · {value}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <Button
                  onClick={() => handleChoose(plan.tier)}
                  disabled={isCurrent}
                  variant={isHighlight ? "default" : "outline"}
                  className="w-full"
                >
                  {isCurrent ? "Your current plan" : isSignedIn ? plan.cta : "Get started"}
                </Button>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10 max-w-xl mx-auto">
          Credits are consumed per completed simulation. Failed runs are automatically refunded.
          Upgrades are processed manually while we finish self-serve billing — no card is charged
          on this page.
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
