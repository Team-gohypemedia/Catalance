/**
 * Seed data for the "community" domain: threads, replies, bookings, cohorts, cohortPosts, notifications, mentorReviews.
 * All dates are relative (hoursAgo / daysAgo / daysFromNow) so the demo always feels live.
 * Bookings store `startsAt` (ISO) in seeds; handlers derive `date` (YYYY-MM-DD) + keep `time` (HH:mm).
 */
import { daysAgo, hoursAgo, daysFromNow, seeded } from "../utils";

const rand = seeded(311);
const studentIds = Array.from({ length: 48 }, (_, i) => `s_${i + 1}`);
const pickVoters = (n, include = []) => {
  const pool = [...studentIds].sort(() => rand() - 0.5).slice(0, Math.max(0, n - include.length));
  return [...include, ...pool];
};

/* ───────────────────────── Threads + replies ─────────────────────────
   Each entry: [authorId, hoursAgo, title, body, tags, trackSlug|null, voters, replies[], acceptedIndex|null, includeStudentVote]
   replies: [authorId, hoursAfterThread, body, voters] */
const T = [
  {
    author: "u_student", h: 30, track: "web-development", tags: ["react", "hooks", "javascript"], votes: 14, aarav: false,
    title: "useEffect running twice on page load — bug hai ya feature?",
    body: `Bhai log, my \`useEffect\` is firing **two times** whenever the page loads. I'm calling an API inside it so it hits my backend twice.

\`\`\`jsx
useEffect(() => {
  fetch("/api/projects").then(r => r.json()).then(setProjects);
}, []);
\`\`\`

The dependency array is empty, so shouldn't it run only once? Using Vite + React 18. Am I doing something wrong?`,
    accepted: 0,
    replies: [
      ["m_2", 1, `Not a bug — it's **React 18 StrictMode** in development. React mounts, unmounts and re-mounts every component once to help you catch effects that don't clean up properly. In production builds it runs once.

The real fix is to make the effect safe to run twice:

\`\`\`jsx
useEffect(() => {
  const ctrl = new AbortController();
  fetch("/api/projects", { signal: ctrl.signal })
    .then(r => r.json())
    .then(setProjects)
    .catch(e => { if (e.name !== "AbortError") throw e; });
  return () => ctrl.abort();
}, []);
\`\`\`

Even better for real projects: use TanStack Query, it dedupes requests for you. Don't remove StrictMode to "fix" it — that just hides bugs.`, 22],
      ["s_7", 3, "Same thing confused me for a whole evening Check `main.jsx` — you'll see `<StrictMode>` wrapping your app. Run `npm run build && npm run preview` and it fires once.", 6],
      ["s_19", 5, "Pro tip from my last internship: interviewers *love* asking this. Remember the phrase \"StrictMode double-invokes effects in dev to surface missing cleanups\".", 9],
    ],
  },
  {
    author: "s_12", h: 52, track: "graphic-design", tags: ["pricing", "freelancing", "logo"], votes: 31, aarav: true,
    title: "How do I price my first logo gig? Client is a local café in Indore",
    body: `A café owner near my college (Vijay Nagar, Indore) wants a logo + menu header. It's my first paid design work. He asked "kitna loge?" and I froze.

- I've done ~10 practice logos on Campus
- He needs: logo, 2 colour variations, Instagram profile pic version

What's a fair price? I don't want to scare him away but I also don't want to work for ₹500.`,
    accepted: 1,
    replies: [
      ["s_31", 2, "I charged ₹1,500 for my first one and regretted it, took 3 weeks of revisions. Quote higher than you think!", 4],
      ["m_8", 4, `Congratulations on your first client! Here's how I'd think about it:

**1. Price the package, not the hours.** For a local café: logo + 2 colour variants + social avatar is a *starter brand kit*.

**2. Ballpark for a beginner in a tier-2 city:** ₹3,000–₹6,000. Quote **₹4,500** and leave room to give a "student discount" to ₹4,000 if he pushes.

**3. Put limits in writing:**
- 3 initial concepts
- 2 rounds of revisions
- Final files: PNG, SVG, PDF
- 50% advance on UPI before you start

**4. Show, don't tell.** Send a one-page PDF with your process (moodboard → sketches → final). Owners pay more when they see a process.

You've got this. Post the final logo in the portfolio once it's done!`, 38],
      ["s_4", 6, "Saving this. The 50% advance part is gold — learnt it the hard way", 7],
      ["u_student", 9, "Also add a line that he can't ask for a whole new concept after round 2 — otherwise it never ends. Worked for me on my first web client.", 11],
    ],
  },
  {
    author: "s_23", h: 20, track: "content-writing", tags: ["clients", "revisions", "freelancing"], votes: 26, aarav: false,
    title: "Client wants unlimited revisions — what do I say without losing the gig?",
    body: `Got a blog-writing gig (4 posts/month, ₹800 each) from a Bangalore startup. Contract is fine, but the founder wrote on WhatsApp: *"We'll need unlimited revisions till we're happy."*

How do I push back politely? I really need this gig, it's my first recurring income.`,
    accepted: 0,
    replies: [
      ["m_5", 2, `Very common, and very fixable. Founders say "unlimited" because they're scared of getting bad work — not because they want 15 drafts. Address the fear, then set the limit.

Try something like:

> "Totally get it — you want posts that sound like you. Here's how I'll make sure of that: before writing, I'll send a 5-line outline for your approval. After that, each post includes **2 revision rounds** within 7 days. If we need a full rewrite because the direction changed, that's billed as a new post. This keeps both of us fast."

The outline step is the magic. 90% of revisions happen because the brief was fuzzy.`, 41],
      ["s_40", 3, "Bhai, mention it in the invoice too. \"Includes 2 revisions\" — once it's on paper nobody argues.", 8],
      ["m_3", 5, "+1 to Debjani. Also send a quick Loom/voice note explaining your first draft. Clients revise less when they understand your reasoning.", 12],
    ],
  },
  {
    author: "s_8", h: 75, track: "data-analytics", tags: ["sql", "assignment", "joins"], votes: 12, aarav: false,
    title: "SQL JOIN vs subquery for my assignment — which one is 'correct'?",
    body: `Assignment: *"List students who scored above their department's average."*

My friend used a JOIN, I used a correlated subquery. Both give the same output. Teacher said "use the efficient one". Which one is it?

\`\`\`sql
SELECT s.name, s.marks
FROM students s
WHERE s.marks > (
  SELECT AVG(marks) FROM students WHERE dept_id = s.dept_id
);
\`\`\``,
    accepted: 1,
    replies: [
      ["s_15", 3, "JOIN is always faster, subqueries are slow. Use JOIN.", 1],
      ["m_4", 5, `"Always" is not quite right Your correlated subquery runs \`AVG\` once **per student row** (unless the optimizer rewrites it). The cleaner pattern is to compute each department's average **once** and join to it:

\`\`\`sql
WITH dept_avg AS (
  SELECT dept_id, AVG(marks) AS avg_marks
  FROM students
  GROUP BY dept_id
)
SELECT s.name, s.marks
FROM students s
JOIN dept_avg d ON d.dept_id = s.dept_id
WHERE s.marks > d.avg_marks;
\`\`\`

For a college dataset of 500 rows you'll see no difference. On 5 lakh rows, the CTE + JOIN wins. Write the CTE version and add one line in your answer explaining *why* — that's what gets you full marks.`, 27],
      ["s_8", 7, "Ohh the CTE version is so much more readable too. Thank you sir!", 3],
    ],
  },
  {
    author: "s_27", h: 9, track: "graphic-design", tags: ["canva", "illustrator", "tools"], votes: 19, aarav: true,
    title: "Is Canva enough or should I learn Illustrator for freelancing?",
    body: "I make Instagram posts and posters for college fests in Canva and people like them. Will clients take me seriously with just Canva? Illustrator feels scary and Adobe subscription is expensive for me.",
    accepted: null,
    replies: [
      ["m_8", 1, `Honest answer: **Canva is enough to start earning, not enough to grow.**

- Social posts, fest posters, simple reels covers → Canva is perfect, and clients care about results.
- Logos, brand identities, packaging, anything that gets printed big → you need vector tools.

You don't need Adobe right now. Learn **Figma** (free) or **Inkscape** (free) for vector work. The skills (pen tool, boolean shapes, grids) transfer 1:1 to Illustrator later.

Plan: keep earning with Canva, spend 30 min a day on vector basics. In 6 weeks you'll be quoting for logos.`, 24],
      ["s_44", 2, "I do ₹600–₹1,200 Canva gigs for local coaching centres every month. Canva is totally fine for that market", 9],
      ["s_2", 4, "Figma for vectors is underrated. The Campus UI/UX track has a pen tool lesson, check it out.", 5],
    ],
  },
  {
    author: "s_33", h: 14, track: "content-writing", tags: ["hinglish", "captions", "brand-voice", "instagram"], votes: 17, aarav: false,
    title: "Hinglish captions for a Jaipur brand — tone help chahiye",
    body: `Writing Instagram captions for a block-print saree brand from Jaipur. Owner wants "young, Hinglish, but classy". My drafts are either too cringe or too formal

Example of mine:
> *"Ye saree itni pyaari hai ki aap fall in love kar jaoge!!!"*

How do I make Hinglish sound premium?`,
    accepted: 0,
    replies: [
      ["m_5", 1, `Love this brief! Premium Hinglish = **fewer words, one Hindi hook, no exclamation spam.**

Rewrites:
- *"Haath se chhapa, dil se pehna. Block-printed in Jaipur, made for your Sunday plans."*
- *"Dadi ki almirah wali feeling, but make it 2026."*
- *"Indigo, sanganeri, aur thoda sa sukoon."*

Rules I follow:
1. One Hindi phrase that carries emotion, rest in clean English
2. Max one emoji, and only if it adds meaning
3. Use sensory words: *haath se, mitti, dhoop, sukoon*
4. Read it out loud — if your mom would roll her eyes, cut it`, 33],
      ["s_11", 3, "\"Dadi ki almirah wali feeling\" this is so good. Stealing the read-aloud rule.", 6],
      ["m_3", 6, "From the ads side: test 2–3 caption styles as Reels captions for a week and see which one gets more saves. Saves = premium audience signal.", 10],
    ],
  },
  {
    author: "u_student", h: 100, track: "web-development", tags: ["tailwind", "css", "responsive"], votes: 8, aarav: false,
    title: "Tailwind: horizontal scroll on mobile and I can't find the culprit",
    body: "My landing page has a tiny horizontal scroll on 375px width. I've checked every section. How do you debug which element is overflowing?",
    accepted: 0,
    replies: [
      ["m_2", 2, `Paste this in DevTools console — it outlines every element wider than the viewport:

\`\`\`js
[...document.querySelectorAll("*")].forEach(el => {
  if (el.offsetWidth > document.documentElement.offsetWidth) {
    el.style.outline = "2px solid red";
    console.log(el);
  }
});
\`\`\`

Usual suspects: a \`w-screen\` inside a padded container, long URLs/words (fix with \`break-words\`), absolute blobs with negative right offset (add \`overflow-hidden\` on the parent), and grids with fixed min widths.`, 19],
      ["s_29", 4, "It was a decorative blur circle for me `-right-20` on an absolute div. `overflow-x-hidden` on the section fixed it.", 5],
    ],
  },
  {
    author: "s_5", h: 6, track: "digital-marketing", tags: ["meta-ads", "budget", "d2c"], votes: 11, aarav: false,
    title: "₹5,000 Meta ads budget for a home bakery — how to split it?",
    body: "My cousin runs a home bakery in Lucknow and gave me ₹5,000 to run Instagram ads for Diwali hampers. Never run ads with real money before. How should I split the budget and what should I target?",
    accepted: null,
    replies: [
      ["m_3", 1, `Nice first campaign! For ₹5,000 over ~10 days:

- **Days 1–3 · ₹1,500** → test 3 creatives (Reel, carousel, static)
- **Days 4–10 · ₹3,500** → put everything on the winner

**Targeting:** Lucknow + 8 km radius, 24–45, interests: gifting, Diwali, home bakers. Keep it broad — Meta's algorithm is smarter than manual interests now.

**Objective:** Messages (WhatsApp click-to-chat). Home bakeries close sales in DMs, not on websites.

Track one number: **cost per WhatsApp conversation**. Under ₹40 is good for hampers.`, 15],
      ["s_38", 2, "Use real photos of the hampers, not Canva mockups. Real kitchen photos convert way better for home bakers.", 4],
    ],
  },
  {
    author: "s_17", h: 44, track: "video-editing", tags: ["premiere-pro", "laptop", "performance"], votes: 9, aarav: false,
    title: "Premiere Pro lagging on my 8GB laptop — kya karun?",
    body: "Editing 4K phone footage for a YouTuber client. Timeline stutters, preview is unwatchable. I can't buy a new laptop right now. Any settings that actually help?",
    accepted: 0,
    replies: [
      ["m_6", 1, `Been there — I edited my first 50 videos on a ₹35k laptop. Do these in order:

1. **Proxies.** Right-click clips → Proxy → Create Proxies (ProRes 422 Proxy or H.264 720p). Toggle the proxy button in the monitor. This alone fixes 80%.
2. Playback resolution → **1/4**.
3. Close Chrome. Seriously. 30 tabs = 3GB RAM.
4. Media cache on your fastest drive, clean it monthly.
5. Phone footage is often *variable frame rate* — convert with HandBrake to constant 30fps first.

Your export will still be full 4K quality. Proxies only affect editing.`, 28],
      ["s_46", 3, "Proxies changed my life. Also try CapCut desktop for short reels, it's very light.", 6],
    ],
  },
  {
    author: "s_3", h: 3, track: "ui-ux-design", tags: ["figma", "auto-layout", "beginners"], votes: 5, aarav: false,
    title: "Auto layout in Figma keeps breaking my card design",
    body: "Whenever I add text to my card, the image stretches weirdly and the button jumps. I've watched 3 tutorials and still confused. Can someone explain hug vs fill in simple words?",
    accepted: null,
    replies: [
      ["u_mentor", 1, `Simple version:

- **Hug contents** → "be as big as what's inside me" (like a button around its label)
- **Fill container** → "stretch to take all the space my parent gives me"
- **Fixed** → "I don't care, I'm exactly 240px"

For a card: the **card** is Fixed width (say 320), Hug height. The **image** is Fill width, Fixed height (180). The **text** is Fill width, Hug height. The **button** is Hug both.

Your image stretches because it's probably on Fill height. Set it to Fixed and it'll stop. Want me to look at your file? Book a free slot with me`, 12],
    ],
  },
  {
    author: "s_21", h: 130, track: "app-development", tags: ["flutter", "firebase", "auth"], votes: 7, aarav: false,
    title: "Firebase phone OTP not working on real device, works on emulator",
    body: "Flutter app, phone auth works on emulator but on my Redmi phone I get `missing-client-identifier`. SHA-1 is added. What am I missing?",
    accepted: 0,
    replies: [
      ["m_7", 2, `Classic one. Check these:

1. Add **both SHA-1 and SHA-256** — debug *and* release keys. Get them with \`./gradlew signingReport\`.
2. Download the **new** \`google-services.json\` after adding the keys and replace the old file.
3. Enable **Play Integrity API** in Google Cloud console for the same project.
4. Redmi/MIUI: make sure Chrome is updated — the reCAPTCHA fallback opens in Chrome.

Then \`flutter clean && flutter run\`. 9 out of 10 times it's step 2.`, 14],
      ["s_21", 4, "It was step 2!! I had the old json Thank you so much Kiran sir.", 3],
    ],
  },
  {
    author: "s_14", h: 18, track: null, tags: ["career", "non-tech", "first-income"], votes: 23, aarav: true,
    title: "B.Com 2nd year, no coding background — which track gets me earning fastest?",
    body: "Everyone around me is doing coding. I'm from B.Com and honestly not interested in programming. I want to earn ₹5–10k/month alongside college. Which Campus track is fastest to the first gig?",
    accepted: 1,
    replies: [
      ["s_40", 2, "Content writing! Got my first ₹800 gig in 3 weeks. If you can write decent English (or Hindi), start there.", 9],
      ["m_3", 3, `Coming from commerce is actually an advantage — you understand margins, customers and selling. Fastest routes I've seen for B.Com students:

1. **Digital marketing** — local businesses (coaching centres, clinics, cafés) need someone to run Instagram and Google Business. First gig in 3–5 weeks is common.
2. **Content writing** — product descriptions, blogs. Low barrier, steady.
3. **Data analytics (Excel + Power BI)** — slower start, but your accounting knowledge makes you stand out.

Start with 1 or 2, aim for Stage 3 (micro-gigs) on the Earn Ladder in a month. And don't compare with the coding crowd — clients pay for outcomes, not for languages.`, 35],
      ["s_9", 5, "B.Com here too, doing Instagram for 2 clinics now at ₹4k each/month. Digital marketing 100%.", 12],
    ],
  },
  {
    author: "s_36", h: 4, track: "ai-automation", tags: ["chatgpt", "automation", "zapier"], votes: 6, aarav: false,
    title: "Can I sell 'AI automation' to small businesses as a 2nd year student?",
    body: "I built a Google Sheets + ChatGPT flow that writes product descriptions automatically. Is this sellable? Who would buy it and how much should I charge?",
    accepted: null,
    replies: [
      ["s_19", 1, "Yes! Shopify/Meesho sellers with 200+ products would love this. Try charging per 100 descriptions instead of a flat fee.", 4],
    ],
  },
  {
    author: "s_42", h: 220, track: "web-development", tags: ["git", "github", "beginners"], votes: 15, aarav: false,
    title: "Accidentally pushed my .env with API keys to GitHub",
    body: "I deleted the file and pushed again but I read it's still in the history. What do I do? It has my OpenAI key.",
    accepted: 0,
    replies: [
      ["m_2", 1, `Don't panic, do this in order:

1. **Revoke the key right now** in the OpenAI dashboard. Assume it's already leaked — bots scan GitHub in minutes.
2. Create a new key, put it in \`.env\`, and add \`.env\` to \`.gitignore\`.
3. Optionally clean history with \`git filter-repo --path .env --invert-paths\` and force push.

Step 1 is the only one that really matters. History cleaning is nice-to-have; a revoked key is useless to anyone.`, 25],
      ["s_13", 2, "Happened to me with a Firebase key. Also add a `.env.example` with empty values so teammates know what's needed.", 7],
    ],
  },
  {
    author: "s_25", h: 60, track: "content-writing", tags: ["portfolio", "samples", "beginners"], votes: 10, aarav: false,
    title: "No clients yet — how do I make writing samples that don't look fake?",
    body: "Every gig asks for samples. I have none because I have no clients. Chicken and egg problem. Kya karein?",
    accepted: 0,
    replies: [
      ["m_5", 2, `Write **spec pieces for real brands** you like — clearly labelled "spec work":

- Rewrite the About page of a local brand you love
- Write 3 product descriptions for a D2C brand on Instagram
- A blog post for a SaaS tool you actually use

Then submit them as Campus assignments — once a mentor reviews them, they show up as **verified** in your Proof Portfolio. That carries more weight than "samples" in a Google Doc.`, 18],
      ["s_31", 4, "Did exactly this — the verified tag on my portfolio got me 2 interviews. Works.", 6],
    ],
  },
  {
    author: "u_student", h: 8, track: "ui-ux-design", tags: ["figma", "portfolio", "case-study"], votes: 4, aarav: false,
    title: "How long should a UI/UX case study be for my portfolio?",
    body: "I redesigned our college canteen ordering app as a practice project. Should the case study be a long Medium-style article or a few slides? Recruiters probably don't read much, right?",
    accepted: null,
    replies: [
      ["u_mentor", 2, `Recruiters skim, so structure for skimming:

1. **Hero**: final screens + one-line outcome ("cut order time from 4 min to 90 sec")
2. **Problem** (3 lines + one real quote from a classmate)
3. **Process** — 3–4 images max: research → wireframes → iterations
4. **Final UI** + one thing you'd improve

~800 words, lots of visuals. If they're interested in minute one, they'll read the rest.`, 9],
      ["s_6", 3, "The canteen idea is so relatable. Post the link when it's done!", 2],
    ],
  },
  {
    author: "s_11", h: 26, track: "data-analytics", tags: ["power-bi", "excel", "dashboard"], votes: 8, aarav: false,
    title: "Power BI dashboard for a kirana shop — what metrics would the owner care about?",
    body: "My uncle's kirana store has 2 years of billing data in Excel. I want to build a dashboard for him as a portfolio project. What should I show? He's not a numbers person.",
    accepted: 0,
    replies: [
      ["m_4", 3, `Great real-world project! For a shop owner, keep it to **5 cards**:

1. **Today vs same day last week** sales
2. **Top 10 items by profit** (not revenue!)
3. **Slow movers** — stock that hasn't sold in 30 days (cash stuck on shelves)
4. **Peak hours heatmap** — when to have extra help
5. **Udhaar (credit) outstanding** by customer

Make it work on his phone (Power BI mobile layout). If he opens it every morning, that's your case study headline.`, 16],
      ["s_11", 5, "Udhaar tracking he will LOVE that. Thanks Arvind sir!", 4],
    ],
  },
  {
    author: "s_38", h: 2, track: "digital-marketing", tags: ["seo", "google-business"], votes: 3, aarav: false,
    title: "Google Business Profile for a dental clinic — quick wins?",
    body: "Just got a client (dentist in Nagpur). Their Google profile has 12 reviews and old photos. What should I do in the first week to show results?",
    accepted: null,
    replies: [],
  },
  {
    author: "s_29", h: 36, track: "web-development", tags: ["javascript", "async", "interview"], votes: 13, aarav: false,
    title: "Promise.all vs for-await — when to use which?",
    body: "Saw both in a codebase. My senior said one is \"parallel\" and one is \"sequential\" but I don't fully get when it matters.",
    accepted: 0,
    replies: [
      ["u_student", 2, `Think of it like ordering chai for 5 friends:

- \`for await\` / \`await\` in a loop → order one chai, wait, then order the next. **Sequential**, 5× slower.
- \`Promise.all\` → order all 5 at once, wait for the tray. **Parallel**.

\`\`\`js
// sequential — use when step 2 needs step 1's result
for (const id of ids) await saveOrder(id);

// parallel — use when requests are independent
await Promise.all(ids.map(id => fetchUser(id)));
\`\`\`

Careful: \`Promise.all\` fails fast if one rejects. Use \`Promise.allSettled\` if you want all results anyway.`, 17],
      ["s_29", 3, "The chai analogy made it click. Thanks Aarav!", 3],
      ["m_2", 4, "Great explanation One more: for 1,000 requests, don't fire them all at once — batch them (e.g. 10 at a time) or you'll hit rate limits.", 8],
    ],
  },
  {
    author: "s_46", h: 70, track: "video-editing", tags: ["reels", "hooks", "retention"], votes: 20, aarav: true,
    title: "Reels retention drops at 2 seconds — how do pro editors hook viewers?",
    body: "I edit reels for a fitness coach. Avg watch time is 2.1s on 15s reels. What editing tricks keep people watching?",
    accepted: 0,
    replies: [
      ["m_6", 2, `2 seconds means the **first frame** isn't doing its job. Editing checklist for hooks:

- **Start mid-action.** Cut the "Hey guys". First frame = the most interesting moment.
- **Text hook in frame 1**, big, max 6 words: *"You're doing squats wrong"*.
- **Pattern interrupt every 2–3 sec**: zoom punch-in, angle change, B-roll.
- **Captions** always — 80% watch on mute.
- **Loop the ending** into the start so replays count.

Then A/B test hooks: same reel, 2 different first 2 seconds. Data > opinions.`, 30],
      ["s_17", 4, "Zoom punch-ins on beats are so effective. I use 110% scale keyframes on every cut.", 5],
    ],
  },
  {
    author: "s_2", h: 300, track: "ui-ux-design", tags: ["career", "internship", "portfolio"], votes: 18, aarav: false,
    title: "Got my first design internship offer — ₹8k stipend, should I negotiate?",
    body: "Pune startup offered UI design intern, ₹8k/month, 6 months, hybrid. I'm a 3rd year B.Des student. Is it okay to negotiate or will they withdraw?",
    accepted: 0,
    replies: [
      ["u_mentor", 3, `Congrats! Polite negotiation almost never gets an offer withdrawn. Try:

> "I'm really excited about this role. Given my portfolio work on [X] and that I can work 5 days a week, would ₹12k be possible?"

If they can't move on money, ask for: a PPO conversation at month 4, a learning budget, or remote Fridays. Worst case they say no and you still have ₹8k.`, 21],
      ["s_6", 5, "Did the same last year, asked for 12, got 10. Always ask", 6],
    ],
  },
  {
    author: "s_19", h: 12, track: "ai-automation", tags: ["python", "chatgpt", "api"], votes: 7, aarav: false,
    title: "Getting rate limited by OpenAI API in my college project",
    body: "Making a resume reviewer for my college placement cell. When 30 students use it at once, I get 429 errors. Kya solution hai bina paise lagaye?",
    accepted: null,
    replies: [
      ["m_2", 2, "Add a queue (even a simple in-memory one) and retry with exponential backoff on 429s. Also cache reviews — many students upload the same template resume! A smaller, cheaper model for a first pass helps too.", 8],
      ["s_36", 3, "We used `p-limit` in Node to cap concurrency at 3. Solved it for our hackathon.", 4],
    ],
  },
  {
    author: "s_31", h: 160, track: "graphic-design", tags: ["clients", "payment", "freelancing"], votes: 22, aarav: false,
    title: "Client ghosted after I sent final files. Pending ₹2,500",
    body: "Sent all logo files 2 weeks ago, client said 'will pay tomorrow'. Now not replying. What can I do and how do I avoid this next time?",
    accepted: 1,
    replies: [
      ["s_24", 2, "Ugh, sorry. Happened to me too. Send a polite reminder with the UPI QR every 3 days.", 3],
      ["m_8", 3, `Sorry this happened — it's a rite of passage, unfortunately. Now:

1. One clear, friendly message: *"Hi! Sharing the invoice again for the logo project. Could you clear ₹2,500 by Friday? Happy to help with anything else you need."*
2. If no reply in a week, a firmer one mentioning that usage rights transfer after payment.

**Next time:**
- 50% advance, always
- Send **watermarked previews**; final source files only after full payment
- Work through Campus gigs where payment is held safely

You did the work. Don't let this one stop you.`, 34],
      ["s_31", 6, "He paid after the second message Thank you Meghna ma'am. Watermarks from now on.", 15],
    ],
  },
  {
    author: "s_9", h: 48, track: "digital-marketing", tags: ["instagram", "content-calendar", "clients"], votes: 9, aarav: false,
    title: "Managing Instagram for 2 clinics — how do you plan a month of content fast?",
    body: "I make posts day-by-day and it's eating my study time. How do you plan a whole month in one sitting?",
    accepted: 0,
    replies: [
      ["m_3", 2, `Use **content pillars** + a batching day:

- Pillar 1: Education (myth vs fact, tips)
- Pillar 2: Trust (doctor intro, patient stories, clinic tour)
- Pillar 3: Offers (check-up camps, festive offers)
- Pillar 4: Community (health days, local events)

12 posts/month = 3 per pillar. One Sunday: write all captions in a sheet, design in Canva with a template, schedule in Meta Business Suite. 4 hours total, done for the month.`, 14],
    ],
  },
  {
    author: "s_44", h: 1, track: "graphic-design", tags: ["fonts", "hindi", "typography"], votes: 2, aarav: false,
    title: "Best free Devanagari fonts for a wedding invite?",
    body: "Client wants a bilingual (Hindi + English) wedding card. Which free Devanagari fonts pair well with serif English fonts?",
    accepted: null,
    replies: [],
  },
  {
    author: "s_16", h: 90, track: "app-development", tags: ["react-native", "flutter", "career"], votes: 16, aarav: false,
    title: "Flutter or React Native in 2026 for freelance work in India?",
    body: "I know basic JS and some Dart. Which one gets more freelance gigs from Indian clients right now?",
    accepted: 0,
    replies: [
      ["m_7", 2, `Both are fine; pick based on what you already know and the clients you want:

- **Flutter**: very popular with Indian agencies and startups building MVPs; one codebase looks identical everywhere.
- **React Native**: great if you already do React web — clients love one person who can do web + app.

You know JS → React Native gets you earning faster. But honestly, the freelancer who **ships and communicates well** wins, not the framework.`, 20],
      ["s_21", 4, "Flutter gigs on Campus gigs board are more frequent this month fwiw.", 5],
    ],
  },
  {
    author: "s_6", h: 5, track: null, tags: ["productivity", "college", "balance"], votes: 12, aarav: true,
    title: "How do you balance college exams with gigs? Internals next week and 2 deadlines",
    body: "Internals start Monday, I have two client deadlines on Wednesday. Feeling super overwhelmed. How do you all manage?",
    accepted: null,
    replies: [
      ["s_40", 1, "Message the clients today — not on Tuesday night. Most will give 3–4 extra days if you tell them early. Exams are a valid reason.", 7],
      ["m_5", 2, "Rule I give all my mentees: never hide a delay. Communicate early, offer a partial delivery, and protect your sleep. You'll do better in both.", 9],
    ],
  },
];

