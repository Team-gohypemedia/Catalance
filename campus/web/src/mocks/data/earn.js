/**
 * Seed data for the "earn" domain: seasons, gigs, gig applications, wallet, points history,
 * proof portfolio and badges. All businesses and people are fictional demo data.
 */
import { daysAgo, daysFromNow, hoursAgo, seeded } from "../utils";
import core from "./core";

const rand = seeded(2026);

/* ───────────── Seasons ───────────── */
const seasons = [
  {
    id: "season_7",
    number: 7,
    name: "Season 7 · Monsoon",
    status: "ACTIVE",
    startsAt: daysAgo(18),
    endsAt: daysFromNow(12),
    createdAt: daysAgo(18),
  },
  {
    id: "season_6",
    number: 6,
    name: "Season 6 · Summer",
    status: "ENDED",
    startsAt: daysAgo(48),
    endsAt: daysAgo(18),
    winnerUserId: "s_14",
    winnerCollegeId: "c_6",
    createdAt: daysAgo(48),
  },
  {
    id: "season_5",
    number: 5,
    name: "Season 5 · Spring",
    status: "ENDED",
    startsAt: daysAgo(78),
    endsAt: daysAgo(48),
    winnerUserId: "s_3",
    winnerCollegeId: "c_1",
    createdAt: daysAgo(78),
  },
];

