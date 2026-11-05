/**
 * Copy and demo data for the landing page (education for everyone: students, graduates,
 * govt-exam aspirants, 12th pass learners, working people and anyone restarting).
 * Tracks referenced here exist in FALLBACK_TRACKS / BRIDGE_TRACKS. Pay figures are typical
 * starting pay in India and are labelled as estimates in the UI.
 */

/* ── Hero: "I am a…" personas ── */
export const PERSONAS = [
  {
    id: "student",
    label: "College student",
    cta: "Start as a college student",
    href: "/signup?track=accounting-tally-gst",
    track: "accounting-tally-gst",
    lesson: "tally",
    image: "studyGroup",
    headline: "Learn a skill while you finish your degree",
    note: "Popular with B.Com, BBA and BA students. Studying engineering? Web Development is one tap away.",
    path: [
      { slug: "accounting-tally-gst", title: "Accounting, Tally & GST", weeks: 8 },
      { slug: "digital-marketing", title: "Digital Marketing", weeks: 10 },
    ],
    jobs: [
      { title: "Accounts assistant", pay: "₹15,000–22,000" },
      { title: "Digital marketing executive", pay: "₹18,000–25,000" },
    ],
    time: "1 hour a day",
    extra: "Small paid tasks from week 4",
  },
  {
    id: "aspirant",
    label: "Preparing for a govt exam",
    cta: "Start as an aspirant",
    href: "/signup?goal=aspirant",
    track: null,
    lesson: "excel",
    image: "aspirant",
    headline: "Your preparation already counts",
    note: "Keep your exam first. Add 45 minutes a day and build a backup career on what you already know.",
    path: [
      { slug: "excel-for-aspirants", title: "Excel & Data for Aspirants", weeks: 6 },
      { slug: "accounting-tally-gst", title: "Accounting, Tally & GST", weeks: 8 },
    ],
    jobs: [
      { title: "MIS executive", pay: "₹18,000–28,000" },
      { title: "Accounts assistant", pay: "₹15,000–22,000" },
    ],
    time: "45 minutes a day",
    extra: "Lessons start from your exam subjects",
  },
  {
    id: "graduate",
    label: "Graduate looking for a job",
    cta: "Start as a graduate",
    href: "/signup?track=digital-marketing",
    track: "digital-marketing",
    lesson: "marketing",
    image: "graduate",
    headline: "Build skills companies look for",
    note: "Learn practical skills, prove them in a final assessment and show verified work, not just a degree.",
    path: [
      { slug: "digital-marketing", title: "Digital Marketing", weeks: 10 },
      { slug: "content-writing", title: "Content Writing", weeks: 8 },
    ],
    jobs: [
      { title: "Digital marketing executive", pay: "₹18,000–25,000" },
      { title: "Social media executive", pay: "₹15,000–22,000" },
    ],
    time: "1 hour a day",
    extra: "Mock interviews in Hindi or English",
  },
  {
    id: "twelfth",
    label: "12th pass",
    cta: "Start as a 12th pass learner",
    href: "/signup?track=video-editing",
    track: "video-editing",
    lesson: "video",
    image: "mobileLearner",
    headline: "Build a skill before or alongside college",
    note: "No degree needed to begin. A phone is enough for the first lessons. A laptop helps later.",
    path: [
      { slug: "video-editing", title: "Video Editing", weeks: 10 },
      { slug: "graphic-design", title: "Graphic Design", weeks: 10 },
    ],
    jobs: [
      { title: "Reels editor (from home)", pay: "₹12,000–20,000" },
      { title: "Video editor", pay: "₹15,000–25,000" },
    ],
    time: "1 hour a day",
    extra: "Edit your first paid reel under a mentor",
  },
  {
    id: "working",
    label: "Working, want to grow",
    cta: "Start as a working professional",
    href: "/signup?track=data-analytics",
    track: "data-analytics",
    lesson: "report",
    image: "professional",
    headline: "Grow in your job, or move to a better one",
    note: "Short lessons that fit after work. Start with Excel reports your manager will notice.",
    path: [
      { slug: "excel-for-aspirants", title: "Excel & Data skills", weeks: 6 },
      { slug: "data-analytics", title: "Data Analytics", weeks: 12 },
    ],
    jobs: [
      { title: "MIS executive", pay: "₹22,000–30,000" },
      { title: "Data analyst", pay: "₹25,000–40,000" },
    ],
    time: "30 minutes a day",
    extra: "Evenings and weekends",
  },
  {
    id: "restart",
    label: "Restarting after a break",
    cta: "Start again with Campus",
    href: "/signup?track=content-writing",
    track: "content-writing",
    lesson: "translate",
    image: "womanHome",
    headline: "Come back at your own pace, from home",
    note: "A career break is not a gap in ability. Flexible hours, Hindi-friendly lessons and work you can do from home.",
    path: [
      { slug: "content-writing", title: "Content Writing", weeks: 8 },
      { slug: "translation-hindi-english", title: "Hindi–English Translation", weeks: 6 },
    ],
    jobs: [
      { title: "Content writer (from home)", pay: "₹15,000–25,000" },
      { title: "Translator", pay: "₹12,000–25,000" },
    ],
    time: "1 hour a day",
    extra: "Work from home, flexible hours",
  },
];

