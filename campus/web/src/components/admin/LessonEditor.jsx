import { useState } from "react";
import { CheckCircle2, Circle, FileText, HelpCircle, ListChecks, Plus, PlayCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Label } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/overlays";
import { Drawer, IconBtn, Markdown } from "./kit";
import { LESSON_TYPES } from "./course-constants";

export const LESSON_ICONS = { VIDEO: PlayCircle, ARTICLE: FileText, QUIZ: HelpCircle, ASSIGNMENT: ListChecks };

export const newId = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function blankLesson(type = "ARTICLE") {
  const base = { id: newId("les"), title: "", type, durationMinutes: type === "QUIZ" ? 5 : type === "ASSIGNMENT" ? 30 : 10, isPreview: false, content: "", videoUrl: null, quiz: null, assignment: null };
  if (type === "QUIZ") base.quiz = { questions: [blankQuestion()] };
  if (type === "ASSIGNMENT")
    base.assignment = {
      brief: "",
      rubric: [
        { criterion: "Meets the brief", points: 40 },
        { criterion: "Quality of execution", points: 40 },
        { criterion: "Clarity of explanation", points: 20 },
      ],
      submissionType: "LINK",
    };
  return base;
}

function blankQuestion() {
  const options = [0, 1, 2, 3].map(() => ({ id: newId("opt"), text: "" }));
  return { id: newId("q"), prompt: "", options, correctOptionId: options[0].id, explanation: "" };
}

