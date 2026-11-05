import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { httpError } from "../lib/errors.js";
import { requireAuth, requireRole } from "../lib/auth.js";
import { validate, zBool, zQ, zQEnum } from "../lib/validate.js";
import { notify } from "../lib/notify.js";
import { audit } from "../lib/audit.js";
import { getSettings } from "../lib/settings.js";
import { includesCI, randomCode } from "../lib/util.js";
import { collegeRef, publicUser } from "../lib/serialize.js";
import { OFFER_INCLUDE, offerFinanceOut, offerPmOut, offerStudentOut } from "../lib/serialize-projects.js";
import {
  ACTIVE_STATUSES,
  CLOSED_UNSTARTED,
  FINANCE_STATUSES,
  SPLIT_BASES,
  STATUS_MOVES,
  adjustmentsTotal,
  effectiveStatus,
  historyEntry,
  lastDelivery,
  levelCovers,
  loadManagedOffer,
  reliabilityOf,
  snapshotFinance,
  sweepOffers,
} from "../services/projects.js";

/**
 * Projects & PM (spec §4.2 Project opportunities / My projects / Availability, §5.3 PM workflow, §9, §12, §13).
 * Client briefs live in Catalance; here a PM matches a VERIFIED student, sends an exact offer, tracks delivery,
 * records client acceptance, and finance reconciles the payout. See API_CONTRACT.md "Projects & PM".
 */
const router = Router();

const PM = requireRole("PROJECT_MANAGER"); // 🧭 ADMIN | PROJECT_MANAGER (requireRole lets ADMIN through)
const FIN = requireRole("FINANCE"); // 💰 ADMIN | FINANCE
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "STANDARD"];
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const arr = (v) => (Array.isArray(v) ? v : []);
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const dateIN = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }) : "");
const strList = (max = 20, len = 300) => z.array(z.string().trim().min(1).max(len)).max(max);

/* ═════════════════════════════ student ═════════════════════════════ */

const STUDENT_BUCKETS = {
  open: (o) => effectiveStatus(o) === "OFFERED",
  active: (o) => ACTIVE_STATUSES.includes(o.status),
  past: (o) => ["COMPLETED", "CANCELLED", ...CLOSED_UNSTARTED].includes(effectiveStatus(o)),
};

/** The student's own offer, or 404 (never reveals whether someone else's id exists). */
async function ownOffer(id, user) {
  const o = await prisma.projectOffer.findUnique({ where: { id }, include: OFFER_INCLUDE });
  if (!o || o.studentId !== user.id) throw httpError(404, "Offer not found.");
  return (await sweepOffers([o]))[0];
}

router.get(
  "/api/me/offers",
  requireAuth,
  validate({ query: z.object({ status: zQEnum(["open", "active", "past"]) }) }),
  async (req, res) => {
    // Withdrawn offers stay in "past" so the student can see what happened.
    const rows = await prisma.projectOffer.findMany({ where: { studentId: req.user.id }, include: OFFER_INCLUDE, orderBy: { createdAt: "desc" } });
    const swept = await sweepOffers(rows);
    const bucket = STUDENT_BUCKETS[req.q.status];
    res.json((bucket ? swept.filter(bucket) : swept).map(offerStudentOut));
  },
);

router.get("/api/me/offers/:id", requireAuth, async (req, res) => {
  res.json(offerStudentOut(await ownOffer(req.params.id, req.user)));
});

router.post(
  "/api/me/offers/:id/accept",
  requireAuth,
  validate({ body: z.object({ consents: z.array(z.string()).default([]) }) }),
  async (req, res) => {
    const o = await ownOffer(req.params.id, req.user);
    if (effectiveStatus(o) === "EXPIRED") throw httpError(410, "This offer has expired.");
    if (o.status !== "OFFERED") throw httpError(400, "This offer is no longer open.");
    if (!req.body.consents.includes("PROJECT_POLICY")) throw httpError(400, "Please agree to the project terms to accept.");
    const settings = await getSettings();
    const version = settings["policies.versions"]?.PROJECT_POLICY || "current";
    const updated = await prisma.$transaction(async (tx) => {
      // conditional update so a double tap or a race with expiry can't accept twice
      const r = await tx.projectOffer.updateMany({
        where: { id: o.id, status: "OFFERED" },
        data: { status: "ACCEPTED", respondedAt: new Date(), payoutStatus: "PENDING", history: [...arr(o.history), historyEntry("ACCEPTED", req.user)] },
      });
      if (!r.count) throw httpError(409, "This offer changed. Please refresh.");
      await tx.consentRecord.create({
        data: { userId: req.user.id, purpose: "PROJECT_POLICY", policyVersion: version, context: `offer:${o.id}`, ip: req.ip ?? null, userAgent: req.headers["user-agent"]?.slice(0, 300) ?? null },
      });
      if (o.pmId) {
        await notify(o.pmId, { type: "GIG", title: `Offer accepted: ${o.title}`, body: `${req.user.name} accepted. Plan the kickoff.`, link: `/admin/offers/${o.id}` }, tx);
      }
      return tx.projectOffer.findUnique({ where: { id: o.id }, include: OFFER_INCLUDE });
    });
    res.json(offerStudentOut(updated));
  },
);

