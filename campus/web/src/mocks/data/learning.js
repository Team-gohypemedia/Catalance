/**
 * Seed data for the "learning" domain: tracks, courses (with full lessons), enrollments, submissions, certificates.
 * Course content lives in ./learning-courses/<track-slug>.js (plain data) and is normalised here
 * into the contract shapes (ids, LessonSummary fields, quiz option ids, mentor + track refs).
 */
import { daysAgo, hoursAgo, seeded } from "../utils";
import core from "./core";
import webDevelopment from "./learning-courses/web-development";
import appDevelopment from "./learning-courses/app-development";
import uiUxDesign from "./learning-courses/ui-ux-design";
import dataAnalytics from "./learning-courses/data-analytics";
import aiAutomation from "./learning-courses/ai-automation";
import digitalMarketing from "./learning-courses/digital-marketing";
import contentWriting from "./learning-courses/content-writing";
import graphicDesign from "./learning-courses/graphic-design";
import videoEditing from "./learning-courses/video-editing";
import excelForAspirants from "./learning-courses/excel-for-aspirants";
import translationHindiEnglish from "./learning-courses/translation-hindi-english";
import accountingTallyGst from "./learning-courses/accounting-tally-gst";

const rand = seeded(2024);
const usersById = Object.fromEntries(core.users.map((u) => [u.id, u]));