/* ── "Learn in your language" ── */
export const LESSON_LANGS = [
  { value: "en", label: "English", lang: "en" },
  { value: "hi", label: "हिन्दी", aria: "Hindi", lang: "hi" },
  { value: "hinglish", label: "Hinglish", lang: "hi-Latn" },
  { value: "ta", label: "தமிழ்", aria: "Tamil", lang: "ta" },
  { value: "bn", label: "বাংলা", aria: "Bengali", lang: "bn" },
  { value: "mr", label: "मराठी", aria: "Marathi", lang: "mr" },
];

export const LANG_LESSON = {
  en: {
    tag: "Lesson 3 · 6 min",
    title: "Percentage change in Excel",
    body: "Last month a shop sold ₹40,000. This month it sold ₹50,000. How much did sales grow? Take the new value minus the old value, then divide by the old value.",
    month: ["Last month", "This month"],
    result: "Sales grew by 25%",
    q: "What if sales go down?",
    a: "Then the answer is negative. For example, −10% means sales fell by 10 percent. The formula stays the same.",
  },
  hi: {
    tag: "पाठ 3 · 6 मिनट",
    title: "Excel में प्रतिशत बदलाव",
    body: "पिछले महीने एक दुकान ने ₹40,000 की बिक्री की। इस महीने ₹50,000 की। बिक्री कितनी बढ़ी? नई वैल्यू में से पुरानी वैल्यू घटाइए, फिर पुरानी वैल्यू से भाग दीजिए।",
    month: ["पिछला महीना", "यह महीना"],
    result: "बिक्री 25% बढ़ी",
    q: "अगर बिक्री घट जाए तो?",
    a: "तब जवाब माइनस में आएगा। जैसे −10% का मतलब है कि बिक्री 10 प्रतिशत घटी। फ़ॉर्मूला वही रहेगा।",
  },
  hinglish: {
    tag: "Lesson 3 · 6 min",
    title: "Excel mein percentage change",
    body: "Pichhle mahine ek dukaan ne ₹40,000 ki sale ki. Is mahine ₹50,000 ki. Sale kitni badhi? Nayi value mein se purani value ghatao, phir purani value se divide karo.",
    month: ["Pichhla mahina", "Yeh mahina"],
    result: "Sale 25% badhi",
    q: "Agar sale kam ho jaaye toh?",
    a: "Toh answer minus mein aayega. Jaise −10% ka matlab hai sale 10 percent kam hui. Formula wahi rahega.",
  },
  ta: {
    tag: "பாடம் 3 · 6 நிமிடம்",
    title: "Excel-ல் சதவீத மாற்றம்",
    body: "கடந்த மாதம் ஒரு கடை ₹40,000-க்கு விற்றது. இந்த மாதம் ₹50,000-க்கு விற்றது. விற்பனை எவ்வளவு உயர்ந்தது? புதிய மதிப்பிலிருந்து பழைய மதிப்பைக் கழித்து, பழைய மதிப்பால் வகுக்கவும்.",
    month: ["கடந்த மாதம்", "இந்த மாதம்"],
    result: "விற்பனை 25% உயர்ந்தது",
    q: "விற்பனை குறைந்தால் என்ன ஆகும்?",
    a: "அப்போது விடை மைனஸில் வரும். உதாரணமாக, −10% என்றால் விற்பனை 10 சதவீதம் குறைந்தது. சூத்திரம் அதேதான்.",
  },
  bn: {
    tag: "পাঠ 3 · 6 মিনিট",
    title: "Excel-এ শতাংশ পরিবর্তন",
    body: "গত মাসে একটি দোকান ₹40,000-এর জিনিস বিক্রি করেছে। এই মাসে ₹50,000-এর। বিক্রি কতটা বাড়ল? নতুন মান থেকে পুরনো মান বিয়োগ করুন, তারপর পুরনো মান দিয়ে ভাগ করুন।",
    month: ["গত মাস", "এই মাস"],
    result: "বিক্রি 25% বেড়েছে",
    q: "বিক্রি কমে গেলে কী হবে?",
    a: "তখন উত্তর মাইনাসে আসবে। যেমন, −10% মানে বিক্রি 10 শতাংশ কমেছে। সূত্র একই থাকবে।",
  },
  mr: {
    tag: "धडा 3 · 6 मिनिटे",
    title: "Excel मध्ये टक्केवारीतील बदल",
    body: "गेल्या महिन्यात एका दुकानाची विक्री ₹40,000 होती. या महिन्यात ती ₹50,000 झाली. विक्री किती वाढली? नव्या किमतीतून जुनी किंमत वजा करा, मग जुन्या किमतीने भागा.",
    month: ["गेला महिना", "हा महिना"],
    result: "विक्री 25% वाढली",
    q: "विक्री कमी झाली तर?",
    a: "तेव्हा उत्तर उणे (मायनस) येईल. उदा. −10% म्हणजे विक्री 10 टक्क्यांनी कमी झाली. सूत्र तेच राहील.",
  },
};

