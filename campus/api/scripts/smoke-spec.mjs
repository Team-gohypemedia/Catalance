#!/usr/bin/env node
/**
 * Offline smoke test for the spec v1.0 rules (no database, no network).
 *
 *   npm run smoke:spec
 *
 * Every Prisma model delegate on the exported client (src/lib/prisma.js) is replaced, via Object.defineProperty,
 * with an in-memory table driven by the generated schema (Prisma.dmmf): defaults, @updatedAt, unique keys
 * (P2002), relations for include/select/_count and relation filters, and $transaction with rollback.
 * The real Express app (createApp) then runs on a random local port and the checks call it over HTTP with
 * Catalance-style JWTs. Razorpay and email calls are answered by a fetch stub, so nothing leaves the machine.
 *
 * Covers: paid enrol → 402, checkout → order, offline verify → enrolled, duplicate webhook is a no-op,
 * submit → below pass → REASSESSMENT_REQUIRED, critical criterion failed → not passed, pass → PASSED →
 * onboarding → admin verify → SkillVerification, revoke needs a reason, other users' offer/attempt/order → 404,
 * PM talent search excludes unverified and suspended students, flags off → /api/tutor 404, capture on a cancelled
 * order → PAID, no appeal on an older attempt, passport hides rank/earnings, one Razorpay refund per order,
 * courses with payments can't be deleted, upload allow-list (.exe and > 25 MB rejected), private file links (other
 * students 404), onboarding edits notify admins once, and the scheduler tick (expires an old offer exactly once,
 * milestone reminders once, cron secret required). R2 is replaced by an in-memory stub (no SDK call, no network).
 */
import crypto from "node:crypto";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/* ───────────── environment (set before any app module loads, so dotenv can't fill these from .env) ───────────── */
Object.assign(process.env, {
  NODE_ENV: "test",
  CATALANCE_JWT_SECRET: "smoke-spec-secret",
  // never a real database: an unreachable local URL, and every delegate is stubbed below anyway
  CAMPUS_DATABASE_URL: "postgresql://smoke:smoke@127.0.0.1:1/smoke?schema=campus",
  DATABASE_URL: "postgresql://smoke:smoke@127.0.0.1:1/smoke",
  RAZORPAY_KEY_ID: "rzp_test_smoke",
  RAZORPAY_KEY_SECRET: "smoke_key_secret",
  RAZORPAY_WEBHOOK_SECRET: "smoke_webhook_secret",
  RESEND_API_KEY: "",
  CAMPUS_OPENROUTER_API_KEY: "",
  // fake R2 config so uploads are "enabled"; every storage call is answered by the stub below
  R2_ACCOUNT_ID: "smoke-account",
  R2_ACCESS_KEY_ID: "smoke-key",
  R2_SECRET_ACCESS_KEY: "smoke-secret",
  R2_BUCKET_NAME: "smoke-bucket",
  CRON_SECRET: "smoke-cron-secret",
});

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imp = (p) => import(pathToFileURL(path.join(apiRoot, p)).href);
const { Prisma } = await import("@prisma/client");
const { default: jwt } = await import("jsonwebtoken");
const { prisma } = await imp("src/lib/prisma.js");

/* ───────────── storage stub (R2 presigner + HEAD; nothing reaches the AWS SDK or the network) ───────────── */
const { storage } = await imp("src/lib/storage.js");
const stored = new Map(); // key → { size, type } once the "browser" has PUT it
const storageCalls = [];
Object.assign(storage, {
  presignPut: async ({ key, type }) => (storageCalls.push(["put", key]), { url: `https://smoke-account.r2.cloudflarestorage.com/smoke-bucket/${key}?X-Amz-Signature=put`, expiresAt: new Date(Date.now() + 600000).toISOString(), type }),
  presignGet: async ({ key }) => (storageCalls.push(["get", key]), { url: `https://smoke-account.r2.cloudflarestorage.com/smoke-bucket/${key}?X-Amz-Signature=get&X-Amz-Expires=600`, expiresAt: new Date(Date.now() + 600000).toISOString() }),
  head: async (key) => (storageCalls.push(["head", key]), stored.get(key) || null),
  remove: async (key) => void stored.delete(key),
});

/* ───────────── fetch stub (Razorpay + email) ───────────── */
const outbound = [];
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  outbound.push({ url: u, body: init.body ? JSON.parse(init.body) : null });
  if (u.includes("razorpay.com") && u.endsWith("/orders")) return new Response(JSON.stringify({ id: `order_smoke${outbound.length}` }), { status: 200 });
  if (u.includes("razorpay.com") && u.includes("/refund")) return new Response(JSON.stringify({ id: "rfnd_smoke" }), { status: 200 });
  return new Response("{}", { status: 200 });
};

/* ───────────── in-memory Prisma ───────────── */
const MODELS = Object.fromEntries(Prisma.dmmf.datamodel.models.map((m) => [m.name, m]));
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const DELEGATES = Object.fromEntries(Object.keys(MODELS).map((m) => [lower(m), m]));
let db = Object.fromEntries(Object.keys(MODELS).map((m) => [m, []]));
let seq = 0;
const newId = () => `c${(++seq).toString(36).padStart(6, "0")}`;
const fieldOf = (model, name) => MODELS[model].fields.find((f) => f.name === name);
const isScalar = (f) => f && (f.kind === "scalar" || f.kind === "enum");
const clone = (v) => (v === undefined ? undefined : structuredClone(v));
const val = (v) => (v instanceof Date ? v.getTime() : v);
const eq = (a, b) => (a == null && b == null) || (a != null && b != null && (typeof a === "object" && !(a instanceof Date) ? JSON.stringify(a) === JSON.stringify(b) : val(a) === val(b)));

function coerceIn(f, v) {
  if (v == null || !f) return v;
  if (f.type === "DateTime" && !(v instanceof Date)) return new Date(v);
  return v;
}

/** Rows of the related model for relation field `f` of `row`. */
function related(model, row, f) {
  const target = db[f.type];
  if (f.relationFromFields?.length) {
    const hit = target.find((t) => f.relationFromFields.every((k, i) => row[k] != null && eq(t[f.relationToFields[i]], row[k])));
    return hit || null;
  }
  const back = MODELS[f.type].fields.find((g) => g.relationName === f.relationName && g.relationFromFields?.length);
  const rows = target.filter((t) => back.relationFromFields.every((k, i) => eq(t[k], row[back.relationToFields[i]])));
  return f.isList ? rows : rows[0] || null;
}

