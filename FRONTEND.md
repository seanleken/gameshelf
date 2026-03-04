# GameShelf — Frontend Implementation Guide

## Design Direction

**Vibe:** Dark, immersive, slightly editorial. Think the lovechild of Letterboxd's moody film aesthetic and a modern gaming launcher UI. Not neon-gamer-bro — refined, content-forward, with the game art doing the heavy visual lifting.

**Key principles:**

- Game cover art is the hero — large images, generous spacing, let the visuals breathe
- Dark theme only (for now) — deep slate/charcoal backgrounds, not pure black
- Typography-driven hierarchy — clear distinction between headings, body, metadata
- Subtle interactivity — hover states that feel tactile, smooth transitions, not flashy
- Dense but readable — forums and library pages can show a lot of data without feeling cramped

---

## Design Tokens

Define these in `tailwind.config.ts` under `theme.extend`. These are the semantic names to use throughout the app.

### Colors

**Backgrounds:**
- `bg-primary` — main page background, deep charcoal (around `#0f1117`)
- `bg-surface` — card/panel surfaces, slightly lighter (around `#161b26`)
- `bg-surface-hover` — hover state for cards/rows (around `#1c2333`)
- `bg-elevated` — modals, dropdowns, tooltips (around `#1e2536`)

**Text:**
- `text-primary` — main body text, off-white (around `#e2e5eb`)
- `text-secondary` — supporting text, muted (around `#8b92a5`)
- `text-tertiary` — timestamps, metadata, very muted (around `#555d72`)

**Accent:**
- `accent` — primary action color, a warm amber/gold (around `#e5a837`). Used sparingly: primary buttons, active states, star ratings, links on hover
- `accent-hover` — slightly lighter for hover states
- `accent-muted` — low-opacity version for subtle backgrounds (badges, tags)

**Status colors (for library statuses and forum tags):**
- Playing → cyan/teal
- Completed → green
- Backlog → amber/yellow
- Dropped → red/rose
- Wishlist → purple

**Borders:**
- Use very subtle borders: white at ~6-8% opacity. Borders define space without demanding attention.

### Typography

Use Google Fonts. Load via `next/font/google` for performance.

- **Headings:** A geometric sans-serif with character. Something like Plus Jakarta Sans or Outfit — choose one that feels slightly techy without being cold.
- **Body:** Clean, highly readable sans-serif. The same heading font at regular weight works well here if legibility is good at small sizes.
- **Mono:** JetBrains Mono — for metadata, stats, small labels, tags, forum timestamps.

**Scale (approximate):**
- Page titles: 28–32px, bold/semibold
- Section headings: 20–22px, semibold
- Card titles: 16–18px, semibold
- Body: 14–15px, regular
- Small/metadata: 12–13px, medium, often in the mono font

### Spacing & Layout

- Max content width: ~1200px, centered
- Page padding: 24px on mobile, 32–48px on desktop
- Card grid gap: 16–20px
- Section spacing: 40–48px between major sections
- Card border-radius: 10–12px
- Smaller elements (badges, buttons): 6–8px radius

### Shadows

Minimal. Use inset box shadows or very subtle drop shadows on elevated elements (modals, dropdowns). The dark background does most of the depth work via layered surface colors.

---

## Component Architecture

### Server vs. Client components

**Server components (default):**
- Page-level data fetching components
- GameCard (when used in a static grid)
- ReviewCard (display only)
- ForumThreadCard (display only)
- Profile header, stats displays
- Any component that only renders data with no user interaction

**Client components (`"use client"`):**
- StarRating (interactive input mode)
- AddToShelfButton (dropdown/popover)
- SearchBar (debounced input, API calls)
- FollowButton (toggle)
- ReviewForm, ThreadForm, ReplyForm (any forms)
- Markdown editor with preview toggle
- Mobile nav (hamburger menu, sheet)
- Modal/Dialog wrappers
- Tabs component (for game detail page sections)

### Pattern: Server wrapper → Client interactive child

When a page needs both data and interactivity, the server component fetches data and passes it down:

```
GameDetailPage (server) → fetches game, reviews, library status
  ├── GameHero (server) — cover art, metadata, rating display
  ├── AddToShelfButton (client) — receives current library status as prop
  ├── TabsContainer (client) — About / Reviews / Discussions tabs
  │   ├── ReviewsList (can be server, loaded per tab)
  │   └── ReviewForm (client)
  └── ...
```

---

## UI Component Library

Build a small set of primitives in `components/ui/`. Keep them unstyled beyond Tailwind — no component library dependency.

