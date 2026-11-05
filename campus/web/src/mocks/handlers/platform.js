/**
 * Demo-engine handlers, F1 workstream: platform config, policies, admin settings, support tickets,
 * the dashboard next action, and feature-flag gates. See campus/API_CONTRACT.md "Spec v1.0" → Platform & support.
 * Mirrors campus/api/src/routes/{platform,support,dashboard}.js.
 */
import { httpError, requireUser, requireRole, uid, now } from "../utils";
import { notify } from "../points";
import { DEFAULT_SETTINGS, DEFAULT_FAQS, DEFAULT_POLICY_TEXT, POLICY_DOCS } from "../data/platform";
import learning from "./learning";
import earn from "./earn";
import community from "./community";

/* ───────────────────────── settings + flags (shared helpers) ───────────────────────── */

/** All settings: defaults overlaid with stored `platformSettings` rows. Other demo handlers may import this. */
export function demoSettings(db) {
  const stored = Object.fromEntries(db.all("platformSettings").map((r) => [r.key, r.value]));
  return { ...structuredClone(DEFAULT_SETTINGS), ...stored };
}

export function demoSetting(db, key) {
  return demoSettings(db)[key];
}

/** { aiTutor, gamification, gigs, ... } */
export function demoFlags(db) {
  return Object.fromEntries(Object.entries(demoSettings(db)).filter(([k]) => k.startsWith("flags.")).map(([k, v]) => [k.slice(6), Boolean(v)]));
}

/** Throws 404 when a feature flag is off — same as requireFlag() in the API. */
export function requireDemoFlag(db, flag) {
  if (!demoFlags(db)[flag]) throw httpError(404, "This feature is not available.");
}

/** Demo audit log (spec §15). Shape matches campus.AuditLog. */
export function demoAudit(db, user, { action, entity, entityId = null, before = null, after = null, reason = null }) {
  db.insert("auditLogs", { id: uid("aud"), actorId: user?.id ?? null, actorRole: user?.role ?? null, action, entity, entityId, before, after, reason, ip: null, userAgent: "demo", createdAt: now() });
}

/* ───────────────────────── platform config + policies ───────────────────────── */

const flagsOf = (s) => Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("flags.")).map(([k, v]) => [k.slice(6), Boolean(v)]));

function publicConfig(s) {
  return {
    flags: flagsOf(s),
    pricing: { gstPercent: s["pricing.gstPercent"], levelDefaults: s["pricing.levelDefaults"] },
    assessment: { passScore: s["assessment.passScore"], maxAttempts: s["assessment.maxAttempts"], reassessWindowDays: s["assessment.reassessWindowDays"] },
    content: {
      noGuarantee: s["content.noGuarantee"] || DEFAULT_SETTINGS["content.noGuarantee"],
      hero: { ...DEFAULT_SETTINGS["content.hero"], ...(s["content.hero"] || {}) },
      faqs: Array.isArray(s["content.faqs"]) && s["content.faqs"].length ? s["content.faqs"] : DEFAULT_FAQS,
    },
    policies: { versions: s["policies.versions"] },
    support: { email: s["support.email"] },
    payments: {
      advancePercent: s["payments.advancePercent"],
      offlineEnabled: Boolean(s["payments.offlineEnabled"]),
      offlineInstructions: s["payments.offlineInstructions"],
      razorpayKeyId: null,
    },
  };
}

