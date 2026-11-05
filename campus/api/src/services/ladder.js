import { prisma } from "../lib/prisma.js";
import { notify } from "../lib/notify.js";
import { awardPoints, DIVISIONS } from "../lib/points.js";

/** Mirrors the demo engine (campus/web/src/mocks/handlers/earn.js) ladder exactly. */

const formatINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const DONE_STATUSES = ["APPROVED", "PAID"];

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

async function metrics(user) {
  const uid = user.id;
  const [enrollments, submissions, reviewedSubs, certificates, eventCounts, apps, portfolio] = await Promise.all([
    prisma.enrollment.findMany({ where: { userId: uid }, select: { completedLessonIds: true, completedAt: true } }),
    prisma.submission.count({ where: { userId: uid } }),
    prisma.submission.count({ where: { userId: uid, status: "REVIEWED" } }),
    prisma.certificate.count({ where: { userId: uid } }),
    prisma.pointsEvent.groupBy({ by: ["source"], where: { userId: uid, points: { gt: 0 } }, _count: { _all: true } }),
    prisma.gigApplication.findMany({ where: { userId: uid, status: { in: DONE_STATUSES } }, select: { gig: { select: { minStage: true } } } }),
    prisma.portfolioItem.findMany({ where: { userId: uid }, select: { verified: true, source: true } }),
  ]);
  const count = (src) => eventCounts.find((e) => e.source === src)?._count._all || 0;
  const lessonsFromEnrollments = enrollments.reduce((n, e) => n + (e.completedLessonIds?.length || 0), 0);
  return {
    enrolled: enrollments.length,
    lessons: Math.max(lessonsFromEnrollments, count("LESSON")),
    quizzes: count("QUIZ"),
    assignments: Math.max(submissions, count("ASSIGNMENT")),
    reviewed: Math.max(reviewedSubs, portfolio.filter((p) => p.source === "ASSIGNMENT" && p.verified).length),
    coursesCompleted: Math.max(enrollments.filter((e) => e.completedAt).length, certificates),
    gigsApproved: apps.length,
    realProjects: apps.filter((a) => (a.gig?.minStage || 3) >= 4).length,
    earned: user.lifetimeEarnedINR || 0,
    verifiedPortfolio: portfolio.filter((p) => p.verified).length,
    seasonPoints: user.seasonPoints || 0,
  };
}

/** Promote from stage `from` to `to`, paying each completed stage's rewards. */
async function promote(user, from, to) {
  await prisma.$transaction(async (tx) => {
    for (let s = from; s < to; s++) {
      const def = STAGES[s - 1];
      await awardPoints(user.id, def.rewardPoints, "BONUS", `Earn Ladder · completed Stage ${s} (${def.title})`, tx);
      if (def.rewardINR) {
        await tx.walletTxn.create({
          data: { userId: user.id, type: "BONUS", amountINR: def.rewardINR, note: `Ladder bonus · reached Stage ${s + 1} (${STAGES[s].title})`, status: "COMPLETED" },
        });
        await tx.user.update({
          where: { id: user.id },
          data: { walletBalanceINR: { increment: def.rewardINR }, lifetimeEarnedINR: { increment: def.rewardINR } },
        });
      }
    }
    await tx.user.update({ where: { id: user.id }, data: { ladderStage: to } });
    await notify(
      user.id,
      { type: "RANK", title: `You climbed to Stage ${to}: ${STAGES[to - 1].title} 🚀`, body: `New on your ladder: ${STAGES[to - 1].description}`, link: "/app/ladder" },
      tx,
    );
  });
}

/** GET /api/ladder payload. Promotes the user (never demotes) when stages are complete. */
export async function computeLadder(user) {
  const m = await metrics(user);
  const built = STAGES.map((s) => {
    const requirements = s.reqs(m).map((r) => ({ ...r, current: Math.min(r.current, r.target * 10), done: r.current >= r.target }));
    return { ...s, requirements, allDone: requirements.every((r) => r.done) };
  });
  let computed = 1;
  for (const s of built) {
    if (s.allDone && s.stage < 5) computed = s.stage + 1;
    else break;
  }
  const hiredDone = built[4].allDone && computed === 5;
  const stored = user.ladderStage || 1;
  if (computed > stored) await promote(user, stored, computed);
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
}
