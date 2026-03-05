import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cn, slugify, formatDate, formatRelativeDate } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("resolves Tailwind conflicts — last class wins", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "nope", "yes")).toBe("base yes");
  });

  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });
});

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("The Witcher 3")).toBe("the-witcher-3");
  });

  it("strips special characters", () => {
    expect(slugify("Elden Ring: Shadow of the Erdtree")).toBe(
      "elden-ring-shadow-of-the-erdtree"
    );
  });

  it("collapses multiple spaces/hyphens", () => {
    expect(slugify("Game  --  Title")).toBe("game-title");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("handles already-slugified strings", () => {
    expect(slugify("already-slugified")).toBe("already-slugified");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const date = new Date("2024-01-15");
    const result = formatDate(date);
    expect(result).toContain("2024");
    expect(result).toContain("January");
    expect(result).toContain("15");
  });

  it("accepts a string date", () => {
    const result = formatDate("2023-06-01");
    expect(result).toContain("2023");
  });

  it("respects custom format options", () => {
    const result = formatDate("2024-03-05", { month: "short", year: "numeric" });
    expect(result).toContain("Mar");
    expect(result).toContain("2024");
  });
});

describe("formatRelativeDate", () => {
  const FIXED_NOW = new Date("2024-06-15T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for < 60 seconds ago", () => {
    const date = new Date(FIXED_NOW.getTime() - 30_000);
    expect(formatRelativeDate(date)).toBe("just now");
  });

  it("returns minutes ago", () => {
    const date = new Date(FIXED_NOW.getTime() - 5 * 60_000);
    expect(formatRelativeDate(date)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const date = new Date(FIXED_NOW.getTime() - 3 * 3600_000);
    expect(formatRelativeDate(date)).toBe("3h ago");
  });

  it("returns days ago for < 7 days", () => {
    const date = new Date(FIXED_NOW.getTime() - 4 * 86_400_000);
    expect(formatRelativeDate(date)).toBe("4d ago");
  });

  it("returns formatted date for >= 7 days ago", () => {
    const date = new Date(FIXED_NOW.getTime() - 10 * 86_400_000);
    const result = formatRelativeDate(date);
    // Should be a formatted date string (not relative)
    expect(result).not.toContain("ago");
    expect(result).toContain("2024");
  });
});
