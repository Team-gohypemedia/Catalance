/**
 * Demo seed for assessment, rubrics and skill verification (spec §8). Collections:
 * rubrics, assessments, assessmentAttempts, skillVerifications. Shapes mirror the Prisma models (campus/api/prisma/schema.prisma).
 *
 * Every seeded course gets an Assessment. Rubrics come in five styles (design, code, marketing, media, business);
 * "design" has two versions so the demo shows that old results keep the version they were scored with.
 *
 * Skills: a course's badge is for `course.skillId` (catalogue, ./catalog.js). Courses without one fall back to a skill
 * mapped from their track (TRACK_SKILL), or a derived `sk_track_<slug>` skill named after the track.
 */
import { daysAgo, daysFromNow, hoursAgo } from "../utils";
import learning from "./learning";
import catalog from "./catalog";

/* ───────────────────────── skills ───────────────────────── */

/** Track → closest catalogue skill, used only while a course has no skillId of its own. */
export const TRACK_SKILL = {
  "web-development": "sk_frontend-development",
  "ui-ux-design": "sk_ui-ux-design",
  "data-analytics": "sk_basic-data-analytics",
  "ai-automation": "sk_ai-automation-no-code",
  "digital-marketing": "sk_social-media-management",
  "content-writing": "sk_content-writing-ugc",
  "graphic-design": "sk_professional-graphic-design",
  "video-editing": "sk_short-form-video-editing",
  "excel-for-aspirants": "sk_excel-google-sheets",
};

const catalogSkillIds = new Set((catalog.skills || []).map((s) => s.id));

/** The skill id a course verifies (course.skillId → track mapping → derived from the track). */
export function skillIdForCourse(course) {
  if (!course) return null;
  if (course.skillId) return course.skillId;
  const slug = course.track?.slug || String(course.trackId || "").replace(/^t_/, "");
  const mapped = TRACK_SKILL[slug];
  return mapped && catalogSkillIds.has(mapped) ? mapped : `sk_track_${slug}`;
}

/* ───────────────────────── rubrics ───────────────────────── */

const c = (id, label, weight, critical, guide, maxScore = 10) => ({ id, label, weight, maxScore, critical, guide });

const RUBRIC_DEFS = {
  design: {
    name: "Design project",
    versions: [
      [
        c("brief", "Meets the brief", 30, true, "Every required screen or asset is there and solves the stated problem."),
        c("craft", "Visual craft", 30, false, "Spacing, type, colour and hierarchy are consistent and intentional."),
        c("usability", "Usability", 20, false, "Flows are clear; labels, states and contrast work for real users."),
        c("handover", "Handover", 20, true, "Files are organised, named and shareable. A developer or client can use them as they are."),
      ],
      [
        c("brief", "Meets the brief", 25, true, "Every required screen or asset is there and solves the stated problem."),
        c("craft", "Visual craft", 25, false, "Spacing, type, colour and hierarchy are consistent and intentional."),
        c("usability", "Usability and accessibility", 20, false, "Flows are clear; labels, empty/error states and contrast (WCAG AA) work for real users."),
        c("rationale", "Design rationale", 15, false, "A short case-study note explains the problem, the choices and what you would test next."),
        c("handover", "Handover", 15, true, "Files are organised, named and shareable. A developer or client can use them as they are."),
      ],
    ],
  },
  code: {
    name: "Build project",
    versions: [
      [
        c("requirements", "Requirements met", 30, true, "Every feature in the brief works. Nothing core is missing or broken."),
        c("quality", "Code quality", 25, false, "Readable structure, sensible names, no copy-paste blocks, no secrets in the repo."),
        c("responsive", "Responsive and tested", 20, false, "Works on a 375px phone and desktop. Forms validate. No console errors."),
        c("docs", "README and decisions", 10, false, "A README says how to run it and why key choices were made."),
        c("deploy", "Live and handed over", 15, true, "A live link opens and the repo can be handed to a client."),
      ],
    ],
  },
  marketing: {
    name: "Marketing and content project",
    versions: [
      [
        c("strategy", "Fits the brief and audience", 30, true, "The plan or copy speaks to the stated audience and goal."),
        c("craft", "Copy and creative quality", 30, false, "Clear, specific, on-brand. Hooks and calls to action are strong."),
        c("measurement", "Measurement plan", 20, false, "Says what will be tracked, the target and how success is judged."),
        c("compliance", "Honest claims", 20, true, "No false or unprovable claims; ad and platform policies are respected."),
      ],
    ],
  },
  media: {
    name: "Video project",
    versions: [
      [
        c("brief", "Meets the brief", 25, true, "Length, format and message match the brief."),
        c("pacing", "Hook and pacing", 25, false, "Holds attention in the first two seconds; cuts are deliberate."),
        c("technical", "Technical quality", 30, true, "Clean audio, readable captions, correct export settings, no glitches."),
        c("delivery", "Delivery", 20, false, "Files are named, exported for each platform and shared with working links."),
      ],
    ],
  },
  business: {
    name: "Business workflow project",
    versions: [
      [
        c("accuracy", "Accuracy", 35, true, "Figures, entries or translations are correct. Errors would cost a client money or trust."),
        c("method", "Method", 25, false, "Uses the right tool features (formulas, vouchers, glossary) rather than manual work."),
        c("presentation", "Presentation", 20, false, "Clean layout, clear labels; a client can read it without help."),
        c("delivery", "Delivery and notes", 20, false, "Delivered in the requested format with a short note on assumptions."),
      ],
    ],
  },
};

