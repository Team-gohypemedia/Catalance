/** Demo-engine handlers for the "learning" domain. See campus/API_CONTRACT.md. */
import { httpError, requireUser, publicUser, now, uid } from "../utils";
import { awardPoints, notify, POINTS } from "../points";
import { DIVISIONS } from "@/lib/utils";
import { tutorReply } from "./learning-tutor";
import { courseCatalogFields, isListedCourse, matchesCatalogFilters, registerCourseCards } from "./catalog";
import * as paymentRules from "./payments";

/* ───────────────────────── serializers ───────────────────────── */
const ENROLLMENT_FIELDS = ["id", "userId", "courseId", "progressPercent", "completedLessonIds", "lastLessonId", "startedAt", "completedAt"];
export const toEnrollment = (e) => (e ? Object.fromEntries(ENROLLMENT_FIELDS.map((k) => [k, e[k] ?? null])) : null);

const flatLessons = (course) => (course?.modules || []).flatMap((m) => m.lessons || []);

const lessonSummary = (l, completedSet) => {
  const out = { id: l.id, title: l.title, type: l.type, durationMinutes: l.durationMinutes, order: l.order, isPreview: Boolean(l.isPreview) };
  if (completedSet) out.completed = completedSet.has(l.id);
  return out;
};

const findEnrollment = (db, userId, courseId) => (userId ? db.find("enrollments", (e) => e.userId === userId && e.courseId === courseId) : null);

function mentorRef(db, course) {
  const m = db.findById("users", course.mentorId);
  return m ? { id: m.id, name: m.name, avatarUrl: m.avatarUrl, headline: m.headline } : course.mentor ?? null;
}

/** Course card (no modules). */
function toCourse(db, course, user) {
  // eslint-disable-next-line no-unused-vars
  const { modules, ...rest } = course;
  const lessons = flatLessons(course);
  return {
    ...rest,
    ...courseCatalogFields(db, course),
    mentor: mentorRef(db, course),
    lessonsCount: lessons.length || course.lessonsCount || 0,
    durationMinutes: lessons.reduce((s, l) => s + (l.durationMinutes || 0), 0) || course.durationMinutes || 0,
    payLater: course.payLater ?? true,
    isFree: (course.priceINR || 0) === 0,
    enrollment: user ? toEnrollment(findEnrollment(db, user.id, course.id)) : null,
  };
}

/** Course with modules of LessonSummary (+completed flags) and enrollment. */
function toCourseDetail(db, course, user) {
  const base = toCourse(db, course, user);
  const enr = user ? findEnrollment(db, user.id, course.id) : null;
  const done = enr ? new Set(enr.completedLessonIds) : null;
  return {
    ...base,
    modules: (course.modules || [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((m) => ({ id: m.id, title: m.title, order: m.order, lessons: (m.lessons || []).map((l) => lessonSummary(l, done)) })),
  };
}

// public lists hide DRAFT and ARCHIVED courses (spec §6.2)
const publishedCourses = (db) => db.all("courses").filter(isListedCourse);
registerCourseCards((db, user, fn) => publishedCourses(db).filter(fn).map((c) => toCourse(db, c, user)));

function findCourse(db, idOrSlug) {
  return db.findById("courses", idOrSlug) || db.find("courses", (c) => c.slug === idOrSlug);
}

function findLesson(db, lessonId) {
  for (const course of db.all("courses")) {
    for (const m of course.modules || []) {
      const lesson = (m.lessons || []).find((l) => l.id === lessonId);
      if (lesson) return { course, module: m, lesson };
    }
  }
  return null;
}

function toTrack(track, db) {
  const courses = publishedCourses(db).filter((c) => c.trackId === track.id);
  return {
    ...track,
    coursesCount: courses.length,
    studentsCount: courses.reduce((s, c) => s + (c.studentsCount || 0), 0) || track.studentsCount || 0,
    courseIds: courses.map((c) => c.id),
  };
}

function nextLessonFor(course, enr) {
  const lessons = flatLessons(course);
  const done = new Set(enr?.completedLessonIds || []);
  const next = lessons.find((l) => !done.has(l.id)) || lessons.find((l) => l.id === enr?.lastLessonId) || lessons[0];
  return next ? lessonSummary(next, done) : null;
}

function makeVerifyCode(db) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    code = `CMP-${part()}-${part()}`;
  } while (db.find("certificates", (c) => c.verifyCode === code));
  return code;
}

