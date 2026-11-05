import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";
import { Prisma } from "@prisma/client";
import { selfUser, USER_INCLUDE } from "../lib/serialize.js";
import { aspirantInput, cleanAspirant } from "../lib/aspirant.js";

const router = Router();

const LANG = z.enum(["en", "hinglish", "hi", "ta", "te", "bn", "mr"]);
const GOAL = z.enum(["FIRST_INCOME", "JOB", "FREELANCE_CAREER", "SKILL_UP", "GOVT_EXAM_BACKUP"]);
const SKILL_LEVEL = z.enum(["NEW", "SOME", "CONFIDENT"]);
const nullableStr = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v === "" ? null : v));
const url = z.string().trim().max(300).optional().nullable();

const profileSchema = z
  .object({
    name: z.string().trim().min(1, "Name can't be empty.").max(80),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Username must be at least 3 characters.")
      .max(30)
      .regex(/^[a-z0-9_.]+$/, "Use only letters, numbers, dots and underscores."),
    headline: nullableStr(160),
    bio: nullableStr(2000),
    phone: nullableStr(20),
    city: nullableStr(80),
    state: nullableStr(80),
    year: z.coerce.number().int().min(1).max(5).nullable(),
    stream: nullableStr(80),
    goal: GOAL.nullable(),
    language: LANG,
    interests: z.array(z.string().trim().max(60)).max(20),
    skillLevel: SKILL_LEVEL.nullable(),
    skills: z.array(z.string().trim().min(1).max(60)).max(50),
    links: z.object({ github: url, linkedin: url, portfolio: url, behance: url }).partial().passthrough(),
    avatarUrl: nullableStr(500),
    notificationPrefs: z.object({ email: z.boolean(), whatsapp: z.boolean(), push: z.boolean() }).partial(),
    aspirant: aspirantInput.nullable(),
  })
  .partial()
  .strip();

router.patch("/api/me", requireAuth, validate({ body: profileSchema }), async (req, res) => {
  const patch = { ...req.body };
  if (patch.username && patch.username !== req.user.username) {
    const taken = await prisma.user.findFirst({ where: { username: patch.username, id: { not: req.user.id } } });
    if (taken) throw httpError(409, "That username is taken.");
  }
  if (patch.notificationPrefs) patch.notificationPrefs = { ...(req.user.notificationPrefs || {}), ...patch.notificationPrefs };
  if (patch.links) patch.links = Object.fromEntries(Object.entries(patch.links).filter(([, v]) => v));
  if (patch.skills) patch.skills = [...new Set(patch.skills)];
  if ("aspirant" in patch) {
    // merge with the stored profile, then normalise (null turns Aspirant mode off)
    const next = cleanAspirant(patch.aspirant, req.user.aspirant);
    patch.aspirant = next ?? Prisma.DbNull;
  }
  const user = await prisma.user.update({ where: { id: req.user.id }, data: patch, include: USER_INCLUDE });
  res.json({ user: selfUser(user) });
});

const onboardingSchema = z.object({
  collegeId: z.string().trim().optional().nullable(),
  newCollege: z
    .object({
      name: z.string().trim().min(2, "College name is too short.").max(160),
      city: z.string().trim().max(80).optional().default(""),
      state: z.string().trim().max(80).optional().default(""),
      type: z.enum(["ENGINEERING", "ARTS_SCIENCE", "COMMERCE", "DESIGN", "MANAGEMENT", "POLYTECHNIC"]).optional().default("ENGINEERING"),
    })
    .optional()
    .nullable(),
  year: z.coerce.number().int().min(1).max(5).optional().nullable(),
  stream: z.string().trim().max(80).optional().nullable(),
  goal: GOAL.optional().nullable(),
  language: LANG.optional().default("en"),
  interests: z.array(z.string().trim().max(60)).max(20).optional().default([]),
  skillLevel: SKILL_LEVEL.optional().nullable(),
  aspirant: aspirantInput.optional().nullable(),
});

const shortNameOf = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 5);

router.post("/api/me/onboarding", requireAuth, validate({ body: onboardingSchema }), async (req, res) => {
  const b = req.body;
  let college = b.collegeId ? await prisma.college.findUnique({ where: { id: b.collegeId } }) : null;
  if (b.collegeId && !college && !b.newCollege?.name) throw httpError(400, "That college doesn't exist. Add it as a new college.");
  if (!college && b.newCollege?.name) {
    const count = await prisma.college.count();
    college = await prisma.college.create({
      data: {
        name: b.newCollege.name,
        shortName: shortNameOf(b.newCollege.name),
        city: b.newCollege.city || "",
        state: b.newCollege.state || "",
        type: b.newCollege.type,
        verified: false,
        studentsCount: 1,
        rank: count + 1,
      },
    });
  } else if (college && college.id !== req.user.collegeId) {
    await prisma.college.update({ where: { id: college.id }, data: { studentsCount: { increment: 1 } } });
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      collegeId: college?.id ?? null,
      city: req.user.city || college?.city || null,
      state: req.user.state || college?.state || null,
      year: b.year ?? null,
      stream: b.stream ?? null,
      goal: b.goal ?? null,
      language: b.language || "en",
      interests: b.interests || [],
      skillLevel: b.skillLevel ?? null,
      // saved only for GOVT_EXAM_BACKUP; aspirants may skip college (collegeId stays null)
      aspirant: b.goal === "GOVT_EXAM_BACKUP" ? cleanAspirant(b.aspirant || {}) : Prisma.DbNull,
      onboarded: true,
    },
    include: USER_INCLUDE,
  });
  res.json({ user: selfUser(user) });
});

export default router;
