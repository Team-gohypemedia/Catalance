/** UI/UX Design courses — seed content for the Campus demo. */
export default [
  {
    slug: "figma-ui-design",
    title: "UI Design in Figma: From Wireframe to Hi-fi",
    subtitle: "Learn the fundamentals, master Figma, and ship a real client-ready app design.",
    description:
      "Start from zero and design a complete booking app for a Kochi homestay, the kind of project freelance clients actually hire for. You'll learn why some screens feel calm and trustworthy while others feel messy, then build that instinct into real Figma skills: auto layout, components, styles and prototypes. By the end you'll know how to hand off files developers love and present your work to a client with confidence.",
    level: "BEGINNER",
    languages: ["en", "hinglish", "ta"],
    cover: { from: "#7C3AED", to: "#EC4899", pattern: "rings" },
    mentorId: "u_mentor",
    priceINR: 0,
    rating: 4.8,
    ratingsCount: 3412,
    studentsCount: 21870,
    createdDaysAgo: 164,
    skills: ["Visual hierarchy", "Typography", "Color systems", "Figma auto layout", "Components & variants", "Prototyping", "Developer handoff"],
    whatYouBuild: [
      "A reusable button and card component set with variants in Figma",
      "Low-fi wireframes for a 4-screen homestay booking flow",
      "A mini design system with color, type and spacing styles",
      "Hi-fi, clickable prototype of a Kochi homestay booking app",
      "A client presentation deck walking through your design decisions",
    ],
    requirements: [
      "A laptop with a modern browser (Figma runs in Chrome, no install needed)",
      "A free Figma account (the Education plan is free with your college email)",
      "No design background needed, just curiosity and a willingness to practise",
    ],
    modules: [
      {
        title: "Design Fundamentals That Make Screens Feel Right",
        lessons: [
          {
            title: "What clients actually pay a UI designer for",
            type: "VIDEO",
            durationMinutes: 8,
            isPreview: true,
            content: `## Key points
- Clients don't pay for "pretty screens"; they pay for screens that help their customers finish a task, like booking a room or placing an order.
- Good UI rests on four fundamentals: hierarchy, spacing, typography and color. Figma is just the tool you use to apply them.
- Most beginner designs fail because everything looks equally important, not because of a lack of creativity.
- In this course you'll design a real booking app for a Kochi homestay, from rough wireframes to a clickable prototype.
- Your goal by the end: a portfolio-ready project and the confidence to quote for your first ₹15,000 to ₹40,000 freelance UI gig.

## Transcript
Hi everyone, I'm Priya. I've been a product designer for about seven years, first at Swiggy and then as a full-time freelancer working with startups in Bengaluru, Pune and Kochi. Welcome to the course.

Let me start with something nobody told me when I was in college. Clients are not paying you for pretty screens. A homestay owner in Fort Kochi doesn't care if you used a trendy gradient. She cares that a family from Delhi can open her app, see the rooms, pick dates and pay through UPI without calling her five times. If your design makes that happen, you're worth every rupee.

So how do we make screens that work? Dekho, it comes down to four fundamentals. Hierarchy: what should the eye see first? Spacing: how do elements group and breathe? Typography: is the text readable and does it have a clear structure? And color: does it guide action and stay accessible? Almost every bad screen I review breaks one of these four. Usually it's hierarchy, where everything is bold and everything is shouting.

Once those basics click, Figma becomes your workshop. We'll learn frames, auto layout and components properly, not just by clicking around. Then we'll take one real project, a booking app for a homestay called Backwater Nest, all the way from wireframes to hi-fi screens to a prototype you can show a client.

My promise: if you do the assignments, you'll finish with a project you can put in your portfolio and pitch with. Chalo, let's start with hierarchy.`,
          },
          {
            title: "Visual hierarchy: telling the eye where to go",
            type: "ARTICLE",
            durationMinutes: 9,
            isPreview: true,
            content: `## What is visual hierarchy?

Visual hierarchy is the order in which a person notices things on a screen. Every screen has a job, and hierarchy makes sure the most important thing for that job is seen first. On a homestay listing, that's usually the room photo, the price per night and the **Book now** button, not the cancellation policy.

When everything has the same weight, users scan, get confused and leave. When the hierarchy is clear, they don't even notice the design. They just complete the task.

## The tools you use to create hierarchy

### 1. Size
Bigger things get noticed first. Your screen title might be 24px, section headings 18px and body text 14 to 16px. A clear jump between levels matters more than the exact numbers.

### 2. Weight
Bold versus regular text creates contrast without changing size. Use bold sparingly: if five things are bold, nothing is.

### 3. Color and contrast
A saturated primary color on the main button pulls the eye. Secondary actions should be quieter, like an outline or text-only button. Grey text (for example \`#6B7280\` on white) signals "supporting information".

### 4. Position
People scan top to bottom, left to right. Put key information near the top and keep the primary action where thumbs can reach it, usually at the bottom on mobile.

### 5. Space
An element surrounded by empty space feels important. Crowding reduces importance.

## A quick exercise: the squint test

Open any screen you've designed and squint at it, or blur it slightly. What stands out? If the answer isn't the most important element, your hierarchy needs work.

> **Tip:** Write down the "one thing" each screen must achieve before you design it. For a room details screen: "Help the guest decide to book this room." Then rank every element by how much it helps that goal.

## Common beginner mistakes

- **Too many font sizes.** Stick to 4 or 5 sizes across the whole app.
- **Two primary buttons on one screen.** Pick one primary action. "Book now" is primary; "Save to wishlist" is secondary.
- **Bold labels and bold values.** In a price row, make the value (₹2,400 / night) bold, not the label.
- **Decoration competing with content.** Icons, dividers and badges should support content, not fight it.

## Real example

Imagine the Backwater Nest room card. A weak version shows the room name, amenities, rating, price and two buttons all in 14px regular. A strong version leads with a large photo, then the room name at 18px semibold, a muted line of amenities, a bold price, and a single clear button. Same information, completely different experience.

Hierarchy is the foundation for everything else in this course. Spacing, typography and color are all ways of expressing it.`,
          },
          {
            title: "Spacing and the 8-point grid",
            type: "ARTICLE",
            durationMinutes: 8,
            content: `## Why spacing matters so much

Spacing is the most underrated design skill. Two designs can use the same fonts and colors, yet one feels professional and the other feels "college project". Nine times out of ten, the difference is spacing.

Spacing does two jobs: it **groups** related things together and it **separates** unrelated things. This is the Gestalt principle of proximity. If the price sits closer to the room name than to the next card, users instantly understand it belongs to that room.

## The 8-point grid

Instead of picking random values like 13px or 22px, use multiples of 8: **8, 16, 24, 32, 40, 48, 64**. For tight spots, 4px is allowed as a half-step.

Why 8?
- Most screen sizes divide cleanly by 8, so layouts scale well on Android and iOS.
- Developers can map your spacing to tokens easily (\`space-2 = 8px\`, \`space-4 = 16px\`).
- It removes decision fatigue. You choose from a small set instead of guessing.

## A simple spacing scale to start with

- **4px**: icon to its label
- **8px**: between lines of related text, like room name and location
- **16px**: padding inside cards, gap between form fields
- **24px**: between groups inside a section
- **32 to 48px**: between major sections of a screen

> **Rule of thumb:** inner spacing should be smaller than outer spacing. The padding inside a card should be smaller than the gap between cards, otherwise the grouping breaks.

## Margins and layout grids on mobile

For a 360px or 390px wide mobile frame, use **16px side margins** (20px also works). In Figma, add a layout grid to your frame: 4 columns, 16px margin, 16px gutter. This keeps content aligned across every screen.

## How to apply it in Figma

1. Set your nudge amount: in Preferences, change "Big nudge" to 8. Now \`Shift + Arrow\` moves things by 8px.
2. Use auto layout (you'll learn it in Module 2) and set gaps and padding only from your scale.
3. Hold \`Alt\` (or \`Option\` on Mac) while hovering to measure distances between elements.

## Spot the problem

A booking summary screen has 12px between the dates and the guest count, 20px between guest count and price, and 14px padding inside the card. It "feels off" but you can't say why. The fix: 8px between related lines, 24px before the price block, 16px card padding. Consistent, intentional and calm.

Spacing is invisible when it's right. Users just feel the screen is easy to read, and that's exactly what you want.`,
          },
          {
            title: "Typography and color for screens",
            type: "VIDEO",
            durationMinutes: 12,
            content: `## Key points
- Use one typeface (two at most) for an app; a good sans-serif like Inter, Poppins or Manrope covers 95% of projects.
- Build a type scale with 4 to 6 sizes and fixed line heights, for example 12, 14, 16, 20, 24 and 32px.
- Body text on mobile should be at least 14px, ideally 16px, with line height around 1.4 to 1.5 times the size.
- A practical color palette has one primary color, neutrals (greys), and semantic colors for success, warning and error.
- Check contrast: normal text needs a ratio of at least 4.5:1 against its background to meet WCAG AA.
- Use color to signal meaning and action, never as the only way to convey information.

## Transcript
Okay, let's talk about type and color, the two things beginners love to play with and usually overdo.

Typography first. I'll be honest, for most client apps I use one font family. Inter, Manrope or Poppins are free on Google Fonts and work beautifully on screens. Instead of switching fonts, I create contrast using size and weight. My usual mobile scale looks like this: 32 for big display moments, 24 for screen titles, 20 for section headings, 16 for body, 14 for secondary text and 12 for captions and labels. That's it. Six sizes for an entire app.

Line height matters as much as size. Body text at 16px gets a 24px line height. Headings can be tighter, like 24px text on a 32px line. Notice how these are all on our 8-point grid? Not an accident.

Now color. Dekho, the mistake I see in portfolios is a rainbow. Seven bright colors, none of them meaning anything. For Backwater Nest, I'd pick one primary color, maybe a deep backwater teal like #0F766E, which feels calm and Kerala-ish. Then a set of greys for text, borders and backgrounds. Then semantic colors: green for "booking confirmed", amber for "only 2 rooms left", red for errors.

The primary color goes on things people should act on: the main button, selected dates, active tabs. If you also put it on random headings and icons, it stops meaning "tap here".

And please, check contrast. Light grey text on white might look elegant on your 27-inch monitor, but a guest checking the app on a budget phone in bright sunlight won't be able to read it. Use a contrast checker plugin in Figma and aim for 4.5:1 for normal text.

One more thing: never use color alone. An error field should have red color plus an icon and a message, because some users are colour-blind. Next up, a quick quiz to lock this in.`,
          },
          {
            title: "Quiz: Design fundamentals",
            type: "QUIZ",
            durationMinutes: 6,
            content: `Let's check that hierarchy, spacing, type and color have really clicked. These questions are based on real situations you'll face on client projects.`,
            quiz: {
              questions: [
                {
                  prompt: "A room details screen has a 'Book now' button and a 'Share with friends' button, both filled with the primary color. What's the best fix?",
                  options: [
                    "Make both buttons bigger so they're easier to tap",
                    "Keep 'Book now' as the filled primary button and make 'Share' a secondary outline or text button",
                    "Change 'Share' to a different bright color so both stand out",
                    "Remove the 'Book now' button and rely on the price to drive bookings",
                  ],
                  correct: 1,
                  explanation: "A screen should have one primary action. Making the secondary action visually quieter keeps the hierarchy clear and pushes users toward the main goal.",
                },
                {
                  prompt: "Inside a room card you use 24px padding, but the gap between cards is 16px. Why does this feel wrong?",
                  options: [
                    "Padding should always be exactly 8px",
                    "Cards should never have a gap between them",
                    "Inner spacing is larger than outer spacing, so the grouping of each card gets weaker",
                    "24px is not on the 8-point grid",
                  ],
                  correct: 2,
                  explanation: "Proximity drives grouping. When the space inside a card is bigger than the space between cards, content visually 'leaks' into neighbouring cards. Inner spacing should be smaller than outer spacing.",
                },
                {
                  prompt: "Which type setup is most suitable for body text in a mobile booking app?",
                  options: [
                    "16px size with a 24px line height",
                    "12px size with a 12px line height",
                    "16px size with a 16px line height",
                    "20px italic with a 40px line height",
                  ],
                  correct: 0,
                  explanation: "16px text with roughly 1.5x line height is comfortable to read on phones and fits the 8-point grid. 12px is too small for body copy and tight line heights hurt readability.",
                },
                {
                  prompt: "A form shows an invalid phone number by turning the field border red, nothing else. What's the main problem?",
                  options: [
                    "Red is not on-brand for a homestay app",
                    "Color is the only signal, so colour-blind users may miss the error and nobody knows how to fix it",
                    "Borders should never change color",
                    "Errors should only be shown after the form is submitted",
                  ],
                  correct: 1,
                  explanation: "Never rely on color alone. Add an icon and a clear message like 'Enter a 10-digit mobile number' so every user understands what went wrong and how to fix it.",
                },
                {
                  prompt: "You squint at your screen and the first thing you notice is a decorative wave illustration, not the price or the button. What does this tell you?",
                  options: [
                    "The illustration is well designed and should stay as is",
                    "You need to add more colors to the button",
                    "The screen needs more content",
                    "Decoration is competing with content, so the hierarchy needs to be rebalanced",
                  ],
                  correct: 3,
                  explanation: "The squint test reveals what dominates visually. If decoration wins over the key information and action, reduce its size, contrast or position so the important elements lead.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "Figma Essentials: Frames, Auto Layout and Components",
        lessons: [
          {
            title: "Figma tour: frames, layers and constraints",
            type: "VIDEO",
            durationMinutes: 11,
            content: `## Key points
- A frame is a container that represents a screen or a section; always design inside frames, not on the bare canvas.
- Use the right preset size for your target device, for example Android Compact (360 x 800) or iPhone 14 (390 x 844).
- Name your layers and frames clearly, like "Room details / Default", because messy files cost time and look unprofessional to clients.
- Constraints decide how a child element behaves when its parent frame resizes, such as sticking a button to the bottom.
- Pages help organise a file: keep separate pages for wireframes, UI, components and handoff.

## Transcript
Chalo, let's open Figma. If you haven't yet, sign up with your college email and apply for the Education plan. It's free and gives you everything we need.

The first thing to understand is the frame. Press F, and on the right you'll see device presets. For Backwater Nest, most guests will be on Android, so I'll pick Android Compact, which is 360 by 800. A frame is like a sheet of paper for one screen. Anything you put inside it becomes its child and shows up nested in the layers panel on the left.

Why does this matter? Because beginners often draw rectangles directly on the canvas and group them with Ctrl+G. Groups are dumb containers, they just wrap things. Frames are smarter. They can clip content, have their own fill and corner radius, hold layout grids, and later, auto layout. My rule: if it's a screen or a meaningful block, make it a frame.

Next, naming. Double-click a layer and rename it. I know it's boring, but when a developer opens your file and sees "Rectangle 247" and "Frame 1093", they lose trust immediately. Name screens with a pattern like "02 Room details" and layers by role, like "Price row" or "CTA".

Now constraints. Select the "Book now" button inside your frame. On the right panel, set the vertical constraint to Bottom and horizontal to Left and Right. Now resize the frame to a taller phone. See how the button stays pinned to the bottom and stretches? That's how real apps behave.

Finally, pages. At the top left, create pages called Wireframes, UI, Components and Handoff. Your future self, and your client, will thank you. In the next lesson we'll tackle the most important Figma feature of all: auto layout.`,
          },
          {
            title: "Auto layout, explained properly",
            type: "ARTICLE",
            durationMinutes: 10,
            content: `## What auto layout does

Auto layout turns a frame into a flexible container that arranges its children automatically, like CSS flexbox. Instead of manually nudging every element when the text changes, the frame grows, shrinks and re-spaces itself.

If a client says "change 'Book' to 'Book this room'", a manually drawn button breaks. An auto layout button simply gets wider. This is why every professional Figma file uses auto layout everywhere.

## Creating auto layout

Select one or more layers and press \`Shift + A\`. Figma wraps them in a frame with auto layout. In the right panel you now control:

- **Direction**: vertical (stacked) or horizontal (side by side), or wrap
- **Gap**: the space between children, for example 8 or 16
- **Padding**: space between the frame's edge and its children
- **Alignment**: where children sit, like top left or center

> **Tip:** Only use values from your spacing scale (4, 8, 16, 24, 32). Auto layout makes it easy to stay consistent.

## Resizing: hug, fill and fixed

This is where most beginners get stuck, so read slowly.

- **Hug contents**: the frame is exactly as big as its children plus padding. Perfect for buttons and tags.
- **Fill container**: the element stretches to take available space in its parent. Perfect for a full-width button or a text block in a card.
- **Fixed**: a set width or height that doesn't change. Use for icons, avatars and screen frames.

A typical room card: the card itself is **Fill** width inside the screen, its padding is 16, its text column is **Fill** so long room names wrap, and the "₹2,400 / night" tag is **Hug**.

## Nesting: auto layout inside auto layout

Real UI is built by nesting. Here's the room card structure for Backwater Nest:

\`\`\`text
Room card (vertical, gap 12, padding 16)
  Photo (fill width, fixed height 180)
  Info (vertical, gap 4)
    Room name
    Location row (horizontal, gap 4)
      Pin icon
      "Fort Kochi, 1.2 km from beach"
  Footer (horizontal, space between)
    Price
    Book button (horizontal, padding 12 x 20, hug)
\`\`\`

Once you can read and build a structure like this, you can build almost any screen.

## Handy shortcuts and tricks

- \`Shift + A\` adds auto layout; \`Ctrl + Alt + G\` (\`Cmd + Option + G\` on Mac) wraps a selection in a plain frame.
- Set gap to **Auto** for "space between" layouts, like price on the left and button on the right.
- Use **absolute position** for a badge that overlaps a photo corner without breaking the flow.
- Toggle **Canvas stacking** when you need overlapping avatars.
- Hide a layer and auto layout closes the gap. Great for optional elements like a "Free breakfast" tag.

## Why developers love it

Auto layout maps closely to how developers build interfaces with flexbox. Gap, padding and alignment translate almost one to one into code, so your designs get built exactly as intended.`,
          },
          {
            title: "Components, variants and properties",
            type: "VIDEO",
            durationMinutes: 13,
            content: `## Key points
- A component is a reusable master element; every copy you place is an instance that updates when the master changes.
- Create a component with Ctrl+Alt+K (Cmd+Option+K on Mac) and keep all masters on a dedicated Components page.
- Variants group related versions of a component, like a button's Primary, Secondary and Disabled states, into one set.
- Component properties (text, boolean and instance swap) let you change labels, show or hide icons, and swap icons without detaching.
- Never detach instances to make small edits; add a property or variant instead so the system stays consistent.

## Transcript
This lesson is the one that changed how fast I work. Components.

Imagine Backwater Nest has a "Book now" button on six screens. The client calls and says, "Priya, can we make the buttons a bit rounder?" Without components, you'd edit six buttons by hand and probably miss one. With components, you edit the master once and every instance updates. That's the whole idea.

Let's build one. Take the auto layout button from the last lesson, select it and press Ctrl+Alt+K. The icon turns into a four-diamond shape. That's your main component. Move it to the Components page. Now when you copy it into a screen, you get an instance, shown with a hollow diamond.

Next, variants. A button isn't one thing. It has types, Primary, Secondary and Ghost, and states, Default, Pressed and Disabled. Select your main component and click "Add variant". Figma creates a component set with a purple dashed border. Rename the properties to "Type" and "State", and design each combination. Now on any instance, you can switch from Primary to Secondary from a dropdown on the right. Beautiful, right?

Then properties. Add a text property called "Label" so you can change "Book now" to "Check availability" from the panel. Add a boolean property called "Show icon" so the leading icon can be turned on and off. And an instance swap property so you can change the icon itself.

One rule I'm strict about: don't detach instances. When you detach, the link to the master breaks and your system slowly falls apart. If you need something new, add a variant or property.

In the assignment, you'll build a button set and a room card component for Backwater Nest. Take your time, this is the foundation for everything we do in Module 3.`,
          },
          {
            title: "Assignment: Build a button and room card component set",
            type: "ASSIGNMENT",
            durationMinutes: 60,
            content: `On real client projects, you rarely design a screen from scratch. You assemble it from components. Freelancers who show a clean, well-structured component set in their files get repeat work, because their designs are faster to change and easier for developers to build.`,
            assignment: {
              brief: `## Your task

Create a small, reusable component library for the Backwater Nest homestay app in Figma.

## Steps

1. Create a new Figma file called **Backwater Nest - Components** with pages: Components, Playground.
2. **Button component set** with two properties:
   - Type: Primary, Secondary, Ghost
   - State: Default, Pressed, Disabled
   - Add a text property **Label** and a boolean property **Show icon**.
   - Use auto layout with padding 12 x 20, hug width, corner radius 8 or 12.
3. **Room card component** built with nested auto layout:
   - Photo, room name, location row, amenities line, price, and a Button instance.
   - Variants: Default and Sold out (sold out greys the photo and disables the button).
4. On the Playground page, place 3 room card instances with different room names (for example "Kayal View Deluxe", "Coconut Grove Cottage", "Heritage Attic Room") and prices in ₹.
5. Test it: change a long room name and confirm the card text wraps instead of overflowing.

## Deliverable

Share a **view link** to your Figma file (Share > Copy link, set to "Anyone with the link can view").

## Tips

- Name layers properly. Reviewers will open the layers panel.
- Only use spacing from your 8-point scale.
- Don't detach any instances on the Playground page.`,
              rubric: [
                { criterion: "Button component set has correct Type and State variants with working Label and Show icon properties", points: 30 },
                { criterion: "Room card uses nested auto layout with correct hug and fill behaviour (long names wrap cleanly)", points: 30 },
                { criterion: "Consistent spacing on the 8-point grid and clear visual hierarchy within the card", points: 20 },
                { criterion: "File hygiene: named layers, organised pages, no detached instances", points: 20 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
      {
        title: "Wireframe to Hi-fi: The Kochi Homestay Booking App",
        lessons: [
          {
            title: "The brief: Backwater Nest and its users",
            type: "ARTICLE",
            durationMinutes: 8,
            content: `## Meet the client

**Backwater Nest** is a 6-room family-run homestay near Fort Kochi, Kerala, owned by Anna Mathew. Right now, bookings come through phone calls, WhatsApp messages and a listing on a big travel site that takes a hefty commission. Anna wants a simple mobile app (and later a website) where guests can browse rooms, check availability, and pay a booking advance via UPI or card through Razorpay.

Her budget for design is ₹35,000, and she wants to show the prototype to a developer in two weeks.

## Who are the users?

Before opening Figma, a good designer asks: who will use this, and what are they trying to do?

### Primary user: the domestic family traveller
- Booking a 3 to 4 night trip from Bengaluru, Chennai or Delhi
- Compares photos and price per night carefully
- Wants to know: is breakfast included, is it safe for kids, how far is the beach
- Prefers paying through UPI

### Secondary user: the solo or couple backpacker
- Often foreign or young Indian travellers
- Cares about location, Wi-Fi and reviews
- Books last minute, sometimes the same day

### Admin user: Anna herself
- Needs to see upcoming bookings and block dates. We'll keep this out of scope for the first version.

## Defining the core flow

For version one, we focus on a single happy path:

1. **Home**: search by dates and guests, see featured rooms
2. **Room listing**: browse all available rooms for those dates
3. **Room details**: photos, amenities, house rules, price breakdown
4. **Booking summary and payment**: guest details, advance amount, pay with UPI
5. **Confirmation**: booking ID, check-in instructions, WhatsApp contact

> **Tip:** Write the flow as a list before drawing anything. If you can't describe the flow in five steps, the design will be confused too.

## Constraints that shape the design

- **Budget phones and patchy networks.** Many guests travel through areas with weak signal, so screens must be light and clear even before images load.
- **Trust.** A small homestay has no big brand behind it. Real photos, reviews, a clear cancellation policy and visible contact options build trust.
- **Language.** Keep copy simple English; avoid jargon like "inventory" or "SKU".
- **Payment.** Show the advance amount and balance clearly, for example "Pay ₹3,000 now, ₹6,600 at check-in".

## Success criteria

Agree on success with the client upfront. For Anna: fewer phone calls asking about availability, and guests completing a booking in under two minutes. Every design decision in this module should help one of those goals.

In the next lesson, we'll turn this flow into rough wireframes, fast.`,
          },
          {
            title: "Low-fi wireframes in 30 minutes",
            type: "VIDEO",
            durationMinutes: 10,
            content: `## Key points
- Wireframes are for thinking about structure and flow, not looks, so use greys, boxes and real-ish text only.
- Start on paper or with simple Figma rectangles; speed matters more than polish at this stage.
- Use real content wherever possible, like actual room names and ₹ prices, because placeholder text hides layout problems.
- Wireframe all five screens of the flow before refining any single screen.
- Share wireframes with the client early so you catch wrong assumptions before investing hours in hi-fi.

## Transcript
Okay, time to wireframe Backwater Nest. Set a timer for 30 minutes. Seriously. The timer stops you from obsessing over one screen.

I usually start on paper. Five rectangles for five screens, a pen, and I sketch the flow from Home to Confirmation. Then I move to Figma on the Wireframes page. Rules for this stage: only greys, one font, no icons except simple boxes, no images, just a grey box with an X through it.

Let's do the Home screen. At the top, a short greeting and the homestay name. Then the most important thing, a search block: check-in date, check-out date, number of guests, and a "Check availability" button. Below that, two or three featured room cards and a small trust section, like "4.8 rating from 320 guests" and "5 min walk to Fort Kochi beach".

Notice I wrote real text. Not lorem ipsum. Dekho, when you write "Kayal View Deluxe Room with Balcony", you immediately see that the title wraps to two lines on a 360px screen. With lorem ipsum you'd never notice that until the developer complains.

Room details: big photo area at the top, room name, a quick facts row like "2 adults, 1 child, AC, Breakfast included", amenities, house rules, cancellation policy, and a sticky bottom bar with total price and a "Book now" button.

For booking summary, keep it boring and clear. Dates, guests, price breakdown, advance to pay now, guest name and phone, and a pay button. Boring is good when money is involved.

Once all five are done, I'd send Anna a quick link and ask two questions: is anything missing, and is anything here wrong for your guests? In my experience, this one message saves at least a day of rework.`,
          },
          {
            title: "Building a mini design system: styles and variables",
            type: "ARTICLE",
            durationMinutes: 10,
            content: `## Why a mini design system?

Before you jump to hi-fi, set up the building blocks. A design system sounds like something only big companies like Swiggy or Razorpay need, but even a 5-screen freelance project benefits from a small one. It keeps every screen consistent and makes client changes take minutes instead of hours.

For Backwater Nest, our mini system has four parts: color, typography, spacing and components.

## 1. Color variables

In Figma, open the **Local variables** panel and create a collection called **Color**. Separate raw colors (primitives) from how they're used (tokens):

\`\`\`text
Primitives
  teal/700   #0F766E
  teal/50    #F0FDFA
  sand/100   #FEF3C7
  grey/900   #111827
  grey/500   #6B7280
  grey/200   #E5E7EB
  red/600    #DC2626
  green/600  #16A34A

Tokens
  bg/default        -> white
  bg/subtle         -> teal/50
  text/primary      -> grey/900
  text/secondary    -> grey/500
  border/default    -> grey/200
  action/primary    -> teal/700
  feedback/error    -> red/600
  feedback/success  -> green/600
\`\`\`

Always apply **tokens** in your designs, not primitives. If Anna later wants a deeper teal, you change one primitive and every button updates. Tokens also make a dark mode possible later.

## 2. Text styles

Create text styles that match your type scale. Name them by role, not size:

- **Display**: 32 / 40, Bold
- **Title**: 24 / 32, Semibold
- **Heading**: 20 / 28, Semibold
- **Body**: 16 / 24, Regular
- **Body small**: 14 / 20, Regular
- **Caption**: 12 / 16, Medium

The format "16 / 24" means 16px size with a 24px line height.

## 3. Spacing and radius variables

Create a **Number** variable collection with spacing (4, 8, 12, 16, 24, 32, 48) and radius (8 for inputs and buttons, 16 for cards). Bind these to your auto layout gaps and padding. Developers can then read exact values in Dev Mode.

## 4. Update your components

Go back to your button and room card from Module 2 and replace hard-coded values with your variables and text styles. Now your components and your system are connected.

> **Tip:** Keep a "Foundations" page in your file showing the palette, type styles and spacing scale. Clients love seeing this; it makes your work look thoughtful and professional, and it helps justify your fee.

## A note on brand feel

Backwater Nest should feel calm, local and trustworthy. That's why we picked a backwater teal as the primary color and a warm sand tone for highlights like "Breakfast included". Your system is not just technical, it carries the brand personality across every screen.`,
          },
          {
            title: "From wireframe to hi-fi, screen by screen",
            type: "VIDEO",
            durationMinutes: 14,
            content: `## Key points
- Duplicate your wireframes onto the UI page and upgrade them step by step instead of starting from a blank frame.
- Apply the fundamentals in order: hierarchy first, then spacing, then type styles, then color, then imagery.
- Use real, high-quality photos (from the client or free sources like Unsplash) because photos sell a homestay more than any UI detail.
- Design the important states, not just the happy path: empty results, loading, sold-out rooms and payment failure.
- Review every screen against the brief's success criteria before calling it done.

## Transcript
This is the fun part. Let's take our grey wireframes and make them hi-fi.

First, I duplicate the five wireframes onto the UI page. I never start hi-fi from a blank canvas, because the structure decisions are already made. Now I upgrade in layers.

Layer one is hierarchy. On Home, I ask: what's the hero? It's the search block. So I give it a white card with a soft shadow sitting over a beautiful photo of the backwaters. The "Check availability" button becomes my Primary button instance.

Layer two is spacing. I wrap everything in auto layout, 16px side margins, 24px between sections, 16px card padding. Instantly it looks calmer.

Layer three, type. I apply the text styles: Title for "Find your stay in Fort Kochi", Body small in text secondary for helper lines.

Layer four, color. I apply tokens. Teal only on the primary actions and selected dates. Sand for the "Breakfast included" tag. Everything else is neutral.

Layer five is imagery. Ask your client for real photos. Real rooms, real verandah, real breakfast appam and stew. For practice, Unsplash is fine. Use the same corner radius on all images.

Now the part most students skip: states. What happens when no rooms are available for the selected dates? Design that empty state with a friendly message and a suggestion like "Try 14 to 17 Dec instead". What about a sold-out room card? We already have that variant. Payment failed? A clear message, the amount, and a "Try again with UPI" button. Clients notice when you've thought about these, and developers really notice.

Finally, I put the brief next to my screens and check: can a guest book in under two minutes? Is the advance amount crystal clear? Is there a visible WhatsApp contact for trust? If yes, we're ready for the assignment.`,
          },
          {
            title: "Assignment: Design the hi-fi booking flow",
            type: "ASSIGNMENT",
            durationMinutes: 90,
            content: `This is your portfolio centrepiece. A complete, consistent booking flow built on a design system is exactly what clients and hiring managers look for, because it proves you can take a real brief from rough idea to polished, buildable screens.`,
            assignment: {
              brief: `## Your task

Design the hi-fi mobile booking flow for **Backwater Nest**, the Kochi homestay from the brief.

## Screens required (360 x 800 or 390 x 844)

1. Home with date and guest search
2. Room listing for selected dates
3. Room details with photos, amenities, house rules and a sticky "Book now" bar
4. Booking summary and payment (advance via UPI shown clearly, for example "Pay ₹3,000 now")
5. Booking confirmation with booking ID and WhatsApp contact

Plus at least **two edge states**: for example "No rooms for these dates", "Room sold out", or "Payment failed".

## Steps

1. Duplicate your wireframes onto a UI page.
2. Set up the Foundations page: color variables (primitives and tokens), text styles and spacing variables.
3. Build each screen using your components from Module 2, updated with variables.
4. Use real content: room names, ₹ prices, Fort Kochi landmarks, realistic reviews.
5. Run the squint test and a contrast check on every screen.

## Deliverable

A Figma **view link** with pages: Foundations, Wireframes, UI, Components.

## Tips

- Consistency beats creativity here. Same margins, same radius, same button everywhere.
- Add a short sticky note on each screen explaining one design decision. Reviewers love seeing your thinking.`,
              rubric: [
                { criterion: "All 5 screens plus 2 edge states complete, with a logical, easy booking flow", points: 25 },
                { criterion: "Strong visual hierarchy: one clear primary action per screen and readable price/advance information", points: 25 },
                { criterion: "Design system usage: color tokens, text styles, spacing variables and components applied consistently", points: 30 },
                { criterion: "Realistic content and accessibility (contrast, touch targets, no color-only signals)", points: 20 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
      {
        title: "Prototype, Handoff and Presenting to the Client",
        lessons: [
          {
            title: "Prototyping: making your screens clickable",
            type: "VIDEO",
            durationMinutes: 10,
            content: `## Key points
- A prototype lets clients and users experience the flow, which gets you far better feedback than static screens.
- Connect screens in Prototype mode using triggers (On tap, While pressing, After delay) and actions (Navigate to, Open overlay, Back).
- Use Smart Animate between frames with matching layer names for smooth transitions like expanding cards.
- Build interactive components, such as a button with a pressed state, once at the component level so every instance works.
- Set the flow starting point and test the prototype on your phone using the Figma mobile app.

## Transcript
Static screens are great for you, but clients don't think in screens. They think in experiences. "What happens when I tap this?" That's why we prototype.

Switch to the Prototype tab on the right. Select the "Check availability" button on Home, and you'll see a little plus circle. Drag it to the Room listing frame. Figma creates a connection: trigger On tap, action Navigate to, animation Instant. Change the animation to Smart Animate or Move in from right for a natural feel.

Do this for the whole happy path. Room card to Room details. "Book now" to Booking summary. "Pay ₹3,000 now" to Confirmation. On the back arrows, use the Back action so it works from anywhere.

For the date picker, I prefer an overlay. Select the date field, set the action to Open overlay, choose a bottom sheet frame, position it at the bottom and add a background dim. Now it feels like a real app.

Here's a trick: interactive components. Go to your Button component set, select the Default variant and connect it to the Pressed variant with a While pressing trigger. Now every button in your entire file has a pressed effect, automatically. That's the power of components again.

Smart Animate works by matching layer names between frames. If the room photo is called "Room photo" on both the listing and details screens, Figma animates it growing. Name your layers, I keep saying it!

Finally, set a flow starting point on Home, click Present, and then open the Figma app on your phone to test it. Hand it to a friend or your cousin and say "Book a room for this weekend". Don't help them. Just watch where they hesitate. That's free usability testing.`,
          },
          {
            title: "Developer handoff that developers thank you for",
            type: "ARTICLE",
            durationMinutes: 9,
            content: `## Why handoff matters for freelancers

Your design isn't done when it looks good. It's done when it's built correctly. Most freelance disputes I've seen don't come from bad design, they come from confused handoff: "the developer built it differently", "where's the error state?", "which icon file is this?". A clean handoff protects your reputation and gets you referrals.

## The handoff checklist

### 1. Organise the file
- A **Handoff** page with final screens only, in flow order, left to right.
- Mark frames as **Ready for dev** so they show up clearly in Dev Mode.
- Remove experiments, or move them to an Archive page.

### 2. Annotate behaviour
Developers can see sizes, but they can't read your mind. Add short notes for:
- What happens on tap, on error and while loading
- Validation rules, for example "Phone: 10 digits, starts with 6 to 9"
- Sticky elements, like the bottom booking bar
- Content limits, for example "Room name: max 2 lines, then truncate"

### 3. Share tokens, not random values
Because you used variables, Dev Mode shows names like \`action/primary\` and \`space/16\` instead of raw hex codes. You can also hand over a simple token list your developer can drop into CSS:

\`\`\`css
:root {
  --color-action-primary: #0F766E;
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-border-default: #E5E7EB;
  --space-2: 8px;
  --space-4: 16px;
  --space-6: 24px;
  --radius-card: 16px;
}
\`\`\`

Even if the developer uses Flutter or React Native, the same names and values transfer easily.

### 4. Export assets properly
- Icons as **SVG**, photos as **WebP** or JPG at 2x.
- Select a layer, add an export setting in the right panel, and name files clearly like \`ic-location.svg\`.
- Don't export things that can be built in code, like buttons or card backgrounds.

### 5. Include all states
Link the edge states next to each screen: empty, loading, error and sold out. If it's not in the file, assume it won't be built.

> **Tip:** Schedule a 30-minute walkthrough call (Google Meet is fine) with the developer. Share your screen, go through the flow, and record it. That single call prevents dozens of WhatsApp messages later.

## After handoff

Ask for a staging build or APK and do a **design QA** pass. Compare the build with your screens and list issues in a shared doc with screenshots: "Price on room card should be Body/Bold, currently Regular." Be specific and polite. Most freelancers skip this step, which is exactly why doing it makes you stand out.`,
          },
          {
            title: "Presenting your design to the client",
            type: "ARTICLE",
            durationMinutes: 10,
            content: `## Presenting is part of the job

You can design the best screens of your life and still lose the client if you present them badly. A good presentation explains **why** each decision was made, connects it to the client's goals, and makes it easy for them to give useful feedback.

## Structure of a 20-minute client presentation

### 1. Recap the goal (2 minutes)
Start with what you agreed: "Anna, the goal was fewer availability calls and guests booking in under two minutes, with the advance paid through UPI." This frames everything that follows.

### 2. Walk through the user's journey (10 minutes)
Present the prototype as a story, not a list of screens: "Meet Divya, flying in from Bengaluru with her husband and daughter for a long weekend..." Then tap through the flow. Clients connect with people, not with "Screen 3".

### 3. Explain key decisions (5 minutes)
Pick three or four decisions and link each to a goal:
- "The search is the first thing on Home, because availability questions were your biggest time drain."
- "The advance and balance are shown separately, so guests aren't surprised at check-in."
- "A WhatsApp button stays on the details screen, because trust matters for a small homestay."

### 4. Ask for focused feedback (3 minutes)
Avoid "So, do you like it?". Ask specific questions:
- "Is anything in the booking summary missing for your guests?"
- "Does the room information match how you describe rooms on calls?"

## Handling feedback like a professional

- **Listen fully before responding.** Write everything down.
- **Separate problems from solutions.** If Anna says "make the button red", ask "What makes you feel it needs to change?" Maybe the real issue is that it's not noticeable enough.
- **Don't defend every pixel.** Push back only when a change hurts the user, and explain it in terms of her goals.
- **Summarise in writing.** Send a short message after the call listing agreed changes.

> **Tip:** Agree on revision rounds in your proposal, for example "2 rounds of revisions included, additional rounds at ₹2,000 each". This one line protects you from endless changes.

## Pricing and proposals, briefly

For a 5 to 8 screen mobile app design with a prototype and handoff, beginner freelancers in India typically charge ₹15,000 to ₹40,000 depending on complexity. Ask for a 40 to 50 percent advance through UPI or a Razorpay payment link before starting. Mention deliverables clearly: Figma file, prototype link, handoff page and one design QA pass.

## Your presentation deck

Keep it short: the goal, the user journey, three key decisions, the foundations page, and next steps. Five or six slides plus the live prototype is plenty. Confidence comes from preparation, so rehearse once out loud before the call.`,
          },
          {
            title: "Quiz: Prototyping, handoff and client work",
            type: "QUIZ",
            durationMinutes: 6,
            content: `A quick check on the last mile of a design project: prototyping, developer handoff and working with clients.`,
            quiz: {
              questions: [
                {
                  prompt: "You set up Smart Animate between the room listing and room details screens, but the photo just fades instead of growing. What's the most likely cause?",
                  options: [
                    "Smart Animate only works on desktop prototypes",
                    "The photo layers have different names on the two frames",
                    "The photo needs to be exported as SVG",
                    "The trigger must be While pressing instead of On tap",
                  ],
                  correct: 1,
                  explanation: "Smart Animate matches layers by name (and hierarchy) across frames. If the names differ, Figma can't pair them, so it falls back to a dissolve.",
                },
                {
                  prompt: "You want every button in the file to show a pressed effect in the prototype. What's the most efficient approach?",
                  options: [
                    "Add a prototype connection to each button instance on every screen",
                    "Create a separate pressed-state screen for each tap",
                    "Detach all buttons and animate them manually",
                    "Connect the Default and Pressed variants inside the component set using a While pressing trigger",
                  ],
                  correct: 3,
                  explanation: "Interactive components let you define the interaction once in the component set, and every instance inherits it automatically.",
                },
                {
                  prompt: "Which of these should usually NOT be exported as an image asset for developers?",
                  options: [
                    "The primary button and card backgrounds",
                    "Custom icons as SVG",
                    "Room photos at 2x",
                    "The homestay logo",
                  ],
                  correct: 0,
                  explanation: "Buttons and card backgrounds are built in code with colors, radius and padding. Exporting them as images makes the app heavier and harder to change.",
                },
                {
                  prompt: "During the presentation, the client says 'Make the Book now button bigger and red.' What's the best first response?",
                  options: [
                    "Agree immediately to keep the client happy",
                    "Explain that red is bad design and refuse",
                    "Ask what makes them feel it needs to change, to understand the underlying concern",
                    "Say you'll consider it and quietly ignore the feedback",
                  ],
                  correct: 2,
                  explanation: "Clients often describe solutions rather than problems. Understanding the real concern (for example 'guests don't notice the button') lets you solve it properly, maybe without red.",
                },
                {
                  prompt: "Why include a line like '2 rounds of revisions included, additional rounds at ₹2,000 each' in your proposal?",
                  options: [
                    "It's a legal requirement for freelancers in India",
                    "It sets clear expectations and protects you from unlimited, unpaid changes",
                    "It encourages clients to request more revisions",
                    "It replaces the need for an advance payment",
                  ],
                  correct: 1,
                  explanation: "Defining revision scope upfront keeps the project profitable and avoids awkward conversations later. It's one of the simplest ways to protect your time.",
                },
              ],
            },
          },
          {
            title: "Capstone: Prototype and client presentation",
            type: "ASSIGNMENT",
            durationMinutes: 75,
            content: `This capstone simulates the end of a real freelance project: a working prototype, a developer-ready handoff page and a short presentation. Completing it gives you a full case study to show future clients, not just pretty screens.`,
            assignment: {
              brief: `## Your task

Turn your Backwater Nest hi-fi screens into a complete, client-ready delivery.

## Steps

1. **Prototype** the full happy path from Home to Confirmation:
   - Navigate, Back and Open overlay (for the date picker) actions
   - Interactive pressed state on your Button component
   - At least one Smart Animate transition
2. **Handoff page**:
   - Final screens in flow order, marked Ready for dev
   - Annotations for tap behaviour, validation rules and edge states
   - Export settings on icons (SVG) and photos (2x)
3. **Test it**: ask one friend or family member to "book a room for this weekend" on their phone. Note where they hesitated and fix one issue.
4. **Present**: record a 3 to 5 minute Loom or screen recording presenting to "Anna" (the client): goal, user journey, three key decisions, next steps.

## Deliverable

A single link to a Google Doc or Notion page containing: your Figma prototype link, Figma file link, recording link, and 3 to 4 lines on what you changed after testing.

## Tips

- Tell the user's story in your recording. Avoid "this is screen one, this is screen two".
- Keep the recording under 5 minutes. Clients are busy.`,
              rubric: [
                { criterion: "Prototype covers the full happy path with overlays, interactive components and smooth transitions", points: 30 },
                { criterion: "Handoff page is organised, annotated and includes edge states and correct exports", points: 25 },
                { criterion: "Evidence of user testing and a sensible fix based on what was observed", points: 15 },
                { criterion: "Presentation is clear, story-led and links design decisions to client goals", points: 30 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
    ],
  },
  {
    slug: "ux-case-studies",
    title: "UX Research & Case Studies that Get Hired",
    subtitle: "Run real research, turn it into decisions, and write a case study recruiters actually read.",
    description:
      "Most student portfolios show pretty screens and skip the thinking, which is exactly what hiring managers want to see. In this course you'll run lean user interviews and usability tests on a student budget, synthesise what you learn into clear decisions, and package it all into a tight, honest case study. You'll finish with a published case study and a plan for sharing it on LinkedIn and with startups.",
    level: "INTERMEDIATE",
    languages: ["en", "hinglish", "ta"],
    cover: { from: "#0F766E", to: "#2563EB", pattern: "waves" },
    mentorId: "u_mentor",
    priceINR: 1799,
    rating: 4.7,
    ratingsCount: 846,
    studentsCount: 4312,
    createdDaysAgo: 92,
    skills: ["User interviews", "Usability testing", "Affinity mapping", "Problem statements", "Case study writing", "Portfolio storytelling"],
    whatYouBuild: [
      "An interview guide and notes from 5 real user interviews",
      "An affinity map with prioritised insights and problem statements",
      "A published UX case study on Behance, Notion or your portfolio site",
    ],
    requirements: [
      "Comfort with Figma basics (frames, auto layout, components)",
      "One past design project, even a college or practice project, that you want to strengthen",
      "Access to 5 people you can interview over a call or in person",
    ],
    modules: [
      {
        title: "Research That Is Real, Not Decorative",
        lessons: [
          {
            title: "Why most UX case studies get ignored",
            type: "VIDEO",
            durationMinutes: 7,
            isPreview: true,
            content: `## Key points
- Recruiters spend about a minute on a case study, so the problem and outcome must be clear in the first scroll.
- Fake research, like a persona with a stock photo and invented quotes, is easy to spot and hurts your credibility.
- Hiring managers look for your reasoning: what you learned, what you decided, and what you'd change.
- Small but real research with 5 people beats an impressive-looking process you didn't actually do.

## Transcript
I've reviewed hundreds of portfolios while hiring at startups, and I'll tell you a secret. Most case studies look the same. Double diamond diagram, a persona called "Rahul, 24, loves travel", a stock photo, and then twenty screens. I scroll for thirty seconds and close it.

Why? Because I can't see the person's thinking. I don't know what problem they found, how they found it, or why they designed what they designed.

What makes me stop scrolling? Something real. "I spoke to six home bakers in Jaipur and found that four of them lose orders because WhatsApp messages get buried." Now I'm interested. That's one real insight, from real people, and it changes the design.

So in this course we'll do research that's small, honest and useful. Five interviews. One usability test round. Clear decisions. Then we'll write it up so a recruiter gets it in one minute. Chalo, let's learn how to run interviews that don't just confirm what you already believe.`,
          },
          {
            title: "Running 5 user interviews on a student budget",
            type: "ARTICLE",
            durationMinutes: 7,
            content: `## Why five is enough

For early discovery, five to six interviews with the right people surface most of the major patterns. You don't need a research budget, just a plan.

## Recruit the right people

Interview people who actually do the thing. Designing for home bakers? Find them through Instagram, local WhatsApp groups or your relatives' network. Offer a small thank-you like a ₹200 UPI transfer or a coffee.

## Write a short interview guide

- **Warm-up**: "Tell me about how you started your bakery."
- **Past behaviour**: "Walk me through the last time you took a custom cake order."
- **Pain points**: "What was the most frustrating part of that?"
- **Workarounds**: "How do you handle that today?"

> **Tip:** Ask about what people **did**, not what they **would** do. "Would you use an app for orders?" gets a polite yes. "How did you track last week's orders?" gets the truth.

## During the call

- Record with permission, and take notes too.
- Ask "why?" and "can you show me?" often.
- Stay silent after an answer; people fill silence with honest details.
- Never pitch your solution during the interview.

Write up key quotes and observations within an hour, while it's fresh.`,
          },
          {
            title: "Quiz: Interviewing well",
            type: "QUIZ",
            durationMinutes: 5,
            content: `Three scenario questions to check you can run an unbiased, useful interview.`,
            quiz: {
              questions: [
                {
                  prompt: "Which interview question is most likely to give you reliable insight?",
                  options: [
                    "Would you use an app that manages your cake orders?",
                    "Walk me through the last custom order you received, from the first message to delivery.",
                    "Don't you think WhatsApp is bad for managing orders?",
                    "How much would you pay for an order management app?",
                  ],
                  correct: 1,
                  explanation: "Questions about real past behaviour give concrete, honest answers. Hypothetical, leading or pricing questions mostly produce polite guesses.",
                },
                {
                  prompt: "Midway through an interview, the participant describes a problem your app idea solves. What should you do?",
                  options: [
                    "Show them your prototype immediately",
                    "Tell them your app will fix this",
                    "End the interview since you've validated the idea",
                    "Ask them to tell you more about how they deal with it today",
                  ],
                  correct: 3,
                  explanation: "Pitching biases the rest of the conversation. Digging into current workarounds reveals how painful the problem really is and what any solution must beat.",
                },
                {
                  prompt: "Why is a persona with invented quotes and a stock photo a problem in a case study?",
                  options: [
                    "It signals research wasn't actually done, which reduces trust in all your decisions",
                    "Personas are never used in industry",
                    "Stock photos are too expensive",
                    "Recruiters only want to see final UI",
                  ],
                  correct: 0,
                  explanation: "Hiring managers value evidence-based reasoning. Fabricated research is easy to spot and undermines everything that follows in the case study.",
                },
              ],
            },
          },
        ],
      },
      {
        title: "From Insights to Design Decisions",
        lessons: [
          {
            title: "Affinity mapping and sharp problem statements",
            type: "ARTICLE",
            durationMinutes: 7,
            content: `## Affinity mapping in FigJam

After your interviews, you have pages of notes. Affinity mapping turns them into patterns.

1. Write **one observation per sticky**: a quote, a behaviour or a pain point. Note the participant, like "P3".
2. Put all stickies on a FigJam board without sorting.
3. Group similar stickies silently. Let clusters emerge; don't force categories.
4. Name each cluster as an insight sentence, not a topic. "Orders get lost in long WhatsApp chats" is better than "Communication".
5. Count how many participants appear in each cluster to prioritise.

## Writing problem statements

Turn your top insight into a problem statement:

> **[User]** needs a way to **[need]** because **[insight]**.

Example: "Home bakers in Jaipur need a way to see all confirmed orders for the week in one place, because order details are scattered across WhatsApp chats and they've missed deliveries."

A good problem statement is specific, based on evidence, and doesn't contain the solution. "Needs an app" is not a need.

From here, write two or three "How might we" questions, like "How might we help bakers confirm order details without leaving WhatsApp?" These become the starting point for your design ideas.`,
          },
          {
            title: "Usability testing with five users",
            type: "VIDEO",
            durationMinutes: 9,
            content: `## Key points
- Usability testing checks whether people can complete real tasks with your design, not whether they like it.
- Write tasks as realistic scenarios, like "Your cousin's birthday is Saturday, order a 1kg chocolate cake".
- Ask participants to think aloud, and resist helping them when they get stuck.
- Track simple metrics: task success, time taken and where people hesitated.
- Fix the biggest issues and show the before and after in your case study.

## Transcript
Once you have a prototype, even a rough one, test it. Five users will reveal most of the big usability problems.

Here's how I run it. I share the Figma prototype link on a Google Meet call and ask the person to share their screen. Then I give a scenario, not instructions. I don't say "click on the order button". I say "your cousin's birthday is this Saturday, order a one kg chocolate cake for pickup". Big difference.

I ask them to think aloud. "Just tell me what you're looking at and what you're thinking." And then, the hardest part, I stay quiet. When they get stuck, I count to ten in my head. If they're still stuck, I ask "what are you looking for?" instead of pointing.

I note three things for each task: did they complete it, how long it took, and where they hesitated or said something like "hmm, where is..." Those hesitation moments are gold.

After five sessions, I list issues by how many people hit them. Fix the top two or three, then show the before and after in your case study. Dekho, a before and after with a clear reason is one of the most convincing things you can show a hiring manager.`,
          },
          {
            title: "Assignment: Research synthesis board",
            type: "ASSIGNMENT",
            durationMinutes: 60,
            content: `Clients and product teams don't pay for interviews, they pay for the clarity that comes out of them. A clean synthesis board shows you can turn messy conversations into decisions, which is the core skill behind every senior UX role.`,
            assignment: {
              brief: `## Your task

Run research on a real problem and synthesise it into clear insights.

## Steps

1. Pick a real, local problem space, for example: a Jaipur home bakery taking orders on WhatsApp, students finding PG accommodation in Pune, or a Kochi homestay handling bookings.
2. Interview **5 people** using a guide built on past behaviour (share the guide).
3. In FigJam, create an affinity map with at least 40 stickies, each tagged with a participant code (P1 to P5).
4. Name clusters as insight sentences and rank the top 3 by number of participants.
5. Write **one problem statement** and **three "How might we"** questions.

## Deliverable

A FigJam **view link** with your interview guide, affinity map, top insights and problem statement.

## Tips

- Anonymise participants. Use roles, not full names.
- Include 2 or 3 direct quotes. They make your insights believable.`,
              rubric: [
                { criterion: "Interview guide focuses on past behaviour and avoids leading questions", points: 20 },
                { criterion: "Affinity map is grounded in real observations with participant tags", points: 30 },
                { criterion: "Insights are specific, prioritised and supported by quotes", points: 30 },
                { criterion: "Problem statement and HMW questions are clear and solution-free", points: 20 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
      {
        title: "Writing a Case Study That Gets You Hired",
        lessons: [
          {
            title: "The one-minute case study structure",
            type: "ARTICLE",
            durationMinutes: 8,
            content: `## Write for the skimmer

A recruiter or founder will skim first and read only if hooked. Structure your case study so the first screen answers: what was the problem, what did you do, and what changed?

## A structure that works

1. **Header**: project name, your role, timeline, tools. "UX designer (solo), 3 weeks, Figma and FigJam."
2. **TL;DR**: 3 lines. Problem, approach, outcome. "Home bakers missed orders buried in WhatsApp. I interviewed 5 bakers and tested 2 prototype rounds. Task success for confirming an order rose from 2/5 to 5/5."
3. **The problem**: context and why it matters, with one strong quote.
4. **Research**: what you did and the top 3 insights. Show the affinity map as a cropped image, not the whole board.
5. **Decisions**: 2 or 3 key design decisions, each linked to an insight.
6. **Testing and iteration**: before and after screens with the reason for each change.
7. **Final design**: a few polished screens or a short prototype video.
8. **Reflection**: what you'd do differently and what you'd measure next.

> **Tip:** Be honest about scale. "Tested with 5 users" is respected. Inflated claims like "increased revenue by 300%" on a student project raise red flags.

Keep it under 1,500 words. Every section should earn its place.`,
          },
          {
            title: "Publishing and pitching your case study",
            type: "VIDEO",
            durationMinutes: 10,
            content: `## Key points
- Publish where people can open it in one tap: a Behance project, a Notion page, or your own portfolio site built with Framer.
- Share a LinkedIn post that tells the story in 5 to 6 lines with one striking image and the link in the post.
- Apply to design roles on LinkedIn, Internshala and startup job boards with a short, specific note pointing to the most relevant case study.
- Two strong case studies beat six shallow ones; quality is what gets you shortlisted.

## Transcript
You've written your case study. Now let's get it in front of people.

First, where to publish. Behance is fine and has discovery. Notion is fast and clean. If you want a proper portfolio site, Framer has a free plan and looks great. Whatever you pick, make sure it loads well on mobile, because most recruiters will open your link on their phone.

Second, LinkedIn. Don't just post "Check out my new case study!" Tell the story. Something like: "Jaipur home bakers told me they lose orders in WhatsApp chats. I spent three weeks interviewing and testing to fix that. Here's what I learned." Then one clear before and after image, and the link. Indian design recruiters are very active on LinkedIn, so this works.

Third, applying. On LinkedIn, Internshala, or directly to startups, send a short note: "Hi, I saw you're building a booking product. I recently designed a booking flow for a Kochi homestay and tested it with five users. Here's the case study." Specific beats generic every time.

And remember, two strong case studies are enough to start. Chalo, finish yours and hit publish.`,
          },
          {
            title: "Assignment: Publish your case study",
            type: "ASSIGNMENT",
            durationMinutes: 90,
            content: `A published, well-structured case study is the single most important asset for getting a design internship, a job or a freelance client. This assignment turns your research and design work into something you can send out tomorrow.`,
            assignment: {
              brief: `## Your task

Write and publish a complete UX case study based on your research synthesis from Module 2 (and a design project of your choice).

## Steps

1. Follow the one-minute structure: Header, TL;DR, Problem, Research, Decisions, Testing, Final design, Reflection.
2. Include at least **one before and after** with the reason for the change.
3. Add real quotes and honest numbers (for example "4 of 5 participants").
4. Publish on Behance, Notion or your portfolio site.
5. Draft a LinkedIn post (5 to 6 lines) sharing the story.

## Deliverable

Submit the **public link** to your case study. Paste your LinkedIn post draft at the end of the case study page or in a linked doc.

## Tips

- Read it on your phone before submitting. Fix anything that's hard to read.
- Cut ruthlessly. If a section doesn't support a decision, remove it.`,
              rubric: [
                { criterion: "Clear TL;DR and problem framing that a recruiter understands in under a minute", points: 25 },
                { criterion: "Research insights clearly linked to design decisions", points: 30 },
                { criterion: "Evidence of testing and iteration with a convincing before and after", points: 25 },
                { criterion: "Honest reflection, readable layout and a well-written LinkedIn post", points: 20 },
              ],
              submissionType: "LINK",
            },
          },
        ],
      },
    ],
  },
];
