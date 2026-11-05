# Catalance Campus

India's learn → earn → get-ranked university for college students, tech and non-tech.
It's part of Catalance: **every Catalance user can use Campus with the same account**, without registering again.
Campus web and API are deployed on their own (`campus.catalance.in`), keep their data in the `campus` schema of the
shared Catalance database, and sign people in through the main app (see "Accounts" below).

```
campus/
  web/               React + Vite frontend (port 5180)
  api/               Express + Prisma backend (port 5100), its own Postgres DB
  API_CONTRACT.md    every route + response shape (web demo engine and api both implement it)
  BUILD_GUIDE.md     product pillars, design system, conventions
  SPEC_ALIGNMENT.md  where the code stands against the Developer Product Specification v1.0, and open decisions
```

Developer deliverables (spec §18.1) are in [`docs/`](docs): [architecture and integrations](docs/ARCHITECTURE.md),
[roles and permissions](docs/ROLES_PERMISSIONS.md), [data model and migration plan](docs/DATA_MODEL.md),
[operations: config, deploy, rollback, backup, incidents, retention, uploads](docs/OPERATIONS.md),
[QA plan and checklist](docs/QA_CHECKLIST.md), [analytics events and report definitions](docs/ANALYTICS.md).

## Run the frontend (no backend needed)
```bash
cd campus/web
npm install
npm run dev        # http://localhost:5180
```
With `VITE_CAMPUS_API_URL` empty, the app runs in **demo mode**: a built-in engine (`src/mocks`) serves every API route from seeded data saved in your browser.

Demo logins, demo mode only (password `campus123`): `student@campus.dev`, `mentor@campus.dev`, `admin@campus.dev`.

## Run with the real backend
See `api/README.md`. Campus uses the **existing Catalance Neon database**, but keeps all its tables in a separate Postgres schema named `campus`. Catalance's tables in `public` are never touched, and a guard script (`api/scripts/check-schema.mjs`) runs before every push or seed to enforce this. In short: copy the main backend's DB URLs into `api/.env`, then push the schema, seed it and start it. Finally, set `VITE_CAMPUS_API_URL=http://localhost:5100` in `web/.env.local`.

## Accounts
Campus uses Catalance accounts. "Campus" in the main app navbar and Campus's own "Log in" / "Sign up" go through the
main app's `/campus` route, which signs the user in on Catalance if needed and hands the session to Campus `/sso`.
The Campus API verifies Catalance tokens (shared `JWT_SECRET`) and creates each user's Campus profile on first visit.
Details: [api/README.md](api/README.md#accounts-catalance-sign-in).

| Where | Variable | Value |
|---|---|---|
| main app (`/`) | `VITE_CAMPUS_URL` | Campus web URL, e.g. `https://campus.catalance.in` |
| `campus/web` | `VITE_CATALANCE_URL` | Main app URL, e.g. `https://catalance.in` |
| `campus/web` | `VITE_CAMPUS_API_URL` | Campus API URL |
| `campus/api` | `CATALANCE_JWT_SECRET` | Same as the main backend's `JWT_SECRET` |

## What's inside
| Area | Pages |
|---|---|
| Marketing | Landing, How it works, Tracks + track detail, College leaderboard, For colleges, For companies, Pricing, About, Certificate verify, Public skill passport `/u/:username` |
| Auth | Login, Signup, Forgot password, 5-step onboarding (goal, college, interests, level, language) |
| Learn | Dashboard, My learning, Explore catalog, Course detail, Lesson player (video / article / quiz / assignment), AI Tutor (voice, 7 languages), Certificates |
| Earn & rank | Earn ladder, Gigs + gig detail, Wallet (UPI withdraw, study-now-pay-later), Leaderboard (students + college vs college, seasons and divisions), College page, Proof portfolio |
| Together | Community Q&A + thread, Mentors + booking, Cohorts + cohort, Notifications, Profile, Settings, Mentor studio |
| Admin | Overview, Courses + course builder, Gigs, Gig applications, Assignment reviews, Students, Colleges, Mentors, Settings |

## Deploy
Deploy `web` and `api` as two separate Vercel projects (each has its own `vercel.json`), e.g. `campus.catalance.in` and `campus-api.catalance.in`.