/* ───────────── Gigs ───────────── */
// [id, title, company, logoColor, category(track slug), skills, payoutINR, durationDays, difficulty, minStage, spots, applicants, deadlineDays, mentorId, createdDaysAgo, intro, deliverables, status]
const gigRows = [
  ["g_1", "10 Instagram captions for a festive saree drop", "Rangrez Sarees, Jaipur", "#B5245B", "content-writing", ["Copywriting", "Instagram", "Hinglish copy"], 600, 3, "EASY", 3, 3, 14, 5, "m_5", 2,
    "Rangrez is a family-run block-print saree label from Jaipur's Sanganer belt. They're launching a 12-piece **Navratri collection** and need captions that sound warm, desi and premium, not like a discount store.",
    ["10 Instagram captions (60–120 words each) in English with light Hinglish", "3 hook-line options for the launch Reel", "A hashtag set of 15 tags (mix of niche and broad)"]],
  ["g_2", "Landing page for a specialty café", "Bean Theory Café, Pune", "#6B3E26", "web-development", ["React", "Tailwind CSS", "Responsive design"], 4500, 10, "MEDIUM", 4, 1, 9, 9, "m_2", 3,
    "Bean Theory is a 28-seat specialty coffee café in Koregaon Park. They want a one-page site that shows the menu, the vibe and a **'Reserve a table on WhatsApp'** button. Designs are in Figma; you build it.",
    ["Responsive one-page site (React or plain HTML + Tailwind)", "Menu section driven from a JSON file so the owner can edit prices", "WhatsApp reserve button with prefilled message", "Lighthouse performance score ≥ 90 on mobile", "Deployed on Netlify/Vercel with a handover note"]],
  ["g_3", "Google Business Profile setup for a dental clinic", "Sunrise Dental Care, Kochi", "#0E8A7E", "digital-marketing", ["Local SEO", "Google Business Profile"], 800, 4, "EASY", 3, 2, 6, 6, "m_3", 1,
    "Dr. Anjali's clinic in Kadavanthra gets most patients from word of mouth, but shows up nowhere on Google Maps. Set up and optimise their Google Business Profile so 'dentist near me' searches find them.",
    ["Complete, verified-ready Google Business Profile", "Business description in English and Malayalam", "Services list with 12 treatments and price ranges", "5 Google Posts drafted for the next month", "1-page guide for the clinic staff on replying to reviews"]],
  ["g_4", "Clean and structure a 2,400-row sales sheet", "Patel Agro Traders, Rajkot", "#2F7D32", "data-analytics", ["Excel", "Data cleaning", "Pivot tables"], 1200, 4, "EASY", 3, 2, 11, 7, "m_4", 4,
    "Three years of fertiliser and seed sales, typed by four different people. Duplicate party names, dates in five formats, GST mixed into amounts. Make it one clean table they can trust.",
    ["Cleaned Excel file with a data dictionary sheet", "Standardised party names (de-duplicated) and dates", "Pivot summary: monthly sales by product category", "Short note listing every assumption you made"]],
  ["g_5", "3 logo concepts for an organic food brand", "Kanha Organics, Indore", "#5B8C2A", "graphic-design", ["Logo design", "Illustrator", "Branding"], 1500, 6, "MEDIUM", 3, 1, 18, 8, "m_8", 2,
    "Kanha sells cold-pressed oils, jaggery and millets from farms around Malwa. They want a logo that feels **earthy but modern**, works on a jar label and as a WhatsApp DP.",
    ["3 distinct logo concepts with a one-line rationale each", "Each concept shown in colour, black and on a jar mock-up", "Final chosen concept as SVG + PNG"]],
  ["g_6", "Edit 5 YouTube Shorts for a fitness creator", "FitWithNeha, Delhi", "#E5484D", "video-editing", ["Premiere Pro", "CapCut", "Subtitles"], 1000, 5, "EASY", 3, 3, 16, 4, "m_6", 1,
    "Neha (82K subscribers) records 10-minute home-workout videos. Cut them into punchy 30–45 second Shorts with captions and a strong first 2 seconds.",
    ["5 vertical Shorts (1080×1920) with burned-in Hinglish captions", "Hook text on the first frame of each", "Royalty-free music, levelled audio", "Project files shared on Drive"]],
  ["g_7", "4 SEO blog posts for a lakeside homestay", "Lakeview Homestay, Udaipur", "#1F6FB2", "content-writing", ["SEO writing", "Blog Writing", "Travel"], 1400, 7, "MEDIUM", 3, 2, 8, 10, "m_5", 3,
    "A 6-room heritage homestay near Lake Pichola. They want to rank for searches like 'things to do in Udaipur in 2 days' and 'Udaipur with parents'.",
    ["4 blog posts of 800–1,000 words each", "Keyword brief per post (primary + 4 secondary keywords)", "Meta titles and descriptions", "Internal links to the booking page"]],
  ["g_8", "Redesign a street-food menu card", "Tapri Tales, Nagpur", "#D98E00", "graphic-design", ["Canva", "Layout", "Print design"], 700, 3, "EASY", 3, 2, 12, 4, "m_8", 2,
    "Tapri Tales sells 34 items (chai, poha, sandwiches, Nagpur's famous tarri poha) from a busy stall near Sitabuldi. The current menu is a photocopied Word file. Make it readable from 2 metres away.",
    ["A3 print-ready menu (PDF, CMYK, 3mm bleed)", "Square version for Instagram and Zomato", "Editable Canva link"]],
  ["g_9", "Figma redesign of a product page", "Mitti Ceramics, Khurja", "#A0522D", "ui-ux-design", ["Figma", "UI Design", "E-commerce UX"], 1500, 6, "MEDIUM", 3, 1, 13, 7, "u_mentor", 5,
    "Mitti sells handmade Khurja pottery online. Their product page has a 70% bounce rate on mobile. Redesign it so buyers can see size, care instructions and delivery time without scrolling forever.",
    ["Mobile and desktop product page in Figma (auto-layout)", "A short UX rationale: 5 problems you fixed and why", "Clickable prototype link", "Component for the image gallery and size selector"]],
  ["g_10", "Flutter quiz app MVP for a coaching institute", "ShikshaSetu Classes, Kota", "#3F51B5", "app-development", ["Flutter", "Firebase", "Dart"], 12000, 21, "HARD", 4, 1, 6, 15, "m_7", 4,
    "ShikshaSetu runs JEE foundation batches for 400 students. They want a simple Android app where students take daily 10-question quizzes and see their batch rank.",
    ["Flutter app with login (phone OTP via Firebase)", "Daily quiz flow with timer and explanations", "Batch leaderboard screen", "Admin upload of quizzes via Google Sheet", "Signed APK + source code + 2-page handover doc"]],
  ["g_11", "WhatsApp order bot for a tiffin service", "Ghar Ka Khana Tiffins, Bengaluru", "#12A150", "ai-automation", ["n8n", "WhatsApp API", "Google Sheets"], 3500, 8, "MEDIUM", 4, 1, 5, 8, "m_2", 3,
    "Meena aunty runs a 120-tiffin-a-day home kitchen in HSR Layout. Orders come on WhatsApp and get lost. Automate it: customer messages → structured order in a Google Sheet → daily summary to the kitchen.",
    ["Working automation (n8n, Make or Apps Script) with WhatsApp Business", "Order sheet with daily and weekly summaries", "Auto-reply confirming order and total in English and Kannada", "Loom video walkthrough for the owner"]],
  ["g_12", "Power BI dashboard for a 3-store electronics chain", "Bhatia Electronics, Ludhiana", "#1F9BFF", "data-analytics", ["Power BI", "DAX", "SQL"], 6000, 12, "HARD", 4, 1, 4, 11, "m_4", 6,
    "Bhatia Electronics has 3 stores and 18 months of POS exports. The owner wants one screen that tells him what's selling, which store is slipping and when to restock.",
    ["Power BI report with sales, margin and stock views", "Store comparison and month-on-month trends", "Low-stock alert table", "Refresh instructions for new monthly exports"]],
  ["g_13", "Meta ads campaign for a handloom label", "Nila Handlooms, Kanchipuram", "#7B2CBF", "digital-marketing", ["Meta Ads", "Audience research", "Ad copy"], 2500, 10, "MEDIUM", 4, 1, 7, 12, "m_3", 2,
    "Nila sells pure silk sarees directly from weaver families. Budget: ₹15,000 for Deepavali. Set up a campaign that brings orders, not just likes.",
    ["Audience plan (3 ad sets) with reasoning", "3 ad creatives with copy in English and Tamil", "Pixel and conversion events checked", "Week-1 performance report with next steps"]],
  ["g_14", "Product descriptions for 25 Assam teas", "Brahmaputra Leaf Co., Dibrugarh", "#8D6E63", "content-writing", ["Copywriting", "E-commerce", "Product writing"], 900, 5, "EASY", 3, 2, 9, 8, "m_5", 6,
    "A second-generation tea garden selling online for the first time. Each tea needs a description that a buyer in Mumbai or Dubai would actually read.",
    ["25 product descriptions (80–120 words)", "Tasting notes and brewing guide per tea", "5 short gift-box blurbs"]],
  ["g_15", "Brand identity kit for an Ayurveda startup", "Prakriti Ayurveda, Haridwar", "#2E7D5B", "graphic-design", ["Branding", "Illustrator", "Packaging"], 8000, 14, "HARD", 4, 1, 10, 14, "m_8", 5,
    "Prakriti makes small-batch herbal oils and teas. They need a full identity before their first retail order with a Dehradun chain.",
    ["Logo suite (primary, secondary, icon)", "Colour palette and type system", "Label design for 3 SKUs (print-ready)", "12-page brand guideline PDF"]],
  ["g_16", "12-screen expense tracker app UI", "CodeNest Labs, Hyderabad", "#6B4EFF", "ui-ux-design", ["Figma", "Mobile UI", "Design systems"], 7500, 12, "HARD", 4, 1, 12, 16, "u_mentor", 7,
    "CodeNest is building an expense tracker for college students. You design the app; their devs build it. Think: split bills with hostel friends, monthly budget from pocket money.",
    ["12 high-fidelity mobile screens in Figma", "Mini design system (colours, type, 15 components)", "Onboarding flow prototype", "Dev handoff notes"]],
  ["g_17", "Fix mobile layout bugs on a restaurant website", "Malabar Spice Route, Kozhikode", "#C0392B", "web-development", ["HTML", "CSS", "WordPress"], 500, 2, "EASY", 3, 2, 7, 3, "m_2", 6,
    "A popular biryani place with a WordPress site that breaks on phones: menu overflows, the call button is hidden. Five known bugs, all CSS.",
    ["All 5 listed layout bugs fixed", "Before/after screenshots at 375px and 768px", "List of changed CSS rules"]],
  ["g_18", "Cut a podcast into 6 subtitled clips", "The Hustle Hour Podcast, Mumbai", "#14121F", "video-editing", ["Premiere Pro", "Audio cleanup", "Subtitles"], 1200, 4, "MEDIUM", 3, 2, 10, 6, "m_6", 1,
    "A business podcast with young founders from Tier-2 cities. Two new 50-minute episodes. Find the 6 best moments and make them shareable.",
    ["6 clips (45–90s) in 9:16 and 1:1", "Animated captions with keyword highlights", "Audio cleaned and levelled", "Thumbnails for each clip"]],
  ["g_19", "Auto-generate bilingual parent circulars", "Vidya Public School, Lucknow", "#E8B100", "ai-automation", ["ChatGPT Prompting", "Google Apps Script", "Automation"], 1500, 5, "MEDIUM", 3, 1, 8, 6, "m_4", 3,
    "The school office spends hours writing circulars in Hindi and English. Build a Google Sheets + AI workflow: fill a row, get a ready-to-print bilingual circular.",
    ["Google Sheet with an Apps Script menu", "Prompt template tested on 5 real circular types", "Output as Google Doc in the school letterhead", "Guide for office staff (Hindi)"]],
  ["g_20", "Translate 30 product titles to Tamil", "Tanjore Art House, Thanjavur", "#B8860B", "content-writing", ["Tamil", "Translation", "Proofreading"], 300, 1, "EASY", 3, 2, 5, 3, "m_5", 1,
    "A Thanjavur painting studio listing on Amazon. Translate and proofread 30 product titles so they read naturally to Tamil buyers.",
    ["30 translated titles in a sheet", "Notes on any terms kept in English"]],
  ["g_21", "React booking website for a scooter rental", "RideEasy Rentals, Goa", "#FF5A1F", "web-development", ["React", "Node.js", "Payments"], 15000, 30, "HARD", 4, 1, 21, 23, "m_2", 8,
    "RideEasy rents 60 scooters across North Goa. Tourists book over phone calls. Build a booking site with availability, pickup point and UPI advance payment.",
    ["React front end with date and scooter selection", "Simple Node/Express API with availability logic", "Razorpay test-mode UPI checkout", "Admin page listing bookings", "Deployed demo + README"]],
  ["g_22", "Fix 6 bugs in a Flutter farmer app", "Kisan Mandi, Nashik", "#4CAF50", "app-development", ["Flutter", "Dart", "Debugging"], 1500, 5, "MEDIUM", 3, 1, 4, 7, "m_7", 2,
    "Kisan Mandi shows daily onion and grape prices to farmers. The app crashes on older Android phones and the Marathi text overflows. Six bugs are listed in GitHub issues.",
    ["Fixes for all 6 issues as a pull request", "Test notes on an Android 9 device or emulator", "Short changelog in English"]],
  ["g_23", "30-second Diwali YouTube ad for a sweet shop", "Swaad Sweets, Varanasi", "#E67E22", "video-editing", ["After Effects", "Motion graphics", "Storytelling"], 4000, 9, "HARD", 4, 1, 6, 9, "m_6", 4,
    "A 60-year-old mithai shop near Godowlia. Footage of the kitchen and family is already shot. Turn it into a warm, emotional 30s ad.",
    ["30s ad in 16:9 and a 15s 9:16 cut", "Hindi super titles and end card with order number", "Licensed music, colour graded"]],
  ["g_24", "UX audit of a fintech onboarding flow", "PaisaPal, Bengaluru", "#0F9D58", "ui-ux-design", ["UX research", "Heuristics", "Figma"], 1000, 3, "EASY", 3, 3, 15, 5, "u_mentor", 1,
    "PaisaPal's KYC onboarding loses 40% of users at the PAN step. Review the flow and tell them exactly what to fix.",
    ["Heuristic audit of 9 screens (annotated Figma)", "Top 5 issues ranked by impact", "1 redesigned screen for the worst step"]],
  ["g_25", "Format a 300-row donor list", "Asha Foundation, Bhopal", "#E5484D", "data-analytics", ["Excel", "Google Sheets"], 200, 1, "EASY", 3, 3, 9, 2, "m_4", 1,
    "A small NGO preparing 80G receipts. Their donor list needs consistent names, phone numbers and PAN formatting.",
    ["Formatted sheet with validation rules", "List of rows with missing PAN"]],
  // aspirant-friendly gigs: built on exam subjects (question setting, current affairs, translation, Tally, Excel, tutoring)
  ["g_29", "Set 50 SSC-level Quant MCQs with solutions", "Lakshya SSC Academy, Prayagraj", "#C2410C", "excel-for-aspirants", ["Quant", "Question setting", "Excel"], 1200, 5, "MEDIUM", 3, 2, 17, 8, "m_4", 1,
    "Lakshya runs SSC CGL and CHSL batches for 600 students near Katra. Their test-series team needs **50 fresh Quant MCQs** (percentage, profit & loss, time & work, DI) at Tier-1 difficulty, with clear step-by-step solutions. Original questions only, no copying from previous papers.",
    ["50 MCQs in a Google Sheet: question, 4 options, answer key, topic, difficulty", "A worked solution for every question (short-trick + full method)", "10 of the 50 must be DI questions built on 2 small tables", "Self-check sheet confirming no question is copied from PYQs"]],
  ["g_30", "Banking awareness question bank (100 MCQs)", "Pragati Bank Coaching, Patna", "#1D4ED8", "accounting-tally-gst", ["Banking Awareness", "Question setting", "Research"], 1500, 6, "MEDIUM", 3, 2, 12, 9, "m_3", 2,
    "Pragati prepares students for IBPS PO, SBI Clerk and RRB exams. They need a **100-question banking awareness bank** for the coming season: RBI policy tools, types of accounts, NPAs, financial inclusion schemes and basic accounting terms. Every answer must cite a source (RBI website, PIB, scheme portals).",
    ["100 MCQs with answer key and one-line explanation", "Source link for every fact", "Tagged by topic (RBI, schemes, accounting, current banking news)", "20 questions also translated into Hindi"]],
  ["g_31", "Weekly current-affairs summary in Hindi", "Gyan Ganga Library, Varanasi", "#7C2D12", "content-writing", ["Hindi writing", "GK & Current Affairs", "Research"], 800, 4, "EASY", 3, 3, 21, 6, "m_5", 1,
    "A self-study library with 180 seats wants a **printable weekly current-affairs sheet in Hindi** for its members: national news, schemes, appointments, sports and economy, in exam-ready one-liners. Four weeks to start, renewable every month.",
    ["One A4 two-page summary per week in Hindi (Devanagari), 4 weeks", "30–40 one-liners per week, grouped by topic", "10 practice MCQs per week with answers", "Editable Google Doc + print-ready PDF"]],
  ["g_32", "Translate a 6-page brochure from Hindi to English", "Kashi Handloom Weavers' Cooperative, Varanasi", "#9D174D", "translation-hindi-english", ["Translation", "Hindi", "English"], 1400, 5, "MEDIUM", 3, 1, 10, 7, "m_5", 3,
    "A cooperative of 40 Banarasi weaver families is attending a trade fair in Delhi. Their brochure (about 1,800 words) is in Hindi: history, weaving process, product range and wholesale terms. It must read naturally to buyers from Mumbai, Bengaluru and abroad.",
    ["Full English translation in the original layout (Google Doc or Canva)", "A glossary of 25 craft terms (e.g. कढ़ुआ, जामदानी) with how you rendered them", "One round of revisions after the cooperative's review"]],
  ["g_33", "Translate a legal notice and reply into Hindi", "Advocate Mishra & Associates, Lucknow", "#334155", "translation-hindi-english", ["Legal translation", "Hindi", "Rajbhasha"], 1100, 3, "HARD", 3, 1, 5, 4, "m_5", 2,
    "A small litigation chamber needs a **two-page English legal notice** (tenant–landlord dispute) and its draft reply translated into formal court Hindi. Accuracy and register matter more than speed. All personal details are already masked.",
    ["Hindi translation of both documents in formal legal register", "A term list showing the standard Hindi legal term used for each key phrase", "Confidentiality: work only in the shared Drive, no public MT tools"]],
  ["g_34", "Hindi subtitles for 8 short explainer videos", "SamajhKar Finance (YouTube), Indore", "#B91C1C", "translation-hindi-english", ["Subtitles", "SRT", "Hindi"], 1000, 4, "EASY", 3, 2, 13, 6, "m_6", 1,
    "A personal-finance channel (140K subscribers) explains SIPs, PPF and income tax in simple English. They want **Hindi subtitles** so viewers in UP, MP and Bihar can follow along. Eight videos, 3–5 minutes each.",
    ["8 SRT files in Hindi, max 42 characters per line, synced to speech", "Finance terms kept consistent (SIP, PPF stay in English, explained once)", "A QC pass watching each video at 1x speed"]],
  ["g_35", "Tally bookkeeping for a hardware shop (1 month)", "Gupta Hardware & Sanitary, Kanpur", "#92400E", "accounting-tally-gst", ["Tally Prime", "GST", "Bookkeeping"], 1500, 7, "MEDIUM", 3, 1, 8, 9, "m_3", 3,
    "Gupta ji's shop has a shoebox of September bills: about 120 purchase and sales invoices, UPI receipts and a few cash expenses. Enter them in **Tally Prime** with correct GST ledgers so his CA can file returns on time.",
    ["All vouchers entered in Tally Prime (sales, purchase, payment, receipt)", "GST ledgers set up correctly (CGST, SGST, IGST)", "Trial balance and a GSTR-1 style sales summary for the month", "A note listing missing or unclear bills"]],
  ["g_36", "Clean and de-duplicate a 3,000-row admissions sheet", "Shiksha Sadan Coaching, Jaipur", "#047857", "excel-for-aspirants", ["Excel", "Data cleaning", "Data entry"], 900, 3, "EASY", 3, 2, 11, 5, "m_4", 2,
    "Three years of enquiry and admission records typed by different front-desk staff. Duplicate phone numbers, names in mixed case, courses written five different ways. Make it one clean sheet the director can filter.",
    ["Cleaned sheet with standardised names, phone numbers and course names", "Duplicates removed on phone number, with a log of what was removed", "Data validation drop-downs so future entries stay clean", "A pivot: admissions by course and month"]],
  ["g_37", "Weekly MIS report from sales data (4 weeks)", "Awadh Agro Distributors, Lucknow", "#15803D", "excel-for-aspirants", ["Excel", "MIS reporting", "Pivot tables"], 1300, 6, "MEDIUM", 3, 1, 9, 6, "m_4", 4,
    "A seed and fertiliser distributor supplying 70 retailers. Every Monday the owner wants one page: sales by retailer and product, top 10 retailers, overdue payments. You'll build the template once and fill it for 4 weeks.",
    ["Reusable Excel MIS template with SUMIFS and pivots", "4 weekly reports (PDF + Excel)", "Conditional formatting for overdue payments", "A 5-minute Loom or voice note explaining how to refresh it"]],
  ["g_38", "Online maths tutor for Class 10 (CBSE), 8 sessions", "Pathshala Online, Gorakhpur", "#6D28D9", "content-writing", ["Teaching", "Maths", "Hindi"], 1200, 14, "EASY", 3, 2, 14, 4, "m_4", 2,
    "A small online tutoring startup needs a tutor for a batch of 6 Class 10 students before pre-boards: real numbers, quadratic equations, trigonometry and statistics. Sessions on Google Meet in Hindi and English, 1 hour each, evenings.",
    ["8 live sessions of 1 hour (schedule agreed with the batch)", "A one-page practice sheet per session with answers", "A short progress note per student at the end"]],
  // closed gigs that u_student already completed
  ["g_26", "Fix and speed up a grocery store landing page", "Jabalpur Fresh Mart", "#2F9E44", "web-development", ["HTML", "CSS", "JavaScript"], 1500, 5, "MEDIUM", 3, 1, 12, 0, "m_2", 70,
    "A neighbourhood grocery store's landing page took 9 seconds to load on 4G. Optimise images, fix the layout and add a WhatsApp order button.",
    ["Page loads under 2.5s on 4G", "WhatsApp order button", "Responsive at 375px"], "CLOSED"],
  ["g_27", "Figma mock-ups for a coaching app", "Gyan Path Academy, Jabalpur", "#6B4EFF", "ui-ux-design", ["Figma", "UI Design"], 1300, 5, "MEDIUM", 3, 1, 9, 0, "u_mentor", 52,
    "A local coaching centre wanted 6 screens to pitch an app idea to its parents' committee.",
    ["6 mobile screens in Figma", "Clickable prototype"], "CLOSED"],
  ["g_28", "Website copy for a CrossFit gym", "Iron Tribe Fitness, Bhopal", "#D9480F", "content-writing", ["Copywriting", "Web copy"], 1000, 3, "EASY", 3, 1, 7, 0, "m_5", 34,
    "A new gym needed punchy copy for 4 website sections and their Google listing.",
    ["Copy for 4 sections", "Google Business description"], "CLOSED"],
];