/* ── AI tutor demo: one question set, answered in all six landing languages ── */
export const TUTOR_QUESTIONS = [
  {
    id: "excel",
    q: {
      hinglish: "Excel mein percentage kaise nikaalein?",
      hi: "Excel में प्रतिशत कैसे निकालें?",
      en: "How do I find a percentage in Excel?",
      ta: "Excel-ல் சதவீதம் எப்படி கண்டுபிடிப்பது?",
      bn: "Excel-এ শতাংশ কীভাবে বের করব?",
      mr: "Excel मध्ये टक्केवारी कशी काढायची?",
    },
    a: {
      hinglish:
        "Simple hai. Maan lo B2 mein tumhare marks hain aur C2 mein total marks. Kisi khaali cell mein likho =B2/C2 aur Enter dabao. Phir Home tab mein % button dabao. 60 mein se 45 ho toh 75% dikhega. Neeche ki rows ke liye cell ka kona pakad ke neeche kheencho.",
      hi: "आसान है। मान लीजिए B2 में आपके अंक हैं और C2 में कुल अंक। किसी खाली सेल में =B2/C2 लिखिए और Enter दबाइए। फिर Home टैब में % बटन दबाइए। 60 में से 45 हों तो 75% दिखेगा। नीचे की पंक्तियों के लिए सेल का कोना पकड़कर नीचे खींचिए।",
      en: "It's simple. Say B2 has your marks and C2 has the total marks. In an empty cell, type =B2/C2 and press Enter. Then click the % button on the Home tab. For 45 out of 60, you'll see 75%. To fill the rows below, drag the cell's corner down.",
      ta: "எளிது. B2-ல் உங்கள் மதிப்பெண், C2-ல் மொத்த மதிப்பெண் இருக்கட்டும். ஒரு காலி செல்லில் =B2/C2 என்று டைப் செய்து Enter அழுத்துங்கள். பிறகு Home டேபில் % பட்டனை அழுத்துங்கள். 60-க்கு 45 என்றால் 75% வரும்.",
      bn: "সহজ। ধরুন B2-তে আপনার নম্বর আর C2-তে মোট নম্বর। একটা খালি সেলে =B2/C2 লিখে Enter চাপুন। তারপর Home ট্যাবে % বোতাম চাপুন। 60-এর মধ্যে 45 হলে 75% দেখাবে।",
      mr: "सोपं आहे. समजा B2 मध्ये तुमचे गुण आणि C2 मध्ये एकूण गुण आहेत. एका रिकाम्या सेलमध्ये =B2/C2 लिहा आणि Enter दाबा. मग Home टॅबमधील % बटण दाबा. 60 पैकी 45 असतील तर 75% दिसेल.",
    },
  },
  {
    id: "interview",
    q: {
      hinglish: "Interview mein apne baare mein kya bolun?",
      hi: "इंटरव्यू में अपने बारे में क्या बोलूँ?",
      en: "What do I say when asked to introduce myself?",
      ta: "இன்டர்வியூவில் என்னைப் பற்றி என்ன சொல்வது?",
      bn: "ইন্টারভিউতে নিজের সম্পর্কে কী বলব?",
      mr: "मुलाखतीत स्वतःबद्दल काय सांगू?",
    },
    a: {
      hinglish:
        "60 second ka simple formula: 1) naam aur padhai, 2) ek skill jo tumne seekhi aur kahaan use ki, 3) yeh job kyun chahiye. Jaise: \"Main Neha hoon, maine B.Com kiya hai. Maine Tally seekha aur ek dukaan ka 3 mahine ka hisaab rakha.\" Ghar pe 5 baar bol ke practice karo.",
      hi: "60 सेकंड का आसान फ़ॉर्मूला: 1) नाम और पढ़ाई, 2) एक स्किल जो आपने सीखी और कहाँ इस्तेमाल की, 3) यह नौकरी क्यों चाहिए। जैसे: \"मैं नेहा हूँ, मैंने B.Com किया है। मैंने Tally सीखा और एक दुकान का 3 महीने का हिसाब रखा।\" घर पर 5 बार बोलकर अभ्यास कीजिए।",
      en: "Use a simple 60-second formula: 1) your name and studies, 2) one skill you learnt and where you used it, 3) why you want this job. For example: \"I'm Neha and I have a B.Com. I learnt Tally and kept three months of accounts for a local shop.\" Practise it out loud five times.",
      ta: "60 வினாடி சூத்திரம்: 1) உங்கள் பெயரும் படிப்பும், 2) நீங்கள் கற்ற ஒரு திறன், அதை எங்கே பயன்படுத்தினீர்கள், 3) இந்த வேலை ஏன் வேண்டும். வீட்டில் சத்தமாக ஐந்து முறை சொல்லிப் பயிற்சி செய்யுங்கள்.",
      bn: "60 সেকেন্ডের সহজ সূত্র: 1) নাম আর পড়াশোনা, 2) একটা দক্ষতা যা শিখেছেন আর কোথায় কাজে লাগিয়েছেন, 3) এই চাকরি কেন চান। বাড়িতে জোরে পাঁচবার বলে অভ্যাস করুন।",
      mr: "60 सेकंदांचं सोपं सूत्र: 1) नाव आणि शिक्षण, 2) शिकलेलं एक कौशल्य आणि ते कुठे वापरलं, 3) ही नोकरी का हवी आहे. घरी मोठ्याने पाच वेळा बोलून सराव करा.",
    },
  },
  {
    id: "gst",
    q: {
      hinglish: "GST kya hota hai?",
      hi: "GST क्या होता है?",
      en: "What is GST?",
      ta: "GST என்றால் என்ன?",
      bn: "GST কী?",
      mr: "GST म्हणजे काय?",
    },
    a: {
      hinglish:
        "GST ek tax hai jo saamaan aur services par lagta hai. Dukaandaar yeh tax customer se leta hai aur sarkar ko jama karta hai. Maan lo kisi cheez par 18% GST hai, toh ₹1,000 ki cheez ka bill ₹1,180 banega.",
      hi: "GST एक टैक्स है जो सामान और सेवाओं पर लगता है। दुकानदार यह टैक्स ग्राहक से लेता है और सरकार को जमा करता है। मान लीजिए किसी चीज़ पर 18% GST है, तो ₹1,000 की चीज़ का बिल ₹1,180 बनेगा।",
      en: "GST is a tax on goods and services. The shopkeeper collects it from the customer and pays it to the government. Say an item has 18% GST: a ₹1,000 item comes to ₹1,180 on the bill.",
      ta: "GST என்பது பொருட்கள் மற்றும் சேவைகள் மீதான வரி. கடைக்காரர் அதை வாடிக்கையாளரிடம் வசூலித்து அரசுக்குச் செலுத்துகிறார். 18% GST என்றால், ₹1,000 பொருளின் பில் ₹1,180 ஆகும்.",
      bn: "GST হলো জিনিসপত্র ও পরিষেবার উপর কর। দোকানদার ক্রেতার কাছ থেকে নিয়ে সরকারকে জমা দেন। 18% GST হলে ₹1,000-এর জিনিসের বিল হবে ₹1,180।",
      mr: "GST हा वस्तू आणि सेवांवरील कर आहे. दुकानदार तो ग्राहकाकडून घेतो आणि सरकारकडे भरतो. 18% GST असेल तर ₹1,000 च्या वस्तूचे बिल ₹1,180 होते.",
    },
  },
];

