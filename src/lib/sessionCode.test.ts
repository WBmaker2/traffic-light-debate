import { describe, expect, it } from "vitest";
import { isValidSessionCode, normalizeSessionCode } from "./sessionCode";

describe("session code helpers", () => {
  it("normalizes common classroom inputs", () => {
    expect(normalizeSessionCode("4829")).toBe("TL-4829");
    expect(normalizeSessionCode("tl4829")).toBe("TL-4829");
    expect(normalizeSessionCode(" tl-4829 ")).toBe("TL-4829");
  });

  it("validates canonical codes", () => {
    expect(isValidSessionCode("TL-4829")).toBe(true);
    expect(isValidSessionCode("4829")).toBe(true);
    expect(isValidSessionCode("ABC")).toBe(false);
  });
});
