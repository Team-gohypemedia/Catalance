# Catalance Campus — API Contract (single source of truth)

Campus is part of Catalance and uses **Catalance accounts** (no separate sign-up). Its data lives in its own `campus` schema.
Both the frontend demo engine (`web/src/mocks`) and the real backend (`api/`) implement **exactly** these routes and shapes.

## Conventions
- Base path: `/api`. JSON in, JSON out. IDs are strings. Dates are ISO strings. Money is whole rupees (`…INR` fields, integers).
- Auth: `Authorization: Bearer <token>`, where the token is the user's Catalance access token (handed to Campus at `/sso`). The demo engine issues its own demo tokens. Routes marked 🔒 need a logged-in user; 🛡 needs `role === "ADMIN"`; 🎓 needs `role === "MENTOR"` (admins also allowed).
- Errors: HTTP status + `{ "error": { "message": "…" } }`.
- Lists return plain arrays unless noted. Query params are optional filters.
- `PublicUser` never includes password fields.

## Core entities

```ts
User {
  id, email, name, username, avatarUrl|null, role: "STUDENT"|"MENTOR"|"ADMIN",
  headline|null, bio|null, phone|null, city|null, state|null,
  collegeId|null, college: { id, name, shortName, city }|null,
  year: 1|2|3|4|5|null, stream|null,                 // e.g. "B.Tech CSE", "B.Com", "BA English"
  goal: "FIRST_INCOME"|"JOB"|"FREELANCE_CAREER"|"SKILL_UP"|"GOVT_EXAM_BACKUP"|null,
  aspirant: null | Aspirant,                          // set when the student is preparing for a government exam
  language: "en"|"hinglish"|"hi"|"ta"|"te"|"bn"|"mr",
  interests: string[],                               // track slugs
  skillLevel: "NEW"|"SOME"|"CONFIDENT"|null,
  skills: string[],
  links: { github?, linkedin?, portfolio?, behance? },
  onboarded: boolean,
  xp, coins, streak, longestStreak,                   // engagement
  seasonPoints, lifetimePoints,
  division: "BRONZE"|"SILVER"|"GOLD"|"PLATINUM"|"DIAMOND",
  ladderStage: 1..5,                                  // 1 LEARN,2 PRACTICE,3 MICRO_GIG,4 REAL_PROJECT,5 HIRED
  walletBalanceINR, lifetimeEarnedINR,
  notificationPrefs: { email: bool, whatsapp: bool, push: bool },
  mentorProfile: null | {                             // only for MENTOR
    headline, expertise: string[], company, rating, reviewsCount, sessionsCount,
    priceINR, languages: string[], yearsExperience, availability: [{ day: "MON".."SUN", slots: ["10:00","18:30"] }]
  },
  createdAt
}

// Government-exam aspirant profile ("Aspirant mode"). Prep years are framed as a strength, never as a gap.
Aspirant {
  exam: "UPSC"|"SSC"|"BANKING"|"RAILWAYS"|"STATE_PSC"|"TEACHING"|"DEFENCE"|"OTHER",
  examName,                       // free text, e.g. "SSC CGL", "IBPS PO", "UPPSC", "RRB NTPC"
  prepYears,                      // 0..8
  dailyMinutes: 30|45|60|90,      // time budget for Campus alongside prep
  attemptsUsed,                   // 0..10
  birthYear|null,                 // used only for the private age-limit planner, never shown publicly
  strengths: string[],            // exam subjects: "Quant","Data Interpretation","Reasoning","English","Hindi","GK & Current Affairs","Polity","Economy","Banking Awareness","Essay Writing","Accounts"
  studyHoursTotal,                // self-reported, for the Preparation record
  mockTestsTaken,
  bestMockPercentile|null,        // 0..100
  showOnPassport: boolean         // public Preparation record on /u/:username
}

College { id, name, shortName, city, state, type: "ENGINEERING"|"ARTS_SCIENCE"|"COMMERCE"|"DESIGN"|"MANAGEMENT"|"POLYTECHNIC",
          studentsCount, totalPoints, avgPoints, rank, rankChange, topSkill, verified, createdAt }

Track { id, slug, title, tagline, category: "TECH"|"NON_TECH", icon /* lucide icon name */, color /* hex */,
        level, durationWeeks, coursesCount, studentsCount, outcomes: string[], careers: [{ title, avgPayINR }], courseIds: string[],
        forAspirants: boolean,          // "bridge" track built on government-exam preparation
        bridgeFrom: string[] }          // exam subjects it builds on (same vocabulary as Aspirant.strengths)

Course { id, slug, trackId, track: { id, slug, title, color }, title, subtitle, description,
         level: "BEGINNER"|"INTERMEDIATE"|"ADVANCED", languages: string[],
         cover: { from, to, pattern: "dots"|"grid"|"waves"|"rings" },   // rendered as CSS gradient art, no images needed
         mentorId, mentor: { id, name, avatarUrl, headline },
         durationMinutes, lessonsCount, rating, ratingsCount, studentsCount,
         skills: string[], whatYouBuild: string[], requirements: string[],
         priceINR, payLater: boolean, isFree: boolean,
         modules: [{ id, title, order, lessons: LessonSummary[] }],     // included on detail endpoint
         enrollment: Enrollment|null }                                  // included when 🔒 user known

LessonSummary { id, title, type: "VIDEO"|"ARTICLE"|"QUIZ"|"ASSIGNMENT", durationMinutes, order, isPreview, completed? }
Lesson = LessonSummary & { courseId, moduleId, content /* markdown */, videoUrl|null,
         quiz: { questions: [{ id, prompt, options: [{ id, text }], correctOptionId, explanation }] }|null,
         assignment: { brief /* markdown */, rubric: [{ criterion, points }], submissionType: "LINK"|"TEXT" }|null,
         prevLessonId|null, nextLessonId|null }

Enrollment { id, userId, courseId, progressPercent, completedLessonIds: string[], lastLessonId|null, startedAt, completedAt|null }
Submission { id, userId, user?: PublicUser, courseId, lessonId, lessonTitle, text|null, link|null,
             status: "SUBMITTED"|"REVIEWED", score|null, maxScore, feedback|null, reviewedById|null, createdAt, reviewedAt|null }
Certificate { id, userId, courseId, courseTitle, trackTitle, mentorName, score, verifyCode, issuedAt }

Gig { id, title, company: { name, logoColor }, category, skills: string[], payoutINR, durationDays,
      difficulty: "EASY"|"MEDIUM"|"HARD", minStage: 3|4, status: "OPEN"|"CLOSED", applicantsCount, spots,
      deadline, description /* markdown */, deliverables: string[], mentorId, mentor?: {id,name,avatarUrl}, createdAt,
      myApplication?: GigApplication|null }
GigApplication { id, gigId, gig?: Gig, userId, user?: PublicUser,
      status: "APPLIED"|"ACCEPTED"|"SUBMITTED"|"APPROVED"|"REJECTED"|"PAID", pitch, submissionLink|null, submissionNote|null,
      feedback|null, createdAt, updatedAt }
WalletTxn { id, userId, type: "GIG_EARNING"|"BONUS"|"WITHDRAWAL"|"COURSE_FEE_DEDUCTION", amountINR /* signed */, note, status: "COMPLETED"|"PENDING", createdAt }
PointsEvent { id, userId, source: "LESSON"|"QUIZ"|"ASSIGNMENT"|"GIG"|"HELP"|"STREAK"|"BONUS", points, note, createdAt }
PortfolioItem { id, userId, title, description, link|null, cover: { from, to }, skills: string[], verified: boolean,
      source: "ASSIGNMENT"|"GIG"|"PERSONAL", createdAt }
Badge { id, key, title, description, icon, earnedAt }

Thread { id, authorId, author: PublicUser(min), title, body /* markdown */, tags: string[], trackId|null,
         upvotes, hasUpvoted, repliesCount, solved, acceptedReplyId|null, createdAt, lastActivityAt }
Reply  { id, threadId, authorId, author, body, upvotes, hasUpvoted, isAccepted, createdAt }
Booking { id, mentorId, mentor?: {id,name,avatarUrl,headline}, userId, user?: PublicUser, date /* YYYY-MM-DD */, time /* HH:mm */,
          topic, note|null, status: "UPCOMING"|"COMPLETED"|"CANCELLED", meetLink, createdAt }
Cohort { id, title, trackId, track?: {title,color}, leadMentorId, leadMentor?: {id,name,avatarUrl}, description,
         startDate, schedule /* "Tue & Thu, 8pm" */, membersCount, maxMembers, isMember, members?: PublicUser[], createdAt }
Notification { id, userId, type: "COURSE"|"GIG"|"COMMUNITY"|"MENTOR"|"RANK"|"SYSTEM", title, body, link|null, read, createdAt }
```