function withSubmissionUser(db, s) {
  const u = db.findById("users", s.userId);
  return { ...s, user: publicUser(u) };
}

const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

/* ───────────────────────── aspirant plan ───────────────────────── */
// exam subject → the private-sector skill it bridges to
const SKILLS_FROM_PREP = {
  Quant: ["Excel formulas & analysis", "excel-for-aspirants"],
  "Data Interpretation": ["Pivot tables & charts", "excel-for-aspirants"],
  Reasoning: ["Data analysis", "data-analytics"],
  English: ["Hindi↔English translation", "translation-hindi-english"],
  Hindi: ["Translation", "translation-hindi-english"],
  "Essay Writing": ["Content writing", "content-writing"],
  "GK & Current Affairs": ["Research & content", "content-writing"],
  Polity: ["Policy research writing", "content-writing"],
  Economy: ["Policy research writing", "content-writing"],
  "Banking Awareness": ["Accounting & Tally", "accounting-tally-gst"],
  Accounts: ["Tally & GST", "accounting-tally-gst"],
};

function buildAspirantPlan(db, me, myEnrollments, weeklyActivity) {
  const a = me.aspirant;
  if (!a) return null;
  const strengths = a.strengths || [];
  const interests = new Set(me.interests || []);
  const overlap = (t) => (t.bridgeFrom || []).filter((s) => strengths.includes(s)).length;
  const bridge = db
    .filter("tracks", (t) => t.forAspirants)
    .sort((x, y) => overlap(y) - overlap(x) || Number(interests.has(y.slug)) - Number(interests.has(x.slug)) || x.title.localeCompare(y.title));
  const bridgeIds = new Set(bridge.map((t) => t.id));

  let nextLesson = null;
  const recent = myEnrollments.find((e) => !e.completedAt && bridgeIds.has(db.findById("courses", e.courseId)?.trackId));
  let course = recent ? db.findById("courses", recent.courseId) : null;
  let lesson = course ? nextLessonFor(course, recent) : null;
  if (!lesson && bridge[0]) {
    const enrolled = new Set(myEnrollments.map((e) => e.courseId));
    course = publishedCourses(db)
      .filter((c) => c.trackId === bridge[0].id && !enrolled.has(c.id))
      .sort((x, y) => flatLessons(y).length - flatLessons(x).length)[0];
    const first = course ? flatLessons(course)[0] : null;
    lesson = first ? lessonSummary(first) : null;
  }
  if (course && lesson) nextLesson = { courseId: course.id, courseTitle: course.title, lessonId: lesson.id, lessonTitle: lesson.title, durationMinutes: lesson.durationMinutes };

  return {
    examName: a.examName,
    prepYears: a.prepYears,
    dailyMinutes: a.dailyMinutes,
    todayDoneMinutes: weeklyActivity[weeklyActivity.length - 1]?.minutes || 0,
    weekDoneMinutes: weeklyActivity.reduce((s, d) => s + (d.minutes || 0), 0),
    bridgeTracks: bridge.map((t) => toTrack(t, db)),
    nextLesson,
    skillsFromPrep: strengths.filter((s) => SKILLS_FROM_PREP[s]).map((subject) => ({ subject, skill: SKILLS_FROM_PREP[subject][0], trackSlug: SKILLS_FROM_PREP[subject][1] })),
  };
}

