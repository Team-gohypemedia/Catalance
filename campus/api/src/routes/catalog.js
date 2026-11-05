import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth, optionalAuth, requireRole } from "../lib/auth.js";
import { audit } from "../lib/audit.js";
import { getSetting } from "../lib/settings.js";
import { slugify } from "../lib/util.js";
import { courseOut, COURSE_INCLUDE } from "../lib/serialize.js";
import { enrollmentMap } from "../services/courses.js";
import { CATEGORY_STATUSES, COURSE_LEVELS, LISTED_COURSE_WHERE, SKILL_STATUSES, categoryOut, skillOut } from "../lib/catalog.js";

/**
 * Catalogue: categories → skills → courses (spec §6). Database-driven and editable by admins.
 * See campus/API_CONTRACT.md "Spec v1.0" → Catalogue.
 */
const router = Router();

const isAdmin = (user) => user?.role === "ADMIN";
const ORDER_BY = [{ order: "asc" }, { name: "asc" }];

/* ───────────── public ───────────── */

// Published categories with their published skills; admins pass ?all=1 to see every status.
router.get("/api/categories", optionalAuth, async (req, res) => {
  const all = isAdmin(req.user) && (req.query.all === "1" || req.query.all === "true");
  const categories = await prisma.category.findMany({
    where: all ? {} : { status: "PUBLISHED" },
    include: { skills: { where: all ? {} : { status: "PUBLISHED" }, orderBy: ORDER_BY } },
    orderBy: ORDER_BY,
  });
  const skillIds = categories.flatMap((c) => c.skills.map((s) => s.id));
  const counts = skillIds.length
    ? await prisma.course.groupBy({ by: ["skillId"], where: { ...LISTED_COURSE_WHERE, skillId: { in: skillIds } }, _count: { _all: true } })
    : [];
  const countOf = new Map(counts.map((r) => [r.skillId, r._count._all]));
  res.json(
    categories
      .filter((c) => all || c.skills.length)
      .map((c) => ({ ...categoryOut(c), skills: c.skills.map((s) => ({ ...skillOut(s), coursesCount: countOf.get(s.id) || 0 })) })),
  );
});

router.get("/api/skills/:slug", optionalAuth, async (req, res) => {
  const admin = isAdmin(req.user);
  const skill = await prisma.skill.findFirst({
    where: { OR: [{ slug: req.params.slug }, { id: req.params.slug }] },
    include: { category: true },
  });
  if (!skill || (!admin && (skill.status !== "PUBLISHED" || skill.category.status !== "PUBLISHED"))) throw httpError(404, "Skill not found.");
  const courses = await prisma.course.findMany({
    where: { ...LISTED_COURSE_WHERE, skillId: skill.id },
    include: COURSE_INCLUDE,
    orderBy: [{ priceINR: "asc" }, { createdAt: "asc" }],
  });
  const gstPercent = await getSetting("pricing.gstPercent");
  const enr = await enrollmentMap(req.user?.id, courses.map((c) => c.id));
  res.json({
    ...skillOut(skill),
    category: { id: skill.category.id, slug: skill.category.slug, name: skill.category.name },
    courses: courses.map((c) => courseOut(c, { enrollment: enr.get(c.id) || null, gstPercent })),
  });
});

/* ───────────── admin 🛡 ───────────── */

const admin = [requireAuth, requireRole("ADMIN")];
const strList = z.array(z.any()).transform((v) => v.filter((x) => x !== null && x !== undefined && String(x).trim() !== "").map((x) => String(x).trim()));

const categorySchema = z
  .object({
    slug: z.string().trim().max(80),
    name: z.string().trim().min(1, "Give the category a name.").max(120),
    order: z.coerce.number().int().min(0).max(10000),
    status: z.enum(CATEGORY_STATUSES),
  })
  .partial();

const skillSchema = z
  .object({
    categoryId: z.string().trim().min(1),
    slug: z.string().trim().max(80),
    name: z.string().trim().min(1, "Give the skill a name.").max(160),
    description: z.string().max(4000),
    tags: strList,
    formats: z.array(z.enum(COURSE_LEVELS)).transform((v) => [...new Set(v)]),
    clientServices: z.string().max(2000),
    status: z.enum(SKILL_STATUSES),
    order: z.coerce.number().int().min(0).max(10000),
  })
  .partial();

async function uniqueSlug(model, base, exceptId) {
  const root = slugify(base) || model;
  let slug = root;
  for (let n = 2; await prisma[model].findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } }); n++) {
    slug = `${root}-${n}`;
  }
  return slug;
}

const nextOrder = async (model, where = {}) => ((await prisma[model].aggregate({ where, _max: { order: true } }))._max.order ?? -1) + 1;

// categories

router.get("/api/admin/categories", ...admin, async (_req, res) => {
  const categories = await prisma.category.findMany({ include: { skills: { orderBy: ORDER_BY } }, orderBy: ORDER_BY });
  res.json(categories.map((c) => categoryOut(c)));
});

