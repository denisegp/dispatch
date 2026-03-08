# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo with two Next.js apps at different stages:

- `dispatch/` — the active app (all development happens here)
- Root — an older/stub Next.js app; ignore it

All commands below should be run from `dispatch/dispatch/` unless noted otherwise.

## Commands

```bash
# Development
npm run dev          # start dev server at localhost:3000

# Database
npx prisma generate  # regenerate client after schema changes
npm run db:push      # push schema to DB (no migration files)
npm run db:seed      # seed demo user Alex Rivera
npm run db:studio    # open Prisma Studio

# Testing (run from repo root OR dispatch/dispatch/)
npm test             # headless Playwright
npm run test:ui      # Playwright visual UI
npm run test:headed  # see the browser while tests run

# Run a single test file
npx playwright test tests/capture.spec.ts

# Run a single test by name
npx playwright test --grep "shows progress bar"
```

## Environment variables

Required in `dispatch/dispatch/.env.local`:
```
DATABASE_URL=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

### Two data stores (intentional dual-write)
- **Supabase** (`src/lib/supabase.ts`) — stores raw survey responses in a `voice_profiles` table. Used only in `/capture` on submission.
- **Prisma/PostgreSQL** (`src/lib/prisma.ts`) — the primary app database. All features (draft generation, cascade, user lookup) read from here.

The capture flow writes to both: Supabase first (raw JSON), then `POST /api/process-capture` which calls Claude to synthesize a voice profile and saves structured data to Postgres.

### Prisma specifics
- Config lives in `prisma/prisma.config.ts` (datasource URL), not in `schema.prisma`
- Client generates to `src/generated/prisma` — import as `@/generated/prisma` in app code
- Run `npx prisma generate` after any schema change before the app will compile

### Tailwind v4
- No `tailwind.config.js` — uses `@import "tailwindcss"` and `@theme inline {}` in `globals.css`

### Claude / AI
- Client: `src/lib/anthropic.ts`, model `claude-sonnet-4-6`, `max_tokens: 1024`
- `/api/process-capture` — takes raw survey answers → Claude synthesis → saves User + VoiceProfile to Prisma
- `/api/generate-draft` — takes userId + topic + rawNotes → Claude generation → saves Draft
- `/api/cascade` — takes masterContent + userIds → `Promise.all` parallel generation → saves CascadeJob + Drafts

### User identity
No auth system. After onboarding, `userId` and `userName` are stored in `localStorage` (`dispatch_user_id`, `dispatch_user_name`) and read by Draft and Cascade pages to pre-select the current user.

### Key pages and their data flow
| Page | Route | What it does |
|------|-------|-------------|
| Home | `/` | Marketing/nav, no data fetching |
| Voice Capture | `/capture` | 9-question survey → dual-write → redirect to `/draft?userId=` |
| Draft | `/draft` | `GET /api/users` → pick user + topic → `POST /api/generate-draft` → edit/save |
| Cascade | `/cascade` | `GET /api/users` → pick team → `POST /api/cascade` → approve cards |

### API routes
- `GET /api/users` — returns all users that have a VoiceProfile
- `POST /api/process-capture` — onboarding completion; creates User + VoiceProfile
- `POST /api/generate-draft` — generates and saves a Draft
- `PATCH /api/drafts/[id]` — update content or status
- `POST /api/cascade` — parallel generation for multiple users
- `POST /api/analyze-voice` — legacy route, kept but not primary

### Playwright tests
Tests live in `dispatch/dispatch/tests/`. The config (`playwright.config.ts`) auto-starts the dev server if not already running (`reuseExistingServer: true`). DB-dependent assertions are wrapped in `if (count > 0)` guards so tests pass even without a running database.

### `src/lib/questions.ts`
Central config for the capture survey: all question definitions, option lists (`CHANNELS`, `TOPICS`, `TONES`, `AUDIENCE`, etc.), and the `BRAND` color constant used throughout the capture UI.
