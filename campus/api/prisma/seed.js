/**
 * Seeds the Campus database from prisma/seed-data.json (exported from the web demo seeds by
 * scripts/export-demo-seed.mjs). Upserts every record, preserving demo ids, so it is safe to re-run.
 *
 *   npm run seed            # upsert
 *   npm run seed -- --reset # wipe all Campus tables first (dev only!)
 *   node prisma/seed.js --dry-run  # check the mapping offline (no DB needed)
 *
 * Robust to missing collections/fields: unknown keys are dropped, missing ones use schema defaults,
 * and a failing record is logged and skipped instead of aborting the run.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { PrismaClient, Prisma } from "@prisma/client";
import { cleanAspirant } from "../src/lib/aspirant.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.join(here, "seed-data.json");
const RESET = process.argv.includes("--reset");
const DRY = process.argv.includes("--dry-run"); // validate the mapping without touching a database
const CONCURRENCY = 8;

const prisma = new PrismaClient();

/* ───────────── generic field mapping from the Prisma schema ───────────── */

const MODELS = Object.fromEntries(Prisma.dmmf.datamodel.models.map((m) => [m.name, m]));
const delegateOf = (model) => prisma[model.charAt(0).toLowerCase() + model.slice(1)];

function coerce(field, value) {
  if (value === undefined) return undefined;
  if (value === null) return field.isRequired || field.type === "Json" ? undefined : null;
  if (field.isList) return Array.isArray(value) ? value.filter((v) => v !== null && v !== undefined) : undefined;
  switch (field.type) {
    case "DateTime": {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    case "Int":
      return Number.isFinite(Number(value)) ? Math.round(Number(value)) : undefined;
    case "Float":
      return Number.isFinite(Number(value)) ? Number(value) : undefined;
    case "Boolean":
      return Boolean(value);
    case "String":
      return typeof value === "string" ? value : typeof value === "number" ? String(value) : undefined;
    case "Json":
      return value;
    default:
      if (field.kind === "enum") {
        const allowed = Prisma.dmmf.datamodel.enums.find((e) => e.name === field.type)?.values.map((v) => v.name) || [];
        return allowed.includes(value) ? value : undefined;
      }
      return value;
  }
}

/** Keep only scalar/enum columns of `model`, coerced to the right types. */
function pick(model, doc) {
  const out = {};
  for (const field of MODELS[model].fields) {
    if (field.kind !== "scalar" && field.kind !== "enum") continue;
    if (field.isUpdatedAt) continue;
    const v = coerce(field, doc[field.name]);
    if (v !== undefined) out[field.name] = v;
  }
  return out;
}

const stats = {};
async function upsertAll(model, docs, { where = (d) => ({ id: d.id }) } = {}) {
  const delegate = delegateOf(model);
  const s = (stats[model] ||= { ok: 0, failed: 0 });
  for (let i = 0; i < docs.length; i += CONCURRENCY) {
    await Promise.all(
      docs.slice(i, i + CONCURRENCY).map(async (data) => {
        if (DRY) {
          const missing = MODELS[model].fields
            .filter((f) => (f.kind === "scalar" || f.kind === "enum") && f.isRequired && !f.hasDefaultValue && !f.isUpdatedAt && data[f.name] === undefined)
            .map((f) => f.name);
          if (missing.length) {
            s.failed += 1;
            if (s.failed <= 3) console.warn(`  ! ${model} ${data.id ?? ""}: missing ${missing.join(", ")}`);
          } else s.ok += 1;
          return;
        }
        try {
          // eslint-disable-next-line no-unused-vars
          const { id, ...update } = data;
          await delegate.upsert({ where: where(data), create: data, update });
          s.ok += 1;
        } catch (err) {
          s.failed += 1;
          if (s.failed <= 3) console.warn(`  ! ${model} ${data.id ?? ""}: ${String(err.message).split("\n").filter(Boolean).slice(-1)[0]}`);
        }
      }),
    );
  }
}

/* ───────────── helpers ───────────── */

const list = (c, name) => (Array.isArray(c[name]) ? c[name] : []);
const withId = (docs) => docs.filter((d) => d && typeof d === "object" && d.id);
const localDate = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const hhmm = (d) => {
  const x = new Date(d);
  return `${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`;
};

const hashCache = new Map();
async function hashFor(plain) {
  const key = plain || "campus123";
  if (!hashCache.has(key)) hashCache.set(key, await bcrypt.hash(key, 10));
  return hashCache.get(key);
}

async function reset() {
  console.log("Resetting Campus tables…");
  const order = [
    // spec v1.0 tables first (they reference users, courses and skills)
    "AuditLog", "SupportTicket", "PlatformSetting", "WebhookEvent", "ProjectOffer", "ConsentRecord", "CourseOrder",
    "SkillVerification", "AssessmentAttempt", "Assessment", "Rubric",
    "TutorMessage", "Vote", "CohortPost", "CohortMember", "Cohort", "Booking", "Reply", "Thread", "Notification",
    "MentorReview", "Season", "UserBadge", "PortfolioItem", "PointsEvent", "WalletTxn", "GigApplication", "Gig",
    "Certificate", "Submission", "QuizAttempt", "LessonCompletion", "Enrollment", "Lesson", "CourseModule", "Course",
    "Skill", "Category", "Track", "User", "College",
  ];
  for (const model of order) await delegateOf(model).deleteMany({});
}

/* ───────────── main ───────────── */

async function main() {
  if (!fs.existsSync(SEED_FILE)) {
    throw new Error(`Missing ${SEED_FILE}. Run "node scripts/export-demo-seed.mjs" first.`);
  }
  const raw = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
  const c = raw.collections || raw;
  console.log(`Seeding from ${path.basename(SEED_FILE)}${raw.exportedAt ? ` (exported ${raw.exportedAt})` : ""}`);
  if (RESET && !DRY) await reset();

  // colleges
  await upsertAll("College", withId(list(c, "colleges")).map((d) => pick("College", d)));

  // users (demo passwords are hashed; the denormalized `college` block is derived from collegeId)
  // spec v1.0: the demo keeps availability in its own "projectAvailability" collection (keyed by userId);
  // the database stores it on User.availability (Json)
  const availabilityByUser = new Map(
    list(c, "projectAvailability")
      .filter((a) => a?.userId)
      // eslint-disable-next-line no-unused-vars
      .map(({ id, userId, ...rest }) => [userId, rest]),
  );
  const users = [];
  for (const u of withId(list(c, "users"))) {
    const availability = availabilityByUser.get(u.id) || (u.availability && typeof u.availability === "object" ? u.availability : undefined);
    users.push({
      ...pick("User", u),
      ...(availability ? { availability } : {}),
      // Aspirant mode profile: normalised like PATCH /api/me; anything else clears it
      aspirant: u.aspirant && typeof u.aspirant === "object" ? cleanAspirant(u.aspirant) : Prisma.DbNull,
      passwordHash: await hashFor(u.password),
    });
  }
  await upsertAll("User", users);
  const userIds = new Set(users.map((u) => u.id));

  await upsertAll("Season", withId(list(c, "seasons")).map((d) => pick("Season", d)));

  // tracks
  await upsertAll(
    "Track",
    withId(list(c, "tracks")).map((t, i) =>
      pick("Track", {
        order: i,
        ...t,
        careers: (Array.isArray(t.careers) ? t.careers : []).map((x) => (Array.isArray(x) ? { title: x[0], avgPayINR: x[1] } : x)),
        forAspirants: t.forAspirants === true,
        bridgeFrom: (Array.isArray(t.bridgeFrom) ? t.bridgeFrom : []).filter((x) => typeof x === "string" && x.trim()),
      }),
    ),
  );

  // spec v1.0 catalogue: categories → skills (courses reference skills)
  await upsertAll("Category", withId(list(c, "categories")).map((d) => pick("Category", d)));
  const skills = withId(list(c, "skills")).map((d) => pick("Skill", d));
  await upsertAll("Skill", skills);
  const skillIds = new Set(skills.map((sk) => sk.id));

  // courses with embedded modules[].lessons[]
  const courses = withId(list(c, "courses"));
  const modules = [];
  const lessons = [];
  const lessonById = new Map();
  for (const course of courses) {
    (Array.isArray(course.modules) ? course.modules : []).forEach((m, mi) => {
      if (!m?.id) return;
      modules.push(pick("CourseModule", { order: mi + 1, ...m, courseId: course.id }));
      (Array.isArray(m.lessons) ? m.lessons : []).forEach((l, li) => {
        if (!l?.id) return;
        const row = pick("Lesson", { order: li + 1, ...l, courseId: course.id, moduleId: m.id });
        lessons.push(row);
        lessonById.set(l.id, row);
      });
    });
  }
  await upsertAll(
    "Course",
    courses.map((course) => {
      const own = lessons.filter((l) => l.courseId === course.id);
      return pick("Course", {
        ...course,
        slug: course.slug || course.id,
        trackId: course.trackId || course.track?.id,
        mentorId: userIds.has(course.mentorId) ? course.mentorId : null,
        skillId: skillIds.has(course.skillId) ? course.skillId : null,
        lessonsCount: own.length || course.lessonsCount,
        durationMinutes: own.reduce((s, l) => s + (l.durationMinutes || 0), 0) || course.durationMinutes,
      });
    }),
  );
  await upsertAll("CourseModule", modules);
  await upsertAll("Lesson", lessons);

  // enrollments (+ one LessonCompletion per completed lesson, + QuizAttempt for passed quizzes)
  const enrollments = withId(list(c, "enrollments"));
  await upsertAll("Enrollment", enrollments.map((e) => pick("Enrollment", e)));
  const completions = [];
  const attempts = [];
  for (const e of enrollments) {
    const when = e.updatedAt || e.completedAt || e.startedAt || e.createdAt;
    for (const lessonId of e.completedLessonIds || []) {
      const l = lessonById.get(lessonId);
      if (!l) continue;
      completions.push({ id: `lc_${e.userId}_${lessonId}`, userId: e.userId, lessonId, courseId: e.courseId, minutes: l.durationMinutes || 0, createdAt: new Date(when || Date.now()) });
    }
    for (const lessonId of e.passedQuizIds || []) {
      const l = lessonById.get(lessonId);
      const total = l?.quiz?.questions?.length || 0;
      if (!l || !total) continue;
      attempts.push({ id: `qa_${e.userId}_${lessonId}`, userId: e.userId, lessonId, score: total, total, passed: true, createdAt: new Date(when || Date.now()) });
    }
  }
  await upsertAll("LessonCompletion", completions, { where: (d) => ({ userId_lessonId: { userId: d.userId, lessonId: d.lessonId } }) });
  await upsertAll("QuizAttempt", attempts);

  await upsertAll("Submission", withId(list(c, "submissions")).map((d) => pick("Submission", d)));
  await upsertAll("Certificate", withId(list(c, "certificates")).map((d) => pick("Certificate", d)));

  // earn
  await upsertAll("Gig", withId(list(c, "gigs")).map((d) => pick("Gig", { ...d, mentorId: userIds.has(d.mentorId) ? d.mentorId : null })));
  await upsertAll(
    "GigApplication",
    withId(list(c, "gigApplications")).map((a) =>
      pick("GigApplication", {
        ...a,
        approvedAt: a.approvedAt ?? (["APPROVED", "PAID"].includes(a.status) ? a.updatedAt || a.createdAt : null),
        paidAt: a.paidAt ?? (a.status === "PAID" ? a.updatedAt || a.createdAt : null),
      }),
    ),
  );
  await upsertAll("WalletTxn", withId(list(c, "walletTxns")).map((d) => pick("WalletTxn", d)));
  await upsertAll("PointsEvent", withId(list(c, "pointsEvents")).map((d) => pick("PointsEvent", d)));
  await upsertAll("PortfolioItem", withId(list(c, "portfolioItems")).map((d) => pick("PortfolioItem", d)));
  await upsertAll("UserBadge", withId(list(c, "userBadges")).map((d) => pick("UserBadge", d)));

  // community: threads + replies, upvoterIds → Vote rows
  const threads = withId(list(c, "threads"));
  const replies = withId(list(c, "replies"));
  const accepted = new Set(threads.map((t) => t.acceptedReplyId).filter(Boolean));
  const replyCount = new Map();
  replies.forEach((r) => replyCount.set(r.threadId, (replyCount.get(r.threadId) || 0) + 1));
  await upsertAll(
    "Thread",
    threads.map((t) => {
      const ids = Array.isArray(t.upvoterIds) ? t.upvoterIds : [];
      return pick("Thread", {
        ...t,
        trackId: t.trackId || null,
        upvotes: Math.max(t.upvotes || 0, ids.length),
        solved: Boolean(t.acceptedReplyId),
        repliesCount: replyCount.get(t.id) || 0,
        lastActivityAt: t.lastActivityAt || t.createdAt,
      });
    }),
  );
  await upsertAll(
    "Reply",
    replies.map((r) => pick("Reply", { ...r, upvotes: Math.max(r.upvotes || 0, (r.upvoterIds || []).length), isAccepted: accepted.has(r.id) })),
  );
  const votes = [];
  const addVotes = (targetType, doc) =>
    (Array.isArray(doc.upvoterIds) ? [...new Set(doc.upvoterIds)] : [])
      .filter((uid) => userIds.has(uid))
      .forEach((userId) => votes.push({ id: `v_${targetType[0]}_${doc.id}_${userId}`, userId, targetType, targetId: doc.id }));
  threads.forEach((t) => addVotes("THREAD", t));
  replies.forEach((r) => addVotes("REPLY", r));
  await upsertAll("Vote", votes, { where: (d) => ({ userId_targetType_targetId: { userId: d.userId, targetType: d.targetType, targetId: d.targetId } }) });

  // bookings: demo seeds store startsAt (ISO); derive date (YYYY-MM-DD) and time (HH:mm)
  await upsertAll(
    "Booking",
    withId(list(c, "bookings")).map((b) => {
      const start = b.startsAt || b.createdAt;
      return pick("Booking", {
        ...b,
        date: b.date || (start ? localDate(start) : localDate(Date.now())),
        time: b.time || (start ? hhmm(start) : "18:00"),
        topic: b.topic || "Mentor session",
      });
    }),
  );

  // cohorts: memberIds → CohortMember rows
  const cohorts = withId(list(c, "cohorts"));
  await upsertAll("Cohort", cohorts.map((d) => pick("Cohort", { ...d, leadMentorId: userIds.has(d.leadMentorId) ? d.leadMentorId : null })));
  const members = cohorts.flatMap((co) =>
    [...new Set(Array.isArray(co.memberIds) ? co.memberIds : [])]
      .filter((uid) => userIds.has(uid))
      .map((userId) => ({ id: `cm_${co.id}_${userId}`, cohortId: co.id, userId, joinedAt: new Date(co.createdAt || Date.now()) })),
  );
  await upsertAll("CohortMember", members, { where: (d) => ({ cohortId_userId: { cohortId: d.cohortId, userId: d.userId } }) });
  await upsertAll("CohortPost", withId(list(c, "cohortPosts")).map((d) => pick("CohortPost", d)));
  await upsertAll("Notification", withId(list(c, "notifications")).map((d) => pick("Notification", d)));
  await upsertAll("MentorReview", withId(list(c, "mentorReviews")).map((d) => pick("MentorReview", { ...d, userId: userIds.has(d.userId) ? d.userId : null })));

  /* ───────────── spec v1.0 ───────────── */
  const courseIds = new Set(courses.map((co) => co.id));
  const userOrNull = (id) => (userIds.has(id) ? id : null);

  // assessment & verification: rubrics → assessments → attempts → verifications
  const rubrics = withId(list(c, "rubrics")).map((d) => pick("Rubric", d));
  await upsertAll("Rubric", rubrics);
  const rubricIds = new Set(rubrics.map((r) => r.id));
  const rubricOrNull = (id) => (rubricIds.has(id) ? id : null);
  const assessments = withId(list(c, "assessments"))
    .filter((a) => courseIds.has(a.courseId) && rubricIds.has(a.rubricId))
    .map((d) => pick("Assessment", d));
  await upsertAll("Assessment", assessments);
  const assessmentIds = new Set(assessments.map((a) => a.id));
  const assessmentAttempts = withId(list(c, "assessmentAttempts"))
    .filter((a) => assessmentIds.has(a.assessmentId) && userIds.has(a.userId))
    .map((a) =>
      pick("AssessmentAttempt", {
        ...a,
        evaluatorId: userOrNull(a.evaluatorId),
        appealReviewerId: userOrNull(a.appealReviewerId),
        rubricId: rubricOrNull(a.rubricId),
      }),
    );
  await upsertAll("AssessmentAttempt", assessmentAttempts);
  const attemptIds = new Set(assessmentAttempts.map((a) => a.id));
  await upsertAll(
    "SkillVerification",
    withId(list(c, "skillVerifications"))
      .filter((v) => userIds.has(v.userId) && skillIds.has(v.skillId))
      .map((v) =>
        pick("SkillVerification", {
          ...v,
          courseId: courseIds.has(v.courseId) ? v.courseId : null,
          attemptId: attemptIds.has(v.attemptId) ? v.attemptId : null,
          rubricId: rubricOrNull(v.rubricId),
          approvedById: userOrNull(v.approvedById),
        }),
      ),
  );

  // payments & consent
  await upsertAll(
    "CourseOrder",
    withId(list(c, "courseOrders"))
      .filter((o) => userIds.has(o.userId) && courseIds.has(o.courseId))
      .map((o) => pick("CourseOrder", { ...o, verifiedById: userOrNull(o.verifiedById), refundedById: userOrNull(o.refundedById) })),
  );
  await upsertAll("ConsentRecord", withId(list(c, "consentRecords")).filter((r) => userIds.has(r.userId)).map((d) => pick("ConsentRecord", d)));

  // projects & PM
  await upsertAll(
    "ProjectOffer",
    withId(list(c, "projectOffers"))
      .filter((o) => userIds.has(o.studentId))
      .map((o) => pick("ProjectOffer", { ...o, pmId: userOrNull(o.pmId), skillId: skillIds.has(o.skillId) ? o.skillId : null })),
  );

  // platform & ops (settings rows are keyed by `key`; an empty list keeps DEFAULT_SETTINGS from lib/settings.js)
  await upsertAll(
    "PlatformSetting",
    list(c, "platformSettings").filter((d) => d?.key).map((d) => pick("PlatformSetting", d)),
    { where: (d) => ({ key: d.key }) },
  );
  await upsertAll(
    "SupportTicket",
    withId(list(c, "supportTickets")).filter((t) => userIds.has(t.userId)).map((t) => pick("SupportTicket", { ...t, ownerId: userOrNull(t.ownerId) })),
  );
  await upsertAll("AuditLog", withId(list(c, "auditLogs")).map((d) => pick("AuditLog", { ...d, actorId: userOrNull(d.actorId) })));

  console.log("\nDone:");
  for (const [model, s] of Object.entries(stats)) {
    console.log(`  ${model.padEnd(18)} ${String(s.ok).padStart(5)} ok${s.failed ? `  ${s.failed} failed` : ""}`);
  }
  console.log('\nDemo logins: student@campus.dev / mentor@campus.dev / admin@campus.dev / aspirant@campus.dev, password "campus123"');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => (DRY ? undefined : prisma.$disconnect()));
