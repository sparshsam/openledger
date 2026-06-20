import { describe, it, expect } from "vitest";
import { goalProgress } from "../goals";
import type { Goal } from "@/lib/data/types";

describe("goalProgress", () => {
  it("returns percentage of target achieved", () => {
    const goal: Goal = { id: "g1", name: "Emergency fund", targetAmount: 10000, currentAmount: 2500, createdAt: "2026-01-01" };
    expect(goalProgress(goal)).toBe(25);
  });

  it("returns 0 when no progress made", () => {
    const goal: Goal = { id: "g1", name: "Emergency fund", targetAmount: 10000, currentAmount: 0, createdAt: "2026-01-01" };
    expect(goalProgress(goal)).toBe(0);
  });

  it("caps at 100 when target reached", () => {
    const goal: Goal = { id: "g1", name: "Emergency fund", targetAmount: 10000, currentAmount: 15000, createdAt: "2026-01-01" };
    expect(goalProgress(goal)).toBe(100);
  });

  it("returns 0 when target is 0", () => {
    const goal: Goal = { id: "g1", name: "Free", targetAmount: 0, currentAmount: 0, createdAt: "2026-01-01" };
    expect(goalProgress(goal)).toBe(0);
  });
});