const threads = [];
const replies = [];
T.forEach((t, i) => {
  const id = `th_${i + 1}`;
  const replyIds = [];
  t.replies.forEach(([authorId, after, body, votes], j) => {
    const rid = `rp_${i + 1}_${j + 1}`;
    replyIds.push(rid);
    const createdAt = hoursAgo(Math.max(0.2, t.h - after));
    replies.push({
      id: rid,
      threadId: id,
      authorId,
      body,
      upvotes: votes,
      upvoterIds: pickVoters(Math.min(votes, 12), authorId !== "u_student" && votes > 15 ? ["u_student"] : []),
      createdAt,
    });
  });
  const lastReply = t.replies.length ? Math.max(0.2, t.h - t.replies[t.replies.length - 1][1]) : t.h;
  threads.push({
    id,
    authorId: t.author,
    title: t.title,
    body: t.body,
    tags: t.tags,
    trackId: t.track ? `t_${t.track}` : null,
    upvotes: t.votes,
    upvoterIds: pickVoters(Math.min(t.votes, 14), t.aarav ? ["u_student"] : []),
    acceptedReplyId: t.accepted !== null && t.accepted !== undefined ? replyIds[t.accepted] : null,
    createdAt: hoursAgo(t.h),
    lastActivityAt: hoursAgo(lastReply),
  });
});

