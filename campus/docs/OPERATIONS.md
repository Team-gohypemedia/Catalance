# Operations

Spec v1.0 §15, §18.1: environment and config, deployment, rollback, backup and recovery, incident response,
data retention and deletion, upload rules, rate limits.

## Environment and config

API (`campus/api/.env`, see `.env.example`; never commit real values):

| Variable | Required | Purpose |
|---|---|---|
| `CAMPUS_DATABASE_URL` | yes | Pooled Neon URL (same as backend `DATABASE_URL`). |
| `CAMPUS_DIRECT_URL` | yes for schema changes | Direct Neon URL (same as backend `DIRECT_DATABASE_URL`). |
| `CATALANCE_JWT_SECRET` | yes (prod refuses to start) | Same value as backend `JWT_SECRET`. |
| `CAMPUS_CORS_ORIGIN` | yes | Comma-separated web origins. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | for online payments | Without them only offline payment is offered. |
| `RESEND_API_KEY`, `CAMPUS_EMAIL_FROM` | for email | Without the key, emails are logged and skipped. From domain must be verified in Resend. |
| `CAMPUS_WEB_URL` | recommended | Base URL for links in emails (defaults to the first CORS origin). |
| `CAMPUS_OPENROUTER_API_KEY`, `CAMPUS_AI_MODEL` | only if `flags.aiTutor` | AI tutor. |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | for file uploads | Private Cloudflare R2 bucket for assessment files (see "Uploads"). Without all four, uploads answer 503 and the web hides the upload control. |
| `CRON_SECRET` | for the scheduler | Bearer secret for `/api/cron/tick` (see "Scheduler"). Without it the endpoint answers 503 and reminders only happen lazily. |
| `NODE_ENV`, `PORT` | | `production` on Vercel. |

Web (`campus/web/.env.local`): `VITE_CAMPUS_API_URL` (empty = demo mode), `VITE_CATALANCE_URL`. Main app: `VITE_CAMPUS_URL`.

Runtime settings and feature flags are **not** env vars: admins change them in Admin → Settings (`PlatformSetting`, cached 30 s per instance, audited as `settings.update`).

## Deployment
Two Vercel projects, region `bom1` for the API (close to the Neon `ap-south-1` database):
1. Schema change? Follow DATA_MODEL.md "Migration plan" first. Never run `db push` from a laptop against production without a Neon branch backup.
2. Deploy the **API** (`campus/api`, `vercel.json` builds with `prisma generate`). Check `GET /api/health` returns `ok: true, database: "configured"`.
3. Deploy the **web** (`campus/web`).
4. Smoke test with the QA_CHECKLIST.md "Release smoke" list.

Secrets live in Vercel project env vars only. Rotate `RAZORPAY_*` and `RESEND_API_KEY` yearly or on any suspected leak; rotating `JWT_SECRET` signs everyone out of both Catalance and Campus.

## Rollback
- **Code**: Vercel → Deployments → promote the previous production deployment (API and web separately). Takes effect in seconds.
- **Feature**: switch the feature's flag off in Admin → Settings (API hides the route within 30 s).
- **Schema**: restore the pre-release Neon branch (below) and redeploy the matching API build. Additive changes rarely need this.
- **Payments**: never delete orders. Correct with refunds or `order.fail` (audited).

## Backup and recovery
- Neon point-in-time restore covers the whole database (Catalance + Campus). Keep history retention at ≥ 7 days on the paid plan.
- Before every schema change: create a Neon branch (`pre-<release>`). Keep the last 3.
- Monthly: `pg_dump --schema=campus` to encrypted storage owned by Catalance, kept 12 months. Test a restore into a scratch branch each quarter.
- Recovery target: RPO ≤ 24 h (dump) / minutes (PITR), RTO ≤ 4 h.
- Razorpay is the source of truth for payments: after a restore, reconcile `CourseOrder` against the Razorpay dashboard and replay missed webhooks.

