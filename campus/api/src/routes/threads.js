import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate, zQ } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";
import { awardPoints, POINTS } from "../lib/points.js";
import { notify } from "../lib/notify.js";
import { threadOut, replyOut, miniUser, THREAD_INCLUDE, USER_INCLUDE } from "../lib/serialize.js";
import { requireFlag } from "../lib/settings.js";

const router = Router();
// spec §2 feature flag (F1): the whole area 404s while the flag is off (mounted at root, so scope by path)
router.use(["/api/threads", "/api/replies", "/api/community"], requireFlag("community"));
const REPLY_INCLUDE = { author: { include: USER_INCLUDE } };

async function votedSet(userId, targetType, ids) {
  if (!ids.length) return new Set();
  const votes = await prisma.vote.findMany({ where: { userId, targetType, targetId: { in: ids } }, select: { targetId: true } });
  return new Set(votes.map((v) => v.targetId));
}

async function getThread(id) {
  const t = await prisma.thread.findUnique({ where: { id }, include: THREAD_INCLUDE });
  if (!t) throw httpError(404, "That doubt doesn't exist (or was removed).");
  return t;
}

const normTag = (t) =>
  String(t || "")
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/[^a-z0-9+#.\- ]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 24);

const listQuery = z
  .object({
    tag: zQ,
    track: zQ,
    q: zQ,
    filter: z.enum(["all", "unanswered", "solved", "mine"]).optional().catch("all"),
    sort: z.enum(["new", "top"]).optional().catch("new"),
  })
  .passthrough();

router.get("/api/threads", requireAuth, validate({ query: listQuery }), async (req, res) => {
  const { tag, track, q, filter = "all", sort = "new" } = req.q;
  const where = {};
  if (tag) where.tags = { has: tag.toLowerCase() };
  if (track) where.trackId = { in: [track, `t_${track}`] };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
      { tags: { has: q.toLowerCase() } },
    ];
  }
  if (filter === "unanswered") where.replies = { none: {} };
  else if (filter === "solved") where.acceptedReplyId = { not: null };
  else if (filter === "mine") where.authorId = req.user.id;

  const threads = await prisma.thread.findMany({
    where,
    include: THREAD_INCLUDE,
    orderBy: sort === "top" ? [{ upvotes: "desc" }, { createdAt: "desc" }] : [{ createdAt: "desc" }],
    take: 200,
  });
  const voted = await votedSet(req.user.id, "THREAD", threads.map((t) => t.id));
  res.json(threads.map((t) => threadOut(t, voted.has(t.id))));
});

const createSchema = z.object({
  title: z
    .string({ required_error: "Give your doubt a clear title (at least 8 characters)." })
    .trim()
    .min(8, "Give your doubt a clear title (at least 8 characters).")
    .transform((s) => s.slice(0, 160)),
  body: z.string({ required_error: "Add a few more details so people can help you." }).trim().min(10, "Add a few more details so people can help you.").max(20000),
  tags: z
    .array(z.string())
    .optional()
    .default([])
    .transform((tags) => [...new Set(tags.map(normTag).filter(Boolean))].slice(0, 5)),
  trackId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => v || null),
});

router.post("/api/threads", requireAuth, validate({ body: createSchema }), async (req, res) => {
  let { trackId } = req.body;
  if (trackId) {
    const t = await prisma.track.findFirst({ where: { OR: [{ id: trackId }, { slug: trackId }, { id: `t_${trackId}` }] }, select: { id: true } });
    trackId = t?.id ?? null;
  }
  const thread = await prisma.thread.create({
    data: { authorId: req.user.id, title: req.body.title, body: req.body.body, tags: req.body.tags, trackId },
    include: THREAD_INCLUDE,
  });
  res.status(201).json(threadOut(thread, false));
});

router.get("/api/threads/:id", requireAuth, async (req, res) => {
  const t = await getThread(req.params.id);
  const replies = await prisma.reply.findMany({ where: { threadId: t.id }, include: REPLY_INCLUDE, orderBy: { createdAt: "asc" } });
  const [tVoted, rVoted] = await Promise.all([
    votedSet(req.user.id, "THREAD", [t.id]),
    votedSet(req.user.id, "REPLY", replies.map((r) => r.id)),
  ]);
  const shaped = replies
    .map((r) => replyOut({ ...r, isAccepted: t.acceptedReplyId === r.id }, rVoted.has(r.id)))
    .sort((a, b) => Number(b.isAccepted) - Number(a.isAccepted));
  res.json({ ...threadOut(t, tVoted.has(t.id)), replies: shaped });
});

const replySchema = z.object({ body: z.string({ required_error: "Your reply is empty." }).trim().min(2, "Your reply is empty.").max(20000) });