## Routes

### Auth & me (owner: foundation)
| Method | Path | Body / Query | Returns |
|---|---|---|---|
| POST | /api/auth/signup | `{ name, email, password }` | `{ user, token }` (demo engine only; real API: `410`, sign up on Catalance) |
| POST | /api/auth/login | `{ email, password }` | `{ user, token }` (demo engine only; real API: `410`, sign in on Catalance) |
| GET 🔒 | /api/auth/me | | `{ user }` (real API: creates the Campus profile on a Catalance user's first visit) |
| POST | /api/auth/forgot-password | `{ email }` | `{ ok: true }` (demo engine only; real API: `410`) |
| PATCH 🔒 | /api/me | any editable User profile fields | `{ user }` |
| POST 🔒 | /api/me/onboarding | `{ collegeId? , newCollege?: {name,city,state,type}, year, stream, goal, language, interests, skillLevel, aspirant? }` | `{ user }` (sets `onboarded: true`; `aspirant` saved only when goal is GOVT_EXAM_BACKUP, else null. Aspirants may skip college: graduates often have none) |
| POST 🔒 | /api/me/password | `{ currentPassword, newPassword }` | `{ ok: true }` (demo engine only; real API: `410`) |
| GET | /api/colleges/search | `?q=` | `College[]` (max 10) |

### Public / marketing (owner: learning + earn)
| GET | /api/public/stats | | `{ students, colleges, mentors, paidOutINR, gigsCompleted, avgFirstEarningDays }` |
| GET | /api/tracks | `?category=TECH|NON_TECH&audience=aspirants` | `Track[]` (`audience=aspirants` → only `forAspirants` tracks) |
| GET | /api/tracks/:slug | | `Track & { courses: Course[] }` |

### Learning (owner: learning)
| GET | /api/courses | `?track=slug&level=&q=&language=&sort=popular|rating|new` | `Course[]` (no modules) |
| GET | /api/courses/:id | id or slug | `Course` with modules + enrollment |
| POST 🔒 | /api/courses/:id/enroll | | `Enrollment` |
| GET 🔒 | /api/me/enrollments | | `(Enrollment & { course: Course })[]` |
| GET 🔒 | /api/lessons/:id | | `Lesson` (403 if not enrolled and not isPreview) |
| POST 🔒 | /api/lessons/:id/complete | | `{ enrollment, pointsAwarded, certificate|null }` |
| POST 🔒 | /api/lessons/:id/quiz | `{ answers: { [questionId]: optionId } }` | `{ score, total, passed, results: [{questionId, correct, correctOptionId}], pointsAwarded }` |
| POST 🔒 | /api/lessons/:id/submit | `{ text?, link? }` | `Submission` |
| GET 🔒 | /api/me/submissions | | `Submission[]` |
| GET 🔒 | /api/me/certificates | | `Certificate[]` |
| GET | /api/certificates/verify/:code | | `Certificate & { userName }` |
| GET 🔒 | /api/me/dashboard | | `{ user, continueLearning: (Enrollment&{course, nextLesson})[], todayGoal: { targetMinutes, doneMinutes }, weeklyActivity: [{ day, minutes, points }] /*7*/, recommended: Course[], upcomingSessions: Booking[], openGigsForYou: Gig[], rank: { position, collegePosition, division, seasonPoints, nextDivisionAt }, aspirantPlan: null | { examName, prepYears, dailyMinutes, todayDoneMinutes, weekDoneMinutes, bridgeTracks: Track[], nextLesson: { courseId, courseTitle, lessonId, lessonTitle, durationMinutes }|null, skillsFromPrep: [{ subject, skill, trackSlug }] } }` (`aspirantPlan` only when `user.aspirant` is set) |
| POST 🔒 | /api/tutor/chat | `{ messages: [{role:"user"|"assistant", content}], language, context?: { courseId?, lessonId? } }` | `{ reply }` |

### Earn & rank (owner: earn)
| GET 🔒 | /api/ladder | | `{ currentStage, stages: [{ stage, key: "LEARN"|"PRACTICE"|"MICRO_GIG"|"REAL_PROJECT"|"HIRED", title, description, reward, requirements: [{ label, current, target, done }], unlocked, completed }] }` |
| GET 🔒 | /api/gigs | `?category=&q=&difficulty=&eligible=true` | `Gig[]` |
| GET 🔒 | /api/gigs/:id | | `Gig` with myApplication |
| POST 🔒 | /api/gigs/:id/apply | `{ pitch }` | `GigApplication` (400 if user.ladderStage < gig.minStage) |
| POST 🔒 | /api/gig-applications/:id/submit | `{ submissionLink, submissionNote }` | `GigApplication` |
| GET 🔒 | /api/me/gig-applications | | `(GigApplication & { gig })[]` |
| GET 🔒 | /api/wallet | | `{ balanceINR, lifetimeEarnedINR, pendingINR, payLater: { totalFeesINR, deductedINR, remainingINR, deductionPercent }, transactions: WalletTxn[] }` |
| POST 🔒 | /api/wallet/withdraw | `{ amountINR, upiId }` | `WalletTxn` (min ₹100) |
| GET | /api/leaderboard | `?scope=students|colleges&period=season|all&track=&city=&collegeId=` | `{ season: { id, name, number, startsAt, endsAt }, items: [{ rank, change, points, division?, user?: PublicUser, college?: College }], me?: { rank, points, division } }` (top 100) |
| GET | /api/colleges/:id | | `College & { topStudents: PublicUser[], skillsBreakdown: [{ skill, count }], monthlyPoints: [{ month, points }] }` |
| GET 🔒 | /api/me/points | | `PointsEvent[]` |
| GET 🔒 | /api/me/portfolio | | `PortfolioItem[]` |
| POST 🔒 | /api/me/portfolio | `{ title, description, link, skills }` | `PortfolioItem` (source PERSONAL, verified false) |
| PATCH 🔒 | /api/me/portfolio/:id | | `PortfolioItem` |
| DELETE 🔒 | /api/me/portfolio/:id | | `{ ok: true }` |
| GET | /api/u/:username | | `{ user: PublicUser, college, stats: { coursesCompleted, gigsCompleted, earnedINR, seasonRank, helpfulAnswers }, portfolio: PortfolioItem[], certificates: Certificate[], badges: Badge[], verifications: [{ skill: { slug, name }, level, awardedAt, expiresAt, verifyCode }] /* ACTIVE, unexpired */, skills: [{ name, level: 1..5, verified /* only from an ACTIVE skill verification */ }], preparationRecord: null | { examName, prepYears, studyHoursTotal, mockTestsTaken, bestMockPercentile, strengths, traits: string[] /* e.g. "Discipline", "Self-study", "Analytical reading" */, bridgeCourses: number } }` (`gigsCompleted` / `earnedINR` / `seasonRank` are null and `badges` is [] while the gigs / wallet / gamification flags are off; `preparationRecord` only when `aspirant.showOnPassport`; `user.aspirant` itself is never public: no birthYear or attempts) |

### Community & mentors (owner: community)
| GET 🔒 | /api/threads | `?tag=&track=&q=&filter=all|unanswered|solved|mine&sort=new|top` | `Thread[]` |
| POST 🔒 | /api/threads | `{ title, body, tags, trackId? }` | `Thread` |
| GET 🔒 | /api/threads/:id | | `Thread & { replies: Reply[] }` |
| POST 🔒 | /api/threads/:id/replies | `{ body }` | `Reply` |
| POST 🔒 | /api/threads/:id/upvote | | `{ upvotes, hasUpvoted }` (toggle) |
| POST 🔒 | /api/replies/:id/upvote | | `{ upvotes, hasUpvoted }` |
| POST 🔒 | /api/replies/:id/accept | | `Reply` (thread author only; awards HELP points to reply author) |
| GET 🔒 | /api/mentors | `?q=&expertise=&language=&free=true` | `PublicUser[]` with mentorProfile |
| GET 🔒 | /api/mentors/:id | | `PublicUser & { reviews: [{ id, userName, rating, comment, createdAt }], courses: Course[], openSlots: [{ date, times: string[] }] /* next 14 days */ }` |
| POST 🔒 | /api/mentors/:id/book | `{ date, time, topic, note }` | `Booking` |
| GET 🔒 | /api/me/bookings | | `Booking[]` (as student; as mentor also those where mentorId = me) |
| POST 🔒 | /api/bookings/:id/cancel | | `Booking` |
| GET 🔒 | /api/cohorts | | `Cohort[]` |
| GET 🔒 | /api/cohorts/:id | | `Cohort & { members, schedule, posts: [{ id, author, body, createdAt }] }` |
| POST 🔒 | /api/cohorts/:id/join | | `Cohort` |
| POST 🔒 | /api/cohorts/:id/leave | | `Cohort` |
| POST 🔒 | /api/cohorts/:id/posts | `{ body }` | post |
| GET 🔒 | /api/notifications | | `Notification[]` |
| POST 🔒 | /api/notifications/read-all | | `{ ok: true }` |
| POST 🔒 | /api/notifications/:id/read | | `Notification` |
| GET 🎓 | /api/mentor/overview | | `{ upcomingSessions: Booking[], pendingSubmissions: Submission[], earningsINR, rating, studentsHelped, weekly: [{ day, sessions }] }` |
| POST 🎓 | /api/mentor/submissions/:id/review | `{ score, feedback }` | `Submission` (also adds verified PortfolioItem for the student) |

### Admin (owner: admin)
| GET 🛡 | /api/admin/overview | | `{ kpis: { students, activeThisWeek, enrollments, completionRate, paidOutINR, openGigs, pendingSubmissions, pendingColleges }, signupsByDay: [{date,count}] /*30*/, topTracks: [{ title, students }], recentActivity: [{ id, type, text, createdAt }] }` |
| GET 🛡 | /api/admin/courses | | `Course[]` |
| POST 🛡 | /api/admin/courses | Course fields | `Course` |
| GET 🛡 | /api/admin/courses/:id | | `Course` with modules + full lessons |
| PUT 🛡 | /api/admin/courses/:id | full course incl. `modules[].lessons[]` | `Course` |
| DELETE 🛡 | /api/admin/courses/:id | | `{ ok: true }`. 409 when the course has enrolments, non-cancelled orders or assessment attempts (archive it instead) |
| GET 🛡 | /api/admin/tracks | | `Track[]` | 
| GET 🛡 | /api/admin/gigs | | `Gig[]` |
| POST 🛡 | /api/admin/gigs | Gig fields | `Gig` |
| PUT 🛡 | /api/admin/gigs/:id | | `Gig` |
| GET 🛡 | /api/admin/gig-applications | `?status=` | `GigApplication[]` (with gig + user) |
| POST 🛡 | /api/admin/gig-applications/:id/status | `{ status, feedback? }` | `GigApplication` (PAID → credits wallet with GIG_EARNING, minus pay-later deduction) |
| GET 🛡 | /api/admin/students | `?q=&collegeId=&stage=` | `PublicUser[]` |
| PATCH 🛡 | /api/admin/users/:id | `{ role?, status? }` | `PublicUser` |
| GET 🛡 | /api/admin/colleges | `?verified=` | `College[]` |
| PATCH 🛡 | /api/admin/colleges/:id | `{ verified, name?, city? }` | `College` |
| GET 🛡 | /api/admin/submissions | `?status=` | `Submission[]` |
| GET 🛡 | /api/admin/mentors | | `PublicUser[]` |

## Spec v1.0 (Developer Product Specification, 27 Oct 2026)

Implements the MVP of the spec (see `SPEC_ALIGNMENT.md`). Schema: the models below "spec v1.0" in `api/prisma/schema.prisma`.
Every route exists in **both** the real API (`api/src/routes/<file>.js`) and the demo engine (`web/src/mocks/handlers/<file>.js`).
Roles: `STUDENT | MENTOR (instructor) | EVALUATOR | PROJECT_MANAGER | FINANCE | ADMIN`. 🛡 = ADMIN, 🧑‍⚖️ = ADMIN|EVALUATOR|MENTOR (mentor only for courses they teach),
🧭 = ADMIN|PROJECT_MANAGER, 💰 = ADMIN|FINANCE. Privileged writes call `audit()` (`api/src/lib/audit.js`).
Settings/flags: `api/src/lib/settings.js` (`getSettings`, `getFlags`, `requireFlag`); web: `usePlatformConfig()` in `web/src/lib/platform.js`.
Decisions taken from the spec's recommended defaults (§19): 100% advance payment; pass 70/100 + all critical criteria; 2 attempts
(1 included reassessment) within 14 days; verification has no expiry unless set; 50% freelancer share of client price ex-tax (configurable,
never public); AI tutor, gamification, gigs and wallet are behind flags, off by default.

### Platform & support (owner: F1) — `platform.js`, `support.js`
| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET | /api/platform/config | | `{ flags, pricing: { gstPercent, levelDefaults }, assessment: { passScore, maxAttempts, reassessWindowDays }, content: { noGuarantee, hero, faqs: [{q,a}] }, policies: { versions }, support: { email }, payments: { offlineEnabled, offlineInstructions, razorpayKeyId|null } }` (public, no finance keys) |
| GET | /api/platform/policies/:doc | `doc` = terms\|privacy\|refund\|assessment\|project | `{ doc, version, text }` |
| GET 🛡 | /api/admin/settings | | `{ settings: { [key]: value } }` (all keys, incl. finance) |
| PUT 🛡 | /api/admin/settings | `{ [key]: value }` (known keys only) | `{ settings }` — audited `settings.update` |
| GET 🔒 | /api/support/tickets | | `SupportTicket[]` (own) |
| POST 🔒 | /api/support/tickets | `{ category, subject, body, relatedType?, relatedId? }` | `SupportTicket` |
| GET 🔒 | /api/support/tickets/:id | | `SupportTicket` (owner or staff; internal messages hidden from owner) |
| POST 🔒 | /api/support/tickets/:id/messages | `{ body, internal? }` | `SupportTicket` |
| GET (staff) | /api/admin/support/tickets | `?status&category` | `SupportTicket[]` (ADMIN, PM, FINANCE) |
| PATCH (staff) | /api/admin/support/tickets/:id | `{ status?, priority?, ownerId?, resolution? }` | `SupportTicket` — audited |
| GET 🔒 | /api/me/dashboard | | existing shape **plus** `nextAction: { kind, title, body, cta, to }` — ONE next step (spec §4.2/§5.1 step 7), `courseProgress: [{ courseId, courseTitle, progressPercent, lessonsLeft }]`, `assessments: [{ course: {id,title}, status, attemptNo, totalScore, reassessUntil }]`, `verifiedSkills: [{ id, skill, level, status, awardedAt, expiresAt, verifyCode }]`, `openOffers: [{ id, title, expiresAt, payoutINR }]`. Flags: `rank` is `null` unless `flags.gamification`; `openGigsForYou` `[]` unless `flags.gigs`; `upcomingSessions` `[]` unless `flags.mentorBooking`; `aspirantPlan` `null` unless `flags.aspirants`. `nextAction.kind` ∈ VIEW_OFFER · REASSESS · VERIFY · SUBMIT_ASSESSMENT · PAYMENT · CONTINUE_LESSON · START_ASSESSMENT · UNDER_REVIEW · VERIFICATION_PENDING · OPPORTUNITIES · EXPLORE (that priority order) |

`SupportTicket { id, userId, user?, category, subject, body, status, priority, ownerId, relatedType, relatedId, messages: [{id, authorId, authorName, body, internal, at}], resolution, createdAt, updatedAt }`
`category` ∈ GENERAL|PAYMENT|COURSE|ASSESSMENT|PROJECT|COMPLAINT|DISPUTE (complaints/disputes start HIGH priority); `relatedType` ∈ ORDER|ATTEMPT|OFFER|COURSE|TICKET
(TICKET = a complaint escalated from another ticket). Students never get `internal` messages, `ownerId` or other users' tickets (404).
A student reply reopens a RESOLVED/CLOSED ticket; RESOLVED needs a `resolution`. Feature flags gate whole route groups with 404
(`requireFlag`, path-scoped in each router; demo: `requireDemoFlag` in `mocks/handlers/platform.js`): aiTutor → /api/tutor, gigs → /api/gigs,
/api/gig-applications, /api/me/gig-applications, /api/ladder; wallet → /api/wallet; gamification → /api/leaderboard; community → /api/threads,
/api/replies, /api/community; mentorBooking → POST /api/mentors/:id/book, /api/me/bookings, /api/bookings (mentor profiles stay readable); cohorts → /api/cohorts.

### Catalogue (owner: C) — `catalog.js` (+ course fields in `courses.js` list/detail and `admin.js` course CRUD)
| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET | /api/categories | | `Category[]` with `skills: Skill[]` (published only; admins see all with `?all=1`) |
| GET | /api/skills/:slug | | `Skill & { category, courses: Course[] }` |
| GET | /api/courses | **new filters** `?category=<slug>&skill=<slug>&level=&maxDays=&minPrice=&maxPrice=&open=1` | `Course[]` |
| GET/POST/PUT/DELETE 🛡 | /api/admin/categories[/:id] | `{ slug, name, order, status }` | `Category` — audited |
| GET/POST/PUT/DELETE 🛡 | /api/admin/skills[/:id] | `{ categoryId, slug, name, description, tags, formats, clientServices, status, order }` | `Skill` — audited |

Course gains: `skillId, skill: {id, slug, name, category: {slug, name}}|null, level` (incl. `STANDARD`), `durationDays, outcome, whoFor, capacity,
enrolmentOpensAt, enrolmentClosesAt, status` (`DRAFT|PUBLISHED|ENROLMENT_OPEN|FULL|PAUSED|ARCHIVED`), `enrolmentOpen: boolean` (derived),
`gstPercent`, `priceWithGstINR` (derived). Public lists hide DRAFT/ARCHIVED. `Skill { id, categoryId, slug, name, description, tags, formats, clientServices, status, order }`.

Catalogue rules (as built; helpers in `api/src/lib/catalog.js`, demo mirror in `web/src/mocks/handlers/catalog.js`):
- `enrolmentOpen` = status `PUBLISHED` (self-paced) or `ENROLMENT_OPEN` (intake), inside `enrolmentOpensAt..enrolmentClosesAt` when set, and
  below `capacity` when set. Capacity counts **enrolment rows** (`_count.enrollments`, now in `COURSE_INCLUDE`), not `studentsCount`.
  `FULL | PAUSED | DRAFT | ARCHIVED` are closed. Use `enrolmentOpen(course)` / `enrolmentClosedReason(course)` before enrolling or checking out.
- Course also returns `seatsLeft: number|null` (derived, null when no capacity). `durationDays` falls back to the level default when unset.
- `GET /api/courses` also accepts `sort=price` (ascending) and still accepts the legacy `track` filter; `open=0` returns closed courses.
- `GET /api/courses/:id`: DRAFT/ARCHIVED → 404 except for ADMIN, the course's mentor, or (ARCHIVED only) an enrolled student.
- `GET /api/categories` (public) omits categories with no published skills, and each skill carries `coursesCount` (listed courses).
- `GET /api/skills/:slug`: 404 unless the skill and its category are PUBLISHED (admins see any). Courses are listed ones only.
- `GET /api/admin/skills?categoryId=`. Category `DELETE` → 400 while it has skills; skill `DELETE` → 400 while it has courses,
  verifications or offers (archive instead). Audit actions: `category.create|update|delete`, `skill.create|update|delete`,
  `course.create|update|status|delete` (before/after snapshot of catalogue + commercial fields).
- `POST /api/admin/courses` starts as `DRAFT` with `priceINR`/`durationDays` from `pricing.levelDefaults` for its level (overridable in the body).

### Payments & consent (owner: B) — `payments.js` (+ `POST /api/courses/:id/enroll` in `courses.js`)
| Method | Path | Body / Query | Returns |
|---|---|---|---|
| POST 🔒 | /api/courses/:id/enroll | | free course → `Enrollment` (201). Paid course without a PAID order → **402** `{ error: { message } }` |
| POST 🔒 | /api/courses/:id/checkout | `{ provider: "RAZORPAY"\|"OFFLINE", consents: ["TERMS","PRIVACY","REFUND"] }` | `{ order: CourseOrder, razorpay?: { keyId, orderId, amount, currency } }` — consents recorded; reuses an open PENDING order |
| POST 🔒 | /api/orders/:id/razorpay/verify | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` | `{ order, enrollment }` (HMAC-verified; idempotent) |
| POST | /api/webhooks/razorpay | raw body + `X-Razorpay-Signature` | `{ ok: true }` — duplicate events are no-ops (`WebhookEvent`) |
| POST 🔒 | /api/orders/:id/offline-reference | `{ reference }` | `CourseOrder` (stays PENDING until verified) |
| GET 🔒 | /api/me/orders | | `CourseOrder[]` with `course: {id,title}` |
| GET 🔒 | /api/orders/:id/receipt | | `{ receiptNo, order, course, user: {name,email}, issuedAt }` (owner or 💰) |
| GET 🔒 | /api/me/consents | | `ConsentRecord[]` |
| POST 🔒 | /api/me/consents | `{ purposes: ConsentPurpose[], context }` | `ConsentRecord[]` (current policy versions) |
| POST 🔒 | /api/me/consents/:purpose/withdraw | | `ConsentRecord` (MARKETING only; others 400) |
| GET 💰 | /api/admin/orders | `?status&provider&q` | `CourseOrder[]` with user + course |
| POST 💰 | /api/admin/orders/:id/verify-offline | `{ note? }` | `{ order, enrollment }` — audited `order.verify_offline` |
| POST 💰 | /api/admin/orders/:id/fail | `{ reason }` | `CourseOrder` — audited |
| POST 💰 | /api/admin/orders/:id/refund | `{ amountINR, reason }` | `CourseOrder` (REFUNDED; Razorpay refund API when provider=RAZORPAY) — audited `order.refund`. 409 while another refund of the same order is in progress |

`CourseOrder { id, userId, courseId, course?, user?, amountINR, gstPercent, gstINR, totalINR, currency, status, provider, offlineReference, receiptNo, paidAt, refundINR, refundReason, refundedAt, failureReason, createdAt }`.
Paid = 100% advance (`payments.advancePercent`). On PAID: enrol + notify "Payment received" (+ receipt link) + orientation notification. On FAILED: notify with retry instructions.
Demo engine: provider `DEMO` succeeds instantly; `OFFLINE` works as in the API (admin verifies). Env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (api).

Implementation notes (B):
- Enrol/checkout share one rule (`assertCanEnrol` in `api/src/services/payments.js`, `enrolmentBlock` in `mocks/handlers/payments.js`): course must be `PUBLISHED|ENROLMENT_OPEN`, inside `enrolmentOpensAt..enrolmentClosesAt` and under `capacity` (counted enrolments) → else **409** with the reason (`DRAFT|ARCHIVED` → 404). A user who already holds a PAID order is let in regardless.
- Checkout errors: 400 (missing consents, free course, provider unavailable), 409 (already enrolled / already paid / enrolment closed / offline payment with a submitted reference is being checked). Switching method cancels an unused PENDING order (`CANCELLED`, hidden from `/api/me/orders`). Demo only: `provider: "DEMO"` returns `{ order, enrollment }`; `simulate: "fail"` returns a FAILED order.
- `CourseOrder.course` = `{ id, slug, title, level }`; admin rows add `user: { id, name, email, username }`. Receipt also returns `issuer: { name, email }, paymentMethod, paymentRef`. Receipt numbers `CC-<year>-<6 digits>`, sequential per year (unique index + retry).
- Webhook: event id = `X-Razorpay-Event-Id` header (fallback sha256 of body); a failed processing removes the `WebhookEvent` row so Razorpay's retry is processed. `payment.captured` with an amount ≠ order total is ignored and audited (`order.amount_mismatch`). `FAILED → PAID` is allowed (Razorpay retry on the same order).
- A **full** refund removes the enrolment (access ends); a partial refund keeps it. `refund.processed` from the Razorpay dashboard is recorded too. Audit actions: `order.paid`, `order.verify_offline`, `order.fail`, `order.refund`.
- Notifications: PAID → student "Payment received" (receipt link `/app/payments?receipt=<orderId>`) + "Start here: <course>" orientation, finance "Course payment received"; FAILED → student retry/help + finance; offline reference → finance "Offline payment to verify"; refund → student.
- Rate limits (per user, 1 min): checkout / verify / offline-reference 10, consents 20.

### Assessment & verification (owner: A) — `assessments.js`
| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET 🔒 | /api/me/assessments | | `[{ course: {id,title,level}, assessment: AssessmentPublic, attempt: Attempt\|null, status: AssessmentStatus }]` for enrolled courses |
| GET 🔒 | /api/courses/:id/assessment | | `{ assessment: AssessmentPublic, attempts: Attempt[], status, canStart, canSubmit, canReassess, canAppeal, reassessUntil }` |
| POST 🔒 | /api/courses/:id/assessment/start | | `Attempt` (IN_PROGRESS; requires enrolment; next attempt only if REASSESSMENT_REQUIRED and within window) |
| PUT 🔒 | /api/attempts/:id/submission | `{ text?, links?: string[], files?: [{key,name,size,type}] }` (draft save; `key` from `/uploads`, never a URL) | `Attempt` |
| POST 🔒 | /api/attempts/:id/uploads | `{ name, type, size }` (owner; attempt IN_PROGRESS; assessment allows `file`) | `{ uploadUrl, method: "PUT", headers: { "Content-Type" }, expiresAt, file: { key, name, size, type } }` (201; presigned PUT, 10 min). 400 type/size, 409 locked or 10 files, 503 storage not configured |
| GET 🔒 | /api/attempts/:id/files/:index | `?redirect=1` → 302 | `{ url, expiresAt, name, size, type }` — presigned GET, 10 min. Owner, assigned/claiming evaluator, course mentor, admin; 404 for everyone else |
| POST 🔒 | /api/attempts/:id/submit | | `Attempt` (SUBMITTED, locked, version+1) |
| POST 🔒 | /api/attempts/:id/appeal | `{ reason }` | `Attempt` (APPEAL_PENDING; only after FAILED/REASSESSMENT_REQUIRED, and only the latest attempt: 409 once a newer one exists) |
| POST 🔒 | /api/attempts/:id/onboarding | `{ portfolioUrl, identityConfirmed: true, payoutReady: boolean, availabilityConfirmed: true }` | `Attempt` (after PASSED; awaits admin approval). Can be sent again to edit (keeps the first `submittedAt`, adds `updatedAt`); admins are notified on the first submission only |
| GET 🔒 | /api/me/skills | | `SkillVerification[]` (own, all statuses) |
| GET | /api/verify/skill/:code | | `{ name, skill, level, status, awardedAt, expiresAt }` (public, no private data) |
| GET 🧑‍⚖️ | /api/evaluations | `?status=SUBMITTED\|UNDER_REVIEW\|APPEAL_PENDING&mine=1` | `Attempt[]` with user(min) + course |
| POST 🧑‍⚖️ | /api/evaluations/:id/claim | | `Attempt` (UNDER_REVIEW, evaluatorId = me) |
| POST 🛡 | /api/evaluations/:id/assign | `{ evaluatorId }` | `Attempt` — audited |
| POST 🧑‍⚖️ | /api/evaluations/:id/result | `{ scores: [{criterionId, score, note}], feedback, evaluatorNotes? }` | `Attempt` → PASSED \| REASSESSMENT_REQUIRED \| FAILED — audited `assessment.result` |
| POST 🛡 | /api/evaluations/:id/appeal-decision | `{ decision: "UPHOLD"\|"OVERTURN", note }` (reviewer ≠ original evaluator) | `Attempt` — audited |
| GET/POST 🛡 | /api/admin/rubrics | `{ key?, name, criteria }` (POST with existing key → new version) | `Rubric[]` / `Rubric` — audited |
| GET/PUT 🛡 | /api/admin/courses/:id/assessment | `{ title, brief, instructions, allowedFormats, rubricId, passScore, maxAttempts, reassessWindowDays, dueDays }` | `Assessment` — audited |
| GET 🛡 | /api/admin/verifications | `?status&skill&pending=1` (`pending=1` → PASSED attempts with onboarding done) | rows |
| POST 🛡 | /api/admin/attempts/:id/verify | `{ note? }` | `SkillVerification` (attempt → VERIFIED) — audited `verification.approve` |
| POST 🛡 | /api/admin/verifications/:id/revoke | `{ reason }` (required) | `SkillVerification` — audited `verification.revoke` |
| POST 🛡 | /api/admin/verifications/:id/reinstate | `{ reason }` | `SkillVerification` — audited |

Scoring: each criterion score 0..maxScore, total = Σ(weight × score/maxScore) normalised to 100. PASSED needs total ≥ passScore **and** every
`critical` criterion at ≥ its maxScore × 0.5 (configurable later). Not passed + attempts left within window → REASSESSMENT_REQUIRED, else FAILED.
Result stores `rubricId` (exact version). Paying or finishing lessons never creates a SkillVerification (spec §1.1). The course `Certificate` is a
**completion** certificate only (rename in UI: "Course certificate"); its score is the passed assessment's total or null, never a default 100.
`SkillVerification { id, userId, user?(min), skill: {id,slug,name}, courseId, level, status, awardedAt, expiresAt, rubricVersion, evidence, verifyCode, revokedReason, history, approvedById }`.

As built (A):
- Additions: `GET 🧑‍⚖️ /api/evaluations/:id` → `Attempt(staff) & { assessment, rules: {passScore,maxAttempts,reassessWindowDays}, previous: Attempt[] }`;
  `GET 🛡 /api/admin/assessments` → `[{ course: {id,title,level,status,skill}, assessment: Assessment & {attemptsCount} | null }]`;
  `GET 🛡 /api/admin/evaluators?courseId` → `[{ id, name, avatarUrl, role, openReviews }]` (EVALUATOR/ADMIN + that course's mentor).
- `Rubric { id, key, version, name, criteria: [{ id, label, weight, maxScore, critical, guide }], status: ACTIVE|ARCHIVED, createdAt }` (+ `assessmentsCount, attemptsCount` in the admin list).
  A new version archives older ones and moves assessments on that key to it; attempts keep the `rubricId` they started with.
- `AssessmentPublic { id, courseId, title, brief, instructions, allowedFormats, passScore, maxAttempts, reassessWindowDays, dueDays, dueAt, rubric }`.
- `Attempt { id, assessmentId, courseId, userId, attemptNo, status, storedStatus, submission: {text,links,files}, version, submittedAt, rubricId, rubricVersion,
  scores: [{criterionId,label,maxScore,weight,critical,score,note}], totalScore, passed, feedback, reviewedAt, reassessUntil, onboarding, appealReason, appealDecision,
  history: [{status,at,note}], verificationId, course: {id,title,level,skill}, createdAt, updatedAt }`. Staff also get `evaluatorId, evaluator, evaluatorNotes,
  appealReviewerId, user(min), rubric`, and `by` in history. `status` reads `FAILED` when a reassessment window has lapsed (`storedStatus` stays `REASSESSMENT_REQUIRED`).
- `GET /api/courses/:id/assessment` also returns `course: {id,title,level,progressPercent}, canOnboard, attemptsLeft, dueAt`,
  `uploads: { enabled, maxBytes, maxFiles, extensions }` (`enabled` false when R2 isn't configured: the web hides the upload control); `GET /api/me/assessments` rows add `progressPercent, reassessUntil`.
  Students not enrolled get 403. Assessments are created on first use from settings defaults + the shared default rubric (`practical-default`).
- `GET /api/verify/skill/:code` → `{ code, name, skill: {slug,name}, level, status, awardedAt, expiresAt, rubricVersion }`.
- `GET /api/evaluations?status=` also accepts `REVIEWED` and `ALL`, and `courseId`. Default (no status): SUBMITTED + UNDER_REVIEW (+ APPEAL_PENDING for admins).
- `POST /api/attempts/:id/onboarding` also takes optional `availabilityNote`.
- Files (spec §15): private uploads to Cloudflare R2. Allow-list by extension (pdf, png, jpg/jpeg, webp, zip, fig, mp4, docx, pptx, xlsx, txt; the
  reported MIME must match or be empty), ≤ 25 MB each (`MAX_UPLOAD_BYTES` in `api/src/lib/uploads.js`), ≤ 10 per submission. Keys are
  `campus/attempts/<attemptId>/<random>-<safe name>`; the submission stores `{ key, name, size, type }` only and `Attempt.submission.files`
  returns the same (no URL). Saving a new key checks it in storage (missing → 400; size taken from storage). Keys must belong to the student's
  attempts on the same assessment (a reassessment carries files forward). Demo engine: `uploadUrl` is `demo-upload:<key>` and file urls are
  `demo-file:<key>`; the page keeps the bytes in memory (`web/src/components/assessment/files.jsx`). Operations: `docs/OPERATIONS.md` "Uploads".
- Approving a pass for a skill + level the student already holds renews that badge (new evidence/date/rubric version, history kept).
- Appeal UPHOLD restores the result before the appeal (a reassessment window is extended by the time the appeal took); OVERTURN → PASSED.
- Notifications: submitted, result (score + next step), reassessment window ending (once: lazily ≤ 3 days when the student opens assessments, and
  by the scheduler ≤ 48 h — `sendReassessReminders({ withinHours })` in `services/assessment.js`), assessment deadline within 48 h (scheduler), appeal decision, verification approved / revoked / reinstated; admins on new appeals and onboarding done.
  Audit actions: `assessment.assign`, `assessment.result`, `assessment.appeal_decision`, `assessment.create|update`, `rubric.create|version`, `verification.approve|revoke|reinstate`.
- Demo collections: `rubrics`, `assessments`, `assessmentAttempts` (with `courseId`), `skillVerifications`; demo audit rows via `demoAudit` → `auditLogs`.

### Projects & PM (owner: D) — `projects.js`
| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET 🔒 | /api/me/offers | `?status=open\|active\|past` | `ProjectOfferStudent[]` (open = OFFERED & not expired; only offers to me) |
| GET 🔒 | /api/me/offers/:id | | `ProjectOfferStudent` (own only — 404 otherwise) |
| POST 🔒 | /api/me/offers/:id/accept | `{ consents: ["PROJECT_POLICY"] }` | offer (ACCEPTED; records consent) |
| POST 🔒 | /api/me/offers/:id/decline | `{ reason? }` | offer (DECLINED; no penalty — spec §13.4) |
| POST 🔒 | /api/me/offers/:id/deliveries | `{ text, links }` | offer (SUBMITTED; version+1) |
| PATCH 🔒 | /api/me/availability | `{ openToProjects, hoursPerWeek, days, preferredTaskTypes, tools, communication }` | `{ user }` |
| GET 🧭 | /api/pm/talent | `?skill=<slug>&level&available=1&q` | `[{ user(min, no contact), verifications, availability, activeProjects, completedProjects, onTimeRate, offersLast30d, lastOfferAt }]` (ACTIVE verifications only; suspended excluded) |
| GET 🧭 | /api/pm/offers | `?status` | `ProjectOffer[]` (PM: own; admin: all) |
| POST 🧭 | /api/pm/offers | offer fields + `studentId, shortlistReason` (student must hold ACTIVE matching verification) | `ProjectOffer` — notify student; audited |
| GET/PUT 🧭 | /api/pm/offers/:id | offer fields (only while OFFERED, payout changes re-notify) | `ProjectOffer` |
| POST 🧭 | /api/pm/offers/:id/status | `{ status, note }` (IN_PROGRESS, ON_HOLD, CANCELLED, DISPUTED, WITHDRAWN, COMPLETED) | `ProjectOffer` — audited |
| POST 🧭 | /api/pm/offers/:id/review | `{ decision: "APPROVE"\|"REVISION", note }` (revision limited by revisionLimit) | `ProjectOffer` |
| POST 🧭 | /api/pm/offers/:id/client-acceptance | `{ accepted: true, feedback?, rating? }` | `ProjectOffer` (COMPLETED, payoutStatus ELIGIBLE) |
| GET 💰 | /api/finance/offers | `?payoutStatus` | `ProjectOfferFinance[]` |
| PUT 💰 | /api/finance/offers/:id | `{ clientPriceINR, splitBasis, freelancerSharePercent, taxesINR }` → platformShareINR snapshot | `ProjectOfferFinance` — audited |
| POST 💰 | /api/finance/offers/:id/adjustments | `{ amountINR, reason }` | `ProjectOfferFinance` — audited |
| POST 💰 | /api/finance/offers/:id/payout | `{ status: "PAID"\|"FAILED", payoutRef }` | `ProjectOfferFinance` — audited |

`ProjectOfferStudent` = title, summary, skill, level, deliverables, acceptanceCriteria, expectedHours, deadline, milestones, **payoutINR**, revisionLimit,
revisionsUsed, tools, confidentiality, pm: {name}, status, expiresAt, deliveries, payoutStatus — never client price, split or platform share (spec §9.1/§9.2).
Expired offers (expiresAt < now while OFFERED) read as EXPIRED. Statuses follow spec §9.3.

Implementation notes (D, additive to the table above):
- Extra routes: `GET 🔒 /api/me/availability` → `{ availability }`; `POST 🧭 /api/pm/offers/:id/milestones/:milestoneId` `{ status: PENDING|SUBMITTED|APPROVED }` → `ProjectOffer`;
  `GET 💰 /api/finance/rules` → `{ splitBasis, freelancerSharePercent }` (the current split defaults for the payout drawer, since FINANCE can't read `/api/admin/settings`).
- Extra filters: `/api/pm/talent?studentId=` (one candidate, used by the offer editor); `/api/pm/offers?q=`; `/api/finance/offers?q&from&to&reconciled=yes|no` (dates are `YYYY-MM-DD` on `updatedAt`).
- Every offer shape adds `stage` (= status, except SUBMITTED → `PM_REVIEW` | `CLIENT_REVIEW` once the PM approved the latest version) and milestone `overdue`.
  `ProjectOfferStudent` also has `id, netPayoutINR` (payout + finance adjustments), `declineReason, respondedAt, paidAt, clientAcceptedAt, feedback, rating`,
  `support: { link: "/app/help" }`, and `history: [{status, at}]` (no PM notes).
- `ProjectOffer` (PM) = all offer fields + `catalanceProjectId, skillId, pmId, pm, studentId, student(min), shortlistReason, declineReason, history[{status, at, by, note}]`;
  a `finance` block (same fields as `ProjectOfferFinance`) only for ADMIN.
- `ProjectOfferFinance` = `id, title, catalanceProjectId, skill, level, status, student(min), pm, payoutINR, clientPriceINR, splitBasis, freelancerSharePercent,
  platformShareINR` (stored snapshot), `computedPlatformShareINR, ruleFreelancerINR, varianceINR` (payout − rule share), `taxesINR, adjustments, adjustmentsTotalINR,
  netPayoutINR, payoutStatus, payoutRef, paidAt, clientAcceptedAt`. Finance sees accepted-or-later offers only (not OFFERED/DECLINED/EXPIRED/WITHDRAWN).
- Split: base = client price (ex tax, or + taxes for `CLIENT_PRICE_INC_TAX`); rule share = base × freelancerSharePercent; platform share = base − rule share.
  Snapshotted on finance PUT and again at client acceptance. Paid payouts are locked (no PUT or adjustments).
- Lifecycle: accept → `payoutStatus PENDING`; client acceptance → `COMPLETED` + `ELIGIBLE`; `client-acceptance { accepted: false, feedback }` → `DISPUTED`;
  CANCELLED/WITHDRAWN → `NOT_DUE`; payout PAID needs `payoutRef`, allowed from ELIGIBLE or FAILED. Status moves need a note except IN_PROGRESS;
  `COMPLETED` via `/status` only from DISPUTED (dispute resolved). Accept/decline of an expired offer → 410.
- Expiry (→ EXPIRED + history + PM notified once) and milestone due-soon (≤ 24 h) / overdue notices (student **and** PM, once per milestone) run
  when offers are read **and** on every scheduler tick (below); writes are conditional so the two never notify twice.
- Talent order: open to projects → fewer active projects → fewer offers in 30 days → oldest last offer → name. Never by fees; declines are not counted.

### Scheduler — `cron.js` (+ `services/scheduler.js`)
| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET | POST | /api/cron/tick | header `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends GET with it) | `{ ok, at, tookMs, counts: { offersExpired, milestoneReminders, reassessReminders, deadlineReminders }, errors: [{step,message}] }` — 401 bad/missing secret, 503 `CRON_SECRET` unset, 500 when a step failed (other steps still run) |

