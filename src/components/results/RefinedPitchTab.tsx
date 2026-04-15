import { useState } from "react";
import { Button } from "@/components/ui/button";
import { REFINED_PITCH, REFINED_CHANGES } from "@/data/resultsMocks";

interface RefinedPitchTabProps {
  originalPitch?: string;
  refinedPitch?: string;
  changesMade?: string;
}

const DEFAULT_ORIGINAL = "LaunchSim helps founders simulate how 1,000 real user types would react to their product before launch. Paste your pitch and get a sentiment map, top objections, and a refined pitch in minutes.";

const RefinedPitchTab = ({ originalPitch, refinedPitch, changesMade }: RefinedPitchTabProps) => {
  const [copied, setCopied] = useState(false);
  const original = originalPitch || DEFAULT_ORIGINAL;
  const refined = refinedPitch || REFINED_PITCH;
  const changes = changesMade || REFINED_CHANGES;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(refined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-lg font-bold">🤖 AI-Refined Pitch <span className="text-muted-foreground text-sm font-normal">(based on simulation learnings)</span></h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-muted/20 p-5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">Original</span>
          <p className="text-sm text-muted-foreground leading-relaxed">{original}</p>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5" style={{ boxShadow: "0 0 30px rgba(79,142,247,0.06)" }}>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-3">Refined</span>
          <p className="text-sm text-foreground leading-relaxed">{refined}</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <p className="text-xs text-muted-foreground font-mono">{changes}</p>
      </div>

      <Button
        onClick={handleCopy}
        variant="outline"
        className="rounded-full px-6 border-primary/40 text-foreground hover:bg-primary/10"
      >
        {copied ? "✓ Copied!" : "📋 Copy Refined Pitch"}
      </Button>
    </div>
  );
};

export default RefinedPitchTab;
