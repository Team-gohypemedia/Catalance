import { prisma } from "../lib/prisma.js";

/**
 * Read-only bridge to Catalance Campus data (same Postgres database, schema "campus").
 * Campus owns those tables; this service only ever SELECTs from them.
 *
 * The campus schema may not exist yet in some environments (Campus not deployed, fresh DB),
 * so every query degrades to an empty result instead of failing the request.
 */

const CAMPUS_WEB_URL = String(
  process.env.CAMPUS_URL || process.env.CAMPUS_WEB_URL || "https://campus.catalance.in"
).replace(/\/$/, "");

export const CAMPUS_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "STANDARD"];

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

// Postgres: 42P01 undefined_table, 3F000 invalid_schema_name, 42703 undefined_column, 42704 undefined_object (enum type).
const MISSING_RELATION_CODES = new Set(["42P01", "3F000", "42703", "42704"]);

const isMissingCampusSchemaError = (error) => {
  const dbCode = String(error?.meta?.code || error?.code || "");
  if (MISSING_RELATION_CODES.has(dbCode)) return true;
  const message = String(error?.meta?.message || error?.message || "");
  return /(relation|schema|type) "?[^"]*"? does not exist/i.test(message);
};

/** Runs a campus query; returns `fallback` (and logs) when Campus data is unavailable. */
const readCampus = async (label, query, fallback) => {
  if (!prisma) return { rows: fallback, available: false };
  try {
    return { rows: await query(), available: true };
  } catch (error) {
    if (isMissingCampusSchemaError(error)) {
      return { rows: fallback, available: false };
    }
    console.warn(`[campus-link] ${label} failed:`, error?.message || error);
    return { rows: fallback, available: false };
  }
};

export const isValidCatalanceUserId = (value) => ID_PATTERN.test(String(value || ""));
export const normalizeSkillSlug = (value) => {
  const slug = String(value || "").trim().toLowerCase();
  return SLUG_PATTERN.test(slug) ? slug : null;
};
export const normalizeLevel = (value) => {
  const level = String(value || "").trim().toUpperCase();
  return CAMPUS_LEVELS.includes(level) ? level : null;
};

export const buildSkillVerifyUrl = (code) =>
  code ? `${CAMPUS_WEB_URL}/verify/skill/${encodeURIComponent(code)}` : null;

const toIso = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const mapVerification = (row) => ({
  skill: {
    slug: row.skillSlug,
    name: row.skillName,
    category: row.categoryName || null,
  },
  level: row.level,
  awardedAt: toIso(row.awardedAt),
  expiresAt: toIso(row.expiresAt),
  verifyCode: row.verifyCode,
  verifyUrl: buildSkillVerifyUrl(row.verifyCode),
});

/**
 * Public: ACTIVE, non-expired Campus skill verifications for a Catalance user id.
 * Suspended Campus profiles show nothing. No private data (no email/phone/name) is returned.
 */
export const getVerifiedSkillsForCatalanceUser = async (catalanceUserId) => {
  if (!isValidCatalanceUserId(catalanceUserId)) return [];

  const { rows } = await readCampus(
    "verified skills",
    () => prisma.$queryRaw`
      SELECT
        s.slug AS "skillSlug",
        s.name AS "skillName",
        c.name AS "categoryName",
        sv.level::text AS "level",
        sv."awardedAt" AS "awardedAt",
        sv."expiresAt" AS "expiresAt",
        sv."verifyCode" AS "verifyCode"
      FROM campus."SkillVerification" sv
      JOIN campus."User" cu ON cu.id = sv."userId"
      JOIN campus."Skill" s ON s.id = sv."skillId"
      LEFT JOIN campus."Category" c ON c.id = s."categoryId"
      WHERE cu."catalanceUserId" = ${catalanceUserId}
        AND cu.status::text = 'ACTIVE'
        AND sv.status::text = 'ACTIVE'
        AND (sv."expiresAt" IS NULL OR sv."expiresAt" > NOW())
      ORDER BY sv."awardedAt" DESC
      LIMIT 50
    `,
    []
  );

  return rows.map(mapVerification);
};

/** Signed-in user's Campus snapshot for the Catalance dashboard card. */
export const getCampusSummaryForCatalanceUser = async (catalanceUserId) => {
  const empty = { linked: false, verifiedSkills: 0, activeCourses: 0, openOffers: 0 };
  if (!isValidCatalanceUserId(catalanceUserId)) return empty;

  const { rows } = await readCampus(
    "summary",
    () => prisma.$queryRaw`
      SELECT
        cu.id AS "campusUserId",
        (
          SELECT COUNT(*)::int FROM campus."SkillVerification" sv
          WHERE sv."userId" = cu.id
            AND sv.status::text = 'ACTIVE'
            AND (sv."expiresAt" IS NULL OR sv."expiresAt" > NOW())
        ) AS "verifiedSkills",
        (
          SELECT COUNT(*)::int FROM campus."Enrollment" e
          WHERE e."userId" = cu.id AND e."completedAt" IS NULL
        ) AS "activeCourses",
        (
          SELECT COUNT(*)::int FROM campus."ProjectOffer" po
          WHERE po."studentId" = cu.id
            AND po.status::text = 'OFFERED'
            AND (po."expiresAt" IS NULL OR po."expiresAt" > NOW())
        ) AS "openOffers"
      FROM campus."User" cu
      WHERE cu."catalanceUserId" = ${catalanceUserId}
      LIMIT 1
    `,
    []
  );

  const row = rows[0];
  if (!row) return empty;
  return {
    linked: true,
    verifiedSkills: Number(row.verifiedSkills || 0),
    activeCourses: Number(row.activeCourses || 0),
    openOffers: Number(row.openOffers || 0),
  };
};