/* ───────────────────────── handlers ───────────────────────── */
export default {
  /* Public / marketing */
  "GET /api/public/stats": ({ db }) => {
    const users = db.all("users");
    const colleges = db.all("colleges");
    const apps = db.all("gigApplications");
    const scaledStudents = colleges.reduce((s, c) => s + (c.studentsCount || 0), 0);
    const paidOut = users.reduce((s, u) => s + (u.lifetimeEarnedINR || 0), 0);
    return {
      students: Math.max(scaledStudents, users.filter((u) => u.role === "STUDENT").length),
      colleges: colleges.length,
      mentors: users.filter((u) => u.role === "MENTOR").length,
      paidOutINR: paidOut,
      gigsCompleted: Math.max(apps.filter((a) => a.status === "APPROVED" || a.status === "PAID").length, Math.round(paidOut / 900)),
      avgFirstEarningDays: 38,
    };
  },

  "GET /api/tracks": ({ query, db }) =>
    db
      .all("tracks")
      .filter((t) => !query.category || t.category === query.category)
      .filter((t) => query.audience !== "aspirants" || t.forAspirants)
      .map((t) => toTrack(t, db)),

  "GET /api/tracks/:slug": ({ params, db, user }) => {
    const track = db.find("tracks", (t) => t.slug === params.slug || t.id === params.slug);
    if (!track) throw httpError(404, "Track not found.");
    const courses = publishedCourses(db)
      .filter((c) => c.trackId === track.id)
      .map((c) => toCourse(db, c, user));
    return { ...toTrack(track, db), courses };
  },

  /* Learning */
  "GET /api/courses": ({ query, db, user }) => {
    const track = query.track ? db.find("tracks", (t) => t.slug === query.track || t.id === query.track) : null;
    const q = (query.q || "").toLowerCase().trim();
    let list = publishedCourses(db).filter((c) => {
      if (query.track && (!track || c.trackId !== track.id)) return false;
      if (query.level && c.level !== query.level) return false;
      if (query.language && !(c.languages || []).includes(query.language)) return false;
      if (!matchesCatalogFilters(db, c, query)) return false;
      if (q) {
        const mentor = db.findById("users", c.mentorId);
        const skill = db.findById("skills", c.skillId);
        const hay = [c.title, c.subtitle, c.description, c.outcome, c.track?.title, skill?.name, mentor?.name, ...(c.skills || [])].join(" ").toLowerCase();
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    const sort = query.sort || "popular";
    if (sort === "rating") list = list.sort((a, b) => b.rating - a.rating || b.ratingsCount - a.ratingsCount);
    else if (sort === "new") list = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sort === "price") list = list.sort((a, b) => (a.priceINR || 0) - (b.priceINR || 0));
    else list = list.sort((a, b) => b.studentsCount - a.studentsCount);
    return list.map((c) => toCourse(db, c, user));
  },

  "GET /api/courses/:id": ({ params, db, user }) => {
    const course = findCourse(db, params.id);
    if (!course) throw httpError(404, "Course not found.");
    // hidden courses (DRAFT / ARCHIVED): staff only; enrolled students keep an archived course they joined
    const isStaff = user && (user.role === "ADMIN" || user.id === course.mentorId);
    const enrolled = user && findEnrollment(db, user.id, course.id);
    if (!isListedCourse(course) && !isStaff && !(enrolled && course.status === "ARCHIVED")) throw httpError(404, "Course not found.");
    return toCourseDetail(db, course, user);
  },

  "POST /api/courses/:id/enroll": ({ params, db, user }) => {
    requireUser(user);
    const course = findCourse(db, params.id);
    if (!course) throw httpError(404, "Course not found.");
    const existing = findEnrollment(db, user.id, course.id);
    if (existing) return toEnrollment(existing);
    // B (payments) rules, same as the API: paid courses need a PAID order (100% advance); course must be open.
    const paid = course.priceINR ? paymentRules.findPaidOrder(db, user.id, course.id) : null;
    if (!paid) paymentRules.assertCanEnrol(db, course);
    if (course.priceINR && !paid) throw httpError(402, "This course needs payment before you can start. Choose Enrol to see the price and pay.");
    const { enrollment: e } = paymentRules.ensureEnrollment(db, course, user.id);
    notify(db, user.id, {
      type: "COURSE",
      title: `You're enrolled in ${course.title}`,
      body: paid ? "Your course is unlocked. Start with the first lesson." : "This course is free. Start with the first lesson.",
      link: `/app/courses/${course.id}`,
    });
    return toEnrollment(e);
  },

  "GET /api/me/enrollments": ({ db, user }) => {
    requireUser(user);
    return db
      .filter("enrollments", (e) => e.userId === user.id)
      .sort((a, b) => new Date(b.updatedAt || b.startedAt) - new Date(a.updatedAt || a.startedAt))
      .map((e) => {
        const course = db.findById("courses", e.courseId);
        return course ? { ...toEnrollment(e), course: toCourse(db, course, user) } : null;
      })
      .filter(Boolean);
  },

  "GET /api/lessons/:id": ({ params, db, user }) => {
    requireUser(user);
    const found = findLesson(db, params.id);
    if (!found) throw httpError(404, "Lesson not found.");
    const { course, lesson } = found;
    const enr = findEnrollment(db, user.id, course.id);
    const isStaff = user.role === "ADMIN" || user.id === course.mentorId;
    if (!enr && !lesson.isPreview && !isStaff) throw httpError(403, "Enrol in this course to unlock this lesson.");
    const all = flatLessons(course);
    const i = all.findIndex((l) => l.id === lesson.id);
    if (enr && enr.lastLessonId !== lesson.id) db.update("enrollments", enr.id, { lastLessonId: lesson.id, updatedAt: now() });
    return {
      ...lesson,
      courseId: course.id,
      moduleId: found.module.id,
      isPreview: Boolean(lesson.isPreview),
      videoUrl: lesson.videoUrl ?? null,
      quiz: lesson.quiz ?? null,
      assignment: lesson.assignment ?? null,
      completed: enr ? enr.completedLessonIds.includes(lesson.id) : false,
      prevLessonId: all[i - 1]?.id ?? null,
      nextLessonId: all[i + 1]?.id ?? null,
    };
  },

  "POST /api/lessons/:id/complete": ({ params, db, user }) => {
    requireUser(user);
    const found = findLesson(db, params.id);
    if (!found) throw httpError(404, "Lesson not found.");
    const { course, lesson } = found;
    const enr = findEnrollment(db, user.id, course.id);
    if (!enr) throw httpError(403, "Enroll in this course first.");
    const existingCert = () => db.find("certificates", (c) => c.userId === user.id && c.courseId === course.id);
    if (enr.completedLessonIds.includes(lesson.id)) {
      return { enrollment: toEnrollment(enr), pointsAwarded: 0, certificate: existingCert() };
    }
    const all = flatLessons(course);
    const ids = new Set([...enr.completedLessonIds, lesson.id]);
    const completedLessonIds = all.filter((l) => ids.has(l.id)).map((l) => l.id);
    const progressPercent = Math.round((completedLessonIds.length / Math.max(1, all.length)) * 100);
    const finished = completedLessonIds.length >= all.length;
    let updated = db.update("enrollments", enr.id, {
      completedLessonIds,
      progressPercent,
      lastLessonId: lesson.id,
      updatedAt: now(),
      completedAt: finished ? enr.completedAt || now() : enr.completedAt,
    });
    let pointsAwarded = POINTS.LESSON;
    awardPoints(db, user.id, POINTS.LESSON, "LESSON", `Completed “${lesson.title}”`);

    let certificate = null;
    if (finished && !enr.completedAt) {
      pointsAwarded += POINTS.COURSE_COMPLETE;
      awardPoints(db, user.id, POINTS.COURSE_COMPLETE, "BONUS", `Finished ${course.title}`);
      certificate = existingCert();
      if (!certificate) {
        const track = db.findById("tracks", course.trackId);
        // Completion certificate only (spec §8): score = the passed assessment total, or null. Never a skill verification.
        const passedAttempt = db
          .filter("assessmentAttempts", (a) => a.userId === user.id && a.courseId === course.id && ["PASSED", "VERIFIED"].includes(a.status) && a.totalScore != null)
          .sort((a, b) => new Date(b.reviewedAt || 0) - new Date(a.reviewedAt || 0))[0];
        const score = passedAttempt?.totalScore ?? null;
        certificate = db.insert("certificates", {
          id: uid("cert"),
          userId: user.id,
          courseId: course.id,
          courseTitle: course.title,
          trackTitle: track?.title || course.track?.title || "",
          mentorName: mentorRef(db, course)?.name || "",
          score,
          verifyCode: makeVerifyCode(db),
          issuedAt: now(),
        });
      }
      notify(db, user.id, {
        type: "COURSE",
        title: `Course complete: ${course.title}`,
        body: `Your course certificate (${certificate.verifyCode}) is ready. Next: take the final assessment to get your skill verified.`,
        link: `/app/assessments/${course.id}`,
      });
      updated = db.findById("enrollments", enr.id);
    }
    return { enrollment: toEnrollment(updated), pointsAwarded, certificate };
  },

  "POST /api/lessons/:id/quiz": ({ params, body, db, user }) => {
    requireUser(user);
    const found = findLesson(db, params.id);
    if (!found) throw httpError(404, "Lesson not found.");
    const { course, lesson } = found;
    if (lesson.type !== "QUIZ" || !lesson.quiz) throw httpError(400, "This lesson is not a quiz.");
    const enr = findEnrollment(db, user.id, course.id);
    if (!enr && !lesson.isPreview) throw httpError(403, "Enroll in this course first.");
    const answers = body.answers || {};
    const results = lesson.quiz.questions.map((q) => ({ questionId: q.id, correct: answers[q.id] === q.correctOptionId, correctOptionId: q.correctOptionId }));
    const score = results.filter((r) => r.correct).length;
    const total = results.length;
    const passed = total > 0 && score / total >= 0.6;
    let pointsAwarded = 0;
    if (passed && enr && !(enr.passedQuizIds || []).includes(lesson.id)) {
      pointsAwarded = POINTS.QUIZ_PASS + (score === total ? POINTS.QUIZ_PERFECT_BONUS : 0);
      awardPoints(db, user.id, pointsAwarded, "QUIZ", `${score}/${total} on “${lesson.title}”`);
      db.update("enrollments", enr.id, (e) => ({ passedQuizIds: [...(e.passedQuizIds || []), lesson.id], updatedAt: now() }));
    }
    return { score, total, passed, results, pointsAwarded };
  },

  "POST /api/lessons/:id/submit": ({ params, body, db, user }) => {
    requireUser(user);
    const found = findLesson(db, params.id);
    if (!found) throw httpError(404, "Lesson not found.");
    const { course, lesson } = found;
    if (lesson.type !== "ASSIGNMENT") throw httpError(400, "This lesson is not an assignment.");
    const enr = findEnrollment(db, user.id, course.id);
    if (!enr) throw httpError(403, "Enroll in this course first.");
    const text = body.text?.trim() || null;
    const link = body.link?.trim() || null;
    if (!text && !link) throw httpError(400, "Add a link or a short note to submit.");
    if (link && !/^https?:\/\/\S+\.\S+/.test(link)) throw httpError(400, "That link doesn't look right. It should start with https://");
    const first = !db.find("submissions", (s) => s.userId === user.id && s.lessonId === lesson.id);
    const sub = db.insert("submissions", {
      id: uid("sub"),
      userId: user.id,
      courseId: course.id,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      text,
      link,
      status: "SUBMITTED",
      score: null,
      maxScore: (lesson.assignment?.rubric || []).reduce((s, r) => s + (r.points || 0), 0) || 100,
      feedback: null,
      reviewedById: null,
      reviewedAt: null,
    });
    if (first) awardPoints(db, user.id, POINTS.ASSIGNMENT_SUBMIT, "ASSIGNMENT", `Submitted “${lesson.title}”`);
    if (course.mentorId) {
      notify(db, course.mentorId, { type: "MENTOR", title: `New submission: ${lesson.title}`, body: `${user.name} submitted work in ${course.title}.`, link: "/app/mentor" });
    }
    return withSubmissionUser(db, sub);
  },

  "GET /api/me/submissions": ({ db, user }) => {
    requireUser(user);
    return db
      .filter("submissions", (s) => s.userId === user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((s) => withSubmissionUser(db, s));
  },

  "GET /api/me/certificates": ({ db, user }) => {
    requireUser(user);
    return db.filter("certificates", (c) => c.userId === user.id).sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
  },

  "GET /api/certificates/verify/:code": ({ params, db }) => {
    const code = params.code.trim().toUpperCase();
    const cert = db.find("certificates", (c) => c.verifyCode.toUpperCase() === code);
    if (!cert) throw httpError(404, "No certificate matches this code. Check it and try again.");
    const u = db.findById("users", cert.userId);
    return { ...cert, userName: u?.name || "Campus learner" };
  },

  "GET /api/me/dashboard": ({ db, user }) => {
    requireUser(user);
    const me = db.findById("users", user.id) || user;
    const myEnrollments = db
      .filter("enrollments", (e) => e.userId === me.id)
      .sort((a, b) => new Date(b.updatedAt || b.startedAt) - new Date(a.updatedAt || a.startedAt));

    const continueLearning = myEnrollments
      .filter((e) => !e.completedAt)
      .map((e) => {
        const course = db.findById("courses", e.courseId);
        if (!course) return null;
        return { ...toEnrollment(e), course: toCourse(db, course, me), nextLesson: nextLessonFor(course, e) };
      })
      .filter(Boolean);

    // weekly activity: points from pointsEvents + minutes estimated from activity
    const events = db.filter("pointsEvents", (p) => p.userId === me.id);
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = dayKey(d);
      const dayEvents = events.filter((p) => p.createdAt && dayKey(p.createdAt) === key);
      const points = dayEvents.reduce((s, p) => s + Math.max(0, p.points || 0), 0);
      const lessonMinutes = dayEvents.filter((p) => p.source === "LESSON" || p.source === "QUIZ" || p.source === "ASSIGNMENT").length * 9;
      // steady baseline for active streaks so the demo has a believable week
      const seed = [...(me.id + key)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7);
      const baseline = i < (me.streak || 0) && i > 0 ? 12 + (seed % 34) : 0;
      const minutes = Math.min(180, lessonMinutes + baseline);
      weeklyActivity.push({ day: d.toLocaleDateString("en-IN", { weekday: "short" }), minutes, points: points || (baseline ? Math.round(baseline * 1.6) : 0) });
    }
    const today = weeklyActivity[weeklyActivity.length - 1];

    const enrolledIds = new Set(myEnrollments.map((e) => e.courseId));
    const interestTrackIds = new Set((me.interests || []).map((s) => `t_${s}`));
    const recommended = publishedCourses(db)
      .filter((c) => !enrolledIds.has(c.id))
      .sort((a, b) => Number(interestTrackIds.has(b.trackId)) - Number(interestTrackIds.has(a.trackId)) || b.studentsCount - a.studentsCount)
      .slice(0, 4)
      .map((c) => toCourse(db, c, me));

    const upcomingSessions = db
      .filter("bookings", (b) => b.userId === me.id && b.status === "UPCOMING")
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .slice(0, 3)
      .map((b) => {
        if (b.mentor) return b;
        const m = db.findById("users", b.mentorId);
        return { ...b, mentor: m ? { id: m.id, name: m.name, avatarUrl: m.avatarUrl, headline: m.headline } : null };
      });

    const mySkills = new Set((me.skills || []).map((s) => s.toLowerCase()));
    const openGigsForYou = db
      .filter("gigs", (g) => g.status === "OPEN")
      .map((g) => ({ g, match: (g.skills || []).filter((s) => mySkills.has(String(s).toLowerCase())).length }))
      .sort((a, b) => b.match - a.match || (a.g.minStage || 3) - (b.g.minStage || 3))
      .slice(0, 3)
      .map(({ g }) => {
        if (g.mentor || !g.mentorId) return g;
        const m = db.findById("users", g.mentorId);
        return { ...g, mentor: m ? { id: m.id, name: m.name, avatarUrl: m.avatarUrl } : null };
      });

    const students = db.filter("users", (u) => u.role === "STUDENT" && u.status !== "SUSPENDED");
    const pts = me.seasonPoints || 0;
    const position = 1 + students.filter((u) => u.id !== me.id && (u.seasonPoints || 0) > pts).length;
    const collegePosition = me.collegeId ? 1 + students.filter((u) => u.id !== me.id && u.collegeId === me.collegeId && (u.seasonPoints || 0) > pts).length : null;
    const division = me.division || "BRONZE";
    const order = Object.keys(DIVISIONS);
    const nextKey = order[order.indexOf(division) + 1];
    const nextDivisionAt = nextKey ? DIVISIONS[nextKey].min : null;

    return {
      user: publicUser(me),
      continueLearning,
      todayGoal: { targetMinutes: me.aspirant?.dailyMinutes || 30, doneMinutes: today?.minutes || 0 },
      weeklyActivity,
      recommended,
      upcomingSessions,
      openGigsForYou,
      rank: { position, collegePosition, division, seasonPoints: pts, nextDivisionAt },
      aspirantPlan: buildAspirantPlan(db, me, myEnrollments, weeklyActivity),
    };
  },

  "POST /api/tutor/chat": ({ body, db, user }) => {
    requireUser(user);
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const last = [...messages].reverse().find((m) => m.role === "user");
    if (!last?.content?.trim()) throw httpError(400, "Ask me something first.");
    let context = null;
    if (body.context?.lessonId) {
      const found = findLesson(db, body.context.lessonId);
      if (found) context = { lesson: found.lesson, course: found.course };
    } else if (body.context?.courseId) {
      const course = findCourse(db, body.context.courseId);
      if (course) context = { course };
    }
    return { reply: tutorReply({ message: last.content, history: messages, language: body.language || user.language || "en", context, user }) };
  },
};
