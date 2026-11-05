# Catalance Campus API

The real backend for **Catalance Campus** (learn → earn → get ranked). It is deployed separately from the main
Catalance app (`/backend`, `/src`) but uses **Catalance accounts**: there is no Campus sign-up or password (see
[Accounts](#accounts-catalance-sign-in)). It implements every route in
[`../API_CONTRACT.md`](../API_CONTRACT.md) with the same business rules as the in-browser demo engine
(`campus/web/src/mocks`).

Stack: Express 5, Prisma 6 (Postgres), Zod, JWT (verifies Catalance tokens), OpenRouter for the AI tutor.

## Database: the `campus` schema inside the existing Catalance database

Campus uses the **same Neon database as the main Catalance backend**, fully isolated in its own Postgres schema,
`campus`. The main app's tables live in `public`. Campus never writes them; its only access is a read-only
lookup of one `public."User"` row per request to sign people in (see Accounts below):

- `prisma/schema.prisma` declares `schemas = ["campus"]` and puts `@@schema("campus")` on every model and enum,
  so `prisma db push` from this folder only creates or alters tables in `campus`.
- Table and enum names (for example `User` and `Role`) are schema-scoped, so they don't clash with the main app's
  objects of the same name in `public`.
- `scripts/check-schema.mjs` is a safety guard. It fails if any model or enum is missing `@@schema("campus")`,
  if the datasource lists any schema other than `campus`, or if `"public"` appears anywhere. It runs automatically
  before `prisma:push`, `prisma:migrate`, `prisma:deploy`, `seed` and `seed:reset`.
- No script uses `--accept-data-loss` or `--force-reset`. Don't add them, and never run `prisma migrate reset`
  against the shared database.

## Setup

```bash
cd campus/api
npm install                        # also installs esbuild for the seed exporter
cp .env.example .env
```

Fill in `.env`:

| Variable | Value |
|---|---|
| `CAMPUS_DATABASE_URL` | Same as the main backend's `DATABASE_URL` (pooled) |
| `CAMPUS_DIRECT_URL` | Same as the main backend's `DIRECT_DATABASE_URL` (direct, used by `db push`) |
| `CATALANCE_JWT_SECRET` | The **same** value as the main backend's `JWT_SECRET` (Campus verifies Catalance tokens) |
| `CAMPUS_CORS_ORIGIN` | Allowed web origins, comma-separated (default `http://localhost:5180`) |
| `PORT` | `5100` |
| `CAMPUS_OPENROUTER_API_KEY` | Optional. Without it, the tutor returns a friendly fallback reply |
| `CAMPUS_AI_MODEL` | Optional, default `openai/gpt-4o-mini` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Optional. Razorpay hosted checkout for course fees. Without them only offline payment (admin-verified) is offered |
| `RAZORPAY_WEBHOOK_SECRET` | Optional. Secret of the Razorpay webhook pointing at `/api/webhooks/razorpay` (events `payment.captured`, `payment.failed`, `refund.processed`) |
| `RESEND_API_KEY` / `CAMPUS_EMAIL_FROM` / `CAMPUS_WEB_URL` | Optional. Transactional email via Resend; without a key emails are logged and skipped |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` | Optional. **Private** Cloudflare R2 bucket for assessment file uploads (presigned PUT/GET, 10 min). Without all four, uploads answer 503 and the web hides the upload control |
| `CRON_SECRET` | Optional. Bearer secret for the scheduler `GET/POST /api/cron/tick` (Vercel Cron sends it automatically). Empty = endpoint answers 503 |

Then create the `campus` schema and its tables, load the demo content and start the API:

```bash
npm run prisma:push                      # guard + prisma db push (creates the "campus" schema only)
node scripts/export-demo-seed.mjs        # web demo seeds → prisma/seed-data.json
npm run seed:check                       # optional: validate the mapping offline (no DB writes)
npm run seed                             # guard + upsert the demo data (safe to re-run)
npm run dev                              # http://localhost:5100, check GET /api/health
```

The seeded demo people (`student@campus.dev` and friends) fill the leaderboards, mentors and threads. With the real
API they can't log in (they have no Catalance account); their `campus123` logins only work in the web demo mode.

## Accounts: Catalance sign-in

Campus has no accounts of its own. Every Catalance user can use Campus without registering again:

1. Campus web "Log in" / "Sign up" go to the main app's `/campus?signin=1&next=…` (`src/components/pages/CampusBridge.jsx`).
   Signed-out users sign in on Catalance first (phone OTP or email); new people create their Catalance account there.
2. The bridge sends the user to Campus `/sso#token=<Catalance access token>&next=…`, and the web app stores the token.
3. Every API request verifies that token with `CATALANCE_JWT_SECRET`, reads the account from `public."User"`
   (suspended Catalance accounts are refused) and loads the Campus profile linked by `campus."User".catalanceUserId`.
   The first request creates that profile (name, email and avatar copied from Catalance, 50 welcome coins).
   A Campus profile made earlier under the same email is linked instead of duplicated.
4. Catalance admins are Campus admins. Mentors are still promoted inside Campus admin.

`/api/auth/login`, `/signup`, `/forgot-password` and `/api/me/password` answer `410`: those live on Catalance.
The Campus session lasts as long as the Catalance token (`JWT_EXPIRES_IN`, 7 days by default). After that, "Log in"
goes through Catalance again, instantly if the user is still signed in there.

Seed dates are relative to when the export ran ("3 days ago"), so re-run `export-demo-seed.mjs` before
seeding a fresh database. `npm run seed:reset` wipes only the Campus tables (Prisma models in `campus`)
before seeding. Use it only in development.

## Aspirant mode

Campus also serves government-exam aspirants (SSC, banking, railways, UPSC, state PSC) who want a backup
private-sector career with 30–90 minutes a day alongside their prep. See the `Aspirant` entity in
[`../API_CONTRACT.md`](../API_CONTRACT.md).

- Goal `GOVT_EXAM_BACKUP` plus `User.aspirant` (JSON, nullable). `POST /api/me/onboarding` saves it only for that
  goal (aspirants may skip college); `PATCH /api/me` merges it with the stored value. Both normalise it in
  `src/lib/aspirant.js` (same rules as `cleanAspirant()` in the demo engine).
- `aspirant` is private: it appears only in the signed-in user's own responses (`/api/auth/*`, `PATCH /api/me`,
  onboarding, dashboard). Public views use `publicUser`, which never includes it.
- Bridge tracks: `Track.forAspirants` and `Track.bridgeFrom` (exam subjects). `GET /api/tracks?audience=aspirants`
  returns only those.
- `GET /api/me/dashboard` adds `aspirantPlan` (bridge tracks ranked by overlap with the aspirant's strengths, the next
  bridge lesson, minutes today and this week, and the prep subject → skill map).
- `GET /api/u/:username` adds `preparationRecord` when `aspirant.showOnPassport` is on. It never exposes
  `birthYear` or `attemptsUsed`.
- The AI tutor gets aspirant-specific guidance (warm, Hindi-friendly, concrete career-switch steps).

## Point the web app at it

Create `campus/web/.env.local` and restart Vite:

```
VITE_CAMPUS_API_URL=http://localhost:5100
```

Without that variable, the web app keeps running on the in-browser demo engine.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `npm start` | Start the API (`node --watch` in dev) |
| `npm run check-schema` | Run the isolation guard on its own |
| `npm run prisma:push` | Guard, then `prisma db push` |
| `npm run prisma:migrate` | Guard, then `prisma migrate dev` (if you move to migrations later) |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run export-seed` | Export the web demo seeds to `prisma/seed-data.json` |
| `npm run seed` / `seed:check` / `seed:reset` | Upsert demo data / dry run / wipe Campus tables first |
| `npm run cron:tick` | Run one scheduler tick (offer expiry + reminders) against the configured database, without HTTP |
| `npm run smoke:spec` | Offline spec smoke test (in-memory Prisma, no network) |

## Layout

```
src/
  app.js, server.js      Express app (helmet, cors, compression, morgan, auth rate limit) and listener
  lib/                   env, prisma, auth (JWT, bcrypt, requireAuth/optionalAuth/requireRole),
                         errors ({ error: { message } }, Zod → 400, P2002 → 409), validate (Zod),
                         points (awardPoints, divisions, POINTS), notify, serialize (contract shapes), util
  services/              courses, ladder (Earn Ladder), ranking (leaderboards), wallet (pay-later), bookings (slots)
  routes/                auth, me, public, tracks, courses, lessons, dashboard, tutor, ladder, gigs, wallet,
                         leaderboard, colleges, portfolio (+ /me/points), passport, threads (+ replies,
                         community/top-helpers), mentors, bookings, cohorts, notifications, mentor-studio, admin
prisma/schema.prisma     28 models, all in schema "campus"
prisma/seed.js           Upserts seed-data.json (ids preserved, demo passwords hashed)
scripts/                 export-demo-seed.mjs, check-schema.mjs
api/index.js, vercel.json  Vercel serverless entry (same pattern as /backend)
```

## Deploying to Vercel

Create a Vercel project with root directory `campus/api` and set the same environment variables there.
`vercel.json` routes every path to `api/index.js`, which exports the Express app. The build runs `prisma generate`.
