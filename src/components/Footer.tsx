import { Link } from "react-router-dom";

const Footer = () => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="border-t border-border/50 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">🐟</span>
            <span className="font-bold text-foreground">LaunchSim</span>
            <span className="text-muted-foreground text-sm ml-2 hidden sm:inline">
              Simulate your launch before you ship
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-foreground transition-colors"
            >
              How it Works
            </button>
            <Link to="/wiki" className="hover:text-foreground transition-colors">
              Wiki
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <span className="hidden sm:inline">Built at Amsterdam Hackathon 2025</span>
          </div>
        </div>

        <div className="text-center mt-8 text-xs text-muted-foreground font-mono">
          Built with 🐟 MiroFish swarm intelligence + ❤️ Lovable
        </div>
      </div>
    </footer>
  );
};

export default Footer;
