/**
 * Static marketing content + graceful fallbacks used when an API call fails
 * (so public pages always look complete). Shapes mirror API_CONTRACT.md.
 */
import { BRIDGE_TRACKS } from "@/components/aspirants/data";

export const FALLBACK_STATS = {
  students: 48210,
  colleges: 1260,
  mentors: 340,
  paidOutINR: 18450000,
  gigsCompleted: 21400,
  avgFirstEarningDays: 38,
};

export const TRACK_SLUGS = [
  "web-development",
  "app-development",
  "ui-ux-design",
  "data-analytics",
  "ai-automation",
  "digital-marketing",
  "content-writing",
  "graphic-design",
  "video-editing",
];

export const FALLBACK_TRACKS = [
  {
    id: "t_web-development",
    slug: "web-development",
    title: "Web Development",
    tagline: "Build sites and web apps that clients actually pay for.",
    category: "TECH",
    icon: "Code2",
    color: "#FF5A1F",
    level: "Beginner → Practical",
    durationWeeks: 16,
    coursesCount: 6,
    studentsCount: 12840,
    outcomes: ["Ship responsive sites with HTML, CSS and React", "Build full-stack apps with Node.js and a database", "Deploy client projects and handle revisions", "Price, pitch and deliver your first web gig"],
    careers: [
      { title: "Frontend Developer", avgPayINR: 540000 },
      { title: "Full-stack Freelancer", avgPayINR: 720000 },
      { title: "WordPress / Shopify Developer", avgPayINR: 380000 },
    ],
    courseIds: [],
  },
  {
    id: "t_app-development",
    slug: "app-development",
    title: "App Development",
    tagline: "Flutter apps for shops, startups and your own ideas.",
    category: "TECH",
    icon: "Smartphone",
    color: "#1F9BFF",
    level: "Beginner → Practical",
    durationWeeks: 14,
    coursesCount: 4,
    studentsCount: 6420,
    outcomes: ["Build cross-platform apps with Flutter", "Connect apps to Firebase and REST APIs", "Publish to the Play Store", "Fix bugs in real client codebases"],
    careers: [
      { title: "Flutter Developer", avgPayINR: 600000 },
      { title: "Android Developer", avgPayINR: 560000 },
      { title: "Freelance App Builder", avgPayINR: 650000 },
    ],
    courseIds: [],
  },
  {
    id: "t_ui-ux-design",
    slug: "ui-ux-design",
    title: "UI/UX Design",
    tagline: "Design apps people love using, in Figma.",
    category: "TECH",
    icon: "PenTool",
    color: "#6B4EFF",
    level: "Beginner → Practical",
    durationWeeks: 12,
    coursesCount: 5,
    studentsCount: 9310,
    outcomes: ["Run quick user research and turn it into flows", "Design clean UIs and prototypes in Figma", "Build and use a design system", "Present a case study that wins clients"],
    careers: [
      { title: "Product Designer", avgPayINR: 700000 },
      { title: "UI Designer", avgPayINR: 480000 },
      { title: "Freelance UX Consultant", avgPayINR: 620000 },
    ],
    courseIds: [],
  },
  {
    id: "t_data-analytics",
    slug: "data-analytics",
    title: "Data Analytics",
    tagline: "Excel, SQL and Power BI — turn messy data into decisions.",
    category: "TECH",
    icon: "BarChart3",
    color: "#12A150",
    level: "Beginner → Practical",
    durationWeeks: 12,
    coursesCount: 5,
    studentsCount: 8150,
    outcomes: ["Clean and analyse data in Excel and SQL", "Build dashboards in Power BI", "Tell a clear story with numbers", "Deliver reports for small businesses"],
    careers: [
      { title: "Data Analyst", avgPayINR: 550000 },
      { title: "MIS Executive", avgPayINR: 360000 },
      { title: "BI Freelancer", avgPayINR: 600000 },
    ],
    courseIds: [],
  },
  {
    id: "t_ai-automation",
    slug: "ai-automation",
    title: "AI & Automation",
    tagline: "ChatGPT, no-code and Python to automate boring work.",
    category: "TECH",
    icon: "Bot",
    color: "#0EA5A4",
    level: "Beginner → Intermediate",
    durationWeeks: 10,
    coursesCount: 4,
    studentsCount: 7020,
    outcomes: ["Write prompts that give reliable results", "Automate workflows with Zapier and Make", "Build simple AI tools with Python", "Sell automation to local businesses"],
    careers: [
      { title: "AI Automation Specialist", avgPayINR: 650000 },
      { title: "Prompt Engineer", avgPayINR: 700000 },
      { title: "No-code Freelancer", avgPayINR: 480000 },
    ],
    courseIds: [],
  },
  {
    id: "t_digital-marketing",
    slug: "digital-marketing",
    title: "Digital Marketing",
    tagline: "SEO, Instagram and Meta ads for real D2C brands.",
    category: "NON_TECH",
    icon: "Megaphone",
    color: "#E5484D",
    level: "Beginner → Practical",
    durationWeeks: 12,
    coursesCount: 5,
    studentsCount: 11260,
    outcomes: ["Plan and run Meta and Google ad campaigns", "Grow Instagram pages with a content calendar", "Do SEO audits for local businesses", "Report results clients understand"],
    careers: [
      { title: "Performance Marketer", avgPayINR: 520000 },
      { title: "Social Media Manager", avgPayINR: 400000 },
      { title: "SEO Freelancer", avgPayINR: 450000 },
    ],
    courseIds: [],
  },
  {
    id: "t_content-writing",
    slug: "content-writing",
    title: "Content Writing",
    tagline: "Blogs, copy and scripts for real briefs.",
    category: "NON_TECH",
    icon: "PenLine",
    color: "#D98E00",
    level: "Beginner → Practical",
    durationWeeks: 8,
    coursesCount: 4,
    studentsCount: 9880,
    outcomes: ["Write SEO blogs that rank", "Write product copy and ad lines that sell", "Write scripts for reels and YouTube", "Build a writing portfolio from real briefs"],
    careers: [
      { title: "Content Writer", avgPayINR: 360000 },
      { title: "Copywriter", avgPayINR: 480000 },
      { title: "Freelance Scriptwriter", avgPayINR: 420000 },
    ],
    courseIds: [],
  },
  {
    id: "t_graphic-design",
    slug: "graphic-design",
    title: "Graphic Design",
    tagline: "Logos, posts and brand kits in Canva and Illustrator.",
    category: "NON_TECH",
    icon: "Palette",
    color: "#DB2777",
    level: "Beginner → Practical",
    durationWeeks: 10,
    coursesCount: 4,
    studentsCount: 7640,
    outcomes: ["Master layout, type and colour basics", "Design social posts and ads in Canva", "Create logos and brand kits in Illustrator", "Deliver print-ready files to clients"],
    careers: [
      { title: "Graphic Designer", avgPayINR: 380000 },
      { title: "Brand Designer", avgPayINR: 520000 },
      { title: "Freelance Social Designer", avgPayINR: 400000 },
    ],
    courseIds: [],
  },
  {
    id: "t_video-editing",
    slug: "video-editing",
    title: "Video Editing",
    tagline: "Edit reels and YouTube videos creators pay for.",
    category: "NON_TECH",
    icon: "Clapperboard",
    color: "#7C3AED",
    level: "Beginner → Practical",
    durationWeeks: 8,
    coursesCount: 4,
    studentsCount: 8930,
    outcomes: ["Edit fast in Premiere Pro and CapCut", "Cut reels with hooks, captions and music", "Colour-correct and mix audio", "Work with creators on a weekly schedule"],
    careers: [
      { title: "Video Editor", avgPayINR: 400000 },
      { title: "Reels Editor (freelance)", avgPayINR: 450000 },
      { title: "Motion Graphics Artist", avgPayINR: 560000 },
    ],
    courseIds: [],
  },
  // Aspirant bridge tracks (forAspirants: true, category NON_TECH)
  ...BRIDGE_TRACKS,
];