/** Light per-key checks, same rules as the API's zod schemas. */
function checkSetting(key, value) {
  const fail = (m) => {
    throw httpError(400, `${key}: ${m}`);
  };
  const num = (min, max) => (typeof value !== "number" || Number.isNaN(value) || value < min || value > max) && fail(`must be a number from ${min} to ${max}.`);
  if (!(key in DEFAULT_SETTINGS)) fail("unknown setting.");
  if (key.startsWith("flags.") || key === "payments.offlineEnabled") return typeof value !== "boolean" && fail("must be true or false.");
  switch (key) {
    case "pricing.gstPercent":
    case "payments.advancePercent":
    case "finance.freelancerSharePercent":
      return num(0, 100);
    case "assessment.passScore":
      return num(1, 100);
    case "assessment.maxAttempts":
      return num(1, 10);
    case "assessment.reassessWindowDays":
      return num(1, 365);
    case "projects.offerExpiryHours":
      return num(1, 720);
    case "verification.expiryMonths":
      return value !== null && num(1, 120);
    case "support.email":
      return !/^\S+@\S+\.\S+$/.test(String(value || "")) && fail("must be an email address.");
    case "content.noGuarantee":
      return String(value || "").trim().length < 10 && fail("is required.");
    case "content.faqs":
      return (!Array.isArray(value) || value.some((f) => !f?.q?.trim() || !f?.a?.trim())) && fail("each FAQ needs a question and an answer.");
    case "pricing.levelDefaults":
      return Object.values(value || {}).some((l) => !(l?.priceINR >= 0) || !(l?.durationDays >= 1)) && fail("each level needs a price and a duration.");
    default:
      return null;
  }
}

const MERGED_KEYS = ["pricing.levelDefaults", "policies.versions", "policies.text", "content.hero"];

/* ───────────────────────── support ───────────────────────── */

const STAFF = ["ADMIN", "PROJECT_MANAGER", "FINANCE"];
const isStaff = (u) => STAFF.includes(u?.role);
const CATEGORIES = ["GENERAL", "PAYMENT", "COURSE", "ASSESSMENT", "PROJECT", "COMPLAINT", "DISPUTE"];
const CLOSED = ["RESOLVED", "CLOSED"];
const PRIORITY_RANK = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

function ticketOut(db, t, viewer) {
  // Staff see internal notes, but not on a ticket they opened themselves (they are the customer there).
  const staff = isStaff(viewer) && t.userId !== viewer?.id;
  const u = db.findById("users", t.userId);
  return {
    ...t,
    user: u ? { id: u.id, name: u.name, username: u.username, avatarUrl: u.avatarUrl, ...(staff ? { email: u.email } : {}) } : null,
    ownerId: staff ? t.ownerId : null,
    messages: (t.messages || []).filter((m) => staff || !m.internal),
  };
}

function visibleTicket(db, id, user) {
  const t = db.findById("supportTickets", id);
  if (!t || (t.userId !== user.id && !isStaff(user))) throw httpError(404, "Ticket not found.");
  return t;
}

/* ───────────────────────── dashboard next action (mirrors api/src/services/next-action.js) ───────────────────────── */

const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** First collection that exists with data, so the dashboard reads other domains' demo data whatever it is called. */
const coll = (db, ...names) => {
  for (const n of names) {
    const rows = db.all(n);
    if (rows.length) return rows;
  }
  return [];
};

