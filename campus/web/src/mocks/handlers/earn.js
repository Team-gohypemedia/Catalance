/** Demo-engine handlers for the "earn" domain. See campus/API_CONTRACT.md → "Earn & rank". */
import { httpError, requireUser, publicUser, now } from "../utils";
import { awardPoints, notify } from "../points";
import { divisionFor, DIVISIONS, formatINR } from "@/lib/utils";
import { demoFlags } from "./platform";

/* ───────────── shared helpers ───────────── */

const DONE_STATUSES = ["APPROVED", "PAID"];
const ACTIVE_STATUSES = ["ACCEPTED", "SUBMITTED", "APPROVED", "PAID"];
const PAY_LATER_FEE_INR = 4999;
const DEDUCTION_PERCENT = 20;

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const safe = (fn, fallback) => {
  try {
    const v = fn();
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

function currentSeason(db) {
  const all = db.all("seasons");
  const t = Date.now();
  const s =
    all.find((x) => new Date(x.startsAt).getTime() <= t && new Date(x.endsAt).getTime() > t) ||
    all.find((x) => x.status === "ACTIVE") ||
    [...all].sort((a, b) => (b.number || 0) - (a.number || 0))[0];
  if (!s) return { id: "season_current", name: "Current season", number: 1, startsAt: now(), endsAt: now() };
  return { id: s.id, name: s.name, number: s.number, startsAt: s.startsAt, endsAt: s.endsAt };
}

/** User object safe for public pages (no contact details). */
function passportUser(u) {
  const p = publicUser(u);
  if (!p) return null;
  // eslint-disable-next-line no-unused-vars
  const { email, phone, notificationPrefs, status, aspirant, ...rest } = p;
  return rest;
}

/** PublicUser for public lists (leaderboard, colleges): the private aspirant profile is never exposed. */
function listUser(u) {
  const p = publicUser(u);
  if (!p) return null;
  // eslint-disable-next-line no-unused-vars
  const { aspirant, ...rest } = p;
  return rest;
}

/** Public "Preparation record" for aspirants who opted in. Never includes birthYear or attemptsUsed. */
function preparationRecord(db, u) {
  const a = u.aspirant;
  if (!a?.showOnPassport) return null;
  const strengths = a.strengths || [];
  const has = (...s) => s.some((x) => strengths.includes(x));
  const traits = [];
  if ((a.prepYears || 0) >= 2) traits.push("Discipline");
  traits.push("Self-study");
  if (has("Quant", "Reasoning", "Data Interpretation")) traits.push("Analytical reasoning");
  if (has("Essay Writing", "English", "Hindi")) traits.push("Writing & expression");
  if ((a.mockTestsTaken || 0) >= 100) traits.push("Consistency");
  if (traits.length < 3) traits.push("Time management");
  const bridgeTrackIds = new Set(db.filter("tracks", (t) => t.forAspirants).map((t) => t.id));
  const bridgeCourses = safe(() => db.filter("enrollments", (e) => e.userId === u.id && bridgeTrackIds.has(db.findById("courses", e.courseId)?.trackId)).length, 0);
  return {
    examName: a.examName,
    prepYears: a.prepYears,
    studyHoursTotal: a.studyHoursTotal ?? 0,
    mockTestsTaken: a.mockTestsTaken ?? 0,
    bestMockPercentile: a.bestMockPercentile ?? null,
    strengths,
    traits: traits.slice(0, 5),
    bridgeCourses,
  };
}

const mentorMini = (db, id) => {
  const m = db.findById("users", id);
  return m ? { id: m.id, name: m.name, avatarUrl: m.avatarUrl, headline: m.headline } : null;
};

function spotsTaken(db, gigId) {
  return db.filter("gigApplications", (a) => a.gigId === gigId && ACTIVE_STATUSES.includes(a.status)).length;
}

function gigView(db, gig, user, { withMine = true } = {}) {
  const out = {
    ...gig,
    mentor: mentorMini(db, gig.mentorId),
    spotsLeft: Math.max(0, (gig.spots || 1) - spotsTaken(db, gig.id)),
  };
  if (withMine) out.myApplication = user ? db.find("gigApplications", (a) => a.gigId === gig.id && a.userId === user.id) : null;
  return out;
}

function appView(db, app, { gig = true, user = false } = {}) {
  const out = { ...app };
  if (gig) {
    const g = db.findById("gigs", app.gigId);
    out.gig = g ? gigView(db, g, null, { withMine: false }) : null;
  }
  if (user) out.user = publicUser(db.findById("users", app.userId));
  return out;
}

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

/* ───────────── rankings ───────────── */

function studentRanking(db, { period = "season", track, city, collegeId } = {}) {
  const key = period === "all" ? "lifetimePoints" : "seasonPoints";
  return db
    .filter("users", (u) => u.role === "STUDENT" && u.status !== "SUSPENDED")
    .filter((u) => !track || (u.interests || []).includes(track))
    .filter((u) => !city || (u.city || "").toLowerCase() === city.toLowerCase())
    .filter((u) => !collegeId || u.collegeId === collegeId)
    .map((u) => ({ u, points: u[key] || 0 }))
    .sort((a, b) => b.points - a.points || a.u.name.localeCompare(b.u.name));
}

function collegeRanking(db, { period = "season", track, city } = {}) {
  const key = period === "all" ? "lifetimePoints" : "seasonPoints";
  const students = db.filter("users", (u) => u.role === "STUDENT" && u.collegeId && (!track || (u.interests || []).includes(track)));
  const byCollege = new Map();
  for (const s of students) {
    const e = byCollege.get(s.collegeId) || { points: 0, members: 0 };
    e.points += s[key] || 0;
    e.members += 1;
    byCollege.set(s.collegeId, e);
  }
  const ranked = db
    .all("colleges")
    .filter((c) => !city || (c.city || "").toLowerCase() === city.toLowerCase())
    .map((c) => {
      const e = byCollege.get(c.id) || { points: 0, members: 0 };
      return { c, points: e.points, avg: e.members ? Math.round(e.points / e.members) : 0 };
    })
    .filter((x) => x.points > 0 || !track)
    .sort((a, b) => b.points - a.points || a.c.name.localeCompare(b.c.name));
  return ranked.map((x, i) => ({
    ...x,
    college: { ...x.c, totalPoints: x.points, avgPoints: x.avg, rank: i + 1 },
  }));
}

/** Overall national college rank (season, no filters). */
function collegeWithRank(db, college) {
  const r = collegeRanking(db).find((x) => x.c.id === college.id);
  return r ? r.college : college;
}

const studentChange = (seasonId, userId) => {
  const h = hash(`${seasonId}:${userId}`);
  return h % 4 === 0 ? 0 : (h % 11) - 5;
};

/* ───────────── ladder ───────────── */

function ladderMetrics(db, u) {
  const enrollments = safe(() => db.filter("enrollments", (e) => e.userId === u.id), []);
  const submissions = safe(() => db.filter("submissions", (s) => s.userId === u.id), []);
  const certificates = safe(() => db.filter("certificates", (c) => c.userId === u.id), []);
  const events = db.filter("pointsEvents", (e) => e.userId === u.id);
  const apps = db.filter("gigApplications", (a) => a.userId === u.id && DONE_STATUSES.includes(a.status));
  const portfolio = db.filter("portfolioItems", (p) => p.userId === u.id);
  const count = (src) => events.filter((e) => e.source === src && e.points > 0).length;

  const lessonsFromEnrollments = enrollments.reduce((n, e) => n + (Array.isArray(e.completedLessonIds) ? e.completedLessonIds.length : 0), 0);
  const realProjects = apps.filter((a) => (db.findById("gigs", a.gigId)?.minStage || 3) >= 4).length;
  return {
    enrolled: enrollments.length,
    lessons: Math.max(lessonsFromEnrollments, count("LESSON")),
    quizzes: count("QUIZ"),
    assignments: Math.max(submissions.length, count("ASSIGNMENT")),
    reviewed: Math.max(
      submissions.filter((s) => s.status === "REVIEWED").length,
      portfolio.filter((p) => p.source === "ASSIGNMENT" && p.verified).length,
    ),
    coursesCompleted: Math.max(enrollments.filter((e) => e.completedAt).length, certificates.length),
    gigsApproved: apps.length,
    realProjects,
    earned: u.lifetimeEarnedINR || 0,
    verifiedPortfolio: portfolio.filter((p) => p.verified).length,
    seasonPoints: u.seasonPoints || 0,
  };
}

const STAGES = [
  {
    stage: 1,
    key: "LEARN",
    title: "Learn",
    description: "Pick a track and build the basics with short lessons and the AI Tutor in your language.",
    reward: "+150 pts · AI Tutor voice mode",
    rewardPoints: 150,
    rewardINR: 0,
    reqs: (m) => [
      { label: "Enroll in a course", current: m.enrolled, target: 1 },
      { label: "Complete 10 lessons", current: m.lessons, target: 10 },
      { label: "Pass your first quiz", current: m.quizzes, target: 1 },
    ],
  },
  {
    stage: 2,
    key: "PRACTICE",
    title: "Practice",
    description: "Turn knowledge into proof. Quizzes and assignments reviewed by working freelancers.",
    reward: "+300 pts · Micro-gig board unlocked",
    rewardPoints: 300,
    rewardINR: 0,
    reqs: (m) => [
      { label: "Pass 5 quizzes", current: m.quizzes, target: 5 },
      { label: "Submit 2 assignments", current: m.assignments, target: 2 },
      { label: "Get 1 assignment reviewed by a mentor", current: m.reviewed, target: 1 },
    ],
  },
  {
    stage: 3,
    key: "MICRO_GIG",
    title: "Micro-gig",
    description: "Small paid tasks (₹200–₹1,500) for real Indian businesses, with a mentor checking your work.",
    reward: "₹500 bonus · Real projects unlocked",
    rewardPoints: 500,
    rewardINR: 500,
    reqs: (m) => [
      { label: "Get 5 micro-gigs approved", current: m.gigsApproved, target: 5 },
      { label: `Earn ${formatINR(5000)} from gigs`, current: m.earned, target: 5000 },
      { label: "Build 3 verified portfolio pieces", current: m.verifiedPortfolio, target: 3 },
    ],
  },
  {
    stage: 4,
    key: "REAL_PROJECT",
    title: "Real project",
    description: "Own a full client project worth ₹2,000–₹15,000, end to end, like a real freelancer.",
    reward: "₹1,000 bonus · Featured to partner companies",
    rewardPoints: 800,
    rewardINR: 1000,
    reqs: (m) => [
      { label: "Deliver 2 real projects", current: m.realProjects, target: 2 },
      { label: `Earn ${formatINR(15000)} lifetime`, current: m.earned, target: 15000 },
      { label: "Build 6 verified portfolio pieces", current: m.verifiedPortfolio, target: 6 },
    ],
  },
  {
    stage: 5,
    key: "HIRED",
    title: "Hired",
    description: "Companies scout you from the leaderboard and your Skill Passport. Internship, job or retainer.",
    reward: "Interview fast-track · Diamond passport frame",
    rewardPoints: 1500,
    rewardINR: 0,
    reqs: (m) => [
      { label: "Deliver 4 real projects", current: m.realProjects, target: 4 },
      { label: `Reach ${DIVISIONS.PLATINUM.label} division this season`, current: m.seasonPoints, target: DIVISIONS.PLATINUM.min },
      { label: "Complete 2 courses", current: m.coursesCompleted, target: 2 },
    ],
  },
];

function computeLadder(db, user) {
  const m = ladderMetrics(db, user);
  const built = STAGES.map((s) => {
    const requirements = s.reqs(m).map((r) => ({ ...r, current: Math.min(r.current, r.target * 10), done: r.current >= r.target }));
    return { ...s, requirements, allDone: requirements.every((r) => r.done) };
  });
  let computed = 1;
  for (const s of built) {
    if (s.allDone && s.stage < 5) computed = s.stage + 1;
    else break;
  }
  return { built, computed, hiredDone: built[4].allDone && computed === 5 };
}

function promote(db, user, from, to) {
  for (let s = from; s < to; s++) {
    const def = STAGES[s - 1];
    awardPoints(db, user.id, def.rewardPoints, "BONUS", `Earn Ladder · completed Stage ${s} (${def.title})`);
    if (def.rewardINR) {
      db.insert("walletTxns", { userId: user.id, type: "BONUS", amountINR: def.rewardINR, note: `Ladder bonus · reached Stage ${s + 1} (${STAGES[s].title})`, status: "COMPLETED" });
      db.update("users", user.id, (u) => ({
        walletBalanceINR: (u.walletBalanceINR || 0) + def.rewardINR,
        lifetimeEarnedINR: (u.lifetimeEarnedINR || 0) + def.rewardINR,
      }));
    }
  }
  db.update("users", user.id, { ladderStage: to });
  notify(db, user.id, {
    type: "RANK",
    title: `You climbed to Stage ${to}: ${STAGES[to - 1].title}`,
    body: `New on your ladder: ${STAGES[to - 1].description}`,
    link: "/app/ladder",
  });
}

/* ───────────── skills for the passport ───────────── */

/** Same rule as the API: only an ACTIVE skill verification marks a skill verified (certificates and portfolio raise the level). */
function deriveSkills(db, u, portfolio, certificates, verifiedNames = new Set()) {
  const map = new Map();
  const add = (name, score, verified) => {
    if (!name) return;
    const k = name.trim();
    const e = map.get(k.toLowerCase()) || { name: k, score: 0, verified: false };
    e.score += score;
    e.verified = e.verified || verified;
    map.set(k.toLowerCase(), e);
  };
  (u.skills || []).forEach((s) => add(s, 1, false));
  portfolio.forEach((p) => (p.skills || []).forEach((s) => add(s, p.verified ? 1.5 : 0.5, false)));
  certificates.forEach((c) => {
    const course = safe(() => db.findById("courses", c.courseId), null);
    (course?.skills || []).forEach((s) => add(s, 1.5, false));
  });
  verifiedNames.forEach((name) => add(name, 2, true));
  return [...map.values()]
    .map((e) => ({ name: e.name, level: Math.max(1, Math.min(5, Math.round(1 + e.score))), verified: e.verified }))
    .sort((a, b) => Number(b.verified) - Number(a.verified) || b.level - a.level || a.name.localeCompare(b.name))
    .slice(0, 12);
}

/* ───────────── portfolio helpers ───────────── */

const COVERS = [
  { from: "#FF5A1F", to: "#6B4EFF" },
  { from: "#12A150", to: "#1F9BFF" },
  { from: "#E8B100", to: "#FF5A1F" },
  { from: "#6B4EFF", to: "#3CC6C0" },
  { from: "#E5484D", to: "#D98E00" },
  { from: "#1F9BFF", to: "#8B74FF" },
];

function cleanSkills(skills) {
  const arr = Array.isArray(skills) ? skills : String(skills || "").split(",");
  return [...new Set(arr.map((s) => String(s).trim()).filter(Boolean))].slice(0, 8);
}

function cleanLink(link) {
  const l = String(link || "").trim();
  if (!l) return null;
  if (!/^https?:\/\/\S+\.\S+/.test(l)) throw httpError(400, "Links need to start with https:// (e.g. https://github.com/you/project).");
  return l;
}

function ownPortfolioItem(db, user, id) {
  const item = db.findById("portfolioItems", id);
  if (!item || item.userId !== user.id) throw httpError(404, "Portfolio item not found.");
  if (item.source !== "PERSONAL") throw httpError(400, "Verified items come from mentor reviews and can't be edited.");
  return item;
}

/* ───────────── handlers ───────────── */

export default {
  "GET /api/public/stats": ({ db }) => {
    const students = db.filter("users", (u) => u.role === "STUDENT");
    const paid = db.filter("gigApplications", (a) => DONE_STATUSES.includes(a.status));
    const paidOut = paid.reduce((n, a) => n + (db.findById("gigs", a.gigId)?.payoutINR || 0), 0);
    return {
      students: 24000 + students.length * 13,
      colleges: 410 + db.all("colleges").length,
      mentors: 180 + db.filter("users", (u) => u.role === "MENTOR").length,
      paidOutINR: 3860000 + paidOut,
      gigsCompleted: 4100 + paid.length,
      avgFirstEarningDays: 41,
    };
  },

  "GET /api/ladder": ({ user, db }) => {
    requireUser(user);
    const { built, computed, hiredDone } = computeLadder(db, user);
    const stored = user.ladderStage || 1;
    if (computed > stored) promote(db, user, stored, computed);
    const currentStage = Math.max(stored, computed);
    return {
      currentStage,
      stages: built.map((s) => ({
        stage: s.stage,
        key: s.key,
        title: s.title,
        description: s.description,
        reward: s.reward,
        requirements: s.requirements,
        unlocked: s.stage <= currentStage,
        completed: s.stage < currentStage || (s.stage === 5 && hiredDone),
      })),
    };
  },

  "GET /api/gigs": ({ user, query, db }) => {
    requireUser(user);
    const q = (query.q || "").toLowerCase().trim();
    const stage = user.ladderStage || 1;
    return db
      .filter("gigs", (g) => g.status === "OPEN")
      .filter((g) => !query.category || g.category === query.category)
      .filter((g) => !query.difficulty || g.difficulty === query.difficulty)
      .filter((g) => query.eligible !== "true" || stage >= g.minStage)
      .filter((g) => !q || `${g.title} ${g.company?.name} ${(g.skills || []).join(" ")} ${g.category}`.toLowerCase().includes(q))
      .sort(byNewest)
      .map((g) => gigView(db, g, user));
  },

  "GET /api/gigs/:id": ({ user, params, db }) => {
    requireUser(user);
    const gig = db.findById("gigs", params.id);
    if (!gig) throw httpError(404, "This gig doesn't exist or was removed.");
    return gigView(db, gig, user);
  },

  "POST /api/gigs/:id/apply": ({ user, params, body, db }) => {
    requireUser(user);
    const gig = db.findById("gigs", params.id);
    if (!gig) throw httpError(404, "This gig doesn't exist or was removed.");
    if (gig.status !== "OPEN") throw httpError(400, "This gig is closed for applications.");
    if ((user.ladderStage || 1) < gig.minStage)
      throw httpError(400, `This gig needs Earn Ladder Stage ${gig.minStage}. You're on Stage ${user.ladderStage || 1}. Keep climbing!`);
    if (db.find("gigApplications", (a) => a.gigId === gig.id && a.userId === user.id)) throw httpError(409, "You've already applied to this gig.");
    const pitch = String(body.pitch || "").trim();
    if (pitch.length < 30) throw httpError(400, "Write a pitch of at least 30 characters. Tell the client why you're a good fit.");
    const t = now();
    const app = db.insert("gigApplications", {
      gigId: gig.id,
      userId: user.id,
      status: "APPLIED",
      pitch: pitch.slice(0, 1500),
      submissionLink: null,
      submissionNote: null,
      feedback: null,
      createdAt: t,
      updatedAt: t,
    });
    db.update("gigs", gig.id, (g) => ({ applicantsCount: (g.applicantsCount || 0) + 1 }));
    notify(db, user.id, { type: "GIG", title: "Application sent", body: `Your pitch for "${gig.title}" is with the mentor. Expect a reply within 48 hours.`, link: `/app/gigs/${gig.id}` });
    if (gig.mentorId) notify(db, gig.mentorId, { type: "GIG", title: "New gig application", body: `${user.name} applied to "${gig.title}".`, link: `/app/gigs/${gig.id}` });
    return appView(db, app);
  },

  "POST /api/gig-applications/:id/submit": ({ user, params, body, db }) => {
    requireUser(user);
    const app = db.findById("gigApplications", params.id);
    if (!app || app.userId !== user.id) throw httpError(404, "Application not found.");
    if (!["ACCEPTED", "SUBMITTED"].includes(app.status)) throw httpError(400, "You can submit work only after you're accepted for this gig.");
    const submissionLink = cleanLink(body.submissionLink);
    if (!submissionLink) throw httpError(400, "Add a link to your work (Drive, GitHub, Figma, etc.).");
    const updated = db.update("gigApplications", app.id, {
      status: "SUBMITTED",
      submissionLink,
      submissionNote: String(body.submissionNote || "").trim().slice(0, 2000) || null,
      updatedAt: now(),
    });
    const gig = db.findById("gigs", app.gigId);
    notify(db, user.id, { type: "GIG", title: "Work submitted", body: `Your mentor will review "${gig?.title}" soon. Payout follows approval.`, link: `/app/gigs/${app.gigId}` });
    if (gig?.mentorId) notify(db, gig.mentorId, { type: "GIG", title: "Gig work ready for review", body: `${user.name} submitted work for "${gig.title}".`, link: `/app/gigs/${gig.id}` });
    return appView(db, updated);
  },

  "GET /api/me/gig-applications": ({ user, db }) => {
    requireUser(user);
    return db
      .filter("gigApplications", (a) => a.userId === user.id)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .map((a) => appView(db, a));
  },

  "GET /api/wallet": ({ user, db }) => {
    requireUser(user);
    const transactions = db.filter("walletTxns", (t) => t.userId === user.id).sort(byNewest);
    const deductedINR = -transactions.filter((t) => t.type === "COURSE_FEE_DEDUCTION").reduce((n, t) => n + t.amountINR, 0);
    const hasCourses = safe(() => db.filter("enrollments", (e) => e.userId === user.id).length, 0) > 0;
    const totalFeesINR = deductedINR > 0 || hasCourses || user.id === "u_student" ? PAY_LATER_FEE_INR : 0;
    const pendingWithdrawals = -transactions.filter((t) => t.status === "PENDING" && t.amountINR < 0).reduce((n, t) => n + t.amountINR, 0);
    const awaitingPayout = db
      .filter("gigApplications", (a) => a.userId === user.id && a.status === "APPROVED")
      .reduce((n, a) => n + (db.findById("gigs", a.gigId)?.payoutINR || 0), 0);
    return {
      balanceINR: user.walletBalanceINR || 0,
      lifetimeEarnedINR: user.lifetimeEarnedINR || 0,
      pendingINR: pendingWithdrawals + awaitingPayout,
      payLater: {
        totalFeesINR,
        deductedINR: Math.min(deductedINR, totalFeesINR || deductedINR),
        remainingINR: Math.max(0, totalFeesINR - deductedINR),
        deductionPercent: DEDUCTION_PERCENT,
      },
      transactions,
    };
  },

  "POST /api/wallet/withdraw": ({ user, body, db }) => {
    requireUser(user);
    const amount = Math.floor(Number(body.amountINR));
    const upiId = String(body.upiId || "").trim();
    if (!Number.isFinite(amount) || amount < 100) throw httpError(400, "The minimum withdrawal is ₹100.");
    if (amount > (user.walletBalanceINR || 0)) throw httpError(400, `You can withdraw up to ${formatINR(user.walletBalanceINR || 0)}.`);
    if (!/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/.test(upiId)) throw httpError(400, "Enter a valid UPI ID, like name@okaxis.");
    const txn = db.insert("walletTxns", { userId: user.id, type: "WITHDRAWAL", amountINR: -amount, note: `To UPI ${upiId}`, status: "PENDING" });
    db.update("users", user.id, (u) => ({ walletBalanceINR: (u.walletBalanceINR || 0) - amount }));
    notify(db, user.id, { type: "SYSTEM", title: `Withdrawal of ${formatINR(amount)} started`, body: `It usually reaches ${upiId} within 24 hours.`, link: "/app/wallet" });
    return txn;
  },

  "GET /api/leaderboard": ({ user, query, db }) => {
    const season = currentSeason(db);
    const period = query.period === "all" ? "all" : "season";
    const filters = { period, track: query.track || "", city: query.city || "" };

    if (query.scope === "colleges") {
      const ranked = collegeRanking(db, filters);
      const items = ranked.slice(0, 100).map((x) => ({
        rank: x.college.rank,
        change: period === "season" ? x.c.rankChange || 0 : 0,
        points: x.points,
        division: divisionFor(x.avg),
        college: x.college,
      }));
      let me;
      if (user?.collegeId) {
        const mine = ranked.find((x) => x.c.id === user.collegeId);
        if (mine) me = { rank: mine.college.rank, points: mine.points, division: divisionFor(mine.avg) };
      }
      return { season, items, ...(me ? { me } : {}) };
    }

    const ranked = studentRanking(db, { ...filters, collegeId: query.collegeId || "" });
    const items = ranked.slice(0, 100).map((x, i) => ({
      rank: i + 1,
      change: period === "season" ? studentChange(season.id, x.u.id) : 0,
      points: x.points,
      division: divisionFor(x.u.seasonPoints || 0),
      user: listUser(x.u),
    }));
    let me;
    if (user) {
      const i = ranked.findIndex((x) => x.u.id === user.id);
      if (i !== -1) me = { rank: i + 1, points: ranked[i].points, division: divisionFor(user.seasonPoints || 0) };
    }
    return { season, items, ...(me ? { me } : {}) };
  },

  "GET /api/colleges/:id": ({ params, db }) => {
    const college = db.findById("colleges", params.id);
    if (!college) throw httpError(404, "College not found.");
    const ranked = collegeWithRank(db, college);
    const members = db.filter("users", (u) => u.role === "STUDENT" && u.collegeId === college.id).sort((a, b) => (b.seasonPoints || 0) - (a.seasonPoints || 0));
    const counts = new Map();
    members.forEach((m) => (m.skills || []).forEach((s) => counts.set(s, (counts.get(s) || 0) + 1)));
    db.filter("portfolioItems", (p) => p.verified && members.some((m) => m.id === p.userId)).forEach((p) => (p.skills || []).forEach((s) => counts.set(s, (counts.get(s) || 0) + 1)));
    const skillsBreakdown = [...counts.entries()].map(([skill, count]) => ({ skill, count })).sort((a, b) => b.count - a.count).slice(0, 8);
    const total = ranked.totalPoints || 0;
    const monthlyPoints = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      const noise = 0.88 + (hash(`${college.id}:${i}`) % 25) / 100;
      const points = i === 5 ? total : Math.round(total * (0.42 + i * 0.11) * noise);
      return { month: d.toLocaleDateString("en-IN", { month: "short" }), points };
    });
    return {
      ...ranked,
      topStudents: members.slice(0, 8).map(listUser),
      skillsBreakdown,
      monthlyPoints,
    };
  },

  "GET /api/me/points": ({ user, db }) => {
    requireUser(user);
    return db.filter("pointsEvents", (e) => e.userId === user.id).sort(byNewest);
  },

  "GET /api/me/portfolio": ({ user, db }) => {
    requireUser(user);
    return db.filter("portfolioItems", (p) => p.userId === user.id).sort(byNewest);
  },

  "POST /api/me/portfolio": ({ user, body, db }) => {
    requireUser(user);
    const title = String(body.title || "").trim();
    if (title.length < 3) throw httpError(400, "Give your project a title (at least 3 characters).");
    const count = db.filter("portfolioItems", (p) => p.userId === user.id).length;
    return db.insert("portfolioItems", {
      userId: user.id,
      title: title.slice(0, 120),
      description: String(body.description || "").trim().slice(0, 1000),
      link: cleanLink(body.link),
      cover: COVERS[(hash(title) + count) % COVERS.length],
      skills: cleanSkills(body.skills),
      verified: false,
      source: "PERSONAL",
    });
  },

  "PATCH /api/me/portfolio/:id": ({ user, params, body, db }) => {
    requireUser(user);
    ownPortfolioItem(db, user, params.id);
    const patch = {};
    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (title.length < 3) throw httpError(400, "Give your project a title (at least 3 characters).");
      patch.title = title.slice(0, 120);
    }
    if (body.description !== undefined) patch.description = String(body.description).trim().slice(0, 1000);
    if (body.link !== undefined) patch.link = cleanLink(body.link);
    if (body.skills !== undefined) patch.skills = cleanSkills(body.skills);
    return db.update("portfolioItems", params.id, patch);
  },

  "DELETE /api/me/portfolio/:id": ({ user, params, db }) => {
    requireUser(user);
    ownPortfolioItem(db, user, params.id);
    db.remove("portfolioItems", params.id);
    return { ok: true };
  },

  "GET /api/u/:username": ({ params, db }) => {
    const handle = String(params.username || "").toLowerCase();
    const u = db.find("users", (x) => (x.username || "").toLowerCase() === handle && x.status !== "SUSPENDED");
    if (!u) throw httpError(404, "We couldn't find a Skill Passport with that username.");
    const portfolio = db.filter("portfolioItems", (p) => p.userId === u.id).sort((a, b) => Number(b.verified) - Number(a.verified) || byNewest(a, b));
    const certificates = safe(() => db.filter("certificates", (c) => c.userId === u.id), []).sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
    const badges = db
      .filter("userBadges", (b) => b.userId === u.id)
      .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
      .map(({ id, key, title, description, icon, earnedAt }) => ({ id, key, title, description, icon, earnedAt }));
    const enrollments = safe(() => db.filter("enrollments", (e) => e.userId === u.id), []);
    const gigsCompleted = db.filter("gigApplications", (a) => a.userId === u.id && DONE_STATUSES.includes(a.status)).length;
    const helpfulAnswers = Math.max(
      safe(() => db.filter("replies", (r) => r.authorId === u.id && r.isAccepted).length, 0),
      db.filter("pointsEvents", (e) => e.userId === u.id && e.source === "HELP" && e.points > 0).length,
    );
    let seasonRank = null;
    if (u.role === "STUDENT") {
      const i = studentRanking(db).findIndex((x) => x.u.id === u.id);
      seasonRank = i === -1 ? null : i + 1;
    }
    const collegeRec = u.collegeId ? db.findById("colleges", u.collegeId) : null;
    const flags = demoFlags(db);
    const at = Date.now();
    const verifications = db
      .filter("skillVerifications", (v) => v.userId === u.id && v.status === "ACTIVE" && (!v.expiresAt || new Date(v.expiresAt).getTime() > at))
      .sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt))
      .map((v) => {
        const s = db.findById("skills", v.skillId);
        return { skill: s ? { slug: s.slug, name: s.name } : null, level: v.level, awardedAt: v.awardedAt, expiresAt: v.expiresAt ?? null, verifyCode: v.verifyCode };
      });
    const verifiedNames = new Set(verifications.map((v) => v.skill?.name?.trim()).filter(Boolean));
    return {
      user: passportUser(u),
      college: collegeRec ? collegeWithRank(db, collegeRec) : null,
      stats: {
        coursesCompleted: Math.max(enrollments.filter((e) => e.completedAt).length, certificates.length),
        gigsCompleted: flags.gigs ? gigsCompleted : null,
        earnedINR: flags.wallet ? u.lifetimeEarnedINR || 0 : null,
        seasonRank: flags.gamification ? seasonRank : null,
        helpfulAnswers,
      },
      portfolio,
      certificates,
      badges: flags.gamification ? badges : [],
      verifications,
      skills: deriveSkills(db, u, portfolio, certificates, verifiedNames),
      preparationRecord: preparationRecord(db, u),
    };
  },
};