const gigs = gigRows.map(
  ([id, title, companyName, logoColor, category, skills, payoutINR, durationDays, difficulty, minStage, spots, applicantsCount, deadlineDays, mentorId, createdDaysAgo, intro, deliverables, status = "OPEN"]) => ({
    id,
    title,
    company: { name: companyName, logoColor },
    category,
    skills,
    payoutINR,
    durationDays,
    difficulty,
    minStage,
    status,
    applicantsCount,
    spots,
    deadline: status === "CLOSED" ? daysAgo(createdDaysAgo - 10) : daysFromNow(deadlineDays),
    description: `## About the client\n\n${intro}\n\n## What you'll do\n\n${deliverables.map((d) => `- ${d}`).join("\n")}\n\n## How it works\n\n1. Apply with a short pitch: why you, and one link to similar work.\n2. Your mentor shortlists and confirms scope within 48 hours.\n3. Submit your work on Campus. The mentor reviews it before the client sees it.\n4. Once approved, the payout lands in your Campus wallet. This is a practice task; payouts are not guaranteed.\n\n> **Tip:** Clients love a pitch that mentions *their* business by name. Keep it under 120 words.`,
    deliverables,
    mentorId,
    createdAt: daysAgo(createdDaysAgo),
  }),
);

/* ───────────── Gig applications ───────────── */
const students = core.users.filter((u) => u.id.startsWith("s_"));
const seniorStudents = students.filter((s) => s.ladderStage >= 3);
const pool = seniorStudents.length >= 8 ? seniorStudents : students;

