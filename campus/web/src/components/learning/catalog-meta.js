/**
 * Catalogue display rules shared by the course card, course page, discovery pages and the admin editor
 * (spec §6, §6.1, §6.2, §7.3). Mirrors api/src/lib/catalog.js.
 */
import { formatINR } from "@/lib/utils";

export const COURSE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "STANDARD"];
export const LEVEL_LABELS = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced", STANDARD: "Standard" };

/** Spec §6.1: what each level means and what the learner makes. */
export const LEVEL_CONTENT = {
  BEGINNER: { focus: "Simple, scoped tasks with guidance.", output: "One guided practical deliverable." },
  INTERMEDIATE: { focus: "Client-style briefs with normal revisions.", output: "An independent project with source files and quality checks." },
  ADVANCED: { focus: "Complex tasks. Troubleshoot and document your decisions.", output: "A complex task with QA evidence and a written rationale." },
  STANDARD: { focus: "One focused, job-ready workflow.", output: "An end-to-end task like real client work." },
};

/** Spec §6.2 defaults; settings pricing.levelDefaults overrides these. */
export const DEFAULT_LEVEL_DEFAULTS = {
  BEGINNER: { priceINR: 2499, durationDays: 10 },
  INTERMEDIATE: { priceINR: 5000, durationDays: 15 },
  ADVANCED: { priceINR: 10000, durationDays: 20 },
  STANDARD: { priceINR: 2499, durationDays: 10 },
};

export const COURSE_STATUSES = [
  { value: "DRAFT", label: "Draft", tone: "neutral", hint: "Hidden. Only staff can see it." },
  { value: "PUBLISHED", label: "Published", tone: "sky", hint: "Listed. Self-paced, enrol any time." },
  { value: "ENROLMENT_OPEN", label: "Enrolment open", tone: "success", hint: "Listed. Takes enrolments within the dates." },
  { value: "FULL", label: "Full", tone: "warning", hint: "Listed. No new enrolments." },
  { value: "PAUSED", label: "Paused", tone: "warning", hint: "Listed. Enrolment is paused." },
  { value: "ARCHIVED", label: "Archived", tone: "danger", hint: "Hidden. Enrolled students keep access." },
];
export const COURSE_STATUS = Object.fromEntries(COURSE_STATUSES.map((s) => [s.value, s]));

export const CATALOG_STATUS = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PUBLISHED: { label: "Published", tone: "success" },
  PAUSED: { label: "Paused", tone: "warning" },
  ARCHIVED: { label: "Archived", tone: "danger" },
};

/** Student-facing enrolment chip: { label, tone } (Badge tones). */
export function enrolmentChip(course) {
  if (!course) return null;
  if (course.enrolmentOpen) {
    if (course.seatsLeft != null && course.seatsLeft <= 10) return { label: `${course.seatsLeft} seats left`, tone: "warning" };
    return { label: "Enrolment open", tone: "success" };
  }
  const status = course.status || "PUBLISHED";
  if (status === "FULL") return { label: "Full", tone: "warning" };
  if (status === "PAUSED") return { label: "Paused", tone: "neutral" };
  if (status === "DRAFT") return { label: "Draft", tone: "neutral" };
  if (status === "ARCHIVED") return { label: "Archived", tone: "neutral" };
  if (course.enrolmentOpensAt && new Date(course.enrolmentOpensAt) > new Date()) return { label: "Opens soon", tone: "sky" };
  if (course.seatsLeft === 0) return { label: "Full", tone: "warning" };
  return { label: "Enrolment closed", tone: "neutral" };
}

/** "₹2,499" and "+ 18% GST" (fees exclude GST, spec §6.2). */
export function feeParts(course) {
  if (!course || course.isFree || !course.priceINR) return { fee: "Free", tax: null };
  return { fee: formatINR(course.priceINR), tax: `+ ${course.gstPercent ?? 18}% GST` };
}

export const durationLabel = (days) => (days ? `${days} days` : null);

/** Rough weekly time commitment for the course page: lesson minutes spread over the course length. */
export function timeCommitment(course) {
  const days = course?.durationDays;
  const mins = course?.durationMinutes || 0;
  if (!days || !mins) return null;
  const perDay = Math.max(15, Math.round(mins / days / 15) * 15);
  const h = Math.floor(perDay / 60);
  const m = perDay % 60;
  return `About ${h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`} a day`;
}