router.post(
  "/api/me/offers/:id/decline",
  requireAuth,
  validate({ body: z.object({ reason: z.string().trim().max(500).optional() }) }),
  async (req, res) => {
    const o = await ownOffer(req.params.id, req.user);
    if (effectiveStatus(o) === "EXPIRED") throw httpError(410, "This offer has expired.");
    if (o.status !== "OFFERED") throw httpError(400, "This offer is no longer open.");
    // Declining is never penalised (spec §13.4): it does not touch reliability or ranking.
    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.projectOffer.updateMany({
        where: { id: o.id, status: "OFFERED" },
        data: { status: "DECLINED", respondedAt: new Date(), declineReason: req.body.reason || null, history: [...arr(o.history), historyEntry("DECLINED", req.user, req.body.reason)] },
      });
      if (!r.count) throw httpError(409, "This offer changed. Please refresh.");
      if (o.pmId) {
        await notify(o.pmId, { type: "GIG", title: `Offer declined: ${o.title}`, body: req.body.reason ? `Reason: ${req.body.reason}` : "You can offer it to another student.", link: `/admin/offers/${o.id}` }, tx);
      }
      return tx.projectOffer.findUnique({ where: { id: o.id }, include: OFFER_INCLUDE });
    });
    res.json(offerStudentOut(updated));
  },
);

router.post(
  "/api/me/offers/:id/deliveries",
  requireAuth,
  validate({
    body: z
      .object({ text: z.string().trim().max(5000).default(""), links: z.array(z.string().trim().url("Each link must be a full URL.").max(500)).max(10).default([]) })
      .refine((b) => b.text || b.links.length, { message: "Add a note or at least one link." }),
  }),
  async (req, res) => {
    const o = await ownOffer(req.params.id, req.user);
    if (!["ACCEPTED", "IN_PROGRESS", "REVISION_REQUESTED"].includes(o.status)) throw httpError(400, "You can't submit work on this project right now.");
    const deliveries = arr(o.deliveries);
    const version = deliveries.length + 1;
    const delivery = { version, text: req.body.text, links: req.body.links, submittedAt: new Date().toISOString(), review: null };
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.projectOffer.update({
        where: { id: o.id },
        data: { status: "SUBMITTED", deliveries: [...deliveries, delivery], history: [...arr(o.history), historyEntry("SUBMITTED", req.user, `Version ${version}`)] },
        include: OFFER_INCLUDE,
      });
      if (o.pmId) {
        await notify(o.pmId, { type: "GIG", title: `Review needed: ${o.title}`, body: `${req.user.name} submitted version ${version}.`, link: `/admin/offers/${o.id}` }, tx);
      }
      return u;
    });
    res.json(offerStudentOut(updated));
  },
);

const availabilitySchema = z.object({
  openToProjects: z.boolean(),
  hoursPerWeek: z.number().int().min(0).max(60),
  days: z.array(z.enum(DAYS)).max(7).default([]),
  preferredTaskTypes: strList(10, 60).default([]),
  tools: strList(20, 60).default([]),
  communication: z.string().trim().max(200).default(""),
});

/** Read own availability (demo + real; the profile card loads it without relying on a cached user). */
router.get("/api/me/availability", requireAuth, (req, res) => {
  res.json({ availability: publicUser(req.user).availability });
});

router.patch("/api/me/availability", requireAuth, validate({ body: availabilitySchema }), async (req, res) => {
  const availability = { ...req.body, updatedAt: new Date().toISOString() };
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { availability }, include: { college: true } });
  res.json({ user: publicUser(user) });
});

/* ═════════════════════════════ PM: talent search (spec §13.2–13.4) ═════════════════════════════ */

