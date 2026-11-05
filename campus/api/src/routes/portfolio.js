import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";
import { stableHash } from "../lib/util.js";
import { portfolioOut, pointsEventOut } from "../lib/serialize.js";

const router = Router();

const COVERS = [
  { from: "#FF5A1F", to: "#6B4EFF" },
  { from: "#12A150", to: "#1F9BFF" },
  { from: "#E8B100", to: "#FF5A1F" },
  { from: "#6B4EFF", to: "#3CC6C0" },
  { from: "#E5484D", to: "#D98E00" },
  { from: "#1F9BFF", to: "#8B74FF" },
];

const TITLE_MSG = "Give your project a title (at least 3 characters).";
const title = z.string().trim().min(3, TITLE_MSG).transform((s) => s.slice(0, 120));
const description = z
  .string()
  .trim()
  .transform((s) => s.slice(0, 1000));
const link = z
  .string()
  .trim()
  .nullable()
  .transform((v) => v || null)
  .refine((v) => !v || /^https?:\/\/\S+\.\S+/.test(v), "Links need to start with https:// (e.g. https://github.com/you/project).");
const skills = z
  .union([z.array(z.any()), z.string()])
  .transform((v) => [...new Set((Array.isArray(v) ? v : v.split(",")).map((s) => String(s).trim()).filter(Boolean))].slice(0, 8));

const createSchema = z.object({
  title: z.string({ required_error: TITLE_MSG }).pipe(title),
  description: description.optional().default(""),
  link: link.optional().default(null),
  skills: skills.optional().default([]),
});
const patchSchema = z.object({ title, description, link, skills }).partial();

router.get("/api/me/points", requireAuth, async (req, res) => {
  const rows = await prisma.pointsEvent.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" } });
  res.json(rows.map(pointsEventOut));
});

router.get("/api/me/portfolio", requireAuth, async (req, res) => {
  const rows = await prisma.portfolioItem.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" } });
  res.json(rows.map(portfolioOut));
});

router.post("/api/me/portfolio", requireAuth, validate({ body: createSchema }), async (req, res) => {
  const count = await prisma.portfolioItem.count({ where: { userId: req.user.id } });
  const item = await prisma.portfolioItem.create({
    data: {
      userId: req.user.id,
      ...req.body,
      cover: COVERS[(stableHash(req.body.title) + count) % COVERS.length],
      verified: false,
      source: "PERSONAL",
    },
  });
  res.status(201).json(portfolioOut(item));
});

async function ownPersonalItem(userId, id) {
  const item = await prisma.portfolioItem.findUnique({ where: { id } });
  if (!item || item.userId !== userId) throw httpError(404, "Portfolio item not found.");
  if (item.source !== "PERSONAL") throw httpError(400, "Verified items come from mentor reviews and can't be edited.");
  return item;
}

router.patch("/api/me/portfolio/:id", requireAuth, validate({ body: patchSchema }), async (req, res) => {
  await ownPersonalItem(req.user.id, req.params.id);
  const item = await prisma.portfolioItem.update({ where: { id: req.params.id }, data: req.body });
  res.json(portfolioOut(item));
});

router.delete("/api/me/portfolio/:id", requireAuth, async (req, res) => {
  await ownPersonalItem(req.user.id, req.params.id);
  await prisma.portfolioItem.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