/* ── Stories (fictional but realistic) ── */
export const STORIES = [
  {
    name: "Pooja Kumari",
    meta: "B.Com, final year · Patna",
    quote: "Tally aur GST seekha. Ab ek CA office mein accounts assistant hoon.",
    image: "accountant",
    stat: "Accounts assistant job",
    tag: "Tally & GST",
  },
  {
    name: "Rohit Yadav",
    meta: "SSC CGL aspirant · Prayagraj",
    quote: "Meri DI practice Excel mein kaam aayi. Job bhi, exam bhi.",
    image: "aspirantBooks",
    stat: "MIS executive",
    tag: "Excel & Data",
  },
  {
    name: "Shabnam Qureshi",
    meta: "Back to work after 5 years · Indore",
    quote: "Five years at home. Now I write for three online shops.",
    image: "womanHome",
    stat: "Writing from home",
    tag: "Content Writing",
  },
  {
    name: "Sunil Oraon",
    meta: "12th pass · a village near Gumla, Jharkhand",
    quote: "Sirf phone se shuru kiya. Ab har hafte reels edit karta hoon.",
    image: "creator",
    photoPos: "70% 30%",
    stat: "Reels editing",
    tag: "Video Editing",
  },
  {
    name: "Abhishek Menon",
    meta: "BA English graduate · Kochi",
    quote: "I loved languages. Now a publisher sends me work every month.",
    image: "graduate",
    stat: "Freelance translator",
    tag: "Translation",
  },
  {
    name: "Arjun Reddy",
    meta: "B.Tech, 3rd year · Warangal",
    quote: "Two practice websites helped me land my first internship.",
    image: "heroStudentAlt",
    stat: "Internship offer",
    tag: "Web Development",
  },
];

