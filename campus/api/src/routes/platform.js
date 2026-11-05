import { Router } from "express";
import { z } from "zod";
import { validate } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth, requireRole } from "../lib/auth.js";
import { audit } from "../lib/audit.js";
import { DEFAULT_SETTINGS, getSettings, setSettings } from "../lib/settings.js";
import { DEFAULT_FAQS, DEFAULT_POLICY_TEXT, POLICY_DOCS } from "../lib/platform-content.js";

/**
 * Platform config, public policies and admin settings (spec §1.1, §11, §19). See API_CONTRACT.md "Platform & support".
 * Everything public here is built from settings, so admins change copy and switches without a deploy.
 * Finance keys (finance.*) are never part of the public config.
 */
const router = Router();

const flagsOf = (s) =>
  Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith("flags.")).map(([k, v]) => [k.slice(6), Boolean(v)]));

const faqsOf = (s) => (Array.isArray(s["content.faqs"]) && s["content.faqs"].length ? s["content.faqs"] : DEFAULT_FAQS);

/** Public config: what the web app needs to render flags, prices, assessment rules and copy. */
export function publicConfig(s) {
  return {
    flags: flagsOf(s),
    pricing: { gstPercent: s["pricing.gstPercent"], levelDefaults: s["pricing.levelDefaults"] },
    assessment: {
      passScore: s["assessment.passScore"],
      maxAttempts: s["assessment.maxAttempts"],
      reassessWindowDays: s["assessment.reassessWindowDays"],
    },
    content: {
      noGuarantee: s["content.noGuarantee"] || DEFAULT_SETTINGS["content.noGuarantee"],
      hero: { ...DEFAULT_SETTINGS["content.hero"], ...(s["content.hero"] || {}) },
      faqs: faqsOf(s),
    },
    policies: { versions: s["policies.versions"] },
    support: { email: s["support.email"] },
    payments: {
      advancePercent: s["payments.advancePercent"],
      offlineEnabled: Boolean(s["payments.offlineEnabled"]),
      offlineInstructions: s["payments.offlineInstructions"],
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
    },
  };
}

router.get("/api/platform/config", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=30");
  res.json(publicConfig(await getSettings()));
});

router.get("/api/platform/policies/:doc", async (req, res) => {
  const key = POLICY_DOCS[String(req.params.doc).toLowerCase()];
  if (!key) throw httpError(404, "Policy not found.");
  const s = await getSettings();
  res.json({
    doc: req.params.doc.toLowerCase(),
    version: s["policies.versions"]?.[key] || null,
    text: s["policies.text"]?.[key]?.trim() || DEFAULT_POLICY_TEXT[key],
  });
});

/* ───────────────────────── admin settings ───────────────────────── */

const money = z.number().int().min(0).max(10_000_000);
const percent = z.number().min(0).max(100);
const levelDefault = z.object({ priceINR: money, durationDays: z.number().int().min(1).max(365) });
const policyKeys = z.enum(Object.values(POLICY_DOCS));
const longText = z.string().max(50_000);

/** Value shape per known key. Every key in DEFAULT_SETTINGS has one; flags.* are booleans. */
const VALUE_SCHEMAS = {
  "pricing.gstPercent": percent,
  "pricing.levelDefaults": z.record(z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "STANDARD"]), levelDefault),
  "payments.advancePercent": percent,
  "payments.offlineEnabled": z.boolean(),
  "payments.offlineInstructions": z.string().trim().max(2000),
  "assessment.passScore": z.number().int().min(1).max(100),
  "assessment.maxAttempts": z.number().int().min(1).max(10),
  "assessment.reassessWindowDays": z.number().int().min(1).max(365),
  "verification.expiryMonths": z.number().int().min(1).max(120).nullable(),
  "finance.freelancerSharePercent": percent,
  "finance.splitBasis": z.enum(["CLIENT_PRICE_EX_TAX", "CLIENT_PRICE_INC_TAX", "NET_AFTER_FEES"]),
  "projects.offerExpiryHours": z.number().int().min(1).max(24 * 30),
  "policies.versions": z.record(policyKeys, z.string().trim().min(1).max(40)),
  "policies.text": z.record(policyKeys, longText),
  "content.noGuarantee": z.string().trim().min(10).max(500),
  "content.hero": z.object({ title: z.string().trim().min(1).max(120), subtitle: z.string().trim().max(300) }),
  "content.faqs": z.array(z.object({ q: z.string().trim().min(1).max(200), a: z.string().trim().min(1).max(2000) })).max(60),
  "support.email": z.string().trim().email(),
};

const settingsBody = z
  .record(z.string(), z.unknown())
  .superRefine((obj, ctx) => {
    if (!Object.keys(obj).length) ctx.addIssue({ code: "custom", message: "Nothing to save." });
  })
  .transform((obj, ctx) => {
    const out = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!(key in DEFAULT_SETTINGS)) {
        ctx.addIssue({ code: "custom", path: [key], message: `Unknown setting: ${key}` });
        continue;
      }
      const schema = key.startsWith("flags.") ? z.boolean() : VALUE_SCHEMAS[key];
      const parsed = schema ? schema.safeParse(value) : { success: true, data: value };
      if (!parsed.success) {
        ctx.addIssue({ code: "custom", path: [key], message: parsed.error.issues[0]?.message || "Invalid value." });
        continue;
      }
      out[key] = parsed.data;
    }
    return out;
  });

router.get("/api/admin/settings", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  res.json({ settings: await getSettings() });
});

router.put("/api/admin/settings", requireAuth, requireRole("ADMIN"), validate({ body: settingsBody }), async (req, res) => {
  const patch = req.body;
  // partial maps (levels, policy versions/text) merge into the stored value, so one field can change alone
  const current = await getSettings();
  for (const key of ["pricing.levelDefaults", "policies.versions", "policies.text", "content.hero"]) {
    if (patch[key]) patch[key] = { ...(current[key] || {}), ...patch[key] };
  }
  const { before, after } = await setSettings(patch, req.user.id);
  await audit(req, { action: "settings.update", entity: "PlatformSetting", entityId: Object.keys(patch).join(",").slice(0, 190), before, after });
  res.json({ settings: await getSettings() });
});

export default router;
