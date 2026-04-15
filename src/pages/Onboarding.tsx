import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Rocket } from "lucide-react";
import { toast } from "sonner";

const EXAMPLE_IDEAS = [
  { label: "AI writing tool", text: "An AI-powered writing assistant that helps content creators draft blog posts, social media captions, and email newsletters in their brand voice. It learns from past content to maintain consistency and suggests SEO improvements." },
  { label: "B2B analytics dashboard", text: "A real-time analytics dashboard for B2B SaaS companies that consolidates metrics from Stripe, HubSpot, and Mixpanel into one view. Shows MRR, churn, cohort analysis, and predictive revenue forecasts." },
  { label: "Consumer mobile app", text: "A mobile app that gamifies daily fitness habits by turning workouts into RPG quests. Users earn XP, level up characters, and join guilds with friends. Integrates with Apple Health and Google Fit." },
];

const USER_TYPES = [
  { emoji: "🚀", label: "Founder building a startup", value: "founder" },
  { emoji: "🧑‍💼", label: "PM validating a feature", value: "pm" },
  { emoji: "👩‍💻", label: "Builder launching a side project", value: "builder" },
  { emoji: "💼", label: "Consultant testing client ideas", value: "consultant" },
];

const Onboarding = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState("");
  const [idea, setIdea] = useState("");
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // Redirect if already completed
  useEffect(() => {
    if (profile?.onboarding_completed) {
      navigate("/dashboard", { replace: true });
    }
  }, [profile, navigate]);

  const progressPercent = (step / 4) * 100;
  const name = profile?.full_name?.split(" ")[0] || "there";

  const handleComplete = async (goToSim: boolean) => {
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ onboarding_completed: true, user_type: userType })
      .eq("id", user.id);

    await refreshProfile();

    if (goToSim) {
      navigate("/studio", { state: { prefill: idea } });
    } else {
      navigate("/dashboard");
    }
  };

  const goTo = (s: number) => {
    setDirection(s > step ? "forward" : "back");
    setStep(s);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Animated gradient bg */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-3 pt-8 pb-4 relative z-10">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                s <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < 4 && <div className={`w-8 h-px transition-colors ${s < step ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground mb-6 relative z-10">Step {step} of 4</p>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div
          key={step}
          className={`w-full max-w-lg animate-fade-in`}
        >
          {step === 1 && <StepWelcome name={name} onNext={() => goTo(2)} />}
          {step === 2 && (
            <StepUserType
              selected={userType}
              onSelect={setUserType}
              onNext={() => goTo(3)}
              onBack={() => goTo(1)}
            />
          )}
          {step === 3 && (
            <StepIdea
              idea={idea}
              onIdeaChange={setIdea}
              onNext={() => goTo(4)}
              onBack={() => goTo(2)}
            />
          )}
          {step === 4 && (
            <StepReady
              idea={idea}
              onRunSim={() => handleComplete(true)}
              onDashboard={() => handleComplete(false)}
              onBack={() => goTo(3)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ── STEP 1 ──
function StepWelcome({ name, onNext }: { name: string; onNext: () => void }) {
  const props = [
    { emoji: "🧬", text: "Spin up a crowd of AI personas" },
    { emoji: "💬", text: "Watch them debate your idea" },
    { emoji: "📊", text: "Get a report in under 60 seconds" },
  ];

  return (
    <div className="text-center space-y-8">
      <div className="text-6xl">🐟</div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome, {name}! Let's set you up.</h1>
        <p className="text-muted-foreground mt-2">You're 4 steps away from your first simulation</p>
      </div>

      <div className="grid gap-3">
        {props.map((p, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 animate-fade-in"
            style={{ animationDelay: `${i * 150}ms`, animationFillMode: "both" }}
          >
            <span className="text-2xl">{p.emoji}</span>
            <span className="text-sm font-medium text-foreground">{p.text}</span>
          </div>
        ))}
      </div>

      <Button onClick={onNext} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 text-sm">
        Let's go <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

// ── STEP 2 ──
function StepUserType({
  selected,
  onSelect,
  onNext,
  onBack,
}: {
  selected: string;
  onSelect: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">What best describes you?</h1>
        <p className="text-muted-foreground mt-1 text-sm">So we can personalize your experience</p>
      </div>

      <div className="grid gap-3">
        {USER_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => onSelect(t.value)}
            className={`w-full text-left rounded-xl p-4 border transition-all ${
              selected === t.value
                ? "border-primary bg-primary/10 ring-1 ring-primary"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <span className="text-xl mr-3">{t.emoji}</span>
            <span className="text-sm font-medium text-foreground">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!selected}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
        >
          Continue <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── STEP 3 ──
function StepIdea({
  idea,
  onIdeaChange,
  onNext,
  onBack,
}: {
  idea: string;
  onIdeaChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">What's your first idea?</h1>
        <p className="text-muted-foreground mt-1 text-sm">You can edit this later — just get something down</p>
      </div>

      <div className="space-y-2">
        <Textarea
          value={idea}
          onChange={(e) => onIdeaChange(e.target.value.slice(0, 2000))}
          placeholder="Describe your product, idea, or feature in a few sentences..."
          className="min-h-[140px] bg-white/5 border-white/10 text-foreground resize-none focus-visible:ring-primary"
        />
        <p className="text-xs text-muted-foreground text-right">{idea.length} / 2000</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_IDEAS.map((ex) => (
          <button
            key={ex.label}
            onClick={() => onIdeaChange(ex.text)}
            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={idea.length < 50}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
        >
          Continue <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── STEP 4 ──
function StepReady({
  idea,
  onRunSim,
  onDashboard,
  onBack,
}: {
  idea: string;
  onRunSim: () => void;
  onDashboard: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <Confetti />

      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">You're all set! 🎉</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your simulation is ready to run</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Your idea</p>
          <p className="text-sm text-foreground leading-relaxed">{idea.slice(0, 100)}{idea.length > 100 ? "…" : ""}</p>
        </div>
        <div className="h-px bg-white/10" />
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Agents</p>
            <p className="text-foreground font-medium">200</p>
          </div>
          <div>
            <p className="text-muted-foreground">Audience</p>
            <p className="text-foreground font-medium">PMs, Founders, Skeptics, Early Adopters</p>
          </div>
          <div>
            <p className="text-muted-foreground">Est. time</p>
            <p className="text-foreground font-medium">~45 seconds</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Button onClick={onRunSim} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm gap-2">
          <Rocket className="w-4 h-4" /> Run My First Simulation →
        </Button>
        <Button variant="ghost" onClick={onDashboard} className="w-full text-muted-foreground text-sm">
          Explore Dashboard first
        </Button>
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground text-xs">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
        </Button>
      </div>
    </div>
  );
}

// ── CONFETTI ──
function Confetti() {
  const colors = [
    "hsl(217, 91%, 64%)",
    "hsl(166, 100%, 42%)",
    "hsl(36, 90%, 55%)",
    "hsl(145, 64%, 51%)",
    "hsl(353, 100%, 64%)",
    "hsl(270, 80%, 60%)",
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 14 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const size = 6 + Math.random() * 6;
        const color = colors[i % colors.length];
        const duration = 1.5 + Math.random() * 1;

        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              top: "-5%",
              width: size,
              height: size,
              background: color,
              animation: `confetti-fall ${duration}s ease-out ${delay}s forwards`,
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
}

export default Onboarding;