/* ───────────────────────── Tracks ───────────────────────── */
const TRACK_META = [
  {
    slug: "web-development",
    title: "Web Development",
    tagline: "Build fast, responsive websites that local businesses will pay for.",
    category: "TECH",
    icon: "Code2",
    color: "#FF5A1F",
    level: "Beginner → Intermediate",
    durationWeeks: 12,
    outcomes: ["Build responsive sites with HTML, CSS and JavaScript", "Ship React apps with routing, forms and APIs", "Deploy on Netlify/Vercel and hand over to a client", "Price and scope a website project with confidence"],
    careers: [["Frontend Developer", 450000], ["Freelance Web Developer", 360000], ["Full-stack Developer", 600000]],
    forAspirants: false,
    bridgeFrom: [],
    courses: webDevelopment,
  },
  {
    slug: "app-development",
    title: "App Development",
    tagline: "Ship Android apps with Flutter — from first widget to Play Store.",
    category: "TECH",
    icon: "Smartphone",
    color: "#1F9BFF",
    level: "Beginner → Intermediate",
    durationWeeks: 10,
    outcomes: ["Write clean Dart and Flutter widgets", "Manage state, navigation and forms", "Connect apps to Firebase auth and Firestore", "Publish a signed APK on the Play Store"],
    careers: [["Flutter Developer", 480000], ["Android Developer", 520000], ["Freelance App Developer", 400000]],
    forAspirants: false,
    bridgeFrom: [],
    courses: appDevelopment,
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    tagline: "Design apps people love using — and case studies that get you hired.",
    category: "TECH",
    icon: "PenTool",
    color: "#6B4EFF",
    level: "Beginner → Intermediate",
    durationWeeks: 8,
    outcomes: ["Use hierarchy, spacing, type and colour like a pro", "Build with Figma auto layout and components", "Run quick user research and usability tests", "Write a case study recruiters actually read"],
    careers: [["UI Designer", 420000], ["Product Designer", 700000], ["Freelance UX Designer", 380000]],
    forAspirants: false,
    bridgeFrom: [],
    courses: uiUxDesign,
  },
  {
    slug: "data-analytics",
    title: "Data Analytics",
    tagline: "Turn messy spreadsheets into decisions with Excel, SQL and Power BI.",
    category: "TECH",
    icon: "BarChart3",
    color: "#12A150",
    level: "Beginner → Intermediate",
    durationWeeks: 10,
    outcomes: ["Clean and model data in Excel", "Query databases with SQL joins and aggregates", "Build client-ready Power BI dashboards", "Present insights as a clear story"],
    careers: [["Data Analyst", 500000], ["BI Analyst", 650000], ["Freelance MIS Analyst", 300000]],
    forAspirants: false,
    bridgeFrom: [],
    courses: dataAnalytics,
  },
  {
    slug: "ai-automation",
    title: "AI & Automation",
    tagline: "Automate boring work with Python, AI APIs and no-code workflows.",
    category: "TECH",
    icon: "Bot",
    color: "#D98E00",
    level: "Beginner",
    durationWeeks: 8,
    outcomes: ["Automate files, CSVs and Excel reports with Python", "Call AI APIs and get structured JSON back", "Build no-code workflows with triggers and actions", "Sell automation as a service to small businesses"],
    careers: [["Automation Engineer", 550000], ["AI Ops Associate", 450000], ["Freelance Automation Consultant", 420000]],
    forAspirants: false,
    bridgeFrom: [],
    courses: aiAutomation,
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    tagline: "Grow brands with SEO, Instagram and ads — measured in real rupees.",
    category: "NON_TECH",
    icon: "Megaphone",
    color: "#E5484D",
    level: "Beginner → Intermediate",
    durationWeeks: 8,
    outcomes: ["Plan funnels and customer personas", "Rank local businesses with SEO and Google Business Profile", "Run Meta ads and read CTR, CPC and ROAS", "Report results to clients clearly"],
    careers: [["Digital Marketing Executive", 360000], ["Performance Marketer", 600000], ["Freelance Social Media Manager", 300000]],
    forAspirants: false,
    bridgeFrom: [],
    courses: digitalMarketing,
  },
  {
    slug: "content-writing",
    title: "Content Writing",
    tagline: "Write blogs, posts and copy that brands pay per word for.",
    category: "NON_TECH",
    icon: "PenLine",
    color: "#3CC6C0",
    level: "Beginner",
    durationWeeks: 6,
    outcomes: ["Write clear, edited, scannable content", "Plan SEO blog posts around search intent", "Match a brand's tone of voice", "Pitch clients and price your writing"],
    careers: [["Content Writer", 320000], ["Copywriter", 450000], ["Freelance Content Strategist", 400000]],
    forAspirants: false,
    bridgeFrom: [],
    courses: contentWriting,
  },
  {
    slug: "graphic-design",
    title: "Graphic Design",
    tagline: "Design posters, posts and brand identities that make shops stand out.",
    category: "NON_TECH",
    icon: "Palette",
    color: "#C2397A",
    level: "Beginner → Advanced",
    durationWeeks: 8,
    outcomes: ["Apply contrast, alignment and typography", "Create social templates in Canva", "Draw vectors and logos in Illustrator", "Deliver brand guidelines to clients"],
    careers: [["Graphic Designer", 330000], ["Brand Designer", 500000], ["Freelance Social Media Designer", 280000]],
    forAspirants: false,
    bridgeFrom: [],
    courses: graphicDesign,
  },
  {
    slug: "video-editing",
    title: "Video Editing",
    tagline: "Edit Reels and YouTube videos with hooks, pace and polish.",
    category: "NON_TECH",
    icon: "Clapperboard",
    color: "#8B5CF6",
    level: "Beginner → Advanced",
    durationWeeks: 6,
    outcomes: ["Structure videos with strong hooks and pacing", "Edit fast in Premiere Pro or CapCut", "Fix audio, grade colour and export right", "Work with creators on briefs and revisions"],
    careers: [["Video Editor", 360000], ["YouTube Editor (freelance)", 420000], ["Motion Designer", 480000]],
    forAspirants: false,
    bridgeFrom: [],
    courses: videoEditing,
  },
  /* ── Aspirant bridge tracks: built on what government-exam aspirants already studied ── */
  {
    slug: "excel-for-aspirants",
    title: "Excel for Aspirants",
    tagline: "You've solved 1,000 DI tables. Now do it in Excel.",
    category: "NON_TECH",
    icon: "FileSpreadsheet",
    color: "#0F9D58",
    level: "Beginner",
    durationWeeks: 6,
    outcomes: [
      "Turn DI-style tables into Excel formulas: growth %, averages, ratios",
      "Use VLOOKUP/XLOOKUP, IF and SUMIFS on real business data",
      "Summarise data with pivot tables and the right chart",
      "Build the monthly MIS report back-office teams send every week",
    ],
    careers: [["MIS Executive", 330000], ["Data Entry / Back-office Analyst", 216000], ["Excel Reporting Associate", 280000], ["Junior Data Analyst", 400000]],
    forAspirants: true,
    bridgeFrom: ["Quant", "Data Interpretation", "Reasoning"],
    courses: excelForAspirants,
  },
  {
    slug: "translation-hindi-english",
    title: "Hindi ↔ English Translation",
    tagline: "Two languages you mastered for the exam. Now get paid per word.",
    category: "NON_TECH",
    icon: "Languages",
    color: "#E8590C",
    level: "Beginner",
    durationWeeks: 6,
    outcomes: [
      "Translate for meaning and register, not word by word",
      "Handle government, legal and business Hindi with a personal glossary",
      "Create Hindi and English subtitles in SRT format",
      "Price your work per word in ₹ and find your first clients",
    ],
    careers: [["Hindi–English Translator", 300000], ["Subtitler / Captioning Associate", 240000], ["Bilingual Content Writer", 320000], ["Localisation Associate", 380000]],
    forAspirants: true,
    bridgeFrom: ["English", "Hindi", "Essay Writing", "GK & Current Affairs"],
    courses: translationHindiEnglish,
  },
  {
    slug: "accounting-tally-gst",
    title: "Accounting, Tally & GST",
    tagline: "Banking awareness taught you the golden rules. Now keep real books.",
    category: "NON_TECH",
    icon: "Calculator",
    color: "#B45309",
    level: "Beginner",
    durationWeeks: 8,
    outcomes: [
      "Pass journal entries with the golden rules and build a trial balance",
      "Record vouchers, stock and GST invoices in Tally Prime",
      "Understand CGST, SGST, IGST and the GSTR-1 / GSTR-3B returns",
      "Keep weekly books for a kirana store or a small distributor",
    ],
    careers: [["Accounts Executive", 300000], ["GST Assistant", 260000], ["Tally Operator", 216000], ["Junior Accountant (CA firm)", 280000]],
    forAspirants: true,
    bridgeFrom: ["Banking Awareness", "Accounts", "Economy", "Quant"],
    courses: accountingTallyGst,
  },
];
const BRIDGE_SLUGS = new Set(TRACK_META.filter((t) => t.forAspirants).map((t) => t.slug));

