/**
 * Demo-engine handlers, D workstream: project opportunities, PM workspace, project finance.
 * See campus/API_CONTRACT.md "Spec v1.0" → Projects & PM. Mirrors campus/api/src/routes/projects.js and
 * campus/api/src/services/projects.js (same rules, statuses and shapes).
 * Collections: projectOffers, projectAvailability (seeded defaults), skillVerifications (A + D seeds), skills (C), consentRecords.
 */
import { httpError, requireUser, requireRole, uid, now, miniUser } from "../utils";
import { notify } from "../points";
import { demoAudit, demoSettings } from "./platform";

/* ───────────────────────── rules (mirror api/src/services/projects.js) ───────────────────────── */

const ACTIVE_STATUSES = ["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "ON_HOLD", "DISPUTED"];
const FINANCE_STATUSES = [...ACTIVE_STATUSES, "COMPLETED", "CANCELLED"];
const CLOSED_UNSTARTED = ["DECLINED", "EXPIRED", "WITHDRAWN"];
const CLOSED_STATES = ["OFFERED", ...CLOSED_UNSTARTED, "CANCELLED", "COMPLETED"];
const STATUS_MOVES = {
  IN_PROGRESS: { from: ["ACCEPTED", "ON_HOLD", "DISPUTED"], note: false },
  ON_HOLD: { from: ["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED"], note: true },
  DISPUTED: { from: ["IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "ON_HOLD"], note: true },
  CANCELLED: { from: ["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED", "ON_HOLD", "DISPUTED"], note: true },
  WITHDRAWN: { from: ["OFFERED"], note: true },
  COMPLETED: { from: ["DISPUTED"], note: true },
};
const STATUS_TITLES = { IN_PROGRESS: "Project started", ON_HOLD: "Project on hold", DISPUTED: "Project under dispute", CANCELLED: "Project cancelled", WITHDRAWN: "Offer withdrawn", COMPLETED: "Project completed" };
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "STANDARD"];
const LEVEL_RANK = { BEGINNER: 1, STANDARD: 1, INTERMEDIATE: 2, ADVANCED: 3 };
const levelCovers = (held, wanted) => !wanted || (LEVEL_RANK[held] || 0) >= (LEVEL_RANK[wanted] || 0);
const SPLIT_BASES = ["CLIENT_PRICE_EX_TAX", "CLIENT_PRICE_INC_TAX"];
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const arr = (v) => (Array.isArray(v) ? v : []);
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const dateIN = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "");
const isExpired = (o, at = Date.now()) => o.status === "OFFERED" && o.expiresAt && new Date(o.expiresAt).getTime() < at;
const effectiveStatus = (o) => (isExpired(o) ? "EXPIRED" : o.status);
const lastDelivery = (o) => arr(o.deliveries).at(-1) || null;
const stageOf = (o) => {
  const s = effectiveStatus(o);
  if (s === "SUBMITTED") return lastDelivery(o)?.review?.decision === "APPROVE" ? "CLIENT_REVIEW" : "PM_REVIEW";
  return s;
};
const historyEntry = (status, by, note = null) => ({ status, at: now(), by: by ? { id: by.id, name: by.name } : null, note: note || null });
const adjustmentsTotal = (o) => arr(o.adjustments).reduce((s, a) => s + (Number(a.amountINR) || 0), 0);

function computeSplit({ clientPriceINR, splitBasis, freelancerSharePercent, taxesINR, payoutINR }) {
  if (clientPriceINR == null) return { baseINR: null, ruleFreelancerINR: null, platformShareINR: null, varianceINR: null };
  const baseINR = splitBasis === "CLIENT_PRICE_INC_TAX" ? clientPriceINR + (taxesINR || 0) : clientPriceINR;
  const pct = freelancerSharePercent ?? 50;
  const ruleFreelancerINR = Math.round((baseINR * pct) / 100);
  return { baseINR, ruleFreelancerINR, platformShareINR: baseINR - ruleFreelancerINR, varianceINR: (payoutINR ?? 0) - ruleFreelancerINR };
}
function snapshotFinance(o, settings) {
  const splitBasis = o.splitBasis || settings["finance.splitBasis"] || "CLIENT_PRICE_EX_TAX";
  const freelancerSharePercent = o.freelancerSharePercent ?? settings["finance.freelancerSharePercent"] ?? 50;
  return { splitBasis, freelancerSharePercent, platformShareINR: computeSplit({ ...o, splitBasis, freelancerSharePercent }).platformShareINR };
}

function reliabilityOf(offers) {
  const monthAgo = Date.now() - 30 * 86400000;
  const completed = offers.filter((o) => o.status === "COMPLETED");
  const timed = completed.filter((o) => o.deadline && arr(o.deliveries).length);
  const onTime = timed.filter((o) => {
    const d = arr(o.deliveries).find((x) => x.review?.decision === "APPROVE") || arr(o.deliveries).at(-1);
    return new Date(d.submittedAt) <= new Date(o.deadline);
  }).length;
  const rated = completed.filter((o) => o.rating);
  return {
    activeProjects: offers.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    completedProjects: completed.length,
    onTimeRate: timed.length ? Math.round((onTime / timed.length) * 100) : null,
    avgRating: rated.length ? Math.round((rated.reduce((s, o) => s + o.rating, 0) / rated.length) * 10) / 10 : null,
    openDisputes: offers.filter((o) => o.status === "DISPUTED").length,
    offersLast30d: offers.filter((o) => new Date(o.createdAt).getTime() >= monthAgo).length,
    lastOfferAt: offers.reduce((m, o) => (!m || new Date(o.createdAt) > new Date(m) ? o.createdAt : m), null),
  };
}

/* ───────────────────────── lookups ───────────────────────── */

/** Skill ref from the catalogue (C) when present, else the seed's embedded copy. Matches by id or slug. */
function skillRef(db, idOrSlug, fallback = null) {
  const s = db.find("skills", (x) => x.id === idOrSlug || x.slug === idOrSlug) || fallback;
  return s ? { id: s.id, slug: s.slug, name: s.name } : null;
}
const sameSkill = (db, a, b) => {
  if (!a || !b) return false;
  if (a === b) return true;
  const ra = skillRef(db, a);
  const rb = skillRef(db, b);
  const slug = (x, r) => r?.slug || String(x).replace(/^sk_/, "");
  return slug(a, ra) === slug(b, rb);
};

/** A verification normalised: { ...v, skill: {id,slug,name} }. A's docs may carry skill inline or only skillId. */
function verOut(db, v) {
  return { ...v, skill: skillRef(db, v.skill?.slug || v.skillId, v.skill) || v.skill || { id: v.skillId, slug: v.skillId, name: v.skillId } };
}
const activeVerifications = (db, userId) =>
  db
    .filter("skillVerifications", (v) => (!userId || v.userId === userId) && v.status === "ACTIVE" && (!v.expiresAt || new Date(v.expiresAt) > new Date()))
    .map((v) => verOut(db, v));

const DEFAULT_AVAILABILITY = { openToProjects: false, hoursPerWeek: 0, days: [], preferredTaskTypes: [], tools: [], communication: "" };
function availabilityOf(db, u) {
  const own = u?.availability && Object.keys(u.availability).length ? u.availability : null;
  // eslint-disable-next-line no-unused-vars
  const { id, userId, ...seeded } = db.findById("projectAvailability", u?.id) || {};
  return { ...DEFAULT_AVAILABILITY, ...(own || seeded) };
}

const userMini = (db, id) => {
  const u = db.findById("users", id);
  return u ? miniUser(u) : { id, name: "Student", username: null, avatarUrl: null, role: "STUDENT", division: null, college: null };
};

/* ───────────────────────── shapes (mirror api/src/lib/serialize-projects.js) ───────────────────────── */

const milestonesOut = (o) =>
  arr(o.milestones).map((m) => ({ id: m.id, title: m.title, dueAt: m.dueAt || null, status: m.status || "PENDING", overdue: m.status !== "APPROVED" && Boolean(m.dueAt) && new Date(m.dueAt) < new Date() }));
const deliveriesOut = (o) =>
  arr(o.deliveries).map((d) => ({
    version: d.version,
    text: d.text || "",
    links: arr(d.links),
    submittedAt: d.submittedAt,
    review: d.review ? { decision: d.review.decision, note: d.review.note || null, at: d.review.at, by: d.review.by ? { name: d.review.by.name } : null } : null,
  }));

function common(db, o) {
  return {
    id: o.id,
    title: o.title,
    summary: o.summary || "",
    skill: skillRef(db, o.skill?.slug || o.skillId, o.skill),
    level: o.level ?? null,
    deliverables: o.deliverables || [],
    acceptanceCriteria: o.acceptanceCriteria || [],
    expectedHours: o.expectedHours ?? null,
    deadline: o.deadline ?? null,
    milestones: milestonesOut(o),
    payoutINR: o.payoutINR,
    revisionLimit: o.revisionLimit ?? 2,
    revisionsUsed: o.revisionsUsed ?? 0,
    tools: o.tools || [],
    confidentiality: o.confidentiality || "",
    status: effectiveStatus(o),
    stage: stageOf(o),
    expiresAt: o.expiresAt ?? null,
    respondedAt: o.respondedAt ?? null,
    deliveries: deliveriesOut(o),
    payoutStatus: o.payoutStatus || "NOT_DUE",
    paidAt: o.paidAt ?? null,
    clientAcceptedAt: o.clientAcceptedAt ?? null,
    feedback: o.feedback ?? null,
    rating: o.rating ?? null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt || o.createdAt,
  };
}

const studentOut = (db, o) => ({
  ...common(db, o),
  declineReason: o.declineReason ?? null,
  netPayoutINR: o.payoutINR + adjustmentsTotal(o),
  pm: o.pmId ? { name: db.findById("users", o.pmId)?.name || o.pm?.name || "Project manager" } : null,
  support: { link: "/app/help", label: "Help & support" },
  history: arr(o.history).map((h) => ({ status: h.status, at: h.at })),
});

function financeBlock(o) {
  const split = computeSplit({ ...o, splitBasis: o.splitBasis || "CLIENT_PRICE_EX_TAX" });
  const adj = adjustmentsTotal(o);
  return {
    clientPriceINR: o.clientPriceINR ?? null,
    splitBasis: o.splitBasis ?? null,
    freelancerSharePercent: o.freelancerSharePercent ?? null,
    platformShareINR: o.platformShareINR ?? null,
    computedPlatformShareINR: split.platformShareINR,
    ruleFreelancerINR: split.ruleFreelancerINR,
    varianceINR: split.varianceINR,
    taxesINR: o.taxesINR ?? null,
    adjustments: arr(o.adjustments),
    adjustmentsTotalINR: adj,
    netPayoutINR: o.payoutINR + adj,
    payoutStatus: o.payoutStatus || "NOT_DUE",
    payoutRef: o.payoutRef ?? null,
    paidAt: o.paidAt ?? null,
  };
}

function pmOut(db, o, viewer) {
  const pm = o.pmId ? db.findById("users", o.pmId) : null;
  return {
    ...common(db, o),
    catalanceProjectId: o.catalanceProjectId ?? null,
    skillId: o.skillId ?? null,
    pmId: o.pmId ?? null,
    pm: pm ? { id: pm.id, name: pm.name, avatarUrl: pm.avatarUrl ?? null } : null,
    studentId: o.studentId,
    student: userMini(db, o.studentId),
    declineReason: o.declineReason ?? null,
    shortlistReason: o.shortlistReason || "",
    history: arr(o.history),
    ...(viewer?.role === "ADMIN" ? { finance: financeBlock(o) } : {}),
  };
}

function financeOut(db, o) {
  const pm = o.pmId ? db.findById("users", o.pmId) : null;
  return {
    id: o.id,
    title: o.title,
    catalanceProjectId: o.catalanceProjectId ?? null,
    skill: skillRef(db, o.skill?.slug || o.skillId, o.skill),
    level: o.level ?? null,
    status: effectiveStatus(o),
    student: userMini(db, o.studentId),
    pm: pm ? { id: pm.id, name: pm.name } : null,
    payoutINR: o.payoutINR,
    clientAcceptedAt: o.clientAcceptedAt ?? null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt || o.createdAt,
    ...financeBlock(o),
  };
}

/* ───────────────────────── sweeps + loaders ───────────────────────── */

function save(db, o, patch) {
  return db.update("projectOffers", o.id, { ...patch, updatedAt: now() });
}

/** Persist EXPIRED past expiry (notify the PM) and send one due-soon / overdue milestone notice each. */
function sweep(db, o) {
  if (isExpired(o)) {
    o = save(db, o, { status: "EXPIRED", history: [...arr(o.history), historyEntry("EXPIRED", null, "No reply before the offer expired.")] });
    if (o.pmId) notify(db, o.pmId, { type: "GIG", title: `Offer expired: ${o.title}`, body: "The student did not reply in time. You can offer it to another student.", link: `/admin/offers/${o.id}` });
  }
  if (["ACCEPTED", "IN_PROGRESS", "REVISION_REQUESTED"].includes(o.status)) {
    let changed = false;
    const at = Date.now();
    const milestones = arr(o.milestones).map((m) => {
      if (m.status === "APPROVED" || !m.dueAt) return m;
      const hours = (new Date(m.dueAt).getTime() - at) / 3600000;
      if (hours < 0 && !m.overdueNotifiedAt) {
        changed = true;
        notify(db, o.studentId, { type: "GIG", title: `Milestone overdue: ${m.title}`, body: `${o.title}. Tell your PM if you need help.`, link: `/app/projects/${o.id}` });
        if (o.pmId) notify(db, o.pmId, { type: "GIG", title: `Milestone overdue: ${m.title}`, body: o.title, link: `/admin/offers/${o.id}` });
        return { ...m, overdueNotifiedAt: now(), dueNotifiedAt: m.dueNotifiedAt || now() };
      }
      if (hours >= 0 && hours <= 24 && !m.dueNotifiedAt) {
        changed = true;
        notify(db, o.studentId, { type: "GIG", title: `Milestone due soon: ${m.title}`, body: `${o.title}. Due ${dateIN(m.dueAt)}.`, link: `/app/projects/${o.id}` });
        return { ...m, dueNotifiedAt: now() };
      }
      return m;
    });
    if (changed) o = db.update("projectOffers", o.id, { milestones });
  }
  return o;
}

function ownOffer(db, id, user) {
  const o = db.findById("projectOffers", id);
  if (!o || o.studentId !== user.id) throw httpError(404, "Offer not found.");
  return sweep(db, o);
}

function managedOffer(db, id, user) {
  const o = db.findById("projectOffers", id);
  if (!o || (user.role !== "ADMIN" && o.pmId !== user.id)) throw httpError(404, "Offer not found.");
  return sweep(db, o);
}

function financeOffer(db, id) {
  const o = db.findById("projectOffers", id);
  if (!o || !FINANCE_STATUSES.includes(o.status)) throw httpError(404, "Offer not found.");
  return o;
}

/* ───────────────────────── validation helpers ───────────────────────── */

const str = (v, max = 300) => String(v ?? "").trim().slice(0, max);
const strList = (v, max = 20, len = 300) => (Array.isArray(v) ? v.map((x) => str(x, len)).filter(Boolean).slice(0, max) : []);
const int = (v) => (v === "" || v == null ? null : Number.isFinite(Number(v)) ? Math.round(Number(v)) : NaN);
const isUrl = (s) => /^https?:\/\/\S+\.\S+/.test(s);

function parseOfferFields(db, b, partial = false) {
  const out = {};
  const has = (k) => !partial || k in b;
  if (has("title")) {
    out.title = str(b.title, 140);
    if (out.title.length < 3) throw httpError(400, "title: Add a title.");
  }
  if (has("summary")) out.summary = str(b.summary, 3000);
  if (has("catalanceProjectId")) out.catalanceProjectId = str(b.catalanceProjectId, 100) || null;
  if (has("skillId")) {
    out.skillId = str(b.skillId, 100);
    if (!out.skillId) throw httpError(400, "skillId: Pick the skill.");
  }
  if (has("level")) {
    if (!LEVELS.includes(b.level)) throw httpError(400, "level: Pick the level.");
    out.level = b.level;
  }
  if (has("deliverables")) {
    out.deliverables = strList(b.deliverables);
    if (!out.deliverables.length) throw httpError(400, "deliverables: Add at least one deliverable.");
  }
  if (has("acceptanceCriteria")) {
    out.acceptanceCriteria = strList(b.acceptanceCriteria);
    if (!out.acceptanceCriteria.length) throw httpError(400, "acceptanceCriteria: Add at least one acceptance criterion.");
  }
  if (has("expectedHours")) {
    out.expectedHours = int(b.expectedHours);
    if (!(out.expectedHours >= 1 && out.expectedHours <= 500)) throw httpError(400, "expectedHours: Enter 1 to 500 hours.");
  }
  if (has("deadline")) {
    const d = new Date(b.deadline);
    if (!b.deadline || Number.isNaN(d.getTime())) throw httpError(400, "deadline: Set a deadline.");
    out.deadline = d.toISOString();
  }
  if (has("milestones")) {
    out.milestones = arr(b.milestones)
      .slice(0, 12)
      .filter((m) => str(m?.title))
      .map((m, i) => ({ id: m.id || uid(`ms${i}`), title: str(m.title, 140), dueAt: m.dueAt ? new Date(m.dueAt).toISOString() : null, status: m.status || "PENDING" }));
  }
  if (has("payoutINR")) {
    out.payoutINR = int(b.payoutINR);
    if (!(out.payoutINR >= 1 && out.payoutINR <= 1000000)) throw httpError(400, "payoutINR: Set the payout.");
  }
  if (has("revisionLimit")) {
    out.revisionLimit = int(b.revisionLimit ?? 2);
    if (!(out.revisionLimit >= 0 && out.revisionLimit <= 5)) throw httpError(400, "revisionLimit: 0 to 5.");
  }
  if (has("tools")) out.tools = strList(b.tools, 20, 80);
  if (has("confidentiality")) out.confidentiality = str(b.confidentiality, 3000);
  if ("shortlistReason" in b) {
    out.shortlistReason = str(b.shortlistReason, 1000);
    if (out.shortlistReason.length < 10) throw httpError(400, "shortlistReason: Say why this student fits (at least 10 characters).");
  }
  return out;
}

function assertEligible(db, studentId, skillId, level) {
  const student = db.findById("users", studentId);
  if (!student) throw httpError(404, "Student not found.");
  if (student.status === "SUSPENDED") throw httpError(400, "This student is suspended and can't receive offers.");
  const ok = activeVerifications(db, studentId).some((v) => (sameSkill(db, v.skillId, skillId) || sameSkill(db, v.skill?.slug, skillId)) && levelCovers(v.level, level));
  if (!ok) throw httpError(400, "This student has no active verification for this skill and level.");
  return student;
}

/* ───────────────────────── handlers ───────────────────────── */

const STUDENT_BUCKETS = {
  open: (o) => o.status === "OFFERED",
  active: (o) => ACTIVE_STATUSES.includes(o.status),
  past: (o) => ["COMPLETED", "CANCELLED", ...CLOSED_UNSTARTED].includes(o.status),
};

export default {
  /* ── student ── */
  "GET /api/me/offers": ({ user, db, query }) => {
    requireUser(user);
    const rows = db
      .filter("projectOffers", (o) => o.studentId === user.id)
      .map((o) => sweep(db, o))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const bucket = STUDENT_BUCKETS[query.status];
    return (bucket ? rows.filter(bucket) : rows).map((o) => studentOut(db, o));
  },

  "GET /api/me/offers/:id": ({ user, db, params }) => {
    requireUser(user);
    return studentOut(db, ownOffer(db, params.id, user));
  },

  "POST /api/me/offers/:id/accept": ({ user, db, params, body }) => {
    requireUser(user);
    const o = ownOffer(db, params.id, user);
    if (o.status === "EXPIRED") throw httpError(410, "This offer has expired.");
    if (o.status !== "OFFERED") throw httpError(400, "This offer is no longer open.");
    if (!arr(body.consents).includes("PROJECT_POLICY")) throw httpError(400, "Please agree to the project terms to accept.");
    const version = demoSettings(db)["policies.versions"]?.PROJECT_POLICY || "current";
    db.insert("consentRecords", { userId: user.id, purpose: "PROJECT_POLICY", policyVersion: version, context: `offer:${o.id}`, ip: null, userAgent: "demo", acceptedAt: now(), withdrawnAt: null });
    const u = save(db, o, { status: "ACCEPTED", respondedAt: now(), payoutStatus: "PENDING", history: [...arr(o.history), historyEntry("ACCEPTED", user)] });
    if (o.pmId) notify(db, o.pmId, { type: "GIG", title: `Offer accepted: ${o.title}`, body: `${user.name} accepted. Plan the kickoff.`, link: `/admin/offers/${o.id}` });
    return studentOut(db, u);
  },

  "POST /api/me/offers/:id/decline": ({ user, db, params, body }) => {
    requireUser(user);
    const o = ownOffer(db, params.id, user);
    if (o.status === "EXPIRED") throw httpError(410, "This offer has expired.");
    if (o.status !== "OFFERED") throw httpError(400, "This offer is no longer open.");
    const reason = str(body.reason, 500) || null;
    // Declining is never penalised (spec §13.4).
    const u = save(db, o, { status: "DECLINED", respondedAt: now(), declineReason: reason, history: [...arr(o.history), historyEntry("DECLINED", user, reason)] });
    if (o.pmId) notify(db, o.pmId, { type: "GIG", title: `Offer declined: ${o.title}`, body: reason ? `Reason: ${reason}` : "You can offer it to another student.", link: `/admin/offers/${o.id}` });
    return studentOut(db, u);
  },

  "POST /api/me/offers/:id/deliveries": ({ user, db, params, body }) => {
    requireUser(user);
    const o = ownOffer(db, params.id, user);
    if (!["ACCEPTED", "IN_PROGRESS", "REVISION_REQUESTED"].includes(o.status)) throw httpError(400, "You can't submit work on this project right now.");
    const text = str(body.text, 5000);
    const links = strList(body.links, 10, 500);
    if (links.some((l) => !isUrl(l))) throw httpError(400, "links: Each link must be a full URL.");
    if (!text && !links.length) throw httpError(400, "Add a note or at least one link.");
    const version = arr(o.deliveries).length + 1;
    const u = save(db, o, {
      status: "SUBMITTED",
      deliveries: [...arr(o.deliveries), { version, text, links, submittedAt: now(), review: null }],
      history: [...arr(o.history), historyEntry("SUBMITTED", user, `Version ${version}`)],
    });
    if (o.pmId) notify(db, o.pmId, { type: "GIG", title: `Review needed: ${o.title}`, body: `${user.name} submitted version ${version}.`, link: `/admin/offers/${o.id}` });
    return studentOut(db, u);
  },

  "GET /api/me/availability": ({ user, db }) => {
    requireUser(user);
    return { availability: availabilityOf(db, user) };
  },

  "PATCH /api/me/availability": ({ user, db, body }) => {
    requireUser(user);
    const hours = int(body.hoursPerWeek);
    if (typeof body.openToProjects !== "boolean") throw httpError(400, "openToProjects: Required.");
    if (!(hours >= 0 && hours <= 60)) throw httpError(400, "hoursPerWeek: Enter 0 to 60.");
    const days = arr(body.days).filter((d) => DAYS.includes(d));
    const availability = {
      openToProjects: body.openToProjects,
      hoursPerWeek: hours,
      days,
      preferredTaskTypes: strList(body.preferredTaskTypes, 10, 60),
      tools: strList(body.tools, 20, 60),
      communication: str(body.communication, 200),
      updatedAt: now(),
    };
    const updated = db.update("users", user.id, { availability });
    // eslint-disable-next-line no-unused-vars
    const { password, ...pub } = updated;
    return { user: pub };
  },

  /* ── PM: talent search ── */
  "GET /api/pm/talent": ({ user, db, query }) => {
    requireRole(user, "PROJECT_MANAGER");
    const { skill, level, q, studentId } = query;
    const available = query.available === "1" || query.available === "true";
    const lvl = LEVELS.includes(level) ? level : undefined;
    const all = activeVerifications(db);
    const matching = all.filter((v) => (!skill || v.skill?.slug === skill) && levelCovers(v.level, lvl) && (!studentId || v.userId === studentId));
    const ids = [...new Set(matching.map((v) => v.userId))];
    let rows = ids
      .map((id) => db.findById("users", id))
      .filter((u) => u && u.status !== "SUSPENDED")
      .map((u) => {
        // dedupe by skill + level (A's seed and D's seed may both cover a student)
        const seen = new Set();
        const vers = all
          .filter((v) => v.userId === u.id)
          .filter((v) => {
            const k = `${v.skill?.slug}:${v.level}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          })
          .sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt));
        const offers = db.filter("projectOffers", (o) => o.studentId === u.id).map((o) => ({ ...o, status: effectiveStatus(o) }));
        const portfolio = db
          .filter("portfolioItems", (p) => p.userId === u.id)
          .sort((a, b) => Number(b.verified) - Number(a.verified) || new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3)
          .map((p) => ({ id: p.id, title: p.title, link: p.link ?? null, skills: p.skills || [], verified: Boolean(p.verified) }));
        return {
          user: { id: u.id, name: u.name, username: u.username, avatarUrl: u.avatarUrl ?? null, headline: u.headline ?? null, city: u.city ?? null, college: u.college ?? null, year: u.year ?? null, stream: u.stream ?? null, skills: u.skills || [], language: u.language || "en" },
          verifications: vers.map((v) => ({ id: v.id, skill: v.skill, level: v.level, awardedAt: v.awardedAt, expiresAt: v.expiresAt ?? null, verifyCode: v.verifyCode, matches: (!skill || v.skill?.slug === skill) && levelCovers(v.level, lvl) })),
          availability: availabilityOf(db, u),
          portfolio,
          ...reliabilityOf(offers),
        };
      });
    if (available) rows = rows.filter((r) => r.availability.openToProjects);
    if (q) {
      const n = String(q).toLowerCase();
      rows = rows.filter((r) => [r.user.name, r.user.username, r.user.headline, r.user.skills.join(" "), r.availability.tools.join(" ")].some((t) => String(t || "").toLowerCase().includes(n)));
    }
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
    return rows;
  },

  /* ── PM: offers ── */
  "GET /api/pm/offers": ({ user, db, query }) => {
    requireRole(user, "PROJECT_MANAGER");
    let rows = db
      .filter("projectOffers", (o) => user.role === "ADMIN" || o.pmId === user.id)
      .map((o) => sweep(db, o))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .map((o) => pmOut(db, o, user));
    if (query.status && query.status !== "all") rows = rows.filter((o) => o.status === query.status || o.stage === query.status);
    if (query.q) {
      const n = String(query.q).toLowerCase();
      rows = rows.filter((o) => [o.title, o.student?.name, o.catalanceProjectId].some((t) => String(t || "").toLowerCase().includes(n)));
    }
    return rows;
  },

  "POST /api/pm/offers": ({ user, db, body }) => {
    requireRole(user, "PROJECT_MANAGER");
    const fields = parseOfferFields(db, body);
    if (!("shortlistReason" in fields)) throw httpError(400, "shortlistReason: Say why this student fits (at least 10 characters).");
    const studentId = str(body.studentId, 100);
    const student = assertEligible(db, studentId, fields.skillId, fields.level);
    if (new Date(fields.deadline) < new Date()) throw httpError(400, "The deadline must be in the future.");
    const settings = demoSettings(db);
    const expiresAt = new Date(Date.now() + (Number(settings["projects.offerExpiryHours"]) || 48) * 3600000).toISOString();
    const skill = skillRef(db, fields.skillId) || activeVerifications(db, studentId).find((v) => sameSkill(db, v.skillId, fields.skillId) || v.skill?.slug === fields.skillId)?.skill || null;
    const o = db.insert("projectOffers", {
      id: uid("po"),
      summary: "",
      milestones: [],
      revisionLimit: 2,
      tools: [],
      confidentiality: "",
      catalanceProjectId: null,
      ...fields,
      skill,
      revisionsUsed: 0,
      pmId: user.id,
      studentId: student.id,
      status: "OFFERED",
      expiresAt,
      respondedAt: null,
      declineReason: null,
      deliveries: [],
      clientPriceINR: null,
      splitBasis: null,
      freelancerSharePercent: null,
      platformShareINR: null,
      taxesINR: null,
      adjustments: [],
      payoutStatus: "NOT_DUE",
      payoutRef: null,
      paidAt: null,
      clientAcceptedAt: null,
      feedback: null,
      rating: null,
      history: [historyEntry("OFFERED", user, "Offer sent")],
      updatedAt: now(),
    });
    notify(db, student.id, { type: "GIG", title: `New project offer: ${o.title}`, body: `${inr(o.payoutINR)} · due ${dateIN(o.deadline)} · reply by ${dateIN(expiresAt)}`, link: `/app/projects/${o.id}` });
    demoAudit(db, user, { action: "offer.create", entity: "ProjectOffer", entityId: o.id, after: { studentId: o.studentId, payoutINR: o.payoutINR, skillId: o.skillId, level: o.level }, reason: o.shortlistReason });
    return pmOut(db, o, user);
  },

  "GET /api/pm/offers/:id": ({ user, db, params }) => {
    requireRole(user, "PROJECT_MANAGER");
    return pmOut(db, managedOffer(db, params.id, user), user);
  },

  "PUT /api/pm/offers/:id": ({ user, db, params, body }) => {
    requireRole(user, "PROJECT_MANAGER");
    const o = managedOffer(db, params.id, user);
    if (o.status !== "OFFERED") throw httpError(400, "Only open offers can be edited.");
    // eslint-disable-next-line no-unused-vars
    const { studentId, ...rest } = body;
    const fields = parseOfferFields(db, rest, true);
    if (fields.skillId || fields.level) assertEligible(db, o.studentId, fields.skillId || o.skillId, fields.level || o.level);
    if (fields.deadline && new Date(fields.deadline) < new Date()) throw httpError(400, "The deadline must be in the future.");
    if (fields.skillId) fields.skill = skillRef(db, fields.skillId) || activeVerifications(db, o.studentId).find((v) => sameSkill(db, v.skillId, fields.skillId))?.skill || o.skill;
    const payoutChanged = fields.payoutINR != null && fields.payoutINR !== o.payoutINR;
    const u = save(db, o, { ...fields, history: [...arr(o.history), historyEntry("OFFERED", user, payoutChanged ? `Payout changed to ${inr(fields.payoutINR)}` : "Offer details updated")] });
    notify(db, o.studentId, {
      type: "GIG",
      title: `Offer updated: ${u.title}`,
      body: payoutChanged ? `New payout ${inr(u.payoutINR)}. Please review before you reply.` : "Some details changed. Please review before you reply.",
      link: `/app/projects/${u.id}`,
    });
    if (payoutChanged) demoAudit(db, user, { action: "offer.payout_change", entity: "ProjectOffer", entityId: o.id, before: { payoutINR: o.payoutINR }, after: { payoutINR: u.payoutINR } });
    return pmOut(db, u, user);
  },

  "POST /api/pm/offers/:id/status": ({ user, db, params, body }) => {
    requireRole(user, "PROJECT_MANAGER");
    const o = managedOffer(db, params.id, user);
    const status = body.status;
    const note = str(body.note, 1000);
    const move = STATUS_MOVES[status];
    if (!move) throw httpError(400, "status: Not a valid status.");
    if (!move.from.includes(o.status)) throw httpError(400, `Can't move a ${o.status.toLowerCase().replace(/_/g, " ")} project to ${status.toLowerCase().replace(/_/g, " ")}.`);
    if (move.note && !note) throw httpError(400, "Add a short note for this change.");
    const patch = { status, history: [...arr(o.history), historyEntry(status, user, note)] };
    if (["CANCELLED", "WITHDRAWN"].includes(status) && o.payoutStatus !== "PAID") patch.payoutStatus = "NOT_DUE";
    if (status === "COMPLETED") Object.assign(patch, { payoutStatus: "ELIGIBLE", clientAcceptedAt: now(), ...(o.clientPriceINR != null ? snapshotFinance(o, demoSettings(db)) : {}) });
    const u = save(db, o, patch);
    notify(db, o.studentId, { type: "GIG", title: `${STATUS_TITLES[status]}: ${o.title}`, body: note || "", link: `/app/projects/${o.id}` });
    demoAudit(db, user, { action: `offer.status.${status.toLowerCase()}`, entity: "ProjectOffer", entityId: o.id, before: { status: o.status, payoutStatus: o.payoutStatus }, after: { status: u.status, payoutStatus: u.payoutStatus }, reason: note || null });
    return pmOut(db, u, user);
  },

  "POST /api/pm/offers/:id/milestones/:milestoneId": ({ user, db, params, body }) => {
    requireRole(user, "PROJECT_MANAGER");
    const o = managedOffer(db, params.id, user);
    if (CLOSED_STATES.includes(o.status)) throw httpError(400, "This project is closed.");
    if (!["PENDING", "SUBMITTED", "APPROVED"].includes(body.status)) throw httpError(400, "status: Not a valid milestone status.");
    const m = arr(o.milestones).find((x) => x.id === params.milestoneId);
    if (!m) throw httpError(404, "Milestone not found.");
    const u = save(db, o, { milestones: arr(o.milestones).map((x) => (x.id === m.id ? { ...x, status: body.status } : x)) });
    if (body.status === "APPROVED") notify(db, o.studentId, { type: "GIG", title: `Milestone approved: ${m.title}`, body: o.title, link: `/app/projects/${o.id}` });
    return pmOut(db, u, user);
  },

  "POST /api/pm/offers/:id/review": ({ user, db, params, body }) => {
    requireRole(user, "PROJECT_MANAGER");
    const o = managedOffer(db, params.id, user);
    const last = lastDelivery(o);
    if (o.status !== "SUBMITTED" || !last) throw httpError(400, "There is no delivery waiting for review.");
    if (last.review) throw httpError(400, "This version was already reviewed.");
    const decision = body.decision;
    const note = str(body.note, 3000);
    if (!["APPROVE", "REVISION"].includes(decision)) throw httpError(400, "decision: Approve or request a revision.");
    if (decision === "REVISION" && note.length < 5) throw httpError(400, "note: Say exactly what needs to change.");
    if (decision === "REVISION" && o.revisionsUsed >= o.revisionLimit) {
      throw httpError(400, `The revision limit (${o.revisionLimit}) is used up. Approve, or put the project on hold and agree a change with the client.`);
    }
    const review = { decision, note: note || null, at: now(), by: { id: user.id, name: user.name } };
    const deliveries = arr(o.deliveries).map((d) => (d.version === last.version ? { ...d, review } : d));
    const u =
      decision === "REVISION"
        ? save(db, o, { deliveries, status: "REVISION_REQUESTED", revisionsUsed: o.revisionsUsed + 1, history: [...arr(o.history), historyEntry("REVISION_REQUESTED", user, note)] })
        : save(db, o, { deliveries, history: [...arr(o.history), historyEntry("SUBMITTED", user, `Version ${last.version} approved by PM. Sent to client.`)] });
    const left = o.revisionLimit - o.revisionsUsed - 1;
    notify(
      db,
      o.studentId,
      decision === "REVISION"
        ? { type: "GIG", title: `Changes requested: ${o.title}`, body: `${note} (${left} revision${left === 1 ? "" : "s"} left)`, link: `/app/projects/${o.id}` }
        : { type: "GIG", title: `Work approved: ${o.title}`, body: "Your PM approved it and sent it to the client for review.", link: `/app/projects/${o.id}` },
    );
    if (decision === "APPROVE" && o.pmId) notify(db, o.pmId, { type: "GIG", title: `Client review needed: ${o.title}`, body: "Record the client's acceptance or dispute.", link: `/admin/offers/${o.id}` });
    return pmOut(db, u, user);
  },

  "POST /api/pm/offers/:id/client-acceptance": ({ user, db, params, body }) => {
    requireRole(user, "PROJECT_MANAGER");
    const o = managedOffer(db, params.id, user);
    if (o.status !== "SUBMITTED" || lastDelivery(o)?.review?.decision !== "APPROVE") throw httpError(400, "Approve the latest delivery before recording the client's answer.");
    if (typeof body.accepted !== "boolean") throw httpError(400, "accepted: Required.");
    const feedback = str(body.feedback, 2000) || null;
    const rating = body.rating == null || body.rating === "" ? null : int(body.rating);
    if (rating != null && !(rating >= 1 && rating <= 5)) throw httpError(400, "rating: 1 to 5.");
    const u = body.accepted
      ? save(db, o, {
          status: "COMPLETED",
          clientAcceptedAt: now(),
          payoutStatus: "ELIGIBLE",
          feedback,
          rating,
          ...(o.clientPriceINR != null ? snapshotFinance(o, demoSettings(db)) : {}),
          milestones: arr(o.milestones).map((m) => ({ ...m, status: "APPROVED" })),
          history: [...arr(o.history), historyEntry("COMPLETED", user, "Client accepted the delivery.")],
        })
      : save(db, o, { status: "DISPUTED", feedback, history: [...arr(o.history), historyEntry("DISPUTED", user, feedback || "Client raised a dispute.")] });
    notify(
      db,
      o.studentId,
      body.accepted
        ? { type: "GIG", title: `Client accepted: ${o.title}`, body: `Your payout of ${inr(o.payoutINR + adjustmentsTotal(o))} is now eligible. Finance will process it.`, link: `/app/projects/${o.id}` }
        : { type: "GIG", title: `Client raised a concern: ${o.title}`, body: "Your PM will contact you with next steps.", link: `/app/projects/${o.id}` },
    );
    demoAudit(db, user, { action: body.accepted ? "offer.client_accept" : "offer.client_dispute", entity: "ProjectOffer", entityId: o.id, before: { status: o.status, payoutStatus: o.payoutStatus }, after: { status: u.status, payoutStatus: u.payoutStatus, platformShareINR: u.platformShareINR }, reason: feedback });
    return pmOut(db, u, user);
  },

  /* ── finance ── */
  "GET /api/finance/rules": ({ user, db }) => {
    requireRole(user, "FINANCE");
    const s = demoSettings(db);
    return { splitBasis: s["finance.splitBasis"], freelancerSharePercent: s["finance.freelancerSharePercent"] };
  },
  "GET /api/finance/offers": ({ user, db, query }) => {
    requireRole(user, "FINANCE");
    const { payoutStatus, q, from, to, reconciled } = query;
    let rows = db
      .filter("projectOffers", (o) => FINANCE_STATUSES.includes(o.status))
      .filter((o) => !payoutStatus || payoutStatus === "all" || o.payoutStatus === payoutStatus)
      .filter((o) => !from || new Date(o.updatedAt || o.createdAt) >= new Date(from))
      .filter((o) => !to || new Date(o.updatedAt || o.createdAt) <= new Date(`${to}T23:59:59.999Z`))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .map((o) => financeOut(db, o));
    if (q) {
      const n = String(q).toLowerCase();
      rows = rows.filter((r) => [r.title, r.student?.name, r.payoutRef, r.catalanceProjectId].some((t) => String(t || "").toLowerCase().includes(n)));
    }
    if (reconciled === "yes") rows = rows.filter((r) => r.payoutStatus === "PAID" && r.payoutRef);
    if (reconciled === "no") rows = rows.filter((r) => !(r.payoutStatus === "PAID" && r.payoutRef));
    return rows;
  },

  "PUT /api/finance/offers/:id": ({ user, db, params, body }) => {
    requireRole(user, "FINANCE");
    const o = financeOffer(db, params.id);
    if (o.payoutStatus === "PAID") throw httpError(400, "This payout is already paid. Use an adjustment with a reason instead.");
    const settings = demoSettings(db);
    const clientPriceINR = int(body.clientPriceINR);
    const taxesINR = int(body.taxesINR ?? 0) ?? 0;
    if (!(clientPriceINR >= 0)) throw httpError(400, "clientPriceINR: Enter the client price.");
    if (!(taxesINR >= 0)) throw httpError(400, "taxesINR: Enter 0 or more.");
    if (body.splitBasis && !SPLIT_BASES.includes(body.splitBasis)) throw httpError(400, "splitBasis: Not a valid basis.");
    const pct = body.freelancerSharePercent == null || body.freelancerSharePercent === "" ? null : int(body.freelancerSharePercent);
    if (pct != null && !(pct >= 0 && pct <= 100)) throw httpError(400, "freelancerSharePercent: 0 to 100.");
    const next = {
      clientPriceINR,
      taxesINR,
      splitBasis: body.splitBasis || o.splitBasis || settings["finance.splitBasis"],
      freelancerSharePercent: pct ?? o.freelancerSharePercent ?? settings["finance.freelancerSharePercent"],
    };
    const snap = snapshotFinance({ ...o, ...next }, settings);
    const u = save(db, o, { ...next, ...snap });
    const fin = (x) => ({ clientPriceINR: x.clientPriceINR, splitBasis: x.splitBasis, freelancerSharePercent: x.freelancerSharePercent, platformShareINR: x.platformShareINR, taxesINR: x.taxesINR });
    demoAudit(db, user, { action: "finance.split_update", entity: "ProjectOffer", entityId: o.id, before: fin(o), after: fin(u), reason: str(body.reason, 500) || null });
    return financeOut(db, u);
  },

  "POST /api/finance/offers/:id/adjustments": ({ user, db, params, body }) => {
    requireRole(user, "FINANCE");
    const o = financeOffer(db, params.id);
    if (o.payoutStatus === "PAID") throw httpError(400, "This payout is already paid.");
    const amountINR = int(body.amountINR);
    const reason = str(body.reason, 500);
    if (!Number.isFinite(amountINR) || amountINR === 0) throw httpError(400, "amountINR: Amount can't be zero.");
    if (reason.length < 5) throw httpError(400, "reason: Give a reason.");
    if (o.payoutINR + adjustmentsTotal(o) + amountINR < 0) throw httpError(400, "The net payout can't go below zero.");
    const entry = { id: uid("adj"), amountINR, reason, approvedBy: { id: user.id, name: user.name }, at: now() };
    const u = save(db, o, { adjustments: [...arr(o.adjustments), entry] });
    demoAudit(db, user, { action: "finance.adjustment", entity: "ProjectOffer", entityId: o.id, before: { adjustmentsTotalINR: adjustmentsTotal(o) }, after: { adjustmentsTotalINR: adjustmentsTotal(u), adjustment: entry }, reason });
    return financeOut(db, u);
  },

  "POST /api/finance/offers/:id/payout": ({ user, db, params, body }) => {
    requireRole(user, "FINANCE");
    const o = financeOffer(db, params.id);
    const status = body.status;
    const payoutRef = str(body.payoutRef, 120);
    const note = str(body.note, 500) || null;
    if (!["PAID", "FAILED"].includes(status)) throw httpError(400, "status: PAID or FAILED.");
    if (status === "PAID" && !payoutRef) throw httpError(400, "payoutRef: Add the payout reference (UTR / transfer id).");
    if (!["ELIGIBLE", "FAILED"].includes(o.payoutStatus)) throw httpError(400, "Only eligible (or failed) payouts can be processed.");
    if (status === "FAILED" && o.payoutStatus !== "ELIGIBLE") throw httpError(400, "This payout already failed.");
    const net = o.payoutINR + adjustmentsTotal(o);
    const u = save(db, o, {
      payoutStatus: status,
      payoutRef: payoutRef || o.payoutRef || null,
      paidAt: status === "PAID" ? now() : null,
      history: [...arr(o.history), historyEntry(o.status, user, `Payout ${status.toLowerCase()}${note ? `: ${note}` : ""}`)],
    });
    notify(
      db,
      o.studentId,
      status === "PAID"
        ? { type: "SYSTEM", title: `Payout sent: ${inr(net)}`, body: `${o.title}. Reference ${payoutRef}.`, link: `/app/projects/${o.id}` }
        : { type: "SYSTEM", title: "Payout failed", body: `${o.title}. Check your payout details or contact support.`, link: "/app/help" },
    );
    demoAudit(db, user, { action: `finance.payout_${status.toLowerCase()}`, entity: "ProjectOffer", entityId: o.id, before: { payoutStatus: o.payoutStatus, payoutRef: o.payoutRef }, after: { payoutStatus: u.payoutStatus, payoutRef: u.payoutRef, netPayoutINR: net }, reason: note });
    return financeOut(db, u);
  },
};
