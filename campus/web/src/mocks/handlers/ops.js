/**
 * Demo-engine handlers, F2 workstream (compliance & ops). See campus/API_CONTRACT.md "Spec v1.0" → Compliance & ops.
 * Audit rows live in the shared "auditLogs" collection (written by every domain's demoAudit helper).
 * Reports use ./ops-reports.js, the same pure code as the API (api/src/services/reports-core.js).
 */
import { httpError, requireRole } from "../utils";
import { REPORT_NAMES, buildFunnel, buildReport, parseRange, toCsv } from "./ops-reports";

const ts = (v) => (v ? new Date(v).getTime() : 0);
const PAGE = 50;

/** First non-empty collection among the names (domains seed under one of them). */
const coll = (db, ...names) => names.map((n) => db.all(n)).find((l) => l.length) || [];

function reportData(db) {
  return {
    // the demo keeps availability in "projectAvailability" (projects handlers); the API stores it on User.availability
    users: db.all("users").map((u) => {
      const av = db.find("projectAvailability", (a) => a.userId === u.id);
      return av && !u.availability ? { ...u, availability: av } : u;
    }),
    courses: db.all("courses"),
    enrollments: db.all("enrollments"),
    orders: coll(db, "courseOrders", "orders"),
    assessments: db.all("assessments"),
    attempts: coll(db, "assessmentAttempts", "attempts"),
    verifications: coll(db, "skillVerifications", "verifications"),
    offers: coll(db, "projectOffers", "offers"),
    tickets: coll(db, "supportTickets", "tickets"),
    skills: db.all("skills"),
    submissions: db.all("submissions"),
  };
}

function auditRows(db, query) {
  const range = query.from || query.to ? parseRange({ from: query.from, to: query.to }, { allTimeByDefault: true }) : null;
  if ((query.from || query.to) && !range) throw httpError(400, "Use dates like 2026-11-01 for from and to.");
  const action = (query.action || "").trim();
  return db
    .filter("auditLogs", (a) => {
      if (query.entity && a.entity !== query.entity) return false;
      if (query.entityId && a.entityId !== query.entityId) return false;
      if (query.actorId && a.actorId !== query.actorId) return false;
      if (action && (action.endsWith(".") ? !a.action?.startsWith(action) : a.action !== action)) return false;
      if (range && (ts(a.createdAt) < range.from.getTime() || ts(a.createdAt) > range.to.getTime())) return false;
      return true;
    })
    .sort((a, b) => ts(b.createdAt) - ts(a.createdAt) || String(b.id).localeCompare(String(a.id)));
}

const withActor = (db, a) => {
  const u = a.actorId ? db.findById("users", a.actorId) : null;
  return {
    id: a.id,
    actorId: a.actorId ?? null,
    actorRole: a.actorRole ?? null,
    actor: u ? { id: u.id, name: u.name, role: u.role } : null,
    action: a.action,
    entity: a.entity,
    entityId: a.entityId ?? null,
    before: a.before ?? null,
    after: a.after ?? null,
    reason: a.reason ?? null,
    ip: a.ip ?? null,
    createdAt: a.createdAt,
  };
};

function logExport(db, user, entity, entityId, after) {
  db.insert("auditLogs", { actorId: user.id, actorRole: user.role, action: entity === "AuditLog" ? "audit.export" : "report.export", entity, entityId, before: null, after, reason: null, ip: null, userAgent: "demo" });
}

export default {
  "GET /api/admin/audit": ({ user, query, db }) => {
    requireRole(user, "ADMIN");
    const rows = auditRows(db, query);
    if (query.format === "csv") {
      logExport(db, user, "AuditLog", null, { filters: query, rows: rows.length });
      return toCsv(
        rows.slice(0, 5000).map((a) => ({
          at: a.createdAt,
          actor: db.findById("users", a.actorId)?.name || "",
          actorRole: a.actorRole || "",
          action: a.action,
          entity: a.entity,
          entityId: a.entityId || "",
          reason: a.reason || "",
          before: a.before ?? "",
          after: a.after ?? "",
        })),
      );
    }
    const take = Math.min(Math.max(Number(query.limit) || PAGE, 1), 200);
    const start = query.cursor ? rows.findIndex((a) => a.id === query.cursor) + 1 : 0;
    const page = rows.slice(start, start + take);
    return { items: page.map((a) => withActor(db, a)), nextCursor: rows.length > start + take ? page[page.length - 1].id : null };
  },

  "GET /api/admin/reports/:name": ({ user, params, query, db }) => {
    requireRole(user, "FINANCE");
    const csv = params.name.endsWith(".csv");
    const name = csv ? params.name.slice(0, -4) : params.name;
    if (!REPORT_NAMES.includes(name)) throw httpError(404, `Unknown report. Use one of: ${REPORT_NAMES.join(", ")}.`);
    const range = parseRange(query);
    if (!range) throw httpError(400, "Use dates like 2026-11-01 for from and to.");
    const report = buildReport(name, reportData(db), range);
    if (!csv) return report;
    logExport(db, user, "Report", name, { from: report.from, to: report.to, rows: report.rows.length });
    return toCsv(report.rows);
  },

  "GET /api/admin/funnel": ({ user, query, db }) => {
    requireRole(user, "ADMIN");
    const range = parseRange(query, { allTimeByDefault: true });
    if (!range) throw httpError(400, "Use dates like 2026-11-01 for from and to.");
    return buildFunnel(reportData(db), range);
  },
};
