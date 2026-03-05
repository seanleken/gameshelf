import { z } from "zod";

export const createThreadSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  body: z
    .string()
    .min(10, "Post body must be at least 10 characters")
    .max(50000, "Post body must be 50,000 characters or less"),
  categoryId: z.string().min(1, "Category is required"),
  gameId: z.string().optional(),
  tags: z.array(z.string().max(30)).max(5).default([]),
});

export const updateThreadSchema = z.object({
  threadId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  body: z
    .string()
    .min(10, "Post body must be at least 10 characters")
    .max(50000, "Post body must be 50,000 characters or less"),
  tags: z.array(z.string().max(30)).max(5).default([]),
});

export const deleteThreadSchema = z.object({
  threadId: z.string().min(1),
});

export const createReplySchema = z.object({
  body: z
    .string()
    .min(1, "Reply cannot be empty")
    .max(20000, "Reply must be 20,000 characters or less"),
  threadId: z.string().min(1),
  parentId: z.string().optional(),
});

export const updateReplySchema = z.object({
  replyId: z.string().min(1),
  body: z
    .string()
    .min(1, "Reply cannot be empty")
    .max(20000, "Reply must be 20,000 characters or less"),
});

export const deleteReplySchema = z.object({
  replyId: z.string().min(1),
});

export const toggleReplyHelpfulSchema = z.object({
  replyId: z.string().min(1),
});

export const markAcceptedSchema = z.object({
  replyId: z.string().min(1),
  threadId: z.string().min(1),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type UpdateThreadInput = z.infer<typeof updateThreadSchema>;
export type CreateReplyInput = z.infer<typeof createReplySchema>;
export type UpdateReplyInput = z.infer<typeof updateReplySchema>;
