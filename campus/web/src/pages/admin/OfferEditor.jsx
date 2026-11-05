import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CircleSlash, Plus, Send, Trash2, UserSearch } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Skeleton, Textarea } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/overlays";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { AdminHeader, ListEditor, Panel, TagInput } from "@/components/admin/kit";
import { OfferBody, OfferFacts } from "@/components/projects/parts";
import { LEVELS, LEVEL_LABEL, fromLocalInput, toLocalInput } from "@/components/projects/meta";

const DEFAULT_CONFIDENTIALITY =
  "Client files and details are confidential. Do not share them or use them in your portfolio without written permission. Work you deliver and are paid for belongs to the client.";

const blank = {
  title: "",
  summary: "",
  catalanceProjectId: "",
  skillId: "",
  level: "",
  deliverables: [""],
  acceptanceCriteria: [""],
  expectedHours: "",
  deadline: "",
  milestones: [],
  payoutINR: "",
  revisionLimit: "2",
  tools: [],
  confidentiality: DEFAULT_CONFIDENTIALITY,
  shortlistReason: "",
};

const fromOffer = (o, { keepReason = true } = {}) => ({
  title: o.title || "",
  summary: o.summary || "",
  catalanceProjectId: o.catalanceProjectId || "",
  skillId: o.skillId || o.skill?.id || "",
  level: o.level || "",
  deliverables: o.deliverables?.length ? o.deliverables : [""],
  acceptanceCriteria: o.acceptanceCriteria?.length ? o.acceptanceCriteria : [""],
  expectedHours: o.expectedHours ? String(o.expectedHours) : "",
  deadline: o.deadline && new Date(o.deadline) > new Date() ? toLocalInput(o.deadline) : "",
  milestones: (o.milestones || []).map((m) => ({ id: m.id, title: m.title, dueAt: m.dueAt && new Date(m.dueAt) > new Date() ? toLocalInput(m.dueAt) : "", status: m.status })),
  payoutINR: o.payoutINR ? String(o.payoutINR) : "",
  revisionLimit: String(o.revisionLimit ?? 2),
  tools: o.tools || [],
  confidentiality: o.confidentiality || DEFAULT_CONFIDENTIALITY,
  shortlistReason: keepReason ? o.shortlistReason || "" : "",
});