function matchScalar(v, cond, f) {
  if (cond === null || typeof cond !== "object" || cond instanceof Date || Array.isArray(cond)) return eq(v, coerceIn(f, cond));
  const insensitive = cond.mode === "insensitive";
  const s = (x) => (insensitive ? String(x ?? "").toLowerCase() : String(x ?? ""));
  for (const [op, arg0] of Object.entries(cond)) {
    const arg = coerceIn(f, arg0);
    if (op === "mode") continue;
    if (op === "equals" && !eq(v, arg)) return false;
    if (op === "not" && (arg !== null && typeof arg === "object" && !(arg instanceof Date) ? matchScalar(v, arg, f) : eq(v, arg))) return false;
    if (op === "in" && !arg0.some((x) => eq(v, coerceIn(f, x)))) return false;
    if (op === "notIn" && arg0.some((x) => eq(v, coerceIn(f, x)))) return false;
    if (op === "lt" && !(v != null && val(v) < val(arg))) return false;
    if (op === "lte" && !(v != null && val(v) <= val(arg))) return false;
    if (op === "gt" && !(v != null && val(v) > val(arg))) return false;
    if (op === "gte" && !(v != null && val(v) >= val(arg))) return false;
    if (op === "contains" && !s(v).includes(s(arg))) return false;
    if (op === "startsWith" && !s(v).startsWith(s(arg))) return false;
    if (op === "endsWith" && !s(v).endsWith(s(arg))) return false;
    if (op === "has" && !(Array.isArray(v) && v.some((x) => eq(x, arg)))) return false;
    if (op === "hasSome" && !(Array.isArray(v) && arg0.some((a) => v.includes(a)))) return false;
    if (op === "hasEvery" && !(Array.isArray(v) && arg0.every((a) => v.includes(a)))) return false;
    if (op === "isEmpty" && (Array.isArray(v) && v.length === 0) !== arg0) return false;
  }
  return true;
}

function matches(model, row, where) {
  if (!where) return true;
  for (const [k, cond] of Object.entries(where)) {
    if (cond === undefined) continue;
    if (k === "AND") { if (![].concat(cond).every((w) => matches(model, row, w))) return false; continue; }
    if (k === "OR") { if (!cond.some((w) => matches(model, row, w))) return false; continue; }
    if (k === "NOT") { if ([].concat(cond).some((w) => matches(model, row, w))) return false; continue; }
    const f = fieldOf(model, k);
    if (isScalar(f)) { if (!matchScalar(row[k], cond, f)) return false; continue; }
    if (f?.kind === "object") {
      const rel = related(model, row, f);
      if (f.isList) {
        if (cond.some && !rel.some((r) => matches(f.type, r, cond.some))) return false;
        if (cond.none && rel.some((r) => matches(f.type, r, cond.none))) return false;
        if (cond.every && !rel.every((r) => matches(f.type, r, cond.every))) return false;
      } else if (cond === null) { if (rel) return false; }
      else if ("is" in cond || "isNot" in cond) {
        if ("is" in cond && !(cond.is === null ? !rel : rel && matches(f.type, rel, cond.is))) return false;
        if ("isNot" in cond && (cond.isNot === null ? !rel : rel && matches(f.type, rel, cond.isNot))) return false;
      } else if (!rel || !matches(f.type, rel, cond)) return false;
      continue;
    }
    // compound unique selector, e.g. userId_courseId: { userId, courseId }
    if (cond && typeof cond === "object" && k.includes("_")) { if (!Object.entries(cond).every(([kk, vv]) => eq(row[kk], coerceIn(fieldOf(model, kk), vv)))) return false; continue; }
    throw new Error(`smoke prisma: unsupported where key ${model}.${k}`);
  }
  return true;
}

function sortRows(model, rows, orderBy) {
  const keys = [].concat(orderBy || []).flatMap((o) => Object.entries(o));
  if (!keys.length) return rows;
  const valueOf = (row, k, dir) => {
    const f = fieldOf(model, k);
    if (f?.kind === "object" && dir && typeof dir === "object") {
      const [[kk, d]] = Object.entries(dir);
      if (kk === "_count") return { v: related(model, row, f)?.length ?? 0, d };
      const r = related(model, row, f);
      return { v: r ? r[kk] : null, d };
    }
    return { v: row[k], d: typeof dir === "object" ? dir.sort : dir };
  };
  return [...rows].sort((a, b) => {
    for (const [k, dir] of keys) {
      const x = valueOf(a, k, dir), y = valueOf(b, k, dir);
      const av = val(x.v), bv = val(y.v);
      if (av === bv) continue;
      if (av == null) return 1;
      if (bv == null) return -1;
      const c = av < bv ? -1 : 1;
      return x.d === "desc" ? -c : c;
    }
    return 0;
  });
}

function countsFor(model, row, spec) {
  const out = {};
  const lists = MODELS[model].fields.filter((f) => f.kind === "object" && f.isList);
  const sel = spec === true ? Object.fromEntries(lists.map((f) => [f.name, true])) : spec.select || {};
  for (const [k, v] of Object.entries(sel)) {
    if (!v) continue;
    const rows = related(model, row, fieldOf(model, k));
    out[k] = (v.where ? rows.filter((r) => matches(fieldOf(model, k).type, r, v.where)) : rows).length;
  }
  return out;
}

function readRel(model, row, f, args) {
  const rel = related(model, row, f);
  if (!f.isList) return rel ? project(f.type, rel, args === true ? {} : args) : null;
  let rows = args?.where ? rel.filter((r) => matches(f.type, r, args.where)) : rel;
  rows = sortRows(f.type, rows, args?.orderBy);
  if (args?.skip) rows = rows.slice(args.skip);
  if (args?.take != null) rows = rows.slice(0, args.take);
  return rows.map((r) => project(f.type, r, args === true ? {} : args));
}

function project(model, row, { select, include } = {}) {
  if (!row) return row;
  const out = {};
  if (select) {
    for (const [k, v] of Object.entries(select)) {
      if (!v) continue;
      if (k === "_count") { out._count = countsFor(model, row, v); continue; }
      const f = fieldOf(model, k);
      if (isScalar(f)) out[k] = clone(row[k]);
      else if (f) out[k] = readRel(model, row, f, v);
    }
    return out;
  }
  for (const f of MODELS[model].fields) if (isScalar(f)) out[f.name] = clone(row[f.name]);
  for (const [k, v] of Object.entries(include || {})) {
    if (!v) continue;
    if (k === "_count") { out._count = countsFor(model, row, v); continue; }
    out[k] = readRel(model, row, fieldOf(model, k), v);
  }
  return out;
}

const p2002 = (target) => new Prisma.PrismaClientKnownRequestError(`Unique constraint failed on ${target}`, { code: "P2002", clientVersion: Prisma.prismaVersion?.client || "6", meta: { target } });
const p2025 = () => new Prisma.PrismaClientKnownRequestError("Record to update not found.", { code: "P2025", clientVersion: Prisma.prismaVersion?.client || "6" });

function checkUnique(model, row) {
  const m = MODELS[model];
  const keys = [
    ...m.fields.filter((f) => f.isId || f.isUnique).map((f) => [f.name]),
    ...(m.uniqueFields || []),
    ...(m.primaryKey ? [m.primaryKey.fields] : []),
  ];
  for (const key of keys) {
    if (key.some((k) => row[k] == null)) continue;
    if (db[model].some((r) => r !== row && key.every((k) => eq(r[k], row[k])))) throw p2002(key);
  }
}