### Core primitives to build

**Button** — variants: `primary` (accent bg), `secondary` (surface bg, border), `ghost` (transparent), `danger`. Sizes: `sm`, `md`, `lg`. Support `asChild` pattern for wrapping Next.js `<Link>`. Loading state with spinner.

**Input** — text input with label, error message, optional icon prefix. Consistent focus ring styling (accent color).

**Textarea** — same pattern as Input but multiline. Used in review/forum forms.

**Select** — styled select dropdown. Consider a custom dropdown for the shelf status picker if the native select feels too plain.

**Badge** — small label component. Variants for each library status color plus a generic style. Used for genre tags, status pills, forum thread tags.

**Card** — base card container with `bg-surface`, border, border-radius. Compose game cards, review cards, thread cards on top of this.

**Modal/Dialog** — overlay + centered panel. Use for edit profile, confirm delete, etc. Trap focus. Close on escape and backdrop click.

**Avatar** — circular image with fallback initials. Sizes: `sm` (28px), `md` (36px), `lg` (48px), `xl` (80px for profiles).

**Tabs** — horizontal tab bar. Controlled component. Used on game detail page (About, Reviews, Discussions) and user profile (Library, Reviews, Activity).

**Dropdown Menu** — for user menu in navbar, "more" actions on cards. Position-aware (flip if near edge).

**Skeleton** — loading placeholder. Match the shape of the component it replaces (card skeleton, text line skeleton, avatar skeleton). Use for Suspense fallbacks.

**Empty State** — centered message + optional illustration/icon + CTA button. Use when library is empty, no search results, no reviews yet, etc.

### Third-party UI libraries

Prefer building from scratch for learning purposes, but these are reasonable additions if speed matters:

- **@headlessui/react** — accessible, unstyled primitives for modals, dropdowns, tabs, popovers. Good balance of a11y and control. Recommended.
- **clsx** + **tailwind-merge** — combine into a `cn()` utility. Essential for conditional class names.
- **lucide-react** — icon library. Clean, consistent line icons. Use for nav, buttons, status indicators.
- **react-markdown** + **remark-gfm** — render markdown in reviews and forum posts. Pair with a sanitizer (rehype-sanitize).
- **react-textarea-autosize** — auto-expanding textarea for forum reply composer.
- **sonner** — toast notifications. Lightweight, styled well out of the box. Use for success/error feedback on mutations.

---

## Key Interactive Components

### StarRating

Two modes: **display** (read-only, used everywhere ratings appear) and **input** (interactive, used in forms).

- Half-star precision — allow clicking left/right half of each star
- Keyboard accessible — arrow keys to increment/decrement by 0.5
- Hover preview — stars fill on hover to show what the rating would be
- Display mode shows filled/half-filled/empty stars with the numeric value beside them
- Use the accent gold color for filled stars, muted for empty
- Animate star fill on hover/select with a subtle scale or color transition

### AddToShelfButton

- If game is NOT in library: shows "Add to Shelf" button that opens a dropdown with status options
- If game IS in library: shows current status as a badge/button, clicking opens dropdown to change status or remove
- Dropdown includes the 5 statuses with their color indicators
- Optimistic update — immediately show new state, revert on error
- Consider using a popover (Headless UI) rather than a full dropdown for this

### SearchBar

- In the navbar, always visible on desktop, expandable on mobile
- Debounced input (300ms) hits `/api/games/search`
- Shows a dropdown panel with results: game cover thumbnails, titles, release year
- Keyboard navigation through results (arrow keys, enter to select)
- "View all results" link at bottom → navigates to `/search?q=`
- Close on outside click and escape

### ForumReplyTree

- Renders nested replies recursively
- Indent each nesting level (cap visual nesting at 3–4 levels, then flatten)
- Each reply shows: author avatar, username, timestamp, body (markdown), helpful count
- "Reply" button on each reply opens inline composer (sets parentId)
- Accepted answer reply gets a highlighted border/badge

### MarkdownEditor

- Simple textarea with a toolbar row above: bold, italic, link, code, spoiler tag
- Preview toggle — switch between edit and rendered preview
- Use react-markdown for preview rendering
- Spoiler syntax: wrap in `>!spoiler text!<` or use a custom tag, render as blurred/hidden text that reveals on click

---

## Page-Specific Notes

### Home page (`/`)