/* ───────────────────────── Bookings ───────────────────────── */
const letters = "abcdefghijkmnopqrstuvwxyz";
const code = (n) => Array.from({ length: n }, () => letters[Math.floor(rand() * letters.length)]).join("");
const meetLink = () => `https://meet.google.com/${code(3)}-${code(4)}-${code(3)}`;
const B = (id, mentorId, userId, dayOffset, time, topic, note, status) => ({
  id,
  mentorId,
  userId,
  startsAt: dayOffset >= 0 ? daysFromNow(dayOffset) : daysAgo(-dayOffset),
  time,
  topic,
  note,
  status,
  meetLink: meetLink(),
  createdAt: daysAgo(Math.abs(dayOffset) + 3),
});

const bookings = [
  // demo student
  B("bk_1", "u_mentor", "u_student", 2, "18:30", "Portfolio review — canteen app case study", "Want feedback on my case study structure before I send it to recruiters.", "UPCOMING"),
  B("bk_2", "m_2", "u_student", 5, "20:00", "React project architecture for my first client", "Client wants a dashboard. Not sure about folder structure and state management.", "UPCOMING"),
  B("bk_3", "m_3", "u_student", -10, "13:00", "How to find my first freelance clients", null, "COMPLETED"),
  B("bk_4", "m_4", "u_student", -21, "10:00", "SQL interview prep", "Placement season is coming.", "COMPLETED"),
  // demo mentor (Priya Nair) — sessions with other students
  B("bk_5", "u_mentor", "s_3", 1, "10:00", "Auto layout deep dive", "My Figma cards keep breaking.", "UPCOMING"),
  B("bk_6", "u_mentor", "s_2", 3, "20:00", "Internship offer — negotiation & first week", null, "UPCOMING"),
  B("bk_7", "u_mentor", "s_10", 6, "13:00", "Design system for a college fest app", "Team of 4, want consistent components.", "UPCOMING"),
  B("bk_8", "u_mentor", "s_6", -1, "18:30", "Portfolio teardown", null, "COMPLETED"),
  B("bk_9", "u_mentor", "s_14", -2, "10:00", "Switching from B.Com to UX — is it realistic?", null, "COMPLETED"),
  B("bk_10", "u_mentor", "s_22", -2, "20:00", "Usability testing on a budget", null, "COMPLETED"),
  B("bk_11", "u_mentor", "s_27", -3, "13:00", "Canva to Figma transition", null, "COMPLETED"),
  B("bk_12", "u_mentor", "s_35", -4, "18:30", "Mobile checkout flow critique", null, "COMPLETED"),
  B("bk_13", "u_mentor", "s_41", -5, "10:00", "Freelance pricing for UI projects", null, "COMPLETED"),
  B("bk_14", "u_mentor", "s_18", -5, "20:00", "Case study writing", null, "COMPLETED"),
  B("bk_15", "u_mentor", "s_30", -6, "13:00", "Figma prototyping & smart animate", null, "COMPLETED"),
  B("bk_16", "u_mentor", "s_12", -9, "18:30", "Logo vs UI career path", null, "COMPLETED"),
  B("bk_17", "u_mentor", "s_47", -12, "10:00", "Accessibility basics", null, "COMPLETED"),
  B("bk_18", "u_mentor", "s_25", 4, "18:30", "Portfolio site in Framer", null, "CANCELLED"),
  // other mentors, for realism
  B("bk_19", "m_6", "s_17", 2, "18:30", "Premiere Pro workflow for YouTube clients", null, "UPCOMING"),
  B("bk_20", "m_5", "s_23", 1, "20:00", "Handling a founder who wants unlimited revisions", null, "UPCOMING"),
  B("bk_21", "m_8", "s_31", -3, "13:00", "Pricing brand identity projects", null, "COMPLETED"),
];

