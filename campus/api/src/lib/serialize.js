import { aspirantOf } from "./aspirant.js";
import { DEFAULT_GST_PERCENT, SKILL_REF_SELECT, enrolmentOpen, levelDefaultsFor, priceWithGst, seatsLeft, skillRef } from "./catalog.js";

/**
 * Shape mappers: Prisma rows → API_CONTRACT.md shapes.
 * Dates are left as Date objects; res.json() serializes them to ISO strings.
 */

/* ───────────── includes (use with Prisma queries so mappers have what they need) ───────────── */

export const USER_INCLUDE = { college: true };
export const MENTOR_SELECT = { id: true, name: true, avatarUrl: true, headline: true, mentorProfile: true };
export const COURSE_INCLUDE = {
  track: { select: { id: true, slug: true, title: true, color: true } },
  mentor: { select: MENTOR_SELECT },
  skill: { select: SKILL_REF_SELECT },
  _count: { select: { enrollments: true } }, // capacity / seats left (lib/catalog.js)
};
export const COURSE_DETAIL_INCLUDE = {
  ...COURSE_INCLUDE,
  modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
};
export const ACTIVE_APP_STATUSES = ["ACCEPTED", "SUBMITTED", "APPROVED", "PAID"];
export const GIG_INCLUDE = {
  mentor: { select: MENTOR_SELECT },
  _count: { select: { applications: { where: { status: { in: ACTIVE_APP_STATUSES } } } } },
};

/* ───────────── people ───────────── */

export const collegeRef = (c) => (c ? { id: c.id, name: c.name, shortName: c.shortName, city: c.city } : null);

const obj = (v, fallback = {}) => (v && typeof v === "object" && !Array.isArray(v) ? v : fallback);

/** PublicUser — never includes password fields. Expects `college` included (USER_INCLUDE). */
export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    username: u.username,
    avatarUrl: u.avatarUrl ?? null,
    role: u.role,
    status: u.status,
    headline: u.headline ?? null,
    bio: u.bio ?? null,
    phone: u.phone ?? null,
    city: u.city ?? null,
    state: u.state ?? null,
    collegeId: u.collegeId ?? null,
    college: collegeRef(u.college),
    year: u.year ?? null,
    stream: u.stream ?? null,
    goal: u.goal ?? null,
    language: u.language || "en",
    interests: u.interests || [],
    skillLevel: u.skillLevel ?? null,
    skills: u.skills || [],
    links: obj(u.links),
    onboarded: Boolean(u.onboarded),
    xp: u.xp ?? 0,
    coins: u.coins ?? 0,
    streak: u.streak ?? 0,
    longestStreak: u.longestStreak ?? 0,
    seasonPoints: u.seasonPoints ?? 0,
    lifetimePoints: u.lifetimePoints ?? 0,
    division: u.division || "BRONZE",
    ladderStage: u.ladderStage ?? 1,
    walletBalanceINR: u.walletBalanceINR ?? 0,
    lifetimeEarnedINR: u.lifetimeEarnedINR ?? 0,
    notificationPrefs: { email: true, whatsapp: true, push: true, ...obj(u.notificationPrefs) },
    mentorProfile: u.mentorProfile ?? null,
    availability: obj(u.availability),
    createdAt: u.createdAt,
  };
}

/**
 * Another person as seen by any signed-in user (leaderboards, mentor lists). Campus profiles come from real
 * Catalance accounts, so contact details and money never leave here; staff views and the owner's own view use publicUser.
 */
export function peerUser(u) {
  if (!u) return null;
  // eslint-disable-next-line no-unused-vars
  const { email, phone, notificationPrefs, walletBalanceINR, lifetimeEarnedINR, availability, ...rest } = publicUser(u);
  return rest;
}

/**
 * The signed-in user's own view (auth, /api/auth/me, PATCH /api/me, onboarding, dashboard):
 * PublicUser plus the private `aspirant` profile. Never use for other people.
 */
export const selfUser = (u) => (u ? { ...publicUser(u), aspirant: aspirantOf(u) } : null);

