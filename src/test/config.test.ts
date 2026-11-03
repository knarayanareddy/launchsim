import { describe, it, expect } from "vitest";
import { planLevel, PLAN_FEATURES, PLAN_PRICING } from "@/lib/config";

describe("planLevel", () => {
  it("maps known tiers to feature levels", () => {
    expect(planLevel("free")).toBe("free");
    expect(planLevel("pro")).toBe("pro");
    expect(planLevel("enterprise")).toBe("unlimited");
    expect(planLevel("unlimited")).toBe("unlimited");
  });

  it("fails closed for unknown, empty or missing tiers", () => {
    // Regression: Results.tsx used to cast any unrecognised tier straight
    // through, so a bad plan_tier value silently unlocked Pro features.
    expect(planLevel("PRO")).toBe("free");
    expect(planLevel("trial")).toBe("free");
    expect(planLevel("")).toBe("free");
    expect(planLevel(null)).toBe("free");
    expect(planLevel(undefined)).toBe("free");
  });
});

describe("pricing tables", () => {
  it("describes every plan in the feature matrix", () => {
    expect(PLAN_FEATURES.length).toBeGreaterThan(0);
    for (const feature of PLAN_FEATURES) {
      for (const tier of ["free", "pro", "unlimited"] as const) {
        expect(feature[tier]).toBeTruthy();
      }
    }
  });

  it("lists three plans with a price each", () => {
    expect(PLAN_PRICING).toHaveLength(3);
    for (const plan of PLAN_PRICING) {
      expect(plan.price).toMatch(/^\$/);
      expect(plan.cta).toBeTruthy();
    }
  });
});
