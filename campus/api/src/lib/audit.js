import { prisma } from "./prisma.js";

/**
 * Record a privileged change (spec §3: "privileged actions must be recorded", §15).
 * Use for admin actions, assessment results, verification, payments/refunds, payouts, role and settings changes.
 *   await audit(req, { action: "verification.revoke", entity: "SkillVerification", entityId: v.id, before, after, reason }, tx);
 * Never throws, and never breaks the caller's transaction: a failed audit write is logged, not surfaced. Pass `tx` inside a transaction.
 */
export async function audit(req, { action, entity, entityId = null, before = null, after = null, reason = null }, tx) {
  const data = {
    actorId: req?.user?.id ?? null,
    actorRole: req?.user?.role ?? null,
    action,
    entity,
    entityId,
    before: before ?? undefined,
    after: after ?? undefined,
    reason,
    ip: req?.ip ?? null,
    userAgent: req?.headers?.["user-agent"]?.slice(0, 300) ?? null,
  };
  if (!tx) {
    try {
      await prisma.auditLog.create({ data });
    } catch (err) {
      console.error("[campus-api] audit write failed", action, entity, entityId, err?.message);
    }
    return;
  }
  // Inside a transaction a failed INSERT aborts the whole Postgres transaction even when caught,
  // so the write runs under a savepoint that is rolled back on failure, keeping the caller's work intact.
  const hasSavepoints = typeof tx.$executeRawUnsafe === "function";
  try {
    if (hasSavepoints) await tx.$executeRawUnsafe("SAVEPOINT campus_audit");
    await tx.auditLog.create({ data });
    if (hasSavepoints) await tx.$executeRawUnsafe("RELEASE SAVEPOINT campus_audit");
  } catch (err) {
    if (hasSavepoints) await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT campus_audit").catch(() => {});
    console.error("[campus-api] audit write failed", action, entity, entityId, err?.message);
  }
}
