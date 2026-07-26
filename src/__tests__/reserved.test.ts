import { describe, it, expect } from "vitest";
import { isReservedCode } from "@/lib/reserved";

describe("isReservedCode", () => {
  it("returns true for reserved paths", () => {
    expect(isReservedCode("api")).toBe(true);
    expect(isReservedCode("login")).toBe(true);
    expect(isReservedCode("register")).toBe(true);
    expect(isReservedCode("dashboard")).toBe(true);
    expect(isReservedCode("admin")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isReservedCode("API")).toBe(true);
    expect(isReservedCode("Login")).toBe(true);
    expect(isReservedCode("DASHBOARD")).toBe(true);
  });

  it("returns false for non-reserved paths", () => {
    expect(isReservedCode("myproject")).toBe(false);
    expect(isReservedCode("hello-world")).toBe(false);
    expect(isReservedCode("test123")).toBe(false);
  });
});