router.post("/api/threads/:id/replies", requireAuth, validate({ body: replySchema }), async (req, res) => {
  const t = await getThread(req.params.id);
  const user = req.user;
  const text = req.body.body;
  const reply = await prisma.$transaction(async (tx) => {
    const r = await tx.reply.create({ data: { threadId: t.id, authorId: user.id, body: text }, include: REPLY_INCLUDE });
    await tx.thread.update({ where: { id: t.id }, data: { lastActivityAt: r.createdAt, repliesCount: { increment: 1 } } });
    if (t.authorId !== user.id) {
      await awardPoints(user.id, POINTS.REPLY_POSTED, "HELP", `Replied to "${t.title.slice(0, 60)}"`, tx);
      const preview = text.replace(/[#*`>\n]+/g, " ").trim();
      await notify(
        t.authorId,
        {
          type: "COMMUNITY",
          title: `${user.name} replied to your doubt`,
          body: `"${preview.slice(0, 90)}${preview.length > 90 ? "…" : ""}"`,
          link: `/app/community/${t.id}`,
        },
        tx,
      );
    }
    return r;
  });
  res.status(201).json(replyOut(reply, false));
});

async function toggleVote(userId, targetType, targetId) {
  return prisma.$transaction(async (tx) => {
    const delegate = targetType === "THREAD" ? tx.thread : tx.reply;
    const doc = await delegate.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!doc) throw httpError(404, targetType === "THREAD" ? "Thread not found." : "Reply not found.");
    const key = { userId_targetType_targetId: { userId, targetType, targetId } };
    const existing = await tx.vote.findUnique({ where: key });
    if (existing) await tx.vote.delete({ where: key });
    else await tx.vote.create({ data: { userId, targetType, targetId } });
    const updated = await delegate.update({
      where: { id: targetId },
      data: { upvotes: existing ? { decrement: 1 } : { increment: 1 } },
      select: { upvotes: true },
    });
    if (updated.upvotes < 0) await delegate.update({ where: { id: targetId }, data: { upvotes: 0 } });
    return { upvotes: Math.max(0, updated.upvotes), hasUpvoted: !existing };
  });
}

router.post("/api/threads/:id/upvote", requireAuth, async (req, res) => {
  res.json(await toggleVote(req.user.id, "THREAD", req.params.id));
});

router.post("/api/replies/:id/upvote", requireAuth, async (req, res) => {
  res.json(await toggleVote(req.user.id, "REPLY", req.params.id));
});

router.post("/api/replies/:id/accept", requireAuth, async (req, res) => {
  const user = req.user;
  const r = await prisma.reply.findUnique({ where: { id: req.params.id }, include: REPLY_INCLUDE });
  if (!r) throw httpError(404, "Reply not found.");
  const t = await getThread(r.threadId);
  if (t.authorId !== user.id) throw httpError(403, "Only the person who asked can accept an answer.");
  const voted = await votedSet(user.id, "REPLY", [r.id]);
  if (t.acceptedReplyId === r.id) return res.json(replyOut({ ...r, isAccepted: true }, voted.has(r.id)));

  await prisma.$transaction(async (tx) => {
    // moving the accepted mark: take back points from the previous helper
    if (t.acceptedReplyId) {
      const prev = await tx.reply.findUnique({ where: { id: t.acceptedReplyId } });
      if (prev && prev.authorId !== t.authorId) await awardPoints(prev.authorId, -POINTS.ANSWER_ACCEPTED, "HELP", "Accepted answer changed", tx);
    }
    await tx.reply.updateMany({ where: { threadId: t.id, isAccepted: true }, data: { isAccepted: false } });
    await tx.reply.update({ where: { id: r.id }, data: { isAccepted: true } });
    await tx.thread.update({ where: { id: t.id }, data: { acceptedReplyId: r.id, solved: true, lastActivityAt: new Date() } });
    if (r.authorId !== user.id) {
      await awardPoints(r.authorId, POINTS.ANSWER_ACCEPTED, "HELP", `Answer accepted on "${t.title.slice(0, 60)}"`, tx);
      await notify(
        r.authorId,
        {
          type: "COMMUNITY",
          title: "Your answer was accepted ✅",
          body: `${user.name} marked your answer on "${t.title.slice(0, 70)}" as the solution. +${POINTS.ANSWER_ACCEPTED} pts`,
          link: `/app/community/${t.id}`,
        },
        tx,
      );
    }
  });
  res.json(replyOut({ ...r, isAccepted: true }, voted.has(r.id)));
});

/** Additive (also in the demo engine): top helpers over the last 7 days. */
router.get("/api/community/top-helpers", requireAuth, async (_req, res) => {
  const since = new Date(Date.now() - 7 * 86400000);
  const [replies, accepted] = await Promise.all([
    prisma.reply.findMany({ where: { createdAt: { gte: since } }, select: { id: true, authorId: true, upvotes: true } }),
    prisma.thread.findMany({ where: { acceptedReplyId: { not: null } }, select: { acceptedReplyId: true } }),
  ]);
  const acceptedIds = new Set(accepted.map((t) => t.acceptedReplyId));
  const stats = new Map();
  for (const r of replies) {
    const s = stats.get(r.authorId) || { answers: 0, accepted: 0, upvotes: 0 };
    s.answers += 1;
    s.upvotes += r.upvotes || 0;
    if (acceptedIds.has(r.id)) s.accepted += 1;
    stats.set(r.authorId, s);
  }
  const users = await prisma.user.findMany({ where: { id: { in: [...stats.keys()] } }, include: USER_INCLUDE });
  const byId = new Map(users.map((u) => [u.id, u]));
  res.json(
    [...stats.entries()]
      .map(([id, s]) => ({ user: miniUser(byId.get(id)), ...s, points: s.answers * POINTS.REPLY_POSTED + s.accepted * POINTS.ANSWER_ACCEPTED }))
      .filter((x) => x.user)
      .sort((a, b) => b.points - a.points || b.upvotes - a.upvotes)
      .slice(0, 6),
  );
});

export default router;