Idempotent; scheduled hourly in `api/vercel.json`; `npm run cron:tick` runs the same service without HTTP. Steps: OFFERED offers past
`expiresAt` → EXPIRED (+ history, PM `offer.expired`); milestones due ≤ 24 h / overdue → student + PM (`milestone.due`, markers in `milestones`);
reassessment window ending ≤ 48 h → student (`REMINDED` history marker); first-attempt deadline (`Assessment.dueDays` after enrolment) ≤ 48 h with
nothing submitted → student (`assignment.due`, the "Assessment due soon" notification is the marker). No demo-engine route (no server in demo mode).

### Compliance & ops (owner: F2) — `ops.js`
| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET 🛡 | /api/admin/audit | `?entity&entityId&actorId&action&from&to&cursor&limit` (`action` ending in `.` = prefix, e.g. `order.`); `&format=csv` → CSV download (audited `audit.export`) | `{ items: AuditLog[], nextCursor }`; `AuditLog { id, actorId, actorRole, actor: {id,name,role}\|null, action, entity, entityId, before, after, reason, ip, createdAt }` (newest first, 50 per page) |
| GET 💰 | /api/admin/reports/:name | `name` = growth\|course\|talent\|marketplace\|quality\|finance\|capacity; `?from&to` (yyyy-mm-dd, default last 30 days) | `{ name, from, to, metrics: {...}, rows: [...], series: [...], notes: string[] }` (spec §16; metric definitions in `docs/ANALYTICS.md`; `null` = not tracked) |
| GET 💰 | /api/admin/reports/:name.csv | same | CSV of `rows` (audited `report.export`) |
| GET 🛡 | /api/admin/funnel | `?from&to` (default all time) | `{ from, to, steps: [{ key, label, count, ofPrevious, ofSignups }], northStar: { count, rate, allTime, label } }`; steps visitor(null) → signup → paid → submitted → passed → verified → firstProject, cohort = students who signed up in range, each step = reached it or later |