export const trackBySlug = (slug) => FALLBACK_TRACKS.find((t) => t.slug === slug);

/** Static college leaderboard (fictional) — fallback for GET /api/leaderboard?scope=colleges */
const rawColleges = [
  ["Narmada Institute of Technology", "NIT-J", "Jabalpur", "Madhya Pradesh", "ENGINEERING", "Web Development", 48210, 2],
  ["Kaveri Arts & Science College", "KASC", "Tiruchirappalli", "Tamil Nadu", "ARTS_SCIENCE", "Content Writing", 45980, 1],
  ["Ganga Commerce College", "GCC", "Patna", "Bihar", "COMMERCE", "Digital Marketing", 43120, -1],
  ["Brahmaputra Engineering College", "BEC", "Guwahati", "Assam", "ENGINEERING", "Data Analytics", 40870, 3],
  ["Deccan School of Design", "DSD", "Pune", "Maharashtra", "DESIGN", "Graphic Design", 38450, -2],
  ["Thar Desert Govt. Polytechnic", "TDGP", "Bikaner", "Rajasthan", "POLYTECHNIC", "UI/UX Design", 35210, 4],
  ["Godavari Institute of Engineering", "GIE", "Rajahmundry", "Andhra Pradesh", "ENGINEERING", "AI & Automation", 33900, 0],
  ["Hooghly Arts College", "HAC", "Howrah", "West Bengal", "ARTS_SCIENCE", "Video Editing", 31260, -1],
  ["Malwa Institute of Management", "MIM", "Indore", "Madhya Pradesh", "MANAGEMENT", "Digital Marketing", 29840, 1],
  ["Shivalik College of Engineering", "SCE", "Dehradun", "Uttarakhand", "ENGINEERING", "App Development", 27510, -3],
  ["Sahyadri College of Technology", "SCT", "Kolhapur", "Maharashtra", "ENGINEERING", "Web Development", 25120, 2],
  ["Aravalli Commerce & Arts College", "ACAC", "Udaipur", "Rajasthan", "COMMERCE", "Content Writing", 22870, 0],
  ["Coromandel Institute of Technology", "CIT", "Nellore", "Andhra Pradesh", "ENGINEERING", "App Development", 20330, -2],
  ["Vindhya Science College", "VSC", "Rewa", "Madhya Pradesh", "ARTS_SCIENCE", "Data Analytics", 18740, 1],
  ["Doaba College of Design", "DCD", "Jalandhar", "Punjab", "DESIGN", "UI/UX Design", 16420, 0],
  ["Konkan Polytechnic", "KP", "Ratnagiri", "Maharashtra", "POLYTECHNIC", "Video Editing", 14980, -1],
];

