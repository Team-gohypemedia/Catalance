import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowUp, Clock, ExternalLink, Eye, Layers, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn, formatDuration, formatINR, LANGUAGES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Skeleton, Textarea } from "@/components/ui/primitives";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/overlays";
import { CourseCover, EmptyState, ErrorState } from "@/components/ui/campus";
import { AdminHeader, ConfirmDialog, IconBtn, ListEditor, Panel, Status, Tag, TagInput } from "@/components/admin/kit";
import { COVER_PRESETS, LESSON_TYPES, PATTERNS } from "@/components/admin/course-constants";
import { COURSE_LEVELS, COURSE_STATUS, COURSE_STATUSES, DEFAULT_LEVEL_DEFAULTS, LEVEL_CONTENT, LEVEL_LABELS } from "@/components/learning/catalog-meta";
import { usePlatformConfig } from "@/lib/platform";

const LEVELS = COURSE_LEVELS.map((value) => ({ value, label: LEVEL_LABELS[value] }));
const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
// opens at the start of the day, closes at the end of it (UTC)
const fromDateInput = (v, endOfDay = false) => (v ? new Date(`${v}T${endOfDay ? "23:59:59" : "00:00:00"}Z`).toISOString() : null);
import { LESSON_ICONS, LessonEditor, blankLesson, newId } from "@/components/admin/LessonEditor";

const SKILL_SUGGESTIONS = ["React", "JavaScript", "Figma", "Python", "SQL", "Excel", "SEO", "Copywriting", "Canva", "Premiere Pro", "Meta Ads", "Flutter", "Power BI", "ChatGPT Prompting"];

const move = (list, i, d) => {
  const next = [...list];
  [next[i], next[i + d]] = [next[i + d], next[i]];
  return next;
};

function Section({ title, description, children, action }) {
  return (
    <Panel title={title} description={description} action={action} bodyClassName="space-y-5 p-5 sm:p-6">
      {children}
    </Panel>
  );
}

