import { describe, it, expect } from "vitest";
import {
  createReviewSchema,
  updateReviewSchema,
  deleteReviewSchema,
  toggleHelpfulSchema,
} from "@/lib/validators/review";

describe("createReviewSchema", () => {
  const valid = {
    gameId: "game-1",
    title: "My Review",
    body: "This game is absolutely fantastic and worth every penny.",
    rating: 4.5,
    containsSpoilers: false,
  };

  it("accepts valid review", () => {
    expect(createReviewSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty title", () => {
    expect(createReviewSchema.safeParse({ ...valid, title: "" }).success).toBe(false);
  });

  it("rejects title over 200 characters", () => {
    expect(createReviewSchema.safeParse({ ...valid, title: "a".repeat(201) }).success).toBe(false);
  });

  it("rejects body shorter than 10 characters", () => {
    expect(createReviewSchema.safeParse({ ...valid, body: "Too short" }).success).toBe(false);
  });

  it("rejects rating below 0.5", () => {
    expect(createReviewSchema.safeParse({ ...valid, rating: 0 }).success).toBe(false);
  });

  it("rejects rating above 5", () => {
    expect(createReviewSchema.safeParse({ ...valid, rating: 5.5 }).success).toBe(false);
  });

  it("rejects rating not a multiple of 0.5", () => {
    expect(createReviewSchema.safeParse({ ...valid, rating: 3.3 }).success).toBe(false);
  });

  it("accepts all valid half-star ratings", () => {
    for (let r = 0.5; r <= 5; r += 0.5) {
      expect(createReviewSchema.safeParse({ ...valid, rating: r }).success).toBe(true);
    }
  });

  it("defaults containsSpoilers to false if omitted", () => {
    const { containsSpoilers: _, ...without } = valid;
    const result = createReviewSchema.safeParse(without);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.containsSpoilers).toBe(false);
  });
});

describe("updateReviewSchema", () => {
  it("accepts valid update", () => {
    const result = updateReviewSchema.safeParse({
      reviewId: "review-1",
      title: "Updated Title",
      body: "Updated body with enough characters to pass validation.",
      rating: 3.5,
      containsSpoilers: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing reviewId", () => {
    const result = updateReviewSchema.safeParse({
      title: "Title",
      body: "Body with sufficient length for the validator.",
      rating: 3,
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteReviewSchema", () => {
  it("accepts valid reviewId", () => {
    expect(deleteReviewSchema.safeParse({ reviewId: "review-1" }).success).toBe(true);
  });

  it("rejects empty reviewId", () => {
    expect(deleteReviewSchema.safeParse({ reviewId: "" }).success).toBe(false);
  });
});

describe("toggleHelpfulSchema", () => {
  it("accepts valid reviewId", () => {
    expect(toggleHelpfulSchema.safeParse({ reviewId: "review-1" }).success).toBe(true);
  });

  it("rejects empty reviewId", () => {
    expect(toggleHelpfulSchema.safeParse({ reviewId: "" }).success).toBe(false);
  });
});
