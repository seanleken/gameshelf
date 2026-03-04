# GameShelf — Architecture & Implementation Guide

## Overview

GameShelf is a full-stack gaming community platform where users track their game libraries, write reviews, participate in forums, and follow other gamers. Think Goodreads for video games.

**Core value props:**

- Search and browse games via RAWG API (with manual submission fallback)
- Personal library with statuses: Playing, Completed, Backlog, Dropped, Wishlist
- Half-star ratings (0.5–5.0) and written reviews with markdown
- Community forums with game-specific discussion boards
- Follow system with activity feed

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | **Next.js 14** (App Router) | Leverage server components heavily. Minimise client components. |
| Language | **TypeScript** | Strict mode. Shared types between server/client. |
| Styling | **Tailwind CSS v3** | Do NOT use v4. Pin to v3.x in package.json. |
| Auth | **NextAuth.js v5** (Auth.js) | Credentials + Google OAuth provider. Twitch OAuth is a stretch goal. |
| ORM | **Prisma** | Type-safe queries. Use Prisma Client extensions where useful. |
| Database | **Neon** (PostgreSQL) | Serverless Postgres. Use connection pooling via Neon's pooler URL. |
| Validation | **Zod** | Shared schemas for forms and API input validation. |
| External API | **RAWG** (API key) | Game search, metadata, cover art. Cache locally in DB. Free tier at rawg.io/apidocs. |
| Image hosting | **Cloudinary** | Avatars and user-submitted game covers. |
| Markdown | **react-markdown** + **remark-gfm** | For reviews and forum posts. Sanitise output. |

### What we're NOT using

- No separate Express backend — everything runs through Next.js route handlers and server actions
- No client-side state management library (no Redux, Zustand, etc.) — rely on server state via React Server Components, and React Query only where client interactivity demands it
- No Tailwind v4
- No Redis in the initial build — add only if caching becomes necessary

---

## Architecture Principles

### Server-first data fetching

Default to **server components** for all data fetching. Pages fetch data directly in the component using Prisma or service functions. Only drop to client components (`"use client"`) when you need interactivity (forms, dropdowns, modals, star rating picker, etc.).

**Pattern:** Page-level server component fetches data → passes as props to client interactive components where needed.

### API layer

Use **Next.js Route Handlers** (`app/api/`) for endpoints that client components need to call (e.g., search autocomplete, follow toggle, RSVP). Use **Server Actions** for form mutations (create review, create thread, update library entry).

### Validation

Define Zod schemas in `lib/validators/`. Use the same schema for both server-side validation (in actions/route handlers) and client-side form validation. Single source of truth.

### Error handling

Use a consistent error response shape from all route handlers:

```
{ error: string, details?: Record<string, string[]> }
```

Server actions should return `{ success: boolean, error?: string }` or redirect on success.

### Authentication

NextAuth v5 with the Prisma adapter. Session strategy: JWT (works well with Neon serverless). Middleware protects routes that require auth. Public routes (game browsing, forum reading, profiles) remain accessible without login.

---

## Database Schema

### Core tables

**User** — id, email, username, passwordHash, displayName, bio, avatarUrl, isAdmin, createdAt, updatedAt

**Game** — id, rawgId (nullable, unique), title, slug (unique), description, coverUrl, releaseDate, developer, publisher, avgRating, totalRatings, isUserSubmitted, createdAt, updatedAt

**Genre** — id, name, slug (unique)

**Platform** — id, name, slug (unique)

**GameGenre** — gameId, genreId (composite PK)

**GamePlatform** — gameId, platformId (composite PK)

**LibraryEntry** — id, userId, gameId, status (enum: PLAYING, COMPLETED, BACKLOG, DROPPED, WISHLIST), rating (Float, nullable, 0.5–5.0 step 0.5), hoursPlayed, platform, startedAt, completedAt, createdAt, updatedAt. Unique constraint on (userId, gameId).

**Review** — id, userId, gameId, title, body (text/markdown), rating (Float), containsSpoilers, helpfulCount, createdAt, updatedAt. Unique constraint on (userId, gameId) — one review per user per game.

**Follow** — followerId, followingId, createdAt. Composite PK. Self-referential on User.

**ForumCategory** — id, name, slug (unique), description, sortOrder, color

