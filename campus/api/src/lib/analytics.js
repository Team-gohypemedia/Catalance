import { env } from "./env.js";

/**
 * Product analytics events (spec §16: "use consistent event names").
 *   track("checkout.started", { courseId, provider }, req.user.id)
 * Events are NOT stored and NOT the source of the admin reports: every report metric is derived from the domain
 * tables (orders, attempts, verifications, offers…), so numbers can't drift from what really happened.
 * In development the event is logged to the console; a future analytics sink (PostHog, GA4, warehouse) plugs in
 * here without touching callers. Never put contact details, payment ids or free text in props.
 * Full dictionary with the report each event feeds: campus/docs/ANALYTICS.md.
 */
export const EVENT_DICTIONARY = {
  // Growth funnel: visitor → paid student → verified skill → first accepted paid project
  "page.viewed": { group: "growth", props: ["path", "source"], desc: "Any public page view (web)" },
  "course.viewed": { group: "growth", props: ["courseId", "source"], desc: "Course detail page opened" },
  "lead.captured": { group: "growth", props: ["source", "campaign"], desc: "Visitor left a contact / started sign-up with a lead source" },
  "signup.completed": { group: "growth", props: ["source"], desc: "Campus profile created from a Catalance account" },
  "checkout.started": { group: "growth", props: ["courseId", "provider"], desc: "Checkout opened (order created or reused)" },
  "payment.succeeded": { group: "finance", props: ["orderId", "courseId", "provider", "totalINR"], desc: "Order marked PAID" },
  "payment.failed": { group: "finance", props: ["orderId", "provider", "reason"], desc: "Order marked FAILED" },
  "refund.issued": { group: "finance", props: ["orderId", "amountINR"], desc: "Order refunded (full or part)" },
  "enrolment.created": { group: "course", props: ["courseId", "paid"], desc: "Student enrolled in a course" },
  // Course
  "lesson.completed": { group: "course", props: ["courseId", "lessonId"], desc: "Lesson marked complete" },
  "course.completed": { group: "course", props: ["courseId"], desc: "All lessons done (completion certificate)" },
  "assessment.started": { group: "course", props: ["courseId", "attemptNo"], desc: "Assessment attempt opened" },
  "assessment.submitted": { group: "course", props: ["courseId", "attemptNo", "late"], desc: "Attempt submitted for review" },
  "assessment.result": { group: "course", props: ["courseId", "status", "totalScore"], desc: "PASSED / REASSESSMENT_REQUIRED / FAILED" },
  "appeal.opened": { group: "talent", props: ["attemptId"], desc: "Student appealed a result" },
  // Talent
  "verification.approved": { group: "talent", props: ["skillId", "level"], desc: "SkillVerification created (ACTIVE)" },
  "verification.revoked": { group: "talent", props: ["skillId", "level"], desc: "SkillVerification revoked" },
  "availability.updated": { group: "talent", props: ["openToProjects", "hoursPerWeek"], desc: "Student changed availability" },
  // Marketplace
  "offer.created": { group: "marketplace", props: ["offerId", "skillId"], desc: "PM sent a project offer" },
  "offer.accepted": { group: "marketplace", props: ["offerId"], desc: "Student accepted an offer" },
  "offer.declined": { group: "marketplace", props: ["offerId"], desc: "Student declined an offer (no penalty)" },
  "offer.expired": { group: "marketplace", props: ["offerId"], desc: "Offer passed expiresAt without a response" },
  "delivery.submitted": { group: "quality", props: ["offerId", "version"], desc: "Student delivered work" },
  "delivery.revision_requested": { group: "quality", props: ["offerId", "revisionsUsed"], desc: "PM asked for a revision" },
  "project.client_accepted": { group: "quality", props: ["offerId", "onTime", "rating"], desc: "Client accepted the work (COMPLETED)" },
  "payout.paid": { group: "finance", props: ["offerId", "payoutINR"], desc: "Freelancer payout marked PAID" },
  // Support / capacity
  "ticket.created": { group: "capacity", props: ["category"], desc: "Support ticket, complaint or dispute opened" },
  "ticket.resolved": { group: "capacity", props: ["category"], desc: "Ticket resolved or closed" },
  // Admin
  "report.exported": { group: "admin", props: ["report", "format"], desc: "Admin/finance downloaded a report" },
};

const PRIVATE_KEYS = /email|phone|upi|password|token|signature|name|address/i;

/** Record one event. Never throws. Unknown names are logged once as a warning so the dictionary stays the contract. */
const warned = new Set();
export function track(name, props = {}, userId = null) {
  try {
    if (!EVENT_DICTIONARY[name]) {
      if (!warned.has(name)) console.warn(`[campus-api] analytics: unknown event "${name}" (add it to EVENT_DICTIONARY)`);
      warned.add(name);
    }
    const clean = Object.fromEntries(Object.entries(props || {}).filter(([k]) => !PRIVATE_KEYS.test(k)));
    if (env.nodeEnv === "development") console.info(`[analytics] ${name}`, JSON.stringify({ userId, ...clean }));
  } catch {
    /* analytics must never break a request */
  }
}
