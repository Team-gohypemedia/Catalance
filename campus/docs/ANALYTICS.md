# Analytics: events and report definitions

Spec v1.0 §16. Two separate things:

1. **Reports** (`GET /api/admin/reports/:name`, Admin → Reports) are computed from the **domain tables** (orders, enrolments,
   attempts, verifications, offers, tickets). They are the numbers we trust. Code: `api/src/services/reports-core.js`
   (the demo engine runs an identical copy, `web/src/mocks/handlers/ops-reports.js`; keep them in sync).
2. **Events** (`track(name, props, userId)` in `api/src/lib/analytics.js`) are for product analytics that have no table
   (visits, course views, lead source). They are logged in development and not stored yet; a sink (PostHog, GA4 or a warehouse) plugs into `track()`.
   Reports never read events.

## North star
**Students who passed an assessment AND completed at least one client-accepted, paid project** (`clientAcceptedAt` set and `payoutStatus = PAID`).
Not raw sign-ups. Shown on Admin → Overview and Reports.

## Funnel (`GET /api/admin/funnel?from&to`, admin)
For students who **signed up in the range** (all time by default), how many reached each step or a later one:

| Step | Definition |
|---|---|
| Visitors | from web analytics (`page.viewed`); not in the database → `null` |
| Signed up | `User` (STUDENT) created in range |
| Paid for a course | has a `CourseOrder` with `paidAt` |
| Submitted an assessment | has an attempt with `submittedAt` (or passed / verified) |
| Passed an assessment | attempt `PASSED`/`VERIFIED` or `passed = true` (or verified) |
| Verified skill | has any `SkillVerification` |
| First accepted paid project | has a `ProjectOffer` with `clientAcceptedAt` and `payoutStatus = PAID` |

## Reports
Range: `?from=YYYY-MM-DD&to=YYYY-MM-DD`, default last 30 days. Series are per day up to 92 days, per month beyond.
Rates are percentages with one decimal, `null` when the denominator is 0. Money is whole rupees. Every report has a CSV export (`/api/admin/reports/<name>.csv`, audited `report.export`).

| Report | Metric | Definition |
|---|---|---|
| **Growth** | visits, course views, lead source | `null` until web analytics is wired (events `page.viewed`, `course.viewed`, `lead.captured`) |
| | sign-ups | students created in range |
| | checkout starts | non-FREE orders created in range |
| | paid enrolments / paid students | orders with `paidAt` in range / distinct users |
| | sign-up → paid | sign-ups in range who have any paid order ÷ sign-ups |
| | checkout → paid | checkouts in range that got paid ÷ checkouts |
| | CAC | `null` (needs marketing spend) |
| **Course** (per course) | enrolments, avg progress, completion | enrolments started in range; mean `progressPercent`; `completedAt` set ÷ enrolments |
| | assignment lateness | assessment submitted after enrolment start + `Assessment.dueDays` ÷ submissions in range |
| | pass rate | PASSED/VERIFIED ÷ results given in range |
| | reassessments | attempts with `attemptNo > 1` created in range |
| | refunds | orders refunded in range (count, ₹) |
| **Talent** (per skill + level) | verified | ACTIVE verifications |
| | open to projects | verified students with `availability.openToProjects = true` |
| | profile completeness | % of 8 fields filled: photo, headline, bio, city, college, skills, a link, availability |
| | performance | avg rating and on-time rate of client-accepted projects by verified students |
| | suspension / appeal | suspended students; open appeals; appeals decided in range; revoked verifications |
| **Marketplace** | offers, accepted, declined, expired | offers created in range (OFFERED past `expiresAt` = expired) |
| | acceptance rate | accepted ÷ (accepted + declined + expired) |
| | time to first opportunity | median days from a student's first verification to their first offer |
| | paid projects completed | client accepted and payout PAID in range |
| | repeat work | students with ≥ 2 client-accepted projects ÷ students with ≥ 1 |
| **Quality** | client acceptance | accepted ÷ (accepted + disputed + cancelled after a delivery) |
| | on-time delivery | last delivery (or acceptance) on or before the deadline |
| | revisions | mean `revisionsUsed` of accepted projects |
| | complaints, disputes, dispute rate | tickets `COMPLAINT` / `DISPUTE` in range + DISPUTED offers; disputed ÷ offers that started work |
| **Finance** | course revenue ex taxes | Σ `amountINR` of orders paid in range (GST shown separately) |
| | refunds, net course revenue | Σ `refundINR` refunded in range; revenue − refunds |
| | project price | Σ `clientPriceINR` of projects accepted in range |
| | freelancer payouts / pending | Σ `payoutINR` with payout PAID in range / ELIGIBLE + PENDING now |
| | platform share | Σ `platformShareINR` snapshot (else client price − taxes − payout) |
| | fees | **estimated** at 2% of Razorpay totals until settlement data is imported |
| | contribution margin | net course revenue + platform share − fees − adjustments (before instructor and staff cost) |
| **Capacity** (snapshot) | instructor workload | per instructor: active students in their courses, assignments waiting, oldest wait |
| | evaluator queue | SUBMITTED / UNDER_REVIEW / APPEAL_PENDING attempts, unassigned, oldest wait (h) |
| | PM workload | per PM: active projects, offers awaiting response + deliveries to review |
| | open support tickets | OPEN + IN_PROGRESS by owner; high/urgent count |

