import { ASPIRANT_TOPICS, isAspirantCareerQuestion, aspirantCareerReply } from "./learning-tutor-aspirant";

/**
 * Demo AI tutor: keyword-routed, context-aware canned replies in the student's language style.
 * The real backend calls an LLM; this keeps the demo genuinely useful offline.
 */

const TOPICS = [
  ...ASPIRANT_TOPICS,
  {
    key: "react",
    match: /\b(react|jsx|usestate|useeffect|component|props|hook)/i,
    title: "React, the practical way",
    body: `**Think of React as "UI = function(state)".** You describe what the screen should look like for a given state, and React updates the DOM for you.

1. **Components** are just functions that return JSX. Keep each one small — one job each.
2. **Props** flow down (parent → child). They are read-only.
3. **State** (\`useState\`) is data that changes over time. When it changes, the component re-renders.
4. **Effects** (\`useEffect\`) are for syncing with the outside world — fetching data, timers, subscriptions.

\`\`\`jsx
function LikeButton() {
  const [likes, setLikes] = useState(0);
  return <button onClick={() => setLikes(likes + 1)}> {likes}</button>;
}
\`\`\`

**Common mistake:** putting derived values in state. If you can calculate it from props or other state, calculate it during render instead.`,
    tip: "Build one tiny thing today — a counter, then a todo list. Then rebuild a local café's menu page as components. That becomes a portfolio piece.",
  },
  {
    key: "css",
    match: /\b(css|flexbox|flex|grid|tailwind|responsive|media quer|center|centre|margin|padding)/i,
    title: "CSS layout without the headache",
    body: `**Pick the right tool:** Flexbox for one direction (a row of buttons, a navbar), Grid for two directions (a card gallery, a page layout).

\`\`\`css
/* perfectly centre anything */
.parent { display: grid; place-items: center; }

/* responsive card grid — no media queries needed */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}
\`\`\`

- Design **mobile-first**: write the phone styles first, then add \`@media (min-width: 768px)\` for bigger screens.
- Use \`rem\` for font sizes and spacing, \`%\`/\`fr\` for widths.
- When something overflows on mobile, look for fixed \`width\` values or long words — add \`min-width: 0\` on flex children.`,
    tip: "Open DevTools (F12), toggle the device toolbar and test at 375px. Most Indian users are on phones.",
  },
  {
    key: "javascript",
    match: /\b(javascript|js|dom|array|function|async|await|promise|fetch|api call|loop)/i,
    title: "JavaScript fundamentals that matter",
    body: `Focus on the 20% you'll use 80% of the time:

1. **Arrays:** \`map\`, \`filter\`, \`find\`, \`reduce\`.
2. **Objects & destructuring:** \`const { name, price } = product;\`
3. **Async code:** \`fetch\` returns a Promise — use \`async/await\` and always handle errors.

\`\`\`js
async function loadProducts() {
  try {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Request failed");
    const products = await res.json();
    return products.filter((p) => p.inStock);
  } catch (err) {
    console.error(err);
    return [];
  }
}
\`\`\``,
    tip: "Solve 2 small problems a day instead of 20 on Sunday. Consistency beats intensity.",
  },
  {
    key: "git",
    match: /\b(git|github|commit|push|deploy|netlify|vercel|hosting)/i,
    title: "Git and deploying, step by step",
    body: `\`\`\`bash
git init
git add .
git commit -m "First version of the landing page"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
\`\`\`

Then on **Netlify or Vercel**: "Import from GitHub" → choose the repo → deploy. Every push to \`main\` redeploys automatically.

- Write commit messages that say *what changed and why*.
- Never commit \`.env\` files or API keys — add them to \`.gitignore\`.`,
    tip: "A live link in your portfolio is worth 10 screenshots. Clients click links.",
  },
  {
    key: "seo",
    match: /\b(seo|google rank|ranking|keyword|backlink|search engine|google business)/i,
    title: "SEO that actually moves the needle",
    body: `1. **Search intent first:** what is the person trying to do? "Best cake shop near me" wants a map and reviews, not a blog.
2. **Keyword research:** use Google autocomplete, "People also ask" and free tools. Target specific, lower-competition phrases ("eggless birthday cake Jaipur").
3. **On-page basics:** one clear H1, keyword in the title tag and first 100 words, descriptive URLs, compressed images with alt text.
4. **Local SEO:** a complete **Google Business Profile** — category, photos, hours, and asking happy customers for reviews — often beats a blog for local shops.
5. **Measure:** Google Search Console shows which queries you appear for.`,
    tip: "For a first client, offer a ₹1,500 'Google Business Profile setup + 10 review requests' package. Fast results, easy to show.",
  },
  {
    key: "social",
    match: /\b(instagram|reel|reels|social media|content calendar|followers|engagement|linkedin post)/i,
    title: "Instagram & social content strategy",
    body: `- **Pillars:** pick 3–4 content themes (educate, behind-the-scenes, social proof, offers).
- **Hook in 1.5 seconds:** start Reels with the result or a bold line, not "Hi guys".
- **Consistency > virality:** 3 posts a week for 3 months beats 15 posts in one week.
- **Measure saves and shares**, not just likes — they signal real value.

A simple weekly plan: Mon tip carousel, Wed Reel, Fri customer story, Sun story poll.`,
    tip: "Make a 2-week sample calendar for a real local business and send it to them. That's how many students land their first social media client.",
  },
  {
    key: "ads",
    match: /\b(ads|meta ads|facebook ads|google ads|roas|ctr|cpc|cpm|campaign|budget)/i,
    title: "Running ads and reading the numbers",
    body: `**The key metrics, with a worked example:** you spend ₹5,000, get 50,000 impressions, 1,000 clicks and 40 orders worth ₹20,000.

- **CTR** = clicks ÷ impressions = 1,000 ÷ 50,000 = **2%**
- **CPC** = spend ÷ clicks = ₹5,000 ÷ 1,000 = **₹5**
- **Conversion rate** = 40 ÷ 1,000 = **4%**
- **ROAS** = revenue ÷ spend = ₹20,000 ÷ ₹5,000 = **4x**

Start with a small daily budget (₹300–500), one clear audience, 2–3 creatives, and let it run 3–4 days before judging.`,
    tip: "Low CTR → fix the creative. Good CTR but no sales → fix the landing page or offer.",
  },
  {
    key: "figma",
    match: /\b(figma|auto ?layout|wireframe|prototype|mockup|design system|component)/i,
    title: "Working smarter in Figma",
    body: `1. **Frames, not groups** — frames can have auto layout, padding and constraints.
2. **Auto layout everything** (Shift + A): buttons, cards, lists. Your designs become responsive and easy to edit.
3. **Components + variants** for anything you repeat (buttons, inputs, nav). Change once, update everywhere.
4. **Spacing system:** stick to multiples of 4 or 8 (8, 16, 24, 32).
5. **Styles** for colours and text so the whole file stays consistent.`,
    tip: "Redesign one screen of an app you use daily (IRCTC, a food app) and write 5 lines on what you changed and why. Instant case study.",
  },
  {
    key: "uiux",
    match: /\b(ui|ux|user research|usability|persona|case study|user flow|typography|colou?r palette|hierarchy)/i,
    title: "UI/UX fundamentals",
    body: `- **Hierarchy:** make the most important thing biggest, boldest or most colourful. One primary action per screen.
- **Spacing:** whitespace groups related things (proximity). Consistent spacing feels professional.
- **Type:** 2 fonts max, a clear scale (e.g. 32 / 24 / 18 / 16 / 14).
- **Colour:** one brand colour for actions, neutrals for everything else, and check contrast (4.5:1 for body text).
- **Research:** 5 quick user tests find ~80% of usability issues. Ask them to do a task and stay quiet.`,
    tip: "Case studies get you hired when they show the problem, your process and the outcome — not just pretty final screens.",
  },
  {
    key: "excel",
    match: /\b(excel|spreadsheet|vlookup|xlookup|pivot|sumifs|google sheets|formula)/i,
    title: "Excel skills clients pay for",
    body: `**The big five:**

1. \`XLOOKUP\` (or \`VLOOKUP\`) to pull data from another table.
2. \`SUMIFS\` / \`COUNTIFS\` for conditional totals.
3. **Pivot tables** to summarise thousands of rows in seconds.
4. **Data cleaning:** \`TRIM\`, \`PROPER\`, Remove Duplicates, Text to Columns.
5. **Conditional formatting** to make problems jump out.

\`\`\`text
=SUMIFS(Sales[Amount], Sales[City], "Pune", Sales[Month], "Oct")
=XLOOKUP(A2, Products[SKU], Products[Price], "Not found")
\`\`\``,
    tip: "Small businesses drown in messy sales sheets. A clean monthly MIS report is a ₹2,000–₹5,000 gig.",
  },
  {
    key: "sql",
    match: /\b(sql|query|select|join|group by|database|mysql|postgres)/i,
    title: "SQL in plain words",
    body: `Read a query in this order: **FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY**.

\`\`\`sql
SELECT c.city,
       COUNT(o.id)   AS orders,
       SUM(o.amount) AS revenue
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.created_at >= '2025-01-01'
GROUP BY c.city
HAVING SUM(o.amount) > 50000
ORDER BY revenue DESC;
\`\`\`

- \`WHERE\` filters rows **before** grouping, \`HAVING\` filters groups **after**.
- \`LEFT JOIN\` keeps every row from the left table, even without a match — great for "customers who never ordered".`,
    tip: "Practise on a real dataset (Kaggle has Indian e-commerce data). Write the business question first, then the query.",
  },
  {
    key: "python",
    match: /\b(python|pandas|script|automation|automate|csv|openpyxl)/i,
    title: "Python for automation",
    body: `Python shines at boring, repeatable work: renaming files, merging Excel sheets, sending reports.

\`\`\`python
import pandas as pd

sales = pd.read_csv("sales.csv")
summary = (
    sales.groupby("city")["amount"]
    .sum()
    .sort_values(ascending=False)
)
summary.to_excel("city_summary.xlsx")
print(summary.head())
\`\`\`

- Break the task into steps you'd do by hand, then automate one step at a time.
- Use virtual environments (\`python -m venv .venv\`) and keep secrets in environment variables.`,
    tip: "Ask a shop owner what they do manually every week. That task is your first automation gig.",
  },
  {
    key: "ai",
    match: /\b(ai|chatgpt|llm|prompt|gpt|openai|gemini|claude|chatbot)/i,
    title: "Using AI well (and prompting properly)",
    body: `A good prompt has **role, task, context, format and constraints**:

> You are a copywriter for a Jaipur bakery. Write 3 Instagram captions for our new eggless brownies. Audience: college students. Tone: playful. Max 25 words each. Include one emoji.

- Ask for **structured output** (bullet points, JSON) when you'll reuse the result.
- Give **examples** of what good looks like.
- **Always verify** facts, numbers and code — AI is confident even when it's wrong.`,
    tip: "Use AI to get unstuck and to draft, then add your judgement. Clients pay for judgement.",
  },
  {
    key: "flutter",
    match: /\b(flutter|dart|widget|android|apk|play store|firebase|mobile app)/i,
    title: "Flutter, the essentials",
    body: `Everything is a **widget**. Stateless widgets just display; Stateful widgets hold data that changes.

\`\`\`dart
class Counter extends StatefulWidget {
  const Counter({super.key});
  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int count = 0;
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () => setState(() => count++),
      child: Text('Tapped $count times'),
    );
  }
}
\`\`\`

- Layout with \`Column\`, \`Row\`, \`Expanded\` and \`Padding\`.
- Use \`flutter build apk --release\` for a shareable APK.`,
    tip: "Test on a real budget Android phone — that's what most of your users have.",
  },
  {
    key: "video",
    match: /\b(video|premiere|capcut|edit|editing|b-roll|broll|cut|transition|colou?r grad|export|youtube)/i,
    title: "Editing videos that hold attention",
    body: `1. **Hook first:** the first 2–3 seconds decide everything. Start with the payoff or a bold claim.
2. **Cut the air:** remove pauses, "umm"s and repeated takes. Keep a cut every 2–4 seconds for Reels.
3. **J and L cuts:** let audio lead or trail the picture — it makes edits feel smooth.
4. **Captions:** most people watch on mute. Big, readable, 2–4 words at a time.
5. **Export right:** Reels 1080×1920, YouTube 1920×1080 (or 4K), H.264, high bitrate.`,
    tip: "Re-edit a creator's existing video in your style and send it to them. Speculative edits land clients.",
  },
  {
    key: "writing",
    match: /\b(writ|blog|article|content|copy|caption|headline|newsletter|grammar)/i,
    title: "Writing that people actually read",
    body: `- **One idea per paragraph**, 2–4 lines max. Lots of white space.
- **Lead with the point.** Readers skim — the first line of each section should carry the message.
- **Specific beats vague:** "Saves 3 hours a week" > "saves time".
- **Edit in passes:** structure → clarity → cut 20% → grammar.
- For SEO blogs: answer the search query in the first 100 words, then go deeper with H2s.`,
    tip: "Write 3 samples in the niche you want to get paid for (fintech, food, travel). Samples win clients, not certificates.",
  },
  {
    key: "graphic",
    match: /\b(graphic|canva|illustrator|photoshop|poster|logo|branding|font|typography|thumbnail)/i,
    title: "Graphic design basics that make work look pro",
    body: `Remember **C.R.A.P.**: **C**ontrast, **R**epetition, **A**lignment, **P**roximity.

- One focal point per design. Make it 2–3× bigger than everything else.
- Max 2 typefaces. Pair a bold display font with a simple sans.
- Align everything to something — invisible lines make designs feel intentional.
- Leave breathing room. Crowded = cheap.
- Export: PNG for social posts, PDF (with bleed) for print, SVG for logos.`,
    tip: "Make a festive template pack (Diwali, Eid, Christmas) for local shops — seasonal demand is huge.",
  },
  {
    key: "resume",
    match: /\b(resume|cv|interview|job|internship|linkedin profile|placement|hire|hired)/i,
    title: "A resume and profile that get callbacks",
    body: `1. **One page.** Recruiters spend ~7 seconds on the first scan.
2. **Projects > coursework.** For each: what you built, the tools, and a result ("cut load time by 40%", "used by 200 students").
3. **Links:** live projects, GitHub/Behance, and your **Campus Skill Passport** — verified work beats claims.
4. **Tailor** the top 3 bullet points to each job description.
5. **Interview prep:** for every project, be ready to explain one hard problem and how you solved it.`,
    tip: "Ask your mentor for a 15-minute resume review session — it's one of the highest-ROI things you can do.",
  },
  {
    key: "pricing",
    match: /\b(pric|charge|rates?\b|quote|kitna|gig|freelanc|fiverr|upwork|invoice|negotiat|payment)/i,
    title: "Pricing your first gigs",
    body: `**A simple formula:** estimate hours × your hourly rate + 20% buffer for revisions.

- Starting rates for students in India: **₹200–₹500/hour**, or fixed prices like ₹1,500 for a landing page, ₹300 per social post, ₹1–2 per word for writing.
- **Price the outcome, not the hours** once you have proof ("a site that gets you WhatsApp enquiries").
- Always agree in writing: scope, number of revisions (2 is standard), timeline, and payment terms (**50% upfront** for new clients).
- Use UPI or Razorpay links and send a simple invoice.

On Campus, micro-gigs (₹200–₹1,500) are mentor-reviewed, so you build proof safely before going solo.`,
    tip: "Never compete on being the cheapest. Compete on being the most reliable — reply fast, deliver on time.",
  },
];