function defaultFor(f) {
  if (f.isUpdatedAt) return new Date();
  if (!f.hasDefaultValue) return f.isList ? [] : null;
  const d = f.default;
  if (d && typeof d === "object" && !Array.isArray(d) && d.name) {
    if (d.name === "now") return new Date();
    if (d.name === "cuid" || d.name === "uuid") return newId();
    if (d.name === "autoincrement") return ++seq;
    if (d.name === "dbgenerated") return null;
  }
  if (f.type === "Json" && typeof d === "string") return JSON.parse(d);
  return clone(d);
}

/** Apply a create/update `data` object to `row`; returns nested creates to run after the row exists. */
function applyData(model, row, data, { creating }) {
  const after = [];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    const f = fieldOf(model, k);
    if (!f) throw new Error(`smoke prisma: unknown field ${model}.${k}`);
    if (isScalar(f)) {
      if (v && typeof v === "object" && !(v instanceof Date) && !Array.isArray(v) && f.type !== "Json") {
        if ("set" in v) row[k] = coerceIn(f, v.set);
        else if ("increment" in v) row[k] = (row[k] || 0) + v.increment;
        else if ("decrement" in v) row[k] = (row[k] || 0) - v.decrement;
        else if ("multiply" in v) row[k] = (row[k] || 0) * v.multiply;
        else if ("push" in v) row[k] = [...(row[k] || []), ...[].concat(v.push)];
        else throw new Error(`smoke prisma: unsupported update op on ${model}.${k}`);
      } else if (v === Prisma.DbNull || v === Prisma.JsonNull) row[k] = null;
      else row[k] = coerceIn(f, clone(v));
      continue;
    }
    // relation writes
    if (f.relationFromFields?.length) {
      if (v.connect) f.relationFromFields.forEach((fk, i) => (row[fk] = v.connect[f.relationToFields[i]]));
      else if (v.disconnect) f.relationFromFields.forEach((fk) => (row[fk] = null));
      else if (v.create) {
        const child = createRow(f.type, v.create);
        f.relationFromFields.forEach((fk, i) => (row[fk] = child[f.relationToFields[i]]));
      } else throw new Error(`smoke prisma: unsupported relation write ${model}.${k}`);
    } else {
      const back = MODELS[f.type].fields.find((g) => g.relationName === f.relationName && g.relationFromFields?.length);
      const link = (child) => Object.fromEntries(back.relationFromFields.map((fk, i) => [fk, row[back.relationToFields[i]]]));
      if (v.create) after.push(() => [].concat(v.create).forEach((c) => createRow(f.type, { ...c, ...link() })));
      if (v.createMany) after.push(() => v.createMany.data.forEach((c) => createRow(f.type, { ...c, ...link() })));
      if (v.deleteMany && !creating) after.push(() => (db[f.type] = db[f.type].filter((r) => !(matches(f.type, r, link()) && matches(f.type, r, v.deleteMany)))));
      if (!v.create && !v.createMany && !v.deleteMany) throw new Error(`smoke prisma: unsupported nested write ${model}.${k}`);
    }
  }
  return after;
}

function createRow(model, data) {
  const row = {};
  for (const f of MODELS[model].fields) if (isScalar(f)) row[f.name] = defaultFor(f);
  const after = applyData(model, row, data, { creating: true });
  checkUnique(model, row);
  db[model].push(row);
  after.forEach((fn) => fn());
  return row;
}

function updateRow(model, row, data) {
  const before = { ...row };
  const after = applyData(model, row, data, { creating: false });
  for (const f of MODELS[model].fields) if (f.isUpdatedAt && !("updatedAt" in data)) row[f.name] = new Date();
  try {
    checkUnique(model, row);
  } catch (e) {
    Object.assign(row, before);
    throw e;
  }
  after.forEach((fn) => fn());
  return row;
}

function pickRows(model, { where, orderBy, skip, take, cursor, distinct } = {}) {
  let rows = sortRows(model, db[model].filter((r) => matches(model, r, where)), orderBy);
  if (cursor) {
    const i = rows.findIndex((r) => matches(model, r, cursor));
    rows = i < 0 ? [] : rows.slice(i);
  }
  if (distinct) {
    const seen = new Set();
    rows = rows.filter((r) => { const k = [].concat(distinct).map((d) => JSON.stringify(r[d])).join("|"); return seen.has(k) ? false : seen.add(k); });
  }
  if (skip) rows = rows.slice(skip);
  if (take != null) rows = take < 0 ? rows.slice(take) : rows.slice(0, take);
  return rows;
}

function aggregateOf(model, rows, args) {
  const out = {};
  for (const op of ["_sum", "_avg", "_min", "_max"]) {
    if (!args[op]) continue;
    out[op] = {};
    for (const k of Object.keys(args[op])) {
      const vs = rows.map((r) => r[k]).filter((v) => v != null);
      out[op][k] = !vs.length ? null : op === "_sum" ? vs.reduce((a, b) => a + b, 0) : op === "_avg" ? vs.reduce((a, b) => a + b, 0) / vs.length : op === "_min" ? vs.reduce((a, b) => (val(a) < val(b) ? a : b)) : vs.reduce((a, b) => (val(a) > val(b) ? a : b));
    }
  }
  if (args._count) {
    out._count = args._count === true ? rows.length : Object.fromEntries(Object.keys(args._count).map((k) => [k, k === "_all" ? rows.length : rows.filter((r) => r[k] != null).length]));
  }
  return out;
}

function delegate(model) {
  const one = (args, rows) => (rows[0] ? project(model, rows[0], args) : null);
  const orThrow = (r) => { if (!r) throw p2025(); return r; };
  return {
    findUnique: async (args) => one(args, pickRows(model, { where: args.where })),
    findUniqueOrThrow: async (args) => orThrow(one(args, pickRows(model, { where: args.where }))),
    findFirst: async (args = {}) => one(args, pickRows(model, args)),
    findFirstOrThrow: async (args = {}) => orThrow(one(args, pickRows(model, args))),
    findMany: async (args = {}) => pickRows(model, args).map((r) => project(model, r, args)),
    count: async (args = {}) => pickRows(model, args).length,
    aggregate: async (args = {}) => aggregateOf(model, pickRows(model, args), args),
    groupBy: async (args) => {
      const groups = new Map();
      for (const r of pickRows(model, { where: args.where })) {
        const key = JSON.stringify(args.by.map((b) => r[b]));
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(r);
      }
      return [...groups.values()].map((rows) => ({ ...Object.fromEntries(args.by.map((b) => [b, rows[0][b]])), ...aggregateOf(model, rows, args) }));
    },
    create: async (args) => project(model, createRow(model, args.data), args),
    createMany: async ({ data, skipDuplicates }) => {
      let count = 0;
      for (const d of [].concat(data)) {
        try { createRow(model, d); count++; } catch (e) { if (!(skipDuplicates && e.code === "P2002")) throw e; }
      }
      return { count };
    },
    update: async (args) => {
      const row = db[model].find((r) => matches(model, r, args.where));
      if (!row) throw p2025();
      return project(model, updateRow(model, row, args.data), args);
    },
    updateMany: async ({ where, data }) => {
      const rows = db[model].filter((r) => matches(model, r, where));
      rows.forEach((r) => updateRow(model, r, data));
      return { count: rows.length };
    },
    upsert: async (args) => {
      const row = db[model].find((r) => matches(model, r, args.where));
      return project(model, row ? updateRow(model, row, args.update) : createRow(model, args.create), args);
    },
    delete: async (args) => {
      const row = db[model].find((r) => matches(model, r, args.where));
      if (!row) throw p2025();
      db[model] = db[model].filter((r) => r !== row);
      return project(model, row, args);
    },
    deleteMany: async ({ where } = {}) => {
      const before = db[model].length;
      db[model] = db[model].filter((r) => !matches(model, r, where));
      return { count: before - db[model].length };
    },
  };
}