const talentMini = (u) => ({
  id: u.id,
  name: u.name,
  username: u.username,
  avatarUrl: u.avatarUrl ?? null,
  headline: u.headline ?? null,
  city: u.city ?? null,
  college: collegeRef(u.college),
  year: u.year ?? null,
  stream: u.stream ?? null,
  skills: u.skills || [],
  language: u.language || "en",
});

router.get(
  "/api/pm/talent",
  requireAuth,
  PM,
  validate({ query: z.object({ skill: zQ, level: zQEnum(LEVELS), available: zBool.optional(), q: zQ, studentId: zQ }) }),
  async (req, res) => {
    const { skill, level, available, q, studentId } = req.q;
    const now = new Date();
    const activeVer = { status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
    // Only verified, non-suspended people are candidates (spec §13.4: suspended users excluded).
    const matching = await prisma.skillVerification.findMany({
      where: { ...activeVer, ...(skill ? { skill: { slug: skill } } : {}), user: { status: "ACTIVE", ...(studentId ? { id: studentId } : {}) } },
      select: { userId: true, level: true },
    });
    const userIds = [...new Set(matching.filter((v) => levelCovers(v.level, level)).map((v) => v.userId))];
    if (!userIds.length) return res.json([]);

    const [users, verifications, offers, portfolio] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: userIds } }, include: { college: true } }),
      prisma.skillVerification.findMany({ where: { ...activeVer, userId: { in: userIds } }, include: { skill: { select: { id: true, slug: true, name: true } } }, orderBy: { awardedAt: "desc" } }),
      prisma.projectOffer.findMany({ where: { studentId: { in: userIds } }, select: { studentId: true, status: true, deadline: true, deliveries: true, rating: true, createdAt: true, expiresAt: true } }),
      prisma.portfolioItem.findMany({ where: { userId: { in: userIds } }, orderBy: [{ verified: "desc" }, { createdAt: "desc" }], select: { id: true, userId: true, title: true, link: true, skills: true, verified: true } }),
    ]);

    let rows = users.map((u) => {
      const av = u.availability && typeof u.availability === "object" ? u.availability : {};
      const mine = verifications.filter((v) => v.userId === u.id);
      return {
        user: talentMini(u),
        verifications: mine.map((v) => ({
          id: v.id,
          skill: v.skill,
          level: v.level,
          awardedAt: v.awardedAt,
          expiresAt: v.expiresAt,
          verifyCode: v.verifyCode,
          matches: (!skill || v.skill.slug === skill) && levelCovers(v.level, level),
        })),
        availability: { openToProjects: false, hoursPerWeek: 0, days: [], preferredTaskTypes: [], tools: [], communication: "", ...av },
        portfolio: portfolio.filter((p) => p.userId === u.id).slice(0, 3).map(({ userId, ...p }) => p), // eslint-disable-line no-unused-vars
        ...reliabilityOf(offers.filter((o) => o.studentId === u.id).map((o) => ({ ...o, status: effectiveStatus(o) })), now),
      };
    });

    if (available) rows = rows.filter((r) => r.availability.openToProjects);
    if (q) rows = rows.filter((r) => [r.user.name, r.user.username, r.user.headline, r.user.skills.join(" "), r.availability.tools.join(" ")].some((t) => includesCI(t, q)));

    // Rule-based order, never by fees paid (spec §13.4): open to work, lighter workload, fewer recent offers (rotation), then name.
    const t = (d) => (d ? new Date(d).getTime() : 0);
    rows.sort(
      (a, b) =>
        Number(b.availability.openToProjects) - Number(a.availability.openToProjects) ||
        a.activeProjects - b.activeProjects ||
        a.offersLast30d - b.offersLast30d ||
        t(a.lastOfferAt) - t(b.lastOfferAt) ||
        a.user.name.localeCompare(b.user.name),
    );
    res.json(rows);
  },
);

/* ═════════════════════════════ PM: offers ═════════════════════════════ */

const milestoneIn = z.object({
  id: z.string().trim().max(40).optional(),
  title: z.string().trim().min(1).max(140),
  dueAt: z.coerce.date().nullable().optional(),
  status: z.enum(["PENDING", "SUBMITTED", "APPROVED"]).optional(),
});