/* ───────────────────────── Cohorts ───────────────────────── */
const members = (n, include = []) => [...new Set([...include, ...[...studentIds].sort(() => rand() - 0.5).slice(0, n)])];
const cohorts = [
  {
    id: "co_1", title: "React Sprint · Batch 12", trackId: "t_web-development", leadMentorId: "m_2",
    description: "Six weeks, one real product. Build a full React + Node app with code reviews every week, then pitch it as a portfolio piece. Ideal if you know HTML, CSS and basic JS.",
    startDate: daysAgo(9), schedule: "Tue & Thu, 8pm", maxMembers: 40, memberIds: members(33, ["u_student"]), createdAt: daysAgo(30),
  },
  {
    id: "co_2", title: "Content Writing Circle", trackId: "t_content-writing", leadMentorId: "m_5",
    description: "A weekly writing room. Every week: one brief, one draft, peer feedback in pairs, and a live teardown by Debjani. Hindi and Hinglish writers very welcome.",
    startDate: daysAgo(20), schedule: "Every Wed, 7pm", maxMembers: 30, memberIds: members(24), createdAt: daysAgo(40),
  },
  {
    id: "co_3", title: "Figma Fridays", trackId: "t_ui-ux-design", leadMentorId: "u_mentor",
    description: "Redesign one real Indian app screen every Friday — IRCTC, DigiLocker, your college portal. Live critique, then everyone ships a mini case study.",
    startDate: daysAgo(14), schedule: "Fri, 6:30pm", maxMembers: 35, memberIds: members(31, ["u_student", "s_3", "s_2"]), createdAt: daysAgo(35),
  },
  {
    id: "co_4", title: "Data Analytics 30-day", trackId: "t_data-analytics", leadMentorId: "m_4",
    description: "30 days, 30 datasets. Excel → SQL → Power BI, using real Indian public data (IPL, rainfall, Swiggy-style orders). Ends with a dashboard you can show in interviews.",
    startDate: daysFromNow(4), schedule: "Mon, Wed & Fri, 9pm", maxMembers: 50, memberIds: members(41, ["s_8", "s_11"]), createdAt: daysAgo(12),
  },
  {
    id: "co_5", title: "Reels Editing Bootcamp", trackId: "t_video-editing", leadMentorId: "m_6",
    description: "Hooks, pacing, captions and sound design for short-form. Each week you edit raw footage from a real creator and get frame-by-frame feedback.",
    startDate: daysFromNow(10), schedule: "Sat & Sun, 11am", maxMembers: 25, memberIds: members(23, ["s_17", "s_46"]), createdAt: daysAgo(6),
  },
  {
    id: "co_6", title: "Meta Ads Lab · ₹1,000 challenge", trackId: "t_digital-marketing", leadMentorId: "m_3",
    description: "Every member runs a real ₹1,000 campaign for a local business. Weekly numbers review, creative testing and a final results report for your portfolio.",
    startDate: daysAgo(3), schedule: "Thu, 8:30pm", maxMembers: 20, memberIds: members(20, ["s_5", "s_9", "s_38"]).slice(0, 20), createdAt: daysAgo(25),
  },
  {
    id: "co_7", title: "Brand Identity Studio", trackId: "t_graphic-design", leadMentorId: "m_8",
    description: "Build a full brand kit for a real small business — logo, palette, type, social templates. Includes a session on pricing and client presentations.",
    startDate: daysFromNow(15), schedule: "Sun, 5pm", maxMembers: 30, memberIds: members(12, ["s_12", "s_31", "s_44"]), createdAt: daysAgo(4),
  },
  {
    id: "co_8", title: "Flutter Weekend Builders", trackId: "t_app-development", leadMentorId: "m_7",
    description: "Ship one small Flutter app every two weekends: expense splitter, mess-menu app, bus pass tracker. Firebase, state management and Play Store release included.",
    startDate: daysAgo(30), schedule: "Sat, 4pm", maxMembers: 30, memberIds: members(18, ["s_21", "s_16"]), createdAt: daysAgo(50),
  },
];