const pitches = [
  "I've done two similar projects for local shops in my city and I can share both links. I'll deliver a first draft in 2 days so there's time for changes.",
  "I run the design club at my college and have made menus and posters for our fests. I understand the audience here and can work in Hindi and English.",
  "This is exactly what I've been practising in my Campus track. I'll keep you updated every evening and won't miss the deadline.",
  "I love this brand already! I've written captions for my cousin's boutique and grew it from 300 to 2K followers. Happy to do a sample first.",
  "I have cleaned bigger sheets for my internship at a CA firm. I'll document every change so the client can repeat it next year.",
  "Edited 40+ Shorts for my own channel and two creators. Fast turnaround, clean captions, good hooks.",
];

const gigApplications = [
  // u_student — PAID (3), SUBMITTED, ACCEPTED, APPLIED
  { id: "ga_1", gigId: "g_26", userId: "u_student", status: "PAID", pitch: "I'm from Jabalpur and shop at Fresh Mart! I just finished the performance module of my web track and want to apply it on a real site.", submissionLink: "https://freshmart-jbp.netlify.app", submissionNote: "Load time down from 9.1s to 2.1s on throttled 4G. Images converted to WebP, lazy-loaded the offers carousel.", feedback: "Clean work, Aarav. The client was thrilled with the WhatsApp button. Payment released.", createdAt: daysAgo(68), updatedAt: daysAgo(58) },
  { id: "ga_2", gigId: "g_27", userId: "u_student", status: "PAID", pitch: "I've been learning Figma in the UI/UX track and built a habit-tracker app as practice. I'd love to design for real users.", submissionLink: "https://figma.com/proto/gyanpath-demo", submissionNote: "6 screens + prototype. I kept the colours close to the academy's banner.", feedback: "Good hierarchy and consistent spacing. Next time, share an early wireframe on day 2.", createdAt: daysAgo(50), updatedAt: daysAgo(41) },
  { id: "ga_3", gigId: "g_28", userId: "u_student", status: "PAID", pitch: "I write for our college newsletter and I go to the gym 5 days a week, so I know the vibe.", submissionLink: "https://docs.google.com/document/d/irontribe-copy", submissionNote: "4 sections + Google listing copy, with 2 headline options each.", feedback: "Punchy and on-brand. Approved.", createdAt: daysAgo(32), updatedAt: daysAgo(25) },
  { id: "ga_4", gigId: "g_17", userId: "u_student", status: "SUBMITTED", pitch: "Fixed exactly these kinds of bugs on Fresh Mart's site last month. Will share before/after screenshots.", submissionLink: "https://github.com/aarav-dev/malabar-css-fixes", submissionNote: "All 5 bugs fixed. Screenshots at 375px and 768px are in the README.", feedback: null, createdAt: daysAgo(5), updatedAt: hoursAgo(20) },
  { id: "ga_5", gigId: "g_9", userId: "u_student", status: "ACCEPTED", pitch: "I designed product screens for a coaching app as a paid gig and I've studied e-commerce UX in my track. I'll focus on size and delivery info above the fold.", submissionLink: null, submissionNote: null, feedback: "Shortlisted! Start with the mobile page; share a wireframe by day 2.", createdAt: daysAgo(4), updatedAt: daysAgo(3) },
  { id: "ga_6", gigId: "g_24", userId: "u_student", status: "APPLIED", pitch: "I use three UPI apps daily and I've noticed how each handles KYC. I'll run a heuristic audit and redesign the PAN step.", submissionLink: null, submissionNote: null, feedback: null, createdAt: hoursAgo(10), updatedAt: hoursAgo(10) },
];

