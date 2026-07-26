import { describe, it, expect } from "vitest";
import { generateCode } from "@/lib/code";

describe("generateCode", () => {
  it("generates a 5-character code", () => {
    const code = generateCode();
    expect(code).toHaveLength(5);
  });

  it("uses only valid charset characters", () => {
    const code = generateCode();
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates different codes on subsequent calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateCode());
    }
    expect(codes.size).toBeGreaterThan(95);
  });
});
