import { z } from "zod";

export const createReviewSchema = z.object({
  gameId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().min(10, "Review must be at least 10 characters").max(10000),
  rating: z.number().min(0.5).max(5).multipleOf(0.5),
  containsSpoilers: z.boolean().default(false),
});

export const updateReviewSchema = createReviewSchema.omit({ gameId: true }).extend({
  reviewId: z.string().min(1),
});

export const deleteReviewSchema = z.object({
  reviewId: z.string().min(1),
});

export const toggleHelpfulSchema = z.object({
  reviewId: z.string().min(1),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