const SAFE_AVAILABILITY_KEYS = ["openToProjects", "hoursPerWeek", "days", "preferredTaskTypes", "tools"];

const pickAvailability = (value) => {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return SAFE_AVAILABILITY_KEYS.reduce((acc, key) => {
    if (source[key] !== undefined) acc[key] = source[key];
    return acc;
  }, {});
};

/**
 * PM/Admin: Catalance users with ACTIVE Campus verifications who are open to projects.
 * Optional filters: skill slug, level. Each row lists all of that person's active verifications.
 * Never returns email or phone.
 */
export const listCampusTalent = async ({ skill = null, level = null } = {}) => {
  const skillSlug = normalizeSkillSlug(skill);
  const skillLevel = normalizeLevel(level);

  const { rows, available } = await readCampus(
    "talent",
    () => prisma.$queryRaw`
      SELECT
        u.id AS "userId",
        u."fullName" AS "fullName",
        u.avatar AS "avatar",
        cu.username AS "campusUsername",
        cu.availability AS "availability",
        COALESCE(
          json_agg(
            json_build_object(
              'skillSlug', s.slug,
              'skillName', s.name,
              'categoryName', c.name,
              'level', sv.level::text,
              'awardedAt', sv."awardedAt",
              'expiresAt', sv."expiresAt",
              'verifyCode', sv."verifyCode"
            )
            ORDER BY sv."awardedAt" DESC
          ),
          '[]'::json
        ) AS "verifications",
        MAX(sv."awardedAt") AS "lastVerifiedAt"
      FROM campus."User" cu
      JOIN public."User" u ON u.id = cu."catalanceUserId"
      JOIN campus."SkillVerification" sv ON sv."userId" = cu.id
      JOIN campus."Skill" s ON s.id = sv."skillId"
      LEFT JOIN campus."Category" c ON c.id = s."categoryId"
      WHERE cu.status::text = 'ACTIVE'
        AND u.status::text = 'ACTIVE'
        AND cu.availability ->> 'openToProjects' = 'true'
        AND sv.status::text = 'ACTIVE'
        AND (sv."expiresAt" IS NULL OR sv."expiresAt" > NOW())
        AND (
          (${skillSlug}::text IS NULL AND ${skillLevel}::text IS NULL)
          OR EXISTS (
            SELECT 1
            FROM campus."SkillVerification" fv
            JOIN campus."Skill" fs ON fs.id = fv."skillId"
            WHERE fv."userId" = cu.id
              AND fv.status::text = 'ACTIVE'
              AND (fv."expiresAt" IS NULL OR fv."expiresAt" > NOW())
              AND (${skillSlug}::text IS NULL OR fs.slug = ${skillSlug}::text)
              AND (${skillLevel}::text IS NULL OR fv.level::text = ${skillLevel}::text)
          )
        )
      GROUP BY u.id, u."fullName", u.avatar, cu.username, cu.availability
      ORDER BY MAX(sv."awardedAt") DESC
      LIMIT 100
    `,
    []
  );

  return {
    available,
    talent: rows.map((row) => ({
      userId: row.userId,
      fullName: row.fullName || "",
      avatar: row.avatar || null,
      campusUsername: row.campusUsername || null,
      availability: pickAvailability(row.availability),
      lastVerifiedAt: toIso(row.lastVerifiedAt),
      verifications: (Array.isArray(row.verifications) ? row.verifications : []).map(mapVerification),
    })),
  };
};

/** Skills that currently have at least one active verification (for the PM filter dropdown). */
export const listVerifiedCampusSkills = async () => {
  const { rows } = await readCampus(
    "skills",
    () => prisma.$queryRaw`
      SELECT DISTINCT s.slug AS "slug", s.name AS "name"
      FROM campus."SkillVerification" sv
      JOIN campus."Skill" s ON s.id = sv."skillId"
      WHERE sv.status::text = 'ACTIVE'
        AND (sv."expiresAt" IS NULL OR sv."expiresAt" > NOW())
      ORDER BY s.name ASC
      LIMIT 200
    `,
    []
  );
  return rows.map((row) => ({ slug: row.slug, name: row.name }));
};