/** Markdown textarea with Write / Preview toggle. */
function MarkdownField({ id, label, hint, value, onChange, rows = 10, placeholder }) {
  const [mode, setMode] = useState("write");
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-xs font-medium" role="tablist" aria-label={`${label} mode`}>
          {["write", "preview"].map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn("cursor-pointer rounded-md px-2.5 py-1 capitalize text-muted transition-colors hover:text-fg", mode === m && "bg-surface-2 text-fg")}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {mode === "write" ? (
        <Textarea id={id} rows={rows} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="font-mono text-[13px]" />
      ) : (
        <div className="min-h-40 rounded-xl border border-line bg-surface-2/30 p-4">
          <Markdown>{value}</Markdown>
        </div>
      )}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

function QuizBuilder({ quiz, onChange }) {
  const questions = quiz?.questions || [];
  const setQ = (qid, patch) => onChange({ questions: questions.map((q) => (q.id === qid ? { ...q, ...patch } : q)) });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-fg">Questions <span className="text-subtle tabular-nums">{questions.length}</span></p>
        <Button type="button" size="sm" variant="outline" leftIcon={Plus} onClick={() => onChange({ questions: [...questions, blankQuestion()] })}>
          Question
        </Button>
      </div>
      {!questions.length && <p className="rounded-xl border border-dashed border-line-strong p-4 text-center text-sm text-muted">Add at least one question.</p>}
      {questions.map((q, qi) => (
        <div key={q.id} className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-start gap-2">
            <span className="mt-2.5 w-6 shrink-0 text-xs text-subtle tabular-nums">Q{qi + 1}</span>
            <Input aria-label={`Question ${qi + 1} prompt`} value={q.prompt} onChange={(e) => setQ(q.id, { prompt: e.target.value })} placeholder="What does useState return?" className="h-10" />
            <IconBtn label="Delete question" icon={Trash2} danger className="mt-1" onClick={() => onChange({ questions: questions.filter((x) => x.id !== q.id) })} />
          </div>
          <fieldset className="mt-3 space-y-2 pl-7">
            <legend className="sr-only">Options for question {qi + 1}</legend>
            {q.options.map((o, oi) => {
              const correct = q.correctOptionId === o.id;
              return (
                <div key={o.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQ(q.id, { correctOptionId: o.id })}
                    aria-label={correct ? `Option ${oi + 1} is correct` : `Mark option ${oi + 1} correct`}
                    aria-pressed={correct}
                    className={cn("shrink-0 cursor-pointer rounded-full", correct ? "text-success" : "text-subtle hover:text-fg")}
                  >
                    {correct ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                  </button>
                  <Input
                    aria-label={`Option ${oi + 1}`}
                    value={o.text}
                    onChange={(e) => setQ(q.id, { options: q.options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)) })}
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    className={cn("h-9", correct && "border-success/50")}
                  />
                  <IconBtn
                    label={`Remove option ${oi + 1}`}
                    icon={Trash2}
                    disabled={q.options.length <= 2}
                    onClick={() => {
                      const options = q.options.filter((x) => x.id !== o.id);
                      setQ(q.id, { options, correctOptionId: correct ? options[0].id : q.correctOptionId });
                    }}
                  />
                </div>
              );
            })}
            {q.options.length < 6 && (
              <button type="button" onClick={() => setQ(q.id, { options: [...q.options, { id: newId("opt"), text: "" }] })} className="ml-7 cursor-pointer rounded-md px-1.5 py-0.5 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-fg">
                + Add option
              </button>
            )}
          </fieldset>
          <div className="mt-3 pl-7">
            <Input aria-label={`Explanation for question ${qi + 1}`} value={q.explanation} onChange={(e) => setQ(q.id, { explanation: e.target.value })} placeholder="Why is this the right answer? Shown after the attempt." className="h-9 text-xs" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AssignmentBuilder({ assignment, onChange }) {
  const a = assignment || { brief: "", rubric: [], submissionType: "LINK" };
  const set = (patch) => onChange({ ...a, ...patch });
  const total = a.rubric.reduce((s, r) => s + (Number(r.points) || 0), 0);
  return (
    <div className="space-y-5">
      <MarkdownField id="as-brief" label="Assignment brief" value={a.brief} onChange={(brief) => set({ brief })} rows={8} placeholder={"## Your task\nBuild a landing page for a local chai brand…"} />
      <Field label="Students submit" htmlFor="as-type">
        <Select id="as-type" value={a.submissionType} onChange={(e) => set({ submissionType: e.target.value })}>
          <option value="LINK">A link (GitHub, Figma, Drive…)</option>
          <option value="TEXT">Written text</option>
        </Select>
      </Field>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Rubric</Label>
          <span className={cn("text-xs tabular-nums", total === 100 ? "text-muted" : "text-warning")}>{total} / 100 pts</span>
        </div>
        <div className="space-y-2">
          {a.rubric.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input aria-label={`Criterion ${i + 1}`} value={r.criterion} onChange={(e) => set({ rubric: a.rubric.map((x, k) => (k === i ? { ...x, criterion: e.target.value } : x)) })} placeholder="Criterion" className="h-10" />
              <Input
                aria-label={`Points for criterion ${i + 1}`}
                type="number"
                min={0}
                value={r.points}
                onChange={(e) => set({ rubric: a.rubric.map((x, k) => (k === i ? { ...x, points: Number(e.target.value) } : x)) })}
                className="h-10 w-20 shrink-0"
              />
              <IconBtn label={`Remove criterion ${i + 1}`} icon={Trash2} danger onClick={() => set({ rubric: a.rubric.filter((_, k) => k !== i) })} />
            </div>
          ))}
        </div>
        <Button type="button" size="sm" variant="outline" className="mt-2" leftIcon={Plus} onClick={() => set({ rubric: [...a.rubric, { criterion: "", points: 10 }] })}>
          Criterion
        </Button>
      </div>
    </div>
  );
}

/** Side-sheet lesson editor. Edits apply live to the draft via onChange(patch). */
export function LessonEditor({ lesson, open, onOpenChange, onChange }) {
  if (!lesson) return null;
  const Icon = LESSON_ICONS[lesson.type] || FileText;
  const changeType = (type) => {
    const patch = { type };
    if (type === "QUIZ" && !lesson.quiz) patch.quiz = blankLesson("QUIZ").quiz;
    if (type === "ASSIGNMENT" && !lesson.assignment) patch.assignment = blankLesson("ASSIGNMENT").assignment;
    onChange(patch);
  };
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-muted" strokeWidth={1.75} /> <span className="truncate">{lesson.title || "Untitled lesson"}</span>
        </span>
      }
      description="Changes apply to the draft. Save the course to publish them."
      footer={
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Lesson title" htmlFor="le-title">
          <Input id="le-title" value={lesson.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="e.g. Flexbox in 10 minutes" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Type" htmlFor="le-type">
            <Select id="le-type" value={lesson.type} onChange={(e) => changeType(e.target.value)}>
              {LESSON_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Duration (min)" htmlFor="le-dur">
            <Input id="le-dur" type="number" min={1} value={lesson.durationMinutes} onChange={(e) => onChange({ durationMinutes: Number(e.target.value) })} />
          </Field>
          <div className="space-y-1.5">
            <Label htmlFor="le-preview">Free preview</Label>
            <div className="flex h-11 items-center gap-2.5">
              <Switch id="le-preview" checked={!!lesson.isPreview} onCheckedChange={(v) => onChange({ isPreview: v })} />
              <span className="text-sm text-muted">{lesson.isPreview ? "Anyone can watch" : "Enrolled only"}</span>
            </div>
          </div>
        </div>
        {lesson.type === "VIDEO" && (
          <Field label="Video URL" htmlFor="le-video" hint="YouTube, Vimeo or an MP4 link. Leave empty to show the article only.">
            <Input id="le-video" value={lesson.videoUrl || ""} onChange={(e) => onChange({ videoUrl: e.target.value || null })} placeholder="https://…" />
          </Field>
        )}
        <MarkdownField
          id="le-content"
          label={lesson.type === "VIDEO" ? "Notes (markdown)" : lesson.type === "ARTICLE" ? "Article (markdown)" : "Intro (markdown)"}
          value={lesson.content}
          onChange={(content) => onChange({ content })}
          rows={lesson.type === "ARTICLE" ? 14 : 6}
          placeholder={"## What you'll learn\n- …"}
        />
        {lesson.type === "QUIZ" && (
          <div className="border-t border-line pt-5">
            <QuizBuilder quiz={lesson.quiz} onChange={(quiz) => onChange({ quiz })} />
          </div>
        )}
        {lesson.type === "ASSIGNMENT" && (
          <div className="border-t border-line pt-5">
            <AssignmentBuilder assignment={lesson.assignment} onChange={(assignment) => onChange({ assignment })} />
          </div>
        )}
      </div>
    </Drawer>
  );
}