Report numbers come from domain tables, never events. Same pure code in API (`services/reports-core.js`) and demo (`mocks/handlers/ops-reports.js`).
Demo audit rows live in the `auditLogs` collection (each domain's `demoAudit` helper inserts there).

Email: `api/src/lib/email.js` `sendEmail({ to, subject, html, text })` via Resend HTTP API (`RESEND_API_KEY`, `CAMPUS_EMAIL_FROM`, `CAMPUS_WEB_URL`); no-op + log when unset; never throws.
`notify(userId, { type, title, body, link, event?, email?, cta? }, tx)` also emails (fire-and-forget, after the row is written) when the user's
`notificationPrefs.email` isn't false and the notification is a spec §12 event: pass `event` (one of `EMAIL_EVENTS` in `lib/notify.js`, e.g.
`"assessment.result"`, `"payment.success"`, `"offer.expired"`, `"payout.status"`, `"ticket.update"`), or `email: true`; otherwise the event is inferred
from the link (`/app/payments`, `/app/assessments`, `/app/skills`, `/app/opportunities`, `/app/projects`, `/app/help`, `/admin/offers`, `/admin/support`).
`email: false` keeps it in-app only. Analytics: `track(name, props, userId)` in `api/src/lib/analytics.js` (names in `EVENT_DICTIONARY`).
Rate limits (express-rate-limit, POST, keyed per token): checkout/verify/offline-reference 20/15 min; attempt submit/appeal and offer accept/decline/deliveries 30/15 min;
support tickets and consents 30/h; wallet withdraw 5/h; `/api/auth` 50/15 min.

