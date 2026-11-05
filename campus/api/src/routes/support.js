import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { validate, zQEnum } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth, requireRole } from "../lib/auth.js";
import { notify } from "../lib/notify.js";
import { audit } from "../lib/audit.js";

/**
 * Help & support tickets, complaints and disputes (spec §4.2 Help, §10 SupportTicket, §11).
 * Students see only their own tickets (404 otherwise) and never internal staff notes.
 * Staff = ADMIN, PROJECT_MANAGER, FINANCE.
 */
const router = Router();

export const TICKET_CATEGORIES = ["GENERAL", "PAYMENT", "COURSE", "ASSESSMENT", "PROJECT", "COMPLAINT", "DISPUTE"];
const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];
const STAFF = ["ADMIN", "PROJECT_MANAGER", "FINANCE"];
const isStaff = (user) => STAFF.includes(user?.role);
const requireStaff = requireRole("PROJECT_MANAGER", "FINANCE");

const USER_MIN = { select: { id: true, name: true, email: true, username: true, avatarUrl: true } };

/** Complaints and disputes start at HIGH priority so they are seen first (spec §11 escalation). */
const defaultPriority = (category) => (category === "COMPLAINT" || category === "DISPUTE" ? "HIGH" : "NORMAL");

function ticketOut(t, viewer) {
  // Staff see internal notes, but not on a ticket they opened themselves (they are the customer there).
  const staff = isStaff(viewer) && t.userId !== viewer?.id;
  const messages = (Array.isArray(t.messages) ? t.messages : []).filter((m) => staff || !m.internal);
  return {
    id: t.id,
    userId: t.userId,
    user: t.user ? { id: t.user.id, name: t.user.name, username: t.user.username, avatarUrl: t.user.avatarUrl, ...(staff ? { email: t.user.email } : {}) } : undefined,
    category: t.category,
    subject: t.subject,
    body: t.body,
    status: t.status,
    priority: t.priority,
    ownerId: staff ? t.ownerId : null, // staff assignment is internal
    relatedType: t.relatedType,
    relatedId: t.relatedId,
    messages,
    resolution: t.resolution,
    resolvedAt: t.resolvedAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

/** The ticket if the viewer may open it: owner or staff. Anyone else gets 404, not 403. */
async function findVisible(id, viewer) {
  const t = await prisma.supportTicket.findUnique({ where: { id }, include: { user: USER_MIN } });
  if (!t || (t.userId !== viewer.id && !isStaff(viewer))) throw httpError(404, "Ticket not found.");
  return t;
}

const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: { message: "You've raised several tickets in a short time. Please wait before opening another." } },
});

const createSchema = z.object({
  category: z.enum(TICKET_CATEGORIES).default("GENERAL"),
  subject: z.string().trim().min(3, "Add a short subject.").max(140),
  body: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(5000),
  relatedType: z.enum(["ORDER", "ATTEMPT", "OFFER", "COURSE", "TICKET"]).optional().nullable(),
  relatedId: z.string().trim().max(64).optional().nullable(),
});

router.get("/api/support/tickets", requireAuth, async (req, res) => {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: req.user.id },
    include: { user: USER_MIN },
    orderBy: { updatedAt: "desc" },
  });
  res.json(tickets.map((t) => ticketOut(t, req.user)));
});

router.post("/api/support/tickets", requireAuth, createLimiter, validate({ body: createSchema }), async (req, res) => {
  const { category, subject, body, relatedType, relatedId } = req.body;
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: req.user.id,
      category,
      subject,
      body,
      priority: defaultPriority(category),
      relatedType: relatedId ? relatedType || null : null,
      relatedId: relatedId || null,
    },
    include: { user: USER_MIN },
  });
  await notify(req.user.id, {
    type: "SYSTEM",
    title: "We got your request",
    body: `Ticket "${subject}" is open. We usually reply within 2 working days.`,
    link: `/app/help/${ticket.id}`,
  });
  res.status(201).json(ticketOut(ticket, req.user));
});

router.get("/api/support/tickets/:id", requireAuth, async (req, res) => {
  res.json(ticketOut(await findVisible(req.params.id, req.user), req.user));
});

const messageSchema = z.object({
  body: z.string().trim().min(1, "Write a message.").max(5000),
  internal: z.boolean().optional().default(false),
});