function AddLessonMenu({ onAdd }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
        >
          <Plus className="size-3.5" /> Add lesson
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {LESSON_TYPES.map((t) => {
          const Icon = LESSON_ICONS[t.value];
          return (
            <DropdownMenuItem key={t.value} onSelect={() => onAdd(t.value)}>
              <Icon className="size-4 text-muted" /> {t.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ModuleCard({ mod, index, count, onChange, onMove, onDelete, onEditLesson }) {
  const lessons = mod.lessons || [];
  const minutes = lessons.reduce((s, l) => s + (Number(l.durationMinutes) || 0), 0);
  const setLessons = (next) => onChange({ lessons: next });
  const addLesson = (type) => {
    const lesson = { ...blankLesson(type), title: `New ${type.toLowerCase()} lesson` };
    setLessons([...lessons, lesson]);
    onEditLesson(lesson.id);
  };
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2/40 py-2 pr-2 pl-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-xs text-muted tabular-nums">{index + 1}</span>
        <Input
          aria-label={`Module ${index + 1} title`}
          value={mod.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-8 rounded-md border-transparent bg-transparent px-2 font-medium hover:border-line focus:bg-surface"
        />
        <span className="hidden shrink-0 text-xs whitespace-nowrap text-subtle sm:inline">
          {lessons.length} lessons · {formatDuration(minutes)}
        </span>
        <div className="flex shrink-0">
          <IconBtn label="Move module up" icon={ArrowUp} disabled={index === 0} onClick={() => onMove(-1)} />
          <IconBtn label="Move module down" icon={ArrowDown} disabled={index === count - 1} onClick={() => onMove(1)} />
          <IconBtn label="Delete module" icon={Trash2} danger onClick={onDelete} />
        </div>
      </div>
      <ul className="divide-y divide-line">
        {lessons.map((l, i) => {
          const Icon = LESSON_ICONS[l.type] || LESSON_ICONS.ARTICLE;
          return (
            <li key={l.id} className="flex items-center gap-2.5 py-1 pr-2 pl-4 transition-colors hover:bg-surface-2/40">
              <Icon className="size-4 shrink-0 text-subtle" strokeWidth={1.75} aria-label={l.type} />
              <button type="button" onClick={() => onEditLesson(l.id)} className="min-w-0 flex-1 cursor-pointer truncate py-1.5 text-left text-sm text-fg transition-colors hover:text-primary">
                {l.title || <span className="text-subtle italic">Untitled lesson</span>}
              </button>
              {l.isPreview && <Tag className="hidden sm:inline-flex">Preview</Tag>}
              {l.type === "QUIZ" && <span className="hidden text-xs text-subtle sm:inline">{l.quiz?.questions?.length || 0} Qs</span>}
              <span className="w-9 shrink-0 text-right text-xs text-subtle tabular-nums">{l.durationMinutes}m</span>
              <div className="flex shrink-0">
                <IconBtn label="Edit lesson" icon={Pencil} onClick={() => onEditLesson(l.id)} />
                <IconBtn label="Move lesson up" icon={ArrowUp} disabled={i === 0} onClick={() => setLessons(move(lessons, i, -1))} className="hidden sm:flex" />
                <IconBtn label="Move lesson down" icon={ArrowDown} disabled={i === lessons.length - 1} onClick={() => setLessons(move(lessons, i, 1))} className="hidden sm:flex" />
                <IconBtn label="Delete lesson" icon={Trash2} danger onClick={() => setLessons(lessons.filter((x) => x.id !== l.id))} />
              </div>
            </li>
          );
        })}
        {!lessons.length && <li className="px-4 py-5 text-center text-sm text-muted">No lessons yet. Add a video, article, quiz or assignment.</li>}
      </ul>
      <div className="border-t border-line px-2.5 py-1.5">
        <AddLessonMenu onAdd={addLesson} />
      </div>
    </div>
  );
}

export default function CourseEditor() {
  const { courseId } = useParams();
  const qc = useQueryClient();
  const course = useQuery({ queryKey: ["admin", "course", courseId], queryFn: () => api.get(`/api/admin/courses/${courseId}`) });
  const tracks = useQuery({ queryKey: ["admin", "tracks"], queryFn: () => api.get("/api/admin/tracks") });
  const mentors = useQuery({ queryKey: ["admin", "mentors"], queryFn: () => api.get("/api/admin/mentors") });
  const cats = useQuery({ queryKey: ["admin", "categories"], queryFn: () => api.get("/api/admin/categories") });
  const { pricing } = usePlatformConfig();

  const [draft, setDraft] = useState(null);
  const [baseline, setBaseline] = useState("");
  const [editing, setEditing] = useState(null); // lesson id
  const [deleteModule, setDeleteModule] = useState(null);

  useEffect(() => {
    if (course.data) {
      setDraft(structuredClone(course.data));
      setBaseline(JSON.stringify(course.data));
    }
  }, [course.data]);

  const dirty = !!draft && JSON.stringify(draft) !== baseline;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useMutation({
    mutationFn: (body) => api.put(`/api/admin/courses/${courseId}`, body),
    onSuccess: (saved) => {
      qc.setQueryData(["admin", "course", courseId], saved);
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const modules = useMemo(() => draft?.modules || [], [draft]);
  const setModules = (next) => set({ modules: next });
  const updateModule = (id, patch) => setModules(modules.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const editingLesson = useMemo(() => {
    for (const m of modules) for (const l of m.lessons || []) if (l.id === editing) return { lesson: l, moduleId: m.id };
    return null;
  }, [modules, editing]);

  const patchLesson = (patch) => {
    if (!editingLesson) return;
    setModules(
      modules.map((m) => (m.id === editingLesson.moduleId ? { ...m, lessons: m.lessons.map((l) => (l.id === editing ? { ...l, ...patch } : l)) } : m)),
    );
  };

  const stats = useMemo(() => {
    const lessons = modules.flatMap((m) => m.lessons || []);
    return {
      lessons: lessons.length,
      minutes: lessons.reduce((s, l) => s + (Number(l.durationMinutes) || 0), 0),
      byType: LESSON_TYPES.map((t) => ({ ...t, count: lessons.filter((l) => l.type === t.value).length })),
      previews: lessons.filter((l) => l.isPreview).length,
    };
  }, [modules]);

  const onSave = () => {
    if (!draft.title?.trim()) return toast.error("The course needs a title.");
    if (draft.enrolmentOpensAt && draft.enrolmentClosesAt && new Date(draft.enrolmentOpensAt) > new Date(draft.enrolmentClosesAt)) {
      return toast.error("Enrolment must open before it closes.");
    }
    // derived / read-only fields stay out of the body
    // eslint-disable-next-line no-unused-vars
    const { enrollment, skill: _skill, enrolmentOpen: _open, seatsLeft: _seats, priceWithGstINR: _total, gstPercent: _gst, ...body } = draft;
    save.mutate(body);
  };

  if (course.error)
    return (
      <>
        <BackLink />
        <ErrorState error={course.error} onRetry={course.refetch} />
      </>
    );

  if (course.isLoading || !draft)
    return (
      <>
        <BackLink />
        <Skeleton className="mb-8 h-9 w-80 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </>
    );

  const track = (tracks.data || []).find((t) => t.id === draft.trackId);
  const cover = draft.cover || COVER_PRESETS[0];
  const levelLabel = LEVEL_LABELS[draft.level];
  const gst = pricing?.gstPercent ?? draft.gstPercent ?? 18;
  const levelDefault = { ...DEFAULT_LEVEL_DEFAULTS, ...(pricing?.levelDefaults || {}) }[draft.level] || DEFAULT_LEVEL_DEFAULTS.BEGINNER;
  const levelInfo = LEVEL_CONTENT[draft.level];
  const skill = (cats.data || []).flatMap((c) => (c.skills || []).map((s) => ({ ...s, categoryName: c.name }))).find((s) => s.id === draft.skillId);
  const datesInvalid = draft.enrolmentOpensAt && draft.enrolmentClosesAt && new Date(draft.enrolmentOpensAt) > new Date(draft.enrolmentClosesAt);
  const statusMeta = COURSE_STATUS[draft.status || "PUBLISHED"];

  return (
    <div className="pb-4">
      <AdminHeader
        crumbs={[{ label: "Courses", to: "/admin/courses" }, { label: draft.title || "Untitled course" }]}
        title={draft.title || "Untitled course"}
        description={draft.subtitle || "Shape the details, then build the curriculum module by module."}
        actions={
          <Button variant="outline" size="sm" to={`/app/courses/${draft.id}`} rightIcon={ExternalLink} target="_blank" rel="noreferrer">
            View as student
          </Button>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <Section title="Details" description="What students see on the course page.">
            <Field label="Title" htmlFor="ce-title">
              <Input id="ce-title" value={draft.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Subtitle" htmlFor="ce-sub" hint="One line that sells the outcome.">
              <Input id="ce-sub" value={draft.subtitle || ""} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Ship 3 client-ready sites in 6 weeks" />
            </Field>
            <Field label="Description" htmlFor="ce-desc">
              <Textarea id="ce-desc" rows={5} value={draft.description || ""} onChange={(e) => set({ description: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Track" htmlFor="ce-track">
                <Select id="ce-track" value={draft.trackId || ""} onChange={(e) => set({ trackId: e.target.value })}>
                  <option value="" disabled>
                    {tracks.isLoading ? "Loading…" : "Choose a track"}
                  </option>
                  {(tracks.data || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Mentor" htmlFor="ce-mentor">
                <Select id="ce-mentor" value={draft.mentorId || ""} onChange={(e) => set({ mentorId: e.target.value })}>
                  <option value="" disabled>
                    {mentors.isLoading ? "Loading…" : "Choose a mentor"}
                  </option>
                  {(mentors.data || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Level" htmlFor="ce-level">
                <Select id="ce-level" value={draft.level} onChange={(e) => set({ level: e.target.value })}>
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="space-y-2">
              <Label>Languages</Label>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Languages">
                {LANGUAGES.map((l) => {
                  const on = (draft.languages || []).includes(l.code);
                  return (
                    <button
                      key={l.code}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set({ languages: on ? draft.languages.filter((x) => x !== l.code) : [...(draft.languages || []), l.code] })}
                      className={cn(
                        "h-8 cursor-pointer rounded-full border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none",
                        on ? "border-primary/40 bg-primary-soft text-primary" : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
                      )}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          <Section title="Catalogue" description="Where the course sits in the catalogue and who can see it.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Skill" htmlFor="ce-skill" hint={skill ? `${skill.categoryName} · formats: ${(skill.formats || []).map((f) => LEVEL_LABELS[f]).join(", ")}` : "The skill learners get verified in."}>
                <Select id="ce-skill" value={draft.skillId || ""} onChange={(e) => set({ skillId: e.target.value || null })}>
                  <option value="">{cats.isLoading ? "Loading…" : "No skill yet"}</option>
                  {(cats.data || []).map((c) => (
                    <optgroup key={c.id} label={c.name}>
                      {(c.skills || []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {s.status !== "PUBLISHED" ? ` (${s.status.toLowerCase()})` : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </Field>
              <Field label="Status" htmlFor="ce-status" hint={COURSE_STATUS[draft.status || "PUBLISHED"]?.hint}>
                <Select id="ce-status" value={draft.status || "PUBLISHED"} onChange={(e) => set({ status: e.target.value })}>
                  {COURSE_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {skill && draft.level && skill.formats?.length > 0 && !skill.formats.includes(draft.level) && (
              <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-fg">
                {skill.name} is offered as {skill.formats.map((f) => LEVEL_LABELS[f]).join(", ")}. This course is {LEVEL_LABELS[draft.level]}.
              </p>
            )}
            <Field label="One-line outcome" htmlFor="ce-outcome" hint={`Shown on the course card. ${(draft.outcome || "").length}/240`}>
              <Input id="ce-outcome" maxLength={240} value={draft.outcome || ""} onChange={(e) => set({ outcome: e.target.value })} placeholder="Turn a brief into a tested Figma prototype." />
            </Field>
            <Field label="Who this is for" htmlFor="ce-who">
              <Textarea id="ce-who" rows={2} value={draft.whoFor || ""} onChange={(e) => set({ whoFor: e.target.value })} placeholder="Beginners who want to design apps. No design experience needed." />
            </Field>
            {levelInfo && (
              <div className="rounded-lg border border-line bg-surface-2/50 px-3.5 py-3 text-sm">
                <p className="font-medium">{LEVEL_LABELS[draft.level]} level</p>
                <p className="mt-0.5 text-muted">
                  {levelInfo.focus} Learners finish with: {levelInfo.output}
                </p>
              </div>
            )}
          </Section>

          <Section title="Price and enrolment" description="Fees exclude GST. Learners pay in full before they start.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Course fee (₹, before GST)"
                htmlFor="ce-price"
                hint={Number(draft.priceINR) === 0 ? "Free course" : `Learners pay ${formatINR(Math.round(Number(draft.priceINR) * (1 + gst / 100)))} incl. ${gst}% GST`}
              >
                <Input id="ce-price" type="number" min={0} step={1} value={draft.priceINR ?? 0} onChange={(e) => set({ priceINR: Math.max(0, Math.round(Number(e.target.value) || 0)) })} />
              </Field>
              <Field label="Duration (days)" htmlFor="ce-days" hint={`${LEVEL_LABELS[draft.level] || "Level"} default: ${levelDefault.durationDays} days`}>
                <Input
                  id="ce-days"
                  type="number"
                  min={1}
                  max={365}
                  value={draft.durationDays ?? ""}
                  onChange={(e) => set({ durationDays: e.target.value ? Math.max(1, Math.round(Number(e.target.value))) : null })}
                />
              </Field>
            </div>
            {(Number(draft.priceINR) !== levelDefault.priceINR || Number(draft.durationDays) !== levelDefault.durationDays) && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <span>
                  {LEVEL_LABELS[draft.level]} default: {formatINR(levelDefault.priceINR)} · {levelDefault.durationDays} days
                </span>
                <Button size="sm" variant="ghost" onClick={() => set({ priceINR: levelDefault.priceINR, durationDays: levelDefault.durationDays })}>
                  Use default
                </Button>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Capacity" htmlFor="ce-cap" hint="Seats. Empty = no limit.">
                <Input id="ce-cap" type="number" min={0} value={draft.capacity ?? ""} onChange={(e) => set({ capacity: e.target.value ? Math.max(0, Math.round(Number(e.target.value))) : null })} />
              </Field>
              <Field label="Enrolment opens" htmlFor="ce-opens">
                <Input id="ce-opens" type="date" value={toDateInput(draft.enrolmentOpensAt)} onChange={(e) => set({ enrolmentOpensAt: fromDateInput(e.target.value) })} />
              </Field>
              <Field label="Enrolment closes" htmlFor="ce-closes" error={datesInvalid ? "Must be after the open date." : undefined}>
                <Input id="ce-closes" type="date" value={toDateInput(draft.enrolmentClosesAt)} onChange={(e) => set({ enrolmentClosesAt: fromDateInput(e.target.value, true) })} />
              </Field>
            </div>
          </Section>

          <Section title="Cover" description="Generative art, no images needed.">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_200px]">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Cover presets">
                  {COVER_PRESETS.map((p) => {
                    const on = cover.from === p.from && cover.to === p.to;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        title={p.name}
                        aria-label={`Cover preset ${p.name}`}
                        aria-pressed={on}
                        onClick={() => set({ cover: { ...cover, from: p.from, to: p.to } })}
                        className={cn("size-8 cursor-pointer rounded-lg ring-offset-2 ring-offset-surface transition-shadow", on ? "ring-2 ring-fg" : "hover:ring-1 hover:ring-line-strong")}
                        style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                      />
                    );
                  })}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="From" htmlFor="ce-from">
                    <input id="ce-from" type="color" value={cover.from} onChange={(e) => set({ cover: { ...cover, from: e.target.value } })} className="h-11 w-full cursor-pointer rounded-xl border border-line bg-surface p-1" />
                  </Field>
                  <Field label="To" htmlFor="ce-to">
                    <input id="ce-to" type="color" value={cover.to} onChange={(e) => set({ cover: { ...cover, to: e.target.value } })} className="h-11 w-full cursor-pointer rounded-xl border border-line bg-surface p-1" />
                  </Field>
                  <Field label="Pattern" htmlFor="ce-pattern">
                    <Select id="ce-pattern" value={cover.pattern || "dots"} onChange={(e) => set({ cover: { ...cover, pattern: e.target.value } })}>
                      {PATTERNS.map((p) => (
                        <option key={p} value={p} className="capitalize">
                          {p}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>
              <CourseCover cover={cover} title={draft.title} className="aspect-4/3 rounded-xl sm:aspect-auto sm:h-full sm:min-h-36" />
            </div>
          </Section>

          <Section title="Outcomes" description="Tools taught, what learners make and what they need first.">
            <Field label="Tools and topics" htmlFor="ce-skills" hint="Press Enter or comma to add.">
              <TagInput id="ce-skills" value={draft.skills || []} onChange={(skills) => set({ skills })} suggestions={SKILL_SUGGESTIONS} />
            </Field>
            <div className="space-y-2">
              <Label>What you will make</Label>
              <ListEditor value={draft.whatYouBuild || []} onChange={(whatYouBuild) => set({ whatYouBuild })} placeholder="A portfolio site for a Jaipur bakery" addLabel="Add project" />
            </div>
            <div className="space-y-2">
              <Label>Prerequisites</Label>
              <ListEditor value={draft.requirements || []} onChange={(requirements) => set({ requirements })} placeholder="A laptop with Chrome" addLabel="Add prerequisite" />
            </div>
          </Section>

          <Section
            title="Curriculum"
            description={`${modules.length} modules · ${stats.lessons} lessons · ${formatDuration(stats.minutes)}`}
            action={
              <Button size="sm" variant="outline" leftIcon={Plus} onClick={() => setModules([...modules, { id: newId("mod"), title: `Module ${modules.length + 1}`, order: modules.length + 1, lessons: [] }])}>
                Add module
              </Button>
            }
          >
            {!modules.length ? (
              <EmptyState
                icon={Layers}
                title="No modules yet"
                description="Group lessons into modules like 'HTML basics' or 'Your first client brief'."
                action={
                  <Button leftIcon={Plus} onClick={() => setModules([{ id: newId("mod"), title: "Getting started", order: 1, lessons: [] }])}>
                    Add first module
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {modules.map((m, i) => (
                  <ModuleCard
                    key={m.id}
                    mod={m}
                    index={i}
                    count={modules.length}
                    onChange={(patch) => updateModule(m.id, patch)}
                    onMove={(d) => setModules(move(modules, i, d))}
                    onDelete={() => (m.lessons?.length ? setDeleteModule(m) : setModules(modules.filter((x) => x.id !== m.id)))}
                    onEditLesson={setEditing}
                  />
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* preview rail */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <CourseCover cover={cover} title={draft.title} className="aspect-16/10" />
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {track && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs text-fg/80">
                    <span className="size-1.5 rounded-full" style={{ background: track.color }} />
                    {track.title}
                  </span>
                )}
                {levelLabel && <Tag>{levelLabel}</Tag>}
                {statusMeta && <Status tone={statusMeta.tone}>{statusMeta.label}</Status>}
              </div>
              {skill && <p className="text-xs text-muted">{skill.categoryName} · {skill.name}</p>}
              <p className="line-clamp-2 text-sm text-muted">{draft.outcome || draft.subtitle || "Add a one-line outcome for the course card."}</p>
              <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <Clock className="size-3.5" /> {draft.durationDays ? `${draft.durationDays} days` : formatDuration(stats.minutes)}
                </span>
                <span className="text-right">
                  <span className="block font-medium text-fg tabular-nums">{Number(draft.priceINR) === 0 ? "Free" : formatINR(draft.priceINR)}</span>
                  {Number(draft.priceINR) > 0 && <span className="block text-[11px] text-subtle">+ {gst}% GST</span>}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="mb-3 text-xs font-medium text-muted">Curriculum mix</p>
            <div className="space-y-2">
              {stats.byType.map((t) => {
                const Icon = LESSON_ICONS[t.value];
                return (
                  <div key={t.value} className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 text-muted">
                      <Icon className="size-4 text-subtle" strokeWidth={1.75} /> {t.label}
                    </span>
                    <span className="text-fg tabular-nums">{t.count}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between border-t border-line pt-2 text-sm">
                <span className="inline-flex items-center gap-2 text-muted">
                  <Eye className="size-4 text-subtle" strokeWidth={1.75} /> Free previews
                </span>
                <span className="text-fg tabular-nums">{stats.previews}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* sticky save bar */}
      <div className="sticky bottom-4 z-20 mt-6 lg:mr-[324px]">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border bg-surface/95 py-2 pr-2 pl-4 backdrop-blur transition-shadow",
            dirty ? "border-line-strong shadow-lg" : "border-line shadow-sm",
          )}
        >
          <p className="flex min-w-0 items-center gap-2 text-sm text-muted" aria-live="polite">
            <span className={cn("size-1.5 shrink-0 rounded-full", dirty ? "bg-warning" : "bg-success")} />
            <span className="truncate">{dirty ? "Unsaved changes" : "All changes saved"}</span>
          </p>
          <div className="ml-auto flex shrink-0 gap-1.5">
            {dirty && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={RotateCcw}
                onClick={() => {
                  setDraft(JSON.parse(baseline));
                  setEditing(null);
                }}
              >
                Discard
              </Button>
            )}
            <Button size="sm" disabled={!dirty} loading={save.isPending} onClick={onSave}>
              Save course
            </Button>
          </div>
        </div>
      </div>

      <LessonEditor lesson={editingLesson?.lesson} open={!!editingLesson} onOpenChange={(o) => !o && setEditing(null)} onChange={patchLesson} />

      <ConfirmDialog
        open={!!deleteModule}
        onOpenChange={(o) => !o && setDeleteModule(null)}
        title={`Delete "${deleteModule?.title}"?`}
        description={`Its ${deleteModule?.lessons?.length || 0} lessons go with it. You can still discard before saving.`}
        confirmLabel="Delete module"
        onConfirm={() => {
          setModules(modules.filter((x) => x.id !== deleteModule.id));
          setDeleteModule(null);
        }}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/admin/courses" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
      <ArrowLeft className="size-4" /> All courses
    </Link>
  );
}