/** PublicUser(min): author blocks on threads, replies, posts. */
export const miniUser = (u) =>
  u
    ? {
        id: u.id,
        name: u.name,
        username: u.username,
        avatarUrl: u.avatarUrl ?? null,
        role: u.role,
        division: u.division,
        college: collegeRef(u.college),
      }
    : null;

export const mentorRef = (m) =>
  m ? { id: m.id, name: m.name, avatarUrl: m.avatarUrl ?? null, headline: m.mentorProfile?.headline || m.headline || null } : null;

export const mentorMini = (m) => (m ? { id: m.id, name: m.name, avatarUrl: m.avatarUrl ?? null } : null);

export function collegeOut(c) {
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    city: c.city,
    state: c.state,
    type: c.type,
    studentsCount: c.studentsCount,
    totalPoints: c.totalPoints,
    avgPoints: c.avgPoints,
    rank: c.rank,
    rankChange: c.rankChange,
    topSkill: c.topSkill ?? null,
    verified: c.verified,
    createdAt: c.createdAt,
  };
}

/* ───────────── learning ───────────── */

const normalizeCareers = (careers) =>
  (Array.isArray(careers) ? careers : []).map((c) => (Array.isArray(c) ? { title: c[0], avgPayINR: c[1] } : c));

/** Track; pass the track's published courses (id + studentsCount) to compute counts. */
export function trackOut(t, courses = []) {
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    tagline: t.tagline,
    category: t.category,
    icon: t.icon,
    color: t.color,
    level: t.level,
    durationWeeks: t.durationWeeks,
    coursesCount: courses.length,
    studentsCount: courses.reduce((s, c) => s + (c.studentsCount || 0), 0) || t.studentsCount || 0,
    outcomes: t.outcomes || [],
    careers: normalizeCareers(t.careers),
    courseIds: courses.map((c) => c.id),
    forAspirants: Boolean(t.forAspirants),
    bridgeFrom: t.bridgeFrom || [],
  };
}

export function enrollmentOut(e) {
  if (!e) return null;
  return {
    id: e.id,
    userId: e.userId,
    courseId: e.courseId,
    progressPercent: e.progressPercent,
    completedLessonIds: e.completedLessonIds || [],
    lastLessonId: e.lastLessonId ?? null,
    startedAt: e.startedAt,
    completedAt: e.completedAt ?? null,
  };
}

export function lessonSummary(l, doneSet) {
  const out = {
    id: l.id,
    title: l.title,
    type: l.type,
    durationMinutes: l.durationMinutes,
    order: l.order,
    isPreview: Boolean(l.isPreview),
  };
  if (doneSet) out.completed = doneSet.has(l.id);
  return out;
}

/** Full lesson (admin editor / lesson player). */
export function lessonFull(l) {
  return {
    ...lessonSummary(l),
    courseId: l.courseId,
    moduleId: l.moduleId,
    content: l.content || "",
    videoUrl: l.videoUrl ?? null,
    quiz: l.quiz ?? null,
    assignment: l.assignment ?? null,
  };
}

/** Flattened, ordered lessons of a course loaded with COURSE_DETAIL_INCLUDE. */
export const flatLessons = (course) => (course?.modules || []).flatMap((m) => m.lessons || []);

/**
 * Course. Options:
 *  - enrollment: Enrollment row or null (contract: included when the user is known)
 *  - modules: true to include modules[].lessons[] summaries (course must use COURSE_DETAIL_INCLUDE)
 *  - fullLessons: true to include full lesson bodies (admin)
 *  - gstPercent: settings pricing.gstPercent (routes pass it from getSettings(); fees exclude GST, spec §6.2)
 */
