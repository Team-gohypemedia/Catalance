import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { env } from "./env.js";
import { prisma } from "./prisma.js";
import { httpError } from "./errors.js";
import { notify } from "./notify.js";
import { USER_INCLUDE } from "./serialize.js";

/**
 * Campus has no accounts of its own: people sign in with Catalance (main backend) and send its access token.
 * Each Catalance account gets one Campus profile (campus."User", linked by catalanceUserId), created on first visit.
 * The main app's public."User" table is only ever READ here (one row by primary key), never written.
 */

function readToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

async function findCatalanceAccount(id) {
  const rows = await prisma.$queryRaw`
    SELECT id, email, "fullName", avatar, role::text AS role, status::text AS status
    FROM public."User" WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

/** A public handle (/u/:username) from the person's name. Never from the email: phone-only Catalance accounts
 *  have "<phone digits>@phone.catalance.local" emails, and the handle is public. */
export async function uniqueUsername(name) {
  const base = String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "student";
  let username = base;
  for (let i = 0; await prisma.user.findUnique({ where: { username } }); i++) {
    username = `${base}${Math.floor(Math.random() * (i < 5 ? 1000 : 100000))}`;
  }
  return username;
}

/**
 * Campus role from the Catalance role (spec §3: one account, role-based access).
 * Catalance ADMIN → ADMIN, PROJECT_MANAGER → PROJECT_MANAGER. Roles granted inside Campus (MENTOR, EVALUATOR,
 * FINANCE, or ADMIN given by a Campus admin) are kept; Catalance only ever raises a role, never lowers one.
 */
const CATALANCE_ROLE_MAP = { ADMIN: "ADMIN", PROJECT_MANAGER: "PROJECT_MANAGER" };
function campusRoleFor(catalanceRole, currentRole) {
  const mapped = CATALANCE_ROLE_MAP[catalanceRole];
  if (!mapped || currentRole === "ADMIN") return currentRole;
  return currentRole === "STUDENT" ? mapped : mapped === "ADMIN" ? "ADMIN" : currentRole;
}

const isUniqueViolation = (err) => err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

/** Keep identity fields that Catalance owns in step with it (only writes when something changed). */
async function syncFromCatalance(user, account) {
  const data = {};
  const email = account.email.toLowerCase();
  if (user.email !== email && !(await prisma.user.findUnique({ where: { email } }))) data.email = email;
  const role = campusRoleFor(account.role, user.role);
  if (role !== user.role) data.role = role;
  if (!Object.keys(data).length) return user;
  return prisma.user.update({ where: { id: user.id }, data, include: USER_INCLUDE });
}

async function createProfile(account) {
  const email = account.email.toLowerCase();
  const name = account.fullName?.trim() || "Campus learner";
  const user = await prisma.user.create({
    data: {
      catalanceUserId: account.id,
      email,
      name,
      username: await uniqueUsername(name),
      avatarUrl: account.avatar || null,
      role: campusRoleFor(account.role, "STUDENT"),
      coins: 50,
    },
    include: USER_INCLUDE,
  });
  await notify(user.id, {
    type: "SYSTEM",
    title: "Welcome to Catalance Campus",
    body: "Finish setting up your profile to get a learning path made for you.",
    link: "/app",
    event: "registration",
  });
  return user;
}

/** The Campus profile for a Catalance account, creating (or linking) it on first visit. */
async function campusProfileFor(account) {
  const linked = await prisma.user.findUnique({ where: { catalanceUserId: account.id }, include: USER_INCLUDE });
  if (linked) return syncFromCatalance(linked, account);

  // A Campus profile made before Campus moved to Catalance accounts, under the same email, is adopted.
  const byEmail = await prisma.user.findUnique({ where: { email: account.email.toLowerCase() } });
  if (byEmail) {
    if (byEmail.catalanceUserId) throw httpError(409, "This email is already linked to another Catalance account on Campus. Contact support.");
    const adopted = await prisma.user.update({ where: { id: byEmail.id }, data: { catalanceUserId: account.id }, include: USER_INCLUDE });
    return syncFromCatalance(adopted, account);
  }

  try {
    return await createProfile(account);
  } catch (err) {
    // The app fires several requests at once on a first visit; another one may have just created the profile.
    if (!isUniqueViolation(err)) throw err;
    const created = await prisma.user.findUnique({ where: { catalanceUserId: account.id }, include: USER_INCLUDE });
    if (!created) throw err;
    return created;
  }
}

async function loadUser(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.catalanceJwtSecret);
  } catch {
    throw httpError(401, "Your session has expired. Please log in again.");
  }
  const accountId = payload?.sub || payload?.id;
  const account = accountId ? await findCatalanceAccount(accountId) : null;
  if (!account) throw httpError(401, "Your session has expired. Please log in again.");
  if (account.status === "SUSPENDED") throw httpError(403, "This account is suspended. Contact support.");

  const user = await campusProfileFor(account);
  if (user.status === "SUSPENDED") throw httpError(403, "This account is suspended. Contact support.");
  return user;
}

/** 🔒 Sets req.user (Prisma user incl. college) or responds 401. */
export async function requireAuth(req, _res, next) {
  try {
    const token = readToken(req);
    if (!token) throw httpError(401, "Please log in to continue.");
    req.user = await loadUser(token);
    next();
  } catch (err) {
    next(err);
  }
}

/** Sets req.user when a valid token is present; never fails because of auth. */
export async function optionalAuth(req, _res, next) {
  const token = readToken(req);
  req.user = null;
  if (token) {
    try {
      req.user = await loadUser(token);
    } catch {
      req.user = null;
    }
  }
  next();
}

/** requireRole("MENTOR") — admins always pass. Use after requireAuth. */
export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(httpError(401, "Please log in to continue."));
    if (req.user.role !== "ADMIN" && !roles.includes(req.user.role)) {
      return next(httpError(403, "You don't have access to this."));
    }
    next();
  };
