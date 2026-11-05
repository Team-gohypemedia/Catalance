/** Web Development courses — seed content for the Campus demo. */

const webFoundations = {
  slug: "web-foundations",
  title: "Web Foundations: HTML, CSS & JavaScript",
  subtitle: "Go from zero to a live, responsive website you can show clients",
  description:
    "Learn the three languages every website is built on, the way a working freelancer uses them. You will build real pages for real kinds of Indian clients, make them look great on a ₹8,000 phone, add interactivity with JavaScript, and ship them live on Netlify or Vercel. By the end you will have a deployed portfolio and the confidence to take your first paid website project.",
  level: "BEGINNER",
  languages: ["en", "hinglish", "hi"],
  cover: { from: "#F97316", to: "#DB2777", pattern: "grid" },
  mentorId: "m_2",
  priceINR: 0,
  rating: 4.8,
  ratingsCount: 3412,
  studentsCount: 28640,
  createdDaysAgo: 210,
  skills: ["HTML", "CSS", "Flexbox & Grid", "Responsive design", "JavaScript", "Git & GitHub", "Netlify/Vercel"],
  whatYouBuild: [
    "A semantic, accessible landing page for a Jaipur bakery",
    "A responsive layout that works from 360px phones to wide desktops",
    "An interactive menu toggle and a WhatsApp 'Order now' button in plain JavaScript",
    "A personal portfolio site deployed live on Netlify or Vercel with its own URL",
  ],
  requirements: [
    "A laptop or desktop (4GB RAM is fine)",
    "VS Code and Google Chrome installed (both free)",
    "No coding experience needed — just 4-5 hours a week",
  ],
  modules: [
    {
      title: "HTML: Structure & Semantics",
      lessons: [
        {
          title: "How the web works & your first HTML page",
          type: "VIDEO",
          durationMinutes: 10,
          isPreview: true,
          content: `## Key points
- When you open a website, your browser sends a request to a server and receives HTML, CSS and JavaScript files back, which it then turns into the page you see.
- HTML gives a page its structure and meaning, CSS controls how it looks, and JavaScript controls how it behaves.
- Every HTML document starts with \`<!DOCTYPE html>\` and has a \`<head>\` (information about the page) and a \`<body>\` (what users actually see).
- The \`<meta name="viewport">\` tag is mandatory for mobile-friendly sites; without it phones render a zoomed-out desktop page.
- You only need VS Code, the Live Server extension and Chrome to start building real websites today.

## Transcript
Namaste everyone, I'm Rahul. I've built more than 120 websites for clients — bakeries, coaching institutes, startups in Pune and Bengaluru — and every single one of them started with the exact file we're about to write.

So first, what actually happens when you type a URL? Your browser asks a server, "bhai, give me this page." The server sends back some files. The most important one is HTML. Think of HTML as the skeleton of a building: walls, rooms, doors. CSS is the paint and furniture. JavaScript is the electricity — the things that move and respond.

Chalo, let's open VS Code. Create a folder called \`my-first-site\`, and inside it a file called \`index.html\`. Type an exclamation mark and press Tab — VS Code gives you a starter template. Let's read it line by line.

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sharma Sweets, Jaipur</title>
</head>
<body>
  <h1>Sharma Sweets</h1>
  <p>Fresh ghewar and mawa kachori since 1987.</p>
</body>
</html>
\`\`\`

The \`lang\` attribute helps screen readers and Google. The \`charset\` line makes sure the ₹ symbol and Hindi text display correctly. And dekho, this viewport line — never delete it. Most of your client's customers will visit from a phone, and without this line the site looks tiny and broken.

Now right-click and choose "Open with Live Server." Your page opens in Chrome, and every time you save, it refreshes automatically. Congratulations — you're a web developer now. In the next lesson we'll make this structure meaningful.`,
        },
        {
          title: "Semantic HTML: header, nav, main, section, footer",
          type: "ARTICLE",
          durationMinutes: 10,
          isPreview: true,
          content: `## Why "semantic" matters

Beginners build everything out of \`<div>\` tags. It works on screen, but it tells nobody what each part *means*. Semantic HTML uses tags that describe their content. Google understands your page better (good for the client's SEO), screen readers can jump between sections, and the next developer can read your code in seconds.

## The core layout tags

- \`<header>\` — the top of the page or a section: logo, tagline, often the navigation.
- \`<nav>\` — a group of main navigation links.
- \`<main>\` — the unique content of this page. Use it **once** per page.
- \`<section>\` — a themed group of content with its own heading, like "Our Menu" or "Testimonials".
- \`<article>\` — content that makes sense on its own: a blog post, a product card, a review.
- \`<footer>\` — contact details, address, copyright, social links.

## A real page skeleton

Here is how I would structure a landing page for a home bakery in Jaipur:

\`\`\`html
<body>
  <header>
    <a href="/" class="logo">Ghar Ki Bakery</a>
    <nav>
      <ul>
        <li><a href="#menu">Menu</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <section id="hero">
      <h1>Eggless cakes, baked fresh in Malviya Nagar</h1>
      <p>Order by 2 PM for same-day delivery across Jaipur.</p>
    </section>

    <section id="menu">
      <h2>Our Menu</h2>
      <article>
        <h3>Chocolate Truffle (500g)</h3>
        <p>₹650</p>
      </article>
    </section>
  </main>

  <footer>
    <p>Malviya Nagar, Jaipur · +91 98290 12345</p>
  </footer>
</body>
\`\`\`

## Headings are an outline, not font sizes

Use exactly **one** \`<h1>\` per page — the main promise of the page. Then \`<h2>\` for each section and \`<h3>\` inside sections. Never skip levels just because you want smaller text; size is CSS's job.

> **Tip:** Install the "HeadingsMap" Chrome extension and check every site you build. If the outline reads like a sensible table of contents, your structure is right.

## Accessibility basics you get for free

- Every \`<img>\` needs an \`alt\` describing it: \`alt="Chocolate truffle cake with gold sprinkles"\`. Decorative images get \`alt=""\`.
- Use \`<button>\` for actions and \`<a>\` for navigation. A clickable \`<div>\` cannot be reached with a keyboard.
- Link text should make sense alone. "View full menu" beats "click here".

## Quick self-check

Open any page you've built and ask: if I removed all the CSS, would the page still make sense top to bottom? If yes, your HTML is doing its job. Clients rarely ask for semantic HTML by name, but they always notice when their site ranks on Google and works for their older customers using screen magnifiers.`,
        },
        {
          title: "Links, images and forms clients actually need",
          type: "ARTICLE",
          durationMinutes: 9,
          content: `## The three things every small-business site has

Almost every client brief I get — a Kochi homestay, a Pune physiotherapy clinic, a Lucknow chikankari boutique — needs the same building blocks: links to call or message, good images, and an enquiry form. Let's do each properly.

## Links that convert

\`\`\`html
<a href="tel:+919829012345">Call us</a>
<a href="https://wa.me/919829012345?text=Hi%2C%20I%20want%20to%20order%20a%20cake">
  Order on WhatsApp
</a>
<a href="https://instagram.com/gharkibakery" target="_blank" rel="noopener">
  Instagram
</a>
\`\`\`

- \`tel:\` opens the dialer on phones. Indian customers love tapping to call.
- \`wa.me\` links open a WhatsApp chat with a pre-filled message (spaces become \`%20\`). This single link often brings more leads than the whole contact form.
- Use \`target="_blank"\` with \`rel="noopener"\` for external sites so your client's page stays open.

## Images that don't kill the page

\`\`\`html
<img
  src="images/truffle-cake.webp"
  alt="Chocolate truffle cake on a wooden board"
  width="600" height="400"
  loading="lazy">
\`\`\`

- Prefer **WebP** — it is often 30-50% smaller than JPEG. Use squoosh.app to convert.
- Always set \`width\` and \`height\` so the layout doesn't jump while loading.
- \`loading="lazy"\` delays images below the fold — big win on slow 4G.
- Keep hero images under ~200 KB. A client's customer on Jio in a small town will thank you.

## An enquiry form

\`\`\`html
<form action="https://formspree.io/f/your-form-id" method="POST">
  <label for="name">Your name</label>
  <input id="name" name="name" type="text" required>

  <label for="phone">Phone</label>
  <input id="phone" name="phone" type="tel" pattern="[6-9][0-9]{9}" required>

  <label for="date">Check-in date</label>
  <input id="date" name="date" type="date">

  <label for="msg">Message</label>
  <textarea id="msg" name="message" rows="4"></textarea>

  <button type="submit">Send enquiry</button>
</form>
\`\`\`

Notice a few professional habits:

1. **Every input has a \`<label>\`** linked with \`for\` and \`id\`. Tapping the label focuses the field, and screen readers announce it.
2. **The right \`type\`** — \`tel\` shows a number keypad on phones, \`email\` shows the @ key, \`date\` shows a date picker.
3. **Built-in validation** — \`required\` and \`pattern\` stop empty or invalid submissions without any JavaScript. The pattern above accepts 10-digit Indian mobile numbers starting with 6-9.
4. **A real backend** — static sites can't receive form data on their own. Services like Formspree or Netlify Forms email submissions to your client for free at small volumes.

> **Tip:** Always test the form yourself after deployment and confirm the client actually receives the email. "The form doesn't work" is the most common complaint in week one.`,
        },
        {
          title: "Quiz: HTML structure & semantics",
          type: "QUIZ",
          durationMinutes: 6,
          content: `Let's check that your HTML foundations are solid. These questions are about decisions you will make on real client pages.`,
          quiz: {
            questions: [
              {
                prompt: "A client's site looks zoomed-out and tiny on phones even though the CSS is responsive. What is the most likely cause?",
                options: [
                  "The page uses too many div tags",
                  "The viewport meta tag is missing from the head",
                  "The images are not in WebP format",
                  "The lang attribute is set to en instead of hi",
                ],
                correct: 1,
                explanation: "Without <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">, mobile browsers render the page at a desktop width and shrink it down, ignoring your responsive CSS.",
              },
              {
                prompt: "You want the menu section title to look smaller than other section titles. What should you do?",
                options: [
                  "Change it from h2 to h5 so it renders smaller",
                  "Wrap it in a small tag",
                  "Keep it as h2 and reduce its size with CSS",
                  "Replace it with a bold paragraph",
                ],
                correct: 2,
                explanation: "Heading levels describe the document outline, not visual size. Keep the correct level for structure and SEO, and control size in CSS.",
              },
              {
                prompt: "Which link is best for letting a homestay guest message the owner directly from their phone?",
                options: [
                  "<a href=\"https://wa.me/919876543210\">Chat on WhatsApp</a>",
                  "<div onclick=\"whatsapp()\">Chat</div>",
                  "<a href=\"#\">Click here</a>",
                  "<button>WhatsApp: 9876543210</button>",
                ],
                correct: 0,
                explanation: "A wa.me link with the country code opens a WhatsApp chat in one tap, and the link text clearly describes the action. Clickable divs are not keyboard-accessible.",
              },
              {
                prompt: "Why should every form input have a label connected with for and id?",
                options: [
                  "It is required for the form to submit",
                  "It makes the field bigger on desktop",
                  "It lets screen readers announce the field and makes the label tappable to focus the input",
                  "It automatically validates the input",
                ],
                correct: 2,
                explanation: "Linked labels are an accessibility essential and improve usability on small touch screens. Submission and validation work without them, which is why people forget them.",
              },
              {
                prompt: "Where does the main unique content of a page belong?",
                options: [
                  "Inside the header",
                  "Inside a single main element",
                  "Inside multiple main elements, one per section",
                  "Inside the footer for SEO",
                ],
                correct: 1,
                explanation: "Use one <main> per page for its unique content; split it into <section> and <article> elements inside.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "CSS Layout: Flexbox, Grid & Responsive Design",
      lessons: [
        {
          title: "The box model, selectors and a clean CSS setup",
          type: "VIDEO",
          durationMinutes: 12,
          content: `## Key points
- Every element is a box made of content, padding, border and margin, and most layout bugs come from misunderstanding this.
- Setting \`box-sizing: border-box\` on everything makes widths include padding and border, which is far easier to reason about.
- Prefer class selectors like \`.card\` over IDs or long nested selectors so styles stay reusable and easy to override.
- CSS custom properties (variables) let you store a client's brand colours once and reuse them everywhere.
- Use \`rem\` for font sizes and spacing so the site respects the user's browser font settings.

## Transcript
Chalo, let's talk about the one idea that will save you hours of frustration: the box model. Every element on the page — a heading, a button, an image — is a rectangle. Inside is the content. Around it is padding, the breathing space. Then the border. Then margin, the gap between this box and its neighbours.

Here's the classic beginner bug. You set a card to \`width: 300px\`, add \`padding: 20px\` and a 1px border, and suddenly it's 342 pixels wide and your layout breaks. The fix is one rule I put at the top of every project:

\`\`\`css
*, *::before, *::after {
  box-sizing: border-box;
}

:root {
  --brand: #b45309;
  --text: #1f2937;
  --bg: #fffbeb;
  --radius: 12px;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: var(--text);
  background: var(--bg);
  line-height: 1.6;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.25rem;
  background: var(--brand);
  color: white;
  border-radius: var(--radius);
  text-decoration: none;
}
\`\`\`

Dekho what we did with \`:root\`. These are CSS variables. When the bakery owner says "actually, can the brown be a little darker?" — and trust me, they will — you change one line, not forty.

On selectors: use classes. \`.btn\`, \`.card\`, \`.menu-item\`. Avoid styling by ID, and avoid chains like \`header nav ul li a\`. They're fragile, and they make overriding styles a nightmare later.

Finally, units. Use \`rem\` for font sizes and spacing. One rem is the root font size, usually 16 pixels. If an older customer has increased their phone's text size, rem-based sites scale nicely while pixel-based ones don't. Open DevTools, hover any element, and you'll see the box model drawn in colours. Make that your habit — inspect, don't guess.`,
        },
        {
          title: "Flexbox in practice: navbars, cards and centering",
          type: "ARTICLE",
          durationMinutes: 10,
          content: `## What Flexbox is for

Flexbox lays items out in **one direction** — a row or a column — and controls how they share space and align. Most of the everyday layout problems in client work are one-directional: a navbar, a row of buttons, a card's internal layout, centering something.

You turn it on with \`display: flex\` on the **parent**. Its direct children become flex items.

## The properties you'll use 90% of the time

- \`flex-direction: row | column\` — the main axis.
- \`justify-content\` — alignment along the main axis: \`flex-start\`, \`center\`, \`space-between\`.
- \`align-items\` — alignment on the cross axis: \`center\`, \`stretch\`.
- \`gap\` — space between items. Far cleaner than margins.
- \`flex-wrap: wrap\` — let items move to the next line when space runs out.
- \`flex: 1\` on a child — "take up the remaining space".

## Pattern 1: The navbar

\`\`\`css
.site-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
}

.site-header ul {
  display: flex;
  gap: 1.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
\`\`\`

Logo on the left, links on the right, both vertically centered. That's the whole navbar layout.

## Pattern 2: Perfect centering

\`\`\`css
.hero {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
\`\`\`

## Pattern 3: Cards with buttons aligned at the bottom

Clients hate it when "Order" buttons sit at different heights because descriptions have different lengths. Make each card a column and push the button down:

\`\`\`css
.card {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  border-radius: var(--radius);
  background: white;
}

.card .btn {
  margin-top: auto; /* pushes the button to the bottom */
}
\`\`\`

## Pattern 4: A wrapping row of items

\`\`\`css
.features {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.features > * {
  flex: 1 1 220px; /* grow, shrink, but try to be at least 220px */
}
\`\`\`

On a wide screen you get four across; on a phone they stack. No media query needed.

> **Tip:** Play "Flexbox Froggy" (flexboxfroggy.com) once. Twenty minutes of that game will fix \`justify-content\` vs \`align-items\` in your head forever.

## When not to use Flexbox

If you are thinking in rows **and** columns at the same time — a photo gallery, a pricing table, a full page layout — reach for Grid instead. That's the next lesson.`,
        },
        {
          title: "CSS Grid and mobile-first responsive design",
          type: "ARTICLE",
          durationMinutes: 11,
          content: `## Grid: layout in two dimensions

CSS Grid lets you define rows and columns together. It shines for galleries, product listings, dashboards and overall page layouts.

\`\`\`css
.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
\`\`\`

\`1fr\` means "one fraction of the free space", so three equal columns. But three columns on a 360px phone is a disaster. Which brings us to the most useful line of CSS I know:

\`\`\`css
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}
\`\`\`

This says: "Fit as many columns as you can, each at least 240px wide, and stretch them to fill the row." One column on phones, two on tablets, four on laptops — automatically.

## Named areas for page layouts

\`\`\`css
.page {
  display: grid;
  grid-template-areas:
    "header"
    "main"
    "sidebar"
    "footer";
}

.page header { grid-area: header; }
.page main { grid-area: main; }
.page aside { grid-area: sidebar; }
.page footer { grid-area: footer; }
\`\`\`

Readable, and easy to rearrange at larger screens.

## Mobile-first, always

In India, a large majority of your client's visitors will be on phones, many on mid-range Android devices. So write your base CSS for the **small screen first**, then add \`min-width\` media queries to enhance for bigger screens:

\`\`\`css
/* Base: phones */
.container {
  padding: 1rem;
}

/* Tablets and up */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
  .page {
    grid-template-columns: 2fr 1fr;
    grid-template-areas:
      "header header"
      "main sidebar"
      "footer footer";
  }
}

/* Laptops and up */
@media (min-width: 1100px) {
  .container {
    max-width: 1100px;
    margin: 0 auto;
  }
}
\`\`\`

Mobile-first CSS tends to be shorter, because phones usually need the simplest layout (one column), and you only *add* complexity.

## Responsive habits that separate pros from beginners

- **Fluid type:** \`font-size: clamp(1.75rem, 5vw, 3rem);\` for headlines that scale smoothly.
- **Images:** \`img { max-width: 100%; height: auto; }\` so images never overflow.
- **Tap targets:** buttons at least 44px tall. Fat thumbs are real.
- **Test real widths:** In Chrome DevTools, toggle the device toolbar and test 360px, 414px, 768px and 1280px. Then open the site on your actual phone.
- **No horizontal scroll:** if the page wiggles sideways on mobile, something is too wide. Find it with DevTools.

> **Tip:** Before sending a preview link to a client, open it on the cheapest phone in your family. If it feels good there, it will feel good everywhere.`,
        },
        {
          title: "Assignment: Responsive landing page for a Jaipur bakery",
          type: "ASSIGNMENT",
          durationMinutes: 90,
          content: `Small local businesses are the most common first clients for freelancers in India. A clean, fast, mobile-friendly landing page that drives WhatsApp orders is a project you can realistically sell for ₹5,000-₹12,000. This assignment is that project.`,
          assignment: {
            brief: `## The client

**Ghar Ki Bakery**, a home bakery in Malviya Nagar, Jaipur, run by Meera Agarwal. She sells eggless cakes, cookies and festive hampers, mostly through Instagram DMs and WhatsApp. She wants a simple website she can put in her Instagram bio.

## Your task

Build a single-page, responsive landing page using only HTML and CSS.

## Required sections

1. **Header** with the bakery name and a nav linking to the sections below.
2. **Hero** with a clear headline, one line about same-day delivery, and a WhatsApp "Order now" button (use a \`wa.me\` link).
3. **Menu** — at least 6 items in a CSS Grid, each card with name, short description, price in ₹ and an image with proper \`alt\` text.
4. **Why us** — 3 features laid out with Flexbox.
5. **Footer** with address, phone (\`tel:\` link) and Instagram link.

## Steps

1. Sketch the layout on paper for a phone first, then for a laptop.
2. Write semantic HTML (one \`h1\`, proper \`section\` elements).
3. Set up CSS variables for brand colours and \`box-sizing: border-box\`.
4. Style mobile-first, then add at least one \`min-width\` media query.
5. Test at 360px, 768px and 1280px in DevTools.

## Deliverable

Push the code to a public GitHub repository and submit the repository link (deployment comes in Module 4, but you can deploy early if you know how).

## Tips

- Use free images from Unsplash or Pexels and compress them to WebP.
- Keep it to one or two fonts from Google Fonts.
- Make the WhatsApp button impossible to miss on mobile.`,
            rubric: [
              { criterion: "Semantic, accessible HTML (heading outline, labels, alt text, real links)", points: 25 },
              { criterion: "Responsive layout using Grid and Flexbox with no horizontal scroll at 360px", points: 30 },
              { criterion: "Visual polish: consistent spacing, colours via CSS variables, readable typography", points: 25 },
              { criterion: "Conversion details: working WhatsApp and tel links, clear call to action", points: 20 },
            ],
            submissionType: "LINK",
          },
        },
      ],
    },
    {
      title: "JavaScript Basics & the DOM",
      lessons: [
        {
          title: "JavaScript essentials: variables, functions, arrays and objects",
          type: "VIDEO",
          durationMinutes: 13,
          content: `## Key points
- Use \`const\` by default and \`let\` only when a value must change; avoid \`var\` in modern code.
- Functions package a piece of logic so you can reuse it, and arrow functions are a shorter way to write them.
- Arrays hold ordered lists (like menu items) and objects hold named properties (like one menu item's name and price).
- Array methods such as \`map\`, \`filter\` and \`reduce\` let you transform data without manual loops.
- The browser console (F12) is where you experiment, read errors and debug with \`console.log\`.

## Transcript
Okay, now our page has structure and style. Time to give it a brain. JavaScript can feel scary, but for client websites you need a surprisingly small core. Let's learn it with data you'll actually use — a bakery menu.

Open your browser console with F12 and type along. First, variables. Use \`const\` when a value won't be reassigned, and \`let\` when it will.

\`\`\`js
const shopName = "Ghar Ki Bakery";
let cartCount = 0;
cartCount = cartCount + 1;

const menu = [
  { name: "Chocolate Truffle", price: 650, eggless: true },
  { name: "Red Velvet", price: 750, eggless: true },
  { name: "Butterscotch", price: 550, eggless: false },
];

function formatPrice(amount) {
  return "₹" + amount.toLocaleString("en-IN");
}

const isAffordable = (item) => item.price <= 650;

const names = menu.map((item) => item.name);
const egglessOnly = menu.filter((item) => item.eggless);
const total = menu.reduce((sum, item) => sum + item.price, 0);

console.log(names);
console.log(formatPrice(total)); // ₹1,950
\`\`\`

Dekho, \`menu\` is an array — an ordered list. Each item inside is an object — a bundle of named properties. This exact shape, an array of objects, is how almost all real data looks, whether it comes from a Google Sheet, an API, or a database.

A function is a reusable recipe. \`formatPrice\` takes a number and returns a nicely formatted rupee string. Notice \`toLocaleString("en-IN")\` — it gives you Indian digit grouping, so one lakh shows as 1,00,000. Small detail, but Indian clients notice.

Then the three array methods I use every single day. \`map\` transforms each item. \`filter\` keeps only items that pass a test. \`reduce\` boils a list down to one value, like a total.

Last thing: errors. When something breaks, the console tells you the file and line number in red. Read it calmly — ninety percent of the time it's a typo or a missing bracket. Next lesson, we use all of this to change the actual page.`,
        },
        {
          title: "Selecting and changing the DOM",
          type: "ARTICLE",
          durationMinutes: 10,
          content: `## What is the DOM?

When the browser reads your HTML, it builds a live tree of objects called the **Document Object Model**. JavaScript can read and change that tree, and the page updates instantly. That's how menus open, prices update and forms show errors.

## Connecting your script

Put your script at the end of the page or use \`defer\` in the head, so the HTML exists before your code runs:

\`\`\`html
<script src="app.js" defer></script>
\`\`\`

## Selecting elements

\`\`\`js
const title = document.querySelector("h1");            // first match
const cards = document.querySelectorAll(".card");       // all matches
const menuGrid = document.querySelector("#menu-grid");
\`\`\`

\`querySelector\` accepts any CSS selector, so everything you learned in Module 2 applies here.

## Changing content and styles

\`\`\`js
title.textContent = "Diwali hampers now available!";

menuGrid.classList.add("is-loading");
menuGrid.classList.remove("is-loading");
menuGrid.classList.toggle("dark");
\`\`\`

- Use \`textContent\` to set plain text. It is safe because it never interprets HTML.
- Prefer toggling **classes** over setting \`element.style\` directly. Keep the look in CSS and let JavaScript just flip switches.

## Rendering a list from data

This is the pattern that turns a JavaScript array into cards on the page. Later, the same idea is what React automates for you.

\`\`\`js
const menu = [
  { name: "Chocolate Truffle", price: 650 },
  { name: "Red Velvet", price: 750 },
  { name: "Kaju Katli Box", price: 900 },
];

const grid = document.querySelector("#menu-grid");

menu.forEach((item) => {
  const card = document.createElement("article");
  card.className = "card";

  const name = document.createElement("h3");
  name.textContent = item.name;

  const price = document.createElement("p");
  price.textContent = "₹" + item.price;

  card.append(name, price);
  grid.append(card);
});
\`\`\`

Now when the client adds a new cake, you change one line in the array instead of copy-pasting a block of HTML.

## A word on innerHTML

\`element.innerHTML = "..."\` is tempting because it is short, but if any part of that string comes from a user (a form field, a URL parameter), someone can inject malicious scripts. For anything user-provided, build elements and use \`textContent\` as above.

## Reading values

\`\`\`js
const input = document.querySelector("#name");
console.log(input.value); // what the user typed
\`\`\`

> **Tip:** In DevTools, select an element in the Elements panel, then type \`$0\` in the console. It refers to that element, so you can experiment with \`$0.textContent\` or \`$0.classList\` live before writing code.

## Summary

Select with \`querySelector\`, change with \`textContent\` and \`classList\`, create with \`createElement\` and \`append\`. With just these, you can build most of the interactivity a small-business website needs. The missing piece is *when* to run the code — that's events, coming next.`,
        },
        {
          title: "Events: a mobile menu toggle and a WhatsApp order builder",
          type: "VIDEO",
          durationMinutes: 12,
          content: `## Key points
- \`addEventListener\` runs a function when something happens, such as a click, an input change or a form submit.
- A mobile hamburger menu is just a button that toggles a class, plus CSS that shows or hides the nav.
- Update \`aria-expanded\` when toggling menus so screen reader users know the state.
- Use \`event.preventDefault()\` on form submit when you want to handle the data with JavaScript.
- \`encodeURIComponent\` safely converts text into a URL, which is essential for pre-filled WhatsApp messages.

## Transcript
This lesson is my favourite, because we're going to build two features that clients literally ask for every week.

Feature one: the hamburger menu. On phones, there's no room for five nav links, so we hide them behind a button. The JavaScript is tiny.

\`\`\`js
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

toggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", isOpen);
});
\`\`\`

In CSS, \`.site-nav\` is hidden by default on mobile and shown when it has the \`open\` class. Dekho, \`classList.toggle\` returns true or false, so we reuse it to update \`aria-expanded\`. That one line makes the menu understandable for screen reader users. Clients won't ask for it, but it's the mark of a professional.

Feature two — and this one makes clients very happy: a WhatsApp order builder. The customer picks a cake, a weight and a date, and taps one button. WhatsApp opens with a neatly written order message. No payment gateway, no backend, and the bakery gets structured orders.

\`\`\`js
const form = document.querySelector("#order-form");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);

  const message =
    "Hi! I'd like to order:\\n" +
    "Cake: " + data.get("cake") + "\\n" +
    "Weight: " + data.get("weight") + "\\n" +
    "Delivery date: " + data.get("date");

  const url = "https://wa.me/919829012345?text=" + encodeURIComponent(message);
  window.open(url, "_blank");
});
\`\`\`

\`preventDefault\` stops the browser from reloading the page. \`FormData\` reads all the fields by their \`name\` attribute. And \`encodeURIComponent\` converts spaces, line breaks and apostrophes into a URL-safe format — skip it and the message comes out broken.

I've sold this exact feature to a cake shop in Indore and a tiffin service in Pune. Simple code, real business value. Chalo, try it yourself, then take the quiz.`,
        },
        {
          title: "Quiz: JavaScript & the DOM",
          type: "QUIZ",
          durationMinutes: 7,
          content: `Five questions on JavaScript fundamentals and DOM manipulation. Think about what the code actually does before you pick an answer.`,
          quiz: {
            questions: [
              {
                prompt: "Given const prices = [650, 750, 550], what does prices.filter((p) => p > 600) return?",
                options: ["[650, 750, 550]", "[true, true, false]", "[650, 750]", "1400"],
                correct: 2,
                explanation: "filter keeps the original items for which the callback returns true. It does not return booleans (that would be map) or a sum (that would be reduce).",
              },
              {
                prompt: "You need to show a customer's name, typed into a form, on the page. Which is the safest approach?",
                options: [
                  "element.innerHTML = name",
                  "element.textContent = name",
                  "document.write(name)",
                  "eval(name)",
                ],
                correct: 1,
                explanation: "textContent inserts plain text and never parses HTML, so a malicious script in the input cannot run. innerHTML with user input is an XSS risk.",
              },
              {
                prompt: "Your script runs document.querySelector('.card') but gets null, even though the card exists in the HTML. What is the most likely cause?",
                options: [
                  "querySelector only works with IDs",
                  "The script runs in the head before the HTML is parsed, without defer",
                  "Cards cannot be selected by class",
                  "The browser cache needs clearing",
                ],
                correct: 1,
                explanation: "A script in the head without defer runs before the body exists. Use defer or place the script at the end of the body.",
              },
              {
                prompt: "Why do we call event.preventDefault() in a form submit handler?",
                options: [
                  "To stop the browser's default page reload or navigation so JavaScript can handle the data",
                  "To prevent the user from typing invalid data",
                  "To clear the form fields",
                  "To make the form accessible",
                ],
                correct: 0,
                explanation: "By default, submitting a form navigates or reloads the page. preventDefault stops that so your code can process the data, for example by building a WhatsApp link.",
              },
              {
                prompt: "What is the best way to open and close a mobile nav with JavaScript?",
                options: [
                  "Set nav.style.display in JavaScript each time",
                  "Delete and recreate the nav element on each click",
                  "Toggle a class like 'open' and define the visible styles in CSS",
                  "Reload the page with a URL parameter",
                ],
                correct: 2,
                explanation: "Keeping styles in CSS and toggling a class keeps responsibilities separate, is easier to animate, and is easier for the next developer to maintain.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "Ship It: Git, GitHub, Deployment & Client Handoff",
      lessons: [
        {
          title: "Git and GitHub: save points for your code",
          type: "VIDEO",
          durationMinutes: 12,
          content: `## Key points
- Git records snapshots (commits) of your project, so you can always go back if something breaks.
- The everyday loop is: edit files, \`git add\`, \`git commit -m "message"\`, \`git push\`.
- GitHub hosts your repositories online, acts as your public portfolio, and connects directly to Netlify and Vercel.
- Write commit messages that describe what changed and why, like "Add WhatsApp order form to menu section".
- Use a \`.gitignore\` file so secrets and bulky folders like \`node_modules\` never get uploaded.

## Transcript
Let me tell you a story. In my second year of freelancing, I was editing a client's site directly on the server. I made a "small change", broke the whole homepage, and had no copy of the old version. The client was a coaching institute, it was admission season, and I spent the whole night fixing it. That night I learned Git properly.

Git is a time machine for your code. Every commit is a save point. Break something? Go back.

Install Git from git-scm.com, then set your identity once:

\`\`\`bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
\`\`\`

Now inside your project folder:

\`\`\`bash
git init
git add .
git commit -m "Initial bakery landing page"
\`\`\`

\`git add\` chooses what goes into the snapshot, and \`git commit\` takes the snapshot. Run \`git status\` anytime to see what's changed — I type it probably a hundred times a day.

Next, GitHub. Create a free account, click "New repository", name it \`ghar-ki-bakery\`, and GitHub shows you commands like these:

\`\`\`bash
git branch -M main
git remote add origin https://github.com/yourname/ghar-ki-bakery.git
git push -u origin main
\`\`\`

Refresh the page — your code is online. From now on, your loop is: make changes, add, commit, push.

Two professional habits. First, commit messages: "update" tells nobody anything. "Fix menu cards overflowing on 360px screens" tells future-you exactly what happened. Second, create a \`.gitignore\` file and never commit passwords, API keys or \`node_modules\`.

And here's a bonus: your GitHub profile is your resume. When a Pune startup is deciding between you and someone else, a green contribution graph and clean repos say a lot. Chalo, push your bakery project now.`,
        },
        {
          title: "Deploy to Netlify or Vercel (with a custom domain)",
          type: "ARTICLE",
          durationMinutes: 9,
          content: `## Why these two?

Netlify and Vercel both host static sites **free** on generous plans, give you HTTPS automatically, and redeploy every time you push to GitHub. For small-business sites and portfolios, you rarely need anything else.

## Deploying on Netlify

1. Sign in at netlify.com with your GitHub account.
2. Click **Add new site → Import an existing project → GitHub**.
3. Pick your repository.
4. For a plain HTML/CSS/JS site: leave the build command **empty** and set the publish directory to the folder containing \`index.html\` (often just the root).
5. Click **Deploy**. In under a minute you'll have a URL like \`ghar-ki-bakery.netlify.app\`.

Change the site name under **Site configuration** to something readable before sending it to the client.

## Deploying on Vercel

1. Sign in at vercel.com with GitHub and click **Add New → Project**.
2. Import the repository. Vercel detects "Other" for static sites — that's correct.
3. Click **Deploy**. You get \`your-project.vercel.app\`.

Both platforms create a **preview deployment** for every branch or pull request. Send preview links to clients for approval before merging changes into \`main\`. It looks very professional.

## Connecting the client's domain

Most Indian small businesses buy domains from GoDaddy, Hostinger or BigRock (a \`.in\` domain is usually ₹500-₹900 per year). The steps:

1. In Netlify/Vercel, open **Domains** and add \`gharkibakery.in\`.
2. The platform shows the DNS records to add — typically an **A record** for the root domain and a **CNAME** for \`www\`.
3. Log into the registrar's DNS panel and add exactly those records.
4. Wait. DNS can take a few minutes to a few hours. HTTPS is issued automatically once it resolves.

> **Tip:** Always buy the domain in the **client's** name and account, not yours. Ask them to add you as a collaborator or share access temporarily. This avoids awkward disputes later and builds trust.

## Before you announce "it's live"

Run through this list every time:

- Open the live URL on your phone over mobile data, not just Wi-Fi.
- Test every link: WhatsApp, \`tel:\`, Instagram, nav anchors.
- Submit the contact form and confirm the client receives it.
- Run Lighthouse (Chrome DevTools → Lighthouse) and aim for 90+ on Performance and Accessibility.
- Add a \`favicon\` and a proper \`<title>\` and \`<meta name="description">\` for Google.
- Check that \`www\` and non-\`www\` both work and HTTPS shows a padlock.

## Updating the site later

Edit locally, commit, push. The site redeploys automatically in about 30 seconds. If something breaks, both platforms let you instantly roll back to a previous deploy from their dashboard — one more reason to commit often.`,
        },
        {
          title: "Client handoff: docs, access and getting paid",
          type: "ARTICLE",
          durationMinutes: 8,
          content: `## The project isn't done when the site is live

The handoff is where you turn a one-time project into referrals and repeat work. A sloppy handoff ("bhai, link bhej diya") leaves the client confused. A clean one makes them recommend you to every business owner they know.

## Before handoff: get paid properly

The standard structure many Indian freelancers use for small sites:

- **50% advance** before you start (protects you from ghosting).
- **50% on completion**, before you transfer final access or point the domain.

Share a simple invoice with your name, the client's business name, scope, amount in ₹ and your UPI ID or bank details. Razorpay Payment Links or a direct UPI request works well. If you are GST-registered, include GST; most beginners aren't required to register until they cross the turnover threshold, but check current rules.

## The handoff checklist

1. **Access**: The client owns the domain account. Transfer or share the GitHub repo and add the client (or their next developer) to Netlify/Vercel as a team member.
2. **A one-page guide**: Written in simple language, ideally with screenshots — how to request changes, where the site is hosted, renewal dates for the domain.
3. **Credentials sheet**: Shared securely (not in a WhatsApp group). List every account and who owns it.
4. **Final QA proof**: Lighthouse scores, mobile screenshots, a test form submission.
5. **Support terms**: For example, "14 days of free bug fixes; content changes after that at ₹500 per small update or ₹2,000/month for up to 5 updates."

## A sample handoff message

> Hi Meera ji, your website is live at gharkibakery.in. I've attached a short guide with your domain renewal date (12 March), how orders reach your WhatsApp, and how to request changes. All accounts are in your name. I'll fix any bugs free for the next 14 days. It was a pleasure working with you — if you're happy with the site, a Google review or a referral to another business owner would mean a lot!

## Ask for the testimonial now

The best time to ask for a review is the day the client is happiest — launch day. Ask for:

- A **Google review** on your business profile, or a LinkedIn recommendation.
- Permission to add the site to your **portfolio** with a one-line quote.
- **Referrals**: "Do you know anyone else who needs a website?" Business owners in the same market or WhatsApp group are your best leads.

## Keep a project log

For every client, note the price, time spent, what went well and what you'd change. After five projects, you'll know your real hourly rate — and you'll be ready to charge more.`,
        },
        {
          title: "Final assignment: Ship your portfolio and a handoff kit",
          type: "ASSIGNMENT",
          durationMinutes: 90,
          content: `Clients hire freelancers they can verify. A live portfolio on your own URL, backed by a clean GitHub profile, is the single most important asset for getting your first paid web project. This capstone puts everything from the course together.`,
          assignment: {
            brief: `## Your task

Build and deploy your personal portfolio website, then prepare a client-style handoff kit for it.

## Requirements

1. **Semantic HTML**: header, nav, main with sections, footer. One \`h1\`.
2. **Sections**: Hero (who you are, what you build), Projects (at least 2, including your Jaipur bakery page), Skills, and Contact.
3. **Responsive CSS** with Flexbox and/or Grid, mobile-first, no horizontal scroll at 360px.
4. **JavaScript**: at least one real interaction, such as a mobile menu toggle or a contact form that builds a WhatsApp message.
5. **Git**: at least 5 meaningful commits pushed to a public GitHub repo.
6. **Deployment** on Netlify or Vercel with a readable site name.
7. **Handoff kit** in the repo's \`README.md\`: live URL, how to run locally, how to deploy updates, and a short "support terms" paragraph as if this were a client project.

## Steps

1. Write your content first: a two-line intro, project descriptions with your role and outcome.
2. Build and commit section by section.
3. Deploy, then run Lighthouse and fix anything below 90 on Performance or Accessibility.
4. Test the live site on your phone over mobile data.

## Deliverable

Submit your **live site URL**. Make sure the GitHub repo is linked from the site footer.

## Tips

- Recruiters and clients spend seconds, not minutes. Put your best project first.
- Add \`<meta name="description">\` and a favicon. Small details signal care.
- Share it on LinkedIn when it's done — tag Catalance Campus, we love seeing student launches.`,
            rubric: [
              { criterion: "Live deployment works on mobile and desktop with readable URL and working links", points: 25 },
              { criterion: "Code quality: semantic HTML, organised CSS, working JavaScript interaction", points: 30 },
              { criterion: "Git history with meaningful commit messages on a public repo", points: 15 },
              { criterion: "Content and presentation: clear positioning, strong project write-ups", points: 15 },
              { criterion: "Handoff kit README: run, deploy and support instructions are clear", points: 15 },
            ],
            submissionType: "LINK",
          },
        },
      ],
    },
  ],
};

const reactForFreelancers = {
  slug: "react-for-freelancers",
  title: "React for Freelancers: Ship Client Sites",
  subtitle: "Build, deploy and price real React projects for Indian clients",
  description:
    "You know HTML, CSS and JavaScript — now learn the React skills clients actually pay for. Rahul walks you through components, state, routing, forms and data fetching by building a real restaurant site, then styles it with Tailwind, deploys it on Vercel and shows you exactly how to quote ₹25,000-₹80,000 React projects with confidence.",
  level: "INTERMEDIATE",
  languages: ["en", "hinglish", "hi"],
  cover: { from: "#0EA5E9", to: "#4F46E5", pattern: "rings" },
  mentorId: "m_2",
  priceINR: 2499,
  rating: 4.7,
  ratingsCount: 1186,
  studentsCount: 7840,
  createdDaysAgo: 95,
  skills: ["React", "JSX & Components", "Hooks", "React Router", "Forms & APIs", "Tailwind CSS", "Vercel deployment"],
  whatYouBuild: [
    "A reusable component library for a Kochi café's menu and cart",
    "A multi-page React site with React Router, a validated booking form and live data",
    "A Tailwind-styled client project deployed on Vercel with environment variables",
    "A professional project quote and scope document for an Indian client",
  ],
  requirements: [
    "Comfortable with HTML, CSS and JavaScript basics (Web Foundations or equivalent)",
    "Node.js 18+ and VS Code installed",
    "A GitHub account",
  ],
  modules: [
    {
      title: "Components & Props",
      lessons: [
        {
          title: "Why React for client work (and when not to use it)",
          type: "VIDEO",
          durationMinutes: 9,
          isPreview: true,
          content: `## Key points
- React lets you build interfaces from reusable components, which saves huge amounts of time once a site has repeated pieces like cards, menus and forms.
- React is a great fit for interactive projects: dashboards, booking flows, carts, admin panels and multi-page startup sites.
- A five-section brochure site for a local shop is often faster, cheaper and better for SEO in plain HTML or a site builder.
- Knowing when not to use React is a professional skill that clients trust and pay for.
- Most React freelance work in India comes from startups, agencies and D2C brands needing someone who can ship and maintain an app.

## Transcript
Welcome to React for Freelancers. I'm Rahul, and before we write a single component, I want to answer the question my students always ask: "Sir, should every website be in React?" Honestly — no.

Dekho, React's superpower is components. You build a \`MenuCard\` once, and reuse it fifty times with different data. You build a cart once, and its state stays in sync across the page. For interactive products — a booking flow for a Kochi homestay, a dashboard for a Pune startup, an ordering system for a cloud kitchen — React saves you days of work and makes changes painless.

But if a Jaipur boutique wants a five-section page with photos and a WhatsApp button, React is overkill. You'd add a build step, a JavaScript bundle and SEO complications for no real benefit. I've seen freelancers lose clients because a simple site became slow and hard to update.

So here's my rule of thumb. Choose React when the site has real state — things users add, filter, log into, or submit through multiple steps. Or when the client already has a React codebase and needs someone to maintain it. That second one is a huge market, by the way. Agencies in Bengaluru and Gurugram constantly look for freelancers who can jump into an existing React project.

In this course we'll build one real project end to end: a website for "Malabar Bites", a café in Fort Kochi. Menu, cart, table booking, live opening hours, Tailwind styling, deployment on Vercel — and finally, how much to charge for it. By the end, you won't just know React; you'll know how to sell it. Chalo, let's set up the project.`,
        },
        {
          title: "Set up with Vite and understand JSX",
          type: "ARTICLE",
          durationMinutes: 10,
          isPreview: true,
          content: `## Creating the project

Vite is the standard way to start a React project today. It's fast and produces small production builds. In your terminal:

\`\`\`bash
npm create vite@latest malabar-bites -- --template react
cd malabar-bites
npm install
npm run dev
\`\`\`

Open the local URL Vite prints (usually \`http://localhost:5173\`). Edit \`src/App.jsx\`, save, and the page updates instantly.

## The files that matter

- \`index.html\` — the single HTML page. It has a \`<div id="root">\`.
- \`src/main.jsx\` — mounts your React app into that root div.
- \`src/App.jsx\` — your top-level component. Start here.
- \`public/\` — static files like the favicon and images served as-is.

Delete the demo content in \`App.jsx\` and \`App.css\` so you start clean.

## JSX: HTML-like syntax inside JavaScript

\`\`\`jsx
export default function App() {
  const cafeName = "Malabar Bites";
  const isOpen = true;

  return (
    <main className="page">
      <h1>{cafeName}</h1>
      <p>Kerala breakfast and filter coffee in Fort Kochi.</p>
      {isOpen ? <p>Open now</p> : <p>Closed — see you tomorrow at 7 AM</p>}
    </main>
  );
}
\`\`\`

JSX looks like HTML but compiles to JavaScript. The rules that trip people up:

1. **One parent element.** A component returns a single root. If you don't want an extra div, use a fragment: \`<>...</>\`.
2. **\`className\`, not \`class\`** — because \`class\` is a reserved word in JavaScript. Similarly \`htmlFor\` instead of \`for\` on labels.
3. **Curly braces for JavaScript expressions.** \`{cafeName}\`, \`{price * 2}\`, \`{isOpen ? "Yes" : "No"}\`. Expressions only — no \`if\` statements or \`for\` loops inside the braces.
4. **Close every tag**, including self-closing ones: \`<img />\`, \`<input />\`, \`<br />\`.
5. **Inline styles are objects**: \`style={{ color: "teal", marginTop: 16 }}\`. You'll rarely need them once we add Tailwind.

## Conditional rendering patterns

\`\`\`jsx
{isOpen && <span className="badge">Open now</span>}
{items.length === 0 ? <p>Your cart is empty</p> : <Cart items={items} />}
\`\`\`

\`&&\` renders the right side only when the left is true. The ternary picks between two options.

> **Tip:** Watch out for \`{count && <Badge />}\`. If \`count\` is \`0\`, React renders the number 0 on the page. Use \`{count > 0 && <Badge />}\` instead.

## Install the React DevTools

Add the "React Developer Tools" Chrome extension. It shows your component tree, props and state — you'll use it constantly from the next lesson onward.

## Commit early

\`\`\`bash
git init
git add .
git commit -m "Scaffold Malabar Bites with Vite + React"
\`\`\`

Vite's template already includes a \`.gitignore\` that excludes \`node_modules\` and \`dist\`. Push to GitHub now — Module 4 deploys straight from there.`,
        },
        {
          title: "Components and props: build a reusable MenuCard",
          type: "ARTICLE",
          durationMinutes: 11,
          content: `## A component is a function that returns UI

Any function whose name starts with a capital letter and returns JSX is a component. Components are how you avoid copy-pasting the same markup fifty times.

## Props: passing data into components

\`\`\`jsx
// src/components/MenuCard.jsx
export default function MenuCard({ name, description, price, isVeg, image }) {
  return (
    <article className="menu-card">
      <img src={image} alt={name} width="400" height="260" loading="lazy" />
      <div className="menu-card__body">
        <h3>
          {name} {isVeg && <span className="veg-dot" aria-label="Vegetarian" />}
        </h3>
        <p>{description}</p>
        <p className="price">{"₹" + price}</p>
      </div>
    </article>
  );
}
\`\`\`

Props arrive as one object; destructuring \`{ name, price }\` in the parameter list keeps the code readable. Props flow **down** from parent to child, and a child must **never modify** its props.

## Rendering a list from data

Keep the café's menu as data in its own file. This is what makes React sites easy to update:

\`\`\`jsx
// src/data/menu.js
export const menu = [
  { id: "appam-stew", name: "Appam with Veg Stew", description: "Two lacy appams, coconut milk stew", price: 180, isVeg: true, image: "/img/appam.webp" },
  { id: "kappa-fish", name: "Kappa & Fish Curry", description: "Tapioca with Kerala red fish curry", price: 260, isVeg: false, image: "/img/kappa.webp" },
  { id: "filter-coffee", name: "Filter Coffee", description: "Strong, frothy, served in a dabarah", price: 60, isVeg: true, image: "/img/coffee.webp" },
];
\`\`\`

\`\`\`jsx
// src/components/MenuGrid.jsx
import MenuCard from "./MenuCard";
import { menu } from "../data/menu";

export default function MenuGrid() {
  return (
    <section className="menu-grid">
      {menu.map((item) => (
        <MenuCard key={item.id} {...item} />
      ))}
    </section>
  );
}
\`\`\`

- \`map\` turns each data object into a \`<MenuCard />\`.
- \`key\` must be a **stable, unique** id. Don't use the array index if items can be reordered or removed.
- \`{...item}\` spreads every property of \`item\` as a prop. Convenient, but be explicit when a component takes many unrelated props.

## The children prop

Some components wrap other content. Anything between the opening and closing tags arrives as \`children\`:

\`\`\`jsx
function Section({ title, children }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

<Section title="Our Menu">
  <MenuGrid />
</Section>
\`\`\`

## Default values

\`\`\`jsx
function Button({ variant = "primary", children, ...rest }) {
  return (
    <button className={"btn btn--" + variant} {...rest}>
      {children}
    </button>
  );
}
\`\`\`

\`...rest\` collects any other props like \`onClick\` or \`type\` and passes them through, so your \`Button\` behaves like a normal button.

## How to split components

A good rule: if a chunk of JSX has its own name in conversation ("the menu card", "the booking form"), or appears more than once, make it a component. Keep files small — one component per file in \`src/components\`.

> **Tip:** Name components after what they *are* for the client, not how they look. \`MenuCard\` survives a redesign; \`BlueBox\` doesn't.`,
        },
        {
          title: "Quiz: Components, JSX & props",
          type: "QUIZ",
          durationMinutes: 6,
          content: `Check your understanding of JSX rules, props and list rendering before we add state in Module 2.`,
          quiz: {
            questions: [
              {
                prompt: "A cart badge is written as {cartCount && <Badge count={cartCount} />}. When the cart is empty, a stray '0' appears on the page. Why?",
                options: [
                  "Badge has a bug that renders 0",
                  "When cartCount is 0, the expression evaluates to 0 and React renders numbers",
                  "JSX does not support the && operator",
                  "The key prop is missing",
                ],
                correct: 1,
                explanation: "&& returns the left value when it is falsy. React skips false, null and undefined, but it renders 0. Use cartCount > 0 && ... instead.",
              },
              {
                prompt: "Which is the best key when rendering menu items that the client can reorder and delete from an admin panel?",
                options: [
                  "The array index from map",
                  "Math.random()",
                  "A stable unique id stored with each item",
                  "The item's price",
                ],
                correct: 2,
                explanation: "Keys must be stable and unique so React can match items between renders. Indexes break when items move; random values change every render; prices are not unique.",
              },
              {
                prompt: "A MenuCard component wants to show a discounted price. What should it do?",
                options: [
                  "Reassign props.price inside the component",
                  "Compute a new value, e.g. const finalPrice = price * 0.9, and render that",
                  "Ask the parent to re-mount it",
                  "Store the price in a global variable",
                ],
                correct: 1,
                explanation: "Props are read-only. Derive new values from props inside the component instead of mutating them.",
              },
              {
                prompt: "Which JSX is valid?",
                options: [
                  "<label for=\"email\" class=\"field\">Email</label>",
                  "<img src={photo} alt=\"Café interior\">",
                  "<label htmlFor=\"email\" className=\"field\">Email</label>",
                  "{if (isOpen) { <p>Open</p> }}",
                ],
                correct: 2,
                explanation: "JSX uses htmlFor and className, requires self-closing tags like <img />, and only allows expressions (not if statements) inside curly braces.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "State & Effects",
      lessons: [
        {
          title: "useState: making the UI interactive",
          type: "VIDEO",
          durationMinutes: 12,
          content: `## Key points
- State is data that changes over time and should update the UI, such as cart items, a selected category or whether a modal is open.
- \`useState\` returns the current value and a setter; calling the setter re-renders the component with the new value.
- Never mutate state directly; always create a new array or object so React detects the change.
- When the new value depends on the old one, use the updater form like \`setCount((c) => c + 1)\`.
- Derive values such as totals from state instead of storing them separately, to avoid things going out of sync.

## Transcript
In Web Foundations, we changed the page by hand — select an element, change its text. React flips this around. You describe what the UI should look like for a given state, and React updates the page when the state changes. Chalo, let's build a category filter for the Malabar Bites menu.

\`\`\`jsx
import { useState } from "react";
import { menu } from "../data/menu";
import MenuCard from "./MenuCard";

const categories = ["All", "Breakfast", "Mains", "Drinks"];

export default function FilterableMenu() {
  const [active, setActive] = useState("All");

  const visible =
    active === "All" ? menu : menu.filter((item) => item.category === active);

  return (
    <section>
      <div className="tabs" role="tablist">
        {categories.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={active === cat}
            onClick={() => setActive(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="menu-grid">
        {visible.map((item) => (
          <MenuCard key={item.id} {...item} />
        ))}
      </div>
    </section>
  );
}
\`\`\`

\`useState("All")\` gives us two things: \`active\`, the current value, and \`setActive\`, the function to change it. Click a tab, \`setActive\` runs, React re-renders, and the filtered list appears. No \`querySelector\`, no manual DOM work.

Now dekho this line: \`const visible = ...\`. We did not put the filtered list into state. It's derived from \`active\` and \`menu\` on every render. Beginners often store both and then forget to update one. If you can calculate it, don't store it.

The most important rule: never mutate state. If your cart is an array, \`cart.push(item)\` will not re-render, because React sees the same array. Instead you write \`setCart([...cart, item])\` — a brand new array. Same for objects: \`setForm({ ...form, name: value })\`.

One more: when the next value depends on the previous one, use the updater form — \`setQty((q) => q + 1)\`. It always gets the latest value, even if several updates happen quickly. Next lesson, we'll build the full cart with these rules.`,
        },
        {
          title: "Lists, lifting state up and building a cart",
          type: "ARTICLE",
          durationMinutes: 12,
          content: `## The problem: two components need the same data

The menu needs to **add** items to the cart. The header needs to **show** the cart count. The cart drawer needs to **list** items. If each kept its own state, they'd disagree. The solution is to **lift state up** to their closest common parent and pass data and functions down as props.

## The cart state in App

\`\`\`jsx
import { useState } from "react";

export default function App() {
  const [cart, setCart] = useState([]); // [{ id, name, price, qty }]

  function addToCart(item) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  }

  function changeQty(id, delta) {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  }

  const itemCount = cart.reduce((sum, c) => sum + c.qty, 0);
  const total = cart.reduce((sum, c) => sum + c.qty * c.price, 0);

  return (
    <>
      <Header itemCount={itemCount} />
      <FilterableMenu onAdd={addToCart} />
      <CartDrawer items={cart} total={total} onChangeQty={changeQty} />
    </>
  );
}
\`\`\`

Notice every update returns **new** arrays and objects with \`map\`, \`filter\` and spread. Nothing is mutated, so React reliably re-renders.

## Passing functions down

\`\`\`jsx
function MenuCard({ item, onAdd }) {
  return (
    <article className="menu-card">
      <h3>{item.name}</h3>
      <p>{"₹" + item.price}</p>
      <button onClick={() => onAdd(item)}>Add</button>
    </article>
  );
}
\`\`\`

The child doesn't know *how* the cart works. It just calls \`onAdd\`. Naming callbacks \`onSomething\` is the React convention, mirroring \`onClick\`.

## Rendering the cart

\`\`\`jsx
function CartDrawer({ items, total, onChangeQty }) {
  if (items.length === 0) return <aside className="cart">Your cart is empty</aside>;

  return (
    <aside className="cart">
      <ul>
        {items.map((c) => (
          <li key={c.id}>
            {c.name} × {c.qty}
            <button onClick={() => onChangeQty(c.id, -1)} aria-label={"Remove one " + c.name}>−</button>
            <button onClick={() => onChangeQty(c.id, 1)} aria-label={"Add one " + c.name}>+</button>
          </li>
        ))}
      </ul>
      <p className="total">Total: {"₹" + total.toLocaleString("en-IN")}</p>
    </aside>
  );
}
\`\`\`

## When prop passing gets painful

If you're passing \`cart\` through four layers of components that don't use it ("prop drilling"), consider React **Context** for truly global data like the cart or the logged-in user. For most small client sites, lifting state to \`App\` is enough — don't add complexity early.

> **Tip:** Store the **minimum** state (the cart items). Totals, counts and "is the cart empty" are all derived. Fewer pieces of state means fewer bugs a client can find.

## Checking out on WhatsApp

Many Indian restaurants prefer orders on WhatsApp over a payment gateway in phase one. Build the message from \`cart\` with \`map\` and \`join("\\n")\`, wrap it with \`encodeURIComponent\`, and open a \`wa.me\` link — exactly what you did in Web Foundations, now driven by React state.`,
        },
        {
          title: "useEffect without the bugs",
          type: "ARTICLE",
          durationMinutes: 11,
          content: `## What effects are for

\`useEffect\` lets a component **synchronise with something outside React**: the browser's \`localStorage\`, a timer, a WebSocket, the document title, an API. If you're not touching the outside world, you probably don't need an effect.

## Anatomy of an effect

\`\`\`jsx
useEffect(() => {
  // runs after render
  return () => {
    // optional cleanup: runs before the next effect and on unmount
  };
}, [dependencies]);
\`\`\`

- **No array**: runs after every render (rarely what you want).
- **Empty array \`[]\`**: runs once after the first render.
- **\`[cart]\`**: runs after the first render and whenever \`cart\` changes.

## Example 1: persist the cart in localStorage

Customers browse, close the tab, and come back. Keep their cart:

\`\`\`jsx
const [cart, setCart] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("mb-cart")) || [];
  } catch {
    return [];
  }
});

useEffect(() => {
  localStorage.setItem("mb-cart", JSON.stringify(cart));
}, [cart]);
\`\`\`

The function passed to \`useState\` runs only once (lazy initialisation), so we don't read \`localStorage\` on every render. The \`try/catch\` protects against corrupted data or blocked storage.

## Example 2: a live "Open now" badge with cleanup

\`\`\`jsx
function OpenBadge() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const isOpen = hour >= 7 && hour < 22;
  return <span className="badge">{isOpen ? "Open now" : "Closed"}</span>;
}
\`\`\`

The cleanup \`clearInterval\` matters. Without it, every time the component mounts you leave another timer running — a classic memory leak that slows down long sessions.

## The three bugs I see in every code review

**1. Missing dependencies.** If your effect uses \`city\` but the array is \`[]\`, it runs with a stale value forever. Install the ESLint plugin \`eslint-plugin-react-hooks\` (Vite's template includes it) and listen to its warnings.

**2. Infinite loops.** Setting state that is also a dependency:

\`\`\`jsx
// Bad: runs, sets items, items changes, runs again...
useEffect(() => {
  setItems([...items, newItem]);
}, [items]);
\`\`\`

Ask yourself why this is in an effect at all. Usually it belongs in an event handler.

**3. Effects for derived data.**

\`\`\`jsx
// Unnecessary
const [total, setTotal] = useState(0);
useEffect(() => {
  setTotal(cart.reduce((s, c) => s + c.price * c.qty, 0));
}, [cart]);

// Better: just calculate it during render
const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
\`\`\`

## Development double-run

In development, React's Strict Mode mounts components twice to help you catch missing cleanups. If you see an effect run twice locally, that's expected; it does not happen in production. Fix it by writing proper cleanups rather than removing Strict Mode.

> **Tip:** Before writing \`useEffect\`, say out loud: "I need to sync with ___." If you can't fill the blank with something outside React, use an event handler or a derived value instead.`,
        },
        {
          title: "Assignment: Menu, filters and cart for a Kochi café",
          type: "ASSIGNMENT",
          durationMinutes: 75,
          content: `Menus with filters and a cart are among the most requested React features from restaurants, cloud kitchens and D2C brands. Getting state right here — no mutation, derived totals, persistence — is what separates a demo from something a client can actually run their business on.`,
          assignment: {
            brief: `## The client

**Malabar Bites**, a café in Fort Kochi. The owner, Anitha, wants customers to browse the menu on their phones, build an order and send it to the café's WhatsApp.

## Your task

Build the menu and cart in React using what you learned in Modules 1 and 2.

## Requirements

1. Menu data (at least 10 items across 3+ categories) in \`src/data/menu.js\` with stable \`id\`s, prices in ₹ and a veg/non-veg flag.
2. A reusable \`MenuCard\` component that receives data through props.
3. Category tabs and a "Veg only" toggle, both driven by \`useState\`. Filtered results must be **derived**, not stored.
4. A cart with add, increase, decrease and remove. Total formatted with \`toLocaleString("en-IN")\`.
5. Cart persisted to \`localStorage\` with \`useEffect\`.
6. A "Send order on WhatsApp" button that builds a readable order message from the cart.
7. Empty states: an empty cart and a filter with no results.

## Deliverable

Push to GitHub and submit the **repository link**. Include a short README with screenshots of the mobile view.

## Tips

- Keep cart state in \`App\` and pass \`onAdd\` / \`onChangeQty\` down.
- Test by refreshing the page mid-order — the cart should survive.
- Run the React DevTools Profiler once and make sure clicking a tab doesn't cause errors in the console.`,
            rubric: [
              { criterion: "Component design: reusable MenuCard, clean props, sensible file structure", points: 25 },
              { criterion: "State correctness: no mutation, derived filters and totals, working quantity controls", points: 35 },
              { criterion: "Effects: localStorage persistence implemented correctly without loops", points: 20 },
              { criterion: "UX details: empty states, WhatsApp message quality, mobile usability", points: 20 },
            ],
            submissionType: "LINK",
          },
        },
      ],
    },
    {
      title: "Routing, Forms & Fetching Data",
      lessons: [
        {
          title: "React Router: multi-page client sites",
          type: "VIDEO",
          durationMinutes: 12,
          content: `## Key points
- React Router maps URLs like \`/menu\` and \`/book\` to components, so a single-page React app behaves like a normal multi-page website.
- Use \`Link\` or \`NavLink\` for internal navigation instead of \`<a href>\`, so the page doesn't fully reload.
- A shared layout with \`<Outlet />\` keeps the header and footer consistent across every page.
- Dynamic segments like \`/menu/:itemId\` let one component render many detail pages, read with \`useParams\`.
- Always add a catch-all 404 route; clients and Google both hit broken URLs.

## Transcript
Most client sites aren't one page. Malabar Bites needs Home, Menu, Book a Table and Contact. Each needs its own URL, so customers can share \`malabarbites.in/menu\` on WhatsApp. That's what React Router does.

\`\`\`bash
npm install react-router-dom
\`\`\`

\`\`\`jsx
import { BrowserRouter, Routes, Route, NavLink, Outlet } from "react-router-dom";

function Layout() {
  return (
    <>
      <header>
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/menu">Menu</NavLink>
          <NavLink to="/book">Book a table</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>Fort Kochi · Open 7 AM to 10 PM</footer>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/menu/:itemId" element={<MenuItemPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
\`\`\`

Dekho the structure. \`Layout\` holds the header and footer, and \`<Outlet />\` is the slot where the current page renders. Change the header once, it changes everywhere.

\`NavLink\` is like \`Link\` but adds an \`active\` class to the current page's link, so you can highlight it in CSS. Never use a plain \`<a href="/menu">\` for internal pages — it reloads the whole app and your cart state disappears.

The \`:itemId\` route is dynamic. Inside \`MenuItemPage\`, you call \`useParams()\` to get the id, find the item in your data, and render it. One component, fifty dish pages. If the item doesn't exist, render a friendly "Dish not found" message.

And the star path — that's your 404. Clients mistype links in Instagram bios all the time; a helpful 404 with a link back home keeps visitors from bouncing.

One warning for deployment: on a static host, refreshing \`/menu\` can give a 404, because the server looks for a \`menu\` file. We'll fix that with a rewrite rule in Module 4.`,
        },
        {
          title: "Forms that work: controlled inputs and validation",
          type: "ARTICLE",
          durationMinutes: 12,
          content: `## Controlled inputs

In React, a **controlled input** gets its value from state and updates state on every change. That makes the form's data always available for validation and submission.

## A table booking form

\`\`\`jsx
import { useState } from "react";

const initial = { name: "", phone: "", date: "", guests: "2", notes: "" };

export default function BookingForm() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate(values) {
    const next = {};
    if (values.name.trim().length < 2) next.name = "Please enter your name";
    if (!/^[6-9]\\d{9}$/.test(values.phone)) next.phone = "Enter a 10-digit Indian mobile number";
    if (!values.date) next.date = "Pick a date";
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    try {
      const res = await fetch("https://formspree.io/f/your-form-id", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("sent");
      setForm(initial);
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") return <p role="status">Thank you! We'll confirm on WhatsApp shortly.</p>;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="name">Name</label>
      <input id="name" name="name" value={form.name} onChange={handleChange} />
      {errors.name && <p className="error">{errors.name}</p>}

      <label htmlFor="phone">Mobile</label>
      <input id="phone" name="phone" type="tel" inputMode="numeric" value={form.phone} onChange={handleChange} />
      {errors.phone && <p className="error">{errors.phone}</p>}

      <label htmlFor="date">Date</label>
      <input id="date" name="date" type="date" value={form.date} onChange={handleChange} />
      {errors.date && <p className="error">{errors.date}</p>}

      <label htmlFor="guests">Guests</label>
      <select id="guests" name="guests" value={form.guests} onChange={handleChange}>
        {["1", "2", "3", "4", "5", "6+"].map((g) => <option key={g}>{g}</option>)}
      </select>

      <button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Request booking"}
      </button>
      {status === "error" && <p className="error">Something went wrong. Please call us at +91 98470 12345.</p>}
    </form>
  );
}
\`\`\`

## What makes this production-ready

- **One \`handleChange\` for all fields** using the input's \`name\` and a computed key \`[name]\`. Add a field without adding a handler.
- **Validation on submit** with clear, human error messages next to the field — not a generic alert.
- **\`noValidate\`** turns off the browser's default popups so your own messages show consistently.
- **A status machine** (\`idle → sending → sent/error\`) prevents double submissions and gives feedback.
- **\`inputMode="numeric"\`** shows the number pad on phones.
- **A fallback** in the error message. If the service is down, the client still gets the booking by phone.

## When forms get big

For long forms (multi-step onboarding, admission forms for a coaching institute), use **React Hook Form** with **Zod** for schema validation. It reduces re-renders and boilerplate. For a booking form like this, plain state is perfectly fine and easier for the next developer to read.

> **Tip:** Never trust client-side validation alone for anything that matters (payments, accounts). It improves UX; the server must validate again.`,
        },
        {
          title: "Fetching data: loading, error and empty states",
          type: "ARTICLE",
          durationMinutes: 11,
          content: `## Real sites read live data

The café owner wants to update today's specials without calling you. A common, cheap solution for small Indian businesses: a **Google Sheet** published as JSON through a free service like SheetDB or opensheet, or a headless CMS like Sanity or Strapi. Either way, your React app fetches JSON from a URL.

## The three states every fetch needs

Every request is **loading**, then either **success** or **error**. And success might be **empty**. Clients judge your work by these moments, especially on slow mobile networks.

\`\`\`jsx
import { useEffect, useState } from "react";

const SPECIALS_URL = import.meta.env.VITE_SPECIALS_URL;

export default function TodaysSpecials() {
  const [specials, setSpecials] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | success | error

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(SPECIALS_URL, { signal: controller.signal });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        setSpecials(data);
        setStatus("success");
      } catch (err) {
        if (err.name !== "AbortError") setStatus("error");
      }
    }

    load();
    return () => controller.abort();
  }, []);

  if (status === "loading") return <p aria-busy="true">Loading today's specials...</p>;
  if (status === "error") return <p>Couldn't load specials. Ask our staff — they're delicious anyway!</p>;
  if (specials.length === 0) return <p>No specials today. Check out the full menu.</p>;

  return (
    <ul className="specials">
      {specials.map((s) => (
        <li key={s.id}>
          {s.name} — {"₹" + s.price}
        </li>
      ))}
    </ul>
  );
}
\`\`\`

## Details that matter

- **\`res.ok\` check**: \`fetch\` does **not** throw on 404 or 500. You must check the status yourself.
- **\`AbortController\`**: cancels the request if the user navigates away, so you don't set state on an unmounted component. It also handles Strict Mode's double-run cleanly.
- **Environment variables**: \`import.meta.env.VITE_SPECIALS_URL\` keeps the URL out of your code. In Vite, only variables prefixed with \`VITE_\` are exposed to the browser — which also means **never put secret keys there**. Anything in the frontend bundle is public.
- **Skeletons over spinners**: grey placeholder cards in the shape of the content feel faster than a spinner.

## When to reach for a library

If your app fetches from many endpoints, refetches on focus, paginates or caches, use **TanStack Query** (React Query). It handles caching, retries and loading states for you:

\`\`\`jsx
const { data, isLoading, isError } = useQuery({
  queryKey: ["specials"],
  queryFn: () => fetch(SPECIALS_URL).then((r) => r.json()),
});
\`\`\`

For a café site with one or two fetches, the hand-written version above is fine and has no extra dependency.

## Testing on slow networks

In Chrome DevTools → Network, set throttling to **Slow 4G** and reload. Watch for layout jumps and blank screens. Then set it to **Offline** and confirm your error state is friendly.

> **Tip:** Show the client the loading and error states in your demo. It signals that you've thought about their customers on patchy networks — and it heads off the "the site was blank for a second" complaint before it happens.`,
        },
        {
          title: "Quiz: Routing, forms & data fetching",
          type: "QUIZ",
          durationMinutes: 7,
          content: `Five scenario questions drawn from real bugs in client React projects.`,
          quiz: {
            questions: [
              {
                prompt: "A customer adds items to the cart, then clicks a header link written as <a href=\"/menu\">Menu</a>. The cart empties. Why?",
                options: [
                  "React Router does not support the /menu path",
                  "A plain anchor triggers a full page reload, resetting in-memory React state",
                  "The cart component was not wrapped in Outlet",
                  "useState only works on the home page",
                ],
                correct: 1,
                explanation: "Internal navigation should use Link or NavLink, which change the URL without reloading the app. A full reload discards state that is not persisted.",
              },
              {
                prompt: "Your fetch to an API returns a 500 error, but the catch block never runs. What is happening?",
                options: [
                  "fetch only rejects on network failures; you must check res.ok and throw yourself",
                  "500 errors are cached by the browser",
                  "async functions cannot catch errors",
                  "The AbortController swallowed the error",
                ],
                correct: 0,
                explanation: "fetch resolves successfully for HTTP error statuses. Check res.ok (or res.status) and handle errors explicitly.",
              },
              {
                prompt: "You need to add a Razorpay secret key so the frontend can create orders. Where should it go?",
                options: [
                  "In a VITE_RAZORPAY_SECRET environment variable",
                  "Hard-coded in a config.js file",
                  "On a server or serverless function, never in the frontend bundle",
                  "In localStorage",
                ],
                correct: 2,
                explanation: "Everything shipped to the browser is public, including VITE_ variables. Secrets belong on a backend; the frontend only uses the public key.",
              },
              {
                prompt: "In a controlled input, what happens if you set value={form.name} but forget the onChange handler?",
                options: [
                  "The input works normally",
                  "The input becomes read-only because React keeps resetting it to the state value",
                  "The form submits automatically",
                  "React converts it to an uncontrolled input silently",
                ],
                correct: 1,
                explanation: "React controls the displayed value from state. Without onChange to update state, typing has no effect, and React warns in the console.",
              },
              {
                prompt: "Which route renders a helpful page for mistyped URLs like /menuu?",
                options: [
                  "<Route path=\"/404\" element={<NotFound />} />",
                  "<Route path=\"*\" element={<NotFound />} />",
                  "<Route index element={<NotFound />} />",
                  "<Route path=\"/\" element={<NotFound />} />",
                ],
                correct: 1,
                explanation: "The * path matches any URL not matched by other routes, making it the catch-all 404.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "Tailwind, Deployment & Pricing Your Project",
      lessons: [
        {
          title: "Tailwind CSS in a React project",
          type: "VIDEO",
          durationMinutes: 13,
          content: `## Key points
- Tailwind CSS gives you small utility classes like \`p-4\`, \`flex\` and \`text-lg\`, so you style directly in JSX without switching to CSS files.
- Responsive design uses prefixes like \`md:\` and \`lg:\`, and Tailwind is mobile-first by default, exactly like the CSS you wrote in Web Foundations.
- Put the client's brand colours and fonts in the Tailwind theme once, then use them everywhere as classes like \`bg-brand\`.
- When class lists repeat, extract a React component rather than writing custom CSS.
- Tailwind removes unused classes at build time, so production CSS stays very small.

## Transcript
Freelancers love Tailwind for one reason: speed. Clients change their minds a lot, and with Tailwind I can restyle a section in minutes without hunting through CSS files. Let me show you how I set it up.

With Tailwind version 4 and Vite, setup is two steps:

\`\`\`bash
npm install tailwindcss @tailwindcss/vite
\`\`\`

Add the plugin in \`vite.config.js\`, then replace your \`index.css\` with this:

\`\`\`css
@import "tailwindcss";

@theme {
  --color-brand: #0f766e;
  --color-brand-dark: #115e59;
  --color-cream: #fdf6ec;
  --font-display: "Poppins", sans-serif;
}
\`\`\`

Dekho, those theme variables become classes automatically — \`bg-brand\`, \`text-brand-dark\`, \`font-display\`. Brand colours in one place, just like CSS variables in the Foundations course.

Now our MenuCard:

\`\`\`jsx
export default function MenuCard({ item, onAdd }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <img src={item.image} alt={item.name} className="h-44 w-full object-cover" loading="lazy" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg font-semibold">{item.name}</h3>
        <p className="text-sm text-gray-600">{item.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-brand-dark">{"₹" + item.price}</span>
          <button
            onClick={() => onAdd(item)}
            className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark focus-visible:outline-2"
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
\`\`\`

Long class lists look scary at first, but read them left to right — flex column, rounded corners, white background, shadow. And \`mt-auto\` pushes the price row to the bottom — the same trick from the Flexbox lesson.

For the grid: \`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3\`. One column on phones, two on small tablets, three on laptops. No media queries written by hand.

Last tip: if you copy the same twenty classes onto five buttons, don't write custom CSS — make a \`Button\` component. In React, the component is your reusable unit.`,
        },
        {
          title: "Deploying React apps on Vercel: env vars, SPA routes and domains",
          type: "ARTICLE",
          durationMinutes: 10,
          content: `## Build first, locally

Before deploying, always run the production build on your machine:

\`\`\`bash
npm run build
npm run preview
\`\`\`

\`build\` creates an optimised \`dist/\` folder. \`preview\` serves it locally. Many bugs — a wrong image path, a missing environment variable — only show up here. Fix them before the client sees anything.

## Deploying to Vercel

1. Push your code to GitHub.
2. On vercel.com, **Add New → Project**, import the repo.
3. Vercel detects **Vite**: build command \`npm run build\`, output directory \`dist\`. Leave these as-is.
4. Under **Environment Variables**, add each \`VITE_\` variable from your local \`.env\` file (for example \`VITE_SPECIALS_URL\`).
5. Click **Deploy**.

Every push to \`main\` now deploys to production, and every other branch gets a preview URL. Send preview links to the client for approval before merging.

## Fix the refresh-404 problem

With React Router, refreshing \`/menu\` asks the server for a file called \`menu\`, which doesn't exist. Tell the host to serve \`index.html\` for every route. On Vercel, add \`vercel.json\` at the project root:

\`\`\`json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
\`\`\`

On Netlify, create \`public/_redirects\` containing:

\`\`\`text
/*    /index.html   200
\`\`\`

Test it: open a deep link like \`/menu/appam-stew\` directly in a new tab on the live site.

## Environment variables, the right way

- Keep a \`.env.example\` in the repo listing variable **names** without values, so the next developer knows what to set.
- Add \`.env\` to \`.gitignore\`.
- Remember that \`VITE_\` variables are baked into the public bundle at build time. If you change one in Vercel, **redeploy** for it to take effect.
- Secrets (payment keys, admin tokens) go into **serverless functions** (a file in an \`api/\` folder on Vercel), never the frontend.

## Custom domain

In the project's **Settings → Domains**, add \`malabarbites.in\` and \`www.malabarbites.in\`. Vercel shows the DNS records; add them in the client's GoDaddy, Hostinger or BigRock panel. HTTPS is automatic.

## SEO for single-page apps

Client-rendered React apps start with a nearly empty HTML file. Google can render JavaScript, but social previews on WhatsApp and LinkedIn often can't. At minimum:

- Set a good \`<title>\`, \`<meta name="description">\` and Open Graph tags (\`og:title\`, \`og:image\`) in \`index.html\`.
- Update \`document.title\` per page.
- If SEO is a core business goal (a blog, a marketplace), recommend **Next.js** or **Astro** to the client instead. Saying this upfront builds trust.

## Pre-launch checklist

- Lighthouse on the live URL: aim for 90+ Performance, Accessibility and SEO on mobile.
- Test deep links, the booking form and the WhatsApp order on a real phone over mobile data.
- Check the console for errors and remove stray \`console.log\` calls.
- Confirm the client owns the domain and has access to the Vercel team.`,
        },
        {
          title: "Pricing a React project for an Indian client",
          type: "ARTICLE",
          durationMinutes: 12,
          content: `## Price the outcome, not the technology

Clients don't buy "React". The café owner buys **more orders and fewer phone calls**. A Pune startup buys **a working MVP before their investor demo**. Start every pricing conversation by understanding that outcome — it decides how much the project is worth to them.

## Step 1: Scope in writing

Break the project into features and estimate hours honestly. For Malabar Bites:

- Design adaptation and component setup — 8 hours
- Home, Menu, Contact pages with routing — 10 hours
- Filterable menu and cart with WhatsApp checkout — 12 hours
- Booking form with validation and email delivery — 6 hours
- Google Sheet-powered specials with loading/error states — 6 hours
- Tailwind polish and responsive QA on real devices — 8 hours
- Deployment, domain, SEO basics and handoff docs — 5 hours

That's about **55 hours**. Add a **20-25% buffer** for feedback rounds and surprises: roughly **68 hours**.

## Step 2: Know your hourly floor

As a beginner-to-intermediate React freelancer in India, ₹400-₹800 per hour is a realistic range; experienced developers charge ₹1,500+ per hour. At ₹600/hour, 68 hours is about **₹40,800**. Round it to a clean number.

## Step 3: Offer three packages

Indian clients almost always negotiate. Packages let them choose instead of bargaining your one price down.

- **Basic — ₹28,000**: Home, Menu with filters, Contact, WhatsApp button, deployment. 1 revision round.
- **Standard — ₹42,000** (recommended): Everything in Basic, plus cart with WhatsApp checkout, booking form and Google Sheet specials. 2 revision rounds.
- **Premium — ₹65,000**: Everything in Standard, plus Razorpay online payments, an admin view for orders and 1 month of support.

Most clients pick the middle option. Make it the one you actually want to build.

## Step 4: Payment terms

- **40% advance** to start, **30%** at the design/demo milestone, **30%** before final handoff and domain switch.
- Accept UPI, bank transfer or a Razorpay payment link. Send a proper invoice every time.
- If you're GST-registered, add 18% GST and say so in the quote. If you're not, state that prices are without GST.

## Step 5: Protect yourself from scope creep

Write these into the quote:

- **Revision rounds** included, and the rate for extra changes (for example ₹800/hour).
- **What's out of scope**: content writing, photography, paid plugins, third-party fees like domain and Razorpay charges.
- **Timeline** that depends on the client sending content on time.

> **Tip:** When a client asks "just one small change" after sign-off, reply warmly: "Happy to! That's outside the current scope — it'll take about 3 hours, so ₹2,400. Shall I add it?" Most clients respect a clear, friendly boundary.

## Step 6: Recurring income

Offer a **maintenance retainer**: ₹3,000-₹8,000 per month for updates, upgrades and small content changes. Five retainers can cover a student's monthly expenses.

Send every quote as a clean PDF with your portfolio link. That alone beats most competing quotes on Instagram and Internshala.`,
        },
        {
          title: "Capstone: Ship a client-ready React site and quote",
          type: "ASSIGNMENT",
          durationMinutes: 90,
          content: `This is the project you'll show to your next client. A deployed, polished React site plus a professional quote proves both halves of freelancing: you can build it, and you can sell it. Students who finish this capstone typically use it as their lead portfolio piece.`,
          assignment: {
            brief: `## Your task

Complete the **Malabar Bites** site (or a real local business of your choice — a Pune bakery, a Jaipur boutique, a Kochi homestay) and prepare a client quote for it.

## Build requirements

1. **Routing**: at least 4 routes with a shared layout, active nav links and a 404 page.
2. **Components & state**: menu/catalogue with filters and a cart (from Module 2).
3. **Form**: a validated booking or enquiry form with sending, success and error states.
4. **Data fetching**: one live data source (Google Sheet JSON, a public API or a CMS) with loading, error and empty states, using an environment variable for the URL.
5. **Tailwind** styling with brand colours in the theme; mobile-first and polished at 360px.
6. **Deployment on Vercel** (or Netlify) with deep links working on refresh.

## Business requirements

7. A **quote document** (PDF or Google Doc link) with: outcome summary, feature list with hour estimates, three packages in ₹, payment terms, revision policy and out-of-scope items.
8. A **README** with the live URL, setup steps, \`.env.example\` and a short handoff section.

## Deliverable

Submit **one link**: your GitHub repository. The README must link to the live site and to your quote document.

## Tips

- Run Lighthouse on mobile and include the scores in your README.
- Record a 60-second Loom walkthrough of the site — clients love it, and so do reviewers.
- Price realistically. A quote that is too low signals inexperience just as much as one that is too high.`,
            rubric: [
              { criterion: "Functionality: routing, cart, form and data fetching all work on the live site", points: 35 },
              { criterion: "Code quality: clean components, correct state and effects, env vars handled safely", points: 20 },
              { criterion: "UI and responsiveness: Tailwind polish, mobile-first, accessible controls", points: 20 },
              { criterion: "Quote quality: clear scope, realistic ₹ pricing, packages, payment and revision terms", points: 25 },
            ],
            submissionType: "LINK",
          },
        },
      ],
    },
  ],
};

export default [webFoundations, reactForFreelancers];
