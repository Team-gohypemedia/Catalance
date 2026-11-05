import { prisma } from "./prisma.js";
import { httpError } from "./errors.js";

/**
 * Admin-editable settings and feature flags (campus.PlatformSetting, one row per key).
 * Defaults follow the Developer Product Specification v1.0 (§2 MVP scope, §6.2 pricing, §8 assessment, §9.2 split, §19).
 * The web demo engine mirrors these in web/src/mocks/data/platform.js — keep both in sync.
 */
export const DEFAULT_SETTINGS = {
  // §2: not required in the first release → off by default, switchable from admin
  "flags.aiTutor": false,
  "flags.gamification": false, // XP, coins, streaks, seasons, divisions, leaderboards
  "flags.gigs": false, // legacy Campus-funded gigs; real work comes as PM project offers
  "flags.wallet": false, // legacy Campus wallet / UPI withdrawals (§9.4: needs legal review)
  "flags.community": true,
  "flags.mentorBooking": true,
  "flags.cohorts": true,
  "flags.aspirants": true,

  // §6.2 course price fields (fees exclude GST)
  "pricing.gstPercent": 18,
  "pricing.levelDefaults": {
    BEGINNER: { priceINR: 2499, durationDays: 10 },
    INTERMEDIATE: { priceINR: 5000, durationDays: 15 },
    ADVANCED: { priceINR: 10000, durationDays: 20 },
    STANDARD: { priceINR: 2499, durationDays: 10 },
  },
  "payments.advancePercent": 100,
  "payments.offlineEnabled": true,
  "payments.offlineInstructions": "Pay by UPI or bank transfer to the account shown on your invoice, then enter the UTR / reference number here. We confirm within one working day.",

  // §8 / §19 assessment defaults
  "assessment.passScore": 70,
  "assessment.maxAttempts": 2, // first attempt + 1 included reassessment
  "assessment.reassessWindowDays": 14,
  "verification.expiryMonths": null, // null = no expiry (open decision §19)

  // §9.2 internal commercial model — never shown publicly
  "finance.freelancerSharePercent": 50,
  "finance.splitBasis": "CLIENT_PRICE_EX_TAX",

  // §13 matching
  "projects.offerExpiryHours": 48,

  // §1.1 / §11: policy text, FAQs, homepage copy editable without code changes
  "policies.versions": { TERMS: "2026-11-01", PRIVACY: "2026-11-01", REFUND: "2026-11-01", ASSESSMENT_POLICY: "2026-11-01", PROJECT_POLICY: "2026-11-01" },
  "policies.text": {
    TERMS: "",
    PRIVACY: "",
    REFUND: "",
    ASSESSMENT_POLICY: "",
    PROJECT_POLICY: "",
  },
  "content.noGuarantee": "Passing an assessment makes you eligible for relevant project opportunities. Projects and earnings are not guaranteed.",
  "content.hero": {
    title: "Learn a skill. Prove it. Get verified.",
    subtitle: "Build practical digital skills and become eligible for freelance projects through Catalance.",
  },
  "content.faqs": [],
  "support.email": "support@catalance.in",
};

const TTL_MS = 30_000;
let cache = null;
let cachedAt = 0;

/** All settings (defaults overlaid with stored values). Cached for 30s per instance. */
export async function getSettings() {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;
  const rows = await prisma.platformSetting.findMany();
  cache = { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
  cachedAt = Date.now();
  return cache;
}

export async function getSetting(key) {
  return (await getSettings())[key];
}

/** Feature flags only: { aiTutor, gamification, gigs, ... } */
export async function getFlags() {
  const all = await getSettings();
  return Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith("flags.")).map(([k, v]) => [k.slice(6), Boolean(v)]));
}

/** Upsert settings. Unknown keys are rejected. Returns { before, after } for the audit log. */
export async function setSettings(patch, updatedById, tx = prisma) {
  const before = await getSettings();
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in DEFAULT_SETTINGS)) throw httpError(400, `Unknown setting: ${key}`);
    await tx.platformSetting.upsert({ where: { key }, create: { key, value, updatedById }, update: { value, updatedById } });
  }
  cache = null;
  const after = await getSettings();
  return {
    before: Object.fromEntries(Object.keys(patch).map((k) => [k, before[k]])),
    after: Object.fromEntries(Object.keys(patch).map((k) => [k, after[k]])),
  };
}

/** Express middleware: 404 when a feature flag is off (route hidden, not just the UI). */
export const requireFlag = (flag) => async (_req, _res, next) => {
  try {
    const flags = await getFlags();
    if (!flags[flag]) return next(httpError(404, "This feature is not available."));
    next();
  } catch (err) {
    next(err);
  }
};