router.post("/api/admin/categories", ...admin, validate({ body: categorySchema }), async (req, res) => {
  const { name, slug, order, status } = req.body;
  if (!name) throw httpError(400, "Give the category a name.");
  const category = await prisma.$transaction(async (tx) => {
    const c = await tx.category.create({
      data: { name, slug: await uniqueSlug("category", slug || name), order: order ?? (await nextOrder("category")), status: status || "DRAFT" },
      include: { skills: true },
    });
    await audit(req, { action: "category.create", entity: "Category", entityId: c.id, after: categoryOut(c) }, tx);
    return c;
  });
  res.status(201).json(categoryOut(category));
});

router.put("/api/admin/categories/:id", ...admin, validate({ body: categorySchema }), async (req, res) => {
  const existing = await prisma.category.findUnique({ where: { id: req.params.id }, include: { skills: { orderBy: ORDER_BY } } });
  if (!existing) throw httpError(404, "Category not found.");
  const { slug, ...rest } = req.body;
  const data = { ...rest, ...(slug ? { slug: await uniqueSlug("category", slug, existing.id) } : {}) };
  const category = await prisma.$transaction(async (tx) => {
    const c = await tx.category.update({ where: { id: existing.id }, data, include: { skills: { orderBy: ORDER_BY } } });
    await audit(req, { action: "category.update", entity: "Category", entityId: c.id, before: categoryOut(existing), after: categoryOut(c) }, tx);
    return c;
  });
  res.json(categoryOut(category));
});

router.delete("/api/admin/categories/:id", ...admin, async (req, res) => {
  const existing = await prisma.category.findUnique({ where: { id: req.params.id }, include: { skills: true } });
  if (!existing) throw httpError(404, "Category not found.");
  if (existing.skills.length) throw httpError(400, "Move or delete its skills first, or archive the category.");
  await prisma.$transaction(async (tx) => {
    await tx.category.delete({ where: { id: existing.id } });
    await audit(req, { action: "category.delete", entity: "Category", entityId: existing.id, before: categoryOut(existing) }, tx);
  });
  res.json({ ok: true });
});

// skills

router.get("/api/admin/skills", ...admin, async (req, res) => {
  const where = req.query.categoryId ? { categoryId: String(req.query.categoryId) } : {};
  const skills = await prisma.skill.findMany({ where, orderBy: ORDER_BY });
  res.json(skills.map(skillOut));
});

router.post("/api/admin/skills", ...admin, validate({ body: skillSchema }), async (req, res) => {
  const { name, slug, categoryId, order, status, ...rest } = req.body;
  if (!name) throw httpError(400, "Give the skill a name.");
  if (!categoryId || !(await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } }))) throw httpError(400, "Choose a category.");
  const skill = await prisma.$transaction(async (tx) => {
    const s = await tx.skill.create({
      data: {
        ...rest,
        name,
        categoryId,
        slug: await uniqueSlug("skill", slug || name),
        order: order ?? (await nextOrder("skill", { categoryId })),
        status: status || "DRAFT",
      },
    });
    await audit(req, { action: "skill.create", entity: "Skill", entityId: s.id, after: skillOut(s) }, tx);
    return s;
  });
  res.status(201).json(skillOut(skill));
});

router.put("/api/admin/skills/:id", ...admin, validate({ body: skillSchema }), async (req, res) => {
  const existing = await prisma.skill.findUnique({ where: { id: req.params.id } });
  if (!existing) throw httpError(404, "Skill not found.");
  const { slug, categoryId, ...rest } = req.body;
  if (categoryId && !(await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } }))) throw httpError(400, "Choose a category.");
  const data = { ...rest, ...(categoryId ? { categoryId } : {}), ...(slug ? { slug: await uniqueSlug("skill", slug, existing.id) } : {}) };
  const skill = await prisma.$transaction(async (tx) => {
    const s = await tx.skill.update({ where: { id: existing.id }, data });
    await audit(req, { action: "skill.update", entity: "Skill", entityId: s.id, before: skillOut(existing), after: skillOut(s) }, tx);
    return s;
  });
  res.json(skillOut(skill));
});

router.delete("/api/admin/skills/:id", ...admin, async (req, res) => {
  const existing = await prisma.skill.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { courses: true, verifications: true, offers: true } } },
  });
  if (!existing) throw httpError(404, "Skill not found.");
  const { courses, verifications, offers } = existing._count;
  if (courses || verifications || offers) throw httpError(400, "This skill has courses, verifications or projects. Archive it instead.");
  await prisma.$transaction(async (tx) => {
    await tx.skill.delete({ where: { id: existing.id } });
    await audit(req, { action: "skill.delete", entity: "Skill", entityId: existing.id, before: skillOut(existing) }, tx);
  });
  res.json({ ok: true });
});

export default router;
