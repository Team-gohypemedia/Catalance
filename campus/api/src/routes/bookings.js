import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { httpError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";
import { notify } from "../lib/notify.js";
import { bookingOut, BOOKING_INCLUDE } from "../lib/serialize.js";
import { sortBookings } from "../services/bookings.js";
import { requireFlag } from "../lib/settings.js";

const router = Router();
// spec §2 feature flag (F1): the whole area 404s while the flag is off (mounted at root, so scope by path)
router.use(["/api/me/bookings", "/api/bookings"], requireFlag("mentorBooking"));

/** As student, plus (for mentors) the sessions where I'm the mentor. */
router.get("/api/me/bookings", requireAuth, async (req, res) => {
  const list = await prisma.booking.findMany({
    where: { OR: [{ userId: req.user.id }, { mentorId: req.user.id }] },
    include: BOOKING_INCLUDE,
  });
  res.json(sortBookings(list).map(bookingOut));
});

router.post("/api/bookings/:id/cancel", requireAuth, async (req, res) => {
  const user = req.user;
  const b = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!b) throw httpError(404, "Booking not found.");
  if (b.userId !== user.id && b.mentorId !== user.id && user.role !== "ADMIN") throw httpError(403, "You can't cancel this booking.");
  if (b.status !== "UPCOMING") throw httpError(400, "Only upcoming sessions can be cancelled.");
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.booking.update({ where: { id: b.id }, data: { status: "CANCELLED" }, include: BOOKING_INCLUDE });
    const otherId = b.userId === user.id ? b.mentorId : b.userId;
    await notify(
      otherId,
      {
        type: "MENTOR",
        title: `Session cancelled by ${user.name}`,
        body: `${b.topic} on ${b.date} at ${b.time} was cancelled.`,
        link: otherId === b.mentorId ? "/app/mentor" : `/app/mentors/${b.mentorId}`,
      },
      tx,
    );
    return u;
  });
  res.json(bookingOut(updated));
});

export default router;
