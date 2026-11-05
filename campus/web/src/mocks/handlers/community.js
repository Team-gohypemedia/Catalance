/** Demo-engine handlers for the "community" domain. See campus/API_CONTRACT.md → "Community & mentors". */
import { httpError, requireUser, requireRole, uid, now, publicUser, miniUser } from "../utils";
import { awardPoints, notify, POINTS } from "../points";

/* ───────────── helpers ───────────── */

const TRACK_META = {
  "web-development": { title: "Web Development", color: "#FF5A1F" },
  "app-development": { title: "App Development", color: "#1F9BFF" },
  "ui-ux-design": { title: "UI/UX Design", color: "#6B4EFF" },
  "data-analytics": { title: "Data Analytics", color: "#12A150" },
  "ai-automation": { title: "AI & Automation", color: "#0EA5A4" },
  "digital-marketing": { title: "Digital Marketing", color: "#D98E00" },
  "content-writing": { title: "Content Writing", color: "#C2793F" },
  "graphic-design": { title: "Graphic Design", color: "#E5487D" },
  "video-editing": { title: "Video Editing", color: "#3B5BDB" },
};

function trackRef(db, trackId) {
  if (!trackId) return null;
  const t = db.findById("tracks", trackId) || db.find("tracks", (x) => x.slug === trackId);
  if (t) return { id: t.id, slug: t.slug, title: t.title, color: t.color };
  const slug = String(trackId).replace(/^t_/, "");
  const meta = TRACK_META[slug];
  return meta ? { id: `t_${slug}`, slug, ...meta } : null;
}

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const DAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const letters = "abcdefghijkmnopqrstuvwxyz";
const code = (n) => Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
const newMeetLink = () => `https://meet.google.com/${code(3)}-${code(4)}-${code(3)}`;

const isMentorish = (u) => u && (u.role === "MENTOR" || u.role === "ADMIN");
const getUser = (db, id) => db.findById("users", id);

/** Seeds store `startsAt`; new bookings store `date`. */
const bookingDate = (b) => b.date || ymd(new Date(b.startsAt || b.createdAt));
const bookingTs = (b) => new Date(`${bookingDate(b)}T${b.time || "00:00"}:00`).getTime();

const mentorRef = (m) => (m ? { id: m.id, name: m.name, avatarUrl: m.avatarUrl ?? null, headline: m.mentorProfile?.headline || m.headline || null } : null);

function shapeBooking(db, b) {
  // eslint-disable-next-line no-unused-vars
  const { startsAt, ...rest } = b;
  return {
    ...rest,
    date: bookingDate(b),
    note: b.note ?? null,
    mentor: mentorRef(getUser(db, b.mentorId)),
    user: publicUser(getUser(db, b.userId)),
  };
}

function sortBookings(list) {
  const upcoming = list.filter((b) => b.status === "UPCOMING").sort((a, b) => bookingTs(a) - bookingTs(b));
  const rest = list.filter((b) => b.status !== "UPCOMING").sort((a, b) => bookingTs(b) - bookingTs(a));
  return [...upcoming, ...rest];
}

/** Next 14 days of open slots for a mentor (availability minus booked slots; past times today excluded). */
function openSlots(db, mentor) {
  const availability = mentor.mentorProfile?.availability || [];
  const taken = new Set(
    db.filter("bookings", (b) => b.mentorId === mentor.id && b.status !== "CANCELLED").map((b) => `${bookingDate(b)} ${b.time}`),
  );
  const out = [];
  const base = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const date = ymd(d);
    const day = availability.find((a) => a.day === DAY_CODES[d.getDay()]);
    const times = (day?.slots || [])
      .filter((t) => !taken.has(`${date} ${t}`))
      .filter((t) => new Date(`${date}T${t}:00`).getTime() > Date.now() + 60 * 60 * 1000)
      .sort();
    out.push({ date, times });
  }
  return out;
}

