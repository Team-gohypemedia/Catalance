import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BadgeCheck, Briefcase, Building2, Check, GraduationCap, Landmark, MapPin, Plus, Rocket, Search, SkipForward, Sprout, TrendingUp, Wallet, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { api, qs } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Skeleton } from "@/components/ui/primitives";
import { cn, LANGUAGES } from "@/lib/utils";
import { COLLEGE_TYPES, FALLBACK_TRACKS, INDIAN_STATES, STREAMS, TRACK_SLUGS } from "@/components/marketing/data";
import { iconFor } from "@/components/marketing/primitives";
import { AspirantFields } from "@/components/aspirants/AspirantFields";
import { ConsentCheckboxes, acceptedPurposes, allAccepted } from "@/components/legal/ConsentCheckboxes";
import { BRIDGE_TRACKS, aspirantToForm, bridgeIcon, formToAspirant, isBridge, validateAspirantForm } from "@/components/aspirants/data";

const ASPIRANT_GOAL = "GOVT_EXAM_BACKUP";
const LEGAL_CONSENTS = ["TERMS", "PRIVACY"];
/** Signup stashes ?track/?college/?goal here, because the guest guard can redirect to /onboarding without the query. */
const CARRY_KEY = "campus_onboarding_carry";

const GOALS = [
  { value: "FIRST_INCOME", title: "Earn my first income", desc: "Get paid for real work while still in college.", icon: Wallet },
  { value: "JOB", title: "Land a job", desc: "Get placed, even if my college doesn't attract recruiters.", icon: Briefcase },
  { value: "FREELANCE_CAREER", title: "Build a freelance career", desc: "Find clients, set my own hours, be my own boss.", icon: Rocket },
  { value: "SKILL_UP", title: "Just skill up", desc: "Learn something useful and see where it goes.", icon: TrendingUp },
  { value: ASPIRANT_GOAL, title: "Preparing for a govt exam", desc: "Keep preparing. Build a career backup with 45 minutes a day, built on what you already studied.", icon: Landmark, badge: "Taiyari bhi, career bhi" },
];

const LEVELS = [
  { value: "NEW", title: "Totally new", desc: "Never tried this before. Start me from zero; everyone starts here.", icon: Sprout },
  { value: "SOME", title: "Know a bit", desc: "I've watched tutorials or made something small. Skip the very basics.", icon: Zap },
  { value: "CONFIDENT", title: "Pretty confident", desc: "I've built real things. Get me to paid gigs fast.", icon: Rocket },
];

const LANG_HINTS = {
  en: "Hello! Let's learn.",
  hinglish: "Chalo, shuru karte hain!",
  hi: "चलिए, शुरू करते हैं!",
  ta: "வாங்க, ஆரம்பிக்கலாம்!",
  te: "రండి, మొదలుపెడదాం!",
  bn: "চলো, শুরু করি!",
  mr: "चला, सुरू करूया!",
};

const STEP_LABELS = { goal: "Goal", prep: "Preparation", college: "College", interests: "Interests", level: "Level", language: "Language" };
const BASE_STEPS = ["goal", "college", "interests", "level", "language"];
const ASPIRANT_STEPS = ["goal", "prep", "college", "interests", "level", "language"];

function TrackGlyph({ track, className, ...props }) {
  const Icon = isBridge(track) ? bridgeIcon(track) : iconFor(track.icon, track.slug);
  return <Icon className={className} {...props} />;
}

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function ChoiceCard({ selected, onClick, children, className }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "relative w-full cursor-pointer rounded-2xl border bg-surface p-5 text-left transition-colors duration-200 sm:p-6",
        selected ? "border-primary ring-1 ring-primary" : "border-line hover:border-line-strong",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-5 right-5 flex size-5 items-center justify-center rounded-full border transition-colors",
          selected ? "border-primary bg-primary text-primary-fg" : "border-line-strong bg-surface",
        )}
        aria-hidden="true"
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
      {children}
    </button>
  );
}

