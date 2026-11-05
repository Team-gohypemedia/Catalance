import crypto from "node:crypto";
import { Router } from "express";
import { env } from "../lib/env.js";
import { httpError } from "../lib/errors.js";
import { runTick } from "../services/scheduler.js";

/**
 * Scheduler endpoint (spec §12 reminders, offer expiry). Logic: services/scheduler.js.
 * Auth: `Authorization: Bearer <CRON_SECRET>` (not a user session). Vercel Cron calls GET with exactly that header
 * when CRON_SECRET is set in the project env (see vercel.json "crons"); POST works the same for other schedulers.
 * 503 while CRON_SECRET is unset, 401 for a wrong or missing secret. Safe to call repeatedly (idempotent).
 */
const router = Router();

function requireCronSecret(req, _res, next) {
  if (!env.cronSecret) return next(httpError(503, "The scheduler isn't configured (CRON_SECRET is not set)."));
  const header = String(req.headers.authorization || "");
  const given = Buffer.from(header.startsWith("Bearer ") ? header.slice(7).trim() : "");
  const expected = Buffer.from(env.cronSecret);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return next(httpError(401, "Unauthorized."));
  next();
}

async function tick(_req, res) {
  const result = await runTick();
  res.set("Cache-Control", "no-store");
  res.status(result.ok ? 200 : 500).json(result);
}

router.get("/api/cron/tick", requireCronSecret, tick);
router.post("/api/cron/tick", requireCronSecret, tick);

export default router;