/* ───────────────────────── Catalogue fields (spec §6, §6.2, §7.3, §7.4) ───────────────────────── */
// Each seeded course → best-matching skill (ids from ./catalog.js), one-line outcome and "who this is for".
// `level` overrides align a course with its skill's formats (e.g. Content Writing is offered as STANDARD / ADVANCED).
// Pilot skills (UI/UX, Short-Form Video, Frontend) run as intakes with enrolment dates; the rest are self-paced.
const DURATION_DAYS = { BEGINNER: 10, INTERMEDIATE: 15, ADVANCED: 20, STANDARD: 10 };
const COURSE_CATALOG = {
  "web-foundations": { skill: "frontend-development", outcome: "Build and deploy a responsive business landing page.", whoFor: "Beginners who want to build websites. No coding experience needed.", intake: { opens: 6, closes: 24, capacity: 120 } },
  "react-for-freelancers": { skill: "frontend-development", outcome: "Ship a React site with routing, forms and an API, ready for a client.", whoFor: "Learners who know HTML, CSS and basic JavaScript and want client-style briefs.", intake: { opens: 6, closes: 24, capacity: 80 } },
  "flutter-first-app": { skill: "frontend-development", outcome: "Build and publish a working Android app with Flutter.", whoFor: "Beginners who want to build mobile app screens and logic." },
  "firebase-for-apps": { skill: "frontend-development", outcome: "Add sign-in and a live database to a mobile app.", whoFor: "Flutter learners ready to connect apps to real data.", status: "PAUSED" },
  "figma-ui-design": { skill: "ui-ux-design", outcome: "Turn a brief into wireframes and a hi-fi Figma prototype.", whoFor: "Beginners who want to design apps and websites in Figma.", intake: { opens: 4, closes: 21, capacity: 100 } },
  "ux-case-studies": { skill: "ui-ux-design", outcome: "Run quick research and present it as a clear case study.", whoFor: "Learners who can use Figma and want to work from client-style briefs.", intake: { opens: 4, closes: 21, capacity: 60 } },
  "excel-sql-analytics": { skill: "basic-data-analytics", outcome: "Clean a messy dataset and report KPIs with Excel and SQL.", whoFor: "Beginners comfortable with numbers who want to work with data." },
  "power-bi-dashboards": { skill: "basic-data-analytics", outcome: "Build a client-ready Power BI dashboard from raw data.", whoFor: "Learners who know Excel basics and want to build dashboards." },
  "python-ai-automation": { skill: "ai-automation-no-code", outcome: "Automate a repeat business task with Python and an AI API.", whoFor: "Beginners curious about automation. Basic computer skills are enough." },
  "no-code-ai-workflows": { skill: "ai-automation-no-code", outcome: "Connect apps into a reliable no-code workflow with AI steps.", whoFor: "Anyone who wants to automate small-business tasks without code." },
  "digital-marketing-launchpad": { skill: "seo", outcome: "Audit a small business's search and social presence and plan fixes.", whoFor: "Beginners who want to start in digital marketing." },
  "meta-ads-d2c": { skill: "meta-ads", outcome: "Plan, launch and optimise a Meta Ads campaign for a D2C brand.", whoFor: "Learners who know social media basics and want to run paid campaigns." },
  "content-writing-that-pays": { skill: "content-writing-ugc", level: "STANDARD", outcome: "Write captions, product copy and a reel script to a brief.", whoFor: "Anyone who writes clearly in English or Hinglish and wants writing work." },
  "copywriting-for-conversions": { skill: "content-writing-ugc", level: "ADVANCED", outcome: "Write and test campaign copy that drives a clear action.", whoFor: "Writers who already write to briefs and want to own campaign messaging." },
  "graphic-design-essentials": { skill: "canva-graphic-design", outcome: "Design a set of on-brand social posts and ad creatives.", whoFor: "Beginners who want to make designs for local brands." },
  "brand-identity-design": { skill: "professional-graphic-design", outcome: "Deliver a small brand identity with a documented rationale.", whoFor: "Designers who handle client briefs and want complex brand work." },
  "video-editing-reels": { skill: "short-form-video-editing", outcome: "Edit a captioned Reel with a strong hook from raw footage.", whoFor: "Beginners with a phone or laptop who want to edit short videos.", intake: { opens: 5, closes: 18, capacity: 120 } },
  "advanced-premiere-storytelling": { skill: "short-form-video-editing", outcome: "Edit a campaign set of variants with QA notes and rationale.", whoFor: "Editors who deliver client edits and want complex, paced storytelling.", intake: { opens: 12, closes: 10, capacity: 40, full: true } },
  "excel-from-di-to-mis": { skill: "excel-google-sheets", outcome: "Build an MIS report with lookups, pivots and charts.", whoFor: "Exam aspirants and beginners who are good with numbers." },
  "excel-data-entry-essentials": { skill: "excel-google-sheets", outcome: "Enter, clean and check data accurately in Excel and Sheets.", whoFor: "Beginners who want reliable data-entry and spreadsheet work." },
  "hindi-english-translation-pro": { skill: "content-writing-ugc", level: "STANDARD", outcome: "Translate business content between Hindi and English to a brief.", whoFor: "Aspirants and learners strong in both Hindi and English." },
  "hindi-subtitling-basics": { skill: "short-form-video-editing", outcome: "Subtitle a short video in Hindi with correct timing.", whoFor: "Beginners who want caption and subtitle work for creators." },
  "tally-prime-gst-essentials": { skill: "virtual-assistant", level: "STANDARD", outcome: "Record entries and prepare GST-ready books in Tally Prime.", whoFor: "Aspirants with Accounts or Banking prep who want office operations work." },
  "bookkeeping-for-small-shops": { skill: "excel-google-sheets", outcome: "Keep simple daily books for a small shop in a spreadsheet.", whoFor: "Beginners who want to help local shops keep their accounts." },
};

