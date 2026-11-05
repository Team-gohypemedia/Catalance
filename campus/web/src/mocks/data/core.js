/**
 * Core seed: colleges + users (students, mentors, admin). All names are fictional demo data.
 * Shared by every domain — other seed files reference these IDs:
 *   users: "u_student" (demo student), "u_aspirant" (demo govt-exam aspirant), "u_mentor" (demo mentor), "u_admin",
 *          mentors "m_2".."m_8", students "s_1".."s_48" (s_5, s_10, s_16, s_23, s_29, s_36, s_42 are aspirants)
 *   colleges: "c_1".."c_16"
 */
import { daysAgo, seeded } from "../utils";
import { divisionFor } from "@/lib/utils";

const rand = seeded(7);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

export const colleges = [
  ["Narmada Institute of Technology", "NIT-J", "Jabalpur", "Madhya Pradesh", "ENGINEERING", "Web Development"],
  ["Shivalik College of Engineering", "SCE", "Dehradun", "Uttarakhand", "ENGINEERING", "App Development"],
  ["Thar Desert Govt. Polytechnic", "TDGP", "Bikaner", "Rajasthan", "POLYTECHNIC", "UI/UX Design"],
  ["Kaveri Arts & Science College", "KASC", "Tiruchirappalli", "Tamil Nadu", "ARTS_SCIENCE", "Content Writing"],
  ["Ganga Commerce College", "GCC", "Patna", "Bihar", "COMMERCE", "Digital Marketing"],
  ["Deccan School of Design", "DSD", "Pune", "Maharashtra", "DESIGN", "Graphic Design"],
  ["Brahmaputra Engineering College", "BEC", "Guwahati", "Assam", "ENGINEERING", "Data Analytics"],
  ["Malwa Institute of Management", "MIM", "Indore", "Madhya Pradesh", "MANAGEMENT", "Digital Marketing"],
  ["Sahyadri College of Technology", "SCT", "Kolhapur", "Maharashtra", "ENGINEERING", "Web Development"],
  ["Hooghly Arts College", "HAC", "Howrah", "West Bengal", "ARTS_SCIENCE", "Video Editing"],
  ["Godavari Institute of Engineering", "GIE", "Rajahmundry", "Andhra Pradesh", "ENGINEERING", "AI & Automation"],
  ["Aravalli Commerce & Arts College", "ACAC", "Udaipur", "Rajasthan", "COMMERCE", "Content Writing"],
  ["Konkan Polytechnic", "KP", "Ratnagiri", "Maharashtra", "POLYTECHNIC", "Video Editing"],
  ["Vindhya Science College", "VSC", "Rewa", "Madhya Pradesh", "ARTS_SCIENCE", "Data Analytics"],
  ["Coromandel Institute of Technology", "CIT", "Nellore", "Andhra Pradesh", "ENGINEERING", "App Development"],
  ["Doaba College of Design", "DCD", "Jalandhar", "Punjab", "DESIGN", "UI/UX Design"],
].map(([name, shortName, city, state, type, topSkill], i) => ({
  id: `c_${i + 1}`,
  name,
  shortName,
  city,
  state,
  type,
  topSkill,
  verified: i < 14,
  studentsCount: 0,
  totalPoints: 0,
  avgPoints: 0,
  rank: 0,
  rankChange: 0,
  createdAt: daysAgo(200 - i * 5),
}));

const collegeRef = (c) => (c ? { id: c.id, name: c.name, shortName: c.shortName, city: c.city } : null);

const baseUser = {
  avatarUrl: null,
  headline: null,
  bio: null,
  phone: null,
  state: null,
  year: null,
  stream: null,
  goal: null,
  language: "en",
  interests: [],
  skillLevel: null,
  skills: [],
  links: {},
  onboarded: true,
  xp: 0,
  coins: 0,
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
  collegeId: null,
  college: null,
  city: null,
  password: "campus123",
  status: "ACTIVE",
};