**ForumThread** — id, title, slug (unique), body (text/markdown), authorId, categoryId, gameId (nullable — for game-specific threads), isPinned, isLocked, viewCount, tags (text array), createdAt, updatedAt, lastReplyAt

**ForumReply** — id, body (text/markdown), authorId, threadId, parentId (nullable — for nested replies), helpfulCount, isAcceptedAnswer, createdAt, updatedAt

**ActivityEvent** — id, userId, type (enum: ADDED_GAME, REVIEWED, COMPLETED, STARTED_PLAYING, THREAD_CREATED), targetId, targetType, metadata (JSON, nullable), createdAt

### Key indexes

- Game: index on slug, rawgId, avgRating
- LibraryEntry: index on userId+status, gameId
- Review: index on gameId+createdAt
- ForumThread: index on categoryId+lastReplyAt, gameId
- ActivityEvent: index on userId+createdAt
- Follow: index on followerId, followingId

### Relationships summary

- User 1→N LibraryEntry, Review, ForumThread, ForumReply, ActivityEvent
- Game 1→N LibraryEntry, Review, ForumThread
- Game N→N Genre (via GameGenre), Platform (via GamePlatform)
- ForumThread N→1 ForumCategory, User, Game(nullable)
- ForumReply N→1 ForumThread, User; self-referential via parentId
- Follow is User↔User many-to-many

---

## RAWG Integration

### Auth

RAWG uses a simple API key — no OAuth required. Obtain a free key at `https://rawg.io/apidocs`. Pass as `?key=YOUR_KEY` on every request. Set `RAWG_API_KEY` in `.env`.

### Search flow

1. Client hits `/api/games/search?q=<term>`
2. Route handler queries local DB first (`WHERE title ILIKE '%term%'`)
3. Also queries RAWG: `GET https://api.rawg.io/api/games?search=<term>&page_size=10&key=...`
4. Merge results, deduplicate by rawgId, return combined list
5. When user visits a game detail page, if the game only exists as a RAWG result (not yet in local DB), fetch full details via `GET /games/{slug}` and persist to local DB

### Manual fallback

If a game doesn't exist in RAWG, users can submit it manually via `/games/submit`. These entries have `rawgId: null` and `isUserSubmitted: true`. Requires title and description; cover URL is optional.

---

## Folder Structure

```
gameshelf/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/                    # Layout with navbar/footer
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Home — trending, recent activity
│   │   ├── games/
│   │   │   ├── page.tsx           # Discovery / browse
│   │   │   ├── [slug]/page.tsx    # Game detail
│   │   │   └── submit/page.tsx    # Manual game entry
│   │   ├── library/
│   │   │   └── page.tsx           # User's own shelf (protected)
│   │   ├── forum/
│   │   │   ├── page.tsx           # Category index
│   │   │   ├── [category]/page.tsx
│   │   │   └── threads/
│   │   │       ├── new/page.tsx
│   │   │       └── [slug]/page.tsx
│   │   ├── users/
│   │   │   └── [username]/page.tsx
│   │   └── feed/page.tsx          # Activity feed (protected)
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── games/
│   │   │   ├── search/route.ts
│   │   │   └── [slug]/route.ts
│   │   ├── library/route.ts
│   │   ├── reviews/route.ts
│   │   ├── forum/
│   │   └── users/
│   └── layout.tsx                 # Root layout
│
├── components/
│   ├── ui/                        # Primitives: Button, Input, Modal, Badge, etc.
│   ├── game/                      # GameCard, GameGrid, AddToShelfButton, StarRating
│   ├── review/                    # ReviewCard, ReviewForm
│   ├── forum/                     # ThreadCard, ReplyTree, ThreadForm
│   ├── social/                    # FollowButton, ActivityFeedItem
│   └── layout/                    # Navbar, Footer, Sidebar, SearchBar
│
├── lib/
│   ├── prisma.ts                  # Singleton Prisma client
│   ├── auth.ts                    # NextAuth config
│   ├── rawg.ts                    # RAWG API wrapper
│   ├── cloudinary.ts              # Upload helpers
│   ├── utils.ts                   # General helpers (cn, formatDate, slugify)
│   └── validators/                # Zod schemas
│       ├── auth.ts
│       ├── game.ts
│       ├── review.ts
│       ├── forum.ts
│       └── library.ts
│
├── actions/                       # Server actions
│   ├── library.ts
│   ├── reviews.ts
│   ├── forum.ts
│   └── social.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── public/
├── docker-compose.yml             # Local Postgres + (optional) Redis
├── .env.example
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
├── package.json
├── ARCHITECTURE.md
├── FRONTEND.md
└── README.md
```