function catalogFields(raw) {
  const meta = COURSE_CATALOG[raw.slug] || {};
  const level = meta.level || raw.level;
  const intake = meta.intake;
  return {
    level,
    skillId: meta.skill ? `sk_${meta.skill}` : null,
    durationDays: DURATION_DAYS[level] || 10,
    outcome: meta.outcome || "",
    whoFor: meta.whoFor || "",
    status: meta.status || (intake?.full ? "FULL" : intake ? "ENROLMENT_OPEN" : "PUBLISHED"),
    capacity: intake ? intake.capacity : null,
    enrolmentOpensAt: intake ? daysAgo(intake.opens) : null,
    enrolmentClosesAt: intake ? daysAgo(-intake.closes) : null, // negative = days from now
  };
}

/* ───────────────────────── Courses ───────────────────────── */
const LETTERS = "abcdefgh";
const courseId = (slug) => `co_${slug}`;

function buildCourse(raw, track) {
  const id = courseId(raw.slug);
  const mentor = usersById[raw.mentorId];
  let durationMinutes = 0;
  let lessonsCount = 0;
  const modules = (raw.modules || []).map((m, mi) => {
    const moduleId = `${id}_m${mi + 1}`;
    return {
      id: moduleId,
      title: m.title,
      order: mi + 1,
      lessons: m.lessons.map((l, li) => {
        durationMinutes += l.durationMinutes;
        lessonsCount += 1;
        return {
          id: `ls_${raw.slug}_${mi + 1}_${li + 1}`,
          title: l.title,
          type: l.type,
          durationMinutes: l.durationMinutes,
          order: li + 1,
          isPreview: Boolean(l.isPreview),
          courseId: id,
          moduleId,
          content: l.content || "",
          videoUrl: l.videoUrl ?? null,
          quiz:
            l.type === "QUIZ" && l.quiz
              ? {
                  questions: l.quiz.questions.map((q, qi) => ({
                    id: `q${qi + 1}`,
                    prompt: q.prompt,
                    options: q.options.map((text, oi) => ({ id: LETTERS[oi], text })),
                    correctOptionId: LETTERS[q.correct],
                    explanation: q.explanation,
                  })),
                }
              : null,
          assignment: l.type === "ASSIGNMENT" && l.assignment ? { brief: l.assignment.brief, rubric: l.assignment.rubric, submissionType: l.assignment.submissionType || "LINK" } : null,
        };
      }),
    };
  });
  return {
    id,
    slug: raw.slug,
    trackId: track.id,
    track: { id: track.id, slug: track.slug, title: track.title, color: track.color },
    title: raw.title,
    subtitle: raw.subtitle,
    description: raw.description,
    level: raw.level,
    languages: raw.languages,
    cover: raw.cover,
    mentorId: raw.mentorId,
    mentor: mentor ? { id: mentor.id, name: mentor.name, avatarUrl: mentor.avatarUrl, headline: mentor.headline } : null,
    durationMinutes,
    lessonsCount,
    rating: raw.rating,
    ratingsCount: raw.ratingsCount,
    studentsCount: raw.studentsCount,
    skills: raw.skills,
    whatYouBuild: raw.whatYouBuild,
    requirements: raw.requirements,
    priceINR: raw.priceINR,
    payLater: false, // spec §6.2: 100% advance payment; pay-later is retired
    isFree: raw.priceINR === 0,
    ...catalogFields(raw),
    modules,
    createdAt: daysAgo(raw.createdDaysAgo ?? 90),
  };
}

