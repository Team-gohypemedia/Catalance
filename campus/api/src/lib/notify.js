import { prisma } from "./prisma.js";
import { renderEmail, sendEmail } from "./email.js";

/**
 * Spec §12 events that also send an email (in-app + email in MVP). Everything else is in-app only, so learners
 * don't get an email for every like, point or lesson tick (spec: "avoid excessive notifications").
 * The button label is the one primary action of the email.
 */
export const EMAIL_EVENTS = {
  registration: "Get started",
  "payment.success": "View receipt",
  "payment.failed": "Try again",
  "course.start": "Start course",
  "lesson.deadline": "Continue",
  "assignment.due": "Open assignment",
  "assessment.result": "View feedback",
  "reassessment.window_ending": "Start reassessment",
  "verification.completed": "View skill",
  "project.new_match": "View project",
  "offer.accepted": "View project",
  "offer.declined": "View offer",
  "offer.expired": "View offer",
  "milestone.due": "View project",
  "client.review_needed": "Review delivery",
  "payout.status": "View payout",
  "ticket.update": "View ticket",
};

/**
 * Callers that don't name an event still get emails for the §12 screens, inferred from the notification's link.
 * Order matters: the first match wins.
 */
const LINK_EVENTS = [
  [/^\/app\/payments|\/receipt/, (n) => (/fail|didn.?t go through|retry/i.test(`${n.title} ${n.body}`) ? "payment.failed" : "payment.success")],
  [/^\/app\/assessments|\/assessment(\/|$)/, () => "assessment.result"],
  [/^\/app\/skills/, () => "verification.completed"],
  [/^\/app\/opportunities/, () => "project.new_match"],
  [/^\/app\/projects/, (n) => (/payout|paid/i.test(n.title) ? "payout.status" : "offer.accepted")],
  [/^\/admin\/offers/, (n) => (/declin/i.test(n.title) ? "offer.declined" : /expir/i.test(n.title) ? "offer.expired" : /deliver|submitted|review/i.test(n.title) ? "client.review_needed" : "offer.accepted")],
  [/^\/app\/help|^\/admin\/support/, () => "ticket.update"],
];

function emailEventFor(n) {
  if (n.email === false) return null;
  if (n.event) return EMAIL_EVENTS[n.event] ? n.event : null;
  if (n.email === true) return "custom";
  if (!n.link) return null;
  if (n.type === "SYSTEM" && n.link === "/app" && /^welcome/i.test(n.title || "")) return "registration";
  for (const [re, pick] of LINK_EVENTS) if (re.test(n.link)) return pick(n);
  return null;
}

/** Fire-and-forget email for one notification. Reads outside any transaction; never throws into callers. */
function emailLater(userId, n, event) {
  setImmediate(async () => {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, status: true, notificationPrefs: true } });
      if (!user || (user.status === "SUSPENDED" && event !== "ticket.update")) return;
      if (user.notificationPrefs && typeof user.notificationPrefs === "object" && user.notificationPrefs.email === false) return;
      const mail = renderEmail({ title: n.title, body: n.body, link: n.link, cta: n.cta || EMAIL_EVENTS[event] || "Open Campus" });
      await sendEmail({ to: user.email, ...mail });
    } catch (err) {
      console.error("[campus-api] notification email failed", err?.message);
    }
  });
}

/**
 * Create a notification. type: COURSE|GIG|COMMUNITY|MENTOR|RANK|SYSTEM. Pass `tx` inside a transaction.
 * Email (spec §12): sent after the row is written when the user's notificationPrefs.email is on and either
 *   - `event` names one of EMAIL_EVENTS (e.g. { event: "assessment.result" }), or `email: true`, or
 *   - the link points at a §12 screen (payments, assessments, skills, opportunities, projects, help).
 * Pass `email: false` to keep one in-app only. `cta` overrides the email button label.
 * The email never blocks or fails the caller (inside a transaction it may go out just before commit).
 */
export async function notify(userId, { type = "SYSTEM", title, body = "", link = null, event, email, cta }, tx) {
  const row = await (tx || prisma).notification.create({ data: { userId, type, title, body: body || "", link } });
  const mailEvent = emailEventFor({ type, title, body, link, event, email });
  if (mailEvent) emailLater(userId, { title, body, link, cta }, mailEvent);
  return row;
}