### Main Catalance app link (owner: E) — `backend/src/routes/campus.routes.js` (main marketplace API, not Campus)
Read-only `$queryRaw` over the `campus` schema; every route returns empty results (never 500) when the schema is missing.
Responses use the main backend's `{ data }` envelope. Ids are Catalance (public."User") ids.
| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET | /api/campus/users/:userId/skills | | `{ data: [{ skill: {slug,name,category}, level, awardedAt, expiresAt, verifyCode, verifyUrl }] }` ACTIVE + non-expired only; suspended Campus profiles return `[]` |
| GET 🔒 | /api/campus/me/summary | | `{ data: { linked, verifiedSkills, activeCourses, openOffers } }` (counts; offers = OFFERED and not expired) |
| GET 🧭 | /api/campus/talent | `?skill=<slug>&level` | `{ data: [{ userId, fullName, avatar, campusUsername, availability: {openToProjects,hoursPerWeek,days,preferredTaskTypes,tools}, lastVerifiedAt, verifications: [...as above] }], meta: { available, skills: [{slug,name}] } }` — Catalance PROJECT_MANAGER/ADMIN (`requirePm`); only `availability.openToProjects === true`; no email/phone |
Main web: badges on the freelancer profile + client/PM profile dialog link to `CAMPUS_URL/verify/skill/<code>`; dashboard card CTA `/campus?next=/app`;
PM workspace `/project-manager/campus-talent` links to `/campus?next=/admin/talent`. Backend env `CAMPUS_URL` (default `https://campus.catalance.in`) builds `verifyUrl`.

