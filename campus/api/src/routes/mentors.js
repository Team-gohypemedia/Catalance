import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate, zQ, zBool } from "../lib/validate.js";
import { httpError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";
import { notify } from "../lib/notify.js";
import { meetLink } from "../lib/util.js";
import { peerUser, courseOut, bookingOut, USER_INCLUDE, COURSE_INCLUDE, BOOKING_INCLUDE } from "../lib/serialize.js";
import { PUBLISHED } from "../services/courses.js";
import { openSlots } from "../services/bookings.js";
import { requireFlag } from "../lib/settings.js";

const router = Router();
// spec §2 feature flag (F1): only booking is switchable; mentor profiles stay readable for course pages
router.use("/api/mentors/:id/book", requireFlag("mentorBooking"));

const listQuery = z.object({ q: zQ, expertise: zQ, language: zQ, free: zBool.optional() }).passthrough();

router.get("/api/mentors", requireAuth, validate({ query: listQuery }), async (req, res) => {
  const { q, expertise, language, free } = req.q;
  let list = await prisma.user.findMany({
    where: { role: "MENTOR", status: { not: "SUSPENDED" }, NOT: { mentorProfile: { equals: null } } },
    include: USER_INCLUDE,
  });
  list = list.filter((m) => m.mentorProfile && typeof m.mentorProfile === "object");
  const prof = (m) => ({ expertise: [], languages: [], rating: 0, sessionsCount: 0, priceINR: 0, company: "", ...m.mentorProfile });
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter((m) => `${m.name} ${m.headline || ""} ${prof(m).company} ${prof(m).expertise.join(" ")}`.toLowerCase().includes(needle));
  }
  if (expertise) list = list.filter((m) => prof(m).expertise.some((e) => e.toLowerCase().includes(expertise.toLowerCase())));
  if (language) list = list.filter((m) => prof(m).languages.includes(language));
  if (free) list = list.filter((m) => !prof(m).priceINR);
  list.sort((a, b) => prof(b).rating - prof(a).rating || prof(b).sessionsCount - prof(a).sessionsCount);

  const out = [];
  for (const m of list) {
    const next = (await openSlots(m)).find((d) => d.times.length);
    // nextAvailable is additive (same as the demo engine), handy for directory cards
    out.push({ ...peerUser(m), nextAvailable: next ? { date: next.date, time: next.times[0] } : null });
  }
  res.json(out);
});

async function getMentor(idOrUsername) {
  const m = await prisma.user.findFirst({
    where: { role: "MENTOR", OR: [{ id: idOrUsername }, { username: idOrUsername }] },
    include: USER_INCLUDE,
  });
  if (!m) throw httpError(404, "Mentor not found.");
  return m;
}

router.get("/api/mentors/:id", requireAuth, async (req, res) => {
  const m = await getMentor(req.params.id);
  const [reviews, courses, slots] = await Promise.all([
    prisma.mentorReview.findMany({ where: { mentorId: m.id }, orderBy: { createdAt: "desc" } }),
    prisma.course.findMany({ where: { ...PUBLISHED, mentorId: m.id }, include: COURSE_INCLUDE, orderBy: { studentsCount: "desc" } }),
    openSlots(m),
  ]);
  res.json({
    ...peerUser(m),
    reviews: reviews.map(({ id, userName, rating, comment, createdAt }) => ({ id, userName, rating, comment, createdAt })),
    courses: courses.map((c) => courseOut(c)),
    openSlots: slots,
  });
});

const bookSchema = z.object({
  date: z.string({ required_error: "Pick a date and a time slot." }).regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date and a time slot."),
  time: z.string({ required_error: "Pick a date and a time slot." }).regex(/^\d{2}:\d{2}$/, "Pick a date and a time slot."),
  topic: z
    .string({ required_error: "Tell the mentor what you want to discuss." })
    .trim()
    .min(3, "Tell the mentor what you want to discuss.")
    .transform((s) => s.slice(0, 140)),
  note: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => v || null),
});

router.post("/api/mentors/:id/book", requireAuth, validate({ body: bookSchema }), async (req, res) => {
  const m = await prisma.user.findFirst({ where: { id: req.params.id, role: "MENTOR" }, include: USER_INCLUDE });
  if (!m) throw httpError(404, "Mentor not found.");
  const user = req.user;
  if (m.id === user.id) throw httpError(400, "You can't book a session with yourself.");
  const { date, time, topic, note } = req.body;

  const booking = await prisma.$transaction(async (tx) => {
    const day = (await openSlots(m, tx)).find((d) => d.date === date);
    if (!day || !day.times.includes(time)) throw httpError(409, "That slot was just taken. Please pick another time.");
    const b = await tx.booking.create({
      data: { mentorId: m.id, userId: user.id, date, time, topic, note, meetLink: meetLink() },
      include: BOOKING_INCLUDE,
    });
    const when = `${new Date(`${date}T${time}:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} at ${time}`;
    await notify(user.id, { type: "MENTOR", title: `Session confirmed with ${m.name}`, body: `${topic} · ${when}`, link: `/app/mentors/${m.id}` }, tx);
    await notify(m.id, { type: "MENTOR", title: `New booking from ${user.name}`, body: `${topic} · ${when}`, link: "/app/mentor" }, tx);
    return b;
  });
  res.status(201).json(bookingOut(booking));
});

export default router;