export function courseOut(c, { enrollment = null, modules = false, fullLessons = false, gstPercent = DEFAULT_GST_PERCENT } = {}) {
  const out = {
    id: c.id,
    slug: c.slug,
    trackId: c.trackId,
    track: c.track ? { id: c.track.id, slug: c.track.slug, title: c.track.title, color: c.track.color } : null,
    title: c.title,
    subtitle: c.subtitle,
    description: c.description,
    level: c.level,
    languages: c.languages || [],
    cover: c.cover,
    mentorId: c.mentorId ?? null,
    mentor: mentorRef(c.mentor),
    durationMinutes: c.durationMinutes,
    lessonsCount: c.lessonsCount,
    rating: c.rating,
    ratingsCount: c.ratingsCount,
    studentsCount: c.studentsCount,
    skills: c.skills || [],
    whatYouBuild: c.whatYouBuild || [],
    requirements: c.requirements || [],
    priceINR: c.priceINR,
    payLater: c.payLater,
    isFree: (c.priceINR || 0) === 0,
    status: c.status,
    // catalogue fields (spec §6, §6.2, §7.3)
    skillId: c.skillId ?? null,
    skill: skillRef(c.skill),
    durationDays: c.durationDays ?? levelDefaultsFor(c.level).durationDays,
    outcome: c.outcome || "",
    whoFor: c.whoFor || "",
    capacity: c.capacity ?? null,
    enrolmentOpensAt: c.enrolmentOpensAt ?? null,
    enrolmentClosesAt: c.enrolmentClosesAt ?? null,
    enrolmentOpen: enrolmentOpen(c),
    seatsLeft: seatsLeft(c),
    gstPercent,
    priceWithGstINR: priceWithGst(c.priceINR, gstPercent),
    createdAt: c.createdAt,
    enrollment: enrollmentOut(enrollment),
  };
  if (modules && c.modules) {
    const done = enrollment ? new Set(enrollment.completedLessonIds || []) : null;
    out.modules = c.modules.map((m) => ({
      id: m.id,
      title: m.title,
      order: m.order,
      lessons: (m.lessons || []).map((l) => (fullLessons ? lessonFull(l) : lessonSummary(l, done))),
    }));
  }
  return out;
}

export function submissionOut(s, user) {
  const out = {
    id: s.id,
    userId: s.userId,
    courseId: s.courseId,
    lessonId: s.lessonId,
    lessonTitle: s.lessonTitle,
    text: s.text ?? null,
    link: s.link ?? null,
    status: s.status,
    score: s.score ?? null,
    maxScore: s.maxScore,
    feedback: s.feedback ?? null,
    reviewedById: s.reviewedById ?? null,
    createdAt: s.createdAt,
    reviewedAt: s.reviewedAt ?? null,
  };
  const u = user !== undefined ? user : s.user;
  if (u) out.user = publicUser(u);
  return out;
}

export const certificateOut = (c) => ({
  id: c.id,
  userId: c.userId,
  courseId: c.courseId,
  courseTitle: c.courseTitle,
  trackTitle: c.trackTitle,
  mentorName: c.mentorName,
  score: c.score,
  verifyCode: c.verifyCode,
  issuedAt: c.issuedAt,
});

/* ───────────── earn ───────────── */

/** Gig. Pass myApplication (row or null) to include it; undefined omits the key. */
export function gigOut(g, myApplication) {
  const out = {
    id: g.id,
    title: g.title,
    company: g.company,
    category: g.category,
    skills: g.skills || [],
    payoutINR: g.payoutINR,
    durationDays: g.durationDays,
    difficulty: g.difficulty,
    minStage: g.minStage,
    status: g.status,
    applicantsCount: g.applicantsCount,
    spots: g.spots,
    deadline: g.deadline ?? null,
    description: g.description,
    deliverables: g.deliverables || [],
    mentorId: g.mentorId ?? null,
    mentor: g.mentor ? mentorRef(g.mentor) : null,
    spotsLeft: g._count ? Math.max(0, (g.spots || 1) - (g._count.applications || 0)) : undefined,
    createdAt: g.createdAt,
  };
  if (out.spotsLeft === undefined) delete out.spotsLeft;
  if (myApplication !== undefined) out.myApplication = myApplication ? applicationOut(myApplication) : null;
  return out;
}