for (const [name, model] of Object.entries(DELEGATES)) Object.defineProperty(prisma, name, { value: delegate(model), configurable: true });

// Interactive transactions run against the same client and roll back on error. Requests in this script are
// sequential, so a snapshot of all tables is an honest stand-in for isolation.
let txDepth = 0;
Object.defineProperty(prisma, "$transaction", {
  configurable: true,
  value: async (arg) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    if (txDepth) return arg(prisma);
    const snapshot = Object.fromEntries(Object.entries(db).map(([k, rows]) => [k, rows.map((r) => ({ ...r }))]));
    txDepth++;
    try {
      return await arg(prisma);
    } catch (err) {
      db = snapshot;
      throw err;
    } finally {
      txDepth--;
    }
  },
});

// Catalance accounts (public."User") answer the auth lookup in lib/auth.js; nothing else is raw SQL in Campus.
const ACCOUNTS = new Map();
Object.defineProperty(prisma, "$queryRaw", {
  configurable: true,
  value: async (strings, ...values) => {
    const sql = Array.isArray(strings) ? strings.join("?") : String(strings?.strings?.join("?") ?? strings);
    if (/public\."User"/.test(sql)) return ACCOUNTS.has(values[0]) ? [ACCOUNTS.get(values[0])] : [];
    return [];
  },
});
for (const m of ["$executeRaw", "$queryRawUnsafe", "$executeRawUnsafe"]) Object.defineProperty(prisma, m, { configurable: true, value: async () => (m.startsWith("$execute") ? 0 : []) });
for (const m of ["$connect", "$disconnect"]) Object.defineProperty(prisma, m, { configurable: true, value: async () => {} });

/* ───────────── seed ───────────── */
const person = (id, { role = "STUDENT", catalanceRole = "FREELANCER", status = "ACTIVE" } = {}) => {
  const accountId = `cat_${id}`;
  ACCOUNTS.set(accountId, { id: accountId, email: `${id}@campus.dev`, fullName: id, avatar: null, role: catalanceRole, status: "ACTIVE" });
  return createRow("User", { id, catalanceUserId: accountId, email: `${id}@campus.dev`, name: `Smoke ${id}`, username: id.replace(/_/g, ""), role, status, onboarded: true });
};
person("u_student");
person("u_other");
person("u_unverified");
person("u_suspended", { status: "SUSPENDED" });
person("u_admin", { role: "ADMIN" });
person("u_evaluator", { role: "EVALUATOR" });
person("u_pm", { role: "PROJECT_MANAGER" });
person("u_finance", { role: "FINANCE" });

createRow("Track", { id: "t_design", slug: "design", title: "Design" });
createRow("Category", { id: "cat_design", slug: "design", name: "Design", status: "PUBLISHED" });
createRow("Skill", { id: "sk_ui", categoryId: "cat_design", slug: "ui-ux-design", name: "UI/UX Design", status: "PUBLISHED" });
createRow("Course", { id: "co_paid", slug: "figma-ui", title: "Figma UI Design", trackId: "t_design", skillId: "sk_ui", level: "BEGINNER", priceINR: 2499, status: "PUBLISHED" });
createRow("Course", { id: "co_free", slug: "ui-basics", title: "UI Basics", trackId: "t_design", skillId: "sk_ui", level: "BEGINNER", priceINR: 0, status: "PUBLISHED" });
createRow("Course", { id: "co_online", slug: "ux-research", title: "UX Research", trackId: "t_design", skillId: "sk_ui", level: "BEGINNER", priceINR: 1000, status: "PUBLISHED" });
// the suspended student holds an ACTIVE badge: talent search must still leave them out
createRow("SkillVerification", { id: "sv_suspended", userId: "u_suspended", skillId: "sk_ui", level: "INTERMEDIATE", status: "ACTIVE", verifyCode: "SMOKE-SUSP" });

/* ───────────── HTTP client ───────────── */
const { createApp } = await imp("src/app.js");
const server = createApp().listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}`;
const token = (uid) => jwt.sign({ sub: `cat_${uid}` }, process.env.CATALANCE_JWT_SECRET, { expiresIn: "10m" });

function call(method, p, body, uid, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : Buffer.isBuffer(body) || typeof body === "string" ? body : JSON.stringify(body);
    const req = http.request(base + p, { method, headers: { "content-type": "application/json", ...(uid ? { authorization: `Bearer ${token(uid)}` } : {}), ...headers } }, (res) => {
      let s = "";
      res.on("data", (c) => (s += c));
      res.on("end", () => {
        let parsed = s;
        try { parsed = s ? JSON.parse(s) : null; } catch { /* text */ }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}
const GET = (p, uid) => call("GET", p, undefined, uid);
const POST = (p, body, uid, headers) => call("POST", p, body ?? {}, uid, headers);
const PUT = (p, body, uid) => call("PUT", p, body ?? {}, uid);
const DEL = (p, uid) => call("DELETE", p, undefined, uid);
const signed = (event, id) => {
  const raw = Buffer.from(JSON.stringify(event));
  return [raw, { "x-razorpay-signature": crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest("hex"), "x-razorpay-event-id": id }];
};

let failures = 0;
let passes = 0;
function check(name, ok, detail) {
  if (ok) passes++;
  else failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `\n      ${JSON.stringify(detail)?.slice(0, 600)}`}`);
}
const section = (t) => console.log(`\n— ${t}`);
const rows = (model, pred = () => true) => db[model].filter(pred);

