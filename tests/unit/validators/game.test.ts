import { describe, it, expect } from "vitest";
import { gameSearchSchema, manualGameSubmitSchema } from "@/lib/validators/game";

describe("gameSearchSchema", () => {
  it("accepts a valid query", () => {
    expect(gameSearchSchema.safeParse({ q: "witcher" }).success).toBe(true);
  });

  it("rejects empty query", () => {
    expect(gameSearchSchema.safeParse({ q: "" }).success).toBe(false);
  });

  it("rejects query over 100 characters", () => {
    expect(gameSearchSchema.safeParse({ q: "a".repeat(101) }).success).toBe(false);
  });

  it("accepts a 100-character query", () => {
    expect(gameSearchSchema.safeParse({ q: "a".repeat(100) }).success).toBe(true);
  });
});

describe("manualGameSubmitSchema", () => {
  const valid = {
    title: "My Game",
    description: "A great game with lots of content",
  };

  it("accepts minimal valid input", () => {
    expect(manualGameSubmitSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts full optional fields", () => {
    const result = manualGameSubmitSchema.safeParse({
      ...valid,
      coverUrl: "https://example.com/cover.jpg",
      developer: "Dev Studio",
      publisher: "Big Publisher",
      releaseDate: "2024-01-01",
      genreIds: ["genre-1"],
      platformIds: ["platform-1"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = manualGameSubmitSchema.safeParse({ description: "desc" });
    expect(result.success).toBe(false);
  });

  it("rejects description shorter than 10 characters", () => {
    const result = manualGameSubmitSchema.safeParse({ ...valid, description: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid cover URL (non-empty, non-url)", () => {
    const result = manualGameSubmitSchema.safeParse({ ...valid, coverUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts empty string for coverUrl", () => {
    const result = manualGameSubmitSchema.safeParse({ ...valid, coverUrl: "" });
    expect(result.success).toBe(true);
  });

  it("rejects title over 200 characters", () => {
    const result = manualGameSubmitSchema.safeParse({ ...valid, title: "a".repeat(201) });
    expect(result.success).toBe(false);
  });
});