const offerFields = {
  catalanceProjectId: z.string().trim().max(100).nullable().optional(),
  title: z.string().trim().min(3, "Add a title.").max(140),
  summary: z.string().trim().max(3000).default(""),
  skillId: z.string().trim().min(1, "Pick the skill."),
  level: z.enum(LEVELS),
  deliverables: strList(20).min(1, "Add at least one deliverable."),
  acceptanceCriteria: strList(20).min(1, "Add at least one acceptance criterion."),
  expectedHours: z.number().int().min(1).max(500),
  deadline: z.coerce.date(),
  milestones: z.array(milestoneIn).max(12).default([]),
  payoutINR: z.number().int().min(1, "Set the payout.").max(1000000),
  revisionLimit: z.number().int().min(0).max(5).default(2),
  tools: strList(20, 80).default([]),
  confidentiality: z.string().trim().max(3000).default(""),
};
const createSchema = z.object({ ...offerFields, studentId: z.string().trim().min(1), shortlistReason: z.string().trim().min(10, "Say why this student fits (at least 10 characters).").max(1000) });
const updateSchema = z.object(offerFields).partial().extend({ shortlistReason: z.string().trim().min(10).max(1000).optional() });

const normMilestones = (list) =>
  list.map((m, i) => ({ id: m.id || `ms_${randomCode(6).toLowerCase()}${i}`, title: m.title, dueAt: m.dueAt ? new Date(m.dueAt).toISOString() : null, status: m.status || "PENDING" }));

/** The student must hold an ACTIVE, unexpired verification for the skill at (or above) the offer level. */
async function assertEligible(studentId, skillId, level) {
  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student) throw httpError(404, "Student not found.");
  if (student.status === "SUSPENDED") throw httpError(400, "This student is suspended and can't receive offers.");
  const vers = await prisma.skillVerification.findMany({ where: { userId: studentId, skillId, status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
  if (!vers.some((v) => levelCovers(v.level, level))) throw httpError(400, "This student has no active verification for this skill and level.");
  return student;
}

router.get("/api/pm/offers", requireAuth, PM, validate({ query: z.object({ status: zQ, q: zQ }) }), async (req, res) => {
  const where = req.user.role === "ADMIN" ? {} : { pmId: req.user.id };
  const rows = await sweepOffers(await prisma.projectOffer.findMany({ where, include: OFFER_INCLUDE, orderBy: { updatedAt: "desc" } }));
  let out = rows.map((o) => offerPmOut(o, req.user));
  if (req.q.status) out = out.filter((o) => o.status === req.q.status || o.stage === req.q.status);
  if (req.q.q) out = out.filter((o) => includesCI(o.title, req.q.q) || includesCI(o.student?.name, req.q.q) || includesCI(o.catalanceProjectId, req.q.q));
  res.json(out);
});

router.post("/api/pm/offers", requireAuth, PM, validate({ body: createSchema }), async (req, res) => {
  const b = req.body;
  const student = await assertEligible(b.studentId, b.skillId, b.level);
  if (b.deadline < new Date()) throw httpError(400, "The deadline must be in the future.");
  const settings = await getSettings();
  const expiresAt = new Date(Date.now() + (Number(settings["projects.offerExpiryHours"]) || 48) * 3600000);
  const created = await prisma.$transaction(async (tx) => {
    const o = await tx.projectOffer.create({
      data: {
        ...b,
        catalanceProjectId: b.catalanceProjectId || null,
        milestones: normMilestones(b.milestones),
        pmId: req.user.id,
        status: "OFFERED",
        expiresAt,
        history: [historyEntry("OFFERED", req.user, "Offer sent")],
      },
      include: OFFER_INCLUDE,
    });
    // spec §12: new matching project — sent only to the matched student, with deadline and payout
    await notify(
      student.id,
      { type: "GIG", title: `New project offer: ${o.title}`, body: `${inr(o.payoutINR)} · due ${dateIN(o.deadline)} · reply by ${dateIN(expiresAt)}`, link: `/app/projects/${o.id}` },
      tx,
    );
    await audit(req, { action: "offer.create", entity: "ProjectOffer", entityId: o.id, after: { studentId: o.studentId, payoutINR: o.payoutINR, skillId: o.skillId, level: o.level }, reason: b.shortlistReason }, tx);
    return o;
  });
  res.status(201).json(offerPmOut(created, req.user));
});

router.get("/api/pm/offers/:id", requireAuth, PM, async (req, res) => {
  const o = (await sweepOffers([await loadManagedOffer(req.params.id, req.user, OFFER_INCLUDE)]))[0];
  res.json(offerPmOut(o, req.user));
});

router.put("/api/pm/offers/:id", requireAuth, PM, validate({ body: updateSchema }), async (req, res) => {
  const o = (await sweepOffers([await loadManagedOffer(req.params.id, req.user, OFFER_INCLUDE)]))[0];
  if (o.status !== "OFFERED") throw httpError(400, "Only open offers can be edited.");
  const b = req.body;
  if (b.skillId || b.level) await assertEligible(o.studentId, b.skillId || o.skillId, b.level || o.level);
  if (b.deadline && b.deadline < new Date()) throw httpError(400, "The deadline must be in the future.");
  const data = { ...b };
  if (b.milestones) data.milestones = normMilestones(b.milestones);
  if ("catalanceProjectId" in b) data.catalanceProjectId = b.catalanceProjectId || null;
  const payoutChanged = b.payoutINR != null && b.payoutINR !== o.payoutINR;
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.projectOffer.update({ where: { id: o.id }, data: { ...data, history: [...arr(o.history), historyEntry("OFFERED", req.user, payoutChanged ? `Payout changed to ${inr(b.payoutINR)}` : "Offer details updated")] }, include: OFFER_INCLUDE });
    await notify(
      o.studentId,
      payoutChanged
        ? { type: "GIG", title: `Offer updated: ${u.title}`, body: `New payout ${inr(u.payoutINR)}. Please review before you reply.`, link: `/app/projects/${u.id}` }
        : { type: "GIG", title: `Offer updated: ${u.title}`, body: "Some details changed. Please review before you reply.", link: `/app/projects/${u.id}` },
      tx,
    );
    if (payoutChanged) await audit(req, { action: "offer.payout_change", entity: "ProjectOffer", entityId: o.id, before: { payoutINR: o.payoutINR }, after: { payoutINR: u.payoutINR } }, tx);
    return u;
  });
  res.json(offerPmOut(updated, req.user));
});

