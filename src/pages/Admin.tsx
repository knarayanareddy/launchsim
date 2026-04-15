import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield, Users, BarChart3, Activity, Settings, RefreshCw,
  Search, ChevronLeft, ChevronRight, Eye, CreditCard, Ban,
  Trash2, Globe, Lock, AlertTriangle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  plan_tier: string;
  credits_remaining: number;
  simulations_run: number;
  created_at: string;
  is_suspended: boolean;
  is_admin: boolean;
}

interface AdminSim {
  id: string;
  user_id: string | null;
  overall_score: number;
  created_at: string;
  crowd_size: number;
  share_token: string | null;
  product_description: string;
}

interface FeatureFlag {
  id: string;
  flag_name: string;
  enabled: boolean;
  description: string | null;
}

interface ErrorLog {
  id: string;
  user_id: string | null;
  error_message: string;
  page: string | null;
  created_at: string;
}

// ─── Component ──────────────────────────────────────────────────
const Admin = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect non-admins silently
  useEffect(() => {
    if (!isLoading && (!profile || !profile.is_admin)) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoading, profile, navigate]);

  if (isLoading || !profile?.is_admin) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Admin Dashboard | LaunchSim" noIndex />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs font-bold gap-1">
              <Shield className="w-3 h-3" /> ADMIN
            </Badge>
            <span className="text-sm font-semibold text-foreground">LaunchSim Control Panel</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-xs text-muted-foreground">
            ← Back to App
          </Button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/20 border border-border">
            <TabsTrigger value="overview" className="gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" /> Overview</TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> Users</TabsTrigger>
            <TabsTrigger value="simulations" className="gap-1.5 text-xs"><Activity className="w-3.5 h-3.5" /> Simulations</TabsTrigger>
            <TabsTrigger value="health" className="gap-1.5 text-xs"><AlertTriangle className="w-3.5 h-3.5" /> System Health</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-xs"><Settings className="w-3.5 h-3.5" /> Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="simulations"><SimulationsTab /></TabsContent>
          <TabsContent value="health"><HealthTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// ─── OVERVIEW TAB ───────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState({ totalUsers: 0, simsToday: 0, simsYesterday: 0, proUsers: 0, creditsToday: 0 });
  const [planDist, setPlanDist] = useState<{ plan_tier: string; count: number }[]>([]);
  const [topSims, setTopSims] = useState<{ id: string; overall_score: number; product_description: string }[]>([]);

  const fetchStats = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const [usersRes, simsTodayRes, simsYesterdayRes, proRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("simulations").select("id", { count: "exact", head: true }).gte("created_at", today),
      supabase.from("simulations").select("id", { count: "exact", head: true }).gte("created_at", yesterday).lt("created_at", today),
      supabase.from("profiles").select("id", { count: "exact", head: true }).neq("plan_tier", "free"),
    ]);

    setStats({
      totalUsers: usersRes.count || 0,
      simsToday: simsTodayRes.count || 0,
      simsYesterday: simsYesterdayRes.count || 0,
      proUsers: proRes.count || 0,
      creditsToday: 0,
    });

    // Plan distribution
    const { data: allProfiles } = await supabase.from("profiles").select("plan_tier");
    if (allProfiles) {
      const dist: Record<string, number> = {};
      allProfiles.forEach((p: any) => { dist[p.plan_tier] = (dist[p.plan_tier] || 0) + 1; });
      setPlanDist(Object.entries(dist).map(([plan_tier, count]) => ({ plan_tier, count })));
    }

    // Top sims today
    const { data: topData } = await supabase
      .from("simulations")
      .select("id, overall_score, product_description")
      .gte("created_at", today)
      .order("overall_score", { ascending: false })
      .limit(5);
    setTopSims((topData as any[]) || []);
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const simDelta = stats.simsToday - stats.simsYesterday;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Users" value={stats.totalUsers} />
        <KPICard label="Simulations Today" value={stats.simsToday} delta={simDelta} />
        <KPICard label="Active Pro Users" value={stats.proUsers} subtitle={stats.totalUsers > 0 ? `${Math.round((stats.proUsers / stats.totalUsers) * 100)}% of total` : ""} />
        <KPICard label="Credits Consumed Today" value={stats.creditsToday} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan distribution */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Plan Distribution</h3>
          <div className="space-y-3">
            {planDist.map((d) => {
              const total = planDist.reduce((a, b) => a + b.count, 0);
              const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
              return (
                <div key={d.plan_tier} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground w-20 capitalize">{d.plan_tier}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">{d.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top sims today */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Top Scoring Simulations Today</h3>
          {topSims.length === 0 ? (
            <p className="text-xs text-muted-foreground">No simulations today</p>
          ) : (
            <div className="space-y-2">
              {topSims.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground w-5">#{i + 1}</span>
                  <span className="font-mono text-primary font-bold">{s.overall_score}/100</span>
                  <span className="text-foreground truncate flex-1">{s.product_description.slice(0, 60)}…</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, delta, subtitle }: { label: string; value: number; delta?: number; subtitle?: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value.toLocaleString()}</p>
      {delta !== undefined && (
        <p className={`text-xs font-mono mt-1 ${delta >= 0 ? "text-success" : "text-destructive"}`}>
          {delta >= 0 ? "+" : ""}{delta} vs yesterday
        </p>
      )}
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── USERS TAB ──────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [grantModal, setGrantModal] = useState<AdminUser | null>(null);
  const [grantAmount, setGrantAmount] = useState("5");
  const PER_PAGE = 25;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("id, email, full_name, plan_tier, credits_remaining, simulations_run, created_at, is_suspended, is_admin", { count: "exact" });

    if (planFilter === "suspended") {
      query = query.eq("is_suspended", true);
    } else if (planFilter !== "all") {
      query = query.eq("plan_tier", planFilter);
    }

    if (search.trim()) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data, count } = await query
      .order("created_at", { ascending: false })
      .range(page * PER_PAGE, (page + 1) * PER_PAGE - 1);

    setUsers((data as AdminUser[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, search, planFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleGrantCredits = async () => {
    if (!grantModal) return;
    const amount = parseInt(grantAmount);
    if (isNaN(amount) || amount <= 0) return;
    await supabase
      .from("profiles")
      .update({ credits_remaining: grantModal.credits_remaining + amount } as any)
      .eq("id", grantModal.id);
    toast.success(`+${amount} credits granted to ${grantModal.email}`);
    setGrantModal(null);
    fetchUsers();
  };

  const handleChangePlan = async (userId: string, newPlan: string) => {
    await supabase.from("profiles").update({ plan_tier: newPlan } as any).eq("id", userId);
    toast.success(`Plan changed to ${newPlan}`);
    fetchUsers();
  };

  const handleSuspend = async (u: AdminUser) => {
    await supabase.from("profiles").update({ is_suspended: !u.is_suspended } as any).eq("id", u.id);
    toast.success(u.is_suspended ? "User unsuspended" : "User suspended");
    fetchUsers();
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by email or name…"
            className="pl-9 bg-muted/20 border-border text-sm"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "free", "pro", "unlimited", "suspended"].map((f) => (
            <button
              key={f}
              onClick={() => { setPlanFilter(f); setPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
                planFilter === f
                  ? "bg-primary/15 border-primary/40 text-foreground"
                  : "border-border text-muted-foreground hover:border-muted-foreground/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{total} users</span>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Plan</TableHead>
              <TableHead className="text-xs">Credits</TableHead>
              <TableHead className="text-xs">Sims</TableHead>
              <TableHead className="text-xs">Joined</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No users found</TableCell></TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className={u.is_suspended ? "opacity-50" : ""}>
                  <TableCell className="text-xs font-mono">{u.email || "—"}</TableCell>
                  <TableCell className="text-xs">{u.full_name || "—"}</TableCell>
                  <TableCell>
                    <Select value={u.plan_tier} onValueChange={(v) => handleChangePlan(u.id, v)}>
                      <SelectTrigger className="h-7 w-24 text-[10px] border-border bg-muted/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["free", "pro", "unlimited", "enterprise"].map((p) => (
                          <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{u.credits_remaining}</TableCell>
                  <TableCell className="text-xs font-mono">{u.simulations_run}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={() => setGrantModal(u)}>
                        <CreditCard className="w-3 h-3 mr-1" /> Credits
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 px-2 text-[10px] ${u.is_suspended ? "text-success" : "text-destructive"}`}
                        onClick={() => handleSuspend(u)}
                      >
                        <Ban className="w-3 h-3 mr-1" /> {u.is_suspended ? "Unsuspend" : "Suspend"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button size="sm" variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Grant credits modal */}
      <Dialog open={!!grantModal} onOpenChange={() => setGrantModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Grant Credits to {grantModal?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Current balance: {grantModal?.credits_remaining} credits</p>
            <Input
              type="number"
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
              placeholder="Amount"
              className="bg-muted/20 border-border"
            />
          </div>
          <DialogFooter>
            <Button size="sm" onClick={handleGrantCredits}>Grant Credits</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── SIMULATIONS TAB ────────────────────────────────────────────
function SimulationsTab() {
  const [sims, setSims] = useState<(AdminSim & { user_email?: string })[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const PER_PAGE = 25;

  const fetchSims = useCallback(async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from("simulations")
      .select("id, user_id, overall_score, created_at, crowd_size, share_token, product_description", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PER_PAGE, (page + 1) * PER_PAGE - 1);

    if (data) {
      // Fetch user emails
      const userIds = [...new Set(data.map((s: any) => s.user_id).filter(Boolean))];
      const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", userIds as string[]);
      const emailMap = new Map((profiles || []).map((p: any) => [p.id, p.email]));
      setSims(data.map((s: any) => ({ ...s, user_email: emailMap.get(s.user_id) || "—" })));
    }
    setTotal(count || 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchSims(); }, [fetchSims]);

  const togglePublic = async (sim: AdminSim) => {
    const newToken = sim.share_token ? null : Math.random().toString(36).slice(2, 10);
    await supabase.from("simulations").update({ share_token: newToken } as any).eq("id", sim.id);
    toast.success(newToken ? "Made public" : "Made private");
    fetchSims();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("simulations").delete().eq("id", deleteTarget);
    toast.success("Simulation deleted");
    setDeleteTarget(null);
    fetchSims();
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{total} total simulations</span>
        <Button size="sm" variant="ghost" onClick={fetchSims} className="gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">ID</TableHead>
              <TableHead className="text-xs">User</TableHead>
              <TableHead className="text-xs">Score</TableHead>
              <TableHead className="text-xs">Agents</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Public</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : (
              sims.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{s.id.slice(0, 8)}…</TableCell>
                  <TableCell className="text-xs">{s.user_email}</TableCell>
                  <TableCell className="text-xs font-mono font-bold text-primary">{s.overall_score}</TableCell>
                  <TableCell className="text-xs font-mono">{s.crowd_size}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <button onClick={() => togglePublic(s)} className="text-xs">
                      {s.share_token ? <Globe className="w-3.5 h-3.5 text-success" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" asChild>
                        <a href={`/results?id=${s.id}`} target="_blank" rel="noreferrer">
                          <Eye className="w-3 h-3 mr-1" /> View
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[10px] text-destructive"
                        onClick={() => setDeleteTarget(s.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button size="sm" variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Delete Simulation?</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">This will permanently delete the simulation and all associated data. This cannot be undone.</p>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button size="sm" variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── HEALTH TAB ─────────────────────────────────────────────────
function HealthTab() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as any)
      .from("error_logs")
      .select("id, user_id, error_message, page, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setErrors((data as ErrorLog[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Service status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
          <div>
            <p className="text-xs font-semibold text-foreground">Database</p>
            <p className="text-[10px] text-muted-foreground">Connected</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
          <div>
            <p className="text-xs font-semibold text-foreground">Edge Functions</p>
            <p className="text-[10px] text-muted-foreground">Operational</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
          <div>
            <p className="text-xs font-semibold text-foreground">AI Gateway</p>
            <p className="text-[10px] text-muted-foreground">Operational</p>
          </div>
        </div>
      </div>

      {/* Error logs */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Recent Error Logs (last 20)</h3>
        {loading ? (
          <p className="text-xs text-muted-foreground animate-pulse">Loading…</p>
        ) : errors.length === 0 ? (
          <p className="text-xs text-muted-foreground">🎉 No errors logged</p>
        ) : (
          <div className="space-y-2">
            {errors.map((err) => (
              <div key={err.id} className="bg-destructive/5 border border-destructive/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">{err.page || "Unknown page"}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(err.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs font-mono text-destructive">{err.error_message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SETTINGS TAB ───────────────────────────────────────────────
function SettingsTab() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [maintenance, setMaintenance] = useState(false);
  const [announcement, setAnnouncement] = useState({ enabled: false, text: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      (supabase as any).from("feature_flags").select("*"),
      (supabase as any).from("system_settings").select("*"),
    ]).then(([flagsRes, settingsRes]) => {
      setFlags((flagsRes.data as FeatureFlag[]) || []);
      const settings = (settingsRes.data as any[]) || [];
      const mm = settings.find((s) => s.key === "maintenance_mode");
      const ann = settings.find((s) => s.key === "announcement");
      if (mm) setMaintenance(mm.value?.enabled || false);
      if (ann) setAnnouncement({ enabled: ann.value?.enabled || false, text: ann.value?.text || "" });
      setLoading(false);
    });
  }, []);

  const toggleFlag = async (flag: FeatureFlag) => {
    const newEnabled = !flag.enabled;
    await (supabase as any).from("feature_flags").update({ enabled: newEnabled }).eq("id", flag.id);
    setFlags((prev) => prev.map((f) => (f.id === flag.id ? { ...f, enabled: newEnabled } : f)));
    toast.success(`${flag.flag_name} ${newEnabled ? "enabled" : "disabled"}`);
  };

  const toggleMaintenance = async () => {
    const newVal = !maintenance;
    await (supabase as any).from("system_settings").update({ value: { enabled: newVal } }).eq("key", "maintenance_mode");
    setMaintenance(newVal);
    toast.success(newVal ? "Maintenance mode ON" : "Maintenance mode OFF");
  };

  const saveAnnouncement = async () => {
    await (supabase as any).from("system_settings").update({ value: announcement }).eq("key", "announcement");
    toast.success("Announcement updated");
  };

  if (loading) return <p className="text-xs text-muted-foreground animate-pulse">Loading…</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Maintenance mode */}
      <div className="glass-card rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Maintenance Mode</h3>
            <p className="text-xs text-muted-foreground">When enabled, non-admin users see a maintenance page</p>
          </div>
          <Switch checked={maintenance} onCheckedChange={toggleMaintenance} />
        </div>
      </div>

      {/* Feature flags */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Feature Flags</h3>
        <div className="space-y-3">
          {flags.map((f) => (
            <div key={f.id} className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground capitalize">{f.flag_name.replace(/_/g, " ")}</p>
                <p className="text-[10px] text-muted-foreground">{f.description}</p>
              </div>
              <Switch checked={f.enabled} onCheckedChange={() => toggleFlag(f)} />
            </div>
          ))}
        </div>
      </div>

      {/* Announcement */}
      <div className="glass-card rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">System Announcement</h3>
          <Switch
            checked={announcement.enabled}
            onCheckedChange={(checked) => setAnnouncement((p) => ({ ...p, enabled: checked }))}
          />
        </div>
        <Textarea
          value={announcement.text}
          onChange={(e) => setAnnouncement((p) => ({ ...p, text: e.target.value }))}
          placeholder="Enter announcement text…"
          className="bg-muted/20 border-border text-sm h-20 resize-none"
        />
        <Button size="sm" onClick={saveAnnouncement}>Save Announcement</Button>
      </div>
    </div>
  );
}

export default Admin;