const cohortPosts = [
  ["co_1", "m_2", 50, "Week 2 brief is up Build the auth flow (signup, login, protected routes). Push to GitHub by Sunday night and drop your repo link here. Code review live on Tuesday."],
  ["co_1", "s_29", 30, "Anyone else getting CORS errors with the Express backend? Fixed it with the `cors` package + setting the origin to the Vite port. Leaving it here for others."],
  ["co_1", "u_student", 20, "Pushed my auth flow! Used React Query for the `/me` call and a `RequireAuth` wrapper. Feedback welcome github.com/aarav/sprint12-auth"],
  ["co_1", "s_13", 6, "Reminder: session tonight at 8 — Rahul sir is reviewing 5 repos live. Be on time!"],
  ["co_3", "u_mentor", 70, "This Friday's screen: **IRCTC seat selection**. Rules: mobile only, 2 hours max, and write 3 lines on what you changed and why. Let's go!"],
  ["co_3", "s_3", 40, "Finally got auto layout right on my card components after last week's critique. Hug vs fill makes so much sense now."],
  ["co_3", "u_student", 26, "My IRCTC redesign: moved the berth preference into the seat map itself so you choose visually. Took 1h 50m"],
  ["co_3", "s_2", 4, "Loved everyone's work this week. Priya ma'am's tip about 44px tap targets — saving that forever."],
  ["co_2", "m_5", 60, "This week's brief: write a 150-word product description for a handmade Kolhapuri chappal brand. Bonus points for one line in Marathi or Hindi."],
  ["co_2", "s_23", 22, "Pair feedback was so useful. My partner pointed out I used 'premium' 4 times"],
  ["co_4", "m_4", 30, "Welcome everyone! Day 1 dataset is the IPL ball-by-ball data. Install Excel or use Google Sheets — both are fine. See you Monday"],
  ["co_6", "m_3", 20, "Campaign check-in: post your cost per result so far. Remember — no judgement, we're here to learn from the numbers."],
  ["co_6", "s_5", 8, "Bakery campaign update: ₹31 per WhatsApp conversation after 3 days, 14 hamper orders"],
  ["co_8", "m_7", 90, "App #3 this cycle: a hostel mess-menu app with daily notifications. Starter repo pinned in the description."],
].map(([cohortId, authorId, h, body], i) => ({ id: `cp_${i + 1}`, cohortId, authorId, body, createdAt: hoursAgo(h) }));

