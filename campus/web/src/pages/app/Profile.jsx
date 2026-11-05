import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { BookOpenCheck, ExternalLink, Github, Globe, Landmark, Linkedin, MapPin, Palette, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { LANGUAGES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, Field, Input, Select, Skeleton, Textarea } from "@/components/ui/primitives";
import { Avatar, Switch } from "@/components/ui/overlays";
import { DivisionBadge, PageHeader } from "@/components/ui/campus";
import { TagInput } from "@/components/community/TagInput";
import { AspirantFields } from "@/components/aspirants/AspirantFields";
import { AvailabilityCard } from "@/components/profile/AvailabilityCard";
import { usePlatformConfig } from "@/lib/platform";
import { aspirantToForm, formToAspirant, validateAspirantForm } from "@/components/aspirants/data";

const ASPIRANT_GOAL = "GOVT_EXAM_BACKUP";

const STREAMS = ["B.Tech CSE", "B.Tech ECE", "B.Tech IT", "BCA", "B.Sc IT", "B.Com", "BBA", "BA English", "BA Mass Comm", "B.Des", "B.Sc Maths", "Diploma CS", "MBA", "Other"];
const SKILL_SUGGESTIONS = ["React", "JavaScript", "Figma", "Python", "SQL", "Excel", "Canva", "SEO", "Copywriting", "Premiere Pro", "Illustrator", "Power BI", "Flutter", "Node.js"];

const fromUser = (u) => ({
  name: u?.name || "",
  username: u?.username || "",
  headline: u?.headline || "",
  bio: u?.bio || "",
  city: u?.city || "",
  stream: u?.stream || "",
  year: u?.year ? String(u.year) : "",
  skills: u?.skills || [],
  links: { github: "", linkedin: "", portfolio: "", behance: "", ...(u?.links || {}) },
  language: u?.language || "en",
  aspirantOn: !!u?.aspirant,
  aspirant: aspirantToForm(u?.aspirant),
});

export default function Profile() {
  const { user, setUser } = useAuth();
  const { flags } = usePlatformConfig();
  const location = useLocation();
  const [form, setForm] = useState(() => fromUser(user));
  useEffect(() => setForm(fromUser(user)), [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Deep links like /app/profile#aspirant (from the dashboard planner)
  useEffect(() => {
    if (location.hash !== "#aspirant") return;
    const t = setTimeout(() => document.getElementById("aspirant")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    return () => clearTimeout(t);
  }, [location.hash]);
  const setAspirant = (patch) => setForm((f) => ({ ...f, aspirant: { ...f.aspirant, ...patch } }));
  const aspirantErrors = form.aspirantOn ? validateAspirantForm(form.aspirant) : {};
  const aspirantInvalid = Object.keys(aspirantErrors).length > 0;

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setLink = (k) => (e) => setForm((f) => ({ ...f, links: { ...f.links, [k]: e.target.value } }));

  const usernameError = form.username && !/^[a-z0-9_]{3,24}$/.test(form.username) ? "3–24 characters: lowercase letters, numbers, underscore." : null;
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(fromUser(user)), [form, user]);

  const save = useMutation({
    mutationFn: () => {
      const links = Object.fromEntries(Object.entries(form.links).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]));
      const aspirantPatch = form.aspirantOn
        ? { aspirant: formToAspirant(form.aspirant), goal: ASPIRANT_GOAL }
        : user.aspirant || user.goal === ASPIRANT_GOAL
          ? { aspirant: null, ...(user.goal === ASPIRANT_GOAL ? { goal: "JOB" } : {}) }
          : {};
      return api.patch("/api/me", {
        ...aspirantPatch,
        name: form.name.trim(),
        username: form.username.trim(),
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        city: form.city.trim() || null,
        stream: form.stream || null,
        year: form.year ? Number(form.year) : null,
        skills: form.skills,
        links,
        language: form.language,
      });
    },
    onSuccess: ({ user: u }) => {
      setUser(u);
      setForm(fromUser(u));
      toast.success("Profile saved");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!user) return <Skeleton className="h-96 rounded-3xl" />;

  const linkIcons = { github: Github, linkedin: Linkedin, portfolio: Globe, behance: Palette };

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="This is what companies and mentors see on your public Skill Passport."
        actions={
          <Button variant="outline" size="sm" to={`/u/${user.username}`} rightIcon={ExternalLink}>
            View passport
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <form
          className="min-w-0 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (aspirantInvalid) return toast.error(Object.values(aspirantErrors)[0]);
            if (!usernameError && form.name.trim()) save.mutate();
          }}
        >
          <Card>
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <Avatar name={form.name || user.name} src={user.avatarUrl} size="xl" />
                <div>
                  <p className="font-medium">Profile picture</p>
                  <p className="text-sm text-muted">We use your initials — clean, consistent, no awkward selfies needed.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="pf-name" error={!form.name.trim() ? "Name is required" : null}>
                  <Input id="pf-name" value={form.name} onChange={(e) => set("name")(e.target.value)} />
                </Field>
                <Field label="Username" htmlFor="pf-username" error={usernameError} hint={`campus.catalance.in/u/${form.username || "you"}`}>
                  <Input id="pf-username" value={form.username} onChange={(e) => set("username")(e.target.value.toLowerCase())} />
                </Field>
              </div>
              <Field label="Headline" htmlFor="pf-headline" hint="One line. e.g. “2nd-year BCA · building React apps for local businesses”">
                <Input id="pf-headline" maxLength={120} value={form.headline} onChange={(e) => set("headline")(e.target.value)} />
              </Field>
              <Field label="Bio" htmlFor="pf-bio" hint={`${form.bio.length}/400`}>
                <Textarea id="pf-bio" maxLength={400} value={form.bio} onChange={(e) => set("bio")(e.target.value)} placeholder="What do you like building? What are you learning right now?" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6 sm:p-8">
              <h2 className="text-base font-medium tracking-tight">College & learning</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="City" htmlFor="pf-city">
                  <Input id="pf-city" value={form.city} onChange={(e) => set("city")(e.target.value)} placeholder="Jabalpur" />
                </Field>
                <Field label="Stream" htmlFor="pf-stream">
                  <Select id="pf-stream" value={form.stream} onChange={(e) => set("stream")(e.target.value)}>
                    <option value="">Select</option>
                    {[...new Set([...(form.stream ? [form.stream] : []), ...STREAMS])].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Year" htmlFor="pf-year">
                  <Select id="pf-year" value={form.year} onChange={(e) => set("year")(e.target.value)}>
                    <option value="">Select</option>
                    {[1, 2, 3, 4, 5].map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              {user.college && <p className="text-sm text-muted">College: <span className="font-medium text-fg">{user.college.name}</span> (set during onboarding)</p>}
              <Field label="Learning language" htmlFor="pf-lang" hint="The AI Tutor and recommendations use this.">
                <Select id="pf-lang" value={form.language} onChange={(e) => set("language")(e.target.value)}>
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Skills" htmlFor="pf-skills" hint="Up to 12. Verified skills come from mentor-reviewed work.">
                <TagInput id="pf-skills" value={form.skills} onChange={set("skills")} max={12} placeholder="Add a skill" suggestions={SKILL_SUGGESTIONS} />
              </Field>
            </CardContent>
          </Card>

          <Card id="aspirant" className="scroll-mt-24">
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                    <Landmark className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <label htmlFor="pf-aspirant" className="flex flex-wrap items-center gap-2 text-base font-medium tracking-tight sm:text-lg">
                      Aspirant mode
                      <Badge tone="accent">Taiyari bhi, career bhi</Badge>
                    </label>
                    <p className="mt-0.5 text-sm text-muted">
                      Preparing for a government exam? Get a daily time budget, bridge tracks built on your prep, a private age-limit planner and a Preparation record on your passport.
                    </p>
                  </div>
                </div>
                <Switch id="pf-aspirant" checked={form.aspirantOn} onCheckedChange={(v) => setForm((f) => ({ ...f, aspirantOn: v }))} />
              </div>
              {form.aspirantOn ? (
                <AspirantFields value={form.aspirant} onChange={setAspirant} errors={aspirantErrors} className="border-t border-line pt-5" />
              ) : (
                <p className="rounded-xl bg-surface-2/70 px-4 py-3 text-sm text-muted">
                  {user.aspirant ? "Aspirant mode will be switched off when you save. Your goal changes to “Land a job”; your courses and points stay." : "Off. Turn it on any time. Your prep years will show as a strength, never as a gap."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5 p-6 sm:p-8">
              <h2 className="text-base font-medium tracking-tight">Links</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(linkIcons).map(([k, Icon]) => (
                  <Field key={k} label={k[0].toUpperCase() + k.slice(1)} htmlFor={`pf-${k}`}>
                    <Input id={`pf-${k}`} type="url" leftIcon={Icon} value={form.links[k] || ""} onChange={setLink(k)} placeholder={`https://${k === "portfolio" ? "yourname.in" : `${k}.com/you`}`} />
                  </Field>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="sticky bottom-20 z-10 flex items-center justify-end gap-2 rounded-xl border border-line bg-surface/90 p-2.5 shadow-md backdrop-blur lg:bottom-4">
            <Button type="button" variant="ghost" disabled={!dirty} onClick={() => setForm(fromUser(user))}>
              Reset
            </Button>
            <Button type="submit" leftIcon={Save} loading={save.isPending} disabled={!dirty || !!usernameError || !form.name.trim() || aspirantInvalid}>
              Save changes
            </Button>
          </div>
        </form>

        {/* Live passport preview */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 px-1 text-xs text-muted">Live preview · public passport</p>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="h-20 bg-[radial-gradient(120%_140%_at_0%_0%,var(--primary-soft),transparent_70%)]" aria-hidden="true" />
            <div className="-mt-10 px-6 pb-6">
              <div className="flex items-end justify-between">
                <Avatar name={form.name || "?"} src={user.avatarUrl} size="xl" className="ring-4 ring-surface" />
                <DivisionBadge division={user.division} size="md" />
              </div>
              <p className="mt-4 text-xl leading-tight font-medium tracking-tight">{form.name || "Your name"}</p>
              <p className="mt-0.5 text-sm text-subtle">@{form.username || "username"}</p>
              <p className="mt-3 text-sm text-muted">{form.headline || "Add a headline so people know what you do."}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                {form.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" /> {form.city}
                  </span>
                )}
                {user.college?.shortName && <span>{user.college.shortName}</span>}
                {form.stream && <span>{form.stream}{form.year ? ` · Year ${form.year}` : ""}</span>}
              </p>
              {form.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {form.skills.slice(0, 8).map((s) => (
                    <span key={s} className="rounded-full border border-line px-2.5 py-0.5 text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {form.aspirantOn && form.aspirant.showOnPassport && form.aspirant.examName.trim() && (
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium">
                  <BookOpenCheck className="size-3.5 text-primary" /> Preparation record · {form.aspirant.examName.trim()} · {form.aspirant.prepYears} yr{Number(form.aspirant.prepYears) === 1 ? "" : "s"}
                </p>
              )}
              <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                {Object.entries(linkIcons)
                  .filter(([k]) => form.links[k])
                  .map(([k, Icon]) => (
                    <span key={k} className="flex size-8 items-center justify-center rounded-full bg-surface-2 text-muted" title={k}>
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                  ))}
                {flags.gamification && (
                  <span className="ml-auto text-sm font-medium tabular-nums">
                    {user.seasonPoints} <span className="font-normal text-muted">pts</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link to={`/u/${user.username}`} className="mt-3 inline-flex items-center gap-1 px-1 text-sm font-medium text-primary hover:underline">
            Open /u/{user.username} <ExternalLink className="size-3.5" />
          </Link>
        </aside>

        {/* Project availability (spec §4.2): saved separately from the profile form */}
        <AvailabilityCard className="lg:col-span-2" />
      </div>
    </div>
  );
}