export const FALLBACK_COLLEGE_BOARD = {
  season: { id: "season_fallback", name: "Monsoon Season", number: 7, startsAt: null, endsAt: null },
  items: rawColleges.map(([name, shortName, city, state, type, topSkill, points, change], i) => ({
    rank: i + 1,
    change,
    points,
    college: {
      id: `c_${i + 1}`,
      name,
      shortName,
      city,
      state,
      type,
      topSkill,
      verified: true,
      studentsCount: 400 + ((i * 137) % 900),
      totalPoints: points,
      avgPoints: Math.round(points / (12 + (i % 5))),
      rank: i + 1,
      rankChange: change,
    },
  })),
};

/** College names for the marquee (fictional + generic, tier-2/3 heavy). */
export const MARQUEE_COLLEGES = rawColleges.map((c) => `${c[0]}, ${c[2]}`);

export const COLLEGE_TYPES = [
  { value: "ENGINEERING", label: "Engineering" },
  { value: "ARTS_SCIENCE", label: "Arts & Science" },
  { value: "COMMERCE", label: "Commerce" },
  { value: "DESIGN", label: "Design" },
  { value: "MANAGEMENT", label: "Management" },
  { value: "POLYTECHNIC", label: "Polytechnic" },
];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

export const STREAMS = ["B.Tech CSE", "B.Tech ECE", "B.Tech Mechanical", "BCA", "MCA", "B.Sc IT", "B.Sc Maths", "B.Com", "BBA", "MBA", "BA English", "BA Mass Comm", "B.Des", "Diploma CS"];

