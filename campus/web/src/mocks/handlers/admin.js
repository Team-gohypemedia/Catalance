/** Demo-engine handlers for the "admin" domain. See campus/API_CONTRACT.md → "Admin". */
import { httpError, requireRole, publicUser, uid, now, daysFromNow } from "../utils";
import { awardPoints, notify, POINTS } from "../points";
import { COURSE_LEVELS, COURSE_STATUSES, courseCatalogFields, demoAudit, levelDefaultsFor } from "./catalog";

const admin = (user) => requireRole(user, "ADMIN");

const PAY_LATER_PERCENT = 20;
const COVER_PALETTE = [
  ["#FF5A1F", "#6B4EFF"],
  ["#1F9BFF", "#12A150"],
  ["#6B4EFF", "#E5484D"],
  ["#D98E00", "#FF5A1F"],
  ["#3CC6C0", "#1F9BFF"],
  ["#E5484D", "#C2793F"],
  ["#12A150", "#C8F542"],
  ["#14121F", "#6B4EFF"],
];
const PATTERNS = ["dots", "grid", "waves", "rings"];
const LESSON_TYPES = ["VIDEO", "ARTICLE", "QUIZ", "ASSIGNMENT"];
const APP_STATUSES = ["APPLIED", "ACCEPTED", "SUBMITTED", "APPROVED", "REJECTED", "PAID"];

const ts = (v) => (v ? new Date(v).getTime() : 0);
const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : fallback);
const arr = (v) => (Array.isArray(v) ? v.filter((x) => x !== null && x !== undefined && x !== "") : []);
const slugify = (s = "") =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "course";

/* ───────── course helpers ───────── */

function trackRef(db, trackId) {
  const t = db.findById("tracks", trackId);
  return t ? { id: t.id, slug: t.slug, title: t.title, color: t.color } : null;
}

function mentorRef(db, mentorId) {
  const m = db.findById("users", mentorId);
  return m ? { id: m.id, name: m.name, avatarUrl: m.avatarUrl ?? null, headline: m.mentorProfile?.headline || m.headline || null } : null;
}

function normalizeLesson(l, i, courseId, moduleId) {
  const type = LESSON_TYPES.includes(l?.type) ? l.type : "ARTICLE";
  const id = l?.id || uid("les");
  const quiz =
    type === "QUIZ"
      ? {
          questions: arr(l?.quiz?.questions).map((q) => {
            const options = arr(q.options).map((o) => ({ id: o.id || uid("opt"), text: String(o.text ?? "") }));
            return {
              id: q.id || uid("q"),
              prompt: String(q.prompt ?? ""),
              options,
              correctOptionId: options.some((o) => o.id === q.correctOptionId) ? q.correctOptionId : options[0]?.id ?? null,
              explanation: String(q.explanation ?? ""),
            };
          }),
        }
      : null;
  const assignment =
    type === "ASSIGNMENT"
      ? {
          brief: String(l?.assignment?.brief ?? ""),
          rubric: arr(l?.assignment?.rubric).map((r) => ({ criterion: String(r.criterion ?? ""), points: num(r.points) })),
          submissionType: l?.assignment?.submissionType === "TEXT" ? "TEXT" : "LINK",
        }
      : null;
  return {
    ...l,
    id,
    courseId,
    moduleId,
    title: String(l?.title || "Untitled lesson"),
    type,
    durationMinutes: Math.max(0, num(l?.durationMinutes, 5)),
    order: i + 1,
    isPreview: !!l?.isPreview,
    content: String(l?.content ?? ""),
    videoUrl: l?.videoUrl || null,
    quiz,
    assignment,
  };
}

function normalizeModules(modules, courseId) {
  return arr(modules).map((m, i) => {
    const moduleId = m.id || uid("mod");
    return {
      ...m,
      id: moduleId,
      title: String(m.title || `Module ${i + 1}`),
      order: i + 1,
      lessons: arr(m.lessons).map((l, j) => normalizeLesson(l, j, courseId, moduleId)),
    };
  });
}