/* ── For parents ── */
export const PARENT_REASONS = [
  { title: "Verified skills", text: "Anyone can check them online." },
  { title: "Progress you can see", text: "A simple report every week." },
  { title: "Real teachers", text: "Working accountants, designers and writers." },
  { title: "Clear fees", text: "Price, GST and duration shown before you pay." },
  { title: "Safe and respectful", text: "Moderated, and every assessment is scored on a clear rubric." },
];

/* ── FAQ ── */
export const FAQ_ITEMS = [
  {
    q: "I'm not from a tech background. Is Campus for me?",
    a: "Yes. Most of our courses need no coding: accounting and GST, Excel, digital marketing, content writing, translation, graphic design and video editing. Commerce, arts and science students, aspirants and people restarting all learn here.",
  },
  {
    q: "Can I learn in Hindi?",
    a: "Yes. Lessons are in simple English and Hindi, and the AI tutor answers in English, Hinglish, Hindi, Tamil, Telugu, Bengali and Marathi, by text or voice. Ask the same doubt again in your language anytime.",
  },
  {
    q: "Do I need a laptop?",
    a: "Not to start. Lessons, quizzes and the AI tutor work well on a mobile phone, even on slow internet. For some practice work, like Excel, Tally or video editing, a laptop or a cyber cafe computer helps later.",
  },
  {
    q: "How much does a course cost?",
    a: "Each course shows its fee, GST, duration and level before you enrol. Fees are paid in full before you start. One reassessment is included.",
  },
  {
    q: "Will I get verified?",
    a: "Pass the final practical assessment and complete your profile to verify that skill. Anyone can check a verification online with its code. It is not a degree or a government diploma, and projects or earnings are not guaranteed.",
  },
  {
    q: "I'm preparing for a government exam. Will this distract me?",
    a: "No. Aspirant mode is built around your prep. You choose 30 to 90 minutes a day, and lessons build on subjects you already study, like DI, English and banking awareness. Keep your exam first. This is your backup plan.",
  },
];