export const MENTORS = [
  { name: "Priya Nair", role: "Senior Product Designer", company: "Freelance · ex-Swiggy", skill: "UI/UX Design", years: 7, langs: ["English", "Hinglish", "Tamil"] },
  { name: "Rahul Mehta", role: "Full-stack developer", company: "120+ client projects", skill: "Web Development", years: 9, langs: ["English", "Hindi"] },
  { name: "Sana Qureshi", role: "Performance marketer", company: "D2C growth consultant", skill: "Digital Marketing", years: 6, langs: ["English", "Hinglish"] },
  { name: "Arvind Krishnan", role: "Freelance BI consultant", company: "ex-Mu Sigma", skill: "Data Analytics", years: 8, langs: ["English", "Tamil", "Telugu"] },
  { name: "Debjani Roy", role: "Copywriter & strategist", company: "Freelance writer", skill: "Content Writing", years: 6, langs: ["English", "Bengali", "Hindi"] },
  { name: "Farhan Ali", role: "Video editor", company: "Creators with 5M+ subs", skill: "Video Editing", years: 5, langs: ["English", "Hindi"] },
  { name: "Kiran Patil", role: "Flutter developer", company: "30+ apps shipped", skill: "App Development", years: 6, langs: ["English", "Marathi", "Hindi"] },
  { name: "Meghna Bose", role: "Brand designer", company: "Studio founder", skill: "Graphic Design", years: 10, langs: ["English", "Bengali"] },
];

export const LADDER_STAGES = [
  {
    stage: 1,
    key: "LEARN",
    title: "Learn",
    short: "Free courses by working freelancers",
    description: "Start any track for free. Short video lessons, articles and quizzes, plus an AI tutor that explains in your language.",
    reward: "+10 pts per lesson",
    example: "Finish 'HTML & CSS in 7 days'",
    icon: "BookOpen",
  },
  {
    stage: 2,
    key: "PRACTICE",
    title: "Practice",
    short: "Assignments reviewed by mentors",
    description: "Submit real-world assignments. A mentor scores them against a rubric, and every reviewed piece becomes verified proof on your passport.",
    reward: "+60 pts per assignment",
    example: "Redesign a kirana store's menu card",
    icon: "ClipboardCheck",
  },
  {
    stage: 3,
    key: "MICRO_GIG",
    title: "Micro-gig",
    short: "₹200–₹1,500 tasks under a mentor",
    description: "Small practice tasks checked by a mentor before they ship.",
    reward: "₹200–₹1,500 per gig",
    example: "10 Instagram posts for a Nagpur café — ₹800",
    icon: "Wallet",
  },
  {
    stage: 4,
    key: "REAL_PROJECT",
    title: "Real project",
    short: "Full client projects, real money",
    description: "Verified learners may be offered client projects through Catalance when suitable work is available.",
    reward: "₹5,000–₹40,000 per project",
    example: "A Shopify store for a Surat textile brand — ₹18,000",
    icon: "Briefcase",
  },
  {
    stage: 5,
    key: "HIRED",
    title: "Hired",
    short: "Companies come to you",
    description: "Your verified work and Skill Passport speak for you. Opportunities are not guaranteed.",
    reward: "Interviews, internships and jobs",
    example: "Analyst internship at a Gurugram fintech",
    icon: "Trophy",
  },
];