const rubrics = [];
for (const [key, def] of Object.entries(RUBRIC_DEFS)) {
  def.versions.forEach((criteria, i) => {
    const latest = i === def.versions.length - 1;
    rubrics.push({
      id: `rb_${key}_v${i + 1}`,
      key,
      version: i + 1,
      name: def.name,
      criteria,
      status: latest ? "ACTIVE" : "ARCHIVED",
      createdById: "u_admin",
      createdAt: daysAgo(latest ? 20 : 120),
    });
  });
}
const latestRubric = (key) => rubrics.filter((r) => r.key === key).sort((a, b) => b.version - a.version)[0];

const TRACK_STYLE = {
  "web-development": "code",
  "app-development": "code",
  "ai-automation": "code",
  "ui-ux-design": "design",
  "graphic-design": "design",
  "digital-marketing": "marketing",
  "content-writing": "marketing",
  "video-editing": "media",
  "data-analytics": "business",
  "excel-for-aspirants": "business",
  "translation-hindi-english": "business",
  "accounting-tally-gst": "business",
};
const styleFor = (course) => TRACK_STYLE[course.track?.slug] || "business";

/* ───────────────────────── assessments ───────────────────────── */

const FORMATS = { design: ["link", "text", "file"], code: ["link", "text"], marketing: ["link", "text", "file"], media: ["link", "text"], business: ["link", "text", "file"] };

function briefFor(course, style) {
  const build = course.whatYouBuild?.[0] || `a client-ready project using ${course.title}`;
  const deliver = {
    design: "Share a view-only Figma (or PDF) link with every screen, plus a short case-study note.",
    code: "Share a live link and a public repository link. Add a README.",
    marketing: "Share a Google Doc or Slides link with the plan and the final copy or creatives.",
    media: "Share a Drive or YouTube (unlisted) link to the final export and the project file.",
    business: "Share a Google Drive link to the final file and a short note on your assumptions.",
  }[style];
  return [
    `**Client:** a small Indian business that needs ${build.charAt(0).toLowerCase()}${build.slice(1)}.`,
    "",
    "**Your task**",
    `- Plan the work in a few bullet points before you start.`,
    `- Build ${build.charAt(0).toLowerCase()}${build.slice(1)} to a standard you would hand to a paying client.`,
    `- Write a short note (150–300 words) on the choices you made and what you would do next.`,
    "",
    `**Deliver:** ${deliver}`,
  ].join("\n");
}

const assessments = learning.courses.map((course) => {
  const style = styleFor(course);
  return {
    id: `as_${course.slug}`,
    courseId: course.id,
    title: `${course.title}: final project`,
    brief: briefFor(course, style),
    instructions:
      "Work on your own. Save a draft any time. When you submit, your work is locked and goes to an evaluator, usually within 3 working days. You are scored with the rubric below.",
    allowedFormats: FORMATS[style],
    rubricId: latestRubric(style).id,
    passScore: 70,
    maxAttempts: 2,
    reassessWindowDays: 14,
    dueDays: null,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(20),
  };
});
const assessmentFor = (course) => assessments.find((a) => a.courseId === course.id);

/* ───────────────────────── attempts ───────────────────────── */

const courseBySlug = Object.fromEntries(learning.courses.map((x) => [x.slug, x]));
const rubricById = Object.fromEntries(rubrics.map((r) => [r.id, r]));

