/**
 * Demo-engine handlers, C workstream (catalogue: categories → skills → courses, spec §6).
 * Mirrors campus/api/src/routes/catalog.js and campus/api/src/lib/catalog.js. See campus/API_CONTRACT.md "Spec v1.0".
 * The named helpers below are shared with handlers/learning.js and handlers/admin.js (course fields).
 */
import { httpError, requireRole, uid, now } from "../utils";
import { DEFAULT_SETTINGS } from "../data/platform";

/* ───────── rules (keep in sync with api/src/lib/catalog.js) ───────── */
export const COURSE_STATUSES = ["DRAFT", "PUBLISHED", "ENROLMENT_OPEN", "FULL", "PAUSED", "ARCHIVED"];
export const LISTED_COURSE_STATUSES = ["PUBLISHED", "ENROLMENT_OPEN", "FULL", "PAUSED"];
export const COURSE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "STANDARD"];
const CATEGORY_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const SKILL_STATUSES = ["DRAFT", "PUBLISHED", "PAUSED", "ARCHIVED"];

export const isListedCourse = (c) => LISTED_COURSE_STATUSES.includes(c?.status || "PUBLISHED");

/** Stored setting (platformSettings: { id: key, key, value }) or the default. */
export function demoSetting(db, key) {
  const row = db.find("platformSettings", (r) => r.key === key || r.id === key);
  return row ? row.value : DEFAULT_SETTINGS?.[key];
}

export const gstPercentOf = (db) => Number(demoSetting(db, "pricing.gstPercent") ?? 18);

export function levelDefaultsFor(db, level) {
  const all = {
    BEGINNER: { priceINR: 2499, durationDays: 10 },
    INTERMEDIATE: { priceINR: 5000, durationDays: 15 },
    ADVANCED: { priceINR: 10000, durationDays: 20 },
    STANDARD: { priceINR: 2499, durationDays: 10 },
    ...(demoSetting(db, "pricing.levelDefaults") || {}),
  };
  return all[level] || all.BEGINNER;
}

export const priceWithGst = (priceINR, gstPercent) => Math.round((priceINR || 0) * (1 + (Number(gstPercent) || 0) / 100));

/** Enrolment rows for a course (capacity counts these, not the marketing studentsCount). */
const enrolledCount = (db, course) => (db ? db.filter("enrollments", (e) => e.courseId === course.id).length : 0);

/** Derived: can a new student enrol right now? (PUBLISHED / ENROLMENT_OPEN within dates and capacity) */
export function enrolmentOpen(course, at = new Date(), db = null) {
  if (!course || !["PUBLISHED", "ENROLMENT_OPEN"].includes(course.status || "PUBLISHED")) return false;
  const t = new Date(at).getTime();
  if (course.enrolmentOpensAt && new Date(course.enrolmentOpensAt).getTime() > t) return false;
  if (course.enrolmentClosesAt && new Date(course.enrolmentClosesAt).getTime() < t) return false;
  if (course.capacity != null && course.capacity > 0 && enrolledCount(db, course) >= course.capacity) return false;
  return true;
}

export function skillRef(db, skillId) {
  const s = skillId ? db.findById("skills", skillId) : null;
  if (!s) return null;
  const c = db.findById("categories", s.categoryId);
  return { id: s.id, slug: s.slug, name: s.name, category: c ? { slug: c.slug, name: c.name } : null };
}

/** The catalogue fields every Course response carries (spread into toCourse / admin course outputs). */
export function courseCatalogFields(db, course) {
  const gstPercent = gstPercentOf(db);
  return {
    status: course.status || "PUBLISHED",
    skillId: course.skillId ?? null,
    skill: skillRef(db, course.skillId),
    durationDays: course.durationDays ?? levelDefaultsFor(db, course.level).durationDays,
    outcome: course.outcome || "",
    whoFor: course.whoFor || "",
    capacity: course.capacity ?? null,
    enrolmentOpensAt: course.enrolmentOpensAt ?? null,
    enrolmentClosesAt: course.enrolmentClosesAt ?? null,
    enrolmentOpen: enrolmentOpen(course, new Date(), db),
    seatsLeft: course.capacity > 0 ? Math.max(0, course.capacity - enrolledCount(db, course)) : null,
    gstPercent,
    priceWithGstINR: priceWithGst(course.priceINR, gstPercent),
  };
}