const courses = [];
const tracks = TRACK_META.map(({ courses: rawCourses, careers, ...meta }) => {
  const track = { id: `t_${meta.slug}`, ...meta };
  const built = (rawCourses || []).map((raw) => buildCourse(raw, track));
  courses.push(...built);
  return {
    ...track,
    coursesCount: built.length,
    studentsCount: built.reduce((s, c) => s + c.studentsCount, 0),
    outcomes: meta.outcomes,
    careers: careers.map(([title, avgPayINR]) => ({ title, avgPayINR })),
    courseIds: built.map((c) => c.id),
    createdAt: daysAgo(300),
  };
});

// One real (public sample) clip so the player shows a playable video: practice footage in the editing course.
const editing = courses.find((c) => c.slug === "video-editing-reels");
const practiceClip = editing?.modules[1]?.lessons.find((l) => l.type === "VIDEO");
if (practiceClip) practiceClip.videoUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const bySlug = Object.fromEntries(courses.map((c) => [c.slug, c]));
const flatLessons = (c) => c.modules.flatMap((m) => m.lessons);

/* ───────────────────────── Enrollments ───────────────────────── */
function enrollment(userId, course, percent, { started, completedDaysAgo = null, id } = {}) {
  const lessons = flatLessons(course);
  const n = percent >= 100 ? lessons.length : Math.min(lessons.length - 1, Math.round((lessons.length * percent) / 100));
  const done = lessons.slice(0, n);
  const passedQuizIds = done.filter((l) => l.type === "QUIZ").map((l) => l.id);
  return {
    id: id || `en_${userId}_${course.slug}`,
    userId,
    courseId: course.id,
    progressPercent: Math.round((n / lessons.length) * 100),
    completedLessonIds: done.map((l) => l.id),
    lastLessonId: percent >= 100 ? lessons[lessons.length - 1].id : (lessons[n] || lessons[0]).id,
    startedAt: daysAgo(started),
    completedAt: percent >= 100 ? daysAgo(completedDaysAgo ?? 1) : null,
    passedQuizIds,
    updatedAt: percent >= 100 ? daysAgo(completedDaysAgo ?? 1) : null,
    createdAt: daysAgo(started),
  };
}

