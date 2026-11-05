import { prisma } from "../lib/prisma.js";
import { localDate, WEEKDAYS } from "../lib/util.js";

/** Booking start timestamp (server-local date + HH:mm). */
export const bookingTs = (b) => new Date(`${b.date}T${b.time || "00:00"}:00`).getTime();

/** Upcoming first (soonest first), then the rest (most recent first). */
export function sortBookings(list) {
  const upcoming = list.filter((b) => b.status === "UPCOMING").sort((a, b) => bookingTs(a) - bookingTs(b));
  const rest = list.filter((b) => b.status !== "UPCOMING").sort((a, b) => bookingTs(b) - bookingTs(a));
  return [...upcoming, ...rest];
}

/** Next 14 days of open slots: availability minus booked slots, excluding anything within the next hour. */
export async function openSlots(mentor, tx = prisma) {
  const availability = Array.isArray(mentor.mentorProfile?.availability) ? mentor.mentorProfile.availability : [];
  const base = new Date();
  const from = localDate(base);
  const to = localDate(new Date(base.getFullYear(), base.getMonth(), base.getDate() + 14));
  const booked = await tx.booking.findMany({
    where: { mentorId: mentor.id, status: { not: "CANCELLED" }, date: { gte: from, lte: to } },
    select: { date: true, time: true },
  });
  const taken = new Set(booked.map((b) => `${b.date} ${b.time}`));
  const out = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const date = localDate(d);
    const day = availability.find((a) => a.day === WEEKDAYS[d.getDay()]);
    const times = (day?.slots || [])
      .filter((t) => !taken.has(`${date} ${t}`))
      .filter((t) => new Date(`${date}T${t}:00`).getTime() > Date.now() + 60 * 60 * 1000)
      .sort();
    out.push({ date, times });
  }
  return out;
}
