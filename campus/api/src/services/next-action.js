/**
 * The ONE next step on the student dashboard (spec §4.2 Dashboard, §5.1 step 7).
 * Pure function so it is easy to test; the demo engine mirrors it in web/src/mocks/handlers/platform.js.
 *
 * Order: time-limited things first (an open project offer, a reassessment window), then the learning path
 * (submit → continue lesson → start assessment), then waiting states, then Explore courses.
 *
 * @param {object} p
 * @param {Array<{ courseId, courseTitle, nextLesson: {id,title}|null, lessonsLeft: number, hasAssessment: boolean }>} p.courses enrolled, most recent first
 * @param {Map<string, object>} p.attemptByCourse latest AssessmentAttempt per courseId
 * @param {Array<{ id, title, expiresAt }>} p.openOffers OFFERED and not expired, soonest expiry first
 * @param {Array<{ id, courseId, courseTitle }>} p.pendingOrders
 * @param {number} p.activeVerifications
 */
export function nextActionFor({ courses, attemptByCourse, openOffers, pendingOrders, activeVerifications }) {
  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const title = (courseId) => courses.find((c) => c.courseId === courseId)?.courseTitle || "your course";
  const attempts = [...attemptByCourse.entries()].map(([courseId, a]) => ({ courseId, ...a }));
  const withStatus = (...s) => attempts.find((a) => s.includes(a.status));

  const offer = openOffers[0];
  if (offer) {
    return {
      kind: "VIEW_OFFER",
      title: "You have a project offer",
      body: `${offer.title}.${offer.expiresAt ? ` Reply by ${fmt(offer.expiresAt)}.` : ""}`,
      cta: "View project",
      to: `/app/projects/${offer.id}`,
    };
  }

  const reassess = withStatus("REASSESSMENT_REQUIRED");
  if (reassess) {
    return {
      kind: "REASSESS",
      title: "View feedback and reassess",
      body: `${title(reassess.courseId)}${reassess.totalScore != null ? `: ${reassess.totalScore}/100` : ""}.${reassess.reassessUntil ? ` Reassess by ${fmt(reassess.reassessUntil)}.` : ""}`,
      cta: "View feedback",
      to: `/app/assessments/${reassess.courseId}`,
    };
  }

  const passed = attempts.find((a) => a.status === "PASSED" && !a.onboarding?.submittedAt);
  if (passed) {
    return {
      kind: "VERIFY",
      title: "Get verified",
      body: `You passed ${title(passed.courseId)}. Complete your profile to verify the skill.`,
      cta: "Get verified",
      to: `/app/assessments/${passed.courseId}`,
    };
  }

  const draft = withStatus("IN_PROGRESS");
  if (draft) {
    return {
      kind: "SUBMIT_ASSESSMENT",
      title: "Submit your assessment",
      body: `Your ${title(draft.courseId)} assessment is started but not submitted.`,
      cta: "Submit",
      to: `/app/assessments/${draft.courseId}`,
    };
  }

  const order = pendingOrders[0];
  if (order) {
    return {
      kind: "PAYMENT",
      title: "Complete your payment",
      body: `${order.courseTitle} starts once payment is confirmed.`,
      cta: "View payment",
      to: "/app/payments",
    };
  }

  const learning = courses.find((c) => c.nextLesson && !attemptByCourse.get(c.courseId));
  if (learning) {
    return {
      kind: "CONTINUE_LESSON",
      title: "Finish your next lesson",
      body: `${learning.nextLesson.title} · ${learning.courseTitle}. ${learning.lessonsLeft} left.`,
      cta: "Start",
      to: `/app/courses/${learning.courseId}/learn/${learning.nextLesson.id}`,
    };
  }

  const ready = courses.find((c) => c.hasAssessment && !attemptByCourse.get(c.courseId));
  if (ready) {
    return {
      kind: "START_ASSESSMENT",
      title: "Start your final assessment",
      body: `You finished the lessons in ${ready.courseTitle}. Prove the skill to get verified.`,
      cta: "Start",
      to: `/app/assessments/${ready.courseId}`,
    };
  }

  const waiting = withStatus("SUBMITTED", "UNDER_REVIEW", "APPEAL_PENDING");
  if (waiting) {
    return {
      kind: "UNDER_REVIEW",
      title: waiting.status === "APPEAL_PENDING" ? "Your appeal is being reviewed" : "Your assessment is being reviewed",
      body: `${title(waiting.courseId)}. We'll notify you when the result is ready.`,
      cta: "View status",
      to: `/app/assessments/${waiting.courseId}`,
    };
  }

  const onboarded = attempts.find((a) => a.status === "PASSED");
  if (onboarded) {
    return {
      kind: "VERIFICATION_PENDING",
      title: "Verification in review",
      body: `We're checking your profile for ${title(onboarded.courseId)}.`,
      cta: "View skills",
      to: "/app/skills",
    };
  }

  if (activeVerifications > 0) {
    return {
      kind: "OPPORTUNITIES",
      title: "You're verified",
      body: "Keep your availability up to date to be considered when suitable client work is available.",
      cta: "View opportunities",
      to: "/app/opportunities",
    };
  }

  return {
    kind: "EXPLORE",
    title: "Choose your first skill",
    body: "Pick a course, learn through practical lessons and prove it in one final task.",
    cta: "Explore courses",
    to: "/app/catalog",
  };
}
