/**
 * Aspirant mode: static vocabulary and helpers shared by the landing page, onboarding,
 * profile, dashboard and passport. Shapes mirror API_CONTRACT.md (Aspirant, Track.forAspirants).
 */
import { BookOpenCheck, Calculator, FileSpreadsheet, Landmark, Languages, Scale, School, Shield, Sparkles, TrainFront } from "lucide-react";

/* ── Exams ── */
export const EXAMS = [
  { value: "SSC", label: "SSC", hindi: "एसएससी", icon: Landmark, names: ["SSC CGL", "SSC CHSL", "SSC MTS", "SSC GD", "SSC CPO", "SSC JE", "SSC Stenographer"] },
  { value: "BANKING", label: "Banking", hindi: "बैंकिंग", icon: Landmark, names: ["IBPS PO", "IBPS Clerk", "SBI PO", "SBI Clerk", "RBI Grade B", "RBI Assistant", "IBPS RRB"] },
  { value: "RAILWAYS", label: "Railways", hindi: "रेलवे", icon: TrainFront, names: ["RRB NTPC", "RRB Group D", "RRB ALP", "RRB JE"] },
  { value: "UPSC", label: "UPSC", hindi: "यूपीएससी", icon: Scale, names: ["UPSC CSE", "UPSC CAPF", "UPSC EPFO", "UPSC CDS"] },
  { value: "STATE_PSC", label: "State PSC", hindi: "राज्य PSC", icon: Landmark, names: ["UPPSC", "BPSC", "MPPSC", "RPSC RAS", "UKPSC", "HPSC", "CGPSC", "JPSC", "MPSC", "TNPSC Group 4", "UPSSSC PET"] },
  { value: "TEACHING", label: "Teaching", hindi: "शिक्षक", icon: School, names: ["CTET", "UPTET", "REET", "HTET", "KVS PRT", "DSSSB TGT", "Super TET"] },
  { value: "DEFENCE", label: "Defence", hindi: "रक्षा", icon: Shield, names: ["NDA", "CDS", "AFCAT", "Agniveer"] },
  { value: "OTHER", label: "Other", hindi: "अन्य", icon: BookOpenCheck, names: ["State police SI", "High Court clerk", "LIC AAO", "FCI"] },
];
export const examMeta = (value) => EXAMS.find((e) => e.value === value) || EXAMS[EXAMS.length - 1];

/** Aspirant.strengths vocabulary (exam subjects). */
export const STRENGTHS = ["Quant", "Data Interpretation", "Reasoning", "English", "Hindi", "GK & Current Affairs", "Polity", "Economy", "Banking Awareness", "Essay Writing", "Accounts"];

export const DAILY_MINUTES = [
  { value: 30, label: "30 min", hint: "One short lesson" },
  { value: 45, label: "45 min", hint: "Recommended", recommended: true },
  { value: 60, label: "60 min", hint: "Lesson + practice" },
  { value: 90, label: "90 min", hint: "Fast track" },
];

/** Rough estimates when the aspirant leaves the numbers blank. */
export const estimateStudyHours = (prepYears) => Math.round((Number(prepYears) || 0) * 1850 / 50) * 50; // ~5 h/day
export const estimateMockTests = (prepYears) => Math.round((Number(prepYears) || 0) * 70);

export const EMPTY_ASPIRANT = {
  exam: "",
  examName: "",
  prepYears: 2,
  dailyMinutes: 45,
  attemptsUsed: 0,
  birthYear: "",
  strengths: [],
  studyHoursTotal: "",
  mockTestsTaken: "",
  bestMockPercentile: "",
  showOnPassport: true,
};

/** Normalise an Aspirant (or null) into editable form state. */
export function aspirantToForm(a) {
  if (!a) return { ...EMPTY_ASPIRANT };
  return {
    exam: a.exam || "",
    examName: a.examName || "",
    prepYears: a.prepYears ?? 2,
    dailyMinutes: a.dailyMinutes || 45,
    attemptsUsed: a.attemptsUsed ?? 0,
    birthYear: a.birthYear ? String(a.birthYear) : "",
    strengths: Array.isArray(a.strengths) ? a.strengths : [],
    studyHoursTotal: a.studyHoursTotal ? String(a.studyHoursTotal) : "",
    mockTestsTaken: a.mockTestsTaken ? String(a.mockTestsTaken) : "",
    bestMockPercentile: a.bestMockPercentile === null || a.bestMockPercentile === undefined ? "" : String(a.bestMockPercentile),
    showOnPassport: a.showOnPassport !== false,
  };
}

