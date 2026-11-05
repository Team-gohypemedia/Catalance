import { DEFAULT_SETTINGS } from "./settings.js";

/**
 * Catalogue rules (spec §6, §6.1, §6.2, §10.1). Shared by routes/courses.js, routes/catalog.js and routes/admin.js.
 * The web demo engine mirrors these in web/src/mocks/handlers/catalog.js — keep both in sync.
 */

/** Course availability (spec §6.2). Stored as text on Course.status. */
export const COURSE_STATUSES = ["DRAFT", "PUBLISHED", "ENROLMENT_OPEN", "FULL", "PAUSED", "ARCHIVED"];
/** Statuses visible in public lists and on the public course page. */
export const LISTED_COURSE_STATUSES = ["PUBLISHED", "ENROLMENT_OPEN", "FULL", "PAUSED"];
/** Prisma where-clause for public course lists. */
export const LISTED_COURSE_WHERE = { status: { in: LISTED_COURSE_STATUSES } };

export const COURSE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "STANDARD"];
export const CATEGORY_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];
export const SKILL_STATUSES = ["DRAFT", "PUBLISHED", "PAUSED", "ARCHIVED"];

export const DEFAULT_GST_PERCENT = DEFAULT_SETTINGS["pricing.gstPercent"];

/** Level defaults from settings (pricing.levelDefaults), falling back to the spec defaults per level. */
export function levelDefaultsFor(level, settings = DEFAULT_SETTINGS) {
  const all = { ...DEFAULT_SETTINGS["pricing.levelDefaults"], ...(settings?.["pricing.levelDefaults"] || {}) };
  return all[level] || all.BEGINNER;
}

/** Fee incl. GST, rounded to the rupee. */
export const priceWithGst = (priceINR, gstPercent = DEFAULT_GST_PERCENT) => Math.round((priceINR || 0) * (1 + (Number(gstPercent) || 0) / 100));

/**
 * Can a new student enrol right now? (derived; never stored)
 * PUBLISHED = self-paced listing, ENROLMENT_OPEN = intake with dates. Both respect the enrolment window and capacity.
 * FULL, PAUSED, DRAFT and ARCHIVED are closed. Capacity counts enrolment rows (`course._count.enrollments`, see
 * COURSE_INCLUDE), not the marketing `studentsCount`. Pass `enrolledCount` to override.
 */
export function enrolmentOpen(course, now = new Date(), { enrolledCount } = {}) {
  if (!course || !["PUBLISHED", "ENROLMENT_OPEN"].includes(course.status || "PUBLISHED")) return false;
  const t = new Date(now).getTime();
  if (course.enrolmentOpensAt && new Date(course.enrolmentOpensAt).getTime() > t) return false;
  if (course.enrolmentClosesAt && new Date(course.enrolmentClosesAt).getTime() < t) return false;
  const count = enrolledCount ?? course._count?.enrollments ?? 0;
  if (course.capacity != null && course.capacity > 0 && count >= course.capacity) return false;
  return true;
}

/** Seats left when the course has a capacity, else null. */
export const seatsLeft = (course, { enrolledCount } = {}) =>
  course?.capacity > 0 ? Math.max(0, course.capacity - (enrolledCount ?? course._count?.enrollments ?? 0)) : null;

/** Short reason for a closed course, for UI copy and 4xx messages. */
export function enrolmentClosedReason(course, now = new Date()) {
  if (enrolmentOpen(course, now)) return null;
  const status = course?.status || "PUBLISHED";
  if (status === "FULL") return "This course is full.";
  if (status === "PAUSED") return "Enrolment is paused.";
  if (status === "DRAFT" || status === "ARCHIVED") return "This course is not available.";
  if (course.enrolmentOpensAt && new Date(course.enrolmentOpensAt) > new Date(now)) return "Enrolment has not opened yet.";
  if (course.enrolmentClosesAt && new Date(course.enrolmentClosesAt) < new Date(now)) return "Enrolment has closed.";
  return "This course is full.";
}

/* ───────────── serializers ───────────── */

export const SKILL_REF_SELECT = { id: true, slug: true, name: true, category: { select: { slug: true, name: true } } };

export const skillRef = (s) => (s ? { id: s.id, slug: s.slug, name: s.name, category: s.category ? { slug: s.category.slug, name: s.category.name } : null } : null);

export function skillOut(s) {
  return {
    id: s.id,
    categoryId: s.categoryId,
    slug: s.slug,
    name: s.name,
    description: s.description || "",
    tags: s.tags || [],
    formats: s.formats || [],
    clientServices: s.clientServices || "",
    status: s.status,
    order: s.order ?? 0,
  };
}

export function categoryOut(c, skills = c.skills || []) {
  return { id: c.id, slug: c.slug, name: c.name, order: c.order ?? 0, status: c.status, skills: skills.map(skillOut) };
}
