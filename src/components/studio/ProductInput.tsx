import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { EXAMPLE_PITCHES, type ExampleKey } from "@/data/examplePitches";

interface ProductInputProps {
  description: string;
  setDescription: (v: string) => void;
  question: string;
  setQuestion: (v: string) => void;
  descriptionError?: string;
  clearError: () => void;
  charGuidance?: string | null;
}

const EXAMPLES: { key: ExampleKey; emoji: string; label: string }[] = [
  { key: "ecommerce", emoji: "🛒", label: "E-commerce Tool" },
  { key: "aidev", emoji: "🤖", label: "AI Dev Tool" },
  { key: "analytics", emoji: "📊", label: "Analytics SaaS" },
];

const MAX_CHARS = 2000;

const ProductInput = ({
  description,
  setDescription,
  question,
  setQuestion,
  descriptionError,
  clearError,
  charGuidance,
}: ProductInputProps) => {
  const charCount = description.length;
  const charColor =
    charCount >= MAX_CHARS
      ? "text-destructive"
      : charCount >= 1800
        ? "text-warning"
        : "text-muted-foreground";

  const handleChange = (val: string) => {
    if (val.length <= MAX_CHARS) {
      setDescription(val);
      if (descriptionError) clearError();
    }
  };

  return (
    <div className="space-y-6">
      {/* Product description */}
      <div>
        <label className="block text-sm font-semibold mb-1">Your Product Description</label>
        <p className="text-xs text-muted-foreground mb-3">
          Paste your landing page copy, one-pager, elevator pitch, or rough idea
        </p>
        <div className="relative">
          <Textarea
            value={description}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="E.g.: LaunchSim helps founders simulate how 1,000 real user types would react to their product before launch. Paste your pitch and get a sentiment map, top objections, and a refined pitch in minutes..."
            className={`min-h-[200px] resize-y font-mono text-sm bg-muted/30 border placeholder:text-muted-foreground/40 focus-visible:ring-primary ${
              descriptionError ? "border-destructive" : "border-border"
            }`}
          />
          <span className={`absolute bottom-3 right-3 text-xs font-mono ${charColor}`}>
            {charCount} / {MAX_CHARS}
          </span>
        </div>
        {descriptionError && (
          <p className="text-destructive text-xs mt-2 font-mono">{descriptionError}</p>
        )}
        {!descriptionError && charGuidance && (
          <p className="text-warning text-xs mt-2 font-mono">{charGuidance}</p>
        )}

        {/* Quick-fill examples */}
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.key}
              onClick={() => {
                setDescription(EXAMPLE_PITCHES[ex.key]);
                if (descriptionError) clearError();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium glass-card hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
            >
              {ex.emoji} {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Simulation question */}
      <div>
        <label className="block text-sm font-semibold mb-1">
          What do you most want to know?{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Give your simulation a focus
        </p>
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="E.g.: Will early-stage founders pay $29/mo? Is the positioning clear enough?"
          className="bg-muted/30 border-border text-sm placeholder:text-muted-foreground/40 focus-visible:ring-primary"
        />
      </div>
    </div>
  );
};

export default ProductInput;
