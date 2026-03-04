import { z } from "zod";

export const gameSearchSchema = z.object({
  q: z.string().min(1, "Search query required").max(100),
});

export const manualGameSubmitSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  coverUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  developer: z.string().max(200).optional(),
  publisher: z.string().max(200).optional(),
  releaseDate: z.string().optional(),
  genreIds: z.array(z.string()).optional(),
  platformIds: z.array(z.string()).optional(),
});

export type GameSearchInput = z.infer<typeof gameSearchSchema>;
export type ManualGameSubmitInput = z.infer<typeof manualGameSubmitSchema>;
