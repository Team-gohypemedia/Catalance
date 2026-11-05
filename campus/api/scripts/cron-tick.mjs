#!/usr/bin/env node
/**
 * Run one scheduler tick against the configured database, without HTTP (no CRON_SECRET needed):
 *
 *   npm run cron:tick
 *
 * Same work as POST /api/cron/tick (services/scheduler.js): offer expiry, milestone, reassessment and deadline reminders.
 * Idempotent, so it is safe to run by hand next to the hourly Vercel Cron.
 */
import { runTick } from "../src/services/scheduler.js";
import { prisma } from "../src/lib/prisma.js";

let code = 0;
try {
  const result = await runTick();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) code = 1;
} catch (err) {
  console.error("[campus-api] cron tick failed", err);
  code = 1;
}
// notification emails go out fire-and-forget just after each row is written; give them a moment before exiting
setTimeout(() => {
  prisma
    .$disconnect()
    .catch(() => {})
    .finally(() => process.exit(code));
}, 3000);