const STATUS_TITLES = {
  IN_PROGRESS: "Project started",
  ON_HOLD: "Project on hold",
  DISPUTED: "Project under dispute",
  CANCELLED: "Project cancelled",
  WITHDRAWN: "Offer withdrawn",
  COMPLETED: "Project completed",
};

router.post(
  "/api/pm/offers/:id/status",
  requireAuth,
  PM,
  validate({ body: z.object({ status: z.enum(Object.keys(STATUS_MOVES)), note: z.string().trim().max(1000).default("") }) }),
  async (req, res) => {
    const o = (await sweepOffers([await loadManagedOffer(req.params.id, req.user, OFFER_INCLUDE)]))[0];
    const { status, note } = req.body;
    const move = STATUS_MOVES[status];
    if (!move.from.includes(o.status)) throw httpError(400, `Can't move a ${o.status.toLowerCase().replace(/_/g, " ")} project to ${status.toLowerCase().replace(/_/g, " ")}.`);
    if (move.note && !note) throw httpError(400, "Add a short note for this change.");
    const settings = await getSettings();
    const data = { status, history: [...arr(o.history), historyEntry(status, req.user, note)] };
    if (["CANCELLED", "WITHDRAWN"].includes(status) && o.payoutStatus !== "PAID") data.payoutStatus = "NOT_DUE";
    if (status === "COMPLETED") Object.assign(data, { payoutStatus: "ELIGIBLE", clientAcceptedAt: new Date(), ...(o.clientPriceINR != null ? snapshotFinance(o, settings) : {}) });
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.projectOffer.update({ where: { id: o.id }, data, include: OFFER_INCLUDE });
      await notify(o.studentId, { type: "GIG", title: `${STATUS_TITLES[status]}: ${o.title}`, body: note || "", link: `/app/projects/${o.id}` }, tx);
      await audit(req, { action: `offer.status.${status.toLowerCase()}`, entity: "ProjectOffer", entityId: o.id, before: { status: o.status, payoutStatus: o.payoutStatus }, after: { status: u.status, payoutStatus: u.payoutStatus }, reason: note || null }, tx);
      return u;
    });
    res.json(offerPmOut(updated, req.user));
  },
);

const CLOSED_STATES = ["OFFERED", ...CLOSED_UNSTARTED, "CANCELLED", "COMPLETED"];