const GREETINGS = {
  en: "Great question!",
  hinglish: "Accha sawaal hai!",
  hi: "बहुत अच्छा सवाल!",
  ta: "வணக்கம்! Great question.",
  te: "నమస్కారం! Great question.",
  bn: "নমস্কার! Great question.",
  mr: "नमस्कार! Great question.",
};

const INTROS = {
  en: (t) => `Let's break down **${t}** step by step.`,
  hinglish: (t) => `Chalo, **${t}** ko step by step samajhte hain — bilkul simple rakhenge.`,
  hi: (t) => `चलो, **${t}** को step-by-step समझते हैं — एकदम आसान भाषा में।`,
  ta: (t) => `Let's go through **${t}** step by step.`,
  te: (t) => `Let's go through **${t}** step by step.`,
  bn: (t) => `Let's go through **${t}** step by step.`,
  mr: (t) => `चला, **${t}** step by step समजून घेऊया.`,
};

const TIP_LABEL = { en: "Pro tip", hinglish: "Kaam ki baat", hi: "काम की बात", ta: "Pro tip", te: "Pro tip", bn: "Pro tip", mr: "महत्त्वाची टीप" };

const CLOSERS = {
  en: "Want me to give you a small practice task on this, or explain any step in more detail?",
  hinglish: "Kya main is par ek chhota practice task doon? Ya koi step aur detail mein samjhaun?",
  hi: "क्या मैं इस पर एक छोटा practice task दूँ? या कोई step और detail में समझाऊँ?",
  ta: "Want a small practice task on this? நன்றி!",
  te: "Want a small practice task on this? ధన్యవాదాలు!",
  bn: "Want a small practice task on this? ধন্যবাদ!",
  mr: "यावर एक छोटा practice task देऊ का? की एखादी step अजून detail मध्ये समजावू?",
};

