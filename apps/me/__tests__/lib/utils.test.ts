import { describe, it, expect } from "vitest";
import { cn, getFallbackAvatar, resolveBaseUrl } from "@/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      expect(cn("base", false && "hidden", "visible")).toBe("base visible");
    });

    it("resolves tailwind conflicts", () => {
      const result = cn("px-4", "px-2");
      expect(result).toBe("px-2");
    });
  });

  describe("getFallbackAvatar", () => {
    it("returns a data URI SVG", () => {
      const url = getFallbackAvatar("Dredd");
      expect(url).toContain("data:image/svg+xml");
      expect(url).toContain("D");
    });

    it("defaults to F3 when no name provided", () => {
      const url = getFallbackAvatar();
      expect(url).toContain("data:image/svg+xml");
      expect(url).toContain("F");
    });
  });

  describe("resolveBaseUrl", () => {
    it("parses the given URL when set", () => {
      const url = resolveBaseUrl("https://me.f3nation.com", "http://fallback");
      expect(url.toString()).toBe("https://me.f3nation.com/");
    });

    it("falls back when raw is undefined", () => {
      const url = resolveBaseUrl(undefined, "http://localhost:3003");
      expect(url.toString()).toBe("http://localhost:3003/");
    });

    it("falls back when raw is an empty string", () => {
      const url = resolveBaseUrl("", "http://localhost:3003");
      expect(url.toString()).toBe("http://localhost:3003/");
    });
  });
});
