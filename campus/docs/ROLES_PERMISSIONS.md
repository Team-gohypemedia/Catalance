# Roles and permissions

Spec v1.0 §3, §17, §18.1. One Catalance account, one Campus profile, one role. Every check below is enforced **on the API**
(`requireAuth`, `requireRole`, ownership checks in handlers); the web console only mirrors it (`App.jsx` route guards, `nav-config.js`).

## Roles

| Role | Spec name | How it is granted |
|---|---|---|
| `STUDENT` | Learner | Default for every new Campus profile. |
| `MENTOR` | Instructor | Admin sets it (Admin → Students). |
| `EVALUATOR` | Evaluator | Admin sets it. |
| `PROJECT_MANAGER` | PM | Admin sets it, or synced from the Catalance role `PROJECT_MANAGER`. |
| `FINANCE` | Finance | Admin sets it. |
| `ADMIN` | Admin | Synced from the Catalance role `ADMIN`, or set by another admin. |

Rules: `requireRole(...)` always lets `ADMIN` through. Catalance can only raise a Campus role, never lower it. An admin can't remove their own
admin role or suspend themself. A suspended account (Campus or Catalance) gets 403 on every authenticated route. Role and status changes are audited (`user.role`, `user.status`).

Legend: ✅ allowed · 👤 own records only (other ids → 404) · 🎓 own courses only · — denied (401/403) · 🌐 public, no login.

## Matrix by route group

| Route group | Public | Student | Instructor | Evaluator | PM | Finance | Admin |
|---|---|---|---|---|---|---|---|
| `GET /api/platform/config`, `/api/platform/policies/:doc`, `/api/categories`, `/api/skills/:slug`, `/api/courses`, `/api/tracks`, `/api/public/stats` | 🌐 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (drafts too) |
| `GET /api/u/:username` (passport), `/api/certificates/verify/:code`, `/api/verify/skill/:code` | 🌐 (no contact details, money or private profile) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /api/webhooks/razorpay` | 🌐 (signature checked) | | | | | | |
| `/api/auth/me`, `PATCH /api/me`, `/api/me/onboarding`, `/api/me/dashboard`, `/api/notifications*` | — | 👤 | 👤 | 👤 | 👤 | 👤 | 👤 |
| Learning: `/api/courses/:id/enroll`, `/api/lessons/:id*`, `/api/me/enrollments`, `/api/me/submissions`, `/api/me/certificates` | — | 👤 (enrolled; drafts 404) | 👤 + 🎓 preview | 👤 | 👤 | 👤 | ✅ |
| Payments: `/api/courses/:id/checkout`, `/api/orders/:id/*`, `/api/me/orders`, `/api/me/consents*` | — | 👤 | 👤 | 👤 | 👤 | 👤 (+ any receipt) | 👤 (+ any receipt) |
| Assessments (student): `/api/me/assessments`, `/api/courses/:id/assessment*`, `/api/attempts/:id/*`, `/api/me/skills` | — | 👤 | 👤 | 👤 | 👤 | 👤 | 👤 |
| Evaluations: `/api/evaluations`, `/claim`, `/result` | — | — | 🎓 | ✅ | — | — | ✅ |
| `/api/evaluations/:id/assign`, `/appeal-decision`, `/api/admin/rubrics`, `/api/admin/courses/:id/assessment`, `/api/admin/verifications`, `/api/admin/attempts/:id/verify` | — | — | — | — | — | — | ✅ |
| Projects (student): `/api/me/offers*`, `PATCH /api/me/availability` | — | 👤 | 👤 | 👤 | 👤 | 👤 | 👤 |
| `/api/pm/talent`, `/api/pm/offers*` | — | — | — | — | ✅ (own offers) | — | ✅ (all) |
| `/api/finance/offers*` (client price, split, payouts) | — | — | — | — | — | ✅ | ✅ |
| Support (own): `/api/support/tickets*` | — | 👤 | 👤 | 👤 | 👤 | 👤 | 👤 (+ any) |
| `/api/admin/support/tickets*` | — | — | — | — | ✅ | ✅ | ✅ |
| `/api/admin/orders*` (offline verify, fail, refund) | — | — | — | — | — | ✅ | ✅ |
| `/api/admin/reports/:name[.csv]` | — | — | — | — | — | ✅ | ✅ |
| `/api/admin/audit`, `/api/admin/funnel`, `/api/admin/settings` | — | — | — | — | — | — | ✅ |
| `/api/admin/*` (overview, courses, catalogue, students, colleges, mentors, gigs, applications, submissions) | — | — | — | — | — | — | ✅ |
| Mentor studio: `/api/mentor/overview`, `/api/mentor/submissions/:id/review` | — | — | 🎓 | — | — | — | ✅ |
| Community: `/api/threads*`, `/api/replies/*`, `/api/mentors*`, `/api/cohorts*`, `/api/me/bookings`, `/api/bookings/:id/cancel` | — | ✅ (authors/members/participants only for writes) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Legacy, behind flags (off): `/api/gigs*`, `/api/wallet*`, `/api/ladder`, `/api/leaderboard`, `/api/tutor/chat` | — | ✅ when flag on | ✅ | ✅ | ✅ | ✅ | ✅ |

`/api/admin/{orders,support,reports}` are shared prefixes: `routes/admin.js` skips its admin-only guard for them and the owning route file applies the wider role list.

## Data visibility rules
- Other people are shown as **peer users**: no email, phone, notification settings, wallet balance, earnings or availability. Staff views (admin lists) and the owner's own view show full profiles.
- Students never see a project's client price, split or platform share (`ProjectOfferStudent`). Finance fields are only in `/api/finance/*` and the finance report.
- Evaluator notes are internal; students see the published feedback only. Support messages marked internal are hidden from the ticket owner.
- Any `:id` that isn't yours returns **404**, not 403, so ids can't be probed.
- The private aspirant profile is only in the owner's own view.

## Web console guards
`App.jsx` wraps each `/admin/*` page in `RequireAuth roles=[…]` with the same roles as the table above; `nav-config.js` shows only allowed links.
Hiding a link is a convenience; the API check is the control.
