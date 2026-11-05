# Catalance Campus: system architecture

Spec v1.0 §18.1 deliverable. Covers the parts, how they talk, and every external integration.

## Parts

```
                    ┌──────────────────────────────┐
   learners, staff  │  campus/web (React 18 + Vite) │  campus.catalance.in
  ─────────────────▶│  demo engine in src/mocks     │  (Vercel, static)
                    └──────────────┬───────────────┘
                                   │ HTTPS, JSON, Bearer <Catalance access token>
                    ┌──────────────▼───────────────┐
                    │ campus/api (Express 5)        │  campus-api.catalance.in
                    │ routes → services → Prisma 6  │  (Vercel function, region bom1)
                    └───┬───────────┬──────────┬────┘
        read one row    │           │          │ fetch
   ┌────────────────────▼───┐  ┌────▼─────┐  ┌─▼──────────────────────────┐
   │ Neon Postgres          │  │ Razorpay │  │ Resend (email)             │
   │  public.*  (Catalance) │  │ checkout │  │ OpenRouter (AI tutor, flag)│
   │  campus.*  (Campus)    │  │ webhooks │  └────────────────────────────┘
   └────────────────────────┘  └──────────┘
```

| Part | Path | Notes |
|---|---|---|
| Web app | `campus/web` | React 18, Vite 6, Tailwind v4, react-router 7, TanStack Query 5, Radix, recharts. Mobile-first. |
| Demo engine | `campus/web/src/mocks` | With `VITE_CAMPUS_API_URL` empty, every API route is served in the browser from seeded data (`mocks/data/*`, persisted in localStorage). Used for pitches and for building UI without a backend. Implements the same contract as the API. |
| API | `campus/api` | Express 5 + Prisma 6. One router file per domain in `src/routes`, shared logic in `src/services`, helpers in `src/lib`. Stateless, so it runs as one Vercel function (`api/index.js`). |
| Database | Neon Postgres, schema `campus` | Shared with the main Catalance database but fully isolated in its own schema (see DATA_MODEL.md). |
| Main app | `src/` + `backend/` (repo root) | Catalance marketplace. Owns accounts, client briefs and client delivery. |

### Request path
1. `helmet`, CORS allow-list (`CAMPUS_CORS_ORIGIN`), compression, JSON body (1 MB; raw body for `/api/webhooks`).
2. Rate limits (`src/app.js`): `/api/auth` and the sensitive writes listed in OPERATIONS.md.
3. Router: `requireAuth` → `requireRole(...)` (ADMIN always passes) → `validate(zod)` → handler.
4. Privileged writes call `audit()` (`src/lib/audit.js`); user-facing events call `notify()` (`src/lib/notify.js`), which also emails for spec §12 events.
5. Errors become `{ error: { message } }` with the right status (`src/lib/errors.js`).

### Contract
`campus/API_CONTRACT.md` is the single source of truth for routes and shapes. The API and the demo engine both implement it.
Admin reports run the same pure code on both sides (`api/src/services/reports-core.js` and its copy `web/src/mocks/handlers/ops-reports.js`).

## Integrations

| Integration | What for | Where | Config | Without it |
|---|---|---|---|---|
| **Catalance SSO** | One account for Catalance and Campus (spec §3). The main app's `/campus` route signs the user in and hands the access token to Campus `/sso`. Campus verifies the JWT and creates the Campus profile on first visit. | `api/src/lib/auth.js`, `web/src/lib/catalance.js`, `web/src/pages/auth/Sso.jsx` | `CATALANCE_JWT_SECRET` (= backend `JWT_SECRET`), `VITE_CATALANCE_URL`, main app `VITE_CAMPUS_URL` | Nobody can sign in (production refuses to start). |
| **Shared DB schemas** | Campus reads exactly one row of `public."User"` by primary key (id, email, name, avatar, role, status) on each authenticated request. It never writes `public`. All Campus data is in `campus.*`. | `api/src/lib/auth.js`, `api/prisma/schema.prisma` | `CAMPUS_DATABASE_URL`, `CAMPUS_DIRECT_URL` (same values as the backend) | API returns 503. |
| **Razorpay** | Course fees, 100% advance (spec §5.1, §6.2). Hosted checkout; Campus never sees card data. Server-side HMAC verify plus webhooks; duplicate webhooks are no-ops (`WebhookEvent`). Refunds through the Razorpay API. | `api/src/routes/payments.js` | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. Webhook: `<api>/api/webhooks/razorpay` | Only offline payment (UPI/bank + reference, verified by finance). |
| **Resend** | Transactional email for spec §12 events (payment, results, verification, offers, payouts, tickets). Same provider as the main backend, called over HTTPS with `fetch`. | `api/src/lib/email.js`, `api/src/lib/notify.js` | `RESEND_API_KEY`, `CAMPUS_EMAIL_FROM` (verified domain), `CAMPUS_WEB_URL` | In-app notifications only; emails are logged and skipped. |
| **OpenRouter** | AI tutor (behind `flags.aiTutor`, off for the first release). Rate limited per user. | `api/src/routes/tutor.js` | `CAMPUS_OPENROUTER_API_KEY`, `CAMPUS_AI_MODEL` | Friendly fallback reply. |
| **Catalance projects** | Client briefs and client delivery stay in Catalance. A Campus `ProjectOffer` links to it with `catalanceProjectId`. | `api/src/routes/projects.js` | — | Offers work stand-alone. |
| Web analytics (planned) | Visits, course views, lead source (spec §16 Growth). | `api/src/lib/analytics.js` sink, web page tracker | — | Those tiles show "Needs web analytics". |

## Feature flags
Admin-editable settings (`campus.PlatformSetting`, `api/src/lib/settings.js`; web: `usePlatformConfig()`).
Off by default for the first release (spec §2, §19): `flags.aiTutor`, `flags.gamification`, `flags.gigs`, `flags.wallet`.
A flag that is off hides the route on the API (`requireFlag` → 404), not only in the UI.

## Related docs
[ROLES_PERMISSIONS.md](ROLES_PERMISSIONS.md) · [DATA_MODEL.md](DATA_MODEL.md) · [OPERATIONS.md](OPERATIONS.md) · [QA_CHECKLIST.md](QA_CHECKLIST.md) · [ANALYTICS.md](ANALYTICS.md)