const toInt = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

/** Form state → Aspirant payload for POST /api/me/onboarding or PATCH /api/me. */
export function formToAspirant(f) {
  const prepYears = Math.max(0, Math.min(8, Number(f.prepYears) || 0));
  return {
    exam: f.exam || "OTHER",
    examName: f.examName.trim() || examMeta(f.exam).names[0] || "Government exam",
    prepYears,
    dailyMinutes: Number(f.dailyMinutes) || 45,
    attemptsUsed: Math.max(0, Math.min(10, Number(f.attemptsUsed) || 0)),
    birthYear: toInt(f.birthYear),
    strengths: f.strengths,
    studyHoursTotal: toInt(f.studyHoursTotal) ?? estimateStudyHours(prepYears),
    mockTestsTaken: toInt(f.mockTestsTaken) ?? estimateMockTests(prepYears),
    bestMockPercentile: toInt(f.bestMockPercentile),
    showOnPassport: !!f.showOnPassport,
  };
}

export function validateAspirantForm(f) {
  const errors = {};
  if (!f.exam) errors.exam = "Choose the exam you're preparing for.";
  if (!f.examName.trim()) errors.examName = "Tell us the exact exam, e.g. SSC CGL.";
  const year = new Date().getFullYear();
  if (f.birthYear && (toInt(f.birthYear) < 1960 || toInt(f.birthYear) > year - 15)) errors.birthYear = `Enter a year between 1960 and ${year - 15}.`;
  if (f.bestMockPercentile && (toInt(f.bestMockPercentile) < 0 || toInt(f.bestMockPercentile) > 100)) errors.bestMockPercentile = "Percentile is between 0 and 100.";
  return errors;
}

/* ── Bridge tracks ── */
export const BRIDGE_SLUGS = ["excel-for-aspirants", "translation-hindi-english", "accounting-tally-gst"];

export const BRIDGE_TRACKS = [
  {
    id: "t_excel-for-aspirants",
    slug: "excel-for-aspirants",
    title: "Excel & Data for Aspirants",
    tagline: "You've solved hundreds of DI tables. Now do the same in Excel, on real data.",
    category: "NON_TECH",
    icon: "FileSpreadsheet",
    color: "#12A150",
    level: "Beginner → Practical",
    durationWeeks: 6,
    coursesCount: 2,
    studentsCount: 3840,
    outcomes: ["Formulas, pivots and charts in Excel and Google Sheets", "Clean messy data and build MIS reports", "Turn DI-style tables into dashboards", "Deliver data-cleanup micro-gigs"],
    careers: [
      { title: "MIS Executive", avgPayINR: 300000 },
      { title: "Junior Data Analyst", avgPayINR: 380000 },
      { title: "Data & reporting freelancer", avgPayINR: 240000 },
    ],
    courseIds: [],
    forAspirants: true,
    bridgeFrom: ["Quant", "Data Interpretation", "Reasoning"],
  },
  {
    id: "t_translation-hindi-english",
    slug: "translation-hindi-english",
    title: "Hindi–English Translation",
    tagline: "Your comprehension and essay practice is a paid skill. Translate, subtitle and localise.",
    category: "NON_TECH",
    icon: "Languages",
    color: "#D98E00",
    level: "Beginner → Practical",
    durationWeeks: 5,
    coursesCount: 2,
    studentsCount: 2910,
    outcomes: ["Translate official, legal and marketing text accurately", "Subtitle videos and caption reels", "Use glossaries and CAT tools", "Find translation clients and price per word"],
    careers: [
      { title: "Translator", avgPayINR: 300000 },
      { title: "Localisation Associate", avgPayINR: 360000 },
      { title: "Subtitle & caption freelancer", avgPayINR: 240000 },
    ],
    courseIds: [],
    forAspirants: true,
    bridgeFrom: ["English", "Hindi", "Essay Writing"],
  },
  {
    id: "t_accounting-tally-gst",
    slug: "accounting-tally-gst",
    title: "Accounting, Tally & GST",
    tagline: "Banking awareness meets real books. Keep accounts and file GST for local businesses.",
    category: "NON_TECH",
    icon: "Calculator",
    color: "#1F9BFF",
    level: "Beginner → Practical",
    durationWeeks: 8,
    coursesCount: 2,
    studentsCount: 3260,
    outcomes: ["Journal entries, ledgers and trial balance", "Run a business's books in Tally Prime", "GST invoices, returns and reconciliation", "Take monthly bookkeeping retainers"],
    careers: [
      { title: "Accounts Assistant", avgPayINR: 260000 },
      { title: "GST filing freelancer", avgPayINR: 300000 },
      { title: "Bookkeeper for small businesses", avgPayINR: 280000 },
    ],
    courseIds: [],
    forAspirants: true,
    bridgeFrom: ["Banking Awareness", "Accounts", "Quant", "Economy"],
  },
];