export function nextActionFor({ courses, attemptByCourse, openOffers, pendingOrders, activeVerifications }) {
  const title = (courseId) => courses.find((c) => c.courseId === courseId)?.courseTitle || "your course";
  const attempts = [...attemptByCourse.entries()].map(([courseId, a]) => ({ ...a, courseId }));
  const withStatus = (...s) => attempts.find((a) => s.includes(a.status));

  const offer = openOffers[0];
  if (offer) return { kind: "VIEW_OFFER", title: "You have a project offer", body: `${offer.title}.${offer.expiresAt ? ` Reply by ${fmt(offer.expiresAt)}.` : ""}`, cta: "View project", to: `/app/projects/${offer.id}` };

  const reassess = withStatus("REASSESSMENT_REQUIRED");
  if (reassess) {
    return {
      kind: "REASSESS",
      title: "View feedback and reassess",
      body: `${title(reassess.courseId)}${reassess.totalScore != null ? `: ${reassess.totalScore}/100` : ""}.${reassess.reassessUntil ? ` Reassess by ${fmt(reassess.reassessUntil)}.` : ""}`,
      cta: "View feedback",
      to: `/app/assessments/${reassess.courseId}`,
    };
  }
  const passed = attempts.find((a) => a.status === "PASSED" && !a.onboarding?.submittedAt);
  if (passed) return { kind: "VERIFY", title: "Get verified", body: `You passed ${title(passed.courseId)}. Complete your profile to verify the skill.`, cta: "Get verified", to: `/app/assessments/${passed.courseId}` };

  const draft = withStatus("IN_PROGRESS");
  if (draft) return { kind: "SUBMIT_ASSESSMENT", title: "Submit your assessment", body: `Your ${title(draft.courseId)} assessment is started but not submitted.`, cta: "Submit", to: `/app/assessments/${draft.courseId}` };

  const order = pendingOrders[0];
  if (order) return { kind: "PAYMENT", title: "Complete your payment", body: `${order.courseTitle} starts once payment is confirmed.`, cta: "View payment", to: "/app/payments" };

  const learningCourse = courses.find((c) => c.nextLesson && !attemptByCourse.get(c.courseId));
  if (learningCourse) {
    return {
      kind: "CONTINUE_LESSON",
      title: "Finish your next lesson",
      body: `${learningCourse.nextLesson.title} · ${learningCourse.courseTitle}. ${learningCourse.lessonsLeft} left.`,
      cta: "Start",
      to: `/app/courses/${learningCourse.courseId}/learn/${learningCourse.nextLesson.id}`,
    };
  }
  const ready = courses.find((c) => c.hasAssessment && !attemptByCourse.get(c.courseId));
  if (ready) return { kind: "START_ASSESSMENT", title: "Start your final assessment", body: `You finished the lessons in ${ready.courseTitle}. Prove the skill to get verified.`, cta: "Start", to: `/app/assessments/${ready.courseId}` };

  const waiting = withStatus("SUBMITTED", "UNDER_REVIEW", "APPEAL_PENDING");
  if (waiting) {
    return {
      kind: "UNDER_REVIEW",
      title: waiting.status === "APPEAL_PENDING" ? "Your appeal is being reviewed" : "Your assessment is being reviewed",
      body: `${title(waiting.courseId)}. We'll notify you when the result is ready.`,
      cta: "View status",
      to: `/app/assessments/${waiting.courseId}`,
    };
  }
  const onboarded = withStatus("PASSED");
  if (onboarded) return { kind: "VERIFICATION_PENDING", title: "Verification in review", body: `We're checking your profile for ${title(onboarded.courseId)}.`, cta: "View skills", to: "/app/skills" };

  if (activeVerifications > 0) {
    return { kind: "OPPORTUNITIES", title: "You're verified", body: "Keep your availability up to date to be considered when suitable client work is available.", cta: "View opportunities", to: "/app/opportunities" };
  }
  return { kind: "EXPLORE", title: "Choose your first skill", body: "Pick a course, learn through practical lessons and prove it in one final task.", cta: "Explore courses", to: "/app/catalog" };
}