/** Course-list filters shared with GET /api/courses (spec §13.1). */
export function matchesCatalogFilters(db, course, query) {
  if (query.skill || query.category) {
    const ref = skillRef(db, course.skillId);
    if (!ref) return false;
    if (query.skill && ref.slug !== query.skill && ref.id !== query.skill) return false;
    if (query.category && !query.skill) {
      const cat = db.find("categories", (c) => c.slug === query.category || c.id === query.category);
      if (!cat || ref.category?.slug !== cat.slug) return false;
    }
  }
  const days = course.durationDays ?? levelDefaultsFor(db, course.level).durationDays;
  if (query.maxDays && Number.isFinite(Number(query.maxDays)) && days > Number(query.maxDays)) return false;
  if (query.minPrice && Number.isFinite(Number(query.minPrice)) && (course.priceINR || 0) < Number(query.minPrice)) return false;
  if (query.maxPrice && Number.isFinite(Number(query.maxPrice)) && (course.priceINR || 0) > Number(query.maxPrice)) return false;
  if (query.open === "1" || query.open === "true") return enrolmentOpen(course, new Date(), db);
  if (query.open === "0" || query.open === "false") return !enrolmentOpen(course, new Date(), db);
  return true;
}

/** Demo audit row (same shape as campus.AuditLog). */
export function demoAudit(db, user, { action, entity, entityId = null, before = null, after = null, reason = null }) {
  db.insert("auditLogs", {
    id: uid("aud"),
    actorId: user?.id ?? null,
    actorRole: user?.role ?? null,
    action,
    entity,
    entityId,
    before,
    after,
    reason,
    ip: null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : null,
    createdAt: now(),
  });
}

/* ───────── serializers ───────── */
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.name).localeCompare(String(b.name));
const SKILL_FIELDS = ["id", "categoryId", "slug", "name", "description", "tags", "formats", "clientServices", "status", "order"];
const skillOut = (s) => Object.fromEntries(SKILL_FIELDS.map((k) => [k, s[k] ?? (["tags", "formats"].includes(k) ? [] : k === "order" ? 0 : k === "description" || k === "clientServices" ? "" : null)]));
const categoryOut = (c, skills) => ({ id: c.id, slug: c.slug, name: c.name, order: c.order ?? 0, status: c.status, skills: skills.map(skillOut) });

const slugify = (s = "") =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

function uniqueSlug(db, collection, base, exceptId) {
  const root = slugify(base) || collection.slice(0, -1);
  let slug = root;
  for (let n = 2; db.find(collection, (x) => x.slug === slug && x.id !== exceptId); n++) slug = `${root}-${n}`;
  return slug;
}

const nextOrder = (list) => list.reduce((m, x) => Math.max(m, x.order ?? 0), -1) + 1;
const strList = (v) => (Array.isArray(v) ? v.map((x) => String(x ?? "").trim()).filter(Boolean) : []);

function categoryPatch(body) {
  const out = {};
  if (body.name !== undefined) {
    if (!String(body.name).trim()) throw httpError(400, "Give the category a name.");
    out.name = String(body.name).trim().slice(0, 120);
  }
  if (body.order !== undefined) out.order = Math.max(0, Math.round(Number(body.order) || 0));
  if (body.status !== undefined) {
    if (!CATEGORY_STATUSES.includes(body.status)) throw httpError(400, "Unknown status.");
    out.status = body.status;
  }
  return out;
}