const BRIDGE_ICONS = { "excel-for-aspirants": FileSpreadsheet, "translation-hindi-english": Languages, "accounting-tally-gst": Calculator };
const NAMED_ICONS = { FileSpreadsheet, Sheet: FileSpreadsheet, Table: FileSpreadsheet, Languages, Calculator, Receipt: Calculator };
export const bridgeIcon = (track) => BRIDGE_ICONS[track?.slug] || NAMED_ICONS[track?.icon] || Sparkles;
export const isBridge = (t) => !!t?.forAspirants || BRIDGE_SLUGS.includes(t?.slug);

/* ── "Your prep already counts" mapper (indicative entry-level pay per month) ── */
export const PREP_MAP = {
  SSC: [
    { subject: "Quantitative Aptitude", skill: "Excel formulas & MIS reports", job: "MIS Executive", pay: [18000, 30000], track: "excel-for-aspirants" },
    { subject: "Data Interpretation", skill: "Dashboards & data analysis", job: "Junior Data Analyst", pay: [25000, 40000], track: "excel-for-aspirants" },
    { subject: "English Comprehension", skill: "Hindi–English translation", job: "Translator / Content Associate", pay: [20000, 35000], track: "translation-hindi-english" },
    { subject: "Reasoning", skill: "Process & quality checks", job: "Operations Analyst", pay: [18000, 28000], track: "excel-for-aspirants" },
    { subject: "General Awareness", skill: "Research & fact-checking", job: "Research Assistant", pay: [18000, 28000], track: "content-writing" },
  ],
  BANKING: [
    { subject: "Banking Awareness", skill: "Tally, GST & bookkeeping", job: "Accounts Assistant", pay: [18000, 30000], track: "accounting-tally-gst" },
    { subject: "Quant & DI", skill: "Excel MIS for BFSI", job: "MIS Executive (BFSI)", pay: [22000, 35000], track: "excel-for-aspirants" },
    { subject: "English Language", skill: "Customer emails & translation", job: "Relationship Executive", pay: [20000, 32000], track: "translation-hindi-english" },
    { subject: "Reasoning", skill: "KYC & credit operations", job: "KYC Analyst", pay: [20000, 30000], track: "accounting-tally-gst" },
    { subject: "Computer Knowledge", skill: "Spreadsheets & data entry", job: "Operations Executive", pay: [16000, 26000], track: "excel-for-aspirants" },
  ],
  RAILWAYS: [
    { subject: "Mathematics", skill: "Excel & reporting", job: "Data Entry / MIS Executive", pay: [16000, 26000], track: "excel-for-aspirants" },
    { subject: "Reasoning", skill: "Inventory & logistics sheets", job: "Logistics Coordinator", pay: [18000, 28000], track: "excel-for-aspirants" },
    { subject: "General Awareness", skill: "Research & content", job: "Research Assistant", pay: [16000, 25000], track: "content-writing" },
    { subject: "Hindi & English", skill: "Translation & typing", job: "Translator / Typist", pay: [16000, 28000], track: "translation-hindi-english" },
  ],
  UPSC: [
    { subject: "Essay & Answer Writing", skill: "Long-form & policy writing", job: "Content Writer / Policy Associate", pay: [30000, 55000], track: "content-writing" },
    { subject: "Polity & Governance", skill: "Policy research", job: "Research Associate (think tank, CSR)", pay: [30000, 50000], track: "content-writing" },
    { subject: "Economy", skill: "Data & report analysis", job: "Junior Analyst", pay: [30000, 45000], track: "excel-for-aspirants" },
    { subject: "Hindi & English", skill: "Official document translation", job: "Translator", pay: [25000, 45000], track: "translation-hindi-english" },
    { subject: "Current Affairs", skill: "Editorial & newsletters", job: "Editorial Assistant", pay: [22000, 35000], track: "content-writing" },
  ],
  STATE_PSC: [
    { subject: "Hindi & State GK", skill: "Hindi content & translation", job: "Translator / Hindi Content Writer", pay: [20000, 35000], track: "translation-hindi-english" },
    { subject: "Essay Writing", skill: "Content writing", job: "Content Writer", pay: [18000, 32000], track: "content-writing" },
    { subject: "CSAT / Quant", skill: "Excel & MIS", job: "MIS Executive", pay: [18000, 30000], track: "excel-for-aspirants" },
    { subject: "Polity & Administration", skill: "Programme coordination", job: "Programme Associate (NGO, CSR)", pay: [22000, 35000], track: "excel-for-aspirants" },
  ],
  TEACHING: [
    { subject: "Child Pedagogy", skill: "Curriculum & lesson design", job: "Curriculum Associate (edtech)", pay: [25000, 40000], track: "content-writing" },
    { subject: "Subject knowledge", skill: "MCQ & question setting", job: "Content Developer", pay: [20000, 35000], track: "content-writing" },
    { subject: "Hindi & English", skill: "Learning-material translation", job: "Translator", pay: [20000, 35000], track: "translation-hindi-english" },
    { subject: "Explaining concepts", skill: "Online tutoring & video lessons", job: "Online Tutor", pay: [15000, 40000], track: "video-editing" },
  ],
};
export const MAPPER_EXAMS = EXAMS.filter((e) => PREP_MAP[e.value]);

