import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { httpError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";
import { notificationOut } from "../lib/serialize.js";

const router = Router();

router.get("/api/notifications", requireAuth, async (req, res) => {
  const rows = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  res.json(rows.map(notificationOut));
});

router.post("/api/notifications/read-all", requireAuth, async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, read: false }, data: { read: true } });
  res.json({ ok: true });
});

router.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
  const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!n || n.userId !== req.user.id) throw httpError(404, "Notification not found.");
  const updated = await prisma.notification.update({ where: { id: n.id }, data: { read: true } });
  res.json(notificationOut(updated));
});

export default router;