/** Scores from per-criterion ratios (0..1), and the total with the API's formula. */
function scored(rubric, ratios, notes = {}) {
  const totalWeight = rubric.criteria.reduce((s, x) => s + x.weight, 0);
  const scores = rubric.criteria.map((x, i) => ({ criterionId: x.id, score: Math.round((ratios[i] ?? 0.8) * x.maxScore), note: notes[x.id] || "" }));
  const total = Math.round((rubric.criteria.reduce((s, x, i) => s + x.weight * (scores[i].score / x.maxScore), 0) / totalWeight) * 100);
  return { scores, totalScore: total };
}

const attempts = [];
const verifications = [];
let n = 0;

function addAttempt(userId, course, { status, attemptNo = 1, rubricId, ratios, notes, feedback, evaluatorNotes, evaluatorId = "u_evaluator", submittedDaysAgo = 6, reviewedDaysAgo = null, reassessUntil = null, onboarding = null, appealReason = null, text, links }) {
  n += 1;
  const a = assessmentFor(course);
  const rubric = rubricById[rubricId || a.rubricId];
  const reviewed = ["PASSED", "REASSESSMENT_REQUIRED", "FAILED", "APPEAL_PENDING", "VERIFIED"].includes(status);
  const result = reviewed ? scored(rubric, ratios || [], notes) : { scores: [], totalScore: null };
  const submittedAt = daysAgo(submittedDaysAgo);
  const reviewedAt = reviewed ? daysAgo(reviewedDaysAgo ?? Math.max(0, submittedDaysAgo - 2)) : null;
  const history = [{ status: "IN_PROGRESS", at: daysAgo(submittedDaysAgo + 3), by: userId, note: attemptNo > 1 ? "Reassessment started" : null }];
  if (status !== "IN_PROGRESS") history.push({ status: "SUBMITTED", at: submittedAt, by: userId, note: "Version 1" });
  if (status !== "IN_PROGRESS" && status !== "SUBMITTED") history.push({ status: "UNDER_REVIEW", at: daysAgo(Math.max(0, submittedDaysAgo - 1)), by: evaluatorId, note: "Claimed" });
  const resultStatus = status === "APPEAL_PENDING" ? (attemptNo < a.maxAttempts ? "REASSESSMENT_REQUIRED" : "FAILED") : status === "VERIFIED" ? "PASSED" : status;
  if (reviewed) history.push({ status: resultStatus, at: reviewedAt, by: evaluatorId, note: `${result.totalScore}/100` });
  if (onboarding) history.push({ status: "PASSED", at: onboarding.submittedAt, by: userId, note: "Verification onboarding completed" });
  if (status === "APPEAL_PENDING") history.push({ status: "APPEAL_PENDING", at: hoursAgo(20), by: userId, note: `from ${resultStatus}` });
  if (status === "VERIFIED") history.push({ status: "VERIFIED", at: daysAgo(Math.max(0, (reviewedDaysAgo ?? 2) - 2)), by: "u_admin", note: null });
  const attempt = {
    id: `at_${n}`,
    assessmentId: a.id,
    courseId: course.id,
    userId,
    attemptNo,
    status,
    submission: {
      text: text ?? "Here is my final project. The link has everything. My notes on the approach and what I'd improve next are at the top of the file.",
      links: links ?? [`https://drive.google.com/file/d/campus-demo-final-${n}/view`],
      files: [],
    },
    version: status === "IN_PROGRESS" ? 0 : 1,
    submittedAt: status === "IN_PROGRESS" ? null : submittedAt,
    evaluatorId: status === "SUBMITTED" || status === "IN_PROGRESS" ? null : evaluatorId,
    rubricId: rubric.id,
    scores: result.scores,
    totalScore: result.totalScore,
    passed: reviewed ? resultStatus === "PASSED" : null,
    feedback: reviewed ? feedback : null,
    evaluatorNotes: reviewed ? evaluatorNotes || null : null,
    reviewedAt,
    reassessUntil,
    onboarding,
    appealReason,
    appealDecision: null,
    appealReviewerId: null,
    history,
    createdAt: daysAgo(submittedDaysAgo + 3),
    updatedAt: reviewedAt || submittedAt,
  };
  attempts.push(attempt);
  return attempt;
}

