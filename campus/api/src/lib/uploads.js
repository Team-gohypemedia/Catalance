import crypto from "node:crypto";
import { httpError } from "./errors.js";

/**
 * Assessment file uploads (spec §15: validate type and size, private storage, expiring links).
 * Pure rules only; the R2 driver is lib/storage.js. The demo engine mirrors these in web/src/mocks/handlers/assessment.js.
 */

/** Largest file a student can upload (bytes). Change here (and in the demo engine + web picker) to raise it. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
/** Files per submission. */
export const MAX_FILES = 10;
/** Presigned PUT / GET links expire after this many seconds. */
export const UPLOAD_URL_TTL = 10 * 60;
export const DOWNLOAD_URL_TTL = 10 * 60;
/** Every submission object lives under this private prefix (never public, never a permanent URL). */
export const ATTEMPT_PREFIX = "campus/attempts/";

/**
 * Allow-list by extension → the one Content-Type we store and sign, plus the types browsers report for it.
 * "" and application/octet-stream are accepted for every row (browsers often send them for .fig and .zip).
 */
export const UPLOAD_TYPES = {
  pdf: { type: "application/pdf", label: "PDF" },
  png: { type: "image/png", label: "PNG image" },
  jpg: { type: "image/jpeg", label: "JPG image" },
  jpeg: { type: "image/jpeg", label: "JPG image" },
  webp: { type: "image/webp", label: "WebP image" },
  zip: { type: "application/zip", label: "ZIP", aliases: ["application/x-zip-compressed", "application/x-zip", "multipart/x-zip"] },
  fig: { type: "application/x-figma", label: "Figma file", aliases: ["application/figma"] },
  mp4: { type: "video/mp4", label: "MP4 video" },
  docx: { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word" },
  pptx: { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", label: "PowerPoint" },
  xlsx: { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", label: "Excel" },
  txt: { type: "text/plain", label: "Text" },
};
export const UPLOAD_EXTENSIONS = Object.keys(UPLOAD_TYPES);
export const STORED_TYPES = [...new Set(Object.values(UPLOAD_TYPES).map((t) => t.type))];
const GENERIC = new Set(["", "application/octet-stream", "binary/octet-stream"]);

export const extOf = (name) => {
  const m = /\.([a-z0-9]{1,8})$/i.exec(String(name || "").trim());
  return m ? m[1].toLowerCase() : "";
};

/** Public summary for the web picker (contract: `uploads` on GET /api/courses/:id/assessment). */
export const uploadRules = (enabled) => ({ enabled: Boolean(enabled), maxBytes: MAX_UPLOAD_BYTES, maxFiles: MAX_FILES, extensions: UPLOAD_EXTENSIONS });

/**
 * Validate a file the student wants to upload. Returns { name, size, type } with the canonical stored type.
 * 400 for anything outside the allow-list or over the size limit.
 */
export function checkUpload({ name, type, size }) {
  const clean = String(name || "").trim();
  if (!clean) throw httpError(400, "The file needs a name.");
  const rule = UPLOAD_TYPES[extOf(clean)];
  if (!rule) throw httpError(400, `That file type isn't allowed. Use ${UPLOAD_EXTENSIONS.map((e) => e.toUpperCase()).join(", ")}.`);
  const reported = String(type || "").toLowerCase().split(";")[0].trim();
  if (!GENERIC.has(reported) && reported !== rule.type && !(rule.aliases || []).includes(reported)) {
    throw httpError(400, "The file's type doesn't match its extension.");
  }
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0) throw httpError(400, "The file is empty.");
  if (bytes > MAX_UPLOAD_BYTES) throw httpError(400, `Files must be ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB or smaller.`);
  return { name: clean.slice(0, 200), size: Math.floor(bytes), type: rule.type };
}

/** A storage-safe file name: ASCII letters, digits, dot, dash, underscore; keeps the extension. */
export function safeName(name) {
  const ext = extOf(name);
  const base = String(name || "file")
    .replace(/\.[^.]*$/, "")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80) || "file";
  return ext ? `${base}.${ext}` : base;
}

/** campus/attempts/<attemptId>/<random>-<safe name> */
export const attemptKey = (attemptId, name) => `${ATTEMPT_PREFIX}${attemptId}/${crypto.randomBytes(9).toString("base64url")}-${safeName(name)}`;

/** The attempt id a key belongs to, or null when the key isn't a well-formed submission key. */
export function attemptIdOfKey(key) {
  const m = /^campus\/attempts\/([A-Za-z0-9_-]{1,64})\/[A-Za-z0-9_-]{6,32}-[\w.-]{1,90}$/.exec(String(key || ""));
  return m ? m[1] : null;
}