/* ── Step 2: college ── */
function CollegeStep({ data, set, optional = false, onSkip }) {
  const [q, setQ] = useState(data.college?.name || "");
  const dq = useDebounced(q.trim());
  const search = useQuery({
    queryKey: ["colleges", "search", dq],
    queryFn: () => api.get(`/api/colleges/search${qs({ q: dq })}`),
    enabled: !data.newCollege && !data.college,
  });

  return (
    <div className="space-y-6">
      {optional && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-sm">
            <span className="font-semibold">Graduated already?</span> <span className="text-muted">College is optional for aspirants. You can add it later in your profile.</span>
          </p>
          <Button variant="outline" size="sm" leftIcon={SkipForward} onClick={onSkip}>
            Skip this step
          </Button>
        </div>
      )}
      {data.college ? (
        <div className="flex items-center gap-3 rounded-2xl border border-primary bg-surface p-4 ring-1 ring-primary sm:p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-primary">{data.college.shortName?.slice(0, 4) || <Building2 className="size-5" />}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{data.college.name}</p>
            <p className="truncate text-sm text-muted">
              {data.college.city}
              {data.college.state ? `, ${data.college.state}` : ""}
            </p>
          </div>
          <Button variant="ghost" size="iconSm" aria-label="Change college" onClick={() => set({ college: null })}>
            <X className="size-4" />
          </Button>
        </div>
      ) : data.newCollege ? (
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="font-medium">Add your college</p>
            <Button variant="link" size="sm" onClick={() => set({ newCollege: null })}>
              Search instead
            </Button>
          </div>
          <Field label="College name" htmlFor="nc-name">
            <Input id="nc-name" value={data.newCollege.name} onChange={(e) => set({ newCollege: { ...data.newCollege, name: e.target.value } })} placeholder="e.g. Govt. Engineering College, Bilaspur" autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" htmlFor="nc-city">
              <Input id="nc-city" value={data.newCollege.city} onChange={(e) => set({ newCollege: { ...data.newCollege, city: e.target.value } })} placeholder="City" />
            </Field>
            <Field label="State" htmlFor="nc-state">
              <Select id="nc-state" value={data.newCollege.state} onChange={(e) => set({ newCollege: { ...data.newCollege, state: e.target.value } })}>
                <option value="">Choose state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Type" htmlFor="nc-type">
            <Select id="nc-type" value={data.newCollege.type} onChange={(e) => set({ newCollege: { ...data.newCollege, type: e.target.value } })}>
              {COLLEGE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-xs text-muted">We'll verify it within a day. Your points count for it from today.</p>
        </div>
      ) : (
        <div>
          <label htmlFor="college-q" className="text-sm font-medium">
            Search your college
          </label>
          <div className="mt-1.5">
            <Input id="college-q" className="h-12" leftIcon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="College name, short name or city" autoComplete="off" autoFocus />
          </div>
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface" aria-live="polite">
            {search.isLoading ? (
              <div className="space-y-2 p-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : search.error ? (
              <p className="p-4 text-sm text-danger">
                Couldn't search right now.{" "}
                <button type="button" className="cursor-pointer font-semibold underline" onClick={() => search.refetch()}>
                  Try again
                </button>
              </p>
            ) : search.data?.length ? (
              <ul className="max-h-64 divide-y divide-line overflow-y-auto">
                {search.data.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => set({ college: c })} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-surface-2">
                      <Building2 className="size-4 shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{c.name}</span>
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <MapPin className="size-3" /> {c.city}
                          {c.state ? `, ${c.state}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-sm text-muted">{dq ? `No college matches “${dq}” yet.` : "Start typing to search."}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => set({ newCollege: { name: q, city: "", state: "", type: "ENGINEERING" } })}
            className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="size-4" /> My college isn't listed
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={optional ? "Year (if still studying)" : "Year"} htmlFor="ob-year">
          <Select id="ob-year" value={data.year} onChange={(e) => set({ year: e.target.value })}>
            <option value="">{optional ? "Graduated / not studying" : "Choose year"}</option>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>
                {["1st", "2nd", "3rd", "4th", "5th"][y - 1]} year
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Stream" htmlFor="ob-stream" hint="e.g. B.Tech CSE, B.Com, BA English">
          <Input id="ob-stream" list="ob-streams" value={data.stream} onChange={(e) => set({ stream: e.target.value })} placeholder="Your course" />
          <datalist id="ob-streams">
            {STREAMS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
      </div>
    </div>
  );
}

/** Short, calm "you're in" moment before redirecting to the app. */
function Celebration({ name, aspirant = false }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 backdrop-blur-sm" role="status">
      <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="px-6 text-center">
        <motion.span
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-fg"
        >
          <Check className="size-7" strokeWidth={2.5} />
        </motion.span>
        <h2 className="mt-6 text-4xl leading-[1.1] font-medium tracking-tight sm:text-5xl">
          You're in, <em className="accent">{name}</em>
        </h2>
        <p className="mt-3 text-base text-muted sm:text-lg">{aspirant ? "Your backup plan is ready. Your preparation already counts." : "Your path is ready."} +50 coins to get you started.</p>
      </motion.div>
    </motion.div>
  );
}

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const carried = useMemo(() => {
    try {
      return new URLSearchParams(sessionStorage.getItem(CARRY_KEY) || "");
    } catch {
      return new URLSearchParams();
    }
  }, []);
  const param = (k) => params.get(k) ?? carried.get(k);
  const preTrack = param("track");
  const preGoal = param("goal") === "aspirant" ? ASPIRANT_GOAL : "";
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [celebrate, setCelebrate] = useState(false);
  const [prepErrors, setPrepErrors] = useState({});
  const [consents, setConsents] = useState({}); // B: Terms + Privacy required, marketing optional and unticked
  const [consentTried, setConsentTried] = useState(false);
  const [data, setData] = useState(() => ({
    goal: preGoal || user?.goal || "",
    aspirant: aspirantToForm(user?.aspirant),
    college: user?.college || null,
    newCollege: null,
    year: user?.year ? String(user.year) : "",
    stream: user?.stream || "",
    interests: user?.interests?.length ? user.interests : TRACK_SLUGS.includes(preTrack) || BRIDGE_TRACKS.some((t) => t.slug === preTrack) ? [preTrack] : [],
    skillLevel: user?.skillLevel || "",
    language: user?.language || "en",
  }));
  const set = (patch) => setData((d) => ({ ...d, ...patch }));
  const setAspirant = (patch) => {
    setData((d) => ({ ...d, aspirant: { ...d.aspirant, ...patch } }));
    if (Object.keys(prepErrors).length) setPrepErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !(k in patch))));
  };
  const isAspirant = data.goal === ASPIRANT_GOAL;
  const STEPS = isAspirant ? ASPIRANT_STEPS : BASE_STEPS;
  const stepKey = STEPS[Math.min(step, STEPS.length - 1)];

  // College invite links (/signup?college=c_1) pre-select the inviter's college
  const preCollege = param("college");
  useEffect(() => {
    if (!preCollege || user?.college) return;
    let cancelled = false;
    api
      .get(`/api/colleges/${encodeURIComponent(preCollege)}`)
      .then((c) => {
        if (!cancelled && c?.id) setData((d) => (d.college ? d : { ...d, college: { id: c.id, name: c.name, shortName: c.shortName, city: c.city } }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [preCollege, user?.college]);

  const submit = useMutation({
    // B (consent): timestamped Terms + Privacy (and optional marketing) records first, then the profile
    mutationFn: async () => {
      await api.post("/api/me/consents", { purposes: acceptedPurposes(consents), context: "onboarding" });
      return api.post("/api/me/onboarding", {
        collegeId: data.college?.id,
        newCollege: !data.college && data.newCollege ? { ...data.newCollege, name: data.newCollege.name.trim(), city: data.newCollege.city.trim() } : undefined,
        year: data.year ? Number(data.year) : null,
        stream: data.stream.trim() || null,
        goal: data.goal,
        language: data.language,
        interests: data.interests,
        skillLevel: data.skillLevel,
        aspirant: isAspirant ? formToAspirant(data.aspirant) : null,
      });
    },
    onSuccess: ({ user: updated }) => {
      try {
        sessionStorage.removeItem(CARRY_KEY);
      } catch {}
      setCelebrate(true);
      setTimeout(() => {
        setUser(updated);
        navigate("/app", { replace: true });
      }, 1900);
    },
    onError: (e) => toast.error(e.message || "Couldn't save. Try again."),
  });

  const newCollegeValid = data.newCollege && data.newCollege.name.trim().length > 2 && data.newCollege.city.trim() && data.newCollege.state;
  const canNextBy = {
    goal: !!data.goal,
    prep: !!data.aspirant.exam && !!data.aspirant.examName.trim(),
    college: isAspirant
      ? !data.newCollege || newCollegeValid
      : (!!data.college || newCollegeValid) && !!data.year && data.stream.trim().length > 1,
    interests: data.interests.length > 0,
    level: !!data.skillLevel,
    language: !!data.language && allAccepted(consents, LEGAL_CONSENTS),
  };
  const canNext = canNextBy[stepKey];
  const hints = {
    goal: "Pick one goal to continue.",
    prep: "Choose your exam to continue.",
    college: isAspirant ? "Finish adding your college, or skip this step." : "Choose your college, year and stream.",
    interests: "Pick at least one track.",
    level: "Choose your level.",
    language: "Please accept the Terms of use and Privacy policy.",
  };

  const go = (d) => {
    setDir(d);
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + d)));
  };
  // Aspirants with nothing picked yet get bridge tracks that match their strong subjects
  const suggestBridges = () => {
    if (!isAspirant || data.interests.length) return;
    const strengths = data.aspirant.strengths;
    const matched = BRIDGE_TRACKS.filter((t) => t.bridgeFrom.some((s) => strengths.includes(s))).map((t) => t.slug);
    set({ interests: matched.length ? matched : [BRIDGE_TRACKS[0].slug] });
  };
  const next = () => {
    if (stepKey === "prep") {
      const errs = validateAspirantForm(data.aspirant);
      setPrepErrors(errs);
      if (Object.keys(errs).length) return toast.error(Object.values(errs)[0]);
    }
    if (stepKey === "language") setConsentTried(true);
    if (!canNext) return toast.error(hints[stepKey]);
    if (step === STEPS.length - 1) return submit.mutate();
    if (STEPS[step + 1] === "interests") suggestBridges();
    go(1);
  };
  const skipCollege = () => {
    set({ college: null, newCollege: null });
    suggestBridges();
    go(1);
  };

  const firstName = user?.name?.split(" ")[0] || "there";
  const titles = {
    goal: { t: `Hi ${firstName}! What's your goal?`, d: "This shapes your path. You can change it later." },
    prep: { t: "Your preparation already counts.", d: "Tell us about your prep. We'll turn your strong subjects into a backup career, 30–90 minutes a day." },
    college: isAspirant
      ? { t: "Where did you study?", d: "Optional. If you add it, your points also count for your college on the national board." }
      : { t: "Where do you study?", d: "Every point you earn also counts for your college on the national board." },
    interests: isAspirant
      ? { t: "What do you want to build?", d: "Bridge tracks come first: they start from subjects you've already mastered for your exam." }
      : { t: "What do you want to learn?", d: "Pick as many as you like — tech, non-tech, or both." },
    level: { t: "How much do you already know?", d: "Be honest — we'll skip what you know and slow down where you need it." },
    language: { t: "Which language do you learn best in?", d: "We use it for lessons and help where we can. Switch any time." },
  };

  const trackGroups = isAspirant
    ? [
        { key: "BRIDGE", label: "Built on your prep", tracks: BRIDGE_TRACKS, bridge: true },
        { key: "TECH", label: "Tech", tracks: FALLBACK_TRACKS.filter((t) => t.category === "TECH" && !isBridge(t)) },
        { key: "NON_TECH", label: "Non-tech", tracks: FALLBACK_TRACKS.filter((t) => t.category === "NON_TECH" && !isBridge(t)) },
      ]
    : [
        { key: "TECH", label: "Tech", tracks: FALLBACK_TRACKS.filter((t) => t.category === "TECH") },
        { key: "NON_TECH", label: "Non-tech", tracks: FALLBACK_TRACKS.filter((t) => t.category === "NON_TECH") },
      ];

  const toggleInterest = (slug) => set({ interests: data.interests.includes(slug) ? data.interests.filter((s) => s !== slug) : [...data.interests, slug] });

  return (
    <div className="min-h-dvh bg-bg">
      {celebrate && <Celebration name={firstName} aspirant={isAspirant} />}
      <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur-xl">
        <div
          className="h-0.5 w-full bg-line"
          role="progressbar"
          aria-label="Onboarding progress"
          aria-valuemin={0}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
        >
          <motion.div className="h-full bg-primary" initial={false} animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
        </div>
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
          <Logo />
          <span className="text-sm text-muted">
            <span className="tabular-nums">
              {step + 1} / {STEPS.length}
            </span>
            <span className="hidden sm:inline"> · {STEP_LABELS[stepKey]}</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-8 pb-36 sm:px-6 sm:pt-14">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow sm:hidden">{STEP_LABELS[stepKey]}</p>
            <h1 className="mt-2 text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:mt-0 sm:text-5xl">{titles[stepKey].t}</h1>
            <p className="mt-3 max-w-2xl text-base text-muted sm:text-lg">{titles[stepKey].d}</p>

            <div className="mt-10">
              {stepKey === "goal" && (
                <div role="radiogroup" aria-label="Goal" className="grid gap-3 sm:grid-cols-2">
                  {GOALS.map((g) => (
                    <ChoiceCard key={g.value} selected={data.goal === g.value} onClick={() => set({ goal: g.value })} className={cn(g.value === ASPIRANT_GOAL && "sm:col-span-2")}>
                      <div className={cn("pr-8", g.value === ASPIRANT_GOAL && "sm:flex sm:items-center sm:gap-5")}>
                        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full transition-colors", data.goal === g.value ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted")}>
                          <g.icon className="size-5" strokeWidth={1.75} />
                        </span>
                        <div className={cn("mt-5", g.value === ASPIRANT_GOAL && "sm:mt-0")}>
                          <p className="flex flex-wrap items-center gap-2 text-lg font-medium tracking-tight">
                            {g.title}
                            {g.badge && <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-normal text-muted">{g.badge}</span>}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-muted">{g.desc}</p>
                        </div>
                      </div>
                    </ChoiceCard>
                  ))}
                </div>
              )}

              {stepKey === "prep" && <AspirantFields value={data.aspirant} onChange={setAspirant} errors={prepErrors} />}

              {stepKey === "college" && <CollegeStep data={data} set={set} optional={isAspirant} onSkip={skipCollege} />}

              {stepKey === "interests" && (
                <div className="space-y-8">
                  {trackGroups.map((group) => (
                    <div key={group.key}>
                      <p className={cn("eyebrow mb-3", group.bridge && "flex items-center gap-1.5 text-primary")}>
                        {group.bridge && <BadgeCheck className="size-3.5" />}
                        {group.label}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {group.tracks.map((t) => {
                          const on = data.interests.includes(t.slug);
                          return (
                            <button
                              key={t.slug}
                              type="button"
                              role="checkbox"
                              aria-checked={on}
                              onClick={() => toggleInterest(t.slug)}
                              className={cn("flex cursor-pointer items-center gap-4 rounded-2xl border bg-surface p-4 text-left transition-colors", on ? "border-primary ring-1 ring-primary" : "border-line hover:border-line-strong")}
                            >
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2">
                                <TrackGlyph track={t} className="size-4.5" style={{ color: t.color }} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-medium">{t.title}</span>
                                <span className="mt-0.5 block truncate text-xs text-muted">{group.bridge ? `Built on your prep · ${t.bridgeFrom.slice(0, 2).join(", ")}` : t.tagline}</span>
                              </span>
                              <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors", on ? "border-primary bg-primary text-primary-fg" : "border-line-strong")}>
                                {on && <Check className="size-3" strokeWidth={3} />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <p className="text-sm text-muted" aria-live="polite">
                    {data.interests.length ? `${data.interests.length} selected` : "Nothing selected yet"}
                  </p>
                </div>
              )}

              {stepKey === "level" && (
                <div role="radiogroup" aria-label="Skill level" className="grid gap-3">
                  {LEVELS.map((l) => (
                    <ChoiceCard key={l.value} selected={data.skillLevel === l.value} onClick={() => set({ skillLevel: l.value })}>
                      <div className="flex items-center gap-4 pr-8">
                        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full transition-colors", data.skillLevel === l.value ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted")}>
                          <l.icon className="size-5" strokeWidth={1.75} />
                        </span>
                        <div>
                          <p className="text-lg font-medium tracking-tight">{l.title}</p>
                          <p className="mt-0.5 text-sm text-muted">{l.desc}</p>
                        </div>
                      </div>
                    </ChoiceCard>
                  ))}
                </div>
              )}

              {stepKey === "language" && (
                <div role="radiogroup" aria-label="Learning language" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {LANGUAGES.map((l) => (
                    <ChoiceCard key={l.code} selected={data.language === l.code} onClick={() => set({ language: l.code })} className="p-4 sm:p-5">
                      <p className="pr-7 text-lg font-medium tracking-tight">{l.label}</p>
                      <p className="mt-1 text-sm text-muted" lang={l.code === "hinglish" ? "en" : l.code}>
                        {LANG_HINTS[l.code]}
                      </p>
                    </ChoiceCard>
                  ))}
                </div>
              )}
              {stepKey === "language" && (
                <ConsentCheckboxes
                  purposes={LEGAL_CONSENTS}
                  optional={["MARKETING"]}
                  value={consents}
                  onChange={setConsents}
                  showError={consentTried}
                  disabled={submit.isPending}
                  className="mt-8 rounded-2xl border border-line bg-surface p-5"
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Button variant="ghost" size="lg" onClick={() => go(-1)} disabled={step === 0 || submit.isPending} leftIcon={ArrowLeft}>
            Back
          </Button>
          <Button size="lg" onClick={next} loading={submit.isPending || celebrate} aria-disabled={!canNext} className={cn(!canNext && "opacity-60")} rightIcon={step === STEPS.length - 1 ? GraduationCap : ArrowRight}>
            {step === STEPS.length - 1 ? "Finish & start learning" : "Continue"}
          </Button>
        </div>
      </footer>
    </div>
  );
}