/* ── Private age-limit planner (approximate, general category) ── */
const AGE_BY_NAME = [
  [/cgl/i, 32],
  [/chsl/i, 27],
  [/mts/i, 25],
  [/ssc\s*gd/i, 23],
  [/cpo/i, 25],
  [/ibps\s*po|sbi\s*po|rbi\s*grade/i, 30],
  [/clerk|rrb\s*(office|assistant)|ibps\s*rrb|rbi\s*assistant/i, 28],
  [/ntpc|group\s*d|alp/i, 33],
  [/upsc\s*cse|civil/i, 32],
  [/cds/i, 24],
  [/nda/i, 19],
  [/afcat/i, 24],
  [/agniveer/i, 21],
  [/ctet|tet|reet|kvs|dsssb|teacher/i, 40],
];
const AGE_BY_EXAM = { SSC: 32, BANKING: 30, RAILWAYS: 33, UPSC: 32, STATE_PSC: 40, TEACHING: 40, DEFENCE: 24, OTHER: 35 };

/**
 * Approximate eligibility left, computed client-side. Returns null without a birth year.
 * { limit, age, yearsLeft, source, attemptsNote }
 */
export function eligibilityFor(aspirant, now = new Date()) {
  if (!aspirant?.birthYear) return null;
  const hit = AGE_BY_NAME.find(([re]) => re.test(aspirant.examName || ""));
  const limit = hit ? hit[1] : AGE_BY_EXAM[aspirant.exam] ?? 32;
  const age = now.getFullYear() - Number(aspirant.birthYear);
  const isUpsc = aspirant.exam === "UPSC" || /upsc\s*cse|civil/i.test(aspirant.examName || "");
  return {
    limit,
    age,
    yearsLeft: limit - age,
    attemptsNote: isUpsc ? `UPSC CSE allows 6 attempts in the general category. You've used ${aspirant.attemptsUsed ?? 0}.` : null,
  };
}

/* ── Gigs that fit aspirants (marketing) ── */
export const ASPIRANT_GIGS = [
  { title: "Set 50 Quant MCQs with solutions", company: "PrepWise Test Series", payoutINR: 1200, days: 4, skill: "Quant · MCQ setting", from: "Quant" },
  { title: "Translate a 6-page school circular, Hindi → English", company: "Saraswati Vidya Mandir, Kanpur", payoutINR: 800, days: 2, skill: "Translation", from: "English & Hindi" },
  { title: "Month-end bookkeeping in Tally", company: "Gupta Traders, Prayagraj", payoutINR: 1500, days: 5, skill: "Tally · GST", from: "Banking Awareness" },
  { title: "Fact-check a current-affairs monthly PDF", company: "Saarthi Coaching, Patna", payoutINR: 700, days: 3, skill: "Research", from: "GK & Current Affairs" },
];

export const SWITCH_PLAN = [
  { range: "Days 1–30", title: "Bridge", desc: "Finish one bridge track at 45 min a day. Every lesson starts with an “Exam link” to what you already know." },
  { range: "Days 31–60", title: "Proof", desc: "Complete mentor-reviewed assignments and your first micro-gigs. Your proof portfolio fills up." },
  { range: "Days 61–90", title: "Switch", desc: "Mock interviews in Hindi or English with the AI tutor, CV review, and applications with your Skill Passport." },
];
