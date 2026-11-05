# Data model and migration plan

Spec v1.0 §10, §18.1. Source of truth: `campus/api/prisma/schema.prisma`. Everything lives in the Postgres schema **`campus`**
of the shared Catalance (Neon) database.

## Isolation from Catalance
- The datasource declares `schemas = ["campus"]` and every model and enum carries `@@schema("campus")`.
- `api/scripts/check-schema.mjs` fails the build of any push, migrate or seed command (`npm run prisma:push`, `prisma:migrate`, `prisma:deploy`, `seed`) if a model or enum misses `@@schema("campus")`, if another schema is declared, or if `public` is mentioned.
- The API reads one row of `public."User"` by primary key during sign-in (raw SQL in `lib/auth.js`). It never writes `public`.

## Entities (spec §10 → Prisma model)

| Spec entity | Model | Key fields and rules |
|---|---|---|
| User | `User` | `catalanceUserId` (unique link to Catalance), `role`, `status`, profile, `notificationPrefs` (`email` on/off), `availability` (JSON: openToProjects, hoursPerWeek, days, tools…), `aspirant` (private). |
| Category | `Category` | `slug`, `name`, `order`, `status` text: `DRAFT \| PUBLISHED \| ARCHIVED`. |
| Skill | `Skill` | per category; `formats` (levels offered), `clientServices`, `status` text: `DRAFT \| PUBLISHED \| PAUSED \| ARCHIVED`. |
| Course | `Course` | `skillId`, `level` (incl. `STANDARD`), `priceINR` (ex GST), `durationDays`, `capacity`, enrolment window, **`status` stays a `String`** with controlled values `DRAFT \| PUBLISHED \| ENROLMENT_OPEN \| FULL \| PAUSED \| ARCHIVED` (validated in code, not a DB enum, so new states don't need a migration). |
| Module / Lesson | `CourseModule`, `Lesson` | ordered; lesson types VIDEO, ARTICLE, QUIZ, ASSIGNMENT. |
| Enrolment | `Enrollment` | unique per user + course; `progressPercent`, `completedAt`. |
| Order / Payment | `CourseOrder` | `amountINR` ex GST, `gstINR`, `totalINR`, `status` `PENDING \| PAID \| FAILED \| REFUNDED \| CANCELLED`, `provider` `RAZORPAY \| OFFLINE \| DEMO \| FREE`, unique provider ids, refund fields. |
| Webhook log | `WebhookEvent` | unique `(provider, eventId)`: duplicates are no-ops. |
| Consent | `ConsentRecord` | purpose, `policyVersion`, context, ip, timestamps; `MARKETING` is separate and withdrawable. |
| Rubric | `Rubric` | versioned by `(key, version)`; edits create a new version; results keep the exact `rubricId`. |
| Assessment | `Assessment` | one per course; pass score, attempts, reassess window, due days. |
| Submission / Assessment result | `AssessmentAttempt` | status machine (spec §8.1), `submission` JSON, `version`, `scores`, `totalScore`, `feedback`, internal `evaluatorNotes`, appeal fields, `history`. |
| Skill badge | `SkillVerification` | unique per user + skill + level; `ACTIVE \| REVOKED \| EXPIRED`, `verifyCode`, evidence, history. |
| Course certificate | `Certificate` | **completion only**. **`score` is now nullable**: the passed assessment total, or null; never a default 100. |
| Project offer | `ProjectOffer` | to one student; `payoutINR` (what the student gets), finance fields (client price, split, platform share snapshot, taxes, adjustments), `payoutStatus`, deliveries, history. |
| Support ticket / dispute | `SupportTicket` | category incl. `COMPLAINT`, `DISPUTE`; messages JSON with internal flag. |
| Audit log | `AuditLog` | actor, role, action, entity, entityId, before/after JSON, reason, ip, user agent. Indexed by entity, actor + time, time. |
| Settings | `PlatformSetting` | key → JSON value; defaults in `src/lib/settings.js`. |
| Legacy (behind flags) | `Gig`, `GigApplication`, `WalletTxn`, `PointsEvent`, `Season`, `UserBadge`, `Thread`, `Reply`, `Booking`, `Cohort`… | kept; hidden by `flags.*` when off. |

## Migration plan

Campus has used `prisma db push` so far (no migration history). For the spec v1.0 release:

1. **Back up** (see OPERATIONS.md): Neon branch from production, named `pre-campus-spec-v1`.
2. **Check**: `npm run check-schema` must pass. Review `npx prisma migrate diff --from-url "$CAMPUS_DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script` against the Neon branch, not production. Every change in v1.0 is additive (new tables and enums, new nullable columns, `Certificate.score` relaxed to nullable), so no data is rewritten.
3. **Apply** on the branch first: `npm run prisma:push` (runs the guard, then `prisma db push`). Smoke-test the API against the branch.
4. **Apply to production** in a quiet window with the same command, then deploy the API, then the web.
5. **Data fixes** after the push (one-off, idempotent scripts): set existing `Course.status` to one of the controlled values; null out legacy certificate scores of 100 that were defaults; create `Assessment` rows for launch courses.
6. **Move to migrations** once v1.0 is live: `prisma migrate diff` to a baseline `0001_init` marked applied with `prisma migrate resolve --applied 0001_init`, then use `npm run prisma:migrate` (dev) and `npm run prisma:deploy` (CI) from then on.

Rollback: the API is backwards compatible with the old schema only for legacy routes; to roll back a bad push, restore the Neon branch (OPERATIONS.md) and redeploy the previous API build.