function skillPatch(db, body) {
  const out = {};
  if (body.name !== undefined) {
    if (!String(body.name).trim()) throw httpError(400, "Give the skill a name.");
    out.name = String(body.name).trim().slice(0, 160);
  }
  if (body.categoryId !== undefined) {
    if (!db.findById("categories", body.categoryId)) throw httpError(400, "Choose a category.");
    out.categoryId = body.categoryId;
  }
  if (body.description !== undefined) out.description = String(body.description ?? "").slice(0, 4000);
  if (body.clientServices !== undefined) out.clientServices = String(body.clientServices ?? "").slice(0, 2000);
  if (body.tags !== undefined) out.tags = strList(body.tags);
  if (body.formats !== undefined) {
    const formats = strList(body.formats);
    if (formats.some((f) => !COURSE_LEVELS.includes(f))) throw httpError(400, "Unknown level format.");
    out.formats = [...new Set(formats)];
  }
  if (body.order !== undefined) out.order = Math.max(0, Math.round(Number(body.order) || 0));
  if (body.status !== undefined) {
    if (!SKILL_STATUSES.includes(body.status)) throw httpError(400, "Unknown status.");
    out.status = body.status;
  }
  return out;
}

const listedCoursesFor = (db, skillId) => db.filter("courses", (c) => c.skillId === skillId && isListedCourse(c));