/* ───────────────────────── Notifications ───────────────────────── */
const N = (id, userId, type, title, body, link, read, createdAt) => ({ id, userId, type, title, body, link, read, createdAt });
const notifications = [
  N("nt_1", "u_student", "COMMUNITY", "Rahul Mehta replied to your doubt", "\"Not a bug — it's React 18 StrictMode in development…\"", "/app/community/th_1", false, hoursAgo(1)),
  N("nt_2", "u_student", "MENTOR", "Session confirmed with Priya Nair", "Portfolio review — canteen app case study, in 2 days at 6:30 pm.", "/app/mentors/u_mentor", false, hoursAgo(3)),
  N("nt_3", "u_student", "RANK", "You're 120 points from Gold", "Answer 3 doubts this week to get there faster.", "/app/leaderboard", false, hoursAgo(5)),
  N("nt_4", "u_student", "COMMUNITY", "Your answer was accepted", "Your answer on \"Promise.all vs for-await\" was accepted. +50 pts", "/app/community/th_19", false, hoursAgo(9)),
  N("nt_5", "u_student", "GIG", "New gig matches your skills", "Landing page for a Bhopal coaching institute · ₹1,200", "/app/gigs", false, hoursAgo(14)),
  N("nt_6", "u_student", "COURSE", "Assignment reviewed", "Your assignment got 86/100 and was added to your Proof Portfolio as verified.", "/app/portfolio", true, hoursAgo(26)),
  N("nt_7", "u_student", "COMMUNITY", "New post in React Sprint · Batch 12", "Rahul Mehta: Week 2 brief is up", "/app/cohorts/co_1", true, hoursAgo(50)),
  N("nt_8", "u_student", "GIG", "Payment received", "₹1,200 for \"Restaurant menu web page\" was added to your wallet.", "/app/wallet", true, daysAgo(3)),
  N("nt_9", "u_student", "RANK", "NIT-J moved up to #4 nationally", "Your college climbed 2 spots in the college leaderboard this week.", "/app/leaderboard", true, daysAgo(4)),
  N("nt_10", "u_student", "MENTOR", "How was your session with Sana Qureshi?", "Leave a quick review — it helps other students pick mentors.", "/app/mentors/m_3", true, daysAgo(10)),
  N("nt_11", "u_student", "COURSE", "Keep your 12-day streak alive", "One 10-minute lesson today keeps it going.", "/app/learn", true, daysAgo(1)),
  N("nt_12", "u_student", "SYSTEM", "Season 7 has started", "Points reset for the new season. Divisions are up for grabs — chalo, let's climb!", "/app/leaderboard", true, daysAgo(14)),
  N("nt_13", "u_student", "COMMUNITY", "Your doubt got 10 upvotes", "\"Tailwind: horizontal scroll on mobile\" is helping others too.", "/app/community/th_7", true, daysAgo(4)),
  N("nt_14", "u_student", "GIG", "Application shortlisted", "The mentor shortlisted your pitch for \"Shopify store fixes\".", "/app/gigs", true, daysAgo(6)),
  N("nt_15", "u_mentor", "MENTOR", "New booking from Aarav Sharma", "Portfolio review — canteen app case study, in 2 days at 6:30 pm.", "/app/mentor", false, hoursAgo(3)),
  N("nt_16", "u_mentor", "COURSE", "3 assignments waiting for review", "Students in your courses submitted new work.", "/app/mentor", false, hoursAgo(8)),
  N("nt_17", "u_mentor", "COMMUNITY", "New doubt in UI/UX", "\"Auto layout in Figma keeps breaking my card design\"", "/app/community/th_10", false, hoursAgo(3)),
  N("nt_18", "u_mentor", "SYSTEM", "Your mentor payout is on its way", "Earnings for last week's sessions will reach your bank in 2 days.", "/app/mentor", true, daysAgo(2)),
];

