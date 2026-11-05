/**
 * Shared demo-engine helpers for points and notifications.
 * Use these from any handler so rank, XP, coins and divisions stay consistent.
 */
import { divisionFor } from "@/lib/utils";
import { DEFAULT_SETTINGS } from "./data/platform";

/** flags.gamification (admin setting). Read directly to avoid importing handlers/platform.js (it imports this file). */
const gamificationOn = (db) => Boolean(db.all("platformSettings").find((r) => r.key === "flags.gamification")?.value ?? DEFAULT_SETTINGS["flags.gamification"]);

/** Award (or remove, with negative points) season points. Returns the updated user. */
export function awardPoints(db, userId, points, source, note) {
  // Gamification is off for the MVP (spec §2): nothing accrues while it's hidden (same as the API).
  if (!points || !gamificationOn(db)) return db.findById("users", userId);
  db.insert("pointsEvents", { userId, source, points, note });
  return db.update("users", userId, (u) => {
    const seasonPoints = Math.max(0, (u.seasonPoints || 0) + points);
    return {
      seasonPoints,
      lifetimePoints: Math.max(0, (u.lifetimePoints || 0) + points),
      xp: Math.max(0, (u.xp || 0) + points),
      coins: Math.max(0, (u.coins || 0) + Math.round(points / 10)),
      division: divisionFor(seasonPoints),
    };
  });
}

/** Create a notification for a user. type: COURSE|GIG|COMMUNITY|MENTOR|RANK|SYSTEM */
export function notify(db, userId, { type = "SYSTEM", title, body = "", link = null }) {
  return db.insert("notifications", { userId, type, title, body, link, read: false });
}

/** Points table — keep handlers consistent. */
export const POINTS = {
  LESSON: 20,
  QUIZ_PASS: 40,
  QUIZ_PERFECT_BONUS: 20,
  ASSIGNMENT_SUBMIT: 60,
  ASSIGNMENT_REVIEWED_PER_SCORE: 1, // + score (0–100)
  COURSE_COMPLETE: 250,
  GIG_APPROVED: 400,
  ANSWER_ACCEPTED: 50,
  REPLY_POSTED: 5,
  STREAK_DAY: 10,
};
