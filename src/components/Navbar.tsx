import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
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

        <Button
          onClick={() => navigate("/studio")}
          size="sm"
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-5 font-semibold"
        >
          Start Simulation
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