/* ───────────────────────── Mentor reviews ───────────────────────── */
const R = {
  u_mentor: [
    ["Ishita Rao", 5, "Priya ma'am tore apart my portfolio in the kindest way possible. Rewrote my case study the same night and got a callback within a week."],
    ["Karthik Iyer", 5, "Explained auto layout better than any YouTube tutorial. Super patient with beginner questions."],
    ["Pooja Menon", 4, "Very practical advice on freelance pricing for UI projects. Wish the session was longer!"],
    ["Rohan Das", 5, "She actually opened my Figma file and fixed my component structure live. Worth every minute."],
    ["Fatima Shaikh", 5, "Talked to me in Tamil when I got stuck explaining. Felt like talking to a senior from my own college."],
  ],
  m_2: [
    ["Arjun Kumar", 5, "Rahul sir explained React Query and folder structure for my first client project. Shipped it confidently."],
    ["Yash Joshi", 5, "Code review was brutal but fair. My PRs look so much cleaner now."],
    ["Neha Gupta", 4, "Great on system design basics. Some parts were fast, but he shared notes after."],
    ["Mohit Yadav", 5, "Helped me debug a Node deployment issue in 10 minutes that I'd been stuck on for 2 days."],
  ],
  m_3: [
    ["Aarav Sharma", 5, "Gave me a step-by-step plan to find my first 3 clients locally. Two of them replied already!"],
    ["Simran Kaur", 5, "Her Meta ads frameworks are gold. Ran my first ₹2k campaign with confidence."],
    ["Abhishek Mishra", 4, "Very sharp on numbers. Make sure you bring your ad account screenshots."],
    ["Kavya Pillai", 5, "Honest, direct and encouraging. Told me exactly what to stop doing."],
  ],
  m_4: [
    ["Aarav Sharma", 5, "SQL interview prep was spot on — window functions finally make sense."],
    ["Lakshmi Reddy", 5, "Arvind sir explained Power BI DAX in Telugu, which helped me so much."],
    ["Varun Nair", 4, "Practical datasets and clear thinking. Homework was tough but useful."],
  ],
  m_5: [
    ["Shreya Banerjee", 5, "Debjani di helped me find my voice as a writer. My Bengali-English blog finally sounds like me."],
    ["Tanvi Patel", 5, "Her outline-first method cut my client revisions in half."],
    ["Gaurav Chauhan", 4, "Great feedback on my samples, very specific line edits."],
    ["Riya Verma", 5, "Free session and still the most useful hour of my month. Thank you!"],
  ],
  m_6: [
    ["Harsh Singh", 5, "Farhan bhai's proxy workflow saved my 8GB laptop. Editing 4K smoothly now."],
    ["Zoya Khan", 5, "Learnt more about hooks and pacing in one hour than in a month of tutorials."],
    ["Pranav Kulkarni", 4, "Very creator-focused advice. Would love a session on colour grading next."],
  ],
  m_7: [
    ["Omkar Patil", 5, "Kiran sir explained Riverpod in Marathi. Finally understood state management."],
    ["Divya Rao", 5, "Helped me publish my first app on the Play Store, step by step."],
    ["Siddharth Joshi", 4, "Knows Firebase inside out. Super helpful for auth issues."],
  ],
  m_8: [
    ["Nandini Das", 5, "Meghna di's brand presentation template got me my first ₹6,000 logo project."],
    ["Imran Shaikh", 5, "Honest feedback on my logos, and great advice on handling late payments."],
    ["Bhavna Mehta", 4, "Loved the session on grids and type pairing. Very inspiring."],
    ["Sahil Gupta", 5, "Free session, zero fluff, all value. Highly recommend for graphic design beginners."],
  ],
};
const mentorReviews = Object.entries(R).flatMap(([mentorId, list]) =>
  list.map(([userName, rating, comment], i) => ({ id: `mr_${mentorId}_${i + 1}`, mentorId, userName, rating, comment, createdAt: daysAgo(3 + i * 9 + (mentorId.length % 5)) })),
);

/* ───────────────────────── Aspirant mode ─────────────────────────
   Threads, a cohort, a booking and notifications for government-exam aspirants.
   Processed last so the shared rand() sequence for the seed data above is unchanged. */
const TA = [
  {
    author: "s_23", h: 16, track: null, tags: ["aspirants", "career", "private-job"], votes: 34, aarav: false,
    title: "3 saal SSC ki taiyari ke baad private job milegi?",
    body: `Main BPSC aur SSC dono ki taiyari kar rahi hoon, 3 saal ho gaye. Ghar wale ab poochte hain "aage kya?" Private sector ke baare mein kuch nahi pata. Kya 3 saal ka gap dekh ke companies reject kar dengi? Hindi strong hai, English theek-thaak.

Honest answer chahiye, motivational nahi`,
    accepted: 0,
    replies: [
      ["m_5", 2, `Honest answer: **haan, milegi — agar aap prep years ko explain karna aur ek skill ka proof dikhana seekh lo.**

Companies "gap" se nahi darti, unhe darr hota hai ki candidate kaam nahi kar paayega. Aapke paas already hai:
- **Discipline** — 3 saal roz ka schedule
- **Hindi + English** — bilingual log kam milte hain, translation aur content mein demand hai
- **Research skill** — current affairs ke notes banana = research

Mera suggestion: roz 45 minute translation track, aur 2 mahine mein 3 samples (ek press release, ek brochure, ek subtitle file). Phir pehle micro-gigs. Taiyari chhodne ki zaroorat nahi — yeh backup hai.`, 41],
      ["s_10", 4, "IBPS PO ki 2 saal taiyari ki thi. Tally + GST seekha, abhi ek CA firm mein accounts executive hoon, ₹22k/month se start. Interview mein kisi ne gap pe taunt nahi kiya, bas poocha 'kya seekha'. Aap kar logi", 28],
      ["s_16", 6, "UPSC ke 4 saal ke baad main bhi yahi soch raha tha. Campus pe content writing aur translation dono chal rahe hain. Sabse badi baat: akela nahi lagta ab.", 9],
    ],
  },
  {
    author: "s_5", h: 40, track: null, tags: ["aspirants", "interview", "resume"], votes: 22, aarav: true,
    title: "How do I explain my prep years in an interview?",
    body: `I prepared for SSC CGL for 3 years and cleared Tier 1 twice. Now I'm applying for MIS executive roles alongside my prep. Every time the HR asks "what were you doing from 2022 to 2025?" I start apologising and it goes badly.

What's a good way to answer this without sounding defensive?`,
    accepted: 1,
    replies: [
      ["s_42", 3, "Same problem bro. I just say 'preparing for govt exams' and move on quickly", 2],
      ["m_4", 5, `Don't apologise — **explain, then bridge**. Use a 3-part answer, about 40 seconds:

1. **The fact, said with confidence:** "I prepared for SSC CGL for three years and cleared Tier 1 twice."
2. **What it built:** "It taught me to study 6–8 hours a day on a fixed schedule, analyse 200+ mock tests and fix my weak areas — that's exactly what MIS work is: data, deadlines and accuracy."
3. **The bridge to this job:** "Alongside, I learned Excel — lookups, pivots, MIS reports — and here's a report I built on a DI dataset."

Then **show the proof**: your Skill Passport link with the reviewed assignment. An interviewer remembers the workbook, not the gap.

Practise it aloud 10 times. It should sound like a story, not a defence.`, 37],
      ["u_aspirant", 8, "Sir ka 3-part answer maine apni diary mein likh liya. Ek cheez add karungi: 'Preparation record' Skill Passport pe dikhta hai, toh HR ko pehle se pata hota hai. Thank you!", 11],
    ],
  },
  {
    author: "u_aspirant", h: 7, track: "excel-for-aspirants", tags: ["excel", "vlookup", "xlookup", "assignment"], votes: 9, aarav: false,
    title: "VLOOKUP vs XLOOKUP for my MIS assignment",
    body: `Mere MIS assignment mein retailer code se retailer ka naam aur city laani hai. Tutorial mein VLOOKUP hai, course mein XLOOKUP. Kaunsa use karun?

\`\`\`text
=VLOOKUP(A2, Retailers!A:C, 2, FALSE)
=XLOOKUP(A2, Retailers!A:A, Retailers!B:B, "Not found")
\`\`\`

Office ke computer pe Excel 2016 hai, ghar pe Excel 365. Dono pe chalna chahiye.`,
    accepted: 0,
    replies: [
      ["m_4", 1, `Good question, Pooja — and the Excel 2016 detail is the key.

- **XLOOKUP** is better: it looks left or right, defaults to exact match and has a built-in "not found" value. But it exists only in **Excel 2021 / 365** (and Google Sheets).
- **VLOOKUP** works everywhere, including Excel 2016. Always use \`FALSE\` (exact match) and wrap it: \`=IFERROR(VLOOKUP(A2, Retailers!A:C, 2, FALSE), "Not found")\`.

For the assignment: use XLOOKUP and add one note in your Summary sheet saying the VLOOKUP version for older Excel. Clients love that you thought about their computer. In interviews, say you know both.`, 14],
      ["s_29", 2, "INDEX + MATCH bhi seekh lo, purane office files mein bahut milta hai. Excel 2016 pe bhi left lookup ho jaata hai.", 5],
    ],
  },
  {
    author: "s_42", h: 28, track: "accounting-tally-gst", tags: ["tally", "busy", "gst", "small-business"], votes: 13, aarav: false,
    title: "Tally Prime or Busy for small shops?",
    body: "Mere mohalle ki 2 dukaan (hardware aur kirana) books likhwana chahti hain. Ek ne Busy bola, ek ne Tally. Main bookkeeping course kar raha hoon. Kaunsa software seekhoon pehle? Aur ek dukaan ki monthly bookkeeping ka kitna charge karun?",
    accepted: 1,
    replies: [
      ["s_10", 2, "Tally first. CA firms mein 90% Tally hi chalta hai, job ke liye bhi wahi poochte hain.", 6],
      ["m_3", 4, `Both are good; here's how I'd decide:

- **Tally Prime** — the default in CA firms and most job descriptions ("Tally operator", "accounts executive"). Learn this first for employability.
- **Busy** — popular with traders and distributors in North India for inventory and billing. Once you know accounting, switching takes a week; the vouchers and ledgers are the same idea.

**Pricing for a small shop (monthly bookkeeping):** ₹1,500–₹3,000 for up to ~150 vouchers a month, more if you also prepare GST return data for their CA. Fix the scope in writing: number of bills, a weekly visit or WhatsApp photos, and a monthly deadline.

Start with one shop, do it perfectly for 2 months, and ask for a referral.`, 19],
    ],
  },
  {
    author: "s_16", h: 55, track: "translation-hindi-english", tags: ["translation", "hindi", "pricing"], votes: 11, aarav: false,
    title: "Hindi translation ka rate per word kya rakhein?",
    body: "UPSC prep mein Hindi aur English dono mein answer writing ki hai. Ek NGO ne 2,000 words ka report English se Hindi karne ko bola hai. Per word kitna lena chahiye? ₹0.50 bahut kam lagta hai.",
    accepted: 0,
    replies: [
      ["m_5", 3, `For a beginner with your writing background:

- **General content (NGO reports, blogs):** ₹0.80–₹1.20 per word → ₹1,600–₹2,400 for 2,000 words.
- **Legal / technical:** ₹1.50–₹2.50 per word, because accuracy risk is higher.
- **Minimum charge:** ₹500 per job, even for 100 words.

Ask for the reference material and any glossary they already use, agree on one revision round, and send a 150-word sample first. NGOs often have recurring work, so a good first job leads to monthly orders.`, 15],
      ["s_23", 5, "Main ₹1/word se start kiya tha, 3rd client se ₹1.20. Glossary banao, consistency se client khush rehta hai.", 4],
    ],
  },
];
TA.forEach((t, k) => {
  const i = T.length + k;
  const id = `th_${i + 1}`;
  const replyIds = [];
  t.replies.forEach(([authorId, after, body, votes], j) => {
    const rid = `rp_${i + 1}_${j + 1}`;
    replyIds.push(rid);
    replies.push({ id: rid, threadId: id, authorId, body, upvotes: votes, upvoterIds: pickVoters(Math.min(votes, 12)), createdAt: hoursAgo(Math.max(0.2, t.h - after)) });
  });
  const lastReply = t.replies.length ? Math.max(0.2, t.h - t.replies[t.replies.length - 1][1]) : t.h;
  threads.push({
    id,
    authorId: t.author,
    title: t.title,
    body: t.body,
    tags: t.tags,
    trackId: t.track ? `t_${t.track}` : null,
    upvotes: t.votes,
    upvoterIds: pickVoters(Math.min(t.votes, 14), t.aarav ? ["u_student"] : []),
    acceptedReplyId: t.accepted !== null && t.accepted !== undefined ? replyIds[t.accepted] : null,
    createdAt: hoursAgo(t.h),
    lastActivityAt: hoursAgo(lastReply),
  });
});

