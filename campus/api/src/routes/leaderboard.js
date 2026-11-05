import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate, zQ } from "../lib/validate.js";
import { optionalAuth } from "../lib/auth.js";
import { divisionFor } from "../lib/points.js";
import { peerUser, collegeOut, USER_INCLUDE } from "../lib/serialize.js";
import { currentSeason, collegeRanking, studentWhere, studentChange, studentRank } from "../services/ranking.js";
import { requireFlag } from "../lib/settings.js";

const router = Router();
// spec §2 feature flag (F1): the whole area 404s while the flag is off (mounted at root, so scope by path)
router.use("/api/leaderboard", requireFlag("gamification"));

const query = z
  .object({
    scope: z.string().optional(),
    period: z.string().optional(),
    track: zQ,
    city: zQ,
    collegeId: zQ,
  })
  .passthrough();

router.get("/api/leaderboard", optionalAuth, validate({ query }), async (req, res) => {
  const user = req.user;
  const season = await currentSeason();
  const period = req.q.period === "all" ? "all" : "season";
  const { track, city, collegeId } = req.q;

  if (req.q.scope === "colleges") {
    const ranked = await collegeRanking({ period, track, city });
    const items = ranked.slice(0, 100).map((x) => ({
      rank: x.college.rank,
      change: period === "season" ? x.c.rankChange || 0 : 0,
      points: x.points,
      division: divisionFor(x.avg),
      college: collegeOut(x.college),
    }));
    const out = { season, items };
    if (user?.collegeId) {
      const mine = ranked.find((x) => x.c.id === user.collegeId);
      if (mine) out.me = { rank: mine.college.rank, points: mine.points, division: divisionFor(mine.avg) };
    }
    return res.json(out);
  }

  const field = period === "all" ? "lifetimePoints" : "seasonPoints";
  const where = studentWhere({ track, city, collegeId });
  const students = await prisma.user.findMany({
    where,
    include: USER_INCLUDE,
    orderBy: [{ [field]: "desc" }, { name: "asc" }],
    take: 100,
  });
  const items = students.map((u, i) => ({
    rank: i + 1,
    change: period === "season" ? studentChange(season.id, u.id) : 0,
    points: u[field] || 0,
    division: divisionFor(u.seasonPoints || 0),
    user: peerUser(u),
  }));
  const out = { season, items };
  if (user) {
    const inList = await prisma.user.count({ where: { ...where, id: user.id } });
    if (inList) {
      const listed = items.find((x) => x.user.id === user.id);
      out.me = {
        rank: listed ? listed.rank : await studentRank(user, { field, where }),
        points: user[field] || 0,
        division: divisionFor(user.seasonPoints || 0),
      };
    }
  }
  res.json(out);
});

export default router;
