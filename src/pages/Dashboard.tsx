import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Trash2, Eye, RefreshCw, Download, Plus, ArrowRight, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SEO from "@/components/SEO";

interface SimRow {
  id: string;
  product_description: string;
  created_at: string;
  overall_score: number;
  top_objections: any;
  audience_mix: string[];
  share_token: string | null;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [sims, setSims] = useState<SimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from("simulations")
        .select("id, product_description, created_at, overall_score, top_objections, audience_mix, share_token")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setError(true);
      } else {
        setSims(data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("simulations").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete simulation.");
    } else {
      setSims((prev) => prev.filter((s) => s.id !== id));
      toast.success("Simulation deleted.");
    }
  };

  const handleExportCsv = () => {
    if (sims.length === 0) return;
    const header = "Product,Date,Score,Top Objection,Audiences\n";
    const rows = sims.map((s) => {
      const topObj = getTopObjCategory(s.top_objections);
      return `"${s.product_description.slice(0, 50).replace(/"/g, '""')}","${new Date(s.created_at).toLocaleDateString()}",${s.overall_score},"${topObj}","${(s.audience_mix || []).join(", ")}"`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LaunchSim-Export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  // Stats
  const totalSims = sims.length;
  const avgScore = totalSims > 0 ? Math.round(sims.reduce((a, s) => a + s.overall_score, 0) / totalSims) : 0;
  const topObjCategory = getTopCategory(sims);
  const creditsRemaining = profile?.credits_remaining ?? 3;

  // Chart data (last 10 sims, chronological)
  const chartData = sims
    .slice(0, 10)
    .reverse()
    .map((s) => ({
      date: new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: s.overall_score,
      name: s.product_description.slice(0, 30),
    }));

  const scoreColor = (s: number) =>
    s >= 70 ? "text-success bg-success/10" : s >= 50 ? "text-warning bg-warning/10" : "text-destructive bg-destructive/10";

  return (
    <DashboardLayout>
      <SEO title="Dashboard" path="/dashboard" noIndex />
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Resume onboarding banner */}
        {profile && !profile.onboarding_completed && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">You haven't finished onboarding yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Complete setup to get the most out of LaunchSim</p>
            </div>
            <Button size="sm" onClick={() => navigate("/onboarding")} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
              Resume onboarding →
            </Button>
          </div>
        )}

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, {profile?.full_name || "there"} 👋</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Simulations" value={loading ? "—" : String(totalSims)} />
          <StatCard label="Avg. Launch Score" value={loading ? "—" : `${avgScore} / 100`} valueClass={avgScore >= 70 ? "text-success" : avgScore >= 50 ? "text-warning" : "text-destructive"} />
          <StatCard label="Top Objection Theme" value={loading ? "—" : topObjCategory || "N/A"} />
          <StatCard label="Credits Remaining" value={loading ? "—" : String(creditsRemaining)} extra={creditsRemaining < 3 ? <a href="/pricing" className="text-[11px] text-primary hover:underline">Upgrade →</a> : undefined} />
        </div>

        {/* Score trend chart */}
        {!loading && sims.length >= 3 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Your Score Trend
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 64%)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 64%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215, 17%, 47%)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(215, 17%, 47%)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(214, 32%, 91%)" }}
                  formatter={(value: number, _: string, props: any) => [`Score: ${value}`, props.payload.name]}
                />
                <Area type="monotone" dataKey="score" stroke="hsl(217, 91%, 64%)" strokeWidth={2} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent simulations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Recent Simulations</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => {}}>
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
              <Button size="sm" onClick={() => navigate("/studio")} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" /> New Simulation
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
              <p className="text-sm text-destructive">Couldn't load simulations. Try refreshing.</p>
              <Button variant="outline" size="sm" className="mt-3 border-destructive/30" onClick={() => window.location.reload()}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
              </Button>
            </div>
          ) : sims.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
              <div className="text-5xl mb-4">🐟</div>
              <h3 className="text-lg font-semibold mb-2">No simulations yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Run your first simulation to see results here.</p>
              <Button onClick={() => navigate("/studio")} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                Run your first simulation →
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Product</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Score</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Top Objection</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Audience</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sims.slice(0, 10).map((sim) => (
                      <tr key={sim.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">
                          {sim.product_description.slice(0, 50)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(sim.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${scoreColor(sim.overall_score)}`}>
                            {sim.overall_score}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {getTopObjCategory(sim.top_objections)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {(sim.audience_mix || []).join(", ")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => navigate(`/wiki/${sim.share_token}`)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleDelete(sim.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {sims.slice(0, 10).map((sim) => (
                  <div key={sim.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                        {sim.product_description.slice(0, 60)}
                      </p>
                      <span className={`shrink-0 ml-2 inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${scoreColor(sim.overall_score)}`}>
                        {sim.overall_score}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{new Date(sim.created_at).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{getTopObjCategory(sim.top_objections)}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="text-xs h-7 border-white/10" onClick={() => navigate(`/wiki/${sim.share_token}`)}>
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={() => handleDelete(sim.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <QuickAction
              emoji="🔁"
              title="Re-run Last Simulation"
              description="Open Studio with your previous settings pre-filled"
              onClick={() => {
                if (sims.length > 0) {
                  navigate("/studio", { state: { prefill: sims[0].product_description } });
                } else {
                  navigate("/studio");
                }
              }}
            />
            <QuickAction
              emoji="📊"
              title="Compare Two Results"
              description="Side-by-side comparison of your simulations"
              onClick={() => navigate("/compare")}
            />
            <QuickAction
              emoji="📤"
              title="Export All Reports"
              description="Download a CSV summary of all simulations"
              onClick={handleExportCsv}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Helpers

function StatCard({ label, value, valueClass, extra }: { label: string; value: string; valueClass?: string; extra?: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass || "text-foreground"}`}>{value}</p>
      {extra}
    </div>
  );
}

function QuickAction({ emoji, title, description, onClick }: { emoji: string; title: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white/5 border border-white/10 rounded-xl p-5 text-left hover:bg-white/[0.08] hover:border-primary/30 transition-all group"
    >
      <span className="text-2xl">{emoji}</span>
      <h3 className="text-sm font-semibold mt-2 text-foreground group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </button>
  );
}

function getTopObjCategory(objections: any): string {
  if (!objections || !Array.isArray(objections) || objections.length === 0) return "N/A";
  return objections[0]?.category || "General";
}

function getTopCategory(sims: SimRow[]): string {
  const counts: Record<string, number> = {};
  sims.forEach((s) => {
    if (s.top_objections && Array.isArray(s.top_objections)) {
      s.top_objections.forEach((o: any) => {
        const cat = o.category || "General";
        counts[cat] = (counts[cat] || 0) + 1;
      });
    }
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || "N/A";
}

export default Dashboard;