function journeyFor(db, me) {
  const enrollments = db
    .filter("enrollments", (e) => e.userId === me.id)
    .sort((a, b) => new Date(b.updatedAt || b.startedAt) - new Date(a.updatedAt || a.startedAt));
  const enrolled = new Set(enrollments.map((e) => e.courseId));

  const assessments = coll(db, "assessments");
  const courseOfAssessment = new Map(assessments.map((a) => [a.id, a.courseId]));
  const assessed = new Set(assessments.map((a) => a.courseId));

  const attemptByCourse = new Map();
  coll(db, "assessmentAttempts", "attempts")
    .filter((a) => a.userId === me.id)
    .sort((a, b) => (b.attemptNo || 0) - (a.attemptNo || 0))
    .forEach((a) => {
      const courseId = a.courseId || courseOfAssessment.get(a.assessmentId);
      if (courseId && !attemptByCourse.has(courseId)) attemptByCourse.set(courseId, a);
    });

  const courses = enrollments
    .map((e) => {
      const course = db.findById("courses", e.courseId);
      if (!course) return null;
      const lessons = (course.modules || []).flatMap((m) => m.lessons || []);
      const done = new Set(e.completedLessonIds || []);
      const next = lessons.find((l) => !done.has(l.id));
      return {
        courseId: course.id,
        courseTitle: course.title,
        progressPercent: e.progressPercent || 0,
        nextLesson: next ? { id: next.id, title: next.title } : null,
        lessonsLeft: lessons.filter((l) => !done.has(l.id)).length,
        hasAssessment: assessed.has(course.id),
      };
    })
    .filter(Boolean);

  const verifications = coll(db, "skillVerifications", "verifications")
    .filter((v) => v.userId === me.id)
    .sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt));
  const nowMs = Date.now();
  const offers = coll(db, "projectOffers", "offers")
    .filter((o) => o.studentId === me.id && o.status === "OFFERED" && (!o.expiresAt || new Date(o.expiresAt).getTime() > nowMs))
    .sort((a, b) => new Date(a.expiresAt || 8.64e15) - new Date(b.expiresAt || 8.64e15));
  const pendingOrders = coll(db, "courseOrders", "orders")
    .filter((o) => o.userId === me.id && o.status === "PENDING" && !enrolled.has(o.courseId))
    .map((o) => ({ id: o.id, courseId: o.courseId, courseTitle: db.findById("courses", o.courseId)?.title || "Your course" }));

  const skillOf = (v) => {
    if (v.skill) return v.skill;
    const s = db.findById("skills", v.skillId);
    return s ? { id: s.id, slug: s.slug, name: s.name } : { id: v.skillId, slug: v.skillId, name: v.skillId };
  };

  return {
    nextAction: nextActionFor({
      courses,
      attemptByCourse,
      openOffers: offers,
      pendingOrders,
      activeVerifications: verifications.filter((v) => v.status === "ACTIVE").length,
    }),
    courseProgress: courses.map(({ courseId, courseTitle, progressPercent, lessonsLeft }) => ({ courseId, courseTitle, progressPercent, lessonsLeft })),
    assessments: courses
      .filter((c) => c.hasAssessment || attemptByCourse.has(c.courseId))
      .map((c) => {
        const a = attemptByCourse.get(c.courseId);
        return {
          course: { id: c.courseId, title: c.courseTitle },
          status: a?.status || "NOT_STARTED",
          attemptNo: a?.attemptNo ?? 0,
          totalScore: a && ["PASSED", "REASSESSMENT_REQUIRED", "FAILED", "VERIFIED"].includes(a.status) ? a.totalScore ?? null : null,
          reassessUntil: a?.reassessUntil ?? null,
        };
      }),
    verifiedSkills: verifications.map((v) => ({ id: v.id, skill: skillOf(v), level: v.level, status: v.status, awardedAt: v.awardedAt, expiresAt: v.expiresAt ?? null, verifyCode: v.verifyCode })),
    openOffers: offers.map((o) => ({ id: o.id, title: o.title, expiresAt: o.expiresAt ?? null, payoutINR: o.payoutINR })),
  };
}

/* ───────────────────────── feature-flag gates on other domains' demo routes ───────────────────────── */

const GATES = {
  aiTutor: ["POST /api/tutor/chat"],
  gigs: ["GET /api/ladder", "GET /api/gigs", "GET /api/gigs/:id", "POST /api/gigs/:id/apply", "POST /api/gig-applications/:id/submit", "GET /api/me/gig-applications"],
  wallet: ["GET /api/wallet", "POST /api/wallet/withdraw"],
  gamification: ["GET /api/leaderboard"],
  community: [
    "GET /api/threads",
    "POST /api/threads",
    "GET /api/threads/:id",
    "POST /api/threads/:id/replies",
    "POST /api/threads/:id/upvote",
    "POST /api/replies/:id/upvote",
    "POST /api/replies/:id/accept",
    "GET /api/community/top-helpers",
  ],
  // mentor profiles (GET /api/mentors, /api/mentors/:id) stay readable; only booking is switchable
  mentorBooking: ["POST /api/mentors/:id/book", "GET /api/me/bookings", "POST /api/bookings/:id/cancel"],
  cohorts: ["GET /api/cohorts", "GET /api/cohorts/:id", "POST /api/cohorts/:id/join", "POST /api/cohorts/:id/leave", "POST /api/cohorts/:id/posts"],
};

/** Looked up at call time (live bindings), so import order between handler files never matters. */
const originalHandler = (key) => learning[key] || earn[key] || community[key];

const gated = Object.fromEntries(
  Object.entries(GATES).flatMap(([flag, keys]) =>
    keys.map((key) => [
      key,
      (ctx) => {
        requireDemoFlag(ctx.db, flag);
        const original = originalHandler(key);
        if (!original) throw httpError(404, `Demo route not found: ${key}`);
        return original(ctx);
      },
    ]),
  ),
);

