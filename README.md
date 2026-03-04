# GameShelf

A full-stack gaming community platform. Track your game library, write reviews, join forum discussions, and follow other gamers. Think Goodreads for video games.

## Features

- Browse and search games via the [RAWG](https://rawg.io/) API
- Personal library with statuses: Playing, Completed, Backlog, Dropped, Wishlist
- Half-star ratings and written reviews with markdown
- Community forums with game-specific discussion boards
- Follow system with activity feed
- Credentials and Google OAuth authentication with email verification

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 |
| Auth | NextAuth.js v4 |
| ORM | Prisma 5 |
| Database | Neon (PostgreSQL) |
| Validation | Zod |
| Email | Resend |
| External API | RAWG (API key) |
| Image hosting | Cloudinary |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) database (or local Postgres via Docker)

### 1. Clone and install

```bash
git clone https://github.com/your-username/gameshelf.git
cd gameshelf
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in the values in `.env`. See [Environment Variables](#environment-variables) below.

### 3. Set up the database

```bash
# Apply migrations
npx prisma migrate deploy

# (Optional) Seed sample data
npx prisma db seed
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Local Postgres (optional)

If you prefer to work offline without Neon:

```bash
docker compose up -d
```

Then set both `DATABASE_URL` and `DIRECT_URL` in `.env` to the local Docker connection string (see `.env.example`).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection string (for migrations) |
| `NEXTAUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `AUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key for transactional email |
| `RESEND_FROM_EMAIL` | From address (e.g. `GameShelf <noreply@yourdomain.com>`) |
| `RAWG_API_KEY` | [RAWG](https://rawg.io/apidocs) API key (free, no 2FA required) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

See `.env.example` for a full template.

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint

npx prisma migrate dev --name <description>   # Create and apply a migration
npx prisma studio                             # Visual database browser
npx prisma db seed                            # Seed sample data
npx prisma generate                           # Regenerate Prisma client
```

## Project Structure

```
app/
  (auth)/          # Login, register, verify email, password reset
  (main)/          # Main app layout with navbar
    games/         # Browse and game detail pages
    library/       # User's personal shelf
    forum/         # Community forums
    users/         # Public profiles
    feed/          # Activity feed
  api/             # Route handlers (search, auth callback)
components/
  ui/              # Primitives: Button, Input, Avatar, etc.
  game/            # GameCard, StarRating, AddToShelfButton
  layout/          # Navbar, Footer
lib/
  auth.ts          # NextAuth config
  prisma.ts        # Prisma client singleton
  email.ts         # Resend email helpers
  rawg.ts          # RAWG API wrapper
  utils.ts         # cn(), slugify(), formatDate()
  validators/      # Zod schemas
actions/           # Server actions
prisma/
  schema.prisma    # Database schema
  migrations/      # Migration history
```

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

## License

[MIT](LICENSE)
