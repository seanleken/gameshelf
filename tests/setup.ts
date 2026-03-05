import { vi } from "vitest";

// Mock next/cache globally — server actions call revalidatePath after mutations
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock next/navigation — used in some server components
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));