const firstNames = ["Aditi", "Rohan", "Sneha", "Vikram", "Ananya", "Karthik", "Meera", "Arjun", "Ishita", "Siddharth", "Pooja", "Rahul", "Divya", "Nikhil", "Kavya", "Harsh", "Riya", "Manish", "Tanvi", "Aman", "Lakshmi", "Yash", "Neha", "Abhishek", "Shreya", "Varun", "Nandini", "Kunal", "Priyanka", "Gaurav", "Fatima", "Imran", "Simran", "Deepak", "Anjali", "Suresh", "Bhavna", "Tarun", "Ayesha", "Rajat", "Swati", "Mohit", "Zoya", "Pranav", "Ritika", "Sahil", "Jyoti", "Omkar"];
const lastNames = ["Verma", "Iyer", "Das", "Patel", "Reddy", "Kumar", "Singh", "Joshi", "Nair", "Gupta", "Mishra", "Khan", "Rao", "Banerjee", "Yadav", "Pillai", "Sharma", "Chauhan", "Shaikh", "Menon"];
const streams = ["B.Tech CSE", "B.Tech ECE", "BCA", "B.Sc IT", "B.Com", "BBA", "BA English", "B.Des", "Diploma CS", "BA Mass Comm", "B.Sc Maths"];
const skillPool = ["React", "JavaScript", "Figma", "UI Design", "Python", "SQL", "Excel", "SEO", "Copywriting", "Canva", "Premiere Pro", "Instagram Ads", "Node.js", "Flutter", "Power BI", "Illustrator", "Blog Writing", "ChatGPT Prompting", "Tailwind CSS", "Video Editing"];
const trackSlugs = ["web-development", "app-development", "ui-ux-design", "data-analytics", "ai-automation", "digital-marketing", "content-writing", "graphic-design", "video-editing"];

const students = firstNames.map((first, i) => {
  const college = colleges[Math.floor(rand() * colleges.length)];
  const seasonPoints = Math.round(Math.pow(rand(), 1.8) * 9000) + 40;
  const lifetimePoints = seasonPoints + Math.round(rand() * 12000);
  const stage = seasonPoints > 6000 ? 5 : seasonPoints > 3500 ? 4 : seasonPoints > 1500 ? 3 : seasonPoints > 500 ? 2 : 1;
  const earned = stage >= 3 ? Math.round(rand() * 40 + stage * 6) * 500 : 0;
  const name = `${first} ${pick(lastNames)}`;
  return {
    ...baseUser,
    id: `s_${i + 1}`,
    email: `${first.toLowerCase()}${i + 1}@student.campus.dev`,
    name,
    username: `${first.toLowerCase()}${i + 1}`,
    role: "STUDENT",
    collegeId: college.id,
    college: collegeRef(college),
    city: college.city,
    state: college.state,
    year: 1 + Math.floor(rand() * 4),
    stream: pick(streams),
    goal: pick(["FIRST_INCOME", "JOB", "FREELANCE_CAREER", "SKILL_UP"]),
    language: pick(["en", "hinglish", "hi", "ta", "te", "bn", "mr"]),
    interests: [pick(trackSlugs), pick(trackSlugs)].filter((v, k, a) => a.indexOf(v) === k),
    skillLevel: pick(["NEW", "SOME", "CONFIDENT"]),
    skills: [pick(skillPool), pick(skillPool), pick(skillPool)].filter((v, k, a) => a.indexOf(v) === k),
    headline: null,
    xp: lifetimePoints,
    coins: Math.round(lifetimePoints / 10),
    streak: Math.floor(rand() * 40),
    longestStreak: 20 + Math.floor(rand() * 60),
    seasonPoints,
    lifetimePoints,
    division: divisionFor(seasonPoints),
    ladderStage: stage,
    walletBalanceINR: Math.round(earned * 0.3),
    lifetimeEarnedINR: earned,
    createdAt: daysAgo(10 + Math.floor(rand() * 300)),
  };
});

const mentorSeed = [
  ["Priya Nair", "Senior Product Designer · 7 yrs freelancing", ["UI/UX Design", "Figma", "Design Systems"], "Freelance · ex-Swiggy", 0, ["en", "hinglish", "ta"]],
  ["Rahul Mehta", "Full-stack developer, 120+ client projects", ["React", "Node.js", "Web Development"], "Catalance Top Freelancer", 299, ["en", "hi", "hinglish"]],
  ["Sana Qureshi", "Performance marketer for D2C brands", ["Digital Marketing", "Meta Ads", "SEO"], "Growth consultant", 199, ["en", "hinglish", "hi"]],
  ["Arvind Krishnan", "Data analyst turned freelance BI consultant", ["Data Analytics", "SQL", "Power BI"], "Freelance · ex-Mu Sigma", 249, ["en", "ta", "te"]],
  ["Debjani Roy", "Copywriter & content strategist", ["Content Writing", "Copywriting", "Brand Voice"], "Freelance writer", 0, ["en", "bn", "hi"]],
  ["Farhan Ali", "Video editor for creators with 5M+ subs", ["Video Editing", "Premiere Pro", "After Effects"], "Freelance editor", 149, ["en", "hi", "hinglish"]],
  ["Kiran Patil", "Flutter developer, 30+ apps shipped", ["App Development", "Flutter", "Firebase"], "Freelance mobile dev", 199, ["en", "mr", "hi"]],
  ["Meghna Bose", "Brand & graphic designer", ["Graphic Design", "Illustrator", "Branding"], "Studio founder", 0, ["en", "bn"]],
];

const allDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const mentors = mentorSeed.map(([name, headline, expertise, company, priceINR, languages], i) => ({
  ...baseUser,
  id: i === 0 ? "u_mentor" : `m_${i + 1}`,
  email: i === 0 ? "mentor@campus.dev" : `${name.split(" ")[0].toLowerCase()}@mentor.campus.dev`,
  name,
  username: name.toLowerCase().replace(/[^a-z]+/g, ""),
  role: "MENTOR",
  headline,
  bio: `${headline}. I mentor on Campus because I wish someone had shown me how real client work happens when I was in college.`,
  city: pick(["Bengaluru", "Mumbai", "Pune", "Delhi", "Hyderabad", "Kolkata", "Chennai"]),
  language: languages[0],
  skills: expertise,
  mentorProfile: {
    headline,
    expertise,
    company,
    rating: Math.round((4.6 + rand() * 0.4) * 10) / 10,
    reviewsCount: 30 + Math.floor(rand() * 200),
    sessionsCount: 60 + Math.floor(rand() * 500),
    priceINR,
    languages,
    yearsExperience: 4 + Math.floor(rand() * 8),
    availability: allDays
      .filter(() => rand() > 0.35)
      .map((day) => ({ day, slots: ["10:00", "13:00", "18:30", "20:00"].filter(() => rand() > 0.3) }))
      .filter((d) => d.slots.length),
  },
  createdAt: daysAgo(400 - i * 20),
}));

const demoCollege = colleges[0];
const demoStudent = {
  ...baseUser,
  id: "u_student",
  email: "student@campus.dev",
  name: "Aarav Sharma",
  username: "aarav",
  role: "STUDENT",
  headline: "3rd-year B.Tech CSE · learning web dev, first client done",
  bio: "Small-town coder from Jabalpur. I like building things people actually use.",
  collegeId: demoCollege.id,
  college: collegeRef(demoCollege),
  city: "Jabalpur",
  state: "Madhya Pradesh",
  year: 3,
  stream: "B.Tech CSE",
  goal: "FIRST_INCOME",
  language: "hinglish",
  interests: ["web-development", "ui-ux-design"],
  skillLevel: "SOME",
  skills: ["HTML", "CSS", "JavaScript", "React", "Figma"],
  links: { github: "https://github.com/", linkedin: "https://linkedin.com/" },
  xp: 6840,
  coins: 684,
  streak: 12,
  longestStreak: 31,
  seasonPoints: 2380,
  lifetimePoints: 6840,
  division: divisionFor(2380),
  ladderStage: 3,
  walletBalanceINR: 1850,
  lifetimeEarnedINR: 4300,
  createdAt: daysAgo(120),
};

const adminUser = {
  ...baseUser,
  id: "u_admin",
  email: "admin@campus.dev",
  name: "Campus Admin",
  username: "campusadmin",
  role: "ADMIN",
  headline: "Catalance Campus team",
  createdAt: daysAgo(500),
};

// Staff roles from spec v1.0 §3 (one account, role-based access)
const staffUser = (id, email, name, username, role, headline) => ({ ...baseUser, id, email, name, username, role, headline, createdAt: daysAgo(400) });
const evaluatorUser = staffUser("u_evaluator", "evaluator@campus.dev", "Kavya Menon", "kavyaevaluator", "EVALUATOR", "Assessment evaluator");
const pmUser = staffUser("u_pm", "pm@campus.dev", "Rohit Bansal", "rohitpm", "PROJECT_MANAGER", "Project Manager, Catalance");
const financeUser = staffUser("u_finance", "finance@campus.dev", "Neha Kapoor", "nehafinance", "FINANCE", "Finance, Catalance");

