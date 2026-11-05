import { httpError, requireUser, publicUser, uid, now } from "../utils";

const issue = (user) => ({ user: publicUser(user), token: `demo.${user.id}` });

const EDITABLE = ["name", "username", "headline", "bio", "phone", "city", "state", "year", "stream", "goal", "language", "interests", "skillLevel", "skills", "links", "avatarUrl", "notificationPrefs", "aspirant"];

const EXAMS = ["UPSC", "SSC", "BANKING", "RAILWAYS", "STATE_PSC", "TEACHING", "DEFENCE", "OTHER"];
const clampInt = (v, min, max, fallback) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
/** Normalise an Aspirant payload (see API_CONTRACT.md). Returns null for empty input. */
function cleanAspirant(a, prev = null) {
  if (!a) return null;
  const merged = { ...(prev || {}), ...a };
  return {
    exam: EXAMS.includes(merged.exam) ? merged.exam : "OTHER",
    examName: String(merged.examName || "").trim().slice(0, 60) || "Government exam",
    prepYears: clampInt(merged.prepYears, 0, 8, 1),
    dailyMinutes: [30, 45, 60, 90].includes(Number(merged.dailyMinutes)) ? Number(merged.dailyMinutes) : 45,
    attemptsUsed: clampInt(merged.attemptsUsed, 0, 10, 0),
    birthYear: merged.birthYear ? clampInt(merged.birthYear, 1960, new Date().getFullYear() - 15, null) : null,
    strengths: Array.isArray(merged.strengths) ? merged.strengths.slice(0, 12) : [],
    studyHoursTotal: clampInt(merged.studyHoursTotal, 0, 30000, 0),
    mockTestsTaken: clampInt(merged.mockTestsTaken, 0, 5000, 0),
    bestMockPercentile: merged.bestMockPercentile === null || merged.bestMockPercentile === "" || merged.bestMockPercentile === undefined ? null : clampInt(merged.bestMockPercentile, 0, 100, null),
    showOnPassport: merged.showOnPassport !== false,
  };
}

const collegeRef = (c) => (c ? { id: c.id, name: c.name, shortName: c.shortName, city: c.city } : null);

export default {
  "POST /api/auth/signup": ({ body, db }) => {
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    if (!name || !email || !body.password) throw httpError(400, "Name, email and password are required.");
    if (body.password.length < 8) throw httpError(400, "Password must be at least 8 characters.");
    if (db.find("users", (u) => u.email === email)) throw httpError(409, "An account with this email already exists. Try logging in.");
    const base = email.split("@")[0].replace(/[^a-z0-9]/g, "") || "student";
    let username = base;
    while (db.find("users", (u) => u.username === username)) username = `${base}${Math.floor(Math.random() * 1000)}`;
    const user = db.insert("users", {
      id: uid("u"),
      email,
      name,
      username,
      password: body.password,
      role: "STUDENT",
      status: "ACTIVE",
      avatarUrl: null,
      headline: null,
      bio: null,
      phone: null,
      city: null,
      state: null,
      collegeId: null,
      college: null,
      year: null,
      stream: null,
      goal: null,
      language: "en",
      interests: [],
      skillLevel: null,
      skills: [],
      links: {},
      onboarded: false,
      xp: 0,
      coins: 50,
      streak: 0,
      longestStreak: 0,
      seasonPoints: 0,
      lifetimePoints: 0,
      division: "BRONZE",
      ladderStage: 1,
      walletBalanceINR: 0,
      lifetimeEarnedINR: 0,
      notificationPrefs: { email: true, whatsapp: true, push: true },
      mentorProfile: null,
      aspirant: null,
    });
    db.insert("notifications", {
      userId: user.id,
      type: "SYSTEM",
      title: "Welcome to Catalance Campus",
      body: "Finish setting up your profile to get a learning path made for you.",
      link: "/app",
      read: false,
    });
    return issue(user);
  },

  "POST /api/auth/login": ({ body, db }) => {
    const email = body.email?.trim().toLowerCase();
    const user = db.find("users", (u) => u.email === email);
    if (!user || user.password !== body.password) throw httpError(401, "That email and password don't match.");
    if (user.status === "SUSPENDED") throw httpError(403, "This account is suspended. Contact support.");
    return issue(user);
  },

  "GET /api/auth/me": ({ user }) => ({ user: publicUser(requireUser(user)) }),

  "POST /api/auth/forgot-password": () => ({ ok: true }),

  "PATCH /api/me": ({ user, body, db }) => {
    requireUser(user);
    const patch = Object.fromEntries(Object.entries(body).filter(([k]) => EDITABLE.includes(k)));
    if ("aspirant" in patch) patch.aspirant = cleanAspirant(patch.aspirant, user.aspirant);
    if (patch.username && db.find("users", (u) => u.username === patch.username && u.id !== user.id)) {
      throw httpError(409, "That username is taken.");
    }
    return { user: publicUser(db.update("users", user.id, patch)) };
  },

  "POST /api/me/onboarding": ({ user, body, db }) => {
    requireUser(user);
    let college = body.collegeId ? db.findById("colleges", body.collegeId) : null;
    if (!college && body.newCollege?.name) {
      college = db.insert("colleges", {
        id: uid("c"),
        name: body.newCollege.name,
        shortName: body.newCollege.name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 5),
        city: body.newCollege.city || "",
        state: body.newCollege.state || "",
        type: body.newCollege.type || "ENGINEERING",
        topSkill: null,
        verified: false,
        studentsCount: 1,
        totalPoints: 0,
        avgPoints: 0,
        rank: db.all("colleges").length + 1,
        rankChange: 0,
      });
    }
    const updated = db.update("users", user.id, {
      collegeId: college?.id ?? null,
      college: collegeRef(college),
      city: user.city || college?.city || null,
      state: user.state || college?.state || null,
      year: body.year ?? null,
      stream: body.stream ?? null,
      goal: body.goal ?? null,
      language: body.language || "en",
      interests: body.interests || [],
      skillLevel: body.skillLevel ?? null,
      aspirant: body.goal === "GOVT_EXAM_BACKUP" ? cleanAspirant(body.aspirant || {}) : null,
      onboarded: true,
    });
    return { user: publicUser(updated) };
  },

  "POST /api/me/password": ({ user, body, db }) => {
    requireUser(user);
    if (user.password !== body.currentPassword) throw httpError(400, "Your current password is wrong.");
    if (!body.newPassword || body.newPassword.length < 8) throw httpError(400, "New password must be at least 8 characters.");
    db.update("users", user.id, { password: body.newPassword, passwordChangedAt: now() });
    return { ok: true };
  },

  "GET /api/colleges/search": ({ query, db }) => {
    const q = (query.q || "").toLowerCase().trim();
    return db
      .all("colleges")
      .filter((c) => !q || `${c.name} ${c.shortName} ${c.city}`.toLowerCase().includes(q))
      .slice(0, 10);
  },
};