## Incident response
1. **Detect**: Vercel function errors, `/api/health`, Razorpay webhook failures, support tickets, Resend bounce alerts.
2. **Triage** (on-call engineer, within 1 h): severity S1 = data leak, payment wrong, everyone blocked; S2 = one feature down; S3 = cosmetic.
3. **Contain**: turn the feature flag off, roll back, or rotate the leaked secret. For a suspected data leak, preserve logs and the audit trail (`AuditLog` is append-only; never edit it).
4. **Communicate**: S1/S2 → founders + support within 2 h; affected users told plainly what happened and what to do. Personal-data breaches: notify the Data Protection Board of India and affected users as required by the DPDP Act 2023 and its rules (within 72 h of becoming aware), and CERT-In within 6 h for reportable cyber incidents.
5. **Fix and verify**, then a short written post-mortem within 5 working days (timeline, cause, fix, follow-ups).

## Data retention and deletion
| Data | Keep | Then |
|---|---|---|
| Account and learning records | While the account is active | Deleted or anonymised within 30 days of a verified deletion request (support ticket). |
| Orders, receipts, refunds, payouts | 8 years (Indian tax and accounting rules) | Kept even after account deletion, with the person reduced to name + invoice details. |
| Consent records | Life of the account + 3 years | Needed to prove consent. |
| Assessment attempts and skill verifications | While the account is active | Verification codes stop resolving after deletion. |
| Audit log | 3 years | Then purged by a scheduled job. Never edited. |
| Support tickets | 3 years after closing | Then deleted. |
| Notifications | 12 months | Then deleted. |
| Server logs (Vercel) | Platform default (≤ 30 days) | |

Marketing consent (`MARKETING`) is separate from Terms/Privacy/Refund, off unless the user opts in, and can be withdrawn at any time (`POST /api/me/consents/MARKETING/withdraw`). Transactional emails (payment, results, offers) are not marketing; users can still turn them off with `notificationPrefs.email`.

Deletion process: user opens a ticket (category GENERAL, subject "Delete my account") → admin verifies identity → runs the deletion script (to be written; deletes `campus.User` cascade, keeps finance rows anonymised) → audit `user.delete` → confirms to the user. Catalance account deletion is handled by the main app.

## Uploads (assessment files, spec §15)
Code: `api/src/lib/uploads.js` (rules), `api/src/lib/storage.js` (R2 driver), routes in `api/src/routes/assessments.js`; web `components/assessment/files.jsx`.

Flow:
1. `POST /api/attempts/:id/uploads { name, type, size }` (owner, attempt `IN_PROGRESS`, assessment allows `file`, < 10 files) checks the
   allow-list and size and returns a presigned **PUT** valid 10 minutes plus `file: { key, name, size, type }`.
2. The browser PUTs the bytes straight to R2 with the returned `Content-Type` (signed into the URL), then saves the file in
   `submission.files` with `PUT /api/attempts/:id/submission`. The API `HEAD`s every new key: missing → 400, over the limit → deleted + 400;
   the stored size comes from R2, not the browser.
3. `GET /api/attempts/:id/files/:index` mints a presigned **GET** valid 10 minutes (`Content-Disposition: attachment`), only for the student,
   the evaluator assigned to / claiming the attempt, the course's mentor, or an admin. Everyone else gets 404.

Rules:
- Allow-list by extension, and the browser-reported type must match it (or be empty/octet-stream): pdf, png, jpg/jpeg, webp, zip, fig (Figma), mp4,
  docx, pptx, xlsx, txt. Everything else (exe, html, svg, js…) is refused. The stored type is the canonical one for the extension.
- Max **25 MB** per file (`MAX_UPLOAD_BYTES`), 10 files per submission (`MAX_FILES`); change both in `lib/uploads.js`, the demo engine and the web picker.
- Keys: `campus/attempts/<attemptId>/<random>-<ascii-safe name>`. The bucket is **private**; no public URL or signed URL is ever stored or returned
  in an attempt. A reassessment carries the previous attempt's files forward (same keys, same student).