/** Track a milestone (PM). Additive to the contract: milestone progress after kickoff. */
router.post(
  "/api/pm/offers/:id/milestones/:milestoneId",
  requireAuth,
  PM,
  validate({ body: z.object({ status: z.enum(["PENDING", "SUBMITTED", "APPROVED"]) }) }),
  async (req, res) => {
    const o = await loadManagedOffer(req.params.id, req.user, OFFER_INCLUDE);
    if (CLOSED_STATES.includes(o.status)) throw httpError(400, "This project is closed.");
    const list = arr(o.milestones);
    const m = list.find((x) => x.id === req.params.milestoneId);
    if (!m) throw httpError(404, "Milestone not found.");
    const milestones = list.map((x) => (x.id === m.id ? { ...x, status: req.body.status } : x));
    const updated = await prisma.projectOffer.update({ where: { id: o.id }, data: { milestones }, include: OFFER_INCLUDE });
    if (req.body.status === "APPROVED") await notify(o.studentId, { type: "GIG", title: `Milestone approved: ${m.title}`, body: o.title, link: `/app/projects/${o.id}` });
    res.json(offerPmOut(updated, req.user));
  },
);

router.post(
  "/api/pm/offers/:id/review",
  requireAuth,
  PM,
  validate({
    body: z
      .object({ decision: z.enum(["APPROVE", "REVISION"]), note: z.string().trim().max(3000).default("") })
      .refine((b) => b.decision === "APPROVE" || b.note.length >= 5, { message: "Say exactly what needs to change.", path: ["note"] }),
  }),
  async (req, res) => {
    const o = await loadManagedOffer(req.params.id, req.user, OFFER_INCLUDE);
    const last = lastDelivery(o);
    if (o.status !== "SUBMITTED" || !last) throw httpError(400, "There is no delivery waiting for review.");
    if (last.review) throw httpError(400, "This version was already reviewed.");
    const { decision, note } = req.body;
    if (decision === "REVISION" && o.revisionsUsed >= o.revisionLimit) {
      throw httpError(400, `The revision limit (${o.revisionLimit}) is used up. Approve, or put the project on hold and agree a change with the client.`);
    }
    const review = { decision, note: note || null, at: new Date().toISOString(), by: { id: req.user.id, name: req.user.name } };
    const deliveries = arr(o.deliveries).map((d) => (d.version === last.version ? { ...d, review } : d));
    const data =
      decision === "REVISION"
        ? { deliveries, status: "REVISION_REQUESTED", revisionsUsed: o.revisionsUsed + 1, history: [...arr(o.history), historyEntry("REVISION_REQUESTED", req.user, note)] }
        : { deliveries, history: [...arr(o.history), historyEntry("SUBMITTED", req.user, `Version ${last.version} approved by PM. Sent to client.`)] };
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.projectOffer.update({ where: { id: o.id }, data, include: OFFER_INCLUDE });
      await notify(
        o.studentId,
        decision === "REVISION"
          ? { type: "GIG", title: `Changes requested: ${o.title}`, body: `${note} (${o.revisionLimit - o.revisionsUsed - 1} revision${o.revisionLimit - o.revisionsUsed - 1 === 1 ? "" : "s"} left)`, link: `/app/projects/${o.id}` }
          : { type: "GIG", title: `Work approved: ${o.title}`, body: "Your PM approved it and sent it to the client for review.", link: `/app/projects/${o.id}` },
        tx,
      );
      // spec §12 "client review needed": a reminder for the PM in their inbox
      if (decision === "APPROVE" && o.pmId) await notify(o.pmId, { type: "GIG", title: `Client review needed: ${o.title}`, body: "Record the client's acceptance or dispute.", link: `/admin/offers/${o.id}` }, tx);
      return u;
    });
    res.json(offerPmOut(updated, req.user));
  },
);

