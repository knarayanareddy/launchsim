import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, X, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const scrollToSection = (id: string) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 400);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = (profile?.full_name || user?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/30"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg">🐟</span>
            <span className="font-semibold text-sm tracking-tight text-foreground">LaunchSim</span>
            <span className="text-xs text-muted-foreground hidden sm:inline ml-1">by MiroFish</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg"
            >
              How it Works
            </button>
            <button
              onClick={() => scrollToSection("personas")}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg"
            >
              Examples
            </button>
            <Link
              to="/wiki"
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg"
            >
              Wiki
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button
                  onClick={() => navigate("/dashboard")}
                  size="sm"
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-5 font-medium"
                >
                  Dashboard
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-medium text-primary hover:bg-primary/25 transition-colors overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initials
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border w-48">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate("/signup")}
                  size="sm"
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-5 font-medium"
                >
                  Start Simulation
                </Button>
              </>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-card border-l border-border/30 z-50 md:hidden p-6 pt-20"
            >
              <div className="space-y-2">
                <button onClick={() => scrollToSection("how-it-works")} className="block w-full text-left px-4 py-3 rounded-xl text-foreground hover:bg-muted/30 transition-colors">
                  How it Works
                </button>
                <button onClick={() => scrollToSection("personas")} className="block w-full text-left px-4 py-3 rounded-xl text-foreground hover:bg-muted/30 transition-colors">
                  Examples
                </button>
                <Link to="/wiki" className="block w-full px-4 py-3 rounded-xl text-foreground hover:bg-muted/30 transition-colors" onClick={() => setMenuOpen(false)}>
                  Wiki
                </Link>
                <div className="border-t border-border/30 pt-4 mt-4">
                  {user ? (
                    <div className="space-y-2">
                      <Button onClick={() => { navigate("/dashboard"); setMenuOpen(false); }} className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                        Dashboard
                      </Button>
                      <Button variant="ghost" onClick={() => { navigate("/settings"); setMenuOpen(false); }} className="w-full justify-start text-muted-foreground">
                        <Settings className="w-4 h-4 mr-2" /> Settings
                      </Button>
                      <Button variant="ghost" onClick={() => { handleSignOut(); setMenuOpen(false); }} className="w-full justify-start text-destructive">
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button onClick={() => { navigate("/signup"); setMenuOpen(false); }} className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                        Start Simulation
                      </Button>
                      <Button variant="ghost" onClick={() => { navigate("/login"); setMenuOpen(false); }} className="w-full text-muted-foreground">
                        Sign In
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
