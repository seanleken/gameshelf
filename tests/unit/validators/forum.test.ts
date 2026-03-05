import { describe, it, expect } from "vitest";
import {
  createThreadSchema,
  updateThreadSchema,
  createReplySchema,
  updateReplySchema,
  deleteThreadSchema,
  deleteReplySchema,
  markAcceptedSchema,
} from "@/lib/validators/forum";

describe("createThreadSchema", () => {
  const valid = {
    title: "Help with final boss",
    body: "I'm stuck on the final boss. Any tips?",
    categoryId: "cat-1",
  };

  it("accepts valid minimal thread", () => {
    expect(createThreadSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts with optional gameId and tags", () => {
    const result = createThreadSchema.safeParse({
      ...valid,
      gameId: "game-1",
      tags: ["help", "boss"],
    });
    expect(result.success).toBe(true);
  });

  it("defaults tags to empty array", () => {
    const result = createThreadSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tags).toEqual([]);
  });

  it("rejects empty title", () => {
    expect(createThreadSchema.safeParse({ ...valid, title: "" }).success).toBe(false);
  });

  it("rejects title over 200 characters", () => {
    expect(createThreadSchema.safeParse({ ...valid, title: "a".repeat(201) }).success).toBe(false);
  });

  it("rejects body shorter than 10 characters", () => {
    expect(createThreadSchema.safeParse({ ...valid, body: "Short" }).success).toBe(false);
  });

  it("rejects more than 5 tags", () => {
    const result = createThreadSchema.safeParse({
      ...valid,
      tags: ["a", "b", "c", "d", "e", "f"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects tag over 30 characters", () => {
    const result = createThreadSchema.safeParse({
      ...valid,
      tags: ["a".repeat(31)],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing categoryId", () => {
    const { categoryId: _, ...without } = valid;
    expect(createThreadSchema.safeParse(without).success).toBe(false);
  });
});

describe("updateThreadSchema", () => {
  it("accepts valid update", () => {
    const result = updateThreadSchema.safeParse({
      threadId: "thread-1",
      title: "Updated title",
      body: "Updated body with enough content to pass validation.",
      tags: ["updated"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing threadId", () => {
    const result = updateThreadSchema.safeParse({
      title: "Title",
      body: "Body with sufficient length for validation checks.",
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteThreadSchema", () => {
  it("accepts valid threadId", () => {
    expect(deleteThreadSchema.safeParse({ threadId: "thread-1" }).success).toBe(true);
  });

  it("rejects empty threadId", () => {
    expect(deleteThreadSchema.safeParse({ threadId: "" }).success).toBe(false);
  });
});

describe("createReplySchema", () => {
  const valid = { body: "Great post, thanks for sharing!", threadId: "thread-1" };

  it("accepts valid reply", () => {
    expect(createReplySchema.safeParse(valid).success).toBe(true);
  });

  it("accepts reply with parentId for nesting", () => {
    const result = createReplySchema.safeParse({ ...valid, parentId: "reply-1" });
    expect(result.success).toBe(true);
  });

  it("rejects empty body", () => {
    expect(createReplySchema.safeParse({ ...valid, body: "" }).success).toBe(false);
  });

  it("rejects body over 20000 characters", () => {
    expect(
      createReplySchema.safeParse({ ...valid, body: "a".repeat(20001) }).success
    ).toBe(false);
  });
});

describe("updateReplySchema", () => {
  it("accepts valid update", () => {
    const result = updateReplySchema.safeParse({
      replyId: "reply-1",
      body: "Updated reply content.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing replyId", () => {
    expect(updateReplySchema.safeParse({ body: "content" }).success).toBe(false);
  });
});

describe("deleteReplySchema", () => {
  it("accepts valid replyId", () => {
    expect(deleteReplySchema.safeParse({ replyId: "reply-1" }).success).toBe(true);
  });
});

describe("markAcceptedSchema", () => {
  it("accepts valid replyId and threadId", () => {
    const result = markAcceptedSchema.safeParse({ replyId: "reply-1", threadId: "thread-1" });
    expect(result.success).toBe(true);
  });

  it("rejects missing threadId", () => {
    expect(markAcceptedSchema.safeParse({ replyId: "reply-1" }).success).toBe(false);
  });
});