const otherApps = [
  ["g_1", "APPLIED"], ["g_1", "ACCEPTED"], ["g_2", "APPLIED"], ["g_2", "APPLIED"], ["g_3", "SUBMITTED"], ["g_4", "APPROVED"],
  ["g_5", "APPLIED"], ["g_5", "REJECTED"], ["g_6", "SUBMITTED"], ["g_6", "PAID"], ["g_7", "ACCEPTED"], ["g_8", "APPLIED"],
  ["g_10", "APPLIED"], ["g_11", "SUBMITTED"], ["g_12", "APPLIED"], ["g_13", "ACCEPTED"], ["g_14", "APPROVED"], ["g_16", "APPLIED"],
  ["g_18", "PAID"], ["g_19", "APPLIED"], ["g_20", "SUBMITTED"], ["g_21", "APPLIED"], ["g_22", "REJECTED"], ["g_25", "PAID"],
  ["g_26", "REJECTED"], ["g_24", "APPLIED"],
];
otherApps.forEach(([gigId, status], i) => {
  const s = pool[(i * 7 + 3) % pool.length];
  const created = 1 + Math.floor(rand() * 12);
  const done = ["SUBMITTED", "APPROVED", "PAID"].includes(status);
  gigApplications.push({
    id: `ga_${i + 7}`,
    gigId,
    userId: s.id,
    status,
    pitch: pitches[i % pitches.length],
    submissionLink: done ? `https://drive.google.com/drive/folders/${s.username}-${gigId}` : null,
    submissionNote: done ? "Final files are in the folder, with a short note on decisions I made." : null,
    feedback:
      status === "REJECTED"
        ? "Thanks for applying! We went with someone who had a closer sample. Add one more portfolio piece in this skill and try again."
        : status === "APPROVED" || status === "PAID"
          ? "Solid delivery, on time and well documented."
          : status === "ACCEPTED"
            ? "You're in. Confirm scope with your mentor in the gig chat."
            : null,
    createdAt: daysAgo(created + 2),
    updatedAt: daysAgo(Math.max(0, created - 1)),
  });
});