router.post(
  "/api/pm/offers/:id/client-acceptance",
  requireAuth,
  PM,
  validate({ body: z.object({ accepted: z.boolean(), feedback: z.string().trim().max(2000).optional(), rating: z.number().int().min(1).max(5).optional() }) }),
  async (req, res) => {
    const o = await loadManagedOffer(req.params.id, req.user, OFFER_INCLUDE);
    if (o.status !== "SUBMITTED" || lastDelivery(o)?.review?.decision !== "APPROVE") throw httpError(400, "Approve the latest delivery before recording the client's answer.");
    const { accepted, feedback, rating } = req.body;
    const settings = await getSettings();
    const data = accepted
      ? {
          status: "COMPLETED",
          clientAcceptedAt: new Date(),
          payoutStatus: "ELIGIBLE",
          feedback: feedback || null,
          rating: rating ?? null,
          ...(o.clientPriceINR != null ? snapshotFinance(o, settings) : {}), // platform share is snapshotted at approval (spec §9.2)
          milestones: arr(o.milestones).map((m) => ({ ...m, status: "APPROVED" })),
          history: [...arr(o.history), historyEntry("COMPLETED", req.user, "Client accepted the delivery.")],
        }
      : { status: "DISPUTED", feedback: feedback || null, history: [...arr(o.history), historyEntry("DISPUTED", req.user, feedback || "Client raised a dispute.")] };
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.projectOffer.update({ where: { id: o.id }, data, include: OFFER_INCLUDE });
      await notify(
        o.studentId,
        accepted
          ? { type: "GIG", title: `Client accepted: ${o.title}`, body: `Your payout of ${inr(o.payoutINR + adjustmentsTotal(o))} is now eligible. Finance will process it.`, link: `/app/projects/${o.id}` }
          : { type: "GIG", title: `Client raised a concern: ${o.title}`, body: "Your PM will contact you with next steps.", link: `/app/projects/${o.id}` },
        tx,
      );
      await audit(req, { action: accepted ? "offer.client_accept" : "offer.client_dispute", entity: "ProjectOffer", entityId: o.id, before: { status: o.status, payoutStatus: o.payoutStatus }, after: { status: u.status, payoutStatus: u.payoutStatus, platformShareINR: u.platformShareINR }, reason: feedback || null }, tx);
      return u;
    });
    res.json(offerPmOut(updated, req.user));
  },
);

/* ═════════════════════════════ finance (spec §9.2) ═════════════════════════════ */

const PAYOUT_STATUSES = ["NOT_DUE", "PENDING", "ELIGIBLE", "PAID", "FAILED"];

/** Split rule defaults for the payout drawer (FINANCE can't read /api/admin/settings). */
router.get("/api/finance/rules", requireAuth, FIN, async (req, res) => {
  const s = await getSettings();
  res.json({ splitBasis: s["finance.splitBasis"], freelancerSharePercent: s["finance.freelancerSharePercent"] });
});

router.get(
  "/api/finance/offers",
  requireAuth,
  FIN,
  validate({ query: z.object({ payoutStatus: zQEnum(PAYOUT_STATUSES), q: zQ, from: zQ, to: zQ, reconciled: zQEnum(["yes", "no"]) }) }),
  async (req, res) => {
    const { payoutStatus, q, from, to, reconciled } = req.q;
    const where = { status: { in: FINANCE_STATUSES }, ...(payoutStatus ? { payoutStatus } : {}) };
    if (from || to) where.updatedAt = { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}) };
    let rows = (await prisma.projectOffer.findMany({ where, include: OFFER_INCLUDE, orderBy: { updatedAt: "desc" } })).map(offerFinanceOut);
    if (q) rows = rows.filter((r) => [r.title, r.student?.name, r.payoutRef, r.catalanceProjectId].some((t) => includesCI(t, q)));
    if (reconciled === "yes") rows = rows.filter((r) => r.payoutStatus === "PAID" && r.payoutRef);
    if (reconciled === "no") rows = rows.filter((r) => !(r.payoutStatus === "PAID" && r.payoutRef));
    res.json(rows);
  },
);

async function financeOffer(id) {
  const o = await prisma.projectOffer.findUnique({ where: { id }, include: OFFER_INCLUDE });
  if (!o || !FINANCE_STATUSES.includes(o.status)) throw httpError(404, "Offer not found.");
  return o;
}
const financeSnap = (o) => ({ clientPriceINR: o.clientPriceINR, splitBasis: o.splitBasis, freelancerSharePercent: o.freelancerSharePercent, platformShareINR: o.platformShareINR, taxesINR: o.taxesINR, payoutStatus: o.payoutStatus, payoutRef: o.payoutRef });