const aspirantMembers = ["u_aspirant", "s_5", "s_10", "s_16", "s_23", "s_29", "s_36", "s_42"];
cohorts.push({
  id: "co_9",
  title: "Prep + Skills Cohort · 45 min/day",
  trackId: "t_excel-for-aspirants",
  leadMentorId: "m_4",
  description:
    "For SSC, banking, railway and PSC aspirants building a backup career without leaving their preparation. 45 minutes a day, 6 days a week: one short Excel or Tally lesson, one practice task, and a weekly check-in on prep and skills together. Hindi and Hinglish welcome. Your preparation already counts — this is insurance, not a distraction.",
  startDate: daysAgo(12),
  schedule: "Mon–Sat, 7am · 45 min",
  maxMembers: 60,
  memberIds: members(30, aspirantMembers),
  createdAt: daysAgo(28),
});
[
  ["m_4", 260, "Welcome to Prep + Skills! Rule #1: prep comes first. Do your 45 minutes after your morning study block, not instead of it. Week 1 task: rebuild one DI set from your last mock in Excel and post a screenshot."],
  ["u_aspirant", 120, "Week 1 done SSC CGL ka wheat production DI set Excel mein banaya — growth % ab ek formula se aata hai! Arvind sir ne review mein 84/100 diya. Agle hafte pivot tables."],
  ["s_29", 70, "RRB NTPC prep + yahan 45 min. Pehli baar lag raha hai ki dono saath ho sakte hain. Data validation wala lesson bahut kaam ka tha."],
  ["m_4", 22, "Check-in: post your streak and one thing you learned this week. Missed days are fine — exam weeks happen. Just come back tomorrow at 7."],
].forEach(([authorId, h, body], k) => cohortPosts.push({ id: `cp_asp_${k + 1}`, cohortId: "co_9", authorId, body, createdAt: hoursAgo(h) }));

bookings.push(B("bk_22", "m_4", "u_aspirant", 3, "18:30", "Interview prep: explaining my prep years for MIS roles", "I have an MIS executive interview next week. Want to practise the 'what were you doing for 3 years' answer and my Excel test round.", "UPCOMING"));

notifications.push(
  N("nt_asp_1", "u_aspirant", "COURSE", "Assignment reviewed: 84/100", "Arvind Krishnan reviewed your DI-to-Excel workbook. It's now a verified piece on your Skill Passport.", "/app/portfolio", false, daysAgo(4)),
  N("nt_asp_2", "u_aspirant", "COMMUNITY", "Arvind Krishnan answered your doubt", "\"VLOOKUP vs XLOOKUP for my MIS assignment\" — accepted answer inside.", `/app/community/th_${T.length + 3}`, false, hoursAgo(6)),
  N("nt_asp_3", "u_aspirant", "COMMUNITY", "New post in Prep + Skills Cohort", "Arvind Krishnan: Check-in: post your streak and one thing you learned this week.", "/app/cohorts/co_9", false, hoursAgo(22)),
  N("nt_asp_4", "u_aspirant", "MENTOR", "Session confirmed with Arvind Krishnan", "Interview prep: explaining my prep years for MIS roles, in 3 days at 6:30 pm.", "/app/mentors/m_4", true, hoursAgo(30)),
  N("nt_asp_5", "u_aspirant", "RANK", "19-day streak", "45 minutes a day, alongside your prep. Two more assignments and the micro-gig board unlocks.", "/app/ladder", true, daysAgo(1)),
);

export default { threads, replies, bookings, cohorts, cohortPosts, notifications, mentorReviews };
