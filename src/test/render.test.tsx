/**
 * Render smoke tests.
 *
 * These exist because the unit suite only covers pure functions, so a React or
 * component-library major upgrade had nothing catching runtime breakage —
 * `forwardRef` removal, Radix portal/asChild changes, Recharts container
 * assumptions, Sonner prop changes. Each test mounts a real component tree in
 * jsdom and asserts it produced markup without throwing or logging a React
 * error.
 *
 * This is deliberately not a snapshot test: snapshots of generated class names
 * churn on every styling change and get rubber-stamped. What matters here is
 * "does the tree mount and render content" across a major upgrade boundary.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";

// Recharts measures its container with ResizeObserver, which jsdom does not
// implement. Without this every chart test throws before rendering.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;

const errors: unknown[][] = [];
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errors.length = 0;
  errorSpy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    errors.push(args);
  });
});

afterEach(() => {
  errorSpy.mockRestore();
  cleanup();
});

/** Fail if React logged a warning/error while mounting the tree. */
function expectNoReactErrors() {
  const reactComplaints = errors.filter((args) =>
    args.some((a) => typeof a === "string" && /react|warning|invalid|not a function/i.test(a)),
  );
  expect(reactComplaints).toEqual([]);
}

const wrap = (ui: ReactNode) => render(<>{ui}</>);

describe("React 19 render compatibility", () => {
  it("mounts a Radix dialog through its portal", async () => {
    const { Dialog, DialogContent, DialogTitle, DialogTrigger } = await import("@/components/ui/dialog");
    wrap(
      <Dialog defaultOpen>
        <DialogTrigger>open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Simulation complete</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(await screen.findByText("Simulation complete")).toBeInTheDocument();
    expectNoReactErrors();
  });

  it("mounts a Radix tooltip provider without a host element", async () => {
    const { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } = await import(
      "@/components/ui/tooltip"
    );
    wrap(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>trigger</TooltipTrigger>
          <TooltipContent>tip body</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(await screen.findByText("tip body")).toBeInTheDocument();
    expectNoReactErrors();
  });

  it("mounts forwardRef-based primitives (button, input, label)", async () => {
    const { Button } = await import("@/components/ui/button");
    const { Input } = await import("@/components/ui/input");
    const { Label } = await import("@/components/ui/label");
    wrap(
      <>
        <Label htmlFor="pitch">Pitch</Label>
        <Input id="pitch" placeholder="Describe your product" />
        <Button>Simulate</Button>
      </>,
    );
    expect(screen.getByLabelText("Pitch")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Describe your product")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simulate" })).toBeInTheDocument();
    expectNoReactErrors();
  });

  it("mounts a Radix select and accordion", async () => {
    const { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } = await import(
      "@/components/ui/select"
    );
    const { Accordion, AccordionContent, AccordionItem, AccordionTrigger } = await import(
      "@/components/ui/accordion"
    );
    wrap(
      <>
        <Select value="standard">
          <SelectTrigger>
            <SelectValue placeholder="depth" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard</SelectItem>
          </SelectContent>
        </Select>
        <Accordion type="single" collapsible defaultValue="a">
          <AccordionItem value="a">
            <AccordionTrigger>Objections</AccordionTrigger>
            <AccordionContent>Pricing is unclear</AccordionContent>
          </AccordionItem>
        </Accordion>
      </>,
    );
    expect(screen.getByText("Objections")).toBeInTheDocument();
    expectNoReactErrors();
  });

  it("renders a Radix tabs tree and a switch", async () => {
    const { Tabs, TabsContent, TabsList, TabsTrigger } = await import("@/components/ui/tabs");
    const { Switch } = await import("@/components/ui/switch");
    wrap(
      <>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Sentiment map</TabsContent>
        </Tabs>
        <Switch aria-label="make public" />
      </>,
    );
    expect(screen.getByText("Sentiment map")).toBeInTheDocument();
    expect(screen.getByLabelText("make public")).toBeInTheDocument();
    expectNoReactErrors();
  });
});

describe("chart components", () => {
  it("renders the chart container plumbing", async () => {
    const { ChartContainer } = await import("@/components/ui/chart");
    const { Bar, BarChart } = await import("recharts");

    const config = { score: { label: "Score", color: "hsl(217 91% 64%)" } };
    const { container } = wrap(
      <ChartContainer config={config} className="h-40">
        <BarChart data={[{ name: "a", score: 10 }]}>
          <Bar dataKey="score" />
        </BarChart>
      </ChartContainer>,
    );
    // Recharts needs a measured parent; assert the container mounted rather
    // than that a bar was drawn.
    expect(container.querySelector("[data-chart]")).toBeTruthy();
    expectNoReactErrors();
  });
});

describe("toasts", () => {
  it("mounts the Sonner toaster and renders a toast", async () => {
    const { Toaster } = await import("@/components/ui/sonner");
    const { toast } = await import("sonner");
    wrap(<Toaster />);
    // Firing a toast exercises the imperative API Sonner 2 rewired.
    toast.success("Simulation saved");
    expect(await screen.findByText("Simulation saved")).toBeInTheDocument();
    expectNoReactErrors();
  });
});

describe("charts against a real page config (Recharts 3)", () => {
  // Mirrors the stacked bar chart in components/results/OverviewTab.tsx: the
  // shapes Recharts 3 changed most (layout="vertical", numeric domain, stacked
  // bars, Cell children, custom formatter, ResponsiveContainer).
  it("renders a vertical stacked BarChart exactly as OverviewTab builds it", async () => {
    const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } = await import("recharts");

    const data = [
      { audience: "founders", excited: 40, skeptical: 30, neutral: 20, hostile: 10 },
      { audience: "pms", excited: 25, skeptical: 40, neutral: 25, hostile: 10 },
    ];

    const { container } = wrap(
      <ResponsiveContainer width={600} height={220}>
        <BarChart data={data} layout="vertical" barCategoryGap="20%">
          <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="audience" width={100} axisLine={false} tickLine={false} />
          <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]} />
          <Bar dataKey="excited" stackId="a" fill="#22c55e" isAnimationActive={false} />
          <Bar dataKey="skeptical" stackId="a" fill="#f59e0b" />
          <Bar dataKey="neutral" stackId="a" fill="#64748b">
            <Cell fill="#334155" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>,
    );

    // v3 renders the surface and axis ticks for a laid-out chart.
    expect(container.querySelector(".recharts-surface")).toBeTruthy();
    expect(container.querySelectorAll(".recharts-bar").length).toBeGreaterThan(0);
    expectNoReactErrors();
  });

  it("renders a PieChart with Cell children", async () => {
    const { PieChart, Pie, Cell } = await import("recharts");
    const data = [
      { name: "excited", value: 40 },
      { name: "hostile", value: 10 },
    ];
    const { container } = wrap(
      <PieChart width={200} height={200}>
        {/* jsdom has no layout/animation loop: without this the sectors never mount. */}
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.name} fill="#22c55e" />
          ))}
        </Pie>
      </PieChart>,
    );
    expect(container.querySelectorAll(".recharts-pie-sector").length).toBeGreaterThan(0);
    expectNoReactErrors();
  });
});