export function applicationOut(a, { gig, user } = {}) {
  const out = {
    id: a.id,
    gigId: a.gigId,
    userId: a.userId,
    status: a.status,
    pitch: a.pitch,
    submissionLink: a.submissionLink ?? null,
    submissionNote: a.submissionNote ?? null,
    feedback: a.feedback ?? null,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
  const g = gig !== undefined ? gig : a.gig;
  const u = user !== undefined ? user : a.user;
  if (g) out.gig = gigOut(g);
  if (u) out.user = publicUser(u);
  return out;
}

export const walletTxnOut = (t) => ({
  id: t.id,
  userId: t.userId,
  type: t.type,
  amountINR: t.amountINR,
  note: t.note,
  status: t.status,
  createdAt: t.createdAt,
});

export const pointsEventOut = (p) => ({
  id: p.id,
  userId: p.userId,
  source: p.source,
  points: p.points,
  note: p.note,
  createdAt: p.createdAt,
});

export const portfolioOut = (p) => ({
  id: p.id,
  userId: p.userId,
  title: p.title,
  description: p.description,
  link: p.link ?? null,
  cover: p.cover,
  skills: p.skills || [],
  verified: p.verified,
  source: p.source,
  createdAt: p.createdAt,
});

export const badgeOut = (b) => ({
  id: b.id,
  key: b.key,
  title: b.title,
  description: b.description,
  icon: b.icon,
  earnedAt: b.earnedAt,
});

export const seasonOut = (s) => (s ? { id: s.id, name: s.name, number: s.number, startsAt: s.startsAt, endsAt: s.endsAt } : null);

/* ───────────── community ───────────── */

export const threadOut = (t, hasUpvoted = false) => ({
  id: t.id,
  authorId: t.authorId,
  author: miniUser(t.author),
  title: t.title,
  body: t.body,
  tags: t.tags || [],
  trackId: t.trackId ?? null,
  upvotes: t.upvotes,
  hasUpvoted: Boolean(hasUpvoted),
  repliesCount: t._count?.replies ?? t.repliesCount ?? 0,
  solved: Boolean(t.acceptedReplyId),
  acceptedReplyId: t.acceptedReplyId ?? null,
  createdAt: t.createdAt,
  lastActivityAt: t.lastActivityAt,
});

export const THREAD_INCLUDE = { author: { include: USER_INCLUDE }, _count: { select: { replies: true } } };

export const replyOut = (r, hasUpvoted = false) => ({
  id: r.id,
  threadId: r.threadId,
  authorId: r.authorId,
  author: miniUser(r.author),
  body: r.body,
  upvotes: r.upvotes,
  hasUpvoted: Boolean(hasUpvoted),
  isAccepted: Boolean(r.isAccepted),
  createdAt: r.createdAt,
});

export function bookingOut(b) {
  const out = {
    id: b.id,
    mentorId: b.mentorId,
    userId: b.userId,
    date: b.date,
    time: b.time,
    topic: b.topic,
    note: b.note ?? null,
    status: b.status,
    meetLink: b.meetLink,
    createdAt: b.createdAt,
  };
  if (b.mentor) out.mentor = mentorRef(b.mentor);
  // the other party only: mentors see a peer view of the student (no contact details or money)
  if (b.user) out.user = peerUser(b.user);
  return out;
}
export const BOOKING_INCLUDE = { mentor: { select: MENTOR_SELECT }, user: { include: USER_INCLUDE } };

export const COHORT_INCLUDE = {
  track: { select: { title: true, color: true } },
  leadMentor: { select: { id: true, name: true, avatarUrl: true } },
  _count: { select: { members: true } },
};

export function cohortOut(c, { isMember = false, members } = {}) {
  const out = {
    id: c.id,
    title: c.title,
    trackId: c.trackId,
    track: c.track ? { title: c.track.title, color: c.track.color } : null,
    leadMentorId: c.leadMentorId ?? null,
    leadMentor: mentorMini(c.leadMentor),
    description: c.description,
    startDate: c.startDate,
    schedule: c.schedule,
    membersCount: c._count?.members ?? c.membersCount ?? 0,
    maxMembers: c.maxMembers,
    isMember: Boolean(isMember),
    createdAt: c.createdAt,
  };
  if (members) out.members = members.map(peerUser);
  return out;
}

export const cohortPostOut = (p) => ({ id: p.id, author: miniUser(p.author), body: p.body, createdAt: p.createdAt });

export const notificationOut = (n) => ({
  id: n.id,
  userId: n.userId,
  type: n.type,
  title: n.title,
  body: n.body,
  link: n.link ?? null,
  read: n.read,
  createdAt: n.createdAt,
});