/* ───────────────────────── handlers ───────────────────────── */

export default {
  ...gated,

  "GET /api/platform/config": ({ db }) => publicConfig(demoSettings(db)),

  "GET /api/platform/policies/:doc": ({ params, db }) => {
    const doc = String(params.doc).toLowerCase();
    const key = POLICY_DOCS[doc];
    if (!key) throw httpError(404, "Policy not found.");
    const s = demoSettings(db);
    return { doc, version: s["policies.versions"]?.[key] || null, text: s["policies.text"]?.[key]?.trim() || DEFAULT_POLICY_TEXT[key] };
  },

  "GET /api/admin/settings": ({ db, user }) => {
    requireRole(user, "ADMIN");
    return { settings: demoSettings(db) };
  },

  "PUT /api/admin/settings": ({ body, db, user }) => {
    requireRole(user, "ADMIN");
    const patch = { ...(body || {}) };
    if (!Object.keys(patch).length) throw httpError(400, "Nothing to save.");
    const current = demoSettings(db);
    for (const [key, value] of Object.entries(patch)) checkSetting(key, value);
    for (const key of MERGED_KEYS) if (patch[key]) patch[key] = { ...(current[key] || {}), ...patch[key] };
    const before = {};
    for (const [key, value] of Object.entries(patch)) {
      before[key] = current[key];
      if (db.findById("platformSettings", key)) db.update("platformSettings", key, { value, updatedById: user.id, updatedAt: now() });
      else db.insert("platformSettings", { id: key, key, value, updatedById: user.id, updatedAt: now() });
    }
    demoAudit(db, user, { action: "settings.update", entity: "PlatformSetting", entityId: Object.keys(patch).join(","), before, after: patch });
    return { settings: demoSettings(db) };
  },

  /* support — student */
  "GET /api/support/tickets": ({ db, user }) => {
    requireUser(user);
    return db
      .filter("supportTickets", (t) => t.userId === user.id)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .map((t) => ticketOut(db, t, user));
  },

  "POST /api/support/tickets": ({ body, db, user }) => {
    requireUser(user);
    const category = body.category || "GENERAL";
    const subject = String(body.subject || "").trim();
    const text = String(body.body || "").trim();
    if (!CATEGORIES.includes(category)) throw httpError(400, "Pick a category.");
    if (subject.length < 3) throw httpError(400, "subject: Add a short subject.");
    if (text.length < 10) throw httpError(400, "body: Tell us a little more (at least 10 characters).");
    const recent = db.filter("supportTickets", (t) => t.userId === user.id && Date.now() - new Date(t.createdAt) < 3600000).length;
    if (recent >= 10) throw httpError(429, "You've raised several tickets in a short time. Please wait before opening another.");
    const t = db.insert("supportTickets", {
      id: uid("tk"),
      userId: user.id,
      category,
      subject: subject.slice(0, 140),
      body: text.slice(0, 5000),
      status: "OPEN",
      priority: category === "COMPLAINT" || category === "DISPUTE" ? "HIGH" : "NORMAL",
      ownerId: null,
      relatedType: body.relatedId ? body.relatedType || null : null,
      relatedId: body.relatedId || null,
      messages: [],
      resolution: null,
      resolvedAt: null,
      createdAt: now(),
      updatedAt: now(),
    });
    notify(db, user.id, { type: "SYSTEM", title: "We got your request", body: `Ticket "${t.subject}" is open. We usually reply within 2 working days.`, link: `/app/help/${t.id}` });
    return ticketOut(db, t, user);
  },

  "GET /api/support/tickets/:id": ({ params, db, user }) => {
    requireUser(user);
    return ticketOut(db, visibleTicket(db, params.id, user), user);
  },

  "POST /api/support/tickets/:id/messages": ({ params, body, db, user }) => {
    requireUser(user);
    const t = visibleTicket(db, params.id, user);
    const text = String(body.body || "").trim();
    if (!text) throw httpError(400, "Write a message.");
    const staff = isStaff(user) && t.userId !== user.id;
    const internal = staff && Boolean(body.internal);
    const message = { id: uid("tm"), authorId: user.id, authorName: staff ? `${user.name} (Support)` : user.name, body: text.slice(0, 5000), internal, at: now() };
    const patch = { messages: [...(t.messages || []), message], updatedAt: now() };
    if (!staff && CLOSED.includes(t.status)) patch.status = "OPEN";
    if (staff && !internal && t.status === "OPEN") patch.status = "IN_PROGRESS";
    if (staff && !t.ownerId) patch.ownerId = user.id;
    const updated = db.update("supportTickets", t.id, patch);
    if (staff && !internal) notify(db, t.userId, { type: "SYSTEM", title: "Support replied", body: `New reply on "${t.subject}".`, link: `/app/help/${t.id}` });
    else if (!staff && t.ownerId) notify(db, t.ownerId, { type: "SYSTEM", title: "Ticket reply", body: `${user.name} replied on "${t.subject}".`, link: "/admin/support" });
    return ticketOut(db, updated, user);
  },

  /* support — staff */
  "GET /api/admin/support/tickets": ({ query, db, user }) => {
    requireRole(user, "PROJECT_MANAGER", "FINANCE");
    const status = query.status && query.status !== "all" ? query.status : null;
    const category = query.category && query.category !== "all" ? query.category : null;
    return db
      .filter("supportTickets", (t) => (!status || t.status === status) && (!category || t.category === category))
      .sort(
        (a, b) =>
          Number(CLOSED.includes(a.status)) - Number(CLOSED.includes(b.status)) ||
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          new Date(b.updatedAt) - new Date(a.updatedAt),
      )
      .map((t) => ticketOut(db, t, user));
  },

  "PATCH /api/admin/support/tickets/:id": ({ params, body, db, user }) => {
    requireRole(user, "PROJECT_MANAGER", "FINANCE");
    const t = db.findById("supportTickets", params.id);
    if (!t) throw httpError(404, "Ticket not found.");
    const { status, priority, ownerId, resolution } = body || {};
    if (ownerId) {
      const owner = db.findById("users", ownerId);
      if (!owner || !STAFF.includes(owner.role)) throw httpError(400, "Assign the ticket to a support staff member.");
    }
    if (status === "RESOLVED" && !(resolution ?? t.resolution)) throw httpError(400, "Add a short resolution before resolving.");
    const patch = { updatedAt: now() };
    if (status) {
      patch.status = status;
      patch.resolvedAt = CLOSED.includes(status) ? t.resolvedAt || now() : null;
    }
    if (priority) patch.priority = priority;
    if (ownerId !== undefined) patch.ownerId = ownerId;
    if (resolution !== undefined) patch.resolution = resolution;
    const updated = db.update("supportTickets", t.id, patch);
    const pick = (o) => ({ status: o.status, priority: o.priority, ownerId: o.ownerId, resolution: o.resolution });
    demoAudit(db, user, { action: "support.update", entity: "SupportTicket", entityId: t.id, before: pick(t), after: pick(updated) });
    if (status && status !== t.status && CLOSED.includes(status)) {
      notify(db, t.userId, {
        type: "SYSTEM",
        title: status === "RESOLVED" ? "Your ticket is resolved" : "Your ticket is closed",
        body: `"${t.subject}". Reply on the ticket if you still need help.`,
        link: `/app/help/${t.id}`,
      });
    }
    return ticketOut(db, updated, user);
  },

  /* dashboard: the learning handler's shape + spec v1.0 journey + flags */
  "GET /api/me/dashboard": (ctx) => {
    requireUser(ctx.user);
    const base = learning["GET /api/me/dashboard"](ctx);
    const flags = demoFlags(ctx.db);
    const me = ctx.db.findById("users", ctx.user.id) || ctx.user;
    return {
      ...base,
      upcomingSessions: flags.mentorBooking ? base.upcomingSessions : [],
      openGigsForYou: flags.gigs ? base.openGigsForYou : [],
      rank: flags.gamification ? base.rank : null,
      aspirantPlan: flags.aspirants ? base.aspirantPlan : null,
      ...journeyFor(ctx.db, me),
    };
  },
};