try {
  /* ── payments ── */
  section("Payments (spec §10)");
  let r = await POST("/api/courses/co_paid/enroll", {}, "u_student");
  check("paid course without a paid order → 402", r.status === 402, r);

  r = await POST("/api/courses/co_paid/checkout", { provider: "OFFLINE", consents: ["TERMS"] }, "u_student");
  check("checkout without all required consents → 400", r.status === 400, r);

  r = await POST("/api/courses/co_paid/checkout", { provider: "OFFLINE", consents: ["TERMS", "PRIVACY", "REFUND"] }, "u_student");
  const offlineOrder = r.body?.order || r.body;
  check("offline checkout → PENDING order with GST computed on the server", [200, 201].includes(r.status) && offlineOrder?.status === "PENDING" && offlineOrder?.totalINR === 2949, r);
  check("checkout consents recorded", rows("ConsentRecord", (c) => c.userId === "u_student").length >= 3, rows("ConsentRecord"));

  r = await GET(`/api/orders/${offlineOrder.id}/receipt`, "u_other");
  check("another student can't read the order receipt → 404", r.status === 404, r);

  r = await POST(`/api/orders/${offlineOrder.id}/offline-reference`, { reference: "UTR 1234 5678" }, "u_student");
  check("student submits the offline reference", r.status === 200, r);

  r = await POST(`/api/admin/orders/${offlineOrder.id}/verify-offline`, {}, "u_student");
  check("student can't verify payments → 403", r.status === 403, r);

  r = await POST(`/api/admin/orders/${offlineOrder.id}/verify-offline`, { note: "UTR matched bank statement" }, "u_finance");
  const enrolled = rows("Enrollment", (e) => e.userId === "u_student" && e.courseId === "co_paid");
  check("finance verifies the offline payment → PAID, receipt, enrolled", r.status === 200 && db.CourseOrder.find((o) => o.id === offlineOrder.id)?.status === "PAID" && enrolled.length === 1 && Boolean(db.CourseOrder.find((o) => o.id === offlineOrder.id)?.receiptNo), r);
  check("offline verification is audited", rows("AuditLog", (a) => a.entityId === offlineOrder.id).length > 0, rows("AuditLog").map((a) => a.action));

  r = await POST("/api/courses/co_online/checkout", { provider: "RAZORPAY", consents: ["TERMS", "PRIVACY", "REFUND"] }, "u_other");
  const rpOrder = r.body?.order || r.body;
  check("online checkout creates a Razorpay order", [200, 201].includes(r.status) && Boolean(rpOrder?.providerOrderId || db.CourseOrder.find((o) => o.id === rpOrder?.id)?.providerOrderId), r);
  const providerOrderId = db.CourseOrder.find((o) => o.id === rpOrder.id)?.providerOrderId;
  const event = {
    event: "payment.captured",
    payload: { payment: { entity: { id: "pay_smoke1", order_id: providerOrderId, amount: db.CourseOrder.find((o) => o.id === rpOrder.id).totalINR * 100, notes: { campusOrderId: rpOrder.id } } } },
  };
  const raw = Buffer.from(JSON.stringify(event));
  const sig = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest("hex");
  r = await POST("/api/webhooks/razorpay", raw, null, { "x-razorpay-signature": "bad" });
  check("webhook with a bad signature → 400", r.status === 400, r);
  r = await POST("/api/webhooks/razorpay", raw, null, { "x-razorpay-signature": sig, "x-razorpay-event-id": "evt_smoke_1" });
  const notesAfterFirst = rows("Notification", (n) => n.userId === "u_other").length;
  check("webhook payment.captured → PAID and enrolled", r.status === 200 && db.CourseOrder.find((o) => o.id === rpOrder.id)?.status === "PAID" && rows("Enrollment", (e) => e.userId === "u_other" && e.courseId === "co_online").length === 1, r);
  r = await POST("/api/webhooks/razorpay", raw, null, { "x-razorpay-signature": sig, "x-razorpay-event-id": "evt_smoke_1" });
  check(
    "duplicate webhook is a no-op (no second enrolment, notification or receipt)",
    r.status === 200 && r.body?.duplicate === true && rows("Enrollment", (e) => e.userId === "u_other" && e.courseId === "co_online").length === 1 && rows("Notification", (n) => n.userId === "u_other").length === notesAfterFirst,
    r,
  );

  // a capture on an order that a newer checkout replaced (CANCELLED) still took money → the record must say PAID
  r = await POST("/api/courses/co_online/checkout", { provider: "RAZORPAY", consents: ["TERMS", "PRIVACY", "REFUND"] }, "u_unverified");
  const staleOrder = r.body?.order || r.body;
  await POST("/api/courses/co_online/checkout", { provider: "OFFLINE", consents: ["TERMS", "PRIVACY", "REFUND"] }, "u_unverified");
  const stale = db.CourseOrder.find((o) => o.id === staleOrder.id);
  check("switching payment method cancels the open Razorpay order", stale?.status === "CANCELLED", stale);
  r = await POST(
    "/api/webhooks/razorpay",
    ...((e) => [e[0], null, e[1]])(signed({ event: "payment.captured", payload: { payment: { entity: { id: "pay_stale", order_id: stale.providerOrderId, amount: stale.totalINR * 100 } } } }, "evt_stale")),
  );
  check("capture on a replaced (cancelled) order → PAID and enrolled, not a retry loop", r.status === 200 && db.CourseOrder.find((o) => o.id === stale.id)?.status === "PAID" && rows("Enrollment", (e) => e.userId === "u_unverified" && e.courseId === "co_online").length === 1, r);

  r = await GET("/api/me/orders", "u_other");
  check("/api/me/orders lists only the caller's orders", r.status === 200 && Array.isArray(r.body) && r.body.every((o) => o.id !== offlineOrder.id), r.body);

  /* ── assessment: below pass ── */
  section("Assessment & verification (spec §8)");
  const scoresFor = (brief, quality, process, delivery) => [
    { criterionId: "brief", score: brief },
    { criterionId: "quality", score: quality },
    { criterionId: "process", score: process },
    { criterionId: "delivery", score: delivery },
  ];
  const FEEDBACK = "Clear structure. Tighten spacing and explain your colour choices next time.";

  r = await POST("/api/courses/co_paid/assessment/start", {}, "u_unverified");
  check("a student who isn't enrolled can't start the assessment → 403", r.status === 403, r);

  r = await POST("/api/courses/co_paid/assessment/start", {}, "u_student");
  const a1 = r.body;
  check("enrolled student starts attempt 1", r.status === 201 && a1?.status === "IN_PROGRESS", r);
  r = await POST(`/api/attempts/${a1.id}/submit`, {}, "u_student");
  check("empty submission is rejected → 400", r.status === 400, r);
  r = await PUT(`/api/attempts/${a1.id}/submission`, { links: ["https://figma.com/file/smoke"], text: "Landing page for a café." }, "u_student");
  check("draft saved", r.status === 200, r);
  r = await PUT(`/api/attempts/${a1.id}/submission`, { text: "not mine" }, "u_other");
  check("another student can't touch the attempt → 404", r.status === 404, r);
  r = await POST(`/api/attempts/${a1.id}/submit`, {}, "u_student");
  check("submit locks the attempt → SUBMITTED", r.status === 200 && r.body?.status === "SUBMITTED", r);
  r = await GET("/api/evaluations", "u_student");
  check("students can't see the evaluation queue → 403", r.status === 403, r);
  r = await POST(`/api/evaluations/${a1.id}/claim`, {}, "u_evaluator");
  check("evaluator claims the attempt → UNDER_REVIEW", r.status === 200 && r.body?.status === "UNDER_REVIEW", r);
  r = await POST(`/api/evaluations/${a1.id}/result`, { scores: scoresFor(6, 5, 6, 6), feedback: FEEDBACK }, "u_evaluator");
  check("score 57 (below 70) on attempt 1 → REASSESSMENT_REQUIRED with a window", r.status === 200 && r.body?.status === "REASSESSMENT_REQUIRED" && r.body?.totalScore === 57 && r.body?.passed === false && Boolean(r.body?.reassessUntil), r.body);

  r = await POST("/api/courses/co_paid/assessment/start", {}, "u_student");
  const a2 = r.body;
  await POST(`/api/attempts/${a2.id}/submit`, {}, "u_student");
  r = await POST(`/api/evaluations/${a2.id}/result`, { scores: scoresFor(6, 6, 6, 6), feedback: FEEDBACK }, "u_evaluator");
  check("below pass on the last allowed attempt (2 of 2) → FAILED, no new attempt", r.status === 200 && r.body?.status === "FAILED" && r.body?.totalScore === 60, r.body);
  r = await POST("/api/courses/co_paid/assessment/start", {}, "u_student");
  check("starting a third attempt is refused", r.status === 409 || r.status === 403, r);
  r = await POST(`/api/attempts/${a1.id}/appeal`, { reason: "Appealing the first attempt after starting the second one." }, "u_student");
  check("an older attempt can't be appealed once a newer one exists → 409", r.status === 409, r);
  r = await POST(`/api/attempts/${a2.id}/appeal`, { reason: "The rubric note on delivery contradicts the brief I was given." }, "u_student");
  check("a failed result can be appealed → APPEAL_PENDING", r.status === 200 && r.body?.status === "APPEAL_PENDING", r.body);

  /* ── assessment: critical criterion failed, then pass ── */
  r = await POST("/api/courses/co_free/enroll", {}, "u_other");
  check("free course enrols directly", r.status === 201, r);
  r = await POST("/api/courses/co_free/assessment/start", {}, "u_other");
  const b1 = r.body;
  await PUT(`/api/attempts/${b1.id}/submission`, { links: ["https://figma.com/file/other-1"] }, "u_other");
  await POST(`/api/attempts/${b1.id}/submit`, {}, "u_other");
  // brief 10, quality 10, process 10, delivery 4: total 30+30+20+8 = 88, but "delivery" is critical and below half marks
  r = await POST(`/api/evaluations/${b1.id}/result`, { scores: scoresFor(10, 10, 10, 4), feedback: FEEDBACK }, "u_admin");
  check("total 88 but a critical criterion below half → not passed (REASSESSMENT_REQUIRED)", r.status === 200 && r.body?.totalScore === 88 && r.body?.passed === false && r.body?.status === "REASSESSMENT_REQUIRED", r.body);

  r = await POST("/api/courses/co_free/assessment/start", {}, "u_other");
  const b2 = r.body;
  check("reassessment: attempt 2 starts with the last submission as draft", r.status === 201 && b2?.attemptNo === 2 && (b2?.submission?.links || []).length === 1, r.body);
  await POST(`/api/attempts/${b2.id}/submit`, {}, "u_other");
  r = await POST(`/api/evaluations/${b2.id}/result`, { scores: scoresFor(8, 8, 7, 8), feedback: FEEDBACK }, "u_evaluator");
  check("score 78 with all critical criteria met → PASSED", r.status === 200 && r.body?.status === "PASSED" && r.body?.passed === true && r.body?.totalScore === 78, r.body);

  r = await POST(`/api/admin/attempts/${b2.id}/verify`, {}, "u_admin");
  check("admin can't verify before onboarding → 409", r.status === 409, r);
  r = await POST(`/api/attempts/${b2.id}/onboarding`, { portfolioUrl: "https://behance.net/smoke", identityConfirmed: true, payoutReady: true, availabilityConfirmed: true }, "u_other");
  check("student completes verification onboarding", r.status === 200, r);
  const readyNotes = () => rows("Notification", (n) => n.userId === "u_admin" && n.title === "Verification ready to approve").length;
  const readyBefore = readyNotes();
  const firstOnboardedAt = db.AssessmentAttempt.find((a) => a.id === b2.id)?.onboarding?.submittedAt;
  r = await POST(`/api/attempts/${b2.id}/onboarding`, { portfolioUrl: "https://behance.net/smoke-v2", identityConfirmed: true, payoutReady: true, availabilityConfirmed: true }, "u_other");
  const ob = db.AssessmentAttempt.find((a) => a.id === b2.id)?.onboarding;
  check(
    "editing onboarding saves the change but doesn't notify admins again",
    r.status === 200 && ob?.portfolioUrl === "https://behance.net/smoke-v2" && ob?.submittedAt === firstOnboardedAt && readyNotes() === readyBefore && readyBefore === 1,
    { status: r.status, ob, readyBefore, after: readyNotes() },
  );
  r = await POST(`/api/admin/attempts/${b2.id}/verify`, {}, "u_evaluator");
  check("an evaluator can't approve verification → 403", r.status === 403, r);
  r = await POST(`/api/admin/attempts/${b2.id}/verify`, { note: "Evidence checked" }, "u_admin");
  const verification = r.body;
  const svRow = db.SkillVerification.find((v) => v.userId === "u_other" && v.skillId === "sk_ui");
  check("admin verifies → ACTIVE SkillVerification with code, rubric version and evidence", r.status === 201 && svRow?.status === "ACTIVE" && Boolean(svRow?.verifyCode) && svRow?.rubricVersion === 1 && (svRow?.evidence || []).length >= 2, { body: r.body, svRow });
  check("attempt is now VERIFIED", db.AssessmentAttempt.find((a) => a.id === b2.id)?.status === "VERIFIED", db.AssessmentAttempt.find((a) => a.id === b2.id));
  r = await GET(`/api/verify/skill/${svRow.verifyCode}`);
  r = await GET("/api/u/uother");
  check(
    "public passport lists the skill badge; rank and earnings hidden while their flags are off",
    r.status === 200 && r.body?.verifications?.length === 1 && r.body.verifications[0].verifyCode === svRow.verifyCode && r.body.stats?.earnedINR === null && r.body.stats?.seasonRank === null && !JSON.stringify(r.body).includes("@campus.dev"),
    r.body,
  );
  r = await GET(`/api/verify/skill/${svRow.verifyCode}`);
  check("public verify page shows the badge without private fields", r.status === 200 && r.body?.status === "ACTIVE" && !("email" in (r.body || {})) && !JSON.stringify(r.body).includes("@campus.dev"), r.body);

  /* ── projects: talent + offers ── */
  section("Projects & PM (spec §9, §13.4)");
  r = await GET("/api/pm/talent?skill=ui-ux-design", "u_student");
  check("students can't search talent → 403", r.status === 403, r);
  r = await GET("/api/pm/talent?skill=ui-ux-design", "u_pm");
  const talentIds = (r.body || []).map((t) => t.user?.id);
  check("talent search returns the verified student", r.status === 200 && talentIds.includes("u_other"), r.body);
  check("talent search excludes unverified and suspended students", !talentIds.includes("u_unverified") && !talentIds.includes("u_suspended") && !talentIds.includes("u_student"), talentIds);
  check("talent rows carry no contact details", !JSON.stringify(r.body).includes("@campus.dev"), r.body);

  const offerBody = (studentId) => ({
    title: "Landing page for a bakery",
    summary: "One-page site in Figma.",
    skillId: "sk_ui",
    level: "BEGINNER",
    deliverables: ["Figma file", "Exported PNGs"],
    acceptanceCriteria: ["Matches the brand colours"],
    expectedHours: 10,
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    payoutINR: 4000,
    studentId,
    shortlistReason: "Verified UI/UX badge and open to projects.",
  });
  r = await POST("/api/pm/offers", offerBody("u_unverified"), "u_pm");
  check("offer to an unverified student is rejected → 400", r.status === 400, r);
  r = await POST("/api/pm/offers", offerBody("u_other"), "u_pm");
  const offer = r.body;
  check("PM sends an offer to the verified student", r.status === 201 && offer?.status === "OFFERED", r);
  r = await GET(`/api/me/offers/${offer.id}`, "u_other");
  check("the student sees their offer without client price or split", r.status === 200 && !("clientPriceINR" in r.body) && !("shortlistReason" in r.body), r.body);
  r = await GET(`/api/me/offers/${offer.id}`, "u_student");
  check("another student can't read the offer → 404", r.status === 404, r);

  /* ── revoke ── */
  section("Revoke & audit");
  r = await POST(`/api/admin/verifications/${verification.id}/revoke`, {}, "u_admin");
  check("revoke without a reason → 400", r.status === 400, r);
  r = await POST(`/api/admin/verifications/${verification.id}/revoke`, { reason: "Plagiarised portfolio found" }, "u_admin");
  check("revoke with a reason → REVOKED, reason kept", r.status === 200 && db.SkillVerification.find((v) => v.id === verification.id)?.status === "REVOKED" && db.SkillVerification.find((v) => v.id === verification.id)?.revokedReason === "Plagiarised portfolio found", r.body);
  const actions = new Set(rows("AuditLog").map((a) => a.action));
  check("privileged changes are audited (result, approve, revoke)", ["assessment.result", "verification.approve", "verification.revoke", "offer.create"].every((x) => actions.has(x)), [...actions]);
  r = await GET("/api/pm/talent?skill=ui-ux-design", "u_pm");
  check("after revoke the student drops out of talent search", r.status === 200 && !(r.body || []).some((t) => t.user?.id === "u_other"), r.body);

  /* ── refunds + course deletion ── */
  section("Refunds & course deletion");
  const refundCalls = () => outbound.filter((o) => o.url.includes("/refund")).length;
  const before = refundCalls();
  const orderNow = () => db.CourseOrder.find((o) => o.id === rpOrder.id);
  const total = orderNow().totalINR;
  r = await POST(`/api/admin/orders/${rpOrder.id}/refund`, { amountINR: 100, reason: "Partial: one module cancelled" }, "u_finance");
  check("partial refund → order stays PAID with access, refundINR 100", r.status === 200 && orderNow().status === "PAID" && orderNow().refundINR === 100 && rows("Enrollment", (e) => e.userId === "u_other" && e.courseId === "co_online").length === 1, r);
  r = await POST(`/api/admin/orders/${rpOrder.id}/refund`, { amountINR: total, reason: "More than what is left" }, "u_finance");
  check("refund above the remaining amount → 400", r.status === 400 && orderNow().refundINR === 100, r);
  const hook = async (refundEvt, id) => {
    const body = Buffer.from(JSON.stringify(refundEvt));
    const s2 = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
    return POST("/api/webhooks/razorpay", body, null, { "x-razorpay-signature": s2, "x-razorpay-event-id": id });
  };
  r = await hook({ event: "refund.processed", payload: { refund: { entity: { id: "rfnd_smoke", payment_id: "pay_smoke1", amount: 100 * 100 } } } }, "evt_refund_echo");
  check("Razorpay webhook echoing our own refund (same refund id) doesn't count it twice", r.status === 200 && orderNow().refundINR === 100, { r, refundINR: orderNow().refundINR });
  r = await hook({ event: "refund.processed", payload: { refund: { entity: { id: "rfnd_dashboard_1", payment_id: "pay_smoke1", amount: 50 * 100 } } } }, "evt_refund_dash");
  check("a refund made in the Razorpay dashboard is recorded once via webhook", r.status === 200 && orderNow().refundINR === 150 && orderNow().status === "PAID", { r, refundINR: orderNow().refundINR });
  const beforeRest = refundCalls();
  const [ra, rb] = await Promise.all([
    POST(`/api/admin/orders/${rpOrder.id}/refund`, { amountINR: total - 150, reason: "Duplicate click test" }, "u_finance"),
    POST(`/api/admin/orders/${rpOrder.id}/refund`, { amountINR: total - 150, reason: "Duplicate click test" }, "u_finance"),
  ]);
  check("two refunds of the rest at once → exactly one Razorpay refund (the other is a no-op, 400 or 409)", refundCalls() - beforeRest === 1 && [ra.status, rb.status].every((s) => [200, 400, 409].includes(s)), { a: ra.status, b: rb.status, bBody: rb.body, calls: refundCalls() - beforeRest });
  check("fully refunded → REFUNDED and course access ended", orderNow().status === "REFUNDED" && orderNow().refundINR === total && rows("Enrollment", (e) => e.userId === "u_other" && e.courseId === "co_online").length === 0, orderNow());
  r = await POST(`/api/admin/orders/${rpOrder.id}/refund`, { amountINR: 100, reason: "Again" }, "u_finance");
  check("a fully refunded order isn't refunded again", refundCalls() - beforeRest === 1 && orderNow().status === "REFUNDED", r);
  r = await DEL("/api/admin/courses/co_paid", "u_admin");
  check("a course with payments or students can't be deleted → 409", r.status === 409 && Boolean(db.Course.find((c) => c.id === "co_paid")) && db.CourseOrder.some((o) => o.courseId === "co_paid"), r);

  /* ── uploads ── */
  section("Assessment uploads (spec §15)");
  r = await POST("/api/courses/co_online/assessment/start", {}, "u_unverified");
  const up = r.body;
  check("student starts an assessment for uploads", r.status === 201 && up?.status === "IN_PROGRESS", r);
  r = await POST(`/api/attempts/${up.id}/uploads`, { name: "brief.pdf", type: "application/pdf", size: 2048 }, "u_unverified");
  check("upload refused while the assessment doesn't accept files → 400", r.status === 400, r);
  db.Assessment.find((x) => x.courseId === "co_online").allowedFormats = ["link", "text", "file"];
  r = await GET("/api/courses/co_online/assessment", "u_unverified");
  check("assessment reports uploads enabled with the 25 MB limit", r.status === 200 && r.body?.uploads?.enabled === true && r.body.uploads.maxBytes === 25 * 1024 * 1024 && r.body.uploads.extensions.includes("fig"), r.body?.uploads);
  r = await POST(`/api/attempts/${up.id}/uploads`, { name: "setup.exe", type: "application/x-msdownload", size: 4096 }, "u_unverified");
  check("allow-list rejects .exe → 400", r.status === 400, r);
  r = await POST(`/api/attempts/${up.id}/uploads`, { name: "report.pdf", type: "application/x-msdownload", size: 4096 }, "u_unverified");
  check("a type that doesn't match the extension → 400", r.status === 400, r);
  r = await POST(`/api/attempts/${up.id}/uploads`, { name: "video.mp4", type: "video/mp4", size: 25 * 1024 * 1024 + 1 }, "u_unverified");
  check("a file over 25 MB → 400", r.status === 400, r);
  r = await POST(`/api/attempts/${up.id}/uploads`, { name: "Final design (v2).fig", type: "", size: 5_000_000 }, "u_unverified");
  const upFile = r.body?.file;
  check(
    "allowed file → presigned PUT + private key under campus/attempts/<attemptId>/",
    r.status === 201 && /X-Amz-Signature/.test(r.body?.uploadUrl) && r.body?.method === "PUT" && upFile?.key?.startsWith(`campus/attempts/${up.id}/`) && /Final-design-v2\.fig$/.test(upFile.key) && upFile.type === "application/x-figma" && !("url" in upFile),
    r.body,
  );
  r = await POST(`/api/attempts/${up.id}/uploads`, { name: "x.pdf", type: "application/pdf", size: 10 }, "u_other");
  check("another student can't start an upload on the attempt → 404", r.status === 404, r);
  r = await PUT(`/api/attempts/${up.id}/submission`, { files: [upFile] }, "u_unverified");
  check("saving a file that never reached storage → 400", r.status === 400, r);
  stored.set(upFile.key, { size: 4_900_000, type: upFile.type });
  r = await PUT(`/api/attempts/${up.id}/submission`, { files: [{ ...upFile, url: "https://public.example/leak" }] }, "u_unverified");
  const savedFiles = db.AssessmentAttempt.find((a) => a.id === up.id)?.submission?.files || [];
  check(
    "saved file keeps the key, the size from storage and no URL",
    r.status === 200 && savedFiles.length === 1 && savedFiles[0].key === upFile.key && savedFiles[0].size === 4_900_000 && !("url" in savedFiles[0]) && !JSON.stringify(r.body).includes("public.example"),
    { status: r.status, savedFiles },
  );
  r = await PUT(`/api/attempts/${up.id}/submission`, { files: [{ ...upFile, key: `campus/attempts/${b1.id}/abcdefgh-stolen.fig` }] }, "u_unverified");
  check("a key from someone else's attempt can't be attached → 400", r.status === 400, r);
  r = await GET(`/api/attempts/${up.id}/files/0`, "u_unverified");
  check("owner opens the file → presigned GET that expires", r.status === 200 && /X-Amz-Expires=600/.test(r.body?.url) && Boolean(r.body?.expiresAt), r.body);
  r = await GET(`/api/attempts/${up.id}/files/0`, "u_other");
  check("another student gets 404 on the file", r.status === 404, r);
  r = await GET(`/api/attempts/${up.id}/files/0`, "u_evaluator");
  check("an evaluator not assigned to the attempt gets 404", r.status === 404, r);
  r = await GET(`/api/attempts/${up.id}/files/0`, "u_admin");
  check("admin can open the file", r.status === 200 && Boolean(r.body?.url), r);
  r = await GET(`/api/attempts/${up.id}/files/5`, "u_unverified");
  check("missing file index → 404", r.status === 404, r);
  await POST(`/api/attempts/${up.id}/submit`, {}, "u_unverified");
  await POST(`/api/evaluations/${up.id}/claim`, {}, "u_evaluator");
  r = await GET(`/api/attempts/${up.id}/files/0`, "u_evaluator");
  check("the claiming evaluator can open the file", r.status === 200 && Boolean(r.body?.url), r);

  /* ── scheduler ── */
  section("Scheduler (spec §12)");
  const cron = (secret, method = "GET") => call(method, "/api/cron/tick", method === "POST" ? {} : undefined, null, secret ? { authorization: `Bearer ${secret}` } : {});
  r = await cron(null);
  check("cron tick without the secret → 401", r.status === 401, r);
  r = await cron("wrong-secret");
  check("cron tick with a wrong secret → 401", r.status === 401, r);
  const oldOffer = createRow("ProjectOffer", { id: "of_old", title: "Old logo offer", payoutINR: 1500, pmId: "u_pm", studentId: "u_other", status: "OFFERED", expiresAt: new Date(Date.now() - 3600000) });
  createRow("ProjectOffer", {
    id: "of_live",
    title: "Brand kit",
    payoutINR: 3000,
    pmId: "u_pm",
    studentId: "u_other",
    status: "IN_PROGRESS",
    milestones: [{ id: "m1", title: "First draft", dueAt: new Date(Date.now() + 2 * 3600000).toISOString(), status: "PENDING" }],
  });
  const pmExpired = () => rows("Notification", (n) => n.userId === "u_pm" && n.title === `Offer expired: ${oldOffer.title}`).length;
  const milestoneNotes = () => rows("Notification", (n) => n.title === "Milestone due soon: First draft").length;
  r = await cron("smoke-cron-secret");
  const expiredRow = db.ProjectOffer.find((o) => o.id === "of_old");
  check(
    "tick (Vercel Cron GET) expires the old offer, records history and notifies the PM once",
    r.status === 200 && r.body?.counts?.offersExpired === 1 && expiredRow?.status === "EXPIRED" && (expiredRow.history || []).some((h) => h.status === "EXPIRED") && pmExpired() === 1,
    { body: r.body, expiredRow, pmExpired: pmExpired() },
  );
  check("tick reminds the student and the PM about a milestone due within 24h", r.body?.counts?.milestoneReminders === 2 && milestoneNotes() === 2, { counts: r.body?.counts, notes: milestoneNotes() });
  r = await cron("smoke-cron-secret", "POST");
  check(
    "second tick (POST) does nothing: no second expiry or reminder",
    r.status === 200 && r.body?.counts?.offersExpired === 0 && r.body?.counts?.milestoneReminders === 0 && pmExpired() === 1 && milestoneNotes() === 2 && (db.ProjectOffer.find((o) => o.id === "of_old").history || []).filter((h) => h.status === "EXPIRED").length === 1,
    { body: r.body, pmExpired: pmExpired(), notes: milestoneNotes() },
  );

  /* ── flags ── */
  section("Feature flags (spec §19)");
  r = await POST("/api/tutor/chat", { message: "hi" }, "u_student");
  check("aiTutor flag off → /api/tutor 404", r.status === 404, r);
  r = await GET("/api/leaderboard");
  check("gamification flag off → /api/leaderboard 404", r.status === 404, r);
  r = await GET("/api/me/dashboard", "u_student");
  check("dashboard returns one next action from real data", r.status === 200 && Boolean(r.body?.nextAction?.type || r.body?.nextAction?.kind || r.body?.nextAction), r.body?.nextAction);

  check("no request left the machine except stubbed Razorpay/email calls", outbound.every((o) => /razorpay\.com|resend\.com/.test(o.url)), outbound.map((o) => o.url));
} catch (err) {
  failures++;
  console.error("\nCRASH", err);
} finally {
  server.close();
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