function addVerification(attempt, course, { code, status = "ACTIVE", awardedDaysAgo = 10, revokedReason = null }) {
  const rubric = rubricById[attempt.rubricId];
  const awardedAt = daysAgo(awardedDaysAgo);
  const history = [{ status: "ACTIVE", at: awardedAt, by: "u_admin", reason: "Approved" }];
  if (status === "REVOKED") history.push({ status: "REVOKED", at: daysAgo(Math.max(0, awardedDaysAgo - 5)), by: "u_admin", reason: revokedReason });
  verifications.push({
    id: `sv_${verifications.length + 1}`,
    userId: attempt.userId,
    skillId: skillIdForCourse(course),
    courseId: course.id,
    level: course.level,
    status,
    awardedAt,
    attemptId: attempt.id,
    rubricId: rubric.id,
    rubricVersion: rubric.version,
    evidence: [
      { label: "Assessment submission", url: attempt.submission.links[0] },
      { label: "Portfolio", url: attempt.onboarding?.portfolioUrl || attempt.submission.links[0] },
    ],
    expiresAt: null,
    approvedById: "u_admin",
    revokedReason,
    history,
    verifyCode: code,
    createdAt: awardedAt,
    updatedAt: awardedAt,
  });
}

const onboardingDone = (daysOld, portfolioUrl) => ({
  portfolioUrl,
  identityConfirmed: true,
  payoutReady: true,
  availabilityConfirmed: true,
  availabilityNote: "Weekday evenings and Saturdays, about 10 hours a week.",
  submittedAt: daysAgo(daysOld),
});

/* the demo student (u_student): one verified, one awaiting review, one reassessment */
const wf = courseBySlug["web-foundations"];
if (wf) {
  const at = addAttempt("u_student", wf, {
    status: "VERIFIED",
    ratios: [1, 0.8, 0.9, 0.9, 0.9],
    notes: { requirements: "All five sections work, including the contact form.", responsive: "Clean on 375px. One overflow on the pricing table, fixed in your notes." },
    feedback: "Client-ready work. The layout holds up on a phone and the README is clear. Next step: add a short case-study page so clients see your process.",
    submittedDaysAgo: 22,
    reviewedDaysAgo: 20,
    onboarding: onboardingDone(19, "https://aarav-dev.netlify.app"),
    links: ["https://aarav-dev.netlify.app/client-site", "https://github.com/aarav-dev/client-site"],
  });
  addVerification(at, wf, { code: "VS-AARV-WEB1", awardedDaysAgo: 18 });
}
const fig = courseBySlug["figma-ui-design"];
if (fig) {
  addAttempt("u_student", fig, {
    status: "SUBMITTED",
    submittedDaysAgo: 1,
    text: "Food-delivery app for a Pune cloud kitchen: 8 screens, components and a clickable prototype. Case-study note is the first page of the Figma file.",
    links: ["https://www.figma.com/file/campus-demo-aarav-kitchen"],
  });
}
const react = courseBySlug["react-for-freelancers"];
if (react) {
  addAttempt("u_student", react, {
    status: "REASSESSMENT_REQUIRED",
    ratios: [0.4, 0.7, 0.6, 0.5, 0.8],
    notes: {
      requirements: "Booking form doesn't save and the filter on the services page is missing. Both are in the brief.",
      quality: "Components are tidy. Move the API key out of the code into an env variable.",
      docs: "Add how to run it locally.",
    },
    feedback:
      "Good start and the live link works. Two required features are missing (booking form saving, services filter), so the critical criterion isn't met yet. Fix those two, move the API key to an env variable, and resubmit within the window.",
    submittedDaysAgo: 7,
    reviewedDaysAgo: 5,
    reassessUntil: daysFromNow(9),
    links: ["https://aarav-salon.vercel.app", "https://github.com/aarav-dev/salon-booking"],
  });
}

/* other students: approvals waiting, an appeal, the queue */
const completed = learning.enrollments.filter((e) => e.userId.startsWith("s_") && e.completedAt);
const pick = (i) => {
  const e = completed[i];
  return e ? { userId: e.userId, course: learning.courses.find((x) => x.id === e.courseId) } : null;
};
const used = new Set();
const take = (i) => {
  for (let k = i; k < completed.length; k++) {
    const p = pick(k);
    const key = `${p.userId}:${skillIdForCourse(p.course)}:${p.course.level}`;
    if (!used.has(p.userId) && !used.has(key)) {
      used.add(p.userId);
      used.add(key);
      return p;
    }
  }
  return null;
};

