import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate, zQ, zQEnum, zBool } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";
import { notify } from "../lib/notify.js";
import { gigOut, applicationOut, GIG_INCLUDE } from "../lib/serialize.js";
import { requireFlag } from "../lib/settings.js";

const router = Router();
// spec §2 feature flag (F1): the whole area 404s while the flag is off (mounted at root, so scope by path)
router.use(["/api/gigs", "/api/gig-applications", "/api/me/gig-applications"], requireFlag("gigs"));

const listQuery = z
  .object({
    category: zQ,
    q: zQ,
    difficulty: zQEnum(["EASY", "MEDIUM", "HARD"]),
    eligible: zBool.optional(),
  })
  .passthrough();

router.get("/api/gigs", requireAuth, validate({ query: listQuery }), async (req, res) => {
  const { category, q, difficulty, eligible } = req.q;
  const stage = req.user.ladderStage || 1;
  let gigs = await prisma.gig.findMany({
    where: {
      status: "OPEN",
      ...(category ? { category } : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(eligible ? { minStage: { lte: stage } } : {}),
    },
    include: GIG_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  if (q) {
    const needle = q.toLowerCase();
    gigs = gigs.filter((g) => `${g.title} ${g.company?.name || ""} ${(g.skills || []).join(" ")} ${g.category}`.toLowerCase().includes(needle));
  }
  const mine = await prisma.gigApplication.findMany({ where: { userId: req.user.id, gigId: { in: gigs.map((g) => g.id) } } });
  const byGig = new Map(mine.map((a) => [a.gigId, a]));
  res.json(gigs.map((g) => gigOut(g, byGig.get(g.id) || null)));
});

async function getGig(id) {
  const gig = await prisma.gig.findUnique({ where: { id }, include: GIG_INCLUDE });
  if (!gig) throw httpError(404, "This gig doesn't exist or was removed.");
  return gig;
}

router.get("/api/gigs/:id", requireAuth, async (req, res) => {
  const gig = await getGig(req.params.id);
  const mine = await prisma.gigApplication.findUnique({ where: { gigId_userId: { gigId: gig.id, userId: req.user.id } } });
  res.json(gigOut(gig, mine));
});

const applySchema = z.object({
  pitch: z
    .string({ required_error: "Write a pitch of at least 30 characters. Tell the client why you're a good fit." })
    .trim()
    .min(30, "Write a pitch of at least 30 characters. Tell the client why you're a good fit.")
    .transform((s) => s.slice(0, 1500)),
});

router.post("/api/gigs/:id/apply", requireAuth, async (req, res, next) => {
  // stage / status checks come before pitch validation, like the demo engine
  const gig = await getGig(req.params.id);
  const user = req.user;
  if (gig.status !== "OPEN") throw httpError(400, "This gig is closed for applications.");
  const stage = user.ladderStage || 1;
  if (stage < gig.minStage) {
    throw httpError(400, `This gig needs Earn Ladder Stage ${gig.minStage}. You're on Stage ${stage}. Keep climbing!`);
  }
  if (await prisma.gigApplication.findUnique({ where: { gigId_userId: { gigId: gig.id, userId: user.id } } })) {
    throw httpError(409, "You've already applied to this gig.");
  }
  let pitch;
  try {
    pitch = applySchema.parse(req.body ?? {}).pitch;
  } catch (err) {
    return next(err);
  }
  const app = await prisma.$transaction(async (tx) => {
    const created = await tx.gigApplication.create({ data: { gigId: gig.id, userId: user.id, pitch }, include: { gig: { include: GIG_INCLUDE } } });
    await tx.gig.update({ where: { id: gig.id }, data: { applicantsCount: { increment: 1 } } });
    await notify(user.id, { type: "GIG", title: "Application sent ✉️", body: `Your pitch for "${gig.title}" is with the mentor. Expect a reply within 48 hours.`, link: `/app/gigs/${gig.id}` }, tx);
    if (gig.mentorId) {
      await notify(gig.mentorId, { type: "GIG", title: "New gig application", body: `${user.name} applied to "${gig.title}".`, link: `/app/gigs/${gig.id}` }, tx);
    }
    return created;
  });
  res.status(201).json(applicationOut(app));
});

const submitSchema = z.object({
  submissionLink: z
    .string({ required_error: "Add a link to your work (Drive, GitHub, Figma, etc.)." })
    .trim()
    .min(1, "Add a link to your work (Drive, GitHub, Figma, etc.).")
    .regex(/^https?:\/\/\S+\.\S+/, "Links need to start with https:// (e.g. https://github.com/you/project)."),
  submissionNote: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => v || null),
});

router.post("/api/gig-applications/:id/submit", requireAuth, validate({ body: submitSchema }), async (req, res) => {
  const app = await prisma.gigApplication.findUnique({ where: { id: req.params.id }, include: { gig: true } });
  if (!app || app.userId !== req.user.id) throw httpError(404, "Application not found.");
  if (!["ACCEPTED", "SUBMITTED"].includes(app.status)) throw httpError(400, "You can submit work only after you're accepted for this gig.");
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.gigApplication.update({
      where: { id: app.id },
      data: { status: "SUBMITTED", submissionLink: req.body.submissionLink, submissionNote: req.body.submissionNote },
      include: { gig: { include: GIG_INCLUDE } },
    });
    await notify(req.user.id, { type: "GIG", title: "Work submitted 🎯", body: `Your mentor will review "${app.gig?.title}" soon. Payout follows approval.`, link: `/app/gigs/${app.gigId}` }, tx);
    if (app.gig?.mentorId) {
      await notify(app.gig.mentorId, { type: "GIG", title: "Gig work ready for review", body: `${req.user.name} submitted work for "${app.gig.title}".`, link: `/app/gigs/${app.gigId}` }, tx);
    }
    return u;
  });
  res.json(applicationOut(updated));
});

router.get("/api/me/gig-applications", requireAuth, async (req, res) => {
  const apps = await prisma.gigApplication.findMany({
    where: { userId: req.user.id },
    include: { gig: { include: GIG_INCLUDE } },
    orderBy: { updatedAt: "desc" },
  });
  res.json(apps.map((a) => applicationOut(a)));
});

export default router;
