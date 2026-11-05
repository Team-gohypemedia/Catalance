# Catalance Campus — Build Guide (read fully before writing code)

Campus is a **separate product** inside the Catalance repo: India's learn → earn → get-ranked university for college students
(tech and non-tech). It is its own app and API, but uses **Catalance accounts**: people sign in on the main app, which hands the session to
Campus `/sso` (see `api/README.md`, "Accounts"). Campus data lives in the `campus` schema.
Everything inside `/app/*` and `/admin/*` needs login. Marketing pages and the public passport `/u/:username` are open.

- Frontend: `campus/web` — React 18 + Vite 6 + Tailwind v4 + react-router 7 + TanStack Query 5 + framer-motion + lucide-react + Radix + sonner + recharts + react-markdown.
- Backend: `campus/api` — Express + Prisma (Postgres).
- **API contract: `campus/API_CONTRACT.md` is the single source of truth** for routes and shapes.

## Product pillars (use these in copy and UX)
1. **Learn** — tracks for tech (web, app, UI/UX, data, AI & automation) and non-tech (digital marketing, content writing, graphic design, video editing). Courses taught by working freelancers. Lessons: video, article, quiz, assignment. AI Tutor that speaks the student's language (English, Hinglish, Hindi, Tamil, Telugu, Bengali, Marathi), voice-first.
2. **Earn** — the 5-stage **Earn Ladder**: 1 Learn → 2 Practice → 3 Micro-gig (₹200–₹1,500 tasks under a mentor) → 4 Real project → 5 Hired. Wallet, UPI withdrawals. **Study now, pay later**: courses are free to start; 20% of gig earnings go to course fees until paid.
3. **Get ranked** — monthly **seasons** with divisions (Bronze → Silver → Gold → Platinum → Diamond). Student leaderboard **and college-vs-college leaderboard**. A student from an unknown college who ranks #1 nationally gets noticed. **Proof portfolio**: verified work (assignments reviewed by mentors, approved gigs) instead of PDF certificates. Public **Skill Passport** at `/u/:username` for companies.
4. **Together** — community Q&A (accepted answers earn points), mentors (book 1:1 sessions), cohorts (study groups with a lead mentor).

## Design direction: the Catalance design language (simple, premium, calm)
Campus is part of Catalance and must look like it. Study the reference screenshot of the Catalance home page:
`C:\Users\ravin\AppData\Local\Temp\claude\f--Catalance\ed1ede40-67ea-4f2d-909e-fe13300da2c6\scratchpad\shots\ref\home-light-desktop.png` (and `ref-top/home-light-desktop.png` for the hero up close).
The look is what top product companies ship: **restrained, spacious, confident**. Not a template, not an "AI-generated" landing page.

**Type**
- Inter everywhere.
- Headlines use **`font-medium`** (500), `tracking-tight`, `leading-[1.1]`. Never `font-extrabold`/`font-black`, never `tracking-tighter`. Hero `text-4xl sm:text-6xl lg:text-7xl`; section titles `text-3xl sm:text-5xl`, centered.
- **The Catalance signature**: one short phrase per headline in italic serif brand colour, written `<em className="accent">…</em>` (Instrument Serif italic, `--primary`). Example: `Learn skills that <em className="accent">pay</em>`. Use it once per headline at most.
- Body `text-base sm:text-lg text-muted`, centered under headings, `max-w-2xl mx-auto text-balance`.
- `.eyebrow` = small letter-spaced uppercase label (like "OUR PARTNERS"), optionally flanked by short hairlines.

