import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";
import { notify } from "../lib/notify.js";
import { cohortOut, cohortPostOut, COHORT_INCLUDE, USER_INCLUDE } from "../lib/serialize.js";
import { requireFlag } from "../lib/settings.js";

const router = Router();
// spec §2 feature flag (F1): the whole area 404s while the flag is off (mounted at root, so scope by path)
router.use("/api/cohorts", requireFlag("cohorts"));

async function getCohort(id) {
  const c = await prisma.cohort.findUnique({ where: { id }, include: COHORT_INCLUDE });
  if (!c) throw httpError(404, "Cohort not found.");
  return c;
}

/** Cohort detail: members, schedule and posts (newest first). */
async function cohortDetail(id, userId) {
  const [c, members, posts] = await Promise.all([
    getCohort(id),
    prisma.cohortMember.findMany({ where: { cohortId: id }, include: { user: { include: USER_INCLUDE } }, orderBy: { joinedAt: "asc" } }),
    prisma.cohortPost.findMany({ where: { cohortId: id }, include: { author: { include: USER_INCLUDE } }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return {
    ...cohortOut(c, { isMember: members.some((m) => m.userId === userId), members: members.map((m) => m.user) }),
    posts: posts.map(cohortPostOut),
  };
}

router.get("/api/cohorts", requireAuth, async (req, res) => {
  const [cohorts, mine] = await Promise.all([
    prisma.cohort.findMany({ include: COHORT_INCLUDE, orderBy: { startDate: "desc" } }),
    prisma.cohortMember.findMany({ where: { userId: req.user.id }, select: { cohortId: true } }),
  ]);
  const member = new Set(mine.map((m) => m.cohortId));
  res.json(cohorts.map((c) => cohortOut(c, { isMember: member.has(c.id) })));
});

router.get("/api/cohorts/:id", requireAuth, async (req, res) => {
  res.json(await cohortDetail(req.params.id, req.user.id));
});

router.post("/api/cohorts/:id/join", requireAuth, async (req, res) => {
  const c = await getCohort(req.params.id);
  const existing = await prisma.cohortMember.findUnique({ where: { cohortId_userId: { cohortId: c.id, userId: req.user.id } } });
  if (!existing) {
    if ((c._count?.members || 0) >= c.maxMembers) throw httpError(409, "This cohort is full. Try the next batch!");
    await prisma.$transaction(async (tx) => {
      await tx.cohortMember.create({ data: { cohortId: c.id, userId: req.user.id } });
      await notify(req.user.id, { type: "COMMUNITY", title: `You joined ${c.title} 🎉`, body: `Sessions: ${c.schedule}. Say hi in the cohort feed!`, link: `/app/cohorts/${c.id}` }, tx);
    });
  }
  res.json(await cohortDetail(c.id, req.user.id));
});

router.post("/api/cohorts/:id/leave", requireAuth, async (req, res) => {
  const c = await getCohort(req.params.id);
  await prisma.cohortMember.deleteMany({ where: { cohortId: c.id, userId: req.user.id } });
  res.json(await cohortDetail(c.id, req.user.id));
});

const postSchema = z.object({
  body: z
    .string({ required_error: "Write something first." })
    .trim()
    .min(1, "Write something first.")
    .transform((s) => s.slice(0, 2000)),
});

router.post("/api/cohorts/:id/posts", requireAuth, validate({ body: postSchema }), async (req, res) => {
  const c = await getCohort(req.params.id);
  const isMember = await prisma.cohortMember.findUnique({ where: { cohortId_userId: { cohortId: c.id, userId: req.user.id } } });
  if (!isMember && c.leadMentorId !== req.user.id && req.user.role !== "ADMIN") throw httpError(403, "Join the cohort to post in its feed.");
  const post = await prisma.cohortPost.create({
    data: { cohortId: c.id, authorId: req.user.id, body: req.body.body },
    include: { author: { include: USER_INCLUDE } },
  });
  res.status(201).json(cohortPostOut(post));
});

export default router;
