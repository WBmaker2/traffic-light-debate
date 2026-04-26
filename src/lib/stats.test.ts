import { describe, expect, it } from "vitest";
import { calculateStats } from "./stats";

describe("calculateStats", () => {
  it("counts each stance and rounds percentages", () => {
    const stats = calculateStats([
      { stance: "agree" },
      { stance: "agree" },
      { stance: "disagree" },
      { stance: "neutral" },
    ]);

    expect(stats.total).toBe(4);
    expect(stats.agree).toMatchObject({ count: 2, percent: 50, label: "찬성" });
    expect(stats.disagree).toMatchObject({ count: 1, percent: 25, label: "반대" });
    expect(stats.neutral).toMatchObject({ count: 1, percent: 25, label: "중립" });
  });

  it("returns zero percentages when there are no posts", () => {
    const stats = calculateStats([]);

    expect(stats.total).toBe(0);
    expect(stats.agree.percent).toBe(0);
    expect(stats.disagree.percent).toBe(0);
    expect(stats.neutral.percent).toBe(0);
  });
});