**Colour**
- Light (default): cream `bg-bg` (#FAF6F0), white `bg-surface` cards with a 1px `border-line`, burnt-orange `primary` (#D9692A).
- Dark: neutral black with Catalance yellow `primary` (#F9D949).
- Charts may use `violet` and `sky`; everything else stays neutral plus primary. `accent` (yellow) only for small highlights.
- **Ink (dark) bands: at most one per page**, and prefer none. No coloured gradient backgrounds, no dotted or grid textures, no glow blobs. One very subtle radial brand glow behind a hero is the maximum.

**Components**
- Cards: `rounded-2xl border border-line bg-surface`, generous padding (`p-6 sm:p-8`), and either no shadow or `shadow-sm`. Hover = border darkens slightly.
- Buttons: primary is solid orange `rounded-lg`. Secondary is `variant="brandOutline"` (orange border, transparent), exactly like Catalance's "Hire an Expert" / "Get Hired" pair.
- Pills: `rounded-full border border-line bg-surface px-4 py-1.5 text-sm`, like Catalance's "22,008+ Projects delivered".
- Navbar: a floating white pill (`rounded-full bg-surface border border-line`) with the active link as an orange pill, like Catalance.
- Icons: lucide, thin, `text-muted` or primary, in plain circles (`rounded-full bg-surface-2`). No multicoloured icon tiles.

**Layout**
- Fewer sections, each with one clear idea, `py-20 sm:py-28`. **A landing page should be 6–8 sections, not 14.**
- Centered section headers. Grids of 3 or 4 equal cards. Lots of whitespace.
- No fake UI collages stacked on top of each other, no rotated cards, no confetti on marketing pages.

**Motion**
- Subtle fade-up on scroll (`whileInView`, once, 0.5s), gentle hover states. Nothing bouncy. Celebrations are fine inside the app (lesson complete, quiz pass) but keep them short and small.

**Copy**
- Real, specific, Indian context (₹ via `formatINR`). **No emojis in UI text** (none in headings, buttons or labels). Short sentences.
- No lorem ipsum, no "John Doe". Avatars use `<Avatar name>`.

**Gamification** (division medals, points, streaks) stays, but is shown quietly: small badges, not giant neon numbers.

**Visual QA is mandatory.** Screenshot your pages with the tool below and look at them. Iterate until they feel like Catalance.
```
# Dev server already running at http://localhost:5180 (demo mode). From bash:
export MSYS_NO_PATHCONV=1
cd "C:/Users/ravin/AppData/Local/Temp/claude/f--Catalance/ed1ede40-67ea-4f2d-909e-fe13300da2c6/scratchpad/shots-tool"
# args: outDir baseUrl token(- for guest | demo.u_student | demo.u_aspirant | demo.u_mentor | demo.u_admin) theme path...
FULL=0 ONLY=desktop node shot.mjs ../shots/<you> http://localhost:5180 - light /       # first viewport
ONLY=desktop node shot.mjs ../shots/<you> http://localhost:5180 demo.u_student light /app   # full page
ONLY=mobile  node shot.mjs ../shots/<you> http://localhost:5180 - light /               # 390px, reports horizontal overflow
```
Then Read the PNG to see it. Check light and dark.
- **Every data view has**: a loading skeleton (`<Skeleton>`), an empty state (`<EmptyState>`) and an error state (`<ErrorState error onRetry>`).
- **Responsive**: works at 375px with no horizontal page scroll. Wide tables scroll inside an `overflow-x-auto` wrapper. Test with mobile-first classes.
- **Accessible**: real `<button>`/`<a>`, labels on inputs, `aria-label` on icon buttons, visible focus.

## Shared building blocks (import, don't re-create)
- `@/components/ui/button` → `Button` (variant: primary | dark | accent | secondary | outline | ghost | danger | link | inkOutline; size: sm | md | lg | xl | icon | iconSm; `to`, `href`, `loading`, `leftIcon`, `rightIcon`)
- `@/components/ui/primitives` → `Card, CardHeader, CardTitle, CardDescription, CardContent, Badge(tone), Input(leftIcon), Textarea, Select, Label, Field(label,hint,error), Skeleton, Spinner, Separator, Kbd`
- `@/components/ui/overlays` → `Dialog, DialogTrigger, DialogContent(title,description,size), DialogClose, DropdownMenu*, Tabs, TabsList, TabsTrigger, TabsContent, Tooltip(content), Popover*, Switch, Progress(value,tone), Avatar(name,src,size)`
- `@/components/ui/campus` → `PageHeader, SectionHeading, StatCard, EmptyState, ErrorState, CourseCover(cover,title,icon), DivisionBadge(division,size,showLabel), StarRating, PointsPill`
- `@/components/brand/Logo` → `Logo, LogoMark`
- `@/lib/utils` → `cn, formatINR, formatCompact, formatNumber, formatDuration, formatDate, timeAgo, initials, DIVISIONS, divisionFor, LANGUAGES`
- `@/lib/api/client` → `api.get/post/put/patch/delete(path, body)`, `qs({...})`, `ApiError`, `IS_DEMO`
- `@/context/AuthContext` → `useAuth()` → `{ user, status, isAuthed, login, signup, adoptToken, logout, setUser, refreshUser }` (`login`/`signup` are demo-mode only; real sign-in goes through Catalance, see `@/lib/catalance`). Call `refreshUser()` after actions that change points, coins or wallet.
- `@/context/ThemeContext` → `useTheme()`
- Icons: `lucide-react`. Toasts: `import { toast } from "sonner"`.
- Layouts already exist: `AppLayout` (sidebar, top bar, mobile bottom nav; it pads the page, so pages don't add outer padding or a container) and `AdminLayout`. Every app page starts with `<PageHeader>`, except immersive pages such as the lesson player.

## Data fetching pattern
```jsx
const { data, isLoading, error, refetch } = useQuery({ queryKey: ["courses", filters], queryFn: () => api.get(`/api/courses${qs(filters)}`) });
const qc = useQueryClient();
const enroll = useMutation({ mutationFn: () => api.post(`/api/courses/${id}/enroll`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["course", id] }); toast.success("You're in!"); }, onError: (e) => toast.error(e.message) });
```

## Demo engine (frontend runs with no backend)
- `src/mocks/router.js` dispatches `api.*` calls to handler tables in `src/mocks/handlers/<domain>.js`:
  `export default { "GET /api/courses/:id": ({ params, query, body, user, db }) => data }`. Throw `httpError(status, msg)`.
- `src/mocks/db.js`: `db.all(c)`, `db.findById(c,id)`, `db.find(c,fn)`, `db.filter(c,fn)`, `db.insert(c,doc)`, `db.update(c,id,patchOrFn)`, `db.remove(c,id)`. The data persists in localStorage and resets automatically when seeds change.
- `src/mocks/utils.js`: `httpError, requireUser, requireRole, uid, now, daysAgo, hoursAgo, daysFromNow, publicUser, miniUser, seeded`.
- `src/mocks/points.js`: `awardPoints(db, userId, points, source, note)`, `notify(db, userId, {type,title,body,link})`, `POINTS` table. **Always use these** so rank stays consistent.
- Seeds: `src/mocks/data/<domain>.js` → `export default { collection: [...] }`. Seed dates must be relative (`daysAgo(3)`). Make seeds rich and realistic; the demo is the product pitch.
- Handlers must return exactly the shapes in API_CONTRACT.md (the real backend implements the same).

### Collection names (fixed — handlers may read any collection)
| Owner | Collections |
|---|---|
| core (done) | `users` (ids `u_student`, `u_mentor`, `u_admin`, mentors `m_2`..`m_8`, students `s_1`..`s_48`), `colleges` (`c_1`..`c_16`) |
| learning | `tracks`, `courses` (each course embeds `modules[].lessons[]` with **full** lesson fields), `enrollments`, `submissions`, `certificates` |
| earn | `gigs`, `gigApplications`, `walletTxns`, `pointsEvents`, `portfolioItems`, `userBadges`, `seasons` |
| community | `threads`, `replies`, `bookings`, `cohorts`, `cohortPosts`, `notifications`, `mentorReviews` |

Track slugs (fixed): `web-development`, `app-development`, `ui-ux-design`, `data-analytics`, `ai-automation`, `digital-marketing`, `content-writing`, `graphic-design`, `video-editing`, plus the 3 aspirant **bridge tracks** (category NON_TECH, `forAspirants: true`): `excel-for-aspirants`, `translation-hindi-english`, `accounting-tally-gst`. Track ids: `t_<slug>`.

## Aspirant mode (government-exam aspirants)
Millions of students spend 2–4 years preparing for SSC, banking, railways, UPSC and state PSC exams, then want to move to the private sector and feel they "know nothing". Campus's message: **"Your preparation already counts. Add 45 minutes a day and build a backup career."** It is insurance, not a distraction from prep.
- Goal `GOVT_EXAM_BACKUP` plus `user.aspirant` (see the contract). Daily time budget of 30/45/60/90 minutes.
- Bridge tracks build on exam subjects: Quant/DI → Excel & data; English/Hindi → translation; Banking awareness/Accounts → Tally & GST.
- Bridge lessons start with an **"Exam link"** blockquote: `> **Exam link:** You've solved hundreds of DI tables for SSC CGL — this is the same skill in Excel.`
- Credentials: Campus certificates are verified skill certificates, **not** degrees or government diplomas. Copy must never claim otherwise. Pathways to recognised credentials (Skill India/NSDC, SWAYAM, Academic Bank of Credits, UGC-approved open universities) are described as "partner pathways, coming soon".
- Tone: respectful and hopeful, never "failed aspirant". Say "aspirant", "prep years", "your preparation". Hindi-first copy is welcome.

## File ownership — edit ONLY your files
Shared files are frozen: `components/ui/*`, `components/layout/{AppLayout,AdminLayout,guards,nav-config}.*`, `App.jsx`, `main.jsx`, `styles/*`, `lib/*`, `context/*`, `mocks/{router,db,utils,points}.js`, `mocks/data/core.js`, `mocks/handlers/auth.js`. If you need a change there, put it in your final report instead.
You may create new files under `src/components/<your-domain>/` and inside your own pages, handlers and seed files.

## Verify before you finish
Run `npx vite build --outDir <your scratch dir> --emptyOutDir` from `campus/web` (use your own outDir so parallel builds don't collide) and fix every error. Read your pages once more for broken imports, missing loading, empty or error states, and mobile overflow.
