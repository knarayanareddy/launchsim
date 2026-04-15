import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { SimulationResult } from "@/hooks/useSimulation";

interface NotionExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: SimulationResult;
  description: string;
}

const NotionExportModal = ({ open, onOpenChange, result, description }: NotionExportModalProps) => {
  const [token, setToken] = useState("");
  const [pageId, setPageId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!token.trim() || !pageId.trim()) {
      toast.error("Please fill in both fields.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("notion-export", {
        body: {
          notionToken: token.trim(),
          parentPageId: pageId.trim(),
          title: description.slice(0, 60),
          score: result.overall_score,
          sentimentBreakdown: result.sentiment_breakdown,
          objections: result.top_objections,
          strengths: result.top_strengths,
          refinedPitch: result.sharpened_pitch,
          recommendedActions: result.recommended_actions,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success("Exported to Notion!", {
        description: "Your report has been created.",
        action: data?.url
          ? { label: "Open →", onClick: () => window.open(data.url, "_blank") }
          : undefined,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Notion export error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to export to Notion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Export to Notion</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Step 1: Enter your Notion Integration Token
            </Label>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ntn_..."
              className="font-mono text-sm bg-muted/30 border-border"
            />
            <a
              href="https://developers.notion.com/docs/create-a-notion-integration"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              How to get your Notion token <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Step 2: Enter your target Page ID or Database ID
            </Label>
            <Input
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              placeholder="abc123def456..."
              className="font-mono text-sm bg-muted/30 border-border"
            />
            <p className="text-xs text-muted-foreground">
              Copy the 32-character ID from the Notion page URL
            </p>
          </div>

          <Button
            onClick={handleExport}
            disabled={loading || !token.trim() || !pageId.trim()}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting…
              </>
            ) : (
              "Export to Notion"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotionExportModal;
