import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileDown, Lock, Loader2, Send } from "lucide-react";
import OverviewTab from "@/components/results/OverviewTab";
import ObjectionsTab from "@/components/results/ObjectionsTab";
import StrengthsTab from "@/components/results/StrengthsTab";
import AgentFeedTab from "@/components/results/AgentFeedTab";
import RefinedPitchTab from "@/components/results/RefinedPitchTab";
import NotionExportModal from "@/components/results/NotionExportModal";
import { saveSimulation } from "@/lib/simulationService";
import { generatePdfReport } from "@/lib/pdfExport";
import type { SimulationResult } from "@/hooks/useSimulation";

const TABS = ["Overview", "Objections", "Strengths", "Agent Feed", "Refined Pitch"];

// Placeholder: replace with real user plan logic
const getUserPlan = (): "free" | "pro" | "unlimited" => "unlimited";
const USER_PLAN = getUserPlan();

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    description?: string;
    question?: string;
    settings?: { agentCount?: number; audiences?: string[]; platform?: string; depth?: number };
    aiResult?: SimulationResult;
  } | null;

  const aiResult = state?.aiResult;
  const description = state?.description || "LaunchSim helps founders simulate how 1,000 real user types would react to their product before launch.";

  const [activeTab, setActiveTab] = useState(0);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [notionOpen, setNotionOpen] = useState(false);
  const savedRef = useRef(false);

  // Auto-save on mount
  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;

    const depthLabels = ["quick", "standard", "deep"];

    saveSimulation({
      description,
      question: state?.question,
      crowdSize: state?.settings?.agentCount,
      audienceMix: state?.settings?.audiences,
      platform: state?.settings?.platform,
      depth: depthLabels[state?.settings?.depth ?? 1],
      aiResult: aiResult || undefined,
    })
      .then((result) => {
        setShareToken(result.share_token);
        toast.success("Saved to your wiki");
      })
      .catch((err) => {
        console.error("Failed to save simulation:", err);
      });
  }, []);

  const handleShare = async () => {
    const url = shareToken
      ? `${window.location.origin}/wiki/${shareToken}`
      : window.location.href;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied!", { description: "Anyone with this link can view your report" });
  };

  const handleExportPdf = async () => {
    if (USER_PLAN === "free") {
      toast.info("PDF export requires Pro plan", { description: "Upgrade to export your reports." });
      return;
    }
    if (!aiResult) return;

    setPdfLoading(true);
    try {
      await generatePdfReport(aiResult, description);
      toast.success("PDF downloaded");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportNotion = () => {
    if (USER_PLAN !== "unlimited") {
      toast.info("Notion export requires Unlimited plan", { description: "Upgrade to export directly to Notion." });
      return;
    }
    setNotionOpen(true);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Demo data banner */}
      {aiResult?.usingMockData && (
        <div className="bg-warning/10 border-b border-warning/30 px-4 py-2 text-center">
          <span className="text-xs text-warning font-mono">⚠️ Using demo data — AI generation failed or is unavailable</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate("/studio")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Run Another Simulation
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                disabled={pdfLoading}
                className="text-xs border-border text-muted-foreground hover:text-foreground gap-1.5"
              >
                {pdfLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : USER_PLAN === "free" ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportNotion}
                className="text-xs border-border text-muted-foreground hover:text-foreground gap-1.5"
              >
                {USER_PLAN !== "unlimited" ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Notion
              </Button>
              <Button size="sm" onClick={handleShare} className="text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                Share
              </Button>
            </div>
          </div>
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Simulation Report</h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              {aiResult?.agents?.length || 200} agents · 5 rounds · just now
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`relative px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === i ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
                {activeTab === i && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="container mx-auto px-6 pt-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === 0 && <OverviewTab data={aiResult} />}
          {activeTab === 1 && <ObjectionsTab data={aiResult?.top_objections} />}
          {activeTab === 2 && <StrengthsTab data={aiResult?.top_strengths} />}
          {activeTab === 3 && <AgentFeedTab data={aiResult?.agents} />}
          {activeTab === 4 && (
            <RefinedPitchTab
              originalPitch={description}
              refinedPitch={aiResult?.sharpened_pitch}
              changesMade={aiResult?.pitch_changes_made}
            />
          )}
        </motion.div>
      </div>

      {/* Notion export modal */}
      {aiResult && (
        <NotionExportModal
          open={notionOpen}
          onOpenChange={setNotionOpen}
          result={aiResult}
          description={description}
        />
      )}
    </div>
  );
};

export default Results;