// Government-exam aspirants among the students (deterministic, no extra rand() calls so other seeds stay stable)
const aspirantProfiles = [
  { exam: "SSC", examName: "SSC CGL", prepYears: 3, attemptsUsed: 3, strengths: ["Quant", "Data Interpretation", "Reasoning"], interests: ["excel-for-aspirants", "data-analytics"] },
  { exam: "BANKING", examName: "IBPS PO", prepYears: 2, attemptsUsed: 2, strengths: ["Banking Awareness", "Quant", "English"], interests: ["accounting-tally-gst", "excel-for-aspirants"] },
  { exam: "UPSC", examName: "UPSC CSE", prepYears: 4, attemptsUsed: 3, strengths: ["Essay Writing", "Polity", "GK & Current Affairs"], interests: ["content-writing", "translation-hindi-english"] },
  { exam: "STATE_PSC", examName: "BPSC", prepYears: 3, attemptsUsed: 2, strengths: ["Hindi", "GK & Current Affairs", "Essay Writing"], interests: ["translation-hindi-english", "content-writing"] },
  { exam: "RAILWAYS", examName: "RRB NTPC", prepYears: 2, attemptsUsed: 1, strengths: ["Reasoning", "Quant"], interests: ["excel-for-aspirants"] },
  { exam: "TEACHING", examName: "CTET + Super TET", prepYears: 2, attemptsUsed: 2, strengths: ["Hindi", "English"], interests: ["translation-hindi-english"] },
  { exam: "SSC", examName: "SSC CHSL", prepYears: 1, attemptsUsed: 1, strengths: ["English", "Reasoning"], interests: ["excel-for-aspirants", "accounting-tally-gst"] },
];
[4, 9, 15, 22, 28, 35, 41].forEach((idx, i) => {
  const s = students[idx];
  const a = aspirantProfiles[i];
  Object.assign(s, {
    goal: "GOVT_EXAM_BACKUP",
    interests: a.interests,
    year: null,
    stream: s.stream.startsWith("B.") ? `${s.stream} (graduate)` : s.stream,
    aspirant: {
      exam: a.exam,
      examName: a.examName,
      prepYears: a.prepYears,
      dailyMinutes: [45, 60, 30, 45, 60, 30, 45][i],
      attemptsUsed: a.attemptsUsed,
      birthYear: 1998 + (i % 4),
      strengths: a.strengths,
      studyHoursTotal: a.prepYears * 1900 + i * 140,
      mockTestsTaken: a.prepYears * 70 + i * 9,
      bestMockPercentile: 88 + (i % 5) * 2,
      showOnPassport: true,
    },
  });
});

// Demo aspirant: 3 years of SSC CGL prep in Prayagraj, building a backup with Excel + Tally
const demoAspirant = {
  ...baseUser,
  id: "u_aspirant",
  email: "aspirant@campus.dev",
  name: "Pooja Yadav",
  username: "pooja",
  role: "STUDENT",
  headline: "SSC CGL aspirant · 3 years of prep · building Excel & data skills",
  bio: "Preparing for SSC CGL in Prayagraj since 2023. Quant and DI are my strongest subjects, so I'm turning them into Excel and data skills — 45 minutes a day, alongside my prep.",
  collegeId: null,
  college: null,
  city: "Prayagraj",
  state: "Uttar Pradesh",
  year: null,
  stream: "B.Sc Maths (graduate)",
  goal: "GOVT_EXAM_BACKUP",
  language: "hi",
  interests: ["excel-for-aspirants", "accounting-tally-gst"],
  skillLevel: "NEW",
  skills: ["Quant", "Data Interpretation", "MS Excel basics"],
  xp: 1420,
  coins: 142,
  streak: 19,
  longestStreak: 19,
  seasonPoints: 980,
  lifetimePoints: 1420,
  division: divisionFor(980),
  ladderStage: 2,
  aspirant: {
    exam: "SSC",
    examName: "SSC CGL",
    prepYears: 3,
    dailyMinutes: 45,
    attemptsUsed: 2,
    birthYear: 1999,
    strengths: ["Quant", "Data Interpretation", "Reasoning", "English"],
    studyHoursTotal: 5600,
    mockTestsTaken: 214,
    bestMockPercentile: 96,
    showOnPassport: true,
  },
  createdAt: daysAgo(26),
};

// derive college stats from students
for (const c of colleges) {
  const members = [...students, demoStudent].filter((s) => s.collegeId === c.id);
  c.studentsCount = members.length * 37 + 12; // scaled to look like a real campus
  c.totalPoints = members.reduce((sum, s) => sum + s.seasonPoints, 0);
  c.avgPoints = members.length ? Math.round(c.totalPoints / members.length) : 0;
}
[...colleges]
  .sort((a, b) => b.totalPoints - a.totalPoints)
  .forEach((c, i) => {
    c.rank = i + 1;
    rand(); // keep the random sequence stable for anything seeded after this
    c.rankChange = [0, 2, -1, 1, 3, 0, -2, 1, 0, -1, 2, 0, -3, 1, 0, 1][i] ?? 0; // realistic mix of climbs and drops
  });

export default {
  colleges,
  users: [demoStudent, demoAspirant, adminUser, evaluatorUser, pmUser, financeUser, ...mentors, ...students],
};
