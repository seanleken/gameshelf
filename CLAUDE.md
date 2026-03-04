# GameShelf

Full-stack gaming community platform. Next.js 14 (App Router) + Prisma + Neon (PostgreSQL).

Read @ARCHITECTURE.md for system design, database schema, and implementation phases.
Read @FRONTEND.md for design tokens, component patterns, and page layouts.

## Commands

- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx prisma migrate dev --name <description>` — create and run migration
- `npx prisma studio` — visual database browser
- `npx prisma db seed` — seed sample data
- `npx prisma generate` — regenerate client after schema changes
- `docker compose up -d` — start local Postgres (for offline dev)

## Stack Constraints

- **Tailwind v3 only.** Do NOT use v4 syntax or features. Pin to `tailwindcss@^3` in package.json.
- **Next.js App Router only.** No pages/ directory.
- **NextAuth v5** (Auth.js). Credentials + Google OAuth. JWT session strategy.
- **Neon PostgreSQL.** Use pooled connection string for queries, direct for migrations. Both go in `.env`.
- **No client state libraries.** No Redux, Zustand, React Query, or similar. Use server components + local useState where needed.

## Architecture Rules

- **Server components by default.** Only add `"use client"` when the component needs hooks, event handlers, or browser APIs.
- **Fetch data in server components via Prisma** through service functions in `lib/`. Never call your own API routes from server components.
- **Server actions for mutations.** Prefer over route handlers. Use `revalidatePath` after mutations.
- **Route handlers (`app/api/`)** only for endpoints that client components call (search autocomplete, follow toggle).
- **Validate all inputs with Zod** on the server side. Schemas live in `lib/validators/`.

## File Conventions

- Files: kebab-case (`game-card.tsx`, `library-entry.ts`)
- Components: PascalCase (`GameCard`, `StarRating`)
- Server actions: `actions/<domain>.ts` (e.g., `actions/library.ts`)
- Validators: `lib/validators/<domain>.ts`
- One component per file. Extract early rather than building monolithic components.

## Prisma

- Add tables incrementally per phase. Don't create the full schema upfront.
- Always use a descriptive migration name: `npx prisma migrate dev --name add-library-entry-table`
- Use Prisma transactions when updating aggregates (e.g., recalculating `Game.avgRating` after a rating change).
- The Prisma client singleton lives in `lib/prisma.ts`.

## TypeScript

- Strict mode. No `any` types.
- Infer types from Prisma where possible (`Prisma.GameGetPayload<{...}>`).
- Shared types that aren't Prisma-derived go in a `types/` directory.

## Implementation Flow

Phases are defined in ARCHITECTURE.md. Work through them in order — each is a vertical slice.

**IMPORTANT:** Get each phase working end-to-end before starting the next. Verify with the checkpoint at the bottom of each phase.

Phase summary:
0. Scaffold & infrastructure
1. Auth & user profile
2. Game data & browse (IGDB integration)
3. Library & ratings
4. Reviews
5. Forums
6. Social & activity feed
7. Polish, search & deploy

## Key Gotchas

- Neon connections can drop on cold starts — the Prisma singleton in `lib/prisma.ts` should handle reconnection.
- IGDB requires Twitch OAuth2 client credentials. Token lasts ~60 days — cache in memory, refresh on 401.
- IGDB rate limit: 4 requests/second. The `lib/igdb.ts` module must rate-limit outgoing requests.
- NextAuth v5 imports from `next-auth` (not `next-auth/react` for server-side). Check Auth.js docs if unsure.
- Image optimization: always use `next/image` for game covers and avatars.
- `.env.example` must stay up to date with every required variable.
