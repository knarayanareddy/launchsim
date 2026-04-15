import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, TrendingUp, Eye, Pencil, Check, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface SimGroup {
  id: string;
  product_name: string;
  simulation_ids: string[];
  latest_score: number;
  score_delta: number;
  created_at: string;
}

interface SimDetail {
  id: string;
  overall_score: number;
  created_at: string;
  product_description: string;
  share_token: string | null;
}

const Tracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<SimGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [simDetails, setSimDetails] = useState<Record<string, SimDetail[]>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from("simulation_groups")
      .select("*")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load tracker data");
    } else {
      setGroups((data as any[]) || []);
    }
    setLoading(false);
  };

  const toggleExpand = async (group: SimGroup) => {
    if (expandedId === group.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(group.id);

    if (!simDetails[group.id] && group.simulation_ids.length > 0) {
      const { data } = await supabase
        .from("simulations")
        .select("id, overall_score, created_at, product_description, share_token")
        .in("id", group.simulation_ids)
        .order("created_at", { ascending: true });

      if (data) {
        setSimDetails((prev) => ({ ...prev, [group.id]: data }));
      }
    }
  };

  const handleRename = async (groupId: string) => {
    if (!editName.trim()) return;
    await supabase
      .from("simulation_groups")
      .update({ product_name: editName.trim() })
      .eq("id", groupId);

    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, product_name: editName.trim() } : g))
    );
    setEditingId(null);
    toast.success("Product name updated");
  };

  const getScoreProgression = (group: SimGroup): string => {
    const details = simDetails[group.id];
    if (details && details.length > 0) {
      return details.map((d) => d.overall_score).join(" → ");
    }
    return String(group.latest_score);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">🔁 Iteration Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Track how your pitch improves over time</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">📈</div>
            <h3 className="text-lg font-semibold mb-2">No iteration data yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Run at least 2 simulations of the same idea to see your iteration curve. Label your next run as an iteration in the Studio.
            </p>
            <Button onClick={() => navigate("/studio")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Label your next run as an iteration →
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const expanded = expandedId === group.id;
              const details = simDetails[group.id] || [];
              const chartData = details.map((d, i) => ({
                run: `Run ${i + 1}`,
                score: d.overall_score,
              }));
              const firstScore = details[0]?.overall_score || 0;
              const lastScore = group.latest_score;
              const delta = group.score_delta;
              const avgImprovement = details.length > 1
                ? ((lastScore - firstScore) / (details.length - 1)).toFixed(1)
                : "0";

              return (
                <div key={group.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() => toggleExpand(group)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {editingId === group.id ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-7 w-48 bg-white/5 border-white/10 text-sm"
                              onKeyDown={(e) => e.key === "Enter" && handleRename(group.id)}
                              autoFocus
                            />
                            <button onClick={() => handleRename(group.id)} className="text-success"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <>
                            <span className="font-semibold text-foreground truncate">{group.product_name}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingId(group.id); setEditName(group.product_name); }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{group.simulation_ids.length} runs</span>
                        <span>·</span>
                        <span className="font-mono">
                          {expanded && details.length > 0 ? getScoreProgression(group) : `Score: ${group.latest_score}`}
                          {details.length > 1 && " 📈"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {delta > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-bold">
                          <TrendingUp className="w-3.5 h-3.5" /> +{delta} pts
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-white/10 h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/studio", { state: { prefill: details[details.length - 1]?.product_description || "", groupId: group.id, groupName: group.product_name } });
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Run
                      </Button>
                      {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {expanded && (
                    <div className="border-t border-white/10 p-5 space-y-6 animate-fade-in">
                      {/* Timeline */}
                      <div className="space-y-2">
                        {details.map((sim, i) => {
                          const scoreColor = sim.overall_score >= 70 ? "text-success" : sim.overall_score >= 50 ? "text-warning" : "text-destructive";
                          const timeAgo = getTimeAgo(sim.created_at);
                          return (
                            <div key={sim.id} className="flex items-center gap-4 text-sm py-1.5">
                              <span className="text-muted-foreground font-mono w-14 shrink-0">Run {i + 1}</span>
                              <div className="h-px flex-1 bg-white/5" />
                              <span className={`font-bold font-mono ${scoreColor}`}>{sim.overall_score}</span>
                              <span className="text-xs text-muted-foreground w-20 text-right">{timeAgo}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => navigate(`/wiki/${sim.share_token}`)}
                              >
                                <Eye className="w-3 h-3 mr-1" /> View
                              </Button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Chart */}
                      {chartData.length >= 2 && (
                        <div className="bg-white/[0.02] rounded-lg p-4">
                          <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id={`grad-${group.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(217, 91%, 64%)" stopOpacity={0.15} />
                                  <stop offset="95%" stopColor="hsl(217, 91%, 64%)" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="run" tick={{ fontSize: 11, fill: "hsl(215, 17%, 47%)" }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(215, 17%, 47%)" }} axisLine={false} tickLine={false} />
                              <Tooltip
                                contentStyle={{ background: "hsl(222, 40%, 10%)", border: "1px solid hsl(220, 20%, 18%)", borderRadius: 8, fontSize: 12 }}
                                labelStyle={{ color: "hsl(214, 32%, 91%)" }}
                              />
                              <Area type="monotone" dataKey="score" stroke="hsl(217, 91%, 64%)" strokeWidth={2} fill={`url(#grad-${group.id})`} dot={{ r: 4, fill: "hsl(217, 91%, 64%)" }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Velocity indicator */}
                      {details.length >= 2 && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm">
                          <p className="text-foreground">
                            You improved <span className="font-bold text-success">+{delta} points</span> in {details.length} iterations — avg <span className="font-bold">+{avgImprovement}</span> per run
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Top LaunchSim users typically reach 80+ in 5 runs
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default Tracker;