---

## Implementation Phases (Vertical Slices)

Each phase is a self-contained vertical slice that can be tested end-to-end before moving on. Within each phase, implement features in order — each builds on the last.

---

### Phase 0 — Scaffold & Infrastructure

**Goal:** Empty app runs locally, DB connects, CI passes.

- [ ] `create-next-app` with TypeScript, App Router, Tailwind v3 (pin version), ESLint
- [ ] Prisma init with Neon connection string (use pooled URL for queries, direct URL for migrations)
- [ ] `docker-compose.yml` with local Postgres for offline dev (Neon for production/staging)
- [ ] `.env.example` with all required vars documented
- [ ] Root layout with basic HTML shell (metadata, fonts)
- [ ] Tailwind config with project design tokens (see FRONTEND.md)
- [ ] `lib/prisma.ts` — singleton client with connection pooling
- [ ] `lib/utils.ts` — `cn()` helper (clsx + twMerge), `slugify()`, `formatDate()`
- [ ] Basic health check route `GET /api/health`
- [ ] Verify: app boots, Prisma connects to DB, health check returns 200

---

### Phase 1 — Auth & User Profile

**Goal:** Users can register, log in (credentials + Google), view and edit their profile.

**Schema:** User table + NextAuth required tables (Account, Session, VerificationToken)

- [ ] NextAuth v5 setup with Prisma adapter
- [ ] Credentials provider (email + password with bcrypt hashing)
- [ ] Google OAuth provider
- [ ] Middleware: protect `/library`, `/feed`, `/forum/threads/new` routes
- [ ] Registration page — form with Zod validation, server action to create user
- [ ] Login page — email/password + Google button
- [ ] Navbar component — shows auth state, user avatar dropdown, sign out
- [ ] Public user profile page `/users/[username]` — display name, bio, avatar, join date
- [ ] Edit profile page/modal — update displayName, bio, avatar (Cloudinary upload)
- [ ] Verify: full registration → login → view profile → edit profile → logout flow works

---

### Phase 2 — Game Data & Browse

**Goal:** Users can search for games, view game detail pages, and browse a catalogue.

**Schema:** Game, Genre, Platform, GameGenre, GamePlatform tables

- [x] RAWG service module (`lib/rawg.ts`) — API key auth, search endpoint, game detail fetch
- [x] `GET /api/games/search?q=` — searches local DB + RAWG, returns merged results
- [x] Game detail page `/games/[slug]` — server component fetches from local DB; if not found, fetches from RAWG and persists
- [x] Game card component — cover image, title, rating badge, genres
- [x] Games browse page `/games` — server-rendered grid with genre/platform filters and sorting (top rated, newest, alphabetical)
- [x] Search bar in navbar — client component with debounced input, hits search API, shows dropdown results
- [x] Manual game submission form `/games/submit` (protected) — title, description, cover URL, genre/platform selectors
- [x] Verify: search for "The Witcher 3" → see results from RAWG → click through to detail page → data persisted in local DB

---

### Phase 3 — Library & Ratings

**Goal:** Users can add games to their shelf, set status, rate with half-stars.

**Schema:** LibraryEntry table

- [ ] "Add to Shelf" button on game detail page — dropdown to pick status (Playing, Completed, Backlog, Dropped, Wishlist)
- [ ] Server action to create/update/delete library entries
- [ ] Half-star rating component — interactive, accessible (keyboard navigable), works as both input and display
- [ ] Rate inline from game detail page (updates LibraryEntry.rating)
- [ ] Library page `/library` (protected) — user's shelf with status tabs, game cards showing status + rating
- [ ] Filtering by status and sorting (recently added, rating, title) on library page
- [ ] Game detail page now shows "In your library" state if applicable, with current status and rating
- [ ] User profile page now shows a public library preview (most recent, top rated)
- [ ] Update Game.avgRating and Game.totalRatings when ratings are added/changed/removed (use Prisma transaction)
- [ ] Verify: add game to shelf → set status → rate it → see it in library → see rating reflected on game page → view it on public profile

---

### Phase 4 — Reviews