function recompute(course, db) {
  const lessons = (course.modules || []).flatMap((m) => m.lessons || []);
  const priceINR = Math.max(0, num(course.priceINR));
  return {
    ...course,
    track: trackRef(db, course.trackId) || course.track || null,
    mentor: mentorRef(db, course.mentorId) || course.mentor || null,
    lessonsCount: lessons.length,
    durationMinutes: lessons.reduce((s, l) => s + (Number(l.durationMinutes) || 0), 0),
    priceINR,
    isFree: priceINR === 0,
    ...courseCatalogFields(db, { ...course, priceINR }),
  };
}

/** Keep Track.courseIds / coursesCount in sync when a course moves or is removed. */
function syncTrackCourse(db, courseId, oldTrackId, newTrackId) {
  if (oldTrackId && oldTrackId !== newTrackId && db.findById("tracks", oldTrackId)) {
    db.update("tracks", oldTrackId, (t) => {
      const courseIds = arr(t.courseIds).filter((id) => id !== courseId);
      return { courseIds, coursesCount: courseIds.length };
    });
  }
  if (newTrackId && db.findById("tracks", newTrackId)) {
    db.update("tracks", newTrackId, (t) => {
      const courseIds = arr(t.courseIds).includes(courseId) ? arr(t.courseIds) : [...arr(t.courseIds), courseId];
      return { courseIds, coursesCount: courseIds.length };
    });
  }
}

const listCourse = (c, db) => {
  // eslint-disable-next-line no-unused-vars
  const { modules, enrollment, ...rest } = recompute(c, db);
  return { ...rest, modulesCount: (modules || []).length, enrollment: null };
};

const COURSE_FIELDS = [
  "title", "subtitle", "description", "trackId", "mentorId", "level", "languages", "cover", "skills", "whatYouBuild", "requirements", "priceINR", "payLater", "slug",
  // catalogue fields (spec §6, §6.2, §7.3, §7.4)
  "status", "skillId", "durationDays", "outcome", "whoFor", "capacity", "enrolmentOpensAt", "enrolmentClosesAt",
];
const AUDIT_COURSE_KEYS = ["title", "slug", "trackId", "skillId", "mentorId", "level", "status", "priceINR", "durationDays", "capacity", "enrolmentOpensAt", "enrolmentClosesAt"];
const courseAuditView = (c) => ({ ...Object.fromEntries(AUDIT_COURSE_KEYS.map((k) => [k, c?.[k] ?? null])), lessonsCount: c?.lessonsCount ?? 0 });

function checkCourseFields(db, out) {
  if (out.status !== undefined && !COURSE_STATUSES.includes(out.status)) throw httpError(400, "Unknown course status.");
  if (out.skillId && !db.findById("skills", out.skillId)) throw httpError(400, "Choose a skill from the catalogue.");
  if (out.enrolmentOpensAt && out.enrolmentClosesAt && new Date(out.enrolmentOpensAt) > new Date(out.enrolmentClosesAt)) {
    throw httpError(400, "Enrolment must open before it closes.");
  }
}

function pickCourseFields(body) {
  const out = {};
  for (const k of COURSE_FIELDS) if (body[k] !== undefined) out[k] = body[k];
  for (const k of ["languages", "skills", "whatYouBuild", "requirements"]) if (out[k] !== undefined) out[k] = arr(out[k]).map(String);
  if (out.level && !COURSE_LEVELS.includes(out.level)) out.level = "BEGINNER";
  if (out.skillId !== undefined) out.skillId = out.skillId || null;
  if (out.durationDays !== undefined) out.durationDays = out.durationDays ? Math.max(1, Math.min(365, num(out.durationDays))) : null;
  if (out.capacity !== undefined) out.capacity = out.capacity ? Math.max(0, num(out.capacity)) || null : null;
  for (const k of ["enrolmentOpensAt", "enrolmentClosesAt"]) {
    if (out[k] !== undefined) out[k] = out[k] && !Number.isNaN(new Date(out[k]).getTime()) ? new Date(out[k]).toISOString() : null;
  }
  for (const k of ["outcome", "whoFor"]) if (out[k] !== undefined) out[k] = String(out[k] ?? "").trim();
  if (out.cover) {
    out.cover = {
      from: out.cover.from || COVER_PALETTE[0][0],
      to: out.cover.to || COVER_PALETTE[0][1],
      pattern: PATTERNS.includes(out.cover.pattern) ? out.cover.pattern : "dots",
    };
  }
  if (out.payLater !== undefined) out.payLater = !!out.payLater;
  return out;
}

