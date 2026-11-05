import { prisma } from "./prisma.js";
import { getFlags } from "./settings.js";

/** Must match DIVISIONS in campus/web/src/lib/utils.js */
export const DIVISIONS = {
  BRONZE: { label: "Bronze", min: 0 },
  SILVER: { label: "Silver", min: 500 },
  GOLD: { label: "Gold", min: 1500 },
  PLATINUM: { label: "Platinum", min: 3500 },
  DIAMOND: { label: "Diamond", min: 7000 },
};

export const divisionFor = (points = 0) =>
  Object.entries(DIVISIONS).reduce((acc, [key, d]) => (points >= d.min ? key : acc), "BRONZE");

/** Points needed for the next division, or null at the top. */
export const nextDivisionAt = (points = 0) => {
  const next = Object.values(DIVISIONS).find((d) => d.min > points);
  return next ? next.min : null;
};

/** Must match POINTS in campus/web/src/mocks/points.js */
export const POINTS = {
  LESSON: 20,
  QUIZ_PASS: 40,
  QUIZ_PERFECT_BONUS: 20,
  ASSIGNMENT_SUBMIT: 60,
  ASSIGNMENT_REVIEWED_PER_SCORE: 1, // + score (0-100)
  COURSE_COMPLETE: 250,
  GIG_APPROVED: 400,
  ANSWER_ACCEPTED: 50,
  REPLY_POSTED: 5,
  STREAK_DAY: 10,
};

async function apply(tx, userId, points, source, note) {
  await tx.pointsEvent.create({ data: { userId, source, points, note: note || "" } });
  const u = await tx.user.findUnique({ where: { id: userId } });
  const seasonPoints = Math.max(0, (u.seasonPoints || 0) + points);
  const previous = u.division;
  const division = divisionFor(seasonPoints);
  const updated = await tx.user.update({
    where: { id: userId },
    data: {
      seasonPoints,
      lifetimePoints: Math.max(0, (u.lifetimePoints || 0) + points),
      xp: Math.max(0, (u.xp || 0) + points),
      coins: Math.max(0, (u.coins || 0) + Math.round(points / 10)),
      division,
    },
  });
  if (DIVISIONS[division].min > DIVISIONS[previous].min) {
    await tx.notification.create({
      data: {
        userId,
        type: "RANK",
        title: `You reached ${DIVISIONS[division].label} 🏆`,
        body: `${seasonPoints} season points. Keep going to climb the leaderboard.`,
        link: "/app/leaderboard",
      },
    });
  }
  return updated;
}

/**
 * Award (or remove, with negative points) season points.
 * Inserts a PointsEvent, bumps seasonPoints/lifetimePoints/xp/coins and recomputes division.
 * Pass `tx` to join an existing transaction.
 */
export async function awardPoints(userId, points, source, note, tx) {
  // Gamification is off for the MVP (spec §2); nothing accrues while it's hidden, so turning it on starts clean.
  if (!points || !(await getFlags()).gamification) return (tx || prisma).user.findUnique({ where: { id: userId } });
  if (tx) return apply(tx, userId, points, source, note);
  return prisma.$transaction((t) => apply(t, userId, points, source, note));
}

const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

/**
 * Daily streak: the first learning activity of a day extends (or resets) the streak
 * and awards STREAK_DAY points when the streak continues. Returns points awarded.
 */
export async function touchStreak(userId, tx) {
  if (!(await getFlags()).gamification) return 0;
  const run = async (t) => {
    const u = await t.user.findUnique({ where: { id: userId } });
    const today = dayKey(Date.now());
    if (u.lastActiveAt && dayKey(u.lastActiveAt) === today) return 0;
    const yesterday = dayKey(Date.now() - 86400000);
    const streak = u.lastActiveAt && dayKey(u.lastActiveAt) === yesterday ? (u.streak || 0) + 1 : 1;
    await t.user.update({
      where: { id: userId },
      data: { streak, longestStreak: Math.max(u.longestStreak || 0, streak), lastActiveAt: new Date() },
    });
    if (streak > 1) {
      await apply(t, userId, POINTS.STREAK_DAY, "STREAK", `${streak}-day streak`);
      return POINTS.STREAK_DAY;
    }
    return 0;
  };
  return tx ? run(tx) : prisma.$transaction(run);
}