const enrollments = [];
const studentPlan = [
  ["web-foundations", 100, { started: 70, completedDaysAgo: 24 }, hoursAgo(24 * 24)],
  ["react-for-freelancers", 45, { started: 18 }, hoursAgo(3)],
  ["figma-ui-design", 70, { started: 32 }, hoursAgo(28)],
  ["digital-marketing-launchpad", 15, { started: 6 }, hoursAgo(80)],
];
for (const [slug, pct, opts, updatedAt] of studentPlan) {
  const c = bySlug[slug];
  if (!c) continue;
  enrollments.push({ ...enrollment("u_student", c, pct, opts), updatedAt });
}

// other students — gives mentors, admin and leaderboards realistic data
const otherStudents = core.users.filter((u) => u.id.startsWith("s_"));
// random picks come from the original 9 tracks only, so adding bridge courses doesn't reshuffle existing seed data
const randomPool = courses.filter((c) => !BRIDGE_SLUGS.has(c.track.slug));
otherStudents.forEach((s, i) => {
  const count = 1 + Math.floor(rand() * 3);
  const picked = new Set();
  for (let k = 0; k < count; k++) {
    const c = randomPool[Math.floor(rand() * randomPool.length)];
    if (picked.has(c.id)) continue;
    picked.add(c.id);
    const roll = rand();
    const pct = roll > 0.75 ? 100 : Math.round(10 + rand() * 80);
    const started = 10 + Math.floor(rand() * 90);
    const e = enrollment(s.id, c, pct, { started, completedDaysAgo: Math.max(1, started - 8 - (i % 7)) });
    enrollments.push({ ...e, updatedAt: e.completedAt || daysAgo(Math.floor(rand() * 9)) });
  }
});

/* ───────────────────────── Submissions ───────────────────────── */
const assignmentsOf = (c) => flatLessons(c).filter((l) => l.type === "ASSIGNMENT");
const FEEDBACK = [
  "Strong work. Your structure is clean and the deliverable is client-ready. Next time, write a two-line note explaining your choices — clients love context.",
  "Good effort! The core is right. Tighten the details: consistent spacing and one clear call to action would push this to a 90+.",
  "This is genuinely portfolio-worthy. I'd add a short before/after or a problem statement at the top so a recruiter gets it in 10 seconds.",
  "Solid basics. You missed one rubric item (see the brief again), but the quality of what you did is high. Resubmit if you want a better score.",
  "Nice attention to the Indian context — that's exactly what local clients notice. Polish the final 10% and this is a paid-gig sample.",
];
const SAMPLE_TEXT = [
  "Here's my submission. I followed the brief step by step and noted my decisions at the end. Would love feedback on what to improve first.",
  "Done! I tried two versions and kept the one that felt clearer. Link has everything, including my notes.",
  "Submitting my work for review. I wasn't sure about the last rubric point, so I explained my approach in the notes section.",
];
const submissions = [];
let subN = 0;
function addSubmission(userId, lesson, { reviewed, score, daysOld, link, text, reviewer, feedback }) {
  subN += 1;
  submissions.push({
    id: `sub_${subN}`,
    userId,
    courseId: lesson.courseId,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    text: text ?? SAMPLE_TEXT[subN % SAMPLE_TEXT.length],
    link: link ?? (lesson.assignment?.submissionType === "LINK" ? `https://drive.google.com/file/d/campus-demo-${subN}/view` : null),
    status: reviewed ? "REVIEWED" : "SUBMITTED",
    score: reviewed ? score : null,
    maxScore: 100,
    feedback: reviewed ? (feedback ?? FEEDBACK[subN % FEEDBACK.length]) : null,
    reviewedById: reviewed ? reviewer : null,
    createdAt: daysAgo(daysOld),
    reviewedAt: reviewed ? daysAgo(Math.max(0, daysOld - 2)) : null,
  });
}