## Event dictionary
Names are `object.verb`, lower case. Props never contain names, emails, phone numbers, UPI ids, payment ids or free text
(`track()` drops keys that look private). Source of truth: `EVENT_DICTIONARY` in `api/src/lib/analytics.js`.

| Event | Group | Props | Fired when |
|---|---|---|---|
| `page.viewed` | growth | path, source | any public page view (web) |
| `course.viewed` | growth | courseId, source | course detail opened |
| `lead.captured` | growth | source, campaign | visitor leaves a contact or starts sign-up with a lead source |
| `signup.completed` | growth | source | Campus profile created |
| `checkout.started` | growth | courseId, provider | order created or reused |
| `payment.succeeded` | finance | orderId, courseId, provider, totalINR | order PAID |
| `payment.failed` | finance | orderId, provider, reason | order FAILED |
| `refund.issued` | finance | orderId, amountINR | order refunded |
| `enrolment.created` | course | courseId, paid | enrolled |
| `lesson.completed` | course | courseId, lessonId | lesson done |
| `course.completed` | course | courseId | all lessons done |
| `assessment.started` | course | courseId, attemptNo | attempt opened |
| `assessment.submitted` | course | courseId, attemptNo, late | attempt submitted |
| `assessment.result` | course | courseId, status, totalScore | result given |
| `appeal.opened` | talent | attemptId | appeal filed |
| `verification.approved` | talent | skillId, level | verification created |
| `verification.revoked` | talent | skillId, level | verification revoked |
| `availability.updated` | talent | openToProjects, hoursPerWeek | availability saved |
| `offer.created` | marketplace | offerId, skillId | PM sends an offer |
| `offer.accepted` / `offer.declined` / `offer.expired` | marketplace | offerId | student responds / no response |
| `delivery.submitted` | quality | offerId, version | student delivers |
| `delivery.revision_requested` | quality | offerId, revisionsUsed | PM asks for changes |
| `project.client_accepted` | quality | offerId, onTime, rating | client accepts |
| `payout.paid` | finance | offerId, payoutINR | payout PAID |
| `ticket.created` / `ticket.resolved` | capacity | category | ticket opened / resolved |
| `report.exported` | admin | report, format | CSV downloaded |

Wired today: `report.exported` (ops routes). Other domains call `track()` at the points above; until a sink exists the events only appear in dev logs.

## Email notifications (spec §12)
`notify()` writes the in-app notification, then (fire-and-forget) emails it when the user's `notificationPrefs.email` isn't off and the
notification is a §12 event: `registration`, `payment.success`, `payment.failed`, `course.start`, `lesson.deadline`, `assignment.due`,
`assessment.result`, `reassessment.window_ending`, `verification.completed`, `project.new_match`, `offer.accepted`, `offer.declined`,
`offer.expired`, `milestone.due`, `client.review_needed`, `payout.status`, `ticket.update`. Callers pass `event: "<name>"`, or the event is
inferred from the link (`/app/payments`, `/app/assessments`, `/app/skills`, `/app/opportunities`, `/app/projects`, `/app/help`, `/admin/offers`,
`/admin/support`). Community, points and gig notifications stay in-app only. `email: false` forces in-app only.
