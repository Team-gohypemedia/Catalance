import { ApiError } from "@/lib/api/client";

/** Throw inside a handler to return an HTTP error. */
export const httpError = (status, message) => new ApiError(message, status);

export function requireUser(user) {
  if (!user) throw httpError(401, "Please log in to continue.");
  return user;
}

export function requireRole(user, ...roles) {
  requireUser(user);
  if (user.role !== "ADMIN" && !roles.includes(user.role)) throw httpError(403, "You don't have access to this.");
  return user;
}

let counter = 0;
export const uid = (prefix = "id") => `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const now = () => new Date().toISOString();

/** Date helpers for seed data: daysAgo(3) / daysFromNow(5) / hoursAgo(2) → ISO string */
export const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
export const hoursAgo = (n) => new Date(Date.now() - n * 3600000).toISOString();
export const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString();

/** Strip private fields from a user record. */
export function publicUser(u) {
  if (!u) return null;
  // eslint-disable-next-line no-unused-vars
  const { password, ...rest } = u;
  return rest;
}

/** Minimal author block for threads, replies, etc. */
export const miniUser = (u) =>
  u ? { id: u.id, name: u.name, username: u.username, avatarUrl: u.avatarUrl, role: u.role, division: u.division, college: u.college ?? null } : null;

/** Deterministic pseudo-random generator for stable seed data. */
export function seeded(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