// the demo student
const wf = bySlug["web-foundations"];
if (wf) assignmentsOf(wf).forEach((l, i) => addSubmission("u_student", l, { reviewed: true, score: [88, 92, 79, 95][i % 4], daysOld: 60 - i * 10, reviewer: wf.mentorId, link: `https://aarav-dev.netlify.app/${["portfolio", "landing", "todo", "client-site"][i % 4]}` }));
const fig = bySlug["figma-ui-design"];
if (fig) {
  const done = new Set(enrollments.find((e) => e.userId === "u_student" && e.courseId === fig.id)?.completedLessonIds || []);
  assignmentsOf(fig)
    .filter((l) => done.has(l.id))
    .forEach((l, i) => addSubmission("u_student", l, { reviewed: i === 0, score: 86, daysOld: 20 - i * 6, reviewer: fig.mentorId, link: "https://www.figma.com/file/campus-demo-homestay" }));
}
const rf = bySlug["react-for-freelancers"];
if (rf) {
  const done = new Set(enrollments.find((e) => e.userId === "u_student" && e.courseId === rf.id)?.completedLessonIds || []);
  assignmentsOf(rf)
    .filter((l) => done.has(l.id))
    .forEach((l) => addSubmission("u_student", l, { reviewed: false, daysOld: 1, link: "https://github.com/aarav/react-client-starter" }));
}

// other students — a mix of pending and reviewed across every mentor's courses
enrollments
  .filter((e) => e.userId !== "u_student")
  .forEach((e) => {
    const c = courses.find((x) => x.id === e.courseId);
    const done = new Set(e.completedLessonIds);
    const eligible = assignmentsOf(c).filter((l) => done.has(l.id));
    eligible.slice(-2).forEach((l, i) => {
      const pending = rand() > 0.55 || i === eligible.length - 1;
      addSubmission(e.userId, l, { reviewed: !pending, score: 65 + Math.floor(rand() * 33), daysOld: pending ? Math.floor(rand() * 4) : 6 + Math.floor(rand() * 30), reviewer: c.mentorId });
    });
  });
// guarantee a fresh pending queue for the demo mentor (Priya, UI/UX)
otherStudents.slice(0, 4).forEach((s, i) => {
  const c = bySlug[i % 2 ? "ux-case-studies" : "figma-ui-design"];
  const l = c && assignmentsOf(c)[0];
  if (!l) return;
  if (!enrollments.some((e) => e.userId === s.id && e.courseId === c.id)) enrollments.push({ ...enrollment(s.id, c, 60, { started: 20 + i }), updatedAt: hoursAgo(5 + i * 7) });
  if (!submissions.some((x) => x.userId === s.id && x.lessonId === l.id)) addSubmission(s.id, l, { reviewed: false, daysOld: i % 2 });
});

/* ───────────────────────── Aspirant bridge enrollments ─────────────────────────
 * u_aspirant (Pooja, SSC CGL): Excel full course ~45% (incl. a mentor-reviewed assignment), Tally course ~15%.
 * Aspirant students get bridge enrollments too; s_10 (IBPS PO) has finished the Tally course → certificate. */