- Not done yet: content sniffing (magic bytes) and virus scanning before an evaluator opens a file; deleting objects when a file is removed
  from a draft or an account is deleted (orphans stay under the attempt prefix; an R2 lifecycle rule can expire them).

R2 setup (once per environment):
1. Create a bucket (no public access, no r2.dev subdomain, no custom public domain).
2. Create an R2 API token with **Object Read & Write** on that bucket only; put the account id, key id, secret and bucket name in the API env.
3. Bucket CORS policy (Settings → CORS), so the browser can PUT directly:
   `[{ "AllowedOrigins": ["https://campus.catalance.in"], "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["Content-Type"], "MaxAgeSeconds": 3600 }]`
   (add `http://localhost:5180` for local development).
4. Check: upload a PDF on an assessment that allows files, open it from the draft and from the evaluator screen; the link stops working after 10 minutes.

Demo mode has no storage: the API's fake key is kept with the file in the tab's memory, so demo files open only in the tab that uploaded them.

## Scheduler (spec §12 reminders, offer expiry)
`GET` or `POST /api/cron/tick` with `Authorization: Bearer <CRON_SECRET>` runs one tick (`api/src/services/scheduler.js`). Without the
header → 401; without `CRON_SECRET` set → 503. `api/vercel.json` schedules it hourly (`"crons": [{ "path": "/api/cron/tick", "schedule": "0 * * * *" }]`);
Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically once `CRON_SECRET` is set in the project env. Hourly crons need a Vercel
Pro plan (Hobby allows one run a day); any other scheduler can call the same URL. Locally or by hand: `npm run cron:tick` (no HTTP, uses the DB in `.env`).

Each tick is idempotent (once-only markers, conditional writes), so running it every 15 minutes, hourly, or twice at once is safe:
| Step | Rule | Notified | Once-only marker |
|---|---|---|---|
| Offer expiry | `OFFERED` and `expiresAt` passed → `EXPIRED` + history entry | PM (`offer.expired`) | conditional `status = OFFERED` update |
| Milestones | active offer, milestone not approved, due within 24 h / overdue | student + PM (`milestone.due`) | `dueNotifiedAt` / `overdueNotifiedAt` in `milestones` |
| Reassessment window | `REASSESSMENT_REQUIRED`, window ends within 48 h, no newer attempt | student (`reassessment.window_ending`) | `REMINDED` entry in the attempt's `history` |
| Assessment deadline | `Assessment.dueDays` after enrolment ends within 48 h, nothing submitted | student (`assignment.due`) | the "Assessment due soon" notification (one per student + course) |

The response is `{ ok, at, tookMs, counts: { offersExpired, milestoneReminders, reassessReminders, deadlineReminders }, errors }` (500 when a step failed;
the other steps still run). Offer expiry and milestone notices also run lazily when offers are read, and reassessment reminders when students open
assessments (≤ 3 days), so a missed tick only delays emails. If ticks stop: check Vercel → Cron Jobs, then call the URL by hand with the secret.

## Rate limits
`express-rate-limit` in `src/app.js`, keyed per session token (else IP) so a college behind one NAT isn't throttled together:

| Paths (POST) | Limit |
|---|---|
| `/api/auth/*` | 50 / 15 min |
| `/api/courses/:id/checkout`, `/api/orders/:id/razorpay/verify`, `/api/orders/:id/offline-reference` | 20 / 15 min |
| `/api/attempts/:id/submit`, `/api/attempts/:id/appeal`, `/api/me/offers/:id/{accept,decline,deliveries}` | 30 / 15 min |
| `/api/attempts/:id/uploads` (per user, `routes/assessments.js`) | 40 / 10 min |
| `GET /api/attempts/:id/files/:index` (per user) | 120 / 10 min |
| `/api/support/tickets*`, `/api/me/consents*` | 30 / hour |
| `/api/wallet/withdraw` | 5 / hour |
| `/api/tutor/chat` | per-user limiter in `routes/tutor.js` |

On Vercel each function instance keeps its own counters (memory store). If abuse shows up, move to a shared store (Upstash Redis via `rate-limit-redis`).
