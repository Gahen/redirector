import { describe, it, expect, beforeEach } from "vitest";
import { isBlacklistedHost, isBlacklistedUrl, resetBlacklistCache } from "@/lib/blacklist";

describe("blacklist", () => {
  beforeEach(() => {
    resetBlacklistCache();
  });

  describe("isBlacklistedHost", () => {
    it("returns true for exact domain match", () => {
      expect(isBlacklistedHost("example.com")).toBe(true);
    });

    it("returns true for subdomain match", () => {
      expect(isBlacklistedHost("sub.example.com")).toBe(true);
    });

    it("returns true for nested subdomain match", () => {
      expect(isBlacklistedHost("deep.sub.example.com")).toBe(true);
    });

    it("returns false for non-matching domain", () => {
      expect(isBlacklistedHost("google.com")).toBe(false);
    });

    it("is case-insensitive", () => {
      expect(isBlacklistedHost("EXAMPLE.COM")).toBe(true);
      expect(isBlacklistedHost("Example.Com")).toBe(true);
    });

    it("does not match partial domain suffix", () => {
      expect(isBlacklistedHost("notexample.com")).toBe(false);
    });
  });

  describe("isBlacklistedUrl", () => {
    it("returns true for blacklisted URL", () => {
      expect(isBlacklistedUrl("https://example.com/page")).toBe(true);
    });

    it("returns false for non-blacklisted URL", () => {
      expect(isBlacklistedUrl("https://google.com/search")).toBe(false);
    });

    it("returns false for invalid URL", () => {
      expect(isBlacklistedUrl("not-a-url")).toBe(false);
    });
  });
});