function shapeThread(db, t, user) {
  const replies = db.filter("replies", (r) => r.threadId === t.id);
  const last = replies.reduce((max, r) => (r.createdAt > max ? r.createdAt : max), t.lastActivityAt || t.createdAt);
  // eslint-disable-next-line no-unused-vars
  const { upvoterIds = [], ...rest } = t;
  return {
    ...rest,
    author: miniUser(getUser(db, t.authorId)),
    tags: t.tags || [],
    trackId: t.trackId ?? null,
    upvotes: t.upvotes || 0,
    hasUpvoted: !!user && upvoterIds.includes(user.id),
    repliesCount: replies.length,
    solved: !!t.acceptedReplyId,
    acceptedReplyId: t.acceptedReplyId ?? null,
    lastActivityAt: last,
  };
}

function shapeReply(db, r, user, thread) {
  // eslint-disable-next-line no-unused-vars
  const { upvoterIds = [], ...rest } = r;
  const t = thread || db.findById("threads", r.threadId);
  return {
    ...rest,
    author: miniUser(getUser(db, r.authorId)),
    upvotes: r.upvotes || 0,
    hasUpvoted: !!user && upvoterIds.includes(user.id),
    isAccepted: !!t && t.acceptedReplyId === r.id,
  };
}

function toggleVote(db, collection, id, user) {
  const doc = db.findById(collection, id);
  if (!doc) throw httpError(404, collection === "threads" ? "Thread not found." : "Reply not found.");
  const ids = doc.upvoterIds || [];
  const has = ids.includes(user.id);
  const updated = db.update(collection, id, {
    upvoterIds: has ? ids.filter((x) => x !== user.id) : [...ids, user.id],
    upvotes: Math.max(0, (doc.upvotes || 0) + (has ? -1 : 1)),
  });
  return { upvotes: updated.upvotes, hasUpvoted: !has };
}