const LESSON_INTRO = {
  en: (l, c) => `You're on **${l}** in *${c}*, so I'll keep it tied to that lesson.`,
  hinglish: (l, c) => `Aap abhi *${c}* ka **${l}** lesson padh rahe ho, toh main usi ke hisaab se samjhata hoon.`,
  hi: (l, c) => `आप अभी *${c}* का **${l}** lesson पढ़ रहे हैं, तो मैं उसी के हिसाब से समझाता हूँ।`,
  ta: (l, c) => `You're on **${l}** in *${c}*, so I'll keep it tied to that lesson.`,
  te: (l, c) => `You're on **${l}** in *${c}*, so I'll keep it tied to that lesson.`,
  bn: (l, c) => `You're on **${l}** in *${c}*, so I'll keep it tied to that lesson.`,
  mr: (l, c) => `तुम्ही आत्ता *${c}* मधला **${l}** lesson करत आहात, म्हणून त्याच्याशी जोडून सांगतो.`,
};

/** Pull a few headings/bullets from lesson markdown as "key ideas". */
function keyIdeas(markdown = "", max = 4) {
  const lines = markdown.split("\n").map((l) => l.trim());
  const bullets = lines.filter((l) => /^[-*] /.test(l)).map((l) => l.replace(/^[-*] /, ""));
  const headings = lines.filter((l) => /^#{2,3} /.test(l) && !/key points|transcript/i.test(l)).map((l) => l.replace(/^#+ /, ""));
  const pool = bullets.length >= 2 ? bullets : headings;
  return pool.slice(0, max).map((s) => (s.length > 160 ? `${s.slice(0, 157)}…` : s));
}

function lessonSummaryReply(lang, lesson, course) {
  const ideas = keyIdeas(`${lesson.content || ""}\n${lesson.assignment?.brief || ""}`);
  const label = lang === "hinglish" ? "Is lesson ke main points" : lang === "hi" ? "इस lesson के मुख्य points" : "The key ideas in this lesson";
  const how =
    lang === "hinglish"
      ? "Ise yaad rakhne ka best tareeka: har point ko apne words mein ek line mein likho, phir ek chhota example khud banao."
      : lang === "hi"
        ? "याद रखने का सबसे अच्छा तरीका: हर point को अपने शब्दों में एक line में लिखो, फिर खुद एक छोटा example बनाओ।"
        : "The best way to lock this in: rewrite each point in one line in your own words, then build one tiny example yourself.";
  const typeNote =
    lesson.type === "QUIZ"
      ? "\n\nThis is a quiz — I won't give away answers, but I'm happy to explain any concept behind a question."
      : lesson.type === "ASSIGNMENT"
        ? "\n\nFor the assignment: read the rubric first and make sure every row is clearly visible in what you submit. Mentors grade against it."
        : "";
  return `**${lesson.title}** — *${course.title}*\n\n${label}:\n\n${ideas.length ? ideas.map((i) => `- ${i}`).join("\n") : "- Go through the lesson once fully, then come back and ask me about any part."}\n\n${how}${typeNote}`;
}

// money and career questions win over tool keywords ("how much to charge for a logo")
const PRIORITY = ["pricing", "resume"];
const ORDERED = [...TOPICS.filter((t) => PRIORITY.includes(t.key)), ...TOPICS.filter((t) => !PRIORITY.includes(t.key))];

function detectTopic(text) {
  return ORDERED.find((t) => t.match.test(text)) || null;
}

export function tutorReply({ message, history = [], language = "en", context, user }) {
  const lang = GREETINGS[language] ? language : "en";
  const text = message.trim();
  const lower = text.toLowerCase();
  const firstName = (user?.name || "").split(" ")[0];
  const lesson = context?.lesson;
  const course = context?.course;

  // greetings / small talk
  if (/^(hi|hello|hey|namaste|namaskar|hii+|yo|vanakkam)\b[\s!.]*$/i.test(text)) {
    const hello = {
      en: `Hi ${firstName}! I'm your Campus tutor. Ask me anything — a concept you're stuck on, code that isn't working, or how to price your first gig.`,
      hinglish: `Hello ${firstName}! Main aapka Campus tutor hoon. Kuch bhi poocho — koi concept samajh nahi aa raha, code chal nahi raha, ya pehle gig ka price kaise rakhein.`,
      hi: `नमस्ते ${firstName}! मैं आपका Campus tutor हूँ। कुछ भी पूछिए — कोई concept, code की problem, या पहले gig का price कैसे रखें।`,
    };
    return hello[lang] || `${GREETINGS[lang].split("!")[0]}! ${hello.en.replace(/^Hi [^!]*! /, "")}`;
  }

  // govt-exam aspirants: gap year, career switch, explaining prep years in interviews
  if (isAspirantCareerQuestion(text, user)) return aspirantCareerReply(lang, user);

  // "summarise / explain this lesson" with lesson context
  if (lesson && course && /(summar|explain (this|the) lesson|this lesson|key points|recap|samjha|समझा|kya hai ye|tl;?dr)/i.test(lower) && !detectTopic(text.replace(/lesson/gi, ""))) {
    return lessonSummaryReply(lang, lesson, course);
  }

  // topic: from the message, else from the lesson/course context, else from recent history
  const topic =
    detectTopic(text) ||
    (lesson && detectTopic(`${lesson.title} ${course?.title || ""}`)) ||
    (course && detectTopic(`${course.title} ${(course.skills || []).join(" ")}`)) ||
    detectTopic(
      history
        .filter((m) => m.role === "user")
        .slice(-3, -1)
        .map((m) => m.content)
        .join(" "),
    );

  const parts = [];
  if (topic) {
    parts.push(`${GREETINGS[lang]} ${INTROS[lang](topic.title)}`);
    if (lesson && course) parts.push(LESSON_INTRO[lang](lesson.title, course.title));
    parts.push(topic.body);
    if (lesson) {
      const ideas = keyIdeas(lesson.content, 3);
      if (ideas.length) parts.push(`**Connecting it to this lesson:**\n\n${ideas.map((i) => `- ${i}`).join("\n")}`);
    }
    parts.push(`**${TIP_LABEL[lang]}:** ${topic.tip}`);
    parts.push(CLOSERS[lang]);
    return parts.join("\n\n");
  }

  // fallback: a study plan / clarifying reply
  if (lesson && course) return lessonSummaryReply(lang, lesson, course);
  const fallback = {
    en: `${GREETINGS.en} I want to give you a precise answer, so here's how I can help best:\n\n1. **Tell me the topic** — e.g. React state, SQL joins, Instagram Reels, pricing a logo gig.\n2. **Share what you tried** — paste code, a formula or your draft.\n3. **Say your goal** — understanding, fixing an error, or preparing for a gig.\n\nMeanwhile, a solid study rhythm: **30 minutes a day**, one lesson + one tiny practice task, and ask the community when you're stuck for more than 20 minutes.`,
    hinglish: `${GREETINGS.hinglish} Sahi answer dene ke liye thoda aur batao:\n\n1. **Topic kya hai** — jaise React state, SQL joins, Instagram Reels, logo gig ka pricing.\n2. **Aapne kya try kiya** — code, formula ya draft paste karo.\n3. **Goal kya hai** — concept samajhna, error fix karna, ya gig ki taiyari.\n\nTab tak ek simple routine: **roz 30 minute**, ek lesson + ek chhota practice task. 20 minute se zyada atko toh community mein pooch lo.`,
    hi: `${GREETINGS.hi} सही जवाब देने के लिए थोड़ा और बताइए:\n\n1. **Topic क्या है** — जैसे React state, SQL joins, Instagram Reels, logo gig की pricing।\n2. **आपने क्या try किया** — code, formula या draft paste करें।\n3. **Goal क्या है** — concept समझना, error ठीक करना, या gig की तैयारी।\n\nतब तक एक आसान routine: **रोज़ 30 मिनट**, एक lesson + एक छोटा practice task।`,
  };
  return fallback[lang] || `${GREETINGS[lang]}\n\n${fallback.en.replace(/^Great question! /, "")}`;
}
