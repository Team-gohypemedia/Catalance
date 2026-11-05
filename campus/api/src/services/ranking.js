import { prisma } from "../lib/prisma.js";
import { divisionFor } from "../lib/points.js";
import { stableHash } from "../lib/util.js";

/** Students who appear on leaderboards (mirrors the demo: role STUDENT, not suspended). */
export const RANKED_STUDENT = { role: "STUDENT", status: { not: "SUSPENDED" } };

const ci = (v) => ({ equals: v, mode: "insensitive" });

/** Prisma `where` for student leaderboard filters. */
export function studentWhere({ track, city, collegeId } = {}) {
  return {
    ...RANKED_STUDENT,
    ...(track ? { interests: { has: track } } : {}),
    ...(city ? { city: ci(city) } : {}),
    ...(collegeId ? { collegeId } : {}),
  };
}

/** 1-based rank of a user among students matching `where` by the given points field. */
export async function studentRank(user, { field = "seasonPoints", where = {} } = {}) {
  const points = user[field] || 0;
  const ahead = await prisma.user.count({
    where: { ...RANKED_STUDENT, ...where, id: { not: user.id }, [field]: { gt: points } },
  });
  return ahead + 1;
}

/** Deterministic weekly arrow for a student in a season (same formula as the demo). */
export const studentChange = (seasonId, userId) => {
  const h = stableHash(`${seasonId}:${userId}`);
  return h % 4 === 0 ? 0 : (h % 11) - 5;
};

/** Current season: running now → status ACTIVE → highest number; synthesized if the table is empty. */
export async function currentSeason() {
  const now = new Date();
  const s =
    (await prisma.season.findFirst({ where: { startsAt: { lte: now }, endsAt: { gt: now } }, orderBy: { number: "desc" } })) ||
    (await prisma.season.findFirst({ where: { status: "ACTIVE" }, orderBy: { number: "desc" } })) ||
    (await prisma.season.findFirst({ orderBy: { number: "desc" } }));
  if (s) return { id: s.id, name: s.name, number: s.number, startsAt: s.startsAt, endsAt: s.endsAt };
  return { id: "season_current", name: "Current season", number: 1, startsAt: now, endsAt: now };
}

/**
 * College standings from live student points (mirrors the demo's collegeRanking).
 * Returns [{ c, points, avg, college }] where `college` carries live totalPoints/avgPoints/rank.
 */
export async function collegeRanking({ period = "season", track, city } = {}) {
  const field = period === "all" ? "lifetimePoints" : "seasonPoints";
  const [groups, colleges] = await Promise.all([
    prisma.user.groupBy({
      by: ["collegeId"],
      where: { role: "STUDENT", collegeId: { not: null }, ...(track ? { interests: { has: track } } : {}) },
      _sum: { [field]: true },
      _count: { _all: true },
    }),
    prisma.college.findMany({ where: city ? { city: ci(city) } : {} }),
  ]);
  const byCollege = new Map(groups.map((g) => [g.collegeId, { points: g._sum[field] || 0, members: g._count._all }]));
  return colleges
    .map((c) => {
      const e = byCollege.get(c.id) || { points: 0, members: 0 };
      return { c, points: e.points, avg: e.members ? Math.round(e.points / e.members) : 0 };
    })
    .filter((x) => x.points > 0 || !track)
    .sort((a, b) => b.points - a.points || a.c.name.localeCompare(b.c.name))
    .map((x, i) => ({ ...x, college: { ...x.c, totalPoints: x.points, avgPoints: x.avg, rank: i + 1 } }));
}

/** College with its live national rank (season, no filters). */
export async function collegeWithRank(college) {
  const r = (await collegeRanking()).find((x) => x.c.id === college.id);
  return r ? r.college : college;
}

export { divisionFor };