/** Create or edit a project offer (spec §5.3 step 3). The right column is exactly what the student will see, incl. the payout. */
export default function AdminOfferEditor() {
  const { offerId } = useParams();
  const editing = Boolean(offerId);
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const copyFrom = params.get("from");

  const existing = useQuery({ queryKey: ["pm-offer", offerId], queryFn: () => api.get(`/api/pm/offers/${offerId}`), enabled: editing });
  const source = useQuery({ queryKey: ["pm-offer", copyFrom], queryFn: () => api.get(`/api/pm/offers/${copyFrom}`), enabled: !editing && Boolean(copyFrom) });
  const studentId = editing ? existing.data?.studentId : params.get("studentId");
  const candidate = useQuery({
    queryKey: ["pm-talent", { studentId }],
    queryFn: () => api.get(`/api/pm/talent?studentId=${encodeURIComponent(studentId)}`).then((rows) => rows[0] || null),
    enabled: Boolean(studentId),
  });

  const [form, setForm] = useState(null);
  useEffect(() => {
    if (form) return;
    if (editing && existing.data) setForm(fromOffer(existing.data));
    if (!editing && (!copyFrom || source.data || source.error)) {
      const base = source.data ? fromOffer(source.data, { keepReason: false }) : blank;
      setForm({
        ...base,
        skillId: params.get("skillId") || base.skillId,
        level: params.get("level") || base.level,
        shortlistReason: location.state?.shortlistReason || "",
      });
    }
  }, [editing, existing.data, source.data, source.error, copyFrom, form, params, location.state]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const verifications = candidate.data?.verifications || [];
  const skillChoices = useMemo(() => {
    const m = new Map();
    for (const v of verifications) m.set(v.skill.id, v.skill);
    if (form?.skillId && !m.has(form.skillId)) {
      const s = existing.data?.skill || source.data?.skill;
      if (s) m.set(s.id, s);
    }
    return [...m.values()];
  }, [verifications, form?.skillId, existing.data, source.data]);

  const errors = form ? validate(form) : {};
  const firstError = Object.values(errors)[0];

  const payload = () => ({
    title: form.title.trim(),
    summary: form.summary.trim(),
    catalanceProjectId: form.catalanceProjectId.trim() || null,
    skillId: form.skillId,
    level: form.level,
    deliverables: form.deliverables.map((s) => s.trim()).filter(Boolean),
    acceptanceCriteria: form.acceptanceCriteria.map((s) => s.trim()).filter(Boolean),
    expectedHours: Number(form.expectedHours),
    deadline: fromLocalInput(form.deadline),
    milestones: form.milestones.filter((m) => m.title.trim()).map((m) => ({ ...(m.id ? { id: m.id } : {}), title: m.title.trim(), dueAt: fromLocalInput(m.dueAt), ...(m.status ? { status: m.status } : {}) })),
    payoutINR: Number(form.payoutINR),
    revisionLimit: Number(form.revisionLimit),
    tools: form.tools,
    confidentiality: form.confidentiality.trim(),
    shortlistReason: form.shortlistReason.trim(),
  });

  const save = useMutation({
    mutationFn: () => (editing ? api.put(`/api/pm/offers/${offerId}`, payload()) : api.post("/api/pm/offers", { ...payload(), studentId })),
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: ["pm-offers"] });
      qc.invalidateQueries({ queryKey: ["pm-talent"] });
      qc.setQueryData(["pm-offer", o.id], o);
      toast.success(editing ? "Offer updated. The student was notified." : "Offer sent");
      navigate(`/admin/offers/${o.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (editing && existing.error?.status === 404) return <EmptyState icon={CircleSlash} title="Offer not found" description="It doesn't exist or isn't one of yours." action={<Button variant="outline" to="/admin/offers">Project offers</Button>} />;
  if (editing && existing.error) return <ErrorState error={existing.error} onRetry={existing.refetch} />;
  if (!editing && !studentId)
    return (
      <EmptyState
        icon={UserSearch}
        title="Pick a verified student first"
        description="Offers go to one verified student. Shortlist someone in Verified talent."
        action={<Button to={`/admin/talent${copyFrom ? `?from=${copyFrom}` : ""}`}>Find talent</Button>}
      />
    );
  if (editing && existing.data && existing.data.status !== "OFFERED")
    return <EmptyState icon={CircleSlash} title="This offer can't be edited" description="Only open offers can change. The student has already answered or it expired." action={<Button variant="outline" to={`/admin/offers/${offerId}`}>View offer</Button>} />;
  if (!form || candidate.isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-96" />
      </div>
    );
  if (!editing && candidate.data === null)
    return <EmptyState icon={CircleSlash} title="Student not eligible" description="This student has no active verification, or is suspended." action={<Button to="/admin/talent">Find talent</Button>} />;

  const preview = {
    ...payload(),
    payoutINR: Number(form.payoutINR) || 0,
    expectedHours: Number(form.expectedHours) || null,
    revisionsUsed: 0,
    milestones: payload().milestones.map((m, i) => ({ id: m.id || `p${i}`, ...m, status: m.status || "PENDING" })),
  };
  const student = candidate.data?.user || existing.data?.student;

  return (
    <div>
      <AdminHeader
        title={editing ? "Edit offer" : "New project offer"}
        description={editing ? "Changing the payout notifies the student again." : "Exact task, hours, deadline and payout. The student accepts or declines."}
        crumbs={[{ label: "Project offers", to: "/admin/offers" }, { label: editing ? form.title || "Offer" : "New offer" }]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <form
          className="min-w-0 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (firstError) return toast.error(firstError);
            save.mutate();
          }}
        >
          {student && (
            <Panel title="Student">
              <div className="flex items-center gap-3">
                <Avatar name={student.name} src={student.avatarUrl} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{student.name}</p>
                  <p className="truncate text-xs text-muted">{[student.college?.shortName || student.college?.name, student.city].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
            </Panel>
          )}

          <Panel title="Task">
            <div className="space-y-4">
              <Field label="Title" htmlFor="of-title" error={form.title && errors.title}>
                <Input id="of-title" maxLength={140} value={form.title} onChange={(e) => set("title")(e.target.value)} placeholder="e.g. Landing page for a Jaipur bakery" />
              </Field>
              <Field label="Short description" htmlFor="of-summary">
                <Textarea id="of-summary" rows={3} maxLength={3000} value={form.summary} onChange={(e) => set("summary")(e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Skill" htmlFor="of-skill" hint="From the student's active verifications.">
                  <Select id="of-skill" value={form.skillId} onChange={(e) => set("skillId")(e.target.value)}>
                    <option value="">Pick a skill</option>
                    {skillChoices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Level" htmlFor="of-level">
                  <Select id="of-level" value={form.level} onChange={(e) => set("level")(e.target.value)}>
                    <option value="">Pick a level</option>
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {LEVEL_LABEL[l]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Catalance project id (optional)" htmlFor="of-cat" hint="Links this offer to the client project in Catalance. Only staff see it.">
                <Input id="of-cat" maxLength={100} value={form.catalanceProjectId} onChange={(e) => set("catalanceProjectId")(e.target.value)} placeholder="e.g. CAT-PRJ-20418" />
              </Field>
            </div>
          </Panel>

          <Panel title="Scope">
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium">Deliverables</p>
                <ListEditor value={form.deliverables} onChange={set("deliverables")} placeholder="e.g. Responsive one-page site" addLabel="Add deliverable" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Acceptance criteria</p>
                <ListEditor value={form.acceptanceCriteria} onChange={set("acceptanceCriteria")} placeholder="e.g. No horizontal scroll at 375px" addLabel="Add criterion" />
              </div>
              <Field label="Tools and access" htmlFor="of-tools">
                <TagInput id="of-tools" value={form.tools} onChange={set("tools")} placeholder="e.g. Figma, client GitHub repo" />
              </Field>
              <Field label="Confidentiality and IP" htmlFor="of-conf">
                <Textarea id="of-conf" rows={3} maxLength={3000} value={form.confidentiality} onChange={(e) => set("confidentiality")(e.target.value)} />
              </Field>
            </div>
          </Panel>

          <Panel title="Time and money">
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Payout to student (₹)" htmlFor="of-pay" error={form.payoutINR && errors.payoutINR}>
                  <Input id="of-pay" type="number" inputMode="numeric" min={1} value={form.payoutINR} onChange={(e) => set("payoutINR")(e.target.value)} />
                </Field>
                <Field label="Expected hours" htmlFor="of-hours" error={form.expectedHours && errors.expectedHours}>
                  <Input id="of-hours" type="number" inputMode="numeric" min={1} max={500} value={form.expectedHours} onChange={(e) => set("expectedHours")(e.target.value)} />
                </Field>
                <Field label="Deadline" htmlFor="of-deadline" error={form.deadline && errors.deadline}>
                  <Input id="of-deadline" type="datetime-local" value={form.deadline} onChange={(e) => set("deadline")(e.target.value)} />
                </Field>
                <Field label="Revision limit" htmlFor="of-rev">
                  <Select id="of-rev" value={form.revisionLimit} onChange={(e) => set("revisionLimit")(e.target.value)}>
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Milestones</p>
                <div className="space-y-2">
                  {form.milestones.map((m, i) => (
                    <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
                      <Input aria-label={`Milestone ${i + 1} title`} value={m.title} onChange={(e) => set("milestones")(form.milestones.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} placeholder="e.g. First draft" />
                      <Input aria-label={`Milestone ${i + 1} due`} type="datetime-local" className="col-span-1 sm:col-span-1" value={m.dueAt} onChange={(e) => set("milestones")(form.milestones.map((x, k) => (k === i ? { ...x, dueAt: e.target.value } : x)))} />
                      <Button type="button" variant="ghost" size="iconSm" aria-label={`Remove milestone ${i + 1}`} onClick={() => set("milestones")(form.milestones.filter((_, k) => k !== i))}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  {form.milestones.length < 12 && (
                    <Button type="button" variant="ghost" size="sm" leftIcon={Plus} onClick={() => set("milestones")([...form.milestones, { title: "", dueAt: "" }])}>
                      Add milestone
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Why this student" description="Required. Kept in the offer log (spec §13.3). Never shown to the student.">
            <Field label="Shortlist reason" htmlFor="of-reason" error={form.shortlistReason && errors.shortlistReason}>
              <Textarea id="of-reason" rows={3} maxLength={1000} value={form.shortlistReason} onChange={(e) => set("shortlistReason")(e.target.value)} placeholder="e.g. Verified Intermediate, 12 h/week free, similar portfolio piece." />
            </Field>
          </Panel>

          <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface/90 p-2.5 shadow-md backdrop-blur">
            <p className="px-2 text-sm text-muted">
              Student receives <span className="font-medium text-fg tabular-nums">{formatINR(Number(form.payoutINR) || 0)}</span>
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" leftIcon={Send} loading={save.isPending} disabled={Boolean(firstError)}>
                {editing ? "Save changes" : "Send offer"}
              </Button>
            </div>
          </div>
        </form>

        <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
          <p className="mb-3 px-1 text-xs text-muted">What the student sees</p>
          <div className="space-y-4 rounded-2xl border border-line bg-bg p-4 sm:p-5">
            <div>
              <p className="text-xs text-muted">{[skillChoices.find((s) => s.id === form.skillId)?.name, LEVEL_LABEL[form.level]].filter(Boolean).join(" · ") || "Skill · level"}</p>
              <p className="mt-1 text-lg leading-snug font-medium tracking-tight">{form.title || "Offer title"}</p>
            </div>
            <OfferFacts offer={preview} />
            <div className="rounded-xl border border-line bg-surface p-4">
              <OfferBody offer={preview} pmName="You" />
            </div>
            <p className="text-xs text-subtle">The student never sees the client price, split or platform share.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function validate(f) {
  const e = {};
  if (f.title.trim().length < 3) e.title = "Add a title (3+ characters).";
  if (!f.skillId) e.skillId = "Pick the skill.";
  if (!f.level) e.level = "Pick the level.";
  if (!f.deliverables.some((s) => s.trim())) e.deliverables = "Add at least one deliverable.";
  if (!f.acceptanceCriteria.some((s) => s.trim())) e.acceptanceCriteria = "Add at least one acceptance criterion.";
  const hours = Number(f.expectedHours);
  if (!Number.isInteger(hours) || hours < 1 || hours > 500) e.expectedHours = "Enter 1 to 500 hours.";
  if (!f.deadline) e.deadline = "Set a deadline.";
  else if (new Date(f.deadline) < new Date()) e.deadline = "The deadline must be in the future.";
  const pay = Number(f.payoutINR);
  if (!Number.isInteger(pay) || pay < 1) e.payoutINR = "Set the payout in whole rupees.";
  if (f.shortlistReason.trim().length < 10) e.shortlistReason = "Say why this student fits (10+ characters).";
  return e;
}
