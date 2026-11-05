/**
 * Aspirant mode: government-exam aspirants building a backup private-sector career.
 * Mirrors cleanAspirant() in campus/web/src/mocks/handlers/auth.js (see API_CONTRACT.md "Aspirant").
 */
import { z } from "zod";

export const EXAMS = ["UPSC", "SSC", "BANKING", "RAILWAYS", "STATE_PSC", "TEACHING", "DEFENCE", "OTHER"];
export const DAILY_MINUTES = [30, 45, 60, 90];

const clampInt = (v, min, max, fallback) => {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

const numLike = z.union([z.number(), z.string().trim().max(20)]).nullable().optional();

/** Request-body shape for `aspirant` (lenient: values are clamped by cleanAspirant, not rejected). */
export const aspirantInput = z
  .object({
    exam: z.string().trim().max(40).nullable().optional(),
    examName: z.string().trim().max(200).nullable().optional(),
    prepYears: numLike,
    dailyMinutes: numLike,
    attemptsUsed: numLike,
    birthYear: numLike,
    strengths: z.array(z.string().trim().max(60)).max(40).nullable().optional(),
    studyHoursTotal: numLike,
    mockTestsTaken: numLike,
    bestMockPercentile: numLike,
    showOnPassport: z.boolean().nullable().optional(),
  })
  .strip();

/** Normaliser: every field always present and in range. */
const aspirantShape = z.object({
  exam: z.unknown().transform((v) => (EXAMS.includes(v) ? v : "OTHER")),
  examName: z.unknown().transform((v) => String(v ?? "").trim().slice(0, 60) || "Government exam"),
  prepYears: z.unknown().transform((v) => clampInt(v, 0, 8, 1)),
  dailyMinutes: z.unknown().transform((v) => (DAILY_MINUTES.includes(Number(v)) ? Number(v) : 45)),
  attemptsUsed: z.unknown().transform((v) => clampInt(v, 0, 10, 0)),
  birthYear: z.unknown().transform((v) => (v ? clampInt(v, 1960, new Date().getFullYear() - 15, null) : null)),
  strengths: z.unknown().transform((v) =>
    Array.isArray(v) ? [...new Set(v.filter((s) => typeof s === "string").map((s) => s.trim()).filter(Boolean))].slice(0, 12) : [],
  ),
  studyHoursTotal: z.unknown().transform((v) => clampInt(v, 0, 30000, 0)),
  mockTestsTaken: z.unknown().transform((v) => clampInt(v, 0, 5000, 0)),
  bestMockPercentile: z.unknown().transform((v) => clampInt(v, 0, 100, null)),
  showOnPassport: z.unknown().transform((v) => v !== false),
});

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

/** Merge `a` over `prev` and normalise. Falsy input → null (aspirant mode off). */
export function cleanAspirant(a, prev = null) {
  if (!a) return null;
  const merged = { ...(isObj(prev) ? prev : {}), ...(isObj(a) ? a : {}) };
  return aspirantShape.parse(merged);
}

/** Stored value → normalised Aspirant or null (tolerates old/partial JSON). */
export const aspirantOf = (u) => (isObj(u?.aspirant) ? cleanAspirant(u.aspirant) : null);

/* ───────────── prep subjects → private-sector skills ───────────── */

export const PREP_SKILL_MAP = {
  Quant: { skill: "Excel formulas & analysis", trackSlug: "excel-for-aspirants" },
  "Data Interpretation": { skill: "Pivot tables & charts", trackSlug: "excel-for-aspirants" },
  Reasoning: { skill: "Data analysis", trackSlug: "data-analytics" },
  English: { skill: "Hindi↔English translation", trackSlug: "translation-hindi-english" },
  Hindi: { skill: "Translation", trackSlug: "translation-hindi-english" },
  "Banking Awareness": { skill: "Accounting & Tally", trackSlug: "accounting-tally-gst" },
  Accounts: { skill: "Tally & GST", trackSlug: "accounting-tally-gst" },
  "Essay Writing": { skill: "Content writing", trackSlug: "content-writing" },
  "GK & Current Affairs": { skill: "Research & content", trackSlug: "content-writing" },
  Polity: { skill: "Policy research writing", trackSlug: "content-writing" },
  Economy: { skill: "Policy research writing", trackSlug: "content-writing" },
};

const norm = (s) => String(s || "").trim().toLowerCase();
const MAP_BY_NORM = new Map(Object.entries(PREP_SKILL_MAP).map(([k, v]) => [norm(k), { subject: k, ...v }]));

/** [{ subject, skill, trackSlug }] for the aspirant's strengths, in their order. */
export const skillsFromPrep = (strengths = []) =>
  strengths.map((s) => MAP_BY_NORM.get(norm(s))).filter(Boolean).map(({ subject, skill, trackSlug }) => ({ subject, skill, trackSlug }));

/** How many of the track's bridgeFrom subjects match the aspirant's strengths. */
export const bridgeOverlap = (track, strengths = []) => {
  const mine = new Set(strengths.map(norm));
  return (track?.bridgeFrom || []).filter((s) => mine.has(norm(s))).length;
};

/** Public Preparation-record traits (never uses birthYear or attemptsUsed). */
export function prepTraits(a) {
  const has = (...subjects) => subjects.some((s) => (a.strengths || []).map(norm).includes(norm(s)));
  const traits = [];
  if ((a.prepYears || 0) >= 2) traits.push("Discipline");
  traits.push("Self-study");
  if (has("Quant", "Reasoning", "Data Interpretation")) traits.push("Analytical reasoning");
  if (has("Essay Writing", "English", "Hindi")) traits.push("Writing & expression");
  if ((a.mockTestsTaken || 0) >= 100) traits.push("Consistency");
  return traits;
}
