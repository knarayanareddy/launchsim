import jsPDF from "jspdf";
import type { SimulationResult } from "@/hooks/useSimulation";

const BLUE = [79, 142, 247]; // LaunchSim blue
const DARK = [30, 30, 40];
const GRAY = [100, 116, 139];
const WHITE = [255, 255, 255];

function setColor(doc: jsPDF, rgb: number[]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function addFooter(doc: jsPDF, page: number, total: number) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  setColor(doc, GRAY);
  doc.setFontSize(8);
  doc.text("LaunchSim — Swarm Intelligence Report", 20, h - 12);
  doc.text(`Page ${page} of ${total}`, w - 20, h - 12, { align: "right" });
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

export async function generatePdfReport(
  result: SimulationResult,
  description: string
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pw - margin * 2;
  const totalPages = 5;

  // ---- PAGE 1: COVER ----
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pw, doc.internal.pageSize.getHeight(), "F");

  // Logo text
  setColor(doc, BLUE);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text("LaunchSim", pw / 2, 80, { align: "center" });

  setColor(doc, DARK);
  doc.setFontSize(22);
  doc.text("Simulation Report", pw / 2, 95, { align: "center" });

  // Description excerpt
  setColor(doc, GRAY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const descExcerpt = description.length > 200 ? description.slice(0, 200) + "…" : description;
  const descLines = wrapText(doc, descExcerpt, contentWidth - 20);
  doc.text(descLines, pw / 2, 120, { align: "center" });

  // Date
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  doc.setFontSize(10);
  doc.text(dateStr, pw / 2, 155, { align: "center" });

  // Tagline
  setColor(doc, BLUE);
  doc.setFontSize(9);
  doc.text("Powered by LaunchSim swarm intelligence", pw / 2, 170, { align: "center" });

  // Score badge
  setColor(doc, BLUE);
  doc.setFontSize(48);
  doc.setFont("helvetica", "bold");
  doc.text(`${result.overall_score}`, pw / 2, 210, { align: "center" });
  setColor(doc, GRAY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Launch Readiness Score", pw / 2, 218, { align: "center" });

  addFooter(doc, 1, totalPages);

  // ---- PAGE 2: EXECUTIVE SUMMARY ----
  doc.addPage();
  let y = 25;

  setColor(doc, BLUE);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", margin, y);
  y += 15;

  // Score
  setColor(doc, DARK);
  doc.setFontSize(36);
  doc.text(`${result.overall_score}/100`, pw / 2, y + 5, { align: "center" });
  setColor(doc, GRAY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Launch Readiness Score", pw / 2, y + 14, { align: "center" });
  y += 28;

  // Sentiment breakdown
  if (result.sentiment_breakdown?.length > 0) {
    setColor(doc, BLUE);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Sentiment Breakdown", margin, y);
    y += 8;

    setColor(doc, DARK);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    result.sentiment_breakdown.forEach((s: any) => {
      const line = `${s.audience}: ${s.excited}% Excited | ${s.skeptical}% Skeptical | ${s.neutral}% Neutral | ${s.hostile || 0}% Hostile`;
      doc.text(line, margin + 4, y);
      y += 6;
    });
    y += 6;
  }

  // Top 3 objections
  const objections = result.top_objections?.slice(0, 3) || [];
  if (objections.length > 0) {
    setColor(doc, BLUE);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Top 3 Objections", margin, y);
    y += 8;
    setColor(doc, DARK);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    objections.forEach((o: any, i: number) => {
      const lines = wrapText(doc, `${i + 1}. ${o.text}`, contentWidth - 8);
      doc.text(lines, margin + 4, y);
      y += lines.length * 5 + 3;
    });
    y += 4;
  }

  // Top 3 strengths
  const strengths = result.top_strengths?.slice(0, 3) || [];
  if (strengths.length > 0) {
    setColor(doc, BLUE);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Top 3 Strengths", margin, y);
    y += 8;
    setColor(doc, DARK);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    strengths.forEach((s: any, i: number) => {
      const lines = wrapText(doc, `${i + 1}. ${s.text}`, contentWidth - 8);
      doc.text(lines, margin + 4, y);
      y += lines.length * 5 + 3;
    });
    y += 4;
  }

  // Key quote
  if (result.key_quote) {
    setColor(doc, BLUE);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Key Quote", margin, y);
    y += 8;

    // Quote box
    doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.setLineWidth(0.8);
    doc.line(margin + 4, y - 3, margin + 4, y + 14);

    setColor(doc, DARK);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const quoteLines = wrapText(doc, `"${result.key_quote}"`, contentWidth - 14);
    doc.text(quoteLines, margin + 8, y);
    y += quoteLines.length * 5 + 3;
    setColor(doc, GRAY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`— ${result.key_quote_agent}`, margin + 8, y);
  }

  addFooter(doc, 2, totalPages);

  // ---- PAGE 3: DETAILED OBJECTIONS ----
  doc.addPage();
  y = 25;

  setColor(doc, BLUE);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Objections", margin, y);
  y += 12;

  setColor(doc, DARK);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  (result.top_objections || []).forEach((o: any, i: number) => {
    if (y > 260) {
      addFooter(doc, 3, totalPages);
      doc.addPage();
      y = 25;
    }

    doc.setFont("helvetica", "bold");
    setColor(doc, DARK);
    const header = `${i + 1}. ${o.text}`;
    const headerLines = wrapText(doc, header, contentWidth - 4);
    doc.text(headerLines, margin, y);
    y += headerLines.length * 5 + 2;

    doc.setFont("helvetica", "normal");
    setColor(doc, GRAY);
    doc.text(`${o.agent_count || o.agents || 0} agents · ${o.category || "General"}`, margin + 4, y);
    y += 5;

    if (o.quote) {
      setColor(doc, DARK);
      doc.setFont("helvetica", "italic");
      const qLines = wrapText(doc, `"${o.quote}"`, contentWidth - 12);
      doc.text(qLines, margin + 8, y);
      y += qLines.length * 5 + 2;
      setColor(doc, GRAY);
      doc.setFont("helvetica", "normal");
      doc.text(`— ${o.agent || "Agent"}, ${o.role || ""}`, margin + 8, y);
      y += 8;
    } else {
      y += 4;
    }
  });

  addFooter(doc, 3, totalPages);

  // ---- PAGE 4: REFINED PITCH ----
  doc.addPage();
  y = 25;

  setColor(doc, BLUE);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Refined Pitch", margin, y);
  y += 14;

  // Original
  setColor(doc, GRAY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Original Pitch", margin, y);
  y += 7;
  setColor(doc, DARK);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const origLines = wrapText(doc, description || "N/A", contentWidth);
  doc.text(origLines, margin, y);
  y += origLines.length * 5 + 10;

  // Refined
  setColor(doc, BLUE);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Refined Pitch", margin, y);
  y += 7;
  setColor(doc, DARK);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const refLines = wrapText(doc, result.sharpened_pitch || "N/A", contentWidth);
  doc.text(refLines, margin, y);
  y += refLines.length * 5 + 10;

  // Changes made
  if (result.pitch_changes_made) {
    setColor(doc, GRAY);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Changes Made", margin, y);
    y += 7;
    setColor(doc, DARK);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const chLines = wrapText(doc, result.pitch_changes_made, contentWidth);
    doc.text(chLines, margin, y);
  }

  addFooter(doc, 4, totalPages);

  // ---- PAGE 5: RECOMMENDED NEXT STEPS ----
  doc.addPage();
  y = 25;

  setColor(doc, BLUE);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Recommended Next Steps", margin, y);
  y += 14;

  setColor(doc, DARK);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  (result.recommended_actions || []).forEach((action: string, i: number) => {
    const lines = wrapText(doc, `${i + 1}. ${action}`, contentWidth - 4);
    doc.text(lines, margin, y);
    y += lines.length * 6 + 4;
  });

  y += 16;
  setColor(doc, BLUE);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Re-run your simulation after implementing these changes at launchsim.app", pw / 2, y, { align: "center" });

  addFooter(doc, 5, totalPages);

  // Download
  const dateFile = new Date().toISOString().split("T")[0];
  doc.save(`LaunchSim-Report-${dateFile}.pdf`);
}
