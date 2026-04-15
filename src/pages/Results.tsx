import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import OverviewTab from "@/components/results/OverviewTab";
import ObjectionsTab from "@/components/results/ObjectionsTab";
import StrengthsTab from "@/components/results/StrengthsTab";
import AgentFeedTab from "@/components/results/AgentFeedTab";
import RefinedPitchTab from "@/components/results/RefinedPitchTab";

const TABS = ["Overview", "Objections", "Strengths", "Agent Feed", "Refined Pitch"];

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { description?: string } | null;
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/studio")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Run Another Simulation
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs border-border text-muted-foreground hover:text-foreground">
                Export PDF
              </Button>
              <Button size="sm" className="text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                Share
              </Button>
            </div>
          </div>
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Simulation Report</h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">200 agents · 5 rounds · 14 minutes ago</p>
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
          {activeTab === 0 && <OverviewTab />}
          {activeTab === 1 && <ObjectionsTab />}
          {activeTab === 2 && <StrengthsTab />}
          {activeTab === 3 && <AgentFeedTab />}
          {activeTab === 4 && <RefinedPitchTab originalPitch={state?.description} />}
        </motion.div>
      </div>
    </div>
  );
};

export default Results;