## Demo accounts (seeded in both demo engine and API seed)
| Role | Email | Password |
|---|---|---|
| Student | `student@campus.dev` | `campus123` |
| Mentor | `mentor@campus.dev` | `campus123` |
| Admin | `admin@campus.dev` | `campus123` |
| Aspirant (student in aspirant mode) | `aspirant@campus.dev` | `campus123` |
| Evaluator | `evaluator@campus.dev` | `campus123` |
| Project manager | `pm@campus.dev` | `campus123` |
| Finance | `finance@campus.dev` | `campus123` |

In the real API the passwords are not used: sign-in is the Catalance account (see `api/README.md`), and the seeded `campus."User"` rows are linked
on first visit by email. Seeding (`npm run export-seed && npm run seed`) now includes every spec v1.0 collection from the demo seeds
(categories, skills, rubrics, assessments, attempts, verifications, orders, consents, offers, tickets, audit log; demo `projectAvailability`
becomes `User.availability`). `npm run seed:check` dry-runs the mapping offline; `npm run smoke:spec` runs the offline spec smoke test.

## Integration notes (as built)
- Every `/api/...` path called from `web/src` (outside `mocks/`) has a matching route in both `api/src/routes` and `web/src/mocks/handlers`,
  and every demo route has a real one (checked by a script over all 172 distinct call sites and 192 demo routes).
- Admin-only `/api/admin/*` is enforced by one guard in `admin.js`; `/api/admin/{orders,support,reports}` skip it and check their own roles.
  `/admin/submissions` (lesson reviews) is ADMIN-only in the web as well; mentors review lesson submissions in Mentor Studio (`/app/mentor`, `/api/mentor/submissions`).
- Course lists everywhere (`services/courses.js` `PUBLISHED`, tracks, mentor pages, dashboard suggestions) use the catalogue's listed statuses
  (`PUBLISHED | ENROLMENT_OPEN | FULL | PAUSED`), so DRAFT and ARCHIVED courses never appear in lists.
- Locked lessons enrol through `EnrolButton` (checkout for paid courses), never a direct enrol call.