export default {
  /* ── public ── */
  "GET /api/categories": ({ query, user, db }) => {
    const all = user?.role === "ADMIN" && (query.all === "1" || query.all === "true");
    return db
      .all("categories")
      .filter((c) => all || c.status === "PUBLISHED")
      .sort(byOrder)
      .map((c) => {
        const skills = db
          .filter("skills", (s) => s.categoryId === c.id && (all || s.status === "PUBLISHED"))
          .sort(byOrder);
        return { ...categoryOut(c, skills), skills: skills.map((s) => ({ ...skillOut(s), coursesCount: listedCoursesFor(db, s.id).length })) };
      })
      .filter((c) => all || c.skills.length);
  },

  "GET /api/skills/:slug": ({ params, user, db }) => {
    const skill = db.find("skills", (s) => s.slug === params.slug || s.id === params.slug);
    const category = skill ? db.findById("categories", skill.categoryId) : null;
    if (!skill || !category || (user?.role !== "ADMIN" && (skill.status !== "PUBLISHED" || category.status !== "PUBLISHED"))) throw httpError(404, "Skill not found.");
    // course cards come from the learning handlers (same toCourse shape as GET /api/courses)
    const courses = learningCourseCards ? learningCourseCards(db, user, (c) => c.skillId === skill.id) : [];
    return {
      ...skillOut(skill),
      category: { id: category.id, slug: category.slug, name: category.name },
      courses: courses.sort((a, b) => (a.priceINR || 0) - (b.priceINR || 0)),
    };
  },

  /* ── admin 🛡: categories ── */
  "GET /api/admin/categories": ({ user, db }) => {
    requireRole(user, "ADMIN");
    return db
      .all("categories")
      .slice()
      .sort(byOrder)
      .map((c) => categoryOut(c, db.filter("skills", (s) => s.categoryId === c.id).sort(byOrder)));
  },

  "POST /api/admin/categories": ({ user, body, db }) => {
    requireRole(user, "ADMIN");
    const patch = categoryPatch({ status: "DRAFT", ...body });
    if (!patch.name) throw httpError(400, "Give the category a name.");
    const c = db.insert("categories", {
      id: uid("cat"),
      order: nextOrder(db.all("categories")),
      ...patch,
      slug: uniqueSlug(db, "categories", body.slug || patch.name),
      createdAt: now(),
      updatedAt: now(),
    });
    const out = categoryOut(c, []);
    demoAudit(db, user, { action: "category.create", entity: "Category", entityId: c.id, after: out });
    return out;
  },

  "PUT /api/admin/categories/:id": ({ user, params, body, db }) => {
    requireRole(user, "ADMIN");
    const existing = db.findById("categories", params.id);
    if (!existing) throw httpError(404, "Category not found.");
    const patch = categoryPatch(body);
    if (body.slug) patch.slug = uniqueSlug(db, "categories", body.slug, existing.id);
    const next = db.update("categories", existing.id, { ...patch, updatedAt: now() });
    const skills = db.filter("skills", (s) => s.categoryId === existing.id).sort(byOrder);
    const out = categoryOut(next, skills);
    demoAudit(db, user, { action: "category.update", entity: "Category", entityId: existing.id, before: categoryOut(existing, skills), after: out });
    return out;
  },

  "DELETE /api/admin/categories/:id": ({ user, params, db }) => {
    requireRole(user, "ADMIN");
    const existing = db.findById("categories", params.id);
    if (!existing) throw httpError(404, "Category not found.");
    if (db.find("skills", (s) => s.categoryId === existing.id)) throw httpError(400, "Move or delete its skills first, or archive the category.");
    db.remove("categories", existing.id);
    demoAudit(db, user, { action: "category.delete", entity: "Category", entityId: existing.id, before: categoryOut(existing, []) });
    return { ok: true };
  },

  /* ── admin 🛡: skills ── */
  "GET /api/admin/skills": ({ user, query, db }) => {
    requireRole(user, "ADMIN");
    return db
      .filter("skills", (s) => !query.categoryId || s.categoryId === query.categoryId)
      .sort(byOrder)
      .map(skillOut);
  },

  "POST /api/admin/skills": ({ user, body, db }) => {
    requireRole(user, "ADMIN");
    if (!body.categoryId || !db.findById("categories", body.categoryId)) throw httpError(400, "Choose a category.");
    const patch = skillPatch(db, { status: "DRAFT", description: "", clientServices: "", tags: [], formats: [], ...body });
    if (!patch.name) throw httpError(400, "Give the skill a name.");
    const s = db.insert("skills", {
      id: uid("sk"),
      order: nextOrder(db.filter("skills", (x) => x.categoryId === body.categoryId)),
      ...patch,
      slug: uniqueSlug(db, "skills", body.slug || patch.name),
      createdAt: now(),
      updatedAt: now(),
    });
    demoAudit(db, user, { action: "skill.create", entity: "Skill", entityId: s.id, after: skillOut(s) });
    return skillOut(s);
  },

  "PUT /api/admin/skills/:id": ({ user, params, body, db }) => {
    requireRole(user, "ADMIN");
    const existing = db.findById("skills", params.id);
    if (!existing) throw httpError(404, "Skill not found.");
    const patch = skillPatch(db, body);
    if (body.slug) patch.slug = uniqueSlug(db, "skills", body.slug, existing.id);
    const next = db.update("skills", existing.id, { ...patch, updatedAt: now() });
    demoAudit(db, user, { action: "skill.update", entity: "Skill", entityId: existing.id, before: skillOut(existing), after: skillOut(next) });
    return skillOut(next);
  },

  "DELETE /api/admin/skills/:id": ({ user, params, db }) => {
    requireRole(user, "ADMIN");
    const existing = db.findById("skills", params.id);
    if (!existing) throw httpError(404, "Skill not found.");
    const used =
      db.find("courses", (c) => c.skillId === existing.id) ||
      db.find("skillVerifications", (v) => v.skillId === existing.id || v.skill?.id === existing.id) ||
      db.find("projectOffers", (o) => o.skillId === existing.id || o.skill?.id === existing.id);
    if (used) throw httpError(400, "This skill has courses, verifications or projects. Archive it instead.");
    db.remove("skills", existing.id);
    demoAudit(db, user, { action: "skill.delete", entity: "Skill", entityId: existing.id, before: skillOut(existing) });
    return { ok: true };
  },
};

/* learning.js registers its course-card mapper here so GET /api/skills/:slug returns the exact GET /api/courses shape
   without a circular import (learning.js imports the helpers above). */
let learningCourseCards = null;
export function registerCourseCards(fn) {
  learningCourseCards = fn;
}