export const TUTOR_DEMO = {
  question: "API kya hota hai? Simple mein samjhao",
  answers: {
    en: "Think of an API as a waiter. You (the app) give your order — that's the request. The waiter goes to the kitchen (the server) and brings back your food — that's the response. When Zomato shows a restaurant's menu, it's asking that restaurant's system through an API.",
    hinglish: "API ko ek waiter samjho. Tum order dete ho — woh hai request. Waiter kitchen (server) se khaana laake deta hai — woh hai response. Zomato jab restaurant ka menu dikhata hai, toh woh API se hi restaurant ke system se poochta hai. Simple, na?",
    hi: "API को एक वेटर की तरह समझिए। आप ऑर्डर देते हैं — यही request है। वेटर किचन (server) से खाना लाकर देता है — यही response है। Zomato जब किसी रेस्टोरेंट का मेन्यू दिखाता है, तो वह API के ज़रिए ही उस रेस्टोरेंट के सिस्टम से पूछता है।",
    ta: "API-ஐ ஒரு வெயிட்டர் மாதிரி நினைச்சுக்கோங்க. நீங்க ஆர்டர் கொடுக்கறீங்க — அதுதான் request. வெயிட்டர் கிச்சன்ல (server) இருந்து சாப்பாட்டைக் கொண்டு வர்றார் — அதுதான் response. Zomato ஒரு ஹோட்டலோட மெனுவைக் காட்டும்போது, API மூலமாத்தான் அந்த ஹோட்டலோட சிஸ்டம்கிட்ட கேக்குது.",
  },
  labels: { en: "English", hinglish: "Hinglish", hi: "हिन्दी", ta: "தமிழ்" },
};

export const LANDING_FAQ = [
  {
    q: "How much does a course cost?",
    a: "Each course shows its fee, GST, duration and level before you enrol. Fees are paid in full before you start, and one reassessment is included.",
  },
  {
    q: "My college isn't famous. Does that matter?",
    a: "No. Verification is based on your assessed work, not your college name. Verified skills make you eligible to be considered for suitable projects when client work is available. Projects and earnings are not guaranteed.",
  },
  {
    q: "I'm from a non-tech stream. Is this for me?",
    a: "Yes. Digital marketing, content writing, graphic design and video editing are full courses with practical tasks and a final assessment. Many learners study B.Com and BA.",
  },
  {
    q: "How do project opportunities work?",
    a: "After you are verified, a Catalance project manager may offer you a project that fits your skill. Each offer shows the deliverables, deadline and exact payout before you accept. You can decline without penalty.",
  },
  {
    q: "Can I learn in Hindi?",
    a: "Many courses have lessons in Hindi and Hinglish as well as English. Each course shows its languages before you enrol.",
  },
  {
    q: "Is my Campus account the same as my Catalance account?",
    a: "Yes. Campus is part of Catalance, so you sign in with the same account. Already on Catalance? Just log in. New here? Create one free Catalance account and use it for both.",
  },
];

export const QUOTES = [
  { quote: "Bikaner se hoon, polytechnic mein padhta hoon. The final brief felt like real client work. Getting my UI/UX skill verified made my portfolio feel real.", name: "Aman Chauhan", meta: "Thar Desert Govt. Polytechnic", division: "GOLD", rank: 4, points: 3120 },
  { quote: "The evaluator's feedback on my first attempt was blunt and useful. I passed the reassessment.", name: "Fatima Shaikh", meta: "Deccan School of Design, Pune", division: "PLATINUM", rank: 2, points: 5480 },
  { quote: "The AI tutor explained SQL joins in Tamil. That one night changed my semester.", name: "Karthik Pillai", meta: "Coromandel Institute of Technology", division: "DIAMOND", rank: 1, points: 7840 },
  { quote: "BA English student. Now I edit reels for a creator with 2M followers.", name: "Riya Banerjee", meta: "Hooghly Arts College, Howrah", division: "PLATINUM", rank: 6, points: 4210 },
];