function uniqueSlug(db, base, exceptId) {
  let slug = slugify(base);
  let n = 2;
  while (db.find("courses", (c) => c.slug === slug && c.id !== exceptId)) slug = `${slugify(base)}-${n++}`;
  return slug;
}

/* ───────── gig helpers ───────── */

function hydrateGig(g, db) {
  const m = db.findById("users", g.mentorId);
  return { ...g, mentor: m ? { id: m.id, name: m.name, avatarUrl: m.avatarUrl ?? null } : null };
}

const GIG_FIELDS = ["title", "company", "category", "skills", "payoutINR", "durationDays", "difficulty", "minStage", "status", "spots", "deadline", "description", "deliverables", "mentorId"];

function pickGigFields(body) {
  const out = {};
  for (const k of GIG_FIELDS) if (body[k] !== undefined) out[k] = body[k];
  if (out.skills !== undefined) out.skills = arr(out.skills).map(String);
  if (out.deliverables !== undefined) out.deliverables = arr(out.deliverables).map(String);
  if (out.payoutINR !== undefined) out.payoutINR = Math.max(0, num(out.payoutINR));
  if (out.durationDays !== undefined) out.durationDays = Math.max(1, num(out.durationDays, 3));
  if (out.spots !== undefined) out.spots = Math.max(1, num(out.spots, 1));
  if (out.minStage !== undefined) out.minStage = Number(out.minStage) === 4 ? 4 : 3;
  if (out.difficulty !== undefined && !["EASY", "MEDIUM", "HARD"].includes(out.difficulty)) out.difficulty = "EASY";
  if (out.status !== undefined && !["OPEN", "CLOSED"].includes(out.status)) out.status = "OPEN";
  if (out.company !== undefined) out.company = { name: out.company?.name || "Campus partner", logoColor: out.company?.logoColor || "#6B4EFF" };
  return out;
}

function hydrateApplication(a, db) {
  const gig = db.findById("gigs", a.gigId);
  return { ...a, gig: gig ? hydrateGig(gig, db) : null, user: publicUser(db.findById("users", a.userId)) };
}

/** Same pay-later maths as GET /api/wallet (earn handlers): a flat fee once the student has any enrollment, minus what was already deducted. */
const PAY_LATER_FEE_INR = 4999;
function payLaterRemaining(db, userId) {
  const deducted = db.filter("walletTxns", (t) => t.userId === userId && t.type === "COURSE_FEE_DEDUCTION").reduce((s, t) => s + Math.abs(Number(t.amountINR) || 0), 0);
  const hasCourses = db.filter("enrollments", (e) => e.userId === userId).length > 0;
  const totalFees = deducted > 0 || hasCourses || userId === "u_student" ? PAY_LATER_FEE_INR : 0;
  return Math.max(0, totalFees - deducted);
}

/* ───────── handlers ───────── */

