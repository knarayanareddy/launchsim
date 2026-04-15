import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">🐟</span>
            <span className="font-bold text-lg tracking-tight text-foreground">LaunchSim</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg touch-target"
            >
              How it Works
            </button>
            <button
              onClick={() => scrollToSection("personas")}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg touch-target"
            >
              Examples
            </button>
            <Link
              to="/wiki"
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg touch-target"
            >
              Wiki
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/studio")}
              size="sm"
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-5 font-semibold btn-shimmer touch-target"
            >
              Start Simulation
            </Button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors touch-target"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu drawer */}
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
              className="fixed top-0 right-0 bottom-0 w-72 bg-card border-l border-border z-50 md:hidden p-6 pt-20"
            >
              <div className="space-y-2">
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="block w-full text-left px-4 py-3 rounded-xl text-foreground hover:bg-muted/50 transition-colors touch-target"
                >
                  How it Works
                </button>
                <button
                  onClick={() => scrollToSection("personas")}
                  className="block w-full text-left px-4 py-3 rounded-xl text-foreground hover:bg-muted/50 transition-colors touch-target"
                >
                  Examples
                </button>
                <Link
                  to="/wiki"
                  className="block w-full px-4 py-3 rounded-xl text-foreground hover:bg-muted/50 transition-colors touch-target"
                  onClick={() => setMenuOpen(false)}
                >
                  Wiki
                </Link>
                <div className="border-t border-border pt-4 mt-4">
                  <Button
                    onClick={() => { navigate("/studio"); setMenuOpen(false); }}
                    className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold btn-shimmer touch-target"
                  >
                    Start Simulation
                  </Button>
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
