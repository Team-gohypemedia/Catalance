import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ScrollText, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Skeleton, Textarea } from "@/components/ui/primitives";
import { Dialog, DialogContent, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { DataTable } from "@/components/admin/DataTable";
import { AdminHeader, Drawer, Panel, SectionLabel, Status, Tag } from "@/components/admin/kit";
import { levelLabel, weightShare } from "@/components/assessment/meta";

/* ───────────── rubric editor (saving always creates a new version) ───────────── */

const blankCriterion = () => ({ label: "", weight: 20, maxScore: 10, critical: false, guide: "" });

function RubricEditor({ rubric, onClose }) {
  const qc = useQueryClient();
  const [name, setName] = useState(rubric?.name || "");
  const [criteria, setCriteria] = useState(rubric?.criteria?.map((c) => ({ ...c })) || [blankCriterion(), blankCriterion()]);
  const set = (i, patch) => setCriteria((xs) => xs.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const totalWeight = criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);

  const save = useMutation({
    mutationFn: () =>
      api.post("/api/admin/rubrics", {
        key: rubric?.key,
        name: name.trim(),
        criteria: criteria.map((c) => ({ id: c.id, label: c.label.trim(), weight: Number(c.weight), maxScore: Number(c.maxScore), critical: Boolean(c.critical), guide: c.guide })),
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["admin", "rubrics"] });
      qc.invalidateQueries({ queryKey: ["admin", "assessments"] });
      toast.success(rubric ? `Saved as version ${r.version}. Past results keep their version.` : "Rubric created.");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("Name the rubric.");
    if (criteria.some((c) => !c.label.trim())) return toast.error("Every criterion needs a name.");
    if (criteria.some((c) => !(Number(c.weight) > 0) || !(Number(c.maxScore) > 0))) return toast.error("Weights and max scores must be above 0.");
    if (!criteria.some((c) => c.critical)) return toast.error("Mark at least one criterion as critical.");
    save.mutate();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg" title={rubric ? `New version of “${rubric.name}”` : "New rubric"} description={rubric ? `Currently version ${rubric.version}. Saving creates version ${rubric.version + 1}; assessments using this rubric move to it, and scored attempts keep the version they were scored with.` : "Criteria, weights and a scoring guide. Critical criteria must reach half their marks to pass."}>
        <form onSubmit={submit} className="space-y-5">
          <Field label="Name" htmlFor="rb-name">
            <Input id="rb-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Design project" />
          </Field>
          <div>
            <SectionLabel action={<span className="text-xs text-subtle tabular-nums">Total weight {totalWeight} · shown as %</span>}>Criteria</SectionLabel>
            <div className="space-y-3">
              {criteria.map((c, i) => (
                <div key={i} className="rounded-xl border border-line p-3 sm:p-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_88px_88px_auto]">
                    <Field label="Criterion" htmlFor={`rb-l-${i}`}>
                      <Input id={`rb-l-${i}`} value={c.label} onChange={(e) => set(i, { label: e.target.value })} placeholder="e.g. Meets the brief" />
                    </Field>
                    <Field label={`Weight (${totalWeight ? Math.round(((Number(c.weight) || 0) / totalWeight) * 100) : 0}%)`} htmlFor={`rb-w-${i}`}>
                      <Input id={`rb-w-${i}`} type="number" min={1} value={c.weight} onChange={(e) => set(i, { weight: e.target.value })} />
                    </Field>
                    <Field label="Max score" htmlFor={`rb-m-${i}`}>
                      <Input id={`rb-m-${i}`} type="number" min={1} value={c.maxScore} onChange={(e) => set(i, { maxScore: e.target.value })} />
                    </Field>
                    <div className="flex items-end gap-2 pb-1">
                      <label className="flex items-center gap-2 text-sm">
                        <Switch checked={Boolean(c.critical)} onCheckedChange={(v) => set(i, { critical: v })} aria-label={`Critical: ${c.label || `criterion ${i + 1}`}`} />
                        Critical
                      </label>
                      <Button type="button" size="iconSm" variant="ghost" aria-label="Remove criterion" disabled={criteria.length <= 1} onClick={() => setCriteria((xs) => xs.filter((_, k) => k !== i))}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <Field label="Scoring guide" htmlFor={`rb-g-${i}`} className="mt-3">
                    <Textarea id={`rb-g-${i}`} rows={2} value={c.guide} onChange={(e) => set(i, { guide: e.target.value })} placeholder="What full marks, half marks and zero look like." />
                  </Field>
                </div>
              ))}
            </div>
            {criteria.length < 20 && (
              <Button type="button" size="sm" variant="ghost" leftIcon={Plus} className="mt-2" onClick={() => setCriteria((xs) => [...xs, blankCriterion()])}>
                Add criterion
              </Button>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending}>
              {rubric ? `Save version ${rubric.version + 1}` : "Create rubric"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RubricsTab({ rubrics, onEdit }) {
  const groups = useMemo(() => {
    const byKey = new Map();
    for (const r of rubrics.data || []) byKey.set(r.key, [...(byKey.get(r.key) || []), r]);
    return [...byKey.values()].map((vs) => vs.sort((a, b) => b.version - a.version));
  }, [rubrics.data]);

  if (rubrics.isLoading) return <div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}</div>;
  if (rubrics.error) return <ErrorState error={rubrics.error} onRetry={rubrics.refetch} />;
  if (!groups.length) return <EmptyState icon={ScrollText} title="No rubrics yet" description="Create one to score assessments." action={<Button onClick={() => onEdit(null)}>New rubric</Button>} />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {groups.map(([latest, ...older]) => (
        <Panel
          key={latest.key}
          title={latest.name}
          description={`Version ${latest.version} · ${latest.assessmentsCount} course${latest.assessmentsCount === 1 ? "" : "s"} · ${latest.attemptsCount} attempt${latest.attemptsCount === 1 ? "" : "s"}`}
          action={
            <Button size="sm" variant="outline" onClick={() => onEdit(latest)}>
              New version
            </Button>
          }
        >
          <ul className="space-y-2">
            {latest.criteria.map((c) => (
              <li key={c.id} className="flex items-start gap-3 text-sm">
                <span className="w-9 shrink-0 text-muted tabular-nums">{weightShare(latest.criteria, c)}%</span>
                <span className="min-w-0 flex-1">
                  {c.label}
                  <span className="ml-1.5 text-xs text-subtle">/ {c.maxScore}</span>
                </span>
                {c.critical && <Status tone="warning">Critical</Status>}
              </li>
            ))}
          </ul>
          {older.length > 0 && (
            <p className="mt-4 border-t border-line pt-3 text-xs text-subtle">
              Earlier: {older.map((r) => `v${r.version} (${formatDate(r.createdAt)}, ${r.attemptsCount} attempts)`).join(" · ")}
            </p>
          )}
        </Panel>
      ))}
    </div>
  );
}

/* ───────────── per-course config ───────────── */

function ConfigDrawer({ row, rubrics, onClose }) {
  const qc = useQueryClient();
  const courseId = row.course.id;
  const cfg = useQuery({ queryKey: ["admin", "course-assessment", courseId], queryFn: () => api.get(`/api/admin/courses/${courseId}/assessment`) });
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (cfg.data && !form)
      setForm({
        title: cfg.data.title,
        brief: cfg.data.brief,
        instructions: cfg.data.instructions,
        allowedFormats: cfg.data.allowedFormats,
        rubricId: cfg.data.rubricId,
        passScore: cfg.data.passScore,
        maxAttempts: cfg.data.maxAttempts,
        reassessWindowDays: cfg.data.reassessWindowDays,
        dueDays: cfg.data.dueDays ?? "",
      });
  }, [cfg.data, form]);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const save = useMutation({
    mutationFn: () =>
      api.put(`/api/admin/courses/${courseId}/assessment`, {
        ...form,
        passScore: Number(form.passScore),
        maxAttempts: Number(form.maxAttempts),
        reassessWindowDays: Number(form.reassessWindowDays),
        dueDays: form.dueDays === "" ? null : Number(form.dueDays),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "assessments"] });
      qc.invalidateQueries({ queryKey: ["admin", "course-assessment", courseId] });
      toast.success("Assessment saved.");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  const latestRubrics = (rubrics || []).filter((r) => r.status === "ACTIVE" || r.id === form?.rubricId);
  const toggleFormat = (f) => set({ allowedFormats: form.allowedFormats.includes(f) ? form.allowedFormats.filter((x) => x !== f) : [...form.allowedFormats, f] });

  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      size="xl"
      title={row.course.title}
      description={`${levelLabel(row.course.level)} · ${row.course.skill?.name || "No skill linked"}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} disabled={!form} onClick={() => save.mutate()}>
            Save
          </Button>
        </div>
      }
    >
      {cfg.isLoading || !form ? (
        cfg.error ? <ErrorState error={cfg.error} onRetry={cfg.refetch} /> : <Skeleton className="h-96" />
      ) : (
        <div className="space-y-5">
          {!row.course.skill && <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">Link this course to a skill in Courses before approving verifications.</p>}
          <Field label="Title" htmlFor="cfg-title">
            <Input id="cfg-title" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Brief" htmlFor="cfg-brief" hint="Markdown. What the student builds and delivers.">
            <Textarea id="cfg-brief" rows={8} value={form.brief} onChange={(e) => set({ brief: e.target.value })} />
          </Field>
          <Field label="Instructions" htmlFor="cfg-instr">
            <Textarea id="cfg-instr" rows={3} value={form.instructions} onChange={(e) => set({ instructions: e.target.value })} />
          </Field>
          <div>
            <SectionLabel>Allowed formats</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {[
                ["link", "Links"],
                ["text", "Written note"],
                ["file", "Files (as links)"],
              ].map(([f, label]) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={form.allowedFormats.includes(f)}
                  onClick={() => toggleFormat(f)}
                  className={cn("rounded-full border px-3 py-1 text-sm transition-colors", form.allowedFormats.includes(f) ? "border-primary bg-primary-soft text-primary" : "border-line text-muted hover:text-fg")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Rubric" htmlFor="cfg-rubric" hint="New attempts use this version. Attempts already started keep theirs.">
            <Select id="cfg-rubric" value={form.rubricId} onChange={(e) => set({ rubricId: e.target.value })}>
              {latestRubrics.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · v{r.version}
                  {r.status !== "ACTIVE" ? " (superseded)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Pass mark" htmlFor="cfg-pass" hint="Out of 100">
              <Input id="cfg-pass" type="number" min={1} max={100} value={form.passScore} onChange={(e) => set({ passScore: e.target.value })} />
            </Field>
            <Field label="Attempts" htmlFor="cfg-att" hint="Incl. reassessments">
              <Input id="cfg-att" type="number" min={1} max={5} value={form.maxAttempts} onChange={(e) => set({ maxAttempts: e.target.value })} />
            </Field>
            <Field label="Retry window" htmlFor="cfg-win" hint="Days">
              <Input id="cfg-win" type="number" min={1} max={90} value={form.reassessWindowDays} onChange={(e) => set({ reassessWindowDays: e.target.value })} />
            </Field>
            <Field label="Due after" htmlFor="cfg-due" hint="Days from enrolment">
              <Input id="cfg-due" type="number" min={1} max={365} placeholder="None" value={form.dueDays} onChange={(e) => set({ dueDays: e.target.value })} />
            </Field>
          </div>
          {cfg.data?.id == null && <p className="text-xs text-muted">Not saved yet. These are the defaults from settings.</p>}
        </div>
      )}
    </Drawer>
  );
}

export default function AdminAssessments() {
  const [tab, setTab] = useState("courses");
  const [editing, setEditing] = useState(undefined); // undefined closed, null new, rubric = new version
  const [config, setConfig] = useState(null);
  const list = useQuery({ queryKey: ["admin", "assessments"], queryFn: () => api.get("/api/admin/assessments") });
  const rubrics = useQuery({ queryKey: ["admin", "rubrics"], queryFn: () => api.get("/api/admin/rubrics") });

  const columns = [
    {
      id: "course",
      header: "Course",
      sortValue: (r) => r.course.title,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.course.title}</p>
          <p className="truncate text-xs text-muted">
            {levelLabel(r.course.level)} · {r.course.skill?.name || "No skill"}
          </p>
        </div>
      ),
    },
    { id: "rubric", header: "Rubric", sortValue: (r) => r.assessment?.rubric?.name || "", cell: (r) => (r.assessment ? <span className="text-sm">{r.assessment.rubric?.name} <span className="text-subtle">v{r.assessment.rubric?.version}</span></span> : <Status>Default on first use</Status>) },
    {
      id: "rules",
      header: "Rules",
      cell: (r) => (r.assessment ? <span className="text-sm text-muted tabular-nums">{r.assessment.passScore}/100 · {r.assessment.maxAttempts} tries · {r.assessment.reassessWindowDays}d</span> : <span className="text-subtle">—</span>),
    },
    { id: "formats", header: "Formats", hideOnMobile: true, cell: (r) => <div className="flex flex-wrap gap-1">{(r.assessment?.allowedFormats || []).map((f) => <Tag key={f}>{f}</Tag>)}</div> },
    { id: "attempts", header: "Attempts", align: "right", sortValue: (r) => r.assessment?.attemptsCount || 0, cell: (r) => <span className="tabular-nums">{r.assessment?.attemptsCount || 0}</span> },
    {
      id: "action",
      header: <span className="sr-only">Action</span>,
      align: "right",
      hideOnMobile: true,
      cell: (r) => (
        <Button size="sm" variant="outline" onClick={(e) => (e.stopPropagation(), setConfig(r))}>
          Configure
        </Button>
      ),
    },
  ];

  return (
    <>
      <AdminHeader
        title="Assessments & rubrics"
        description="Each course has one practical assessment scored with a versioned rubric. Editing a rubric creates a new version; past scores never change."
        actions={
          tab === "rubrics" ? (
            <Button leftIcon={Plus} onClick={() => setEditing(null)}>
              New rubric
            </Button>
          ) : null
        }
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="rubrics">Rubrics</TabsTrigger>
        </TabsList>
        <TabsContent value="courses">
          <DataTable
            data={list.data}
            loading={list.isLoading}
            error={list.error}
            onRetry={list.refetch}
            columns={columns}
            initialSort={{ id: "course" }}
            onRowClick={setConfig}
            rowKey={(r) => r.course.id}
            search={{ placeholder: "Search course or skill…", text: (r) => [r.course.title, r.course.skill?.name].join(" ") }}
            empty={{ title: "No courses", description: "Add a course first." }}
          />
        </TabsContent>
        <TabsContent value="rubrics">
          <RubricsTab rubrics={rubrics} onEdit={setEditing} />
        </TabsContent>
      </Tabs>
      {editing !== undefined && <RubricEditor rubric={editing} onClose={() => setEditing(undefined)} />}
      {config && <ConfigDrawer row={config} rubrics={rubrics.data} onClose={() => setConfig(null)} />}
    </>
  );
}