// aspirant students who have reached the micro-gig stage apply to the aspirant gigs
// (u_aspirant is on Stage 2, so she has no applications yet — gigs need Stage 3)
const aspirantSeniors = students.filter((s) => s.aspirant && s.ladderStage >= 3);
const aspirantPitches = {
  g_29: "Three years of SSC CGL prep, 200+ Quant mocks. I write my own DI practice sets already and can share two. Every solution will have the short trick and the full method.",
  g_32: "I prepared for BPSC with Hindi as my strongest paper and I've been doing the Campus translation course. I'll keep a glossary of every craft term so the brochure reads consistently.",
  g_36: "I cleaned our coaching centre's student register in Excel last month (1,200 rows). I'll log every duplicate I remove so nothing is lost.",
  g_31: "I've made weekly current-affairs notes in Hindi for my own UPSC prep for 4 years. Happy to share a sample week before you decide.",
};
[["g_29", "APPLIED"], ["g_32", "ACCEPTED"], ["g_36", "SUBMITTED"], ["g_31", "APPLIED"]].forEach(([gigId, status], i) => {
  const s = aspirantSeniors[i % Math.max(1, aspirantSeniors.length)];
  if (!s || gigApplications.some((a) => a.gigId === gigId && a.userId === s.id)) return;
  gigApplications.push({
    id: `ga_asp_${i + 1}`,
    gigId,
    userId: s.id,
    status,
    pitch: aspirantPitches[gigId],
    submissionLink: status === "SUBMITTED" ? `https://docs.google.com/spreadsheets/d/${s.username}-${gigId}` : null,
    submissionNote: status === "SUBMITTED" ? "Cleaned sheet, duplicate log and the pivot are in separate tabs." : null,
    feedback: status === "ACCEPTED" ? "You're in. Share the glossary draft by day 2 so the cooperative can confirm terms." : null,
    createdAt: daysAgo(3 + i),
    updatedAt: daysAgo(Math.max(0, 2 - i)),
  });
});

/* ───────────── Wallet (u_student) ─────────────
 * Gig earnings 1,500 + 1,300 + 1,000 = 3,800, bonus 500 → lifetime earned 4,300
 * Pay-later deductions 20% → 300 + 260 + 200 = 760
 * Withdrawals 1,000 (done) + 690 (pending) → balance 4,300 − 760 − 1,690 = 1,850
 */
const walletTxns = [
  { id: "wt_1", userId: "u_student", type: "GIG_EARNING", amountINR: 1500, note: "Gig payout · Jabalpur Fresh Mart landing page", status: "COMPLETED", createdAt: daysAgo(58) },
  { id: "wt_2", userId: "u_student", type: "COURSE_FEE_DEDUCTION", amountINR: -300, note: "20% to course fees", status: "COMPLETED", createdAt: daysAgo(58) },
  { id: "wt_3", userId: "u_student", type: "BONUS", amountINR: 500, note: "Ladder bonus · reached Stage 3 (Micro-gig)", status: "COMPLETED", createdAt: daysAgo(57) },
  { id: "wt_4", userId: "u_student", type: "WITHDRAWAL", amountINR: -1000, note: "To UPI aarav.sharma@okaxis", status: "COMPLETED", createdAt: daysAgo(55) },
  { id: "wt_5", userId: "u_student", type: "GIG_EARNING", amountINR: 1300, note: "Gig payout · Gyan Path Academy app mock-ups", status: "COMPLETED", createdAt: daysAgo(41) },
  { id: "wt_6", userId: "u_student", type: "COURSE_FEE_DEDUCTION", amountINR: -260, note: "20% to course fees", status: "COMPLETED", createdAt: daysAgo(41) },
  { id: "wt_7", userId: "u_student", type: "GIG_EARNING", amountINR: 1000, note: "Gig payout · Iron Tribe Fitness website copy", status: "COMPLETED", createdAt: daysAgo(25) },
  { id: "wt_8", userId: "u_student", type: "COURSE_FEE_DEDUCTION", amountINR: -200, note: "20% to course fees", status: "COMPLETED", createdAt: daysAgo(25) },
  { id: "wt_9", userId: "u_student", type: "WITHDRAWAL", amountINR: -690, note: "To UPI aarav.sharma@okaxis", status: "PENDING", createdAt: hoursAgo(26) },
];

/* ───────────── Points history (u_student) ─────────────
 * Season events (last 18 days) sum to exactly 2,380 = seasonPoints in core.
 */
const seasonEventTemplates = [
  ["LESSON", 20, "Completed lesson · Flexbox in real layouts"],
  ["LESSON", 20, "Completed lesson · React state, explained"],
  ["QUIZ", 60, "Quiz passed with 100% · JavaScript arrays"],
  ["STREAK", 10, "Daily streak"],
  ["LESSON", 20, "Completed lesson · useEffect without tears"],
  ["ASSIGNMENT", 60, "Assignment submitted · Portfolio landing page"],
  ["HELP", 50, "Your answer was accepted · 'Why is my useState not updating?'"],
  ["QUIZ", 40, "Quiz passed · Figma auto-layout"],
  ["LESSON", 20, "Completed lesson · Fetching data from APIs"],
  ["ASSIGNMENT", 142, "Assignment reviewed · 82/100 · Weather app"],
  ["STREAK", 10, "Daily streak"],
  ["GIG", 400, "Gig approved · Iron Tribe Fitness website copy"],
  ["BONUS", 250, "Course completed · Responsive Web Foundations"],
  ["LESSON", 20, "Completed lesson · Routing with React Router"],
  ["QUIZ", 40, "Quiz passed · Responsive images"],
  ["HELP", 50, "Your answer was accepted · 'Tailwind classes not applying'"],
];
const pointsEvents = [];
let seasonSum = 0;
const SEASON_EVENTS = 36;
for (let i = 0; i < SEASON_EVENTS; i++) {
  let [source, points, note] = seasonEventTemplates[i % seasonEventTemplates.length];
  // the gig and course bonus only happen once
  if (i >= seasonEventTemplates.length && (source === "GIG" || source === "BONUS")) [source, points, note] = ["LESSON", 20, "Completed lesson · Practice set"];
  const hoursBack = Math.round((i / SEASON_EVENTS) * 17 * 24) + 3;
  pointsEvents.push({ id: `pe_s${i + 1}`, userId: "u_student", source, points, note, createdAt: hoursAgo(hoursBack) });
  seasonSum += points;
}
// balance to exactly 2,380 season points (= seasonPoints in core)
pointsEvents.push({ id: "pe_s_bal", userId: "u_student", source: "BONUS", points: Math.max(0, 2380 - seasonSum), note: "Season 6 finish reward · top 10 in your college", createdAt: daysAgo(17.5) });
// older history (previous seasons)
const olderTemplates = [
  ["LESSON", 20, "Completed lesson · HTML semantics"],
  ["LESSON", 20, "Completed lesson · CSS box model"],
  ["QUIZ", 40, "Quiz passed · CSS selectors"],
  ["ASSIGNMENT", 60, "Assignment submitted · Personal bio page"],
  ["GIG", 400, "Gig approved · Gyan Path Academy app mock-ups"],
  ["GIG", 400, "Gig approved · Jabalpur Fresh Mart landing page"],
  ["STREAK", 10, "Daily streak"],
  ["QUIZ", 40, "Quiz passed · Git basics"],
];
for (let i = 0; i < 40; i++) {
  const [source, points, note] = olderTemplates[i % olderTemplates.length];
  pointsEvents.push({ id: `pe_o${i + 1}`, userId: "u_student", source, points, note, createdAt: daysAgo(19 + i * 2.4) });
}

