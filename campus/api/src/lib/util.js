import crypto from "node:crypto";

/** Wrap an async route handler (Express 5 forwards rejections itself; this just keeps intent explicit). */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const iso = (d) => (d ? new Date(d).toISOString() : null);
export const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
export const daysAgo = (n) => new Date(Date.now() - n * 86400000);
export const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Local YYYY-MM-DD (server timezone), used for booking dates. */
export const localDate = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export const randomCode = (len = 8) => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
};

export const meetLink = () => {
  const part = (n) => Array.from(crypto.randomBytes(n), (b) => "abcdefghijklmnopqrstuvwxyz"[b % 26]).join("");
  return `https://meet.google.com/${part(3)}-${part(4)}-${part(3)}`;
};

/** Stable non-negative integer from a string (deterministic "rank change" arrows etc.). */
export const stableHash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const includesCI = (haystack, needle) => String(haystack || "").toLowerCase().includes(String(needle || "").toLowerCase());

export const sum = (arr, fn = (x) => x) => arr.reduce((s, x) => s + (Number(fn(x)) || 0), 0);