export default {
  "GET /api/admin/overview": ({ user, db }) => {
    admin(user);
    const users = db.all("users");
    const students = users.filter((u) => u.role === "STUDENT");
    const enrollments = db.all("enrollments");
    const submissions = db.all("submissions");
    const apps = db.all("gigApplications");
    const weekAgo = Date.now() - 7 * 86400000;

    const active = new Set();
    for (const e of db.all("pointsEvents")) if (ts(e.createdAt) >= weekAgo) active.add(e.userId);
    for (const s of submissions) if (ts(s.createdAt) >= weekAgo) active.add(s.userId);
    for (const a of apps) if (ts(a.updatedAt || a.createdAt) >= weekAgo) active.add(a.userId);
    for (const e of enrollments) if (ts(e.startedAt) >= weekAgo) active.add(e.userId);
    for (const s of students) if ((s.streak || 0) > 0) active.add(s.id);
    const studentIds = new Set(students.map((s) => s.id));
    const activeThisWeek = [...active].filter((id) => studentIds.has(id)).length;

    const completed = enrollments.filter((e) => e.completedAt).length;

    // 30-day signups (oldest → newest)
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), start: d.getTime(), end: d.getTime() + 86400000 });
    }
    const signupsByDay = days.map(({ date, start, end }) => ({
      date,
      count: students.filter((u) => {
        const t = ts(u.createdAt);
        return t >= start && t < end;
      }).length,
    }));

    // top tracks by enrollments; fall back to track.studentsCount
    const tracks = db.all("tracks");
    const byTrack = new Map();
    for (const e of enrollments) {
      const c = db.findById("courses", e.courseId);
      if (!c?.trackId) continue;
      byTrack.set(c.trackId, (byTrack.get(c.trackId) || 0) + 1);
    }
    let topTracks = [...byTrack.entries()].map(([id, n]) => ({ title: tracks.find((t) => t.id === id)?.title || id, students: n }));
    if (!topTracks.length) topTracks = tracks.map((t) => ({ title: t.title, students: t.studentsCount || 0 }));
    topTracks = topTracks.sort((a, b) => b.students - a.students).slice(0, 6);

    const name = (id) => users.find((u) => u.id === id)?.name || "A student";
    const courseTitle = (id) => db.findById("courses", id)?.title || "a course";
    const gigTitle = (id) => db.findById("gigs", id)?.title || "a gig";
    const recentActivity = [
      ...enrollments.map((e) => ({ id: `act_${e.id}`, type: "ENROLLMENT", text: `${name(e.userId)} enrolled in ${courseTitle(e.courseId)}`, createdAt: e.startedAt || e.createdAt })),
      ...submissions.map((s) => ({
        id: `act_${s.id}`,
        type: "SUBMISSION",
        text: `${name(s.userId)} submitted "${s.lessonTitle || "an assignment"}"${s.status === "REVIEWED" ? ` · scored ${s.score}/${s.maxScore}` : ""}`,
        createdAt: s.createdAt,
      })),
      ...apps.map((a) => ({
        id: `act_${a.id}`,
        type: "GIG_APPLICATION",
        text: `${name(a.userId)} ${a.status === "PAID" ? "got paid for" : a.status === "APPROVED" ? "had work approved on" : a.status === "SUBMITTED" ? "submitted work for" : "applied to"} ${gigTitle(a.gigId)}`,
        createdAt: a.updatedAt || a.createdAt,
      })),
      ...students.map((u) => ({ id: `act_${u.id}`, type: "SIGNUP", text: `${u.name} joined${u.college ? ` from ${u.college.shortName || u.college.name}` : ""}`, createdAt: u.createdAt })),
    ]
      .filter((a) => a.createdAt)
      .sort((a, b) => ts(b.createdAt) - ts(a.createdAt))
      .slice(0, 15);

    return {
      kpis: {
        students: students.length,
        activeThisWeek,
        enrollments: enrollments.length,
        completionRate: enrollments.length ? Math.round((completed / enrollments.length) * 100) : 0,
        paidOutINR: users.reduce((s, u) => s + (Number(u.lifetimeEarnedINR) || 0), 0),
        openGigs: db.filter("gigs", (g) => g.status === "OPEN").length,
        pendingSubmissions: submissions.filter((s) => s.status === "SUBMITTED").length,
        pendingColleges: db.filter("colleges", (c) => !c.verified).length,
      },
      signupsByDay,
      topTracks,
      recentActivity,
    };
  },

  /* ── courses ── */
  "GET /api/admin/courses": ({ user, db }) => {
    admin(user);
    return [...db.all("courses")].sort((a, b) => ts(b.createdAt) - ts(a.createdAt)).map((c) => listCourse(c, db));
  },

  "POST /api/admin/courses": ({ user, body, db }) => {
    admin(user);
    const fields = pickCourseFields(body);
    if (!fields.title?.trim()) throw httpError(400, "Give the course a title.");
    checkCourseFields(db, fields);
    const [from, to] = COVER_PALETTE[Math.floor(Math.random() * COVER_PALETTE.length)];
    const id = uid("crs");
    // spec §6.2: price and duration prefill from the level defaults; new courses start as drafts
    const defaults = levelDefaultsFor(db, fields.level || "BEGINNER");
    const course = recompute(
      {
        id,
        subtitle: "",
        description: "",
        trackId: db.all("tracks")[0]?.id ?? null,
        mentorId: db.find("users", (u) => u.role === "MENTOR")?.id ?? null,
        level: "BEGINNER",
        languages: ["en", "hinglish"],
        cover: { from, to, pattern: PATTERNS[Math.floor(Math.random() * PATTERNS.length)] },
        rating: 0,
        ratingsCount: 0,
        studentsCount: 0,
        skills: [],
        whatYouBuild: [],
        requirements: [],
        priceINR: defaults.priceINR,
        durationDays: defaults.durationDays,
        payLater: false,
        status: "DRAFT",
        outcome: "",
        whoFor: "",
        skillId: null,
        capacity: null,
        enrolmentOpensAt: null,
        enrolmentClosesAt: null,
        ...fields,
        title: fields.title.trim(),
        slug: uniqueSlug(db, fields.slug || fields.title),
        modules: normalizeModules(body.modules, id),
        createdAt: now(),
      },
      db,
    );
    db.insert("courses", course);
    syncTrackCourse(db, id, null, course.trackId);
    demoAudit(db, user, { action: "course.create", entity: "Course", entityId: id, after: courseAuditView(course) });
    return { ...course, enrollment: null };
  },

  "GET /api/admin/courses/:id": ({ user, params, db }) => {
    admin(user);
    const c = db.findById("courses", params.id) || db.find("courses", (x) => x.slug === params.id);
    if (!c) throw httpError(404, "Course not found.");
    return { ...recompute(c, db), modules: normalizeModules(c.modules, c.id), enrollment: null };
  },

  "PUT /api/admin/courses/:id": ({ user, params, body, db }) => {
    admin(user);
    const existing = db.findById("courses", params.id);
    if (!existing) throw httpError(404, "Course not found.");
    const fields = pickCourseFields(body);
    if (fields.title !== undefined && !String(fields.title).trim()) throw httpError(400, "Title can't be empty.");
    checkCourseFields(db, {
      ...fields,
      enrolmentOpensAt: fields.enrolmentOpensAt !== undefined ? fields.enrolmentOpensAt : existing.enrolmentOpensAt,
      enrolmentClosesAt: fields.enrolmentClosesAt !== undefined ? fields.enrolmentClosesAt : existing.enrolmentClosesAt,
    });
    const next = recompute(
      {
        ...existing,
        ...fields,
        slug: fields.slug ? uniqueSlug(db, fields.slug, existing.id) : existing.slug,
        modules: body.modules !== undefined ? normalizeModules(body.modules, existing.id) : existing.modules || [],
        updatedAt: now(),
      },
      db,
    );
    db.update("courses", existing.id, next);
    syncTrackCourse(db, existing.id, existing.trackId, next.trackId);
    const before = courseAuditView(existing);
    const after = courseAuditView(next);
    demoAudit(db, user, { action: before.status !== after.status ? "course.status" : "course.update", entity: "Course", entityId: existing.id, before, after });
    return { ...next, enrollment: null };
  },

  "DELETE /api/admin/courses/:id": ({ user, params, db }) => {
    admin(user);
    const c = db.findById("courses", params.id);
    if (!c) throw httpError(404, "Course not found.");
    // as the API: never destroy payment, enrolment or assessment records with a course
    const assessmentIds = new Set(db.filter("assessments", (a) => a.courseId === c.id).map((a) => a.id));
    const inUse =
      db.filter("courseOrders", (o) => o.courseId === c.id && o.status !== "CANCELLED").length ||
      db.filter("enrollments", (e) => e.courseId === c.id).length ||
      db.filter("assessmentAttempts", (a) => assessmentIds.has(a.assessmentId)).length;
    if (inUse) throw httpError(409, "This course has students, payments or assessment results. Archive it instead.");
    syncTrackCourse(db, c.id, c.trackId, null);
    db.remove("courses", c.id);
    demoAudit(db, user, { action: "course.delete", entity: "Course", entityId: c.id, before: courseAuditView(c) });
    return { ok: true };
  },

  "GET /api/admin/tracks": ({ user, db }) => {
    admin(user);
    return db.all("tracks").map((t) => {
      const courseIds = db.filter("courses", (c) => c.trackId === t.id).map((c) => c.id);
      return { ...t, courseIds: courseIds.length ? courseIds : arr(t.courseIds), coursesCount: courseIds.length || t.coursesCount || 0 };
    });
  },

  /* ── gigs ── */
  "GET /api/admin/gigs": ({ user, db }) => {
    admin(user);
    return [...db.all("gigs")].sort((a, b) => ts(b.createdAt) - ts(a.createdAt)).map((g) => hydrateGig(g, db));
  },

  "POST /api/admin/gigs": ({ user, body, db }) => {
    admin(user);
    const fields = pickGigFields(body);
    if (!fields.title?.trim()) throw httpError(400, "Give the gig a title.");
    const gig = db.insert("gigs", {
      id: uid("gig"),
      company: { name: "Campus partner", logoColor: "#6B4EFF" },
      category: "web-development",
      skills: [],
      payoutINR: 500,
      durationDays: 5,
      difficulty: "EASY",
      minStage: 3,
      status: "OPEN",
      spots: 3,
      deadline: daysFromNow(14),
      description: "",
      deliverables: [],
      mentorId: null,
      ...fields,
      title: fields.title.trim(),
      applicantsCount: 0,
      createdAt: now(),
    });
    demoAudit(db, user, { action: "gig.create", entity: "Gig", entityId: gig.id, after: { title: gig.title, payoutINR: gig.payoutINR, status: gig.status, spots: gig.spots } });
    return hydrateGig(gig, db);
  },

  "PUT /api/admin/gigs/:id": ({ user, params, body, db }) => {
    admin(user);
    const prev = db.findById("gigs", params.id);
    if (!prev) throw httpError(404, "Gig not found.");
    const fields = pickGigFields(body);
    if (fields.title !== undefined && !String(fields.title).trim()) throw httpError(400, "Title can't be empty.");
    const gig = db.update("gigs", params.id, { ...fields, updatedAt: now() });
    const keys = Object.keys(fields);
    demoAudit(db, user, {
      action: "gig.update",
      entity: "Gig",
      entityId: gig.id,
      before: Object.fromEntries(keys.map((k) => [k, prev[k] ?? null])),
      after: Object.fromEntries(keys.map((k) => [k, gig[k] ?? null])),
    });
    return hydrateGig(gig, db);
  },

  /* ── gig applications ── */
  "GET /api/admin/gig-applications": ({ user, query, db }) => {
    admin(user);
    return db
      .filter("gigApplications", (a) => !query.status || a.status === query.status)
      .sort((a, b) => ts(b.updatedAt || b.createdAt) - ts(a.updatedAt || a.createdAt))
      .map((a) => hydrateApplication(a, db));
  },

  "POST /api/admin/gig-applications/:id/status": ({ user, params, body, db }) => {
    admin(user);
    const app = db.findById("gigApplications", params.id);
    if (!app) throw httpError(404, "Application not found.");
    const status = body.status;
    if (!APP_STATUSES.includes(status)) throw httpError(400, "Unknown status.");
    if (status === app.status) throw httpError(400, `This application is already ${status.toLowerCase()}.`);
    if (app.status === "PAID") throw httpError(400, "This application has already been paid out.");
    if (status === "PAID" && app.status !== "APPROVED") throw httpError(400, "Approve the work before marking it paid.");

    const gig = db.findById("gigs", app.gigId);
    const student = db.findById("users", app.userId);
    const gigTitle = gig?.title || "your gig";
    const feedback = typeof body.feedback === "string" && body.feedback.trim() ? body.feedback.trim() : app.feedback ?? null;

    db.update("gigApplications", app.id, { status, feedback, updatedAt: now() });
    demoAudit(db, user, {
      action: status === "PAID" ? "gig_application.payout" : "gig_application.status",
      entity: "GigApplication",
      entityId: app.id,
      before: { status: app.status },
      after: { status, ...(status === "PAID" ? { payoutINR: Math.max(0, Number(gig?.payoutINR) || 0) } : {}), ...(feedback ? { feedback } : {}) },
    });

    if (status === "APPROVED" && student) {
      awardPoints(db, student.id, POINTS.GIG_APPROVED, "GIG", `Gig approved: ${gigTitle}`);
      if (!db.find("portfolioItems", (p) => p.gigApplicationId === app.id)) {
        const [from, to] = COVER_PALETTE[(gigTitle.length + (gig?.skills?.length || 0)) % COVER_PALETTE.length];
        db.insert("portfolioItems", {
          id: uid("pf"),
          userId: student.id,
          title: gigTitle,
          description: `Paid micro-gig${gig?.company?.name ? ` for ${gig.company.name}` : ""}, reviewed and approved by a Campus mentor.${app.submissionNote ? ` ${app.submissionNote}` : ""}`,
          link: app.submissionLink || null,
          cover: { from, to },
          skills: arr(gig?.skills),
          verified: true,
          source: "GIG",
          gigApplicationId: app.id,
          createdAt: now(),
        });
      }
      if ((student.ladderStage || 1) < 3) db.update("users", student.id, { ladderStage: 3 });
    }

    let paidNote = "";
    if (status === "PAID" && student) {
      const payout = Math.max(0, Number(gig?.payoutINR) || 0);
      const owed = payLaterRemaining(db, student.id);
      const deduction = owed > 0 ? Math.min(owed, Math.round((payout * PAY_LATER_PERCENT) / 100)) : 0;
      db.insert("walletTxns", { id: uid("txn"), userId: student.id, type: "GIG_EARNING", amountINR: payout, note: `Gig payout: ${gigTitle}`, status: "COMPLETED", createdAt: now() });
      if (deduction > 0) {
        db.insert("walletTxns", {
          id: uid("txn"),
          userId: student.id,
          type: "COURSE_FEE_DEDUCTION",
          amountINR: -deduction,
          note: `Course fees: ${PAY_LATER_PERCENT}% of ${gigTitle} payout`,
          status: "COMPLETED",
          createdAt: now(),
        });
      }
      db.update("users", student.id, (u) => ({
        walletBalanceINR: (u.walletBalanceINR || 0) + payout - deduction,
        lifetimeEarnedINR: (u.lifetimeEarnedINR || 0) + payout,
      }));
      paidNote = deduction > 0 ? ` ₹${payout - deduction} added to your wallet (₹${deduction} went to course fees).` : ` ₹${payout} added to your wallet.`;
    }

    if (student) {
      const copy = {
        APPLIED: ["Application moved back to review", `Your application for "${gigTitle}" is back in review.`],
        ACCEPTED: ["You're in! Gig accepted", `You've been accepted for "${gigTitle}". Time to get to work.`],
        SUBMITTED: ["Submission received", `Your work for "${gigTitle}" is with the mentor.`],
        APPROVED: ["Work approved", `Your work on "${gigTitle}" was approved. +${POINTS.GIG_APPROVED} points and a verified portfolio item.`],
        REJECTED: ["Application update", `Your application for "${gigTitle}" wasn't selected this time. Keep going.`],
        PAID: ["Payment sent", `You got paid for "${gigTitle}".${paidNote}`],
      }[status];
      notify(db, student.id, {
        type: "GIG",
        title: copy[0],
        body: feedback && status !== "PAID" ? `${copy[1]} Feedback: ${feedback}` : copy[1],
        link: status === "PAID" ? "/app/wallet" : `/app/gigs/${app.gigId}`,
      });
    }

    return hydrateApplication(db.findById("gigApplications", app.id), db);
  },

  /* ── people ── */
  "GET /api/admin/students": ({ user, query, db }) => {
    admin(user);
    const q = (query.q || "").trim().toLowerCase();
    return db
      .filter("users", (u) => {
        if (u.role !== "STUDENT") return false;
        if (query.collegeId && u.collegeId !== query.collegeId) return false;
        if (query.stage && Number(u.ladderStage) !== Number(query.stage)) return false;
        if (q && ![u.name, u.email, u.username, u.college?.name, u.college?.shortName, u.city].some((f) => f?.toLowerCase().includes(q))) return false;
        return true;
      })
      .sort((a, b) => ts(b.createdAt) - ts(a.createdAt))
      .map(publicUser);
  },

  "PATCH /api/admin/users/:id": ({ user, params, body, db }) => {
    admin(user);
    const target = db.findById("users", params.id);
    if (!target) throw httpError(404, "User not found.");
    const patch = {};
    if (body.role !== undefined) {
      if (!["STUDENT", "MENTOR", "EVALUATOR", "PROJECT_MANAGER", "FINANCE", "ADMIN"].includes(body.role)) throw httpError(400, "Unknown role.");
      if (target.id === user.id && body.role !== "ADMIN") throw httpError(400, "You can't remove your own admin access.");
      patch.role = body.role;
      if (body.role === "MENTOR" && !target.mentorProfile) {
        patch.mentorProfile = {
          headline: target.headline || `${target.skills?.[0] || "Campus"} mentor`,
          expertise: arr(target.skills).slice(0, 4),
          company: "Campus mentor",
          rating: 5,
          reviewsCount: 0,
          sessionsCount: 0,
          priceINR: 0,
          languages: [target.language || "en"],
          yearsExperience: 1,
          availability: [{ day: "SAT", slots: ["11:00", "17:00"] }],
        };
      }
    }
    if (body.status !== undefined) {
      if (!["ACTIVE", "SUSPENDED"].includes(body.status)) throw httpError(400, "Status must be ACTIVE or SUSPENDED.");
      if (target.id === user.id && body.status === "SUSPENDED") throw httpError(400, "You can't suspend yourself.");
      patch.status = body.status;
    }
    const updated = db.update("users", target.id, patch);
    // spec §15: access changes are audited
    if (patch.role && patch.role !== target.role) {
      demoAudit(db, user, { action: "user.role", entity: "User", entityId: target.id, before: { role: target.role }, after: { role: patch.role } });
    }
    if (patch.status && patch.status !== target.status) {
      demoAudit(db, user, { action: "user.status", entity: "User", entityId: target.id, before: { status: target.status }, after: { status: patch.status } });
    }
    if (patch.role && patch.role !== target.role) {
      notify(db, target.id, { type: "SYSTEM", title: `Your role is now ${patch.role.toLowerCase()}`, body: "The Campus team updated your account.", link: patch.role === "MENTOR" ? "/app/mentor" : null });
    }
    if (patch.status === "ACTIVE" && target.status === "SUSPENDED") {
      notify(db, target.id, { type: "SYSTEM", title: "Your account is active again", body: "Welcome back. Chalo, let's continue.", link: "/app" });
    }
    return publicUser(updated);
  },

  "GET /api/admin/colleges": ({ user, query, db }) => {
    admin(user);
    return db
      .filter("colleges", (c) => (query.verified === "true" ? c.verified : query.verified === "false" ? !c.verified : true))
      .sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
  },

  "PATCH /api/admin/colleges/:id": ({ user, params, body, db }) => {
    admin(user);
    const c = db.findById("colleges", params.id);
    if (!c) throw httpError(404, "College not found.");
    const patch = {};
    if (body.verified !== undefined) patch.verified = !!body.verified;
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
    if (typeof body.city === "string" && body.city.trim()) patch.city = body.city.trim();
    const updated = db.update("colleges", c.id, patch);
    if (Object.keys(patch).length) {
      demoAudit(db, user, {
        action: patch.verified !== undefined && patch.verified !== c.verified ? (patch.verified ? "college.verify" : "college.unverify") : "college.update",
        entity: "College",
        entityId: c.id,
        before: Object.fromEntries(Object.keys(patch).map((k) => [k, c[k] ?? null])),
        after: patch,
      });
    }
    if (patch.name || patch.city) {
      for (const u of db.filter("users", (x) => x.collegeId === c.id)) {
        db.update("users", u.id, { college: { id: updated.id, name: updated.name, shortName: updated.shortName, city: updated.city } });
      }
    }
    return updated;
  },

  "GET /api/admin/submissions": ({ user, query, db }) => {
    admin(user);
    return db
      .filter("submissions", (s) => !query.status || s.status === query.status)
      .sort((a, b) => ts(b.createdAt) - ts(a.createdAt))
      .map((s) => ({ ...s, user: publicUser(db.findById("users", s.userId)) }));
  },

  "GET /api/admin/mentors": ({ user, db }) => {
    admin(user);
    return db
      .filter("users", (u) => u.role === "MENTOR")
      .sort((a, b) => (b.mentorProfile?.rating || 0) - (a.mentorProfile?.rating || 0))
      .map(publicUser);
  },
};