const normTag = (t) =>
  String(t || "")
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/[^a-z0-9+#.\- ]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 24);

/** Course list shape (no modules) — courses are seeded by the learning domain, so read defensively. */
function shapeCourse(db, c) {
  // eslint-disable-next-line no-unused-vars
  const { modules, ...rest } = c;
  const lessonsCount = c.lessonsCount ?? (modules || []).reduce((n, m) => n + (m.lessons?.length || 0), 0);
  return {
    ...rest,
    lessonsCount,
    track: c.track || trackRef(db, c.trackId),
    mentor: c.mentor || mentorRef(getUser(db, c.mentorId)),
  };
}

function findLesson(course, lessonId) {
  for (const m of course?.modules || []) for (const l of m.lessons || []) if (l.id === lessonId) return l;
  return null;
}

function shapeSubmission(db, s) {
  const course = db.findById("courses", s.courseId);
  const lesson = findLesson(course, s.lessonId);
  return {
    ...s,
    text: s.text ?? null,
    link: s.link ?? null,
    score: s.score ?? null,
    maxScore: s.maxScore ?? 100,
    feedback: s.feedback ?? null,
    reviewedById: s.reviewedById ?? null,
    reviewedAt: s.reviewedAt ?? null,
    lessonTitle: s.lessonTitle || lesson?.title || "Assignment",
    user: publicUser(getUser(db, s.userId)),
    // additive helpers for the mentor review UI
    courseTitle: course?.title ?? null,
    brief: lesson?.assignment?.brief ?? null,
    rubric: lesson?.assignment?.rubric ?? [],
  };
}

function shapeCohort(db, c, user, detail = false) {
  const memberIds = c.memberIds || [];
  // eslint-disable-next-line no-unused-vars
  const { memberIds: _m, ...rest } = c;
  const lead = getUser(db, c.leadMentorId);
  const t = trackRef(db, c.trackId);
  const out = {
    ...rest,
    track: t ? { title: t.title, color: t.color } : null,
    leadMentor: lead ? { id: lead.id, name: lead.name, avatarUrl: lead.avatarUrl ?? null } : null,
    membersCount: memberIds.length,
    isMember: !!user && memberIds.includes(user.id),
  };
  if (detail) {
    out.members = memberIds.map((id) => publicUser(getUser(db, id))).filter(Boolean);
    out.posts = db
      .filter("cohortPosts", (p) => p.cohortId === c.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((p) => shapePost(db, p));
  }
  return out;
}

const shapePost = (db, p) => ({ id: p.id, author: miniUser(getUser(db, p.authorId)), body: p.body, createdAt: p.createdAt });

function getThreadOr404(db, id) {
  const t = db.findById("threads", id);
  if (!t) throw httpError(404, "That doubt doesn't exist (or was removed).");
  return t;
}

/* ───────────── handlers ───────────── */

export default {
  /* ── Threads ── */
  "GET /api/threads": ({ query, user, db }) => {
    requireUser(user);
    const q = (query.q || "").toLowerCase().trim();
    const tag = (query.tag || "").toLowerCase();
    const track = query.track || "";
    let list = db.all("threads").map((t) => shapeThread(db, t, user));
    if (tag) list = list.filter((t) => t.tags.includes(tag));
    if (track) list = list.filter((t) => t.trackId === track || t.trackId === `t_${track}`);
    if (q) list = list.filter((t) => `${t.title} ${t.body} ${t.tags.join(" ")}`.toLowerCase().includes(q));
    const filter = query.filter || "all";
    if (filter === "unanswered") list = list.filter((t) => t.repliesCount === 0);
    else if (filter === "solved") list = list.filter((t) => t.solved);
    else if (filter === "mine") list = list.filter((t) => t.authorId === user.id);
    if (query.sort === "top") list.sort((a, b) => b.upvotes - a.upvotes || (a.createdAt < b.createdAt ? 1 : -1));
    else list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return list;
  },

  "POST /api/threads": ({ body, user, db }) => {
    requireUser(user);
    const title = (body.title || "").trim();
    const text = (body.body || "").trim();
    if (title.length < 8) throw httpError(400, "Give your doubt a clear title (at least 8 characters).");
    if (text.length < 10) throw httpError(400, "Add a few more details so people can help you.");
    const tags = [...new Set((body.tags || []).map(normTag).filter(Boolean))].slice(0, 5);
    const ts = now();
    const t = db.insert("threads", {
      id: uid("th"),
      authorId: user.id,
      title: title.slice(0, 160),
      body: text,
      tags,
      trackId: body.trackId || null,
      upvotes: 0,
      upvoterIds: [],
      acceptedReplyId: null,
      createdAt: ts,
      lastActivityAt: ts,
    });
    return shapeThread(db, t, user);
  },

  "GET /api/threads/:id": ({ params, user, db }) => {
    requireUser(user);
    const t = getThreadOr404(db, params.id);
    const replies = db
      .filter("replies", (r) => r.threadId === t.id)
      .map((r) => shapeReply(db, r, user, t))
      .sort((a, b) => (b.isAccepted - a.isAccepted) || (a.createdAt < b.createdAt ? -1 : 1));
    return { ...shapeThread(db, t, user), replies };
  },

  "POST /api/threads/:id/replies": ({ params, body, user, db }) => {
    requireUser(user);
    const t = getThreadOr404(db, params.id);
    const text = (body.body || "").trim();
    if (text.length < 2) throw httpError(400, "Your reply is empty.");
    const r = db.insert("replies", { id: uid("rp"), threadId: t.id, authorId: user.id, body: text, upvotes: 0, upvoterIds: [] });
    db.update("threads", t.id, { lastActivityAt: r.createdAt });
    if (t.authorId !== user.id) {
      awardPoints(db, user.id, POINTS.REPLY_POSTED, "HELP", `Replied to "${t.title.slice(0, 60)}"`);
      notify(db, t.authorId, {
        type: "COMMUNITY",
        title: `${user.name} replied to your doubt`,
        body: `"${text.replace(/[#*`>\n]+/g, " ").trim().slice(0, 90)}${text.length > 90 ? "…" : ""}"`,
        link: `/app/community/${t.id}`,
      });
    }
    return shapeReply(db, r, user, t);
  },

  "POST /api/threads/:id/upvote": ({ params, user, db }) => toggleVote(db, "threads", params.id, requireUser(user)),

  "POST /api/replies/:id/upvote": ({ params, user, db }) => toggleVote(db, "replies", params.id, requireUser(user)),

  "POST /api/replies/:id/accept": ({ params, user, db }) => {
    requireUser(user);
    const r = db.findById("replies", params.id);
    if (!r) throw httpError(404, "Reply not found.");
    const t = getThreadOr404(db, r.threadId);
    if (t.authorId !== user.id) throw httpError(403, "Only the person who asked can accept an answer.");
    if (t.acceptedReplyId === r.id) return shapeReply(db, r, user, t);
    // moving the accepted mark: take back points from the previous helper
    if (t.acceptedReplyId) {
      const prev = db.findById("replies", t.acceptedReplyId);
      if (prev && prev.authorId !== t.authorId) awardPoints(db, prev.authorId, -POINTS.ANSWER_ACCEPTED, "HELP", "Accepted answer changed");
    }
    const updated = db.update("threads", t.id, { acceptedReplyId: r.id, lastActivityAt: now() });
    if (r.authorId !== user.id) {
      awardPoints(db, r.authorId, POINTS.ANSWER_ACCEPTED, "HELP", `Answer accepted on "${t.title.slice(0, 60)}"`);
      notify(db, r.authorId, {
        type: "COMMUNITY",
        title: "Your answer was accepted",
        body: `${user.name} marked your answer on "${t.title.slice(0, 70)}" as the solution. +${POINTS.ANSWER_ACCEPTED} pts`,
        link: `/app/community/${t.id}`,
      });
    }
    return shapeReply(db, r, user, updated);
  },

  /** Additive (not in the contract yet): top helpers over the last 7 days, for the community sidebar. */
  "GET /api/community/top-helpers": ({ user, db }) => {
    requireUser(user);
    const since = Date.now() - 7 * 86400000;
    const acceptedIds = new Set(db.all("threads").map((t) => t.acceptedReplyId).filter(Boolean));
    const stats = new Map();
    for (const r of db.all("replies")) {
      if (new Date(r.createdAt).getTime() < since) continue;
      const s = stats.get(r.authorId) || { answers: 0, accepted: 0, upvotes: 0 };
      s.answers += 1;
      s.upvotes += r.upvotes || 0;
      if (acceptedIds.has(r.id)) s.accepted += 1;
      stats.set(r.authorId, s);
    }
    return [...stats.entries()]
      .map(([id, s]) => ({ user: miniUser(getUser(db, id)), ...s, points: s.answers * POINTS.REPLY_POSTED + s.accepted * POINTS.ANSWER_ACCEPTED }))
      .filter((x) => x.user)
      .sort((a, b) => b.points - a.points || b.upvotes - a.upvotes)
      .slice(0, 6);
  },

  /* ── Mentors ── */
  "GET /api/mentors": ({ query, user, db }) => {
    requireUser(user);
    const q = (query.q || "").toLowerCase().trim();
    const expertise = (query.expertise || "").toLowerCase();
    let list = db.filter("users", (u) => u.role === "MENTOR" && u.mentorProfile && u.status !== "SUSPENDED");
    if (q) list = list.filter((m) => `${m.name} ${m.headline} ${m.mentorProfile.company} ${m.mentorProfile.expertise.join(" ")}`.toLowerCase().includes(q));
    if (expertise) list = list.filter((m) => m.mentorProfile.expertise.some((e) => e.toLowerCase().includes(expertise)));
    if (query.language) list = list.filter((m) => m.mentorProfile.languages.includes(query.language));
    if (query.free === "true") list = list.filter((m) => !m.mentorProfile.priceINR);
    return list
      .sort((a, b) => b.mentorProfile.rating - a.mentorProfile.rating || b.mentorProfile.sessionsCount - a.mentorProfile.sessionsCount)
      .map((m) => {
        const next = openSlots(db, m).find((d) => d.times.length);
        // nextAvailable is additive (handy for directory cards)
        return { ...publicUser(m), nextAvailable: next ? { date: next.date, time: next.times[0] } : null };
      });
  },

  "GET /api/mentors/:id": ({ params, user, db }) => {
    requireUser(user);
    const m = db.find("users", (u) => (u.id === params.id || u.username === params.id) && u.role === "MENTOR");
    if (!m) throw httpError(404, "Mentor not found.");
    const reviews = db
      .filter("mentorReviews", (r) => r.mentorId === m.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map(({ id, userName, rating, comment, createdAt }) => ({ id, userName, rating, comment, createdAt }));
    const courses = db.filter("courses", (c) => c.mentorId === m.id && c.status !== "DRAFT").map((c) => shapeCourse(db, c));
    return { ...publicUser(m), reviews, courses, openSlots: openSlots(db, m) };
  },

  "POST /api/mentors/:id/book": ({ params, body, user, db }) => {
    requireUser(user);
    const m = db.find("users", (u) => u.id === params.id && u.role === "MENTOR");
    if (!m) throw httpError(404, "Mentor not found.");
    if (m.id === user.id) throw httpError(400, "You can't book a session with yourself.");
    const { date, time } = body;
    const topic = (body.topic || "").trim();
    if (!date || !time) throw httpError(400, "Pick a date and a time slot.");
    if (topic.length < 3) throw httpError(400, "Tell the mentor what you want to discuss.");
    const day = openSlots(db, m).find((d) => d.date === date);
    if (!day || !day.times.includes(time)) throw httpError(409, "That slot was just taken. Please pick another time.");
    const b = db.insert("bookings", {
      id: uid("bk"),
      mentorId: m.id,
      userId: user.id,
      date,
      time,
      topic: topic.slice(0, 140),
      note: (body.note || "").trim() || null,
      status: "UPCOMING",
      meetLink: newMeetLink(),
    });
    const when = `${new Date(`${date}T${time}:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} at ${time}`;
    notify(db, user.id, { type: "MENTOR", title: `Session confirmed with ${m.name}`, body: `${b.topic} · ${when}`, link: `/app/mentors/${m.id}` });
    notify(db, m.id, { type: "MENTOR", title: `New booking from ${user.name}`, body: `${b.topic} · ${when}`, link: "/app/mentor" });
    return shapeBooking(db, b);
  },

  "GET /api/me/bookings": ({ user, db }) => {
    requireUser(user);
    const list = db.filter("bookings", (b) => b.userId === user.id || b.mentorId === user.id);
    return sortBookings(list).map((b) => shapeBooking(db, b));
  },

  "POST /api/bookings/:id/cancel": ({ params, user, db }) => {
    requireUser(user);
    const b = db.findById("bookings", params.id);
    if (!b) throw httpError(404, "Booking not found.");
    if (b.userId !== user.id && b.mentorId !== user.id && user.role !== "ADMIN") throw httpError(403, "You can't cancel this booking.");
    if (b.status !== "UPCOMING") throw httpError(400, "Only upcoming sessions can be cancelled.");
    const updated = db.update("bookings", b.id, { status: "CANCELLED", cancelledAt: now() });
    const otherId = b.userId === user.id ? b.mentorId : b.userId;
    notify(db, otherId, {
      type: "MENTOR",
      title: `Session cancelled by ${user.name}`,
      body: `${b.topic} on ${bookingDate(b)} at ${b.time} was cancelled.`,
      link: otherId === b.mentorId ? "/app/mentor" : `/app/mentors/${b.mentorId}`,
    });
    return shapeBooking(db, updated);
  },

  /* ── Cohorts ── */
  "GET /api/cohorts": ({ user, db }) => {
    requireUser(user);
    return db
      .all("cohorts")
      .map((c) => shapeCohort(db, c, user))
      .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  },

  "GET /api/cohorts/:id": ({ params, user, db }) => {
    requireUser(user);
    const c = db.findById("cohorts", params.id);
    if (!c) throw httpError(404, "Cohort not found.");
    return shapeCohort(db, c, user, true);
  },

  "POST /api/cohorts/:id/join": ({ params, user, db }) => {
    requireUser(user);
    const c = db.findById("cohorts", params.id);
    if (!c) throw httpError(404, "Cohort not found.");
    const ids = c.memberIds || [];
    if (!ids.includes(user.id)) {
      if (ids.length >= c.maxMembers) throw httpError(409, "This cohort is full. Try the next batch!");
      db.update("cohorts", c.id, { memberIds: [...ids, user.id] });
      notify(db, user.id, { type: "COMMUNITY", title: `You joined ${c.title}`, body: `Sessions: ${c.schedule}. Say hi in the cohort feed!`, link: `/app/cohorts/${c.id}` });
    }
    return shapeCohort(db, db.findById("cohorts", c.id), user, true);
  },

  "POST /api/cohorts/:id/leave": ({ params, user, db }) => {
    requireUser(user);
    const c = db.findById("cohorts", params.id);
    if (!c) throw httpError(404, "Cohort not found.");
    db.update("cohorts", c.id, { memberIds: (c.memberIds || []).filter((x) => x !== user.id) });
    return shapeCohort(db, db.findById("cohorts", c.id), user, true);
  },

  "POST /api/cohorts/:id/posts": ({ params, body, user, db }) => {
    requireUser(user);
    const c = db.findById("cohorts", params.id);
    if (!c) throw httpError(404, "Cohort not found.");
    const canPost = (c.memberIds || []).includes(user.id) || c.leadMentorId === user.id || user.role === "ADMIN";
    if (!canPost) throw httpError(403, "Join the cohort to post in its feed.");
    const text = (body.body || "").trim();
    if (!text) throw httpError(400, "Write something first.");
    const p = db.insert("cohortPosts", { id: uid("cp"), cohortId: c.id, authorId: user.id, body: text.slice(0, 2000) });
    return shapePost(db, p);
  },

  /* ── Notifications ── */
  "GET /api/notifications": ({ user, db }) => {
    requireUser(user);
    return db
      .filter("notifications", (n) => n.userId === user.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((n) => ({ ...n, link: n.link ?? null, read: !!n.read }));
  },

  "POST /api/notifications/read-all": ({ user, db }) => {
    requireUser(user);
    for (const n of db.all("notifications")) if (n.userId === user.id && !n.read) n.read = true;
    db.save();
    return { ok: true };
  },

  "POST /api/notifications/:id/read": ({ params, user, db }) => {
    requireUser(user);
    const n = db.findById("notifications", params.id);
    if (!n || n.userId !== user.id) throw httpError(404, "Notification not found.");
    return db.update("notifications", n.id, { read: true });
  },

  /* ── Mentor studio ── */
  "GET /api/mentor/overview": ({ user, db }) => {
    requireRole(user, "MENTOR");
    const isAdmin = user.role === "ADMIN";
    const mine = db.filter("bookings", (b) => isAdmin || b.mentorId === user.id);
    const upcomingSessions = sortBookings(mine.filter((b) => b.status === "UPCOMING" && bookingTs(b) > Date.now() - 3600000)).map((b) => shapeBooking(db, b));
    const myCourseIds = new Set(db.filter("courses", (c) => isAdmin || c.mentorId === user.id).map((c) => c.id));
    const pendingSubmissions = db
      .filter("submissions", (s) => s.status === "SUBMITTED" && myCourseIds.has(s.courseId))
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
      .map((s) => shapeSubmission(db, s));
    const completed = mine.filter((b) => b.status === "COMPLETED");
    const profile = user.mentorProfile || {};
    const rate = Math.max(profile.priceINR || 0, 250); // free sessions earn a ₹250 Campus honorarium
    const reviewedByMe = db.filter("submissions", (s) => s.reviewedById === user.id);
    const earningsINR = ((profile.sessionsCount || 0) + completed.length) * rate + reviewedByMe.length * 40;
    const helped = new Set([
      ...mine.filter((b) => b.status !== "CANCELLED").map((b) => b.userId),
      ...reviewedByMe.map((s) => s.userId),
      ...db
        .filter("replies", (r) => r.authorId === user.id)
        .map((r) => db.findById("threads", r.threadId)?.authorId)
        .filter(Boolean),
    ]);
    const weekly = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const key = ymd(d);
      weekly.push({
        day: d.toLocaleDateString("en-IN", { weekday: "short" }),
        sessions: mine.filter((b) => b.status !== "CANCELLED" && bookingDate(b) === key).length,
      });
    }
    return {
      upcomingSessions,
      pendingSubmissions,
      earningsINR,
      rating: profile.rating ?? null,
      studentsHelped: helped.size,
      weekly,
    };
  },

  "POST /api/mentor/submissions/:id/review": ({ params, body, user, db }) => {
    requireRole(user, "MENTOR");
    const s = db.findById("submissions", params.id);
    if (!s) throw httpError(404, "Submission not found.");
    const course = db.findById("courses", s.courseId);
    if (user.role !== "ADMIN" && course?.mentorId !== user.id) throw httpError(403, "You can only review submissions for your own courses.");
    if (s.status === "REVIEWED") throw httpError(400, "This submission is already reviewed.");
    const maxScore = s.maxScore || 100;
    const score = Math.round(Number(body.score));
    if (!Number.isFinite(score) || score < 0 || score > maxScore) throw httpError(400, `Score must be between 0 and ${maxScore}.`);
    const feedback = (body.feedback || "").trim();
    if (feedback.length < 10) throw httpError(400, "Write a little feedback — students learn the most from it.");
    const updated = db.update("submissions", s.id, { status: "REVIEWED", score, feedback, reviewedById: user.id, reviewedAt: now() });
    const lesson = findLesson(course, s.lessonId);
    const lessonTitle = s.lessonTitle || lesson?.title || "Assignment";
    const pts = Math.round((POINTS.ASSIGNMENT_REVIEWED_PER_SCORE * score * 100) / maxScore);
    awardPoints(db, s.userId, pts, "ASSIGNMENT", `Mentor review: ${lessonTitle}`);
    db.insert("portfolioItems", {
      id: uid("pf"),
      userId: s.userId,
      title: lessonTitle,
      description: `${course?.title ? `${course.title} · ` : ""}Reviewed by ${user.name}: scored ${score}/${maxScore}. ${feedback.slice(0, 160)}`,
      link: s.link ?? null,
      cover: { from: course?.cover?.from || "#FF5A1F", to: course?.cover?.to || "#6B4EFF" },
      skills: (course?.skills || []).slice(0, 4),
      verified: true,
      source: "ASSIGNMENT",
      submissionId: s.id,
    });
    notify(db, s.userId, {
      type: "COURSE",
      title: "Assignment reviewed",
      body: `${user.name} scored "${lessonTitle}" ${score}/${maxScore}. It's now a verified piece in your Proof Portfolio. +${pts} pts`,
      link: "/app/portfolio",
    });
    return shapeSubmission(db, updated);
  },
};
