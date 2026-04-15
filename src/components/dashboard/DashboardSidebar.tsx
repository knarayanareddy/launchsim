import { Home, FlaskConical, BookOpen, BarChart3, Settings, ChevronsUpDown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: Home, emoji: "🏠" },
  { title: "New Simulation", url: "/studio", icon: FlaskConical, emoji: "🧪" },
  { title: "My Simulations", url: "/dashboard", icon: BookOpen, emoji: "📚", hash: "#simulations" },
  { title: "Iteration Tracker", url: "/tracker", icon: BarChart3, emoji: "🔁" },
  { title: "Compare", url: "/compare", icon: BarChart3, emoji: "📊" },
  { title: "Settings", url: "/settings", icon: Settings, emoji: "⚙️" },
];

export function DashboardSidebar() {
  const { user, profile } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const initials = (profile?.full_name || user?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const creditsUsed = (profile?.simulations_run ?? 0);
  const creditsTotal = (profile?.credits_remaining ?? 3) + creditsUsed;
  const creditsPercent = creditsTotal > 0 ? (creditsUsed / creditsTotal) * 100 : 0;

  const planLabel = profile?.plan_tier === "enterprise" ? "Enterprise" : profile?.plan_tier === "pro" ? "Pro" : "Free";
  const planColor = profile?.plan_tier === "enterprise" ? "bg-accent text-accent-foreground" : profile?.plan_tier === "pro" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground";

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      <SidebarContent>
        {/* User info */}
        {!collapsed && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || "User"}</p>
                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${planColor}`}>
                  {planLabel}
                </span>
              </div>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      activeClassName="bg-muted text-foreground font-medium"
                    >
                      <span className="text-base">{item.emoji}</span>
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Credits widget */}
      <SidebarFooter>
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{creditsUsed} / {creditsTotal} credits used</span>
              </div>
              <Progress value={creditsPercent} className="h-1.5" />
              <a href="/pricing" className="text-[11px] text-primary hover:underline">
                Upgrade for unlimited →
              </a>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