router.put(
  "/api/finance/offers/:id",
  requireAuth,
  FIN,
  validate({
    body: z.object({
      clientPriceINR: z.number().int().min(0).max(100000000),
      splitBasis: z.enum(SPLIT_BASES).optional(),
      freelancerSharePercent: z.number().int().min(0).max(100).optional(),
      taxesINR: z.number().int().min(0).max(100000000).default(0),
      reason: z.string().trim().max(500).optional(),
    }),
  }),
  async (req, res) => {
    const o = await financeOffer(req.params.id);
    if (o.payoutStatus === "PAID") throw httpError(400, "This payout is already paid. Use an adjustment with a reason instead.");
    const settings = await getSettings();
    const b = req.body;
    const next = {
      clientPriceINR: b.clientPriceINR,
      taxesINR: b.taxesINR,
      splitBasis: b.splitBasis || o.splitBasis || settings["finance.splitBasis"],
      freelancerSharePercent: b.freelancerSharePercent ?? o.freelancerSharePercent ?? settings["finance.freelancerSharePercent"],
    };
    const snap = snapshotFinance({ ...o, ...next }, settings);
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.projectOffer.update({ where: { id: o.id }, data: { ...next, ...snap }, include: OFFER_INCLUDE });
      await audit(req, { action: "finance.split_update", entity: "ProjectOffer", entityId: o.id, before: financeSnap(o), after: financeSnap(u), reason: b.reason || null }, tx);
      return u;
    });
    res.json(offerFinanceOut(updated));
  },
);

router.post(
  "/api/finance/offers/:id/adjustments",
  requireAuth,
  FIN,
  validate({ body: z.object({ amountINR: z.number().int().refine((n) => n !== 0, "Amount can't be zero.").refine((n) => Math.abs(n) <= 10000000, "Amount is too large."), reason: z.string().trim().min(5, "Give a reason.").max(500) }) }),
  async (req, res) => {
    const o = await financeOffer(req.params.id);
    if (o.payoutStatus === "PAID") throw httpError(400, "This payout is already paid.");
    if (o.payoutINR + adjustmentsTotal(o) + req.body.amountINR < 0) throw httpError(400, "The net payout can't go below zero.");
    const entry = { id: `adj_${randomCode(8).toLowerCase()}`, amountINR: req.body.amountINR, reason: req.body.reason, approvedBy: { id: req.user.id, name: req.user.name }, at: new Date().toISOString() };
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.projectOffer.update({ where: { id: o.id }, data: { adjustments: [...arr(o.adjustments), entry] }, include: OFFER_INCLUDE });
      await audit(req, { action: "finance.adjustment", entity: "ProjectOffer", entityId: o.id, before: { adjustmentsTotalINR: adjustmentsTotal(o) }, after: { adjustmentsTotalINR: adjustmentsTotal(u), adjustment: entry }, reason: entry.reason }, tx);
      return u;
    });
    res.json(offerFinanceOut(updated));
  },
);

router.post(
  "/api/finance/offers/:id/payout",
  requireAuth,
  FIN,
  validate({
    body: z
      .object({ status: z.enum(["PAID", "FAILED"]), payoutRef: z.string().trim().max(120).default(""), note: z.string().trim().max(500).optional() })
      .refine((b) => b.status !== "PAID" || b.payoutRef, { message: "Add the payout reference (UTR / transfer id).", path: ["payoutRef"] }),
  }),
  async (req, res) => {
    const o = await financeOffer(req.params.id);
    const { status, payoutRef, note } = req.body;
    if (!["ELIGIBLE", "FAILED"].includes(o.payoutStatus)) throw httpError(400, "Only eligible (or failed) payouts can be processed.");
    if (status === "FAILED" && o.payoutStatus !== "ELIGIBLE") throw httpError(400, "This payout already failed.");
    const net = o.payoutINR + adjustmentsTotal(o);
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.projectOffer.update({
        where: { id: o.id },
        data: { payoutStatus: status, payoutRef: payoutRef || o.payoutRef || null, paidAt: status === "PAID" ? new Date() : null, history: [...arr(o.history), historyEntry(o.status, req.user, `Payout ${status.toLowerCase()}${note ? `: ${note}` : ""}`)] },
        include: OFFER_INCLUDE,
      });
      await notify(
        o.studentId,
        status === "PAID"
          ? { type: "SYSTEM", title: `Payout sent: ${inr(net)}`, body: `${o.title}. Reference ${payoutRef}.`, link: `/app/projects/${o.id}` }
          : { type: "SYSTEM", title: "Payout failed", body: `${o.title}. Check your payout details or contact support.`, link: "/app/help" },
        tx,
      );
      await audit(req, { action: `finance.payout_${status.toLowerCase()}`, entity: "ProjectOffer", entityId: o.id, before: { payoutStatus: o.payoutStatus, payoutRef: o.payoutRef }, after: { payoutStatus: u.payoutStatus, payoutRef: u.payoutRef, netPayoutINR: net }, reason: note || null }, tx);
      return u;
    });
    res.json(offerFinanceOut(updated));
  },
);

export default router;