const GOOD = "Strong, client-ready work. The brief is fully covered and the delivery is clean. Next: add one line on results or impact to make it a portfolio piece.";
const plans = [
  (p) => addAttempt(p.userId, p.course, { status: "PASSED", ratios: [0.9, 0.8, 0.8, 0.9, 0.8], feedback: GOOD, submittedDaysAgo: 9, reviewedDaysAgo: 6, onboarding: onboardingDone(2, `https://portfolio.campus.dev/${p.userId}`) }),
  (p) => addAttempt(p.userId, p.course, { status: "PASSED", ratios: [0.8, 0.8, 0.7, 0.8, 0.9], feedback: GOOD, submittedDaysAgo: 6, reviewedDaysAgo: 3, onboarding: onboardingDone(1, `https://behance.net/campus-${p.userId}`) }),
  (p) => addAttempt(p.userId, p.course, { status: "PASSED", ratios: [0.8, 0.7, 0.8, 0.7, 0.8], feedback: GOOD, submittedDaysAgo: 4, reviewedDaysAgo: 1 }),
  (p) => {
    addAttempt(p.userId, p.course, {
      status: "REASSESSMENT_REQUIRED",
      ratios: [0.4, 0.6, 0.6, 0.5, 0.6],
      feedback: "The core deliverable is incomplete. Cover every item in the brief and resubmit.",
      submittedDaysAgo: 30,
      reviewedDaysAgo: 28,
      reassessUntil: daysAgo(14),
    });
    return addAttempt(p.userId, p.course, {
      status: "APPEAL_PENDING",
      attemptNo: 2,
      ratios: [0.6, 0.7, 0.7, 0.6, 0.7],
      notes: { brief: "Two of the required items are still thin." },
      feedback: "Better, and closer to a pass. The brief still isn't fully covered, so the critical criterion is not met. This was the last attempt.",
      evaluatorNotes: "Borderline. Happy for a second reviewer to look.",
      submittedDaysAgo: 8,
      reviewedDaysAgo: 3,
      appealReason: "I covered every item in the brief. The second deliverable is on page 4 of the PDF, which I think was missed. Please have someone else review it.",
    });
  },
  (p) => addAttempt(p.userId, p.course, { status: "SUBMITTED", submittedDaysAgo: 2 }),
  (p) => addAttempt(p.userId, p.course, { status: "UNDER_REVIEW", submittedDaysAgo: 3 }),
  (p) => {
    const at = addAttempt(p.userId, p.course, { status: "VERIFIED", ratios: [0.9, 0.9, 0.8, 0.8, 0.9], feedback: GOOD, submittedDaysAgo: 40, reviewedDaysAgo: 38, onboarding: onboardingDone(37, `https://portfolio.campus.dev/${p.userId}`) });
    addVerification(at, p.course, { code: `VS-DEMO-${String(verifications.length + 1).padStart(4, "0")}`, awardedDaysAgo: 35 });
  },
  (p) => {
    const at = addAttempt(p.userId, p.course, { status: "VERIFIED", ratios: [0.8, 0.8, 0.8, 0.8, 0.8], feedback: GOOD, submittedDaysAgo: 60, reviewedDaysAgo: 58, onboarding: onboardingDone(57, `https://portfolio.campus.dev/${p.userId}`) });
    addVerification(at, p.course, { code: `VS-DEMO-${String(verifications.length + 1).padStart(4, "0")}`, awardedDaysAgo: 55, status: "REVOKED", revokedReason: "Portfolio link included work that wasn't the student's own." });
  },
];
plans.forEach((plan, i) => {
  const p = take(i * 2);
  if (p) plan(p);
});

// a submission in a course taught by the demo mentor (u_mentor), so the mentor's queue isn't empty
const mentorCourse = learning.courses.find((x) => x.mentorId === "u_mentor" && learning.enrollments.some((e) => e.courseId === x.id && e.userId.startsWith("s_") && !used.has(e.userId)));
if (mentorCourse) {
  const e = learning.enrollments.find((x) => x.courseId === mentorCourse.id && x.userId.startsWith("s_") && !used.has(x.userId));
  used.add(e.userId);
  addAttempt(e.userId, mentorCourse, { status: "SUBMITTED", submittedDaysAgo: 1, text: "Redesign of a local gym's booking app: 6 screens and a prototype. Notes on the first page." });
}

export default { rubrics, assessments, assessmentAttempts: attempts, skillVerifications: verifications };
