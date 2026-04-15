import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const codeLines = [
  { num: 1, content: 'import { LaunchSim } from "launchsim";', keyword: "import", highlight: "LaunchSim" },
  { num: 2, content: '' },
  { num: 3, content: '// Configure your simulation', comment: true },
  { num: 4, content: 'const sim = LaunchSim.create({', keyword: "const" },
  { num: 5, content: '  product: "AI-powered expense tracker",', string: true },
  { num: 6, content: '  crowd: 1000,', number: true },
  { num: 7, content: '  audience: ["PMs", "Founders", "Skeptics"],', string: true },
  { num: 8, content: '  depth: "deep"', string: true },
  { num: 9, content: '});' },
  { num: 10, content: '' },
  { num: 11, content: '// Launch the swarm', comment: true },
  { num: 12, content: 'const report = await sim.run();', keyword: "const", highlight: "await" },
  { num: 13, content: '' },
  { num: 14, content: '// Results stream in real-time', comment: true },
  { num: 15, content: 'console.log(report.score);', highlight: "console" },
  { num: 16, content: '// → 73 "Strong concept, pricing needs work"', comment: true },
];

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 pb-16">
      {/* Subtle radial glow */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/4 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-secondary/3 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                <span className="text-xs text-muted-foreground tracking-wide">
                  Powered by Swarm Intelligence
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="text-4xl md:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.08] mb-6"
            >
              What if 1,000 users reacted to your idea{" "}
              <span className="text-primary">right now?</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-md"
            >
              Paste your product description. Watch AI personas debate it in real-time. Ship with confidence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                size="lg"
                onClick={() => navigate("/studio")}
                className="rounded-full px-8 py-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Simulate My Launch →
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/results")}
                className="rounded-full px-8 py-6 text-base font-semibold border-border/60 text-foreground hover:bg-muted/20 transition-colors"
              >
                See Example Report
              </Button>
            </motion.div>
          </div>

          {/* Right — Terminal code block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="hidden lg:block"
          >
            <div className="rounded-xl border border-border/60 bg-[hsl(222,50%,6%)] overflow-hidden shadow-2xl shadow-black/20">
              {/* Terminal header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-warning/80" />
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                </div>
                <span className="text-xs text-muted-foreground font-mono">LaunchSim</span>
              </div>

              {/* Code content */}
              <div className="p-5 font-mono text-[13px] leading-relaxed overflow-x-auto">
                {codeLines.map((line, i) => (
                  <motion.div
                    key={line.num}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.04 }}
                    className="flex"
                  >
                    <span className="text-muted-foreground/40 w-8 text-right mr-4 select-none flex-shrink-0">
                      {line.num}
                    </span>
                    <span className={line.comment ? "text-muted-foreground/50" : "text-foreground/90"}>
                      {line.comment ? (
                        line.content
                      ) : (
                        <CodeLine content={line.content} />
                      )}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Simple syntax highlighting
const CodeLine = ({ content }: { content: string }) => {
  if (!content) return null;

  const highlighted = content
    .replace(/(import|from|const|await|let)/g, '<kw>$1</kw>')
    .replace(/(".*?")/g, '<str>$1</str>')
    .replace(/(\d+)/g, '<num>$1</num>')
    .replace(/(LaunchSim|console|sim|report)/g, '<fn>$1</fn>');

  const parts = highlighted.split(/(<kw>.*?<\/kw>|<str>.*?<\/str>|<num>.*?<\/num>|<fn>.*?<\/fn>)/);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('<kw>')) return <span key={i} className="text-primary">{part.replace(/<\/?kw>/g, '')}</span>;
        if (part.startsWith('<str>')) return <span key={i} className="text-secondary">{part.replace(/<\/?str>/g, '')}</span>;
        if (part.startsWith('<num>')) return <span key={i} className="text-warning">{part.replace(/<\/?num>/g, '')}</span>;
        if (part.startsWith('<fn>')) return <span key={i} className="text-primary/70">{part.replace(/<\/?fn>/g, '')}</span>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export default HeroSection;