router.post("/api/support/tickets/:id/messages", requireAuth, validate({ body: messageSchema }), async (req, res) => {
  const t = await findVisible(req.params.id, req.user);
  const staff = isStaff(req.user) && t.userId !== req.user.id;
  const internal = staff && req.body.internal;
  const message = { id: randomUUID(), authorId: req.user.id, authorName: staff ? `${req.user.name} (Support)` : req.user.name, body: req.body.body, internal, at: new Date().toISOString() };

  const data = { messages: [...(Array.isArray(t.messages) ? t.messages : []), message] };
  if (!staff && ["RESOLVED", "CLOSED"].includes(t.status)) data.status = "OPEN"; // the student wrote back → reopen
  if (staff && !internal && t.status === "OPEN") data.status = "IN_PROGRESS";
  if (staff && !t.ownerId) data.ownerId = req.user.id;

  const updated = await prisma.supportTicket.update({ where: { id: t.id }, data, include: { user: USER_MIN } });
  if (staff && !internal) {
    await notify(t.userId, { type: "SYSTEM", title: "Support replied", body: `New reply on "${t.subject}".`, link: `/app/help/${t.id}` });
  } else if (!staff && t.ownerId) {
    await notify(t.ownerId, { type: "SYSTEM", title: "Ticket reply", body: `${req.user.name} replied on "${t.subject}".`, link: "/admin/support" });
  }
  res.json(ticketOut(updated, req.user));
});

/* ───────────────────────── staff queue ───────────────────────── */

const listQuery = z.object({ status: zQEnum(STATUSES), category: zQEnum(TICKET_CATEGORIES) });

router.get("/api/admin/support/tickets", requireAuth, requireStaff, validate({ query: listQuery }), async (req, res) => {
  const { status, category } = req.q;
  const tickets = await prisma.supportTicket.findMany({
    where: { ...(status ? { status } : {}), ...(category ? { category } : {}) },
    include: { user: USER_MIN },
    orderBy: [{ updatedAt: "desc" }],
    take: 300,
  });
  const rank = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
  tickets.sort((a, b) => Number(["RESOLVED", "CLOSED"].includes(a.status)) - Number(["RESOLVED", "CLOSED"].includes(b.status)) || rank[a.priority] - rank[b.priority]);
  res.json(tickets.map((t) => ticketOut(t, req.user)));
});

const patchSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    ownerId: z.string().trim().min(1).nullable().optional(),
    resolution: z.string().trim().max(5000).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update.");

router.patch("/api/admin/support/tickets/:id", requireAuth, requireStaff, validate({ body: patchSchema }), async (req, res) => {
  const t = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
  if (!t) throw httpError(404, "Ticket not found.");
  const { status, priority, ownerId, resolution } = req.body;

  if (ownerId) {
    const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { role: true } });
    if (!owner || !STAFF.includes(owner.role)) throw httpError(400, "Assign the ticket to a support staff member.");
  }
  if (status === "RESOLVED" && !(resolution ?? t.resolution)) throw httpError(400, "Add a short resolution before resolving.");

  const data = {};
  if (status) {
    data.status = status;
    data.resolvedAt = ["RESOLVED", "CLOSED"].includes(status) ? t.resolvedAt || new Date() : null;
  }
  if (priority) data.priority = priority;
  if (ownerId !== undefined) data.ownerId = ownerId;
  if (resolution !== undefined) data.resolution = resolution;

  const updated = await prisma.supportTicket.update({ where: { id: t.id }, data, include: { user: USER_MIN } });
  const pick = (o) => ({ status: o.status, priority: o.priority, ownerId: o.ownerId, resolution: o.resolution });
  await audit(req, { action: "support.update", entity: "SupportTicket", entityId: t.id, before: pick(t), after: pick(updated) });

  if (status && status !== t.status && ["RESOLVED", "CLOSED"].includes(status)) {
    await notify(t.userId, {
      type: "SYSTEM",
      title: status === "RESOLVED" ? "Your ticket is resolved" : "Your ticket is closed",
      body: `"${t.subject}". Reply on the ticket if you still need help.`,
      link: `/app/help/${t.id}`,
    });
  }
  res.json(ticketOut(updated, req.user));
});

export default router;
