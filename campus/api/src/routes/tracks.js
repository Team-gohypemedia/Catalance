import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate, zQEnum } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { optionalAuth } from "../lib/auth.js";
import { trackOut, courseOut, COURSE_INCLUDE } from "../lib/serialize.js";
import { PUBLISHED, enrollmentMap } from "../services/courses.js";

const router = Router();

const COURSE_COUNT_SELECT = { where: PUBLISHED, select: { id: true, studentsCount: true }, orderBy: { createdAt: "asc" } };

const tracksQuery = z
  .object({
    category: zQEnum(["TECH", "NON_TECH"]),
    audience: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .transform((v) => (v === "aspirants" || v === "aspirant" ? "aspirants" : undefined)),
  })
  .passthrough();

router.get("/api/tracks", validate({ query: tracksQuery }), async (req, res) => {
  const where = {};
  if (req.q.category) where.category = req.q.category;
  if (req.q.audience === "aspirants") where.forAspirants = true;
  const tracks = await prisma.track.findMany({
    where,
    include: { courses: COURSE_COUNT_SELECT },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  res.json(tracks.map((t) => trackOut(t, t.courses)));
});

router.get("/api/tracks/:slug", optionalAuth, async (req, res) => {
  const slug = req.params.slug;
  const track = await prisma.track.findFirst({ where: { OR: [{ slug }, { id: slug }] } });
  if (!track) throw httpError(404, "Track not found.");
  const courses = await prisma.course.findMany({
    where: { ...PUBLISHED, trackId: track.id },
    include: COURSE_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  const enr = await enrollmentMap(req.user?.id, courses.map((c) => c.id));
  res.json({
    ...trackOut(track, courses),
    courses: courses.map((c) => courseOut(c, { enrollment: enr.get(c.id) || null })),
  });
});

export default router;