/* ───────────── Points history (u_aspirant) ─────────────
 * 45 minutes a day for 19 days (her streak). Season events sum to exactly 980 = seasonPoints in core;
 * older events (before the season) bring lifetime to 1,420. Only 3 QUIZ events, so she stays on Stage 2. */
const aspirantSeason = [
  [2, "LESSON", 20, "Completed lesson · Lookups: VLOOKUP and XLOOKUP"],
  [5, "LESSON", 20, "Completed lesson · Golden rules and journal entries"],
  [7, "STREAK", 10, "Daily streak · 19 days"],
  [26, "LESSON", 20, "Completed lesson · Why accountants are hired everywhere"],
  [31, "STREAK", 10, "Daily streak"],
  [50, "LESSON", 20, "Completed lesson · IF, IFS and IFERROR"],
  [55, "STREAK", 10, "Daily streak"],
  [74, "HELP", 50, "Your answer was accepted · 'Percentage change formula in Excel?'"],
  [79, "STREAK", 10, "Daily streak"],
  [98, "LESSON", 20, "Completed lesson · Practice set: DI to Excel"],
  [103, "STREAK", 10, "Daily streak"],
  [122, "ASSIGNMENT", 144, "Assignment reviewed · 84/100 · DI-to-Excel workbook"],
  [127, "STREAK", 10, "Daily streak"],
  [146, "ASSIGNMENT", 60, "Assignment submitted · DI-to-Excel workbook"],
  [151, "STREAK", 10, "Daily streak"],
  [175, "QUIZ", 60, "Quiz passed with 100% · Cell references and percentages"],
  [199, "STREAK", 10, "Daily streak"],
  [222, "LESSON", 20, "Completed lesson · Percentage change, the Excel way"],
  [247, "STREAK", 10, "Daily streak"],
  [270, "LESSON", 20, "Completed lesson · The grid, cells and references"],
  [295, "STREAK", 10, "Daily streak"],
  [318, "LESSON", 20, "Completed lesson · Why Excel is the #1 back-office skill"],
  [343, "STREAK", 10, "Daily streak"],
  [366, "QUIZ", 40, "Quiz passed · Data entry shortcuts"],
  [391, "STREAK", 10, "Daily streak"],
  [415, "LESSON", 20, "Completed lesson · Keyboard shortcuts for fast entry"],
];
let aspirantSum = 0;
aspirantSeason.forEach(([h, source, points, note], i) => {
  pointsEvents.push({ id: `pe_a${i + 1}`, userId: "u_aspirant", source, points, note, createdAt: hoursAgo(h) });
  aspirantSum += points;
});
pointsEvents.push({ id: "pe_a_bal", userId: "u_aspirant", source: "BONUS", points: Math.max(0, 980 - aspirantSum), note: "Earn Ladder · completed Stage 1 (Learn)", createdAt: daysAgo(16) });
[
  [19, "BONUS", 200, "Welcome to Campus · aspirant profile completed"],
  [20, "LESSON", 20, "Completed lesson · Fast, accurate data entry"],
  [21, "QUIZ", 40, "Quiz passed · Data validation basics"],
  [22, "LESSON", 20, "Completed lesson · Google Sheets for teams"],
  [23, "STREAK", 10, "Daily streak"],
  [24, "BONUS", 150, "First week streak · 7 days in a row"],
].forEach(([d, source, points, note], i) => pointsEvents.push({ id: `pe_ao${i + 1}`, userId: "u_aspirant", source, points, note, createdAt: daysAgo(d) }));

/* ───────────── Portfolio ───────────── */
const covers = [
  { from: "#FF5A1F", to: "#6B4EFF" },
  { from: "#12A150", to: "#1F9BFF" },
  { from: "#E8B100", to: "#FF5A1F" },
  { from: "#6B4EFF", to: "#3CC6C0" },
  { from: "#E5484D", to: "#D98E00" },
  { from: "#1F9BFF", to: "#8B74FF" },
  { from: "#3CC6C0", to: "#12A150" },
  { from: "#14121F", to: "#6B4EFF" },
];

const portfolioItems = [
  { id: "pf_1", userId: "u_student", title: "Fresh Mart landing page rebuild", description: "Took a neighbourhood grocery site from a 9.1s to a 2.1s load on 4G. WebP images, lazy loading and a WhatsApp order button that now brings 30+ orders a week.", link: "https://freshmart-jbp.netlify.app", cover: covers[1], skills: ["HTML", "CSS", "JavaScript", "Performance"], verified: true, source: "GIG", createdAt: daysAgo(58) },
  { id: "pf_2", userId: "u_student", title: "Gyan Path Academy app mock-ups", description: "Six mobile screens and a clickable prototype that helped a Jabalpur coaching centre pitch its app to parents.", link: "https://figma.com/proto/gyanpath-demo", cover: covers[3], skills: ["Figma", "UI Design"], verified: true, source: "GIG", createdAt: daysAgo(41) },
  { id: "pf_3", userId: "u_student", title: "Weather app with React", description: "City search, 5-day forecast and a 'carry an umbrella?' card. Reviewed by mentor Rahul Mehta: 82/100.", link: "https://github.com/aarav-dev/weather-react", cover: covers[5], skills: ["React", "APIs", "Tailwind CSS"], verified: true, source: "ASSIGNMENT", createdAt: daysAgo(9) },
  { id: "pf_4", userId: "u_student", title: "Iron Tribe Fitness website copy", description: "Headlines and section copy for a new gym in Bhopal, plus their Google Business description.", link: "https://docs.google.com/document/d/irontribe-copy", cover: covers[4], skills: ["Copywriting"], verified: true, source: "GIG", createdAt: daysAgo(25) },
  { id: "pf_5", userId: "u_student", title: "Hostel mess menu voting app", description: "Side project: students vote on next week's menu. 180 hostel-mates use it every Sunday.", link: "https://github.com/aarav-dev/mess-vote", cover: covers[0], skills: ["React", "Firebase"], verified: false, source: "PERSONAL", createdAt: daysAgo(30) },
  { id: "pf_6", userId: "u_student", title: "Personal portfolio site", description: "My own site, designed in Figma and built with React + Tailwind.", link: "https://aarav.dev", cover: covers[7], skills: ["React", "Figma", "Tailwind CSS"], verified: false, source: "PERSONAL", createdAt: daysAgo(80) },
];

