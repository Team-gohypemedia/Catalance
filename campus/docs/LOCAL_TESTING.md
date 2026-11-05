# Testing Campus end to end (local, real database)

The `campus` schema is created in the shared Neon database and loaded with demo content (5 categories, 26 skills,
24 courses, assessments, badges, orders and project offers). Catalance's own tables in `public` are never written.

## 1. Start the four apps

One command from the repo root starts all four in one terminal (each line is labelled with its app; Ctrl+C stops all):

```bash
npm run dev:all                          # backend + Catalance web + Campus API + Campus web
npm run dev:all -- campus-api campus-web # only some of them
```

Or run them separately:

| Terminal | Folder | Command | URL |
|---|---|---|---|
| 1 | `backend` | `npm run dev` | http://localhost:5000 |
| 2 | repo root | `npm run dev` | http://localhost:5173 (Catalance) |
| 3 | `campus/api` | `npm run dev` | http://localhost:5100 (check `/api/health`) |
| 4 | `campus/web` | `npm run dev` | http://localhost:5180 (Campus) |

Env files are already in place: `campus/api/.env` (copied from `backend/.env`) and `campus/web/.env.local`.

## 2. One account for both (the main thing to check)

1. Open http://localhost:5173 and sign in with your real Catalance account.
2. Click **Campus** in the navbar → you land in Campus signed in, without registering.
   First visit creates your Campus profile; you get the student onboarding (terms + privacy consent is required).
3. Log out of Campus, click **Log in** on Campus → you go to Catalance and straight back (already signed in there).
4. Try a brand-new phone number on Campus → **Sign up**: Catalance signs you up with "Freelancer" preselected,
   then returns you to Campus.

If your Catalance account is an **ADMIN**, it is a Campus admin automatically (`/admin`). A Catalance
**PROJECT_MANAGER** becomes a Campus PM (`/admin/talent`). Other roles: as admin open **Students** → a person →
**Make evaluator / Make PM / Make finance**.

## 3. Student journey (spec §5.1) with your own account

| Step | Where | What to see |
|---|---|---|
| Explore | `/app/catalog` | Filters: category, skill, level, duration, price, open enrolment |
| Course | a paid course | Fee + 18% GST, outcomes, who it's for, assessment, "what verification means", no-guarantee note |
| Pay | **Enrol** | Consent boxes (terms, privacy, refund) → Razorpay test checkout **or** offline reference |
| | Razorpay test card | `4111 1111 1111 1111`, any future date, any CVV, OTP from the test page |
| Learn | lesson player | Lessons, assignments |
| Assess | `/app/assessments/<course>` | Brief, save draft, submit (locks), history |
| Result | after an evaluator scores | Per-criterion scores, feedback; below 70 → reassessment with countdown |
| Verify | after pass | Verification onboarding form → admin approves → badge on `/app/skills` + public `/verify/skill/<code>` |
| Work | `/app/opportunities` | Offers show the exact payout before Accept / Decline |
| Help | `/app/help` | Create a ticket; staff replies appear there |

## 4. Staff (use a second browser / private window per role)

| Role | Pages | Try |
|---|---|---|
| Admin | Categories & skills, Courses, Assessments & rubrics, Verifications, Settings, Audit log | Publish a skill; edit a rubric (creates v2, old results keep v1); approve / revoke a badge (reason required); switch a feature flag in Settings; see every change in **Audit log** |
| Evaluator | Evaluation queue | Claim → score with the rubric → live pass/fail preview → submit; a failed critical criterion fails even with a high total |
| PM | Verified talent, Project offers | Filter by skill/level → Create offer (shortlist reason required) → student accepts → review delivery → client acceptance |
| Finance | Course payments, Project finance, Reports | Verify an offline payment (student gets enrolled); partial refund (order stays paid) then refund the rest (access ends); set client price / split / payout |

In the **Catalance** app: your freelancer profile and dashboard show **Campus-verified skills** once you hold a badge;
PMs see a **Campus talent** view.

## 5. Demo mode (no backend, fake data)

Leave `VITE_CAMPUS_API_URL` empty in `campus/web/.env.local` and restart Campus web. Log in with the demo chips
(password `campus123`): student, mentor, admin, aspirant, evaluator, pm, finance. Everything is seeded so each role
has something to do. Data lives in your browser; **Settings → Reset demo data** restores it.

## 6. Automated checks

```bash
cd campus/api && npm run smoke:spec     # 60+ spec rules over HTTP, in-memory database, no network
cd campus/web && npx vite build         # Campus web builds
```

## 7. Not testable yet / needs setup

- **Razorpay webhooks**: create a webhook in the Razorpay dashboard (test mode) pointing at
  `<public campus-api URL>/api/webhooks/razorpay` with events `payment.captured`, `payment.failed`, `refund.processed`,
  and put its secret in `RAZORPAY_WEBHOOK_SECRET`. Locally you need a tunnel (e.g. `ngrok http 5100`).
  Checkout still works locally without it: payment is confirmed by the browser callback.
- **Emails** (Resend): sent from `CAMPUS_EMAIL_FROM`; the domain must be verified in Resend (catalance.in already is
  for the main app).
- **Removing the demo people** from the live database before launch: `cd campus/api && npm run demo:remove-people`
  (dry run, shows counts) then `npm run demo:remove-people -- --yes`. It deletes only the fake `@campus.dev` people and
  their data; courses, skills, rubrics, settings and every real Catalance-linked profile stay. Until then the fake
  people can't log in through the real API, but they do appear in PM talent search and reports.
