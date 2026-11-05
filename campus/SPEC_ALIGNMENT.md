# Campus spec alignment (Developer Product Specification v1.0, 27 Oct 2026)

Where the code stands against each section of the spec after the spec v1.0 MVP build, and what is still open.
The route-level contract is the "Spec v1.0" section of [API_CONTRACT.md](API_CONTRACT.md); the operating docs are in [docs/](docs/).

Status key: **Done** (built in the API and the demo engine, smoke-tested offline) · **Partial** · **Missing** · **Needs sign-off**
(built on the spec's recommended default; the business must confirm).

"Smoke-tested" means: the real Express app against an in-memory Prisma stub (`npm run smoke:spec` in `api/`, plus each domain's
scratch tests) and the demo engine's handlers. **Nothing has been run against a real Postgres database, real Razorpay test keys or a
real browser.** See section 5 before launch.

## 1. Summary

| Area | Status | In one line |
|---|---|---|
| One account for Catalance + Campus (§1.1, §3, §4.1) | **Done** | Catalance sign-in is the Campus sign-in. Details in section 2. |
| Roles (§3) | **Done** | STUDENT, MENTOR (instructor), EVALUATOR, PROJECT_MANAGER, FINANCE, ADMIN. Checked on the API; staff console pages are guarded by the same roles. |
| Public pages (§4.1) | **Done** | Home, Explore, Course detail, Skills, How it works, Pricing, For businesses (links to Catalance `/service`), FAQs, Contact, Legal (`/legal/:doc`, links to Catalance's Terms, Privacy and Refund). |
| Student pages (§4.2) | **Done** | Dashboard with one next action, Assessments, My skills, Course certificates, Opportunities, My projects, Availability (on Profile), Payments + receipts, Help/support tickets. |
| Catalogue (§6) | **Done** | 5 categories, 26 skills (3 published: UI/UX Design, Short-Form Video Editing, Frontend Development), STANDARD level, per-level price/duration defaults, GST note, 6 course statuses, capacity and enrolment dates. |
| Payments (§5.1 steps 4–6, §6.2, §9.4) | **Done**, live run pending | 100% advance. Razorpay checkout + signature-checked verify and webhook (idempotent), offline payment with finance verification, receipts, refunds, consent records. Pay-later removed from the enrol flow. |
| Assessment + verification (§8) | **Done** | All 9 states, versioned rubrics with weights and critical criteria, 70/100 pass mark, 2 attempts with a 14-day reassessment window, appeals decided by a different admin, onboarding, admin approval, badge with evidence / rubric version / expiry / history, revoke and reinstate with a reason, public verify page. |
| Projects for students (§5.2, §5.3, §9) | **Done** | PM talent search over verified students, offers with exact payout shown before acceptance, accept/decline with consent, deliveries with versions, revisions, client acceptance, finance split snapshot, adjustments and payouts. |
| Out of MVP (§2) | **Needs sign-off** | AI tutor, gamification, gigs and wallet are behind feature flags, **off by default** (API returns 404, web shows "Not available"). |
| Notifications (§12) | **Done**, email needs a key | In-app for every §12 trigger; email via Resend inside `notify()` when `RESEND_API_KEY` is set. |
| Security / privacy (§15, §17) | **Partial** | Audit log, consent records, rate limits, own-data 404s and contact-free talent rows are done. Open: real file storage with private expiring links, a shared rate-limit store, account deletion and retention jobs. |
| Analytics and reports (§16) | **Partial** | Funnel, north-star metric and 7 reports with CSV export, computed from domain tables. Visits, course views, lead source and CAC are not tracked (no web analytics sink). |

## 2. One account

Spec: "Use one account with role-based access for student, client, Project Manager, instructor/evaluator and admin" (§1.1) and "Login / Sign Up: one account entry with role-based onboarding" (§4.1).

- A Catalance account **is** the Campus account. Campus has no sign-up or password of its own. Flow:
  Campus "Log in / Sign up" → Catalance `/campus` → Catalance sign-in (phone OTP / email) → back to Campus `/sso`.
  See [api/README.md](api/README.md#accounts-catalance-sign-in).
- Campus profile (`campus."User"`, linked by `catalanceUserId`) is created on the first visit. Catalance `public."User"`
  is read, never written.
- Suspending a Catalance account blocks Campus too. Catalance admins are Campus admins; Catalance PMs are Campus PMs.
- "Campus" appears in the navbar for every Catalance user. Public handles (`/u/:username`) are built from the person's name, never their email.
- The main Catalance app shows Campus-verified skills on freelancer profiles and in the client/PM profile dialog, a Campus card on the
  freelancer dashboard, and a "Campus Talent" page in the PM workspace (`/project-manager/campus-talent`). Contract: "Main Catalance app link (owner: E)".

| Spec role | Catalance | Campus | Notes |
|---|---|---|---|
| Public visitor | yes | yes | |
| Student | FREELANCER | STUDENT | |
| Instructor | none | MENTOR | Teaches courses; reviews lesson work in Mentor Studio; can score final assessments only for courses they teach, never their own work. |
| Evaluator | none | EVALUATOR | Evaluation queue, claim, score. Can't approve verifications or decide appeals. |
| Client | CLIENT | none | Briefs stay in Catalance (`/service`); Campus "For businesses" links there. |
| Project Manager | PROJECT_MANAGER | PROJECT_MANAGER (synced) | Talent search, offers, delivery review, client acceptance. |
| Finance | none | FINANCE | Payments console, payouts, reports. Granted inside Campus (admin → Students → role). |
| Admin | ADMIN | ADMIN (synced) | Everything; every privileged change is audited. |

## 3. Section-by-section

### §2 Scope and phases
- MVP items built: public website, catalogue, course detail, registration, payment records, student dashboard, lessons,
  assignment submission, assessment workflow, skill verification, PM project opportunity list, admin console, in-app + email notifications.
- Basic client brief intake: Campus "For businesses" sends clients to Catalance's existing brief flow (`/service`). Campus offers carry
  a free-text `catalanceProjectId`; nothing is pushed to the Catalance backend automatically (**Partial**).
- Not in the first release, now behind flags (off): AI tutor (`aiTutor`), XP/coins/streaks/leaderboards (`gamification`), gigs and the
  ladder (`gigs`), wallet (`wallet`). Still on: community Q&A, cohorts, mentor booking, aspirant mode (flags exist, default on).

### §4 Information architecture
- 4.1 public: **Done** (see summary). Legal text for assessment and project policies is default copy marked for legal review,
  editable in admin Settings.
- 4.2 student: **Done**. Availability lives on Profile (`/app/profile#availability`).
- 4.3 staff: **Done** — admin Overview (with funnel strip), Categories & skills, Courses, Assessments & rubrics, Evaluation queue,
  Verifications, Lesson reviews, Verified talent, Project offers, Students, Payments, Payouts, Reports, Support, Audit log, Settings
  (flags, pricing, GST, policy text and versions, FAQs, hero, finance split). Email templates are code (`lib/email.js`), not admin-editable (**Partial**).

### §5 User flows
5.1 student journey:

| Step | Status |
|---|---|
| 1–2 Explore → course detail | Done, with fee + GST, duration, outcome, who it's for, assessment panel and the no-guarantee note. |
| 3 Enrol → sign up/login | Done (Catalance account); course intent kept through sign-in via `?next=`. |
| 4 Accept terms | Done: Terms, Privacy and Refund consents recorded (timestamp, policy version, context, IP) at checkout and onboarding. |
| 5–6 Checkout, payment, receipt | Done: Razorpay or offline; receipt `CC-<year>-000123`. Free courses enrol directly; paid courses without a paid order return 402. |
| 7–9 Dashboard, lessons, final submission | Done. Submission takes text, links and file *references* (type and 25 MB size checked); there is no file storage yet. Each submit is a version. |
| 10–11 Evaluation, pass/reassess | Done (rubric scoring, pass mark, critical criteria, reassessment window, appeal). |
| 12–13 Verification onboarding, skill badge | Done (portfolio, identity, payout readiness, availability → admin approval → badge). |
| 14–16 Opportunities, delivery, payment | Done inside Campus (PM offers, delivery, finance payout records). Money movement itself is outside Campus. |

5.2 client and 5.3 PM workflows: PMs shortlist Campus-verified students (Campus `/admin/talent`, and the Catalance PM workspace page),
with a required shortlist reason. The client side stays in Catalance; the PM records client acceptance or a dispute on the Campus offer.

### §6 Catalogue
- **Done.** Category → Skill → Course; levels BEGINNER / INTERMEDIATE / ADVANCED / STANDARD; new courses start as DRAFT with
  ₹2,499 / ₹5,000 / ₹10,000 and 10 / 15 / 20 days from `pricing.levelDefaults`; GST shown on cards and checkout;
  statuses draft, published, enrolment open, full, paused, archived. Lists hide DRAFT and ARCHIVED everywhere.
- Seeded demo courses keep their old prices (₹0–₹4,999); reprice them if product wants the defaults on existing courses.

### §7 UX copy
- Hero ("Learn a skill. Prove it. Get verified."), journey and FAQs come from settings; the no-guarantee note is on the
  landing page, course detail, assessments, skills, opportunities and project pages.
- Pay-later, earnings and ranking claims were removed from live pages (landing, how it works, pricing, about, colleges, aspirants,
  tracks, sign-in panel, locked lessons). They remain only on pages behind flags that are off (gigs, ladder, wallet, gig applications).

### §8 Assessment and verification
- **Done.** Rubric versions are kept per attempt; publishing a new version moves the assessment but started attempts keep theirs.
  Course certificates are separate from skill badges and show the passed assessment's score, never a default.
- Reassessment reminders are sent when the student opens their assessments; there is no scheduler (**Partial**).

### §9 Projects and payment
- **Done.** The student sees the exact payout, deliverables, deadline, revisions and terms before accepting; never the client price,
  split or platform share. Finance records client price, split basis, share %, platform share snapshot, taxes, adjustments, payout status
  and reference. Paid payouts are locked.
- §9.4: course fees are 100% advance. The Campus wallet still exists behind the `wallet` flag (off) and needs legal review before it is ever switched on.

### §10 Data model
All spec entities exist in `api/prisma/schema.prisma` under "spec v1.0": Category, Skill, Rubric, Assessment, AssessmentAttempt,
SkillVerification, CourseOrder, WebhookEvent, ConsentRecord, ProjectOffer, SupportTicket, AuditLog, PlatformSetting. Course-level
price and duration are per-course fields with per-level defaults in settings. **No migration has been generated or applied yet.**

### §11 Admin configuration
**Done:** categories, skills, levels, fees, GST, durations, capacity, enrolment dates, prerequisites, course status; rubrics and
assessment config per course; evaluator assignment; verification approve / revoke / reinstate with reason; feature flags; FAQs,
policies and home hero; finance split defaults; audit log with CSV export; reports with CSV export; support queue.
**Missing:** editable email templates.

### §12 Notifications
**Done** for in-app on every §12 trigger in each domain. Email is sent from `notify()` for §12 events when `RESEND_API_KEY` is set
(placeholder and `@campus.dev` addresses are skipped). Most callers rely on link-based inference rather than passing `event:` explicitly.

### §13 Matching and fairness
- **Done:** talent search shows only ACTIVE, unexpired verifications and excludes suspended users; ordering is rule-based
  (open to projects → fewer active projects → fewer recent offers → oldest last offer → name), never by fees; declines are not counted;
  shortlist reasons are required and stored.
- Public leaderboards are off (gamification flag). The public passport hides rank, points, badges, gigs and earnings while their flags
  are off, and its "Verified skills" come only from ACTIVE skill verifications. `GET /api/colleges/:id` still returns rank fields
  (onboarding uses it); the web only links to the college page while gamification is on (**Partial**).

### §14 UX states
Key screens have loading, empty, error, success, permission-denied and expired states (per each domain's report). **Not visually checked**:
no screenshots were taken in light/dark or at 375 px.

### §15 Security
- **Done:** API role checks; other users' attempts, orders, offers and tickets return 404; staff notes hidden from students; talent rows
  carry no email/phone; audit log for admin, assessment, verification, payment, project and settings changes; rate limits on checkout,
  payment verify, offline reference, submit, appeal, offer responses, support, consents, withdrawals and auth; Razorpay signatures
  checked with constant-time compare; webhooks idempotent.
- **Open:** rate limits use an in-memory store (per serverless instance); no file storage, so no private expiring links; no account-deletion
  script or audit retention purge (described in `docs/OPERATIONS.md`); admin gig APIs are admin-only but not flag-gated.

### §16 Analytics
**Partial.** Funnel (signup → paid → submitted → passed → verified → first project) and the north-star metric are on Overview and
Reports. `track()` exists with an event dictionary, but only report exports call it. Visits, course views, lead source, CAC and real
payment-gateway fees (2% estimate) are not available.

### §17 MVP acceptance criteria
| Criterion | Status |
|---|---|
| Admin creates skill, course, level, fee, duration, syllabus, cohort and publishes | Done |
| Visitor finds course, reads fee/terms, registers, pays, gets access | Done (offline path smoke-tested; Razorpay path tested with a stub only) |
| Student completes lessons and submits in allowed formats | Done for text and links; files are references only (no upload storage) |
| Evaluator reviews with versioned rubric | Done |
| Failed student gets feedback + reassessment route | Done |
| Passing student gets only the correct skill verification | Done (skill and level come from the course; one badge per skill + level) |
| Admin/PM creates brief, scopes project, finds verified candidates | Done in Campus; client briefs stay in Catalance |
| Student sees deliverables, deadline, terms, payout before accepting | Done |
| PM tracks progress, revisions, acceptance | Done |
| Finance records price, split, payout, taxes, status | Done |
| Users can't access other users' private data via URLs/IDs | Done for the spec routes (smoke-tested); demo-engine peer shapes in older community/earn handlers still differ from the API |
| Admin exports reports, audits financial/verification changes | Done |
| Mobile flows work | Built mobile-first; **not visually verified** |
| Payment success/failure/duplicate webhook/refund tested | Done offline (stubbed Prisma + stubbed Razorpay); **not run against Razorpay test mode** |
| No-guarantee disclosures visible | Done |

## 4. Decisions (spec §19)

The build uses the spec's recommended defaults. Each is a setting or flag, so changing it needs no code change.

| # | Decision | What the build does | Status |
|---|---|---|---|
| 1 | Pay-later and the wallet | Removed from enrolment; 100% advance (`payments.advancePercent`). Wallet behind the `wallet` flag, off. | Needs sign-off |
| 2 | Campus gigs | Behind the `gigs` flag, off. Real work goes through PM project offers. | Needs sign-off |
| 3 | AI tutor, XP, leaderboards | Behind `aiTutor` and `gamification`, off. | Needs sign-off |
| 4 | Pass mark and reassessment | 70/100 plus every critical criterion at half marks or more; 2 attempts; 14-day window. Per-course override in admin. | Needs sign-off |
| 5 | 50/50 split base | 50% of client price excluding tax (`finance.splitBasis`, `finance.freelancerSharePercent`); snapshotted per offer. | **Finance must decide** |
| 6 | Launch courses | Skills published: UI/UX Design, Short-Form Video Editing, Frontend Development. The other 23 are drafts. | Needs sign-off |

Also needing business or legal input: policy and FAQ text (marked for legal review), the "reply within 2 working days" support promise,
the 7-day refund rule, and a GST tax invoice (receipts currently say "not a tax invoice" because no GSTIN is configured).

## 5. Still to do before launch

1. **Database:** generate and apply the migration for the spec v1.0 tables, then `npm run export-seed && npm run seed` on a dev database.
   The seed mapping passes `npm run seed:check` offline but has not been run against Postgres. Also run the main backend's
   `/api/campus/*` SQL once against a database that has the `campus` schema.
2. **Razorpay test mode:** a real checkout with test keys, the webhook pointed at `/api/webhooks/razorpay`, a failure and a refund.
3. **Visual QA:** every new page in light and dark mode and at 375 px (none was screenshotted).
4. **File uploads:** storage with type/size checks and private expiring links (§15); today submissions take links and file references.
5. **Schedulers:** offer expiry, milestone reminders and reassessment reminders run lazily on read; add a cron job
   (`sendReassessReminders()` in `services/assessment.js`, `sweepOffers()` in `services/projects.js`).
6. **Shared rate-limit store** for serverless (the in-memory store is per instance).
7. **Email:** set `RESEND_API_KEY`, `CAMPUS_EMAIL_FROM`, `CAMPUS_WEB_URL`; pass explicit `event:` to `notify()` where inference is weak.
8. **Remaining gaps:** editable email templates; college rankings and passport rank fields not behind `gamification`; admin gig APIs not
   flag-gated; account deletion and audit retention jobs; web analytics sink for visits/views/CAC; a pushed link from Campus offers to
   Catalance projects (today a free-text `catalanceProjectId`). (The refund race between two finance users is fixed: a refund is
   claimed on the order before Razorpay is called.)
9. **Tests:** `npm run smoke:spec` (59 checks) is the only test committed in `api/`; the per-domain scratch tests and the demo-engine
   tests were not added to the repo. `docs/QA_CHECKLIST.md` is the manual plan.
