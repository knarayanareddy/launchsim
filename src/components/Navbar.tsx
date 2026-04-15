import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-black text-xs">LS</span>
          </div>
          <span className="font-bold text-lg tracking-tight">LaunchSim</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm">
            How It Works
          </Button>
          <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-5">
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