// u_aspirant (Pooja): her prep turned into proof
portfolioItems.push(
  { id: "pf_asp_1", userId: "u_aspirant", title: "SSC DI sets rebuilt in Excel", description: "Five years of state-wise wheat production (an SSC CGL-style DI set) turned into a live workbook: growth %, averages, ratios and XLOOKUP. Reviewed by mentor Arvind Krishnan: 84/100.", link: "https://docs.google.com/spreadsheets/d/pooja-di-to-excel-workbook", cover: { from: "#0F9D58", to: "#1F9BFF" }, skills: ["Excel", "XLOOKUP", "Percentage change", "Data Interpretation"], verified: true, source: "ASSIGNMENT", createdAt: daysAgo(4) },
  { id: "pf_asp_2", userId: "u_aspirant", title: "Mock-test tracker: 214 mocks, one dashboard", description: "Logged every SSC mock since 2023 with section scores. A pivot table and line chart show accuracy by section, so I know exactly where marks are lost. Built it for my own prep, now I use the same method for MIS reports.", link: "https://docs.google.com/spreadsheets/d/pooja-mock-tracker", cover: { from: "#6B4EFF", to: "#0F9D58" }, skills: ["Excel", "Pivot tables", "Charts"], verified: false, source: "PERSONAL", createdAt: daysAgo(15) },
  { id: "pf_asp_3", userId: "u_aspirant", title: "Self-study library seat & fee tracker", description: "A Google Sheet for a 60-seat self-study library in Katra, Prayagraj: seat allotment, monthly fee status with conditional formatting, and a WhatsApp-ready dues list.", link: "https://docs.google.com/spreadsheets/d/katra-library-tracker", cover: { from: "#E8B100", to: "#B45309" }, skills: ["Google Sheets", "Data validation", "Conditional formatting"], verified: false, source: "PERSONAL", createdAt: daysAgo(9) },
);

const portfolioIdeas = [
  ["Instagram launch kit for a bakery", ["Canva", "Copywriting", "Instagram Ads"], "GIG"],
  ["Sales dashboard in Power BI", ["Power BI", "SQL", "Excel"], "ASSIGNMENT"],
  ["Flutter expense splitter", ["Flutter", "Firebase"], "PERSONAL"],
  ["SEO blog series for a travel startup", ["SEO", "Blog Writing"], "GIG"],
  ["Logo and label for a pickle brand", ["Illustrator", "Branding"], "GIG"],
  ["Reels edit pack for a dance academy", ["Premiere Pro", "Video Editing"], "ASSIGNMENT"],
  ["Lead-capture automation with n8n", ["ChatGPT Prompting", "Automation"], "PERSONAL"],
  ["Redesign of a college fest website", ["Figma", "UI Design"], "ASSIGNMENT"],
  ["Customer churn analysis in Python", ["Python", "SQL"], "ASSIGNMENT"],
  ["E-commerce landing page in React", ["React", "Tailwind CSS"], "GIG"],
];
const topStudents = [...students].sort((a, b) => b.seasonPoints - a.seasonPoints).slice(0, 14);
let pfi = 7;
topStudents.forEach((s, si) => {
  const count = 2 + (si % 3);
  for (let k = 0; k < count; k++) {
    const [title, skills, source] = portfolioIdeas[(si * 3 + k) % portfolioIdeas.length];
    portfolioItems.push({
      id: `pf_${pfi++}`,
      userId: s.id,
      title,
      description: `${source === "PERSONAL" ? "Self-initiated project" : source === "GIG" ? "Paid client gig, approved by a Campus mentor" : "Course assignment, reviewed and scored by a mentor"}. ${s.name.split(" ")[0]} owned it end to end, from brief to delivery.`,
      link: `https://portfolio.campus.dev/${s.username}/${k + 1}`,
      cover: covers[(si + k) % covers.length],
      skills: [...new Set([...skills, ...(s.skills || []).slice(0, 1)])],
      verified: source !== "PERSONAL",
      source,
      createdAt: daysAgo(3 + k * 11 + si),
    });
  }
});

/* ───────────── Badges ───────────── */
const BADGES = {
  "first-gig": ["First gig", "Got paid for real client work for the first time.", "Rocket"],
  "streak-30": ["30-day streak", "Learned something every day for a month.", "Flame"],
  "top-10-college": ["Top 10 in college", "Finished a season in your college's top 10.", "Trophy"],
  "helpful-hand": ["Helpful hand", "5 answers accepted in community Q&A.", "HeartHandshake"],
  "course-finisher": ["Course finisher", "Completed a full course with every assignment reviewed.", "GraduationCap"],
  "quiz-ace": ["Quiz ace", "Scored 100% on 10 quizzes.", "Target"],
  "season-top-100": ["National top 100", "Ranked in the national top 100 in a season.", "Medal"],
  "client-favourite": ["Client favourite", "Three gigs approved without a single revision.", "Star"],
  "prep-to-pro": ["Prep to Pro", "Turned exam preparation into a verified private-sector skill with a mentor-reviewed bridge-course assignment.", "TrendingUp"],
};
const badge = (id, userId, key, daysBack) => {
  const [title, description, icon] = BADGES[key];
  return { id, userId, key, title, description, icon, earnedAt: daysAgo(daysBack), createdAt: daysAgo(daysBack) };
};
const userBadges = [
  badge("ub_1", "u_student", "first-gig", 58),
  badge("ub_2", "u_student", "streak-30", 64),
  badge("ub_3", "u_student", "course-finisher", 12),
  badge("ub_4", "u_student", "top-10-college", 18),
  badge("ub_5", "u_student", "helpful-hand", 6),
  badge("ub_asp_1", "u_aspirant", "prep-to-pro", 4),
];
let ubi = 6;
topStudents.forEach((s, si) => {
  const keys = Object.keys(BADGES).filter((k) => k !== "prep-to-pro");
  const count = 2 + (si % 4);
  for (let k = 0; k < count; k++) userBadges.push(badge(`ub_${ubi++}`, s.id, keys[(si + k * 3) % keys.length], 4 + si * 3 + k * 9));
});

export default { seasons, gigs, gigApplications, walletTxns, pointsEvents, portfolioItems, userBadges };