- Hero section: large heading, brief tagline, search bar or CTA to browse
- "Trending Games" — horizontal scrollable row of game cards (most added to shelves recently)
- "Recent Reviews" — 3–4 recent review cards from the community
- "Active Discussions" — latest forum threads
- If logged in: show a "From Your Feed" section with recent activity from followed users

### Game Detail (`/games/[slug]`)

- Hero area: large cover image (left), game metadata on right (title, developer, release date, platforms, genres)
- Aggregate rating display — large star rating + numeric value + "X ratings"
- Action row: AddToShelfButton + "Write Review" button (if logged in and hasn't reviewed)
- Tabbed content area below: About (description), Reviews (list), Discussions (linked forum threads)
- About tab: full description, genre/platform badges, developer/publisher info
- Reviews tab: sort dropdown (newest, highest rated, most helpful), paginated list
- Discussions tab: threads linked to this game, "Start Discussion" button

### Library (`/library`)

- Status tabs along the top: All, Playing, Completed, Backlog, Dropped, Wishlist — with counts
- Grid of game cards showing cover, title, user's rating, status badge
- Sort options: recently added, rating, title A–Z
- Toggle between grid and compact list view
- Empty state per tab: "No games in your backlog yet — browse games to add some"

### Forum

- Index page: category cards in a grid/list, each showing name, description, thread count, last active timestamp
- Thread list: card per thread with title, author, reply count, last reply time, tags. Pin pinned threads at top.
- Thread detail: original post rendered as markdown, followed by reply tree. Reply composer at bottom (or inline when replying to a specific reply). Show "accepted answer" badge if applicable.

### User Profile (`/users/[username]`)

- Header: avatar (large), display name, username, bio, join date, follower/following counts, follow button
- Tabs: Library (public games with ratings), Reviews (their reviews), Activity (recent actions)
- Stats summary: games completed, average rating, most-played genre — keep it simple, text-based is fine initially

### Activity Feed (`/feed`)

- Chronological list of activity from followed users
- Each item: avatar, username, action text ("reviewed", "completed", "added to backlog"), game card thumbnail, timestamp
- Group consecutive actions from the same user if within a short time window (nice-to-have, not required)
- Empty state: "Follow some gamers to see what they're playing"

---

## Responsive Approach

**Breakpoints (Tailwind defaults):**
- Mobile: default (<640px)
- Tablet: `sm` (640px), `md` (768px)
- Desktop: `lg` (1024px), `xl` (1280px)

**Key responsive behaviors:**

- Navbar: full horizontal nav on desktop → hamburger menu (sheet/drawer from left) on mobile
- Game grids: 4 columns on desktop → 3 on tablet → 2 on mobile
- Game detail hero: side-by-side (cover + metadata) on desktop → stacked on mobile
- Forum thread list: full card layout on desktop → compact list on mobile
- Search bar: always visible on desktop → icon that expands to full width on mobile
- Library: grid view on desktop → list view forced on mobile for density

---

## Loading & Error States

- Use Next.js `loading.tsx` files for route-level loading (show skeleton layouts)
- Use `<Suspense>` with skeleton fallbacks for individual async sections within a page
- Every interactive mutation should have: loading spinner on button, optimistic update where possible, toast on success/error (sonner)
- Error boundaries: use Next.js `error.tsx` per route segment. Show a friendly message + "try again" button.
- Empty states: every list/grid should have a designed empty state, not just blank space

---

## Animation & Transitions

Keep it subtle and purposeful:

- Page transitions: rely on Next.js default behavior, don't add custom page animations
- Card hover: slight translateY (-2px) + subtle shadow increase. Transition 150ms ease.
- Button hover: background color shift, 100ms transition
- Star rating: scale bump (1.1x) on individual star hover, color fill transition
- Modal: fade in backdrop + scale in panel (100ms)
- Skeleton: subtle shimmer animation (CSS `@keyframes`, not a library)
- Toast: slide in from top-right, auto dismiss after 4s
- Tabs: underline indicator slides to active tab (CSS transition on left/width)
- Spoiler reveal: blur → clear transition on click

---

## Accessibility Baseline

- All interactive elements keyboard accessible (tab order, enter/space to activate)
- Star rating: arrow key navigation, aria-label with current value
- Focus visible rings on all interactive elements (use Tailwind's `focus-visible:ring-2`)
- Alt text on all game cover images (game title)
- Forum reply nesting: use appropriate ARIA roles or simply clear visual indentation
- Color contrast: text/background ratios should pass WCAG AA (the design tokens above should satisfy this — verify during implementation)
- Skip-to-content link (hidden, visible on focus)
- Form error messages linked to inputs via aria-describedby