**Goal:** Users can write, edit, and browse reviews.

**Schema:** Review table

- [ ] Review form — markdown editor with preview toggle, half-star rating (required), spoiler checkbox, title
- [ ] Server action to create/update/delete reviews (enforce one review per user per game)
- [ ] Game detail page: reviews tab — list of reviews sorted by most recent/most helpful, with pagination
- [ ] Review card component — author avatar, rating stars, spoiler-gated body, helpful count
- [ ] "Mark as helpful" button (simple upvote, one per user — can use a lightweight approach like storing in a JSON field or a separate ReviewVote table if needed)
- [ ] User profile: reviews tab — all reviews written by this user
- [ ] Verify: write review on a game → see it appear on game page → edit it → see on profile → another user marks helpful

---

### Phase 5 — Forums

**Goal:** Community forums with categories, threads, and nested replies.

**Schema:** ForumCategory, ForumThread, ForumReply tables

- [ ] Seed forum categories (General Discussion, Help & Tips, Game Talk, Off-Topic, etc.)
- [ ] Forum index page `/forum` — category cards with description, thread count, latest activity
- [ ] Thread list page `/forum/[category]` — paginated threads, sort by latest reply/newest/popular, filter by tags
- [ ] Thread detail page `/forum/threads/[slug]` — original post + reply tree (nested via parentId)
- [ ] Create thread form (protected) — title, body (markdown), category, optional game link, tags
- [ ] Reply composer — inline on thread page, supports replying to specific replies (sets parentId)
- [ ] "Accepted answer" — thread author can mark one reply as accepted (for help-tagged threads)
- [ ] Game detail page: discussions tab — threads linked to this game
- [ ] Thread view count increment (fire-and-forget on page load)
- [ ] Verify: create thread in Help category → link to a game → reply → nest a reply → mark accepted → see thread from game page

---

### Phase 6 — Social & Activity Feed

**Goal:** Follow other users and see their activity.

**Schema:** Follow, ActivityEvent tables

- [ ] Follow/unfollow button on user profile pages (server action, toggle behavior)
- [ ] Follower/following counts on profile
- [ ] Activity event creation — fire ActivityEvent writes when: user adds game to shelf, writes a review, marks a game completed, creates a forum thread
- [ ] Activity feed page `/feed` (protected) — chronological feed of events from followed users
- [ ] Feed item components — different layouts per event type (reviewed, completed, added, posted thread)
- [ ] User profile: activity tab — recent activity from this specific user
- [ ] Home page: show recent community activity (global feed preview, no auth required)
- [ ] Verify: follow a user → they complete a game → see it in your feed → unfollow → it disappears

---

### Phase 7 — Polish, Search & Deploy

**Goal:** Production-ready, deployed, documented.

- [ ] Global search page `/search?q=` — combined results across games, users, forum threads (tabbed UI)
- [ ] Game discovery page enhancements — "trending" (most added to shelves recently), "top rated", "recently reviewed" sections
- [ ] User stats on profile — games completed count, average rating, genre distribution (can be a simple bar/pie chart or just text stats)
- [ ] SEO — dynamic page titles, descriptions, Open Graph meta tags on game and profile pages
- [ ] Performance — Next.js Image component for all images, ISR for game detail pages, appropriate cache headers
- [ ] Responsive design pass across all pages (mobile, tablet, desktop)
- [ ] Prisma seed script with realistic sample data (10+ users, 50+ games, reviews, threads)
- [ ] README.md — project description, screenshots, setup instructions, tech stack overview, deployment guide
- [ ] Deploy to Vercel, connect to Neon production database
- [ ] Verify: full user journey from signup through all features on production URL

---

## Stretch Goals (Post-MVP)

These are not part of the core 7 phases but worth pursuing after ship:

- Twitch OAuth login
- Game lists/collections (curated lists like "Best RPGs of 2024")
- Recommendation engine ("users who liked X also liked Y")
- Direct game recommendations (send a "you should play this" to a follower)
- Email notifications (new follower, reply to your thread, etc.)
- User-to-user messaging
- Moderation tools (admin panel, report system)
- Dark/light theme toggle
- PWA support

---

## Additional Resources

- **CLAUDE.md** — Operational rules and commands for Claude Code sessions
- **FRONTEND.md** — Detailed frontend implementation guide (design tokens, components, page layouts)