const aspirantPlan = [
  ["u_aspirant", "excel-from-di-to-mis", 45, { started: 24 }, hoursAgo(5)],
  ["u_aspirant", "tally-prime-gst-essentials", 15, { started: 7 }, hoursAgo(30)],
  ["s_5", "excel-from-di-to-mis", 72, { started: 40 }, hoursAgo(20)],
  ["s_10", "tally-prime-gst-essentials", 100, { started: 58, completedDaysAgo: 9 }, null],
  ["s_10", "excel-data-entry-essentials", 34, { started: 8 }, daysAgo(2)],
  ["s_16", "hindi-english-translation-pro", 40, { started: 30 }, daysAgo(1)],
  ["s_23", "hindi-english-translation-pro", 75, { started: 35 }, hoursAgo(9)],
  ["s_23", "hindi-subtitling-basics", 34, { started: 12 }, daysAgo(4)],
  ["s_29", "excel-data-entry-essentials", 67, { started: 15 }, daysAgo(3)],
  ["s_36", "hindi-subtitling-basics", 34, { started: 10 }, daysAgo(2)],
  ["s_42", "bookkeeping-for-small-shops", 67, { started: 18 }, daysAgo(1)],
  ["s_42", "excel-from-di-to-mis", 20, { started: 9 }, daysAgo(5)],
];
for (const [userId, slug, pct, opts, updatedAt] of aspirantPlan) {
  const c = bySlug[slug];
  if (!c || enrollments.some((e) => e.userId === userId && e.courseId === c.id)) continue;
  const e = enrollment(userId, c, pct, opts);
  enrollments.push({ ...e, updatedAt: updatedAt || e.completedAt });
}
const doneAssignments = (userId, slug) => {
  const c = bySlug[slug];
  const e = c && enrollments.find((x) => x.userId === userId && x.courseId === c.id);
  const done = new Set(e?.completedLessonIds || []);
  return c ? assignmentsOf(c).filter((l) => done.has(l.id)) : [];
};
// Pooja's reviewed DI-to-Excel workbook
doneAssignments("u_aspirant", "excel-from-di-to-mis")
  .slice(0, 1)
  .forEach((l) =>
    addSubmission("u_aspirant", l, {
      reviewed: true,
      score: 84,
      daysOld: 6,
      reviewer: "m_4",
      link: "https://docs.google.com/spreadsheets/d/pooja-di-to-excel-workbook",
      text: "Maine SSC CGL 2023 ka ek DI set (5 saal, 5 states ka wheat production) Excel mein banaya hai. Growth %, average aur ratio formulas se nikale, aur XLOOKUP se state ka data. Aapke feedback ka intezaar rahega.",
      feedback:
        "Bahut badhiya, Pooja! Your growth % column is exactly how you'd solve it in a DI set — only now it takes one formula instead of ten minutes. Two fixes for 90+: lock the base-year cell with $ so the formula copies correctly, and wrap XLOOKUP in IFERROR so a missing state shows \"Not found\" instead of #N/A. This is already good enough to show in an MIS interview.",
    }),
  );
// other aspirants: a pending queue for Arvind (Excel) and Debjani (translation), reviewed work for s_10
doneAssignments("s_5", "excel-from-di-to-mis").forEach((l, i, arr) => addSubmission("s_5", l, { reviewed: i < arr.length - 1, score: 81 + i * 5, daysOld: i < arr.length - 1 ? 14 : 1, reviewer: "m_4" }));
doneAssignments("s_10", "tally-prime-gst-essentials").forEach((l, i) => addSubmission("s_10", l, { reviewed: true, score: [88, 92, 86][i % 3], daysOld: 30 - i * 9, reviewer: "m_3" }));
doneAssignments("s_23", "hindi-english-translation-pro").forEach((l, i, arr) => addSubmission("s_23", l, { reviewed: i < arr.length - 1, score: 87, daysOld: i < arr.length - 1 ? 12 : 0, reviewer: "m_5" }));
doneAssignments("s_16", "hindi-english-translation-pro").forEach((l) => addSubmission("s_16", l, { reviewed: false, daysOld: 2, reviewer: "m_5" }));

/* ───────────────────────── Certificates ───────────────────────── */
function verifyCode(n) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const r = seeded(1000 + n);
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(r() * chars.length)]).join("");
  return `CMP-${part()}-${part()}`;
}
const certificates = enrollments
  .filter((e) => e.completedAt)
  .map((e, i) => {
    const c = courses.find((x) => x.id === e.courseId);
    const t = tracks.find((x) => x.id === c.trackId);
    return {
      id: `cert_${i + 1}`,
      userId: e.userId,
      courseId: c.id,
      courseTitle: c.title,
      trackTitle: t.title,
      mentorName: c.mentor?.name || "",
      score: e.userId === "u_student" ? 91 : 72 + ((i * 7) % 27),
      verifyCode: e.userId === "u_student" ? "CMP-AARV-W3B1" : verifyCode(i),
      issuedAt: e.completedAt,
      createdAt: e.completedAt,
    };
  });

export default { tracks, courses, enrollments, submissions, certificates };
