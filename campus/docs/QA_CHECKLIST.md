# QA: test plan and checklist

Spec v1.0 §17, §18.1. Run the manual checklist in **demo mode** (no backend; logins below, password `campus123`) and again against a
**staging API** on a Neon branch with Razorpay test keys. Demo logins: `student@campus.dev`, `aspirant@campus.dev`, `mentor@campus.dev`
(instructor), `evaluator@campus.dev`, `pm@campus.dev`, `finance@campus.dev`, `admin@campus.dev`.

## Automated test plan

No test runner is set up yet. Add these with `node:test` + `supertest` in `campus/api/test/`, using a stubbed Prisma client
(as in the F2 smoke script: `Object.defineProperty` on the exported `prisma` model methods) for unit tests and a Neon branch for integration tests.

| Area | Tests | Type |
|---|---|---|
| Auth | valid Catalance token → profile created once under concurrent first requests; expired/forged token → 401; suspended → 403; Catalance role only raises | unit |
| Role guards | for each route group in ROLES_PERMISSIONS.md, each role gets the documented status (table-driven) | unit |
| IDOR | another user's order, receipt, attempt, offer, ticket, notification, portfolio item, booking → 404 | unit |
| Privacy | peer views (leaderboard, mentors, cohorts, college top students, bookings, mentor studio, passport) never contain email, phone, wallet, earnings, availability, aspirant | unit (snapshot of keys) |
| Payments | paid course enrol without order → 402; checkout reuses PENDING order; HMAC verify good/bad; webhook duplicate is a no-op; refund full/part; offline verify | integration |
| Assessment | scoring formula and critical-criterion rule; REASSESSMENT_REQUIRED vs FAILED by attempts/window; submit locks; appeal reviewer ≠ evaluator; rubric version stored | unit |
| Verification | only PASSED + onboarding → verify; paying/finishing lessons never creates one; revoke needs a reason; public verify shows no private data | unit |
| Offers | student never receives client price/split/share; expiry reads EXPIRED; decline has no penalty; revision limit; client acceptance → payout ELIGIBLE | unit |
| Finance | platform share snapshot; adjustments audited; payout PAID/FAILED audited | unit |
| Reports | `reports-core.js` metrics on fixed fixtures (one per report), funnel and north star, CSV escaping and formula-injection guard | unit (pure) |
| Audit | each privileged write creates one AuditLog row with before/after; audit list filters and cursor | unit |
| Notifications | §12 events email when prefs.email on; no email when off, for community/points, or for undeliverable addresses; email failure never fails the request | unit |
| Rate limits | 6th withdraw in an hour → 429; GET not limited; keyed per token | unit |
| Contract parity | for each route, demo handler and API return the same keys on seeded fixtures | integration |
| Web | `npx vite build` passes; Playwright happy paths below at 390px and 1280px, light and dark | e2e |

F2 already ran: `scratchpad/F2/smoke.mjs` (reports, CSV, funnel, audit, role guards, rate limit, email inference: all pass) and a demo-engine smoke of the ops handlers.

## Manual checklist: spec §17 acceptance criteria

| # | Criterion | Steps | Pass when |
|---|---|---|---|
| 1 | Admin creates skill, course, level, fee, duration, syllabus, cohort and publishes | admin → Catalogue: add a skill → Courses: new course on that skill, level Standard, fee, duration, modules + lessons → status Published | course card shows price ex GST + GST note, duration, level, status chip; it appears in Explore |
| 2 | Visitor finds course, reads fee and terms, registers, pays, gets access | logged out → Explore → course → Enrol → sign in with Catalance → checkout (tick Terms/Privacy/Refund) → pay (demo: instant; staging: Razorpay test card) | consent records saved; order PAID; receipt; "Payment received" notification + email; lessons unlocked |
| 2b | Payment failure, duplicate webhook, refund | staging: failing test card; resend the same webhook; finance → Payments → Refund | FAILED order with retry note; duplicate is a no-op; REFUNDED, audit `order.refund`, notification |
| 3 | Student completes lessons and submits in allowed formats | student → lesson player → complete lessons → Assessments → start → add link/text → Submit | attempt SUBMITTED and locked; only allowed formats offered |
| 4 | Evaluator reviews with a versioned rubric | evaluator → Evaluations → claim → score each criterion → submit result | result stores the rubric version; audit `assessment.result` |
| 5 | Failed student gets feedback and a reassessment route | score below 70 or a critical criterion below half | student sees feedback, REASSESSMENT_REQUIRED with a deadline (14 days) and a Start reassessment button; second fail → FAILED |
| 6 | Passing student gets only the correct skill verification | pass → onboarding (portfolio, identity, payout, availability) → admin → Verifications → Approve | exactly one SkillVerification for that skill + level; public verify page shows name, skill, level, status only |
| 7 | Admin/PM creates brief, scopes project, finds verified candidates | pm → Talent: filter by skill, level, available → New offer with deliverables, criteria, deadline, payout | only ACTIVE verified, non-suspended students listed; no contact details |
| 8 | Student sees deliverables, deadline, terms, payout before accepting | student → Opportunities → offer | payout, deadline, deliverables, revisions, confidentiality visible; Accept requires project policy consent; Decline has no penalty |
| 9 | PM tracks progress, revisions, acceptance | student delivers → pm reviews: Revision → student redelivers → Approve → client acceptance | revision count enforced; COMPLETED; payout ELIGIBLE |
| 10 | Finance records price, split, payout, taxes, status | finance → Payouts → set client price + split → mark PAID with reference | platform share snapshot; audit `finance.*` and `payout.paid`; student notified; student never sees client price |
| 11 | Users can't reach other users' private data by changing URLs or ids | as student, open `/app/projects/<another offer id>`, `/app/help/<another ticket id>`, call `GET /api/orders/<other id>/receipt`, `/api/me/offers/<other id>` | 404 everywhere; leaderboard/mentor/cohort/college/passport JSON has no email, phone, wallet or earnings |
| 12 | Admin exports reports and audits financial and verification changes | admin → Reports → each of the 7 tabs → Export CSV; Audit log → area Payments / Verifications → open a row | CSV downloads open in Excel; audit rows show actor, time, reason, before/after; exports are themselves audited |
| 13 | Mobile flows work | repeat 2, 3, 5, 8 at 375px | no horizontal scroll; one primary action per screen; tables scroll inside their card |
| 14 | No-guarantee disclosures visible | home, course detail, assessment result, verification, opportunities | "Projects and earnings are not guaranteed" copy present; no job/income promises anywhere |
| 15 | Role access | log in as each staff role | each sees only its console sections (ROLES_PERMISSIONS.md); direct URLs to other sections show the permission-denied state; API returns 403 |
| 16 | States on key screens (§14.2) | throttle network, go offline, use an empty account, an expired offer | loading skeleton, empty, error with retry, success toast, permission denied and expired states all render |
| 17 | Notifications (§12) | trigger payment, result, verification, offer, payout, ticket reply; turn email off in Settings and repeat one | in-app for all; email (staging, Resend test domain) for each when on, none when off |
| 18 | Rate limits | submit the same support ticket 31 times in an hour (script) | 429 with a friendly message |

## Release smoke (after every deploy)
- `GET /api/health` → `ok: true`, database configured.
- Sign in through Catalance → `/sso` → dashboard.
- Explore lists published courses; a draft course URL 404s for a student.
- Admin → Overview shows the north-star strip; Reports loads Growth; Audit log loads.
- Razorpay test checkout on staging; webhook delivery green in the Razorpay dashboard.
