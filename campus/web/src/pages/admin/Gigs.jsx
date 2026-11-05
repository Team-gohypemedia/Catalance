import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Briefcase, Pencil, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatDate, formatINR, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/primitives";
import { Avatar, Switch, Tooltip } from "@/components/ui/overlays";
import { DataTable, Segmented } from "@/components/admin/DataTable";
import { AdminHeader, CompanyMark, Drawer, IconBtn, ListEditor, Markdown, Status, TagInput } from "@/components/admin/kit";

const CATEGORIES = [
  ["web-development", "Web development"],
  ["app-development", "App development"],
  ["ui-ux-design", "UI/UX design"],
  ["data-analytics", "Data analytics"],
  ["ai-automation", "AI & automation"],
  ["digital-marketing", "Digital marketing"],
  ["content-writing", "Content writing"],
  ["graphic-design", "Graphic design"],
  ["video-editing", "Video editing"],
];
const prettify = (v) => v.charAt(0).toUpperCase() + v.slice(1).replace(/-/g, " ");
const categoryLabel = (v) => CATEGORIES.find(([k]) => k === v)?.[1] || (v ? prettify(v) : "—");
const DIFFICULTY = { EASY: { label: "Easy", tone: "success" }, MEDIUM: { label: "Medium", tone: "warning" }, HARD: { label: "Hard", tone: "danger" } };
const LOGO_COLORS = ["#FF5A1F", "#6B4EFF", "#12A150", "#1F9BFF", "#D98E00", "#E5484D", "#3CC6C0", "#14121F"];

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

function emptyGig() {
  return {
    title: "",
    company: { name: "", logoColor: LOGO_COLORS[0] },
    category: "web-development",
    skills: [],
    payoutINR: 800,
    durationDays: 5,
    difficulty: "EASY",
    minStage: 3,
    status: "OPEN",
    spots: 3,
    deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    description: "",
    deliverables: [""],
    mentorId: "",
  };
}

function GigForm({ open, onOpenChange, initial, mentors }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(initial);
  const [tab, setTab] = useState("write");
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const isEdit = !!initial?.id;

  const save = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        deliverables: form.deliverables.map((d) => d.trim()).filter(Boolean),
        mentorId: form.mentorId || null,
        payoutINR: Number(form.payoutINR),
        durationDays: Number(form.durationDays),
        spots: Number(form.spots),
        minStage: Number(form.minStage),
      };
      // eslint-disable-next-line no-unused-vars
      const { mentor, myApplication, applicantsCount, createdAt, updatedAt, id, ...fields } = body;
      return isEdit ? api.put(`/api/admin/gigs/${initial.id}`, fields) : api.post("/api/admin/gigs", fields);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "gigs"] });
      qc.invalidateQueries({ queryKey: ["gigs"] });
      toast.success(isEdit ? "Gig updated" : "Gig is live on the board");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Give the gig a title.");
    if (!form.company.name.trim()) return toast.error("Add the client's name.");
    if (Number(form.payoutINR) <= 0) return toast.error("Payout must be more than ₹0.");
    save.mutate();
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={isEdit ? "Edit gig" : "New micro-gig"}
      description="Real, paid work (₹200–₹1,500) done under a mentor."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="gig-form" loading={save.isPending}>
            {isEdit ? "Save changes" : "Publish gig"}
          </Button>
        </div>
      }
    >
      <form id="gig-form" onSubmit={submit} className="space-y-5">
        <Field label="Title" htmlFor="g-title">
          <Input id="g-title" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Design 5 Instagram posts for a Nagpur café" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field label="Client" htmlFor="g-company">
            <Input id="g-company" value={form.company.name} onChange={(e) => set({ company: { ...form.company, name: e.target.value } })} placeholder="Chai Point Nagpur" />
          </Field>
          <div className="space-y-1.5">
            <Label>Logo color</Label>
            <div className="flex h-11 items-center gap-1.5">
              {LOGO_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Logo color ${c}`}
                  aria-pressed={form.company.logoColor === c}
                  onClick={() => set({ company: { ...form.company, logoColor: c } })}
                  className={`size-6 cursor-pointer rounded-full ring-offset-2 ring-offset-surface ${form.company.logoColor === c ? "ring-2 ring-fg" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category" htmlFor="g-cat">
            <Select id="g-cat" value={form.category} onChange={(e) => set({ category: e.target.value })}>
              {CATEGORIES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Difficulty" htmlFor="g-diff">
            <Select id="g-diff" value={form.difficulty} onChange={(e) => set({ difficulty: e.target.value })}>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </Select>
          </Field>
          <Field label="Min. ladder stage" htmlFor="g-stage">
            <Select id="g-stage" value={form.minStage} onChange={(e) => set({ minStage: Number(e.target.value) })}>
              <option value={3}>3 · Micro-gig</option>
              <option value={4}>4 · Real project</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Payout (₹)" htmlFor="g-pay">
            <Input id="g-pay" type="number" min={0} step={50} value={form.payoutINR} onChange={(e) => set({ payoutINR: e.target.value })} />
          </Field>
          <Field label="Duration (days)" htmlFor="g-dur">
            <Input id="g-dur" type="number" min={1} value={form.durationDays} onChange={(e) => set({ durationDays: e.target.value })} />
          </Field>
          <Field label="Spots" htmlFor="g-spots">
            <Input id="g-spots" type="number" min={1} value={form.spots} onChange={(e) => set({ spots: e.target.value })} />
          </Field>
          <Field label="Deadline" htmlFor="g-deadline">
            <Input id="g-deadline" type="date" value={toDateInput(form.deadline)} onChange={(e) => set({ deadline: e.target.value ? new Date(`${e.target.value}T23:59:00`).toISOString() : form.deadline })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Reviewing mentor" htmlFor="g-mentor">
            <Select id="g-mentor" value={form.mentorId || ""} onChange={(e) => set({ mentorId: e.target.value })}>
              <option value="">No mentor yet</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="space-y-1.5">
            <Label htmlFor="g-open">Status</Label>
            <div className="flex h-11 items-center gap-3 rounded-xl border border-line bg-surface px-3.5">
              <Switch id="g-open" checked={form.status === "OPEN"} onCheckedChange={(v) => set({ status: v ? "OPEN" : "CLOSED" })} />
              <span className="text-sm text-muted">{form.status === "OPEN" ? "Open for applications" : "Closed"}</span>
            </div>
          </div>
        </div>
        <Field label="Skills" htmlFor="g-skills">
          <TagInput id="g-skills" value={form.skills} onChange={(skills) => set({ skills })} suggestions={["Canva", "Figma", "React", "Copywriting", "SEO", "Premiere Pro", "Excel", "Instagram Ads"]} />
        </Field>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="g-desc">Brief (markdown)</Label>
            <Segmented value={tab} onChange={setTab} label="Brief mode" options={[{ value: "write", label: "Write" }, { value: "preview", label: "Preview" }]} />
          </div>
          {tab === "write" ? (
            <textarea
              id="g-desc"
              rows={7}
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder={"The café is launching a monsoon menu…\n\n**Tone:** warm, local, a bit of Hinglish."}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 font-mono text-[13px] leading-relaxed text-fg placeholder:text-subtle focus:border-primary focus:ring-4 focus:ring-[var(--ring)] focus:outline-none"
            />
          ) : (
            <div className="min-h-32 rounded-xl border border-line bg-surface-2/30 p-4">
              <Markdown>{form.description}</Markdown>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Deliverables</Label>
          <ListEditor value={form.deliverables} onChange={(deliverables) => set({ deliverables })} placeholder="5 square posts as PNG + editable Canva link" addLabel="Add deliverable" />
        </div>
      </form>
    </Drawer>
  );
}

export default function Gigs() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("ALL");
  const [editing, setEditing] = useState(null);

  const gigs = useQuery({ queryKey: ["admin", "gigs"], queryFn: () => api.get("/api/admin/gigs") });
  const mentors = useQuery({ queryKey: ["admin", "mentors"], queryFn: () => api.get("/api/admin/mentors") });

  const toggle = useMutation({
    mutationFn: (g) => api.put(`/api/admin/gigs/${g.id}`, { status: g.status === "OPEN" ? "CLOSED" : "OPEN" }),
    onMutate: async (g) => {
      await qc.cancelQueries({ queryKey: ["admin", "gigs"] });
      const prev = qc.getQueryData(["admin", "gigs"]);
      qc.setQueryData(["admin", "gigs"], (list = []) => list.map((x) => (x.id === g.id ? { ...x, status: g.status === "OPEN" ? "CLOSED" : "OPEN" } : x)));
      return { prev };
    },
    onSuccess: (g) => toast.success(g.status === "OPEN" ? `"${g.title}" is open` : `"${g.title}" closed`),
    onError: (e, _g, ctx) => {
      qc.setQueryData(["admin", "gigs"], ctx?.prev);
      toast.error(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "gigs"] }),
  });

  const all = gigs.data || [];
  const rows = useMemo(() => all.filter((g) => status === "ALL" || g.status === status), [all, status]);
  const openCount = all.filter((g) => g.status === "OPEN").length;
  const openValue = all.filter((g) => g.status === "OPEN").reduce((s, g) => s + (g.payoutINR || 0) * (g.spots || 1), 0);

  const columns = [
    {
      id: "title",
      header: "Gig",
      sortValue: (g) => g.title,
      cell: (g) => (
        <div className="flex min-w-0 items-center gap-3">
          <CompanyMark company={g.company} />
          <div className="min-w-0">
            <p className="truncate font-medium md:max-w-[280px]">{g.title}</p>
            <p className="truncate text-xs text-muted">
              {g.company?.name} · {categoryLabel(g.category)}
            </p>
          </div>
        </div>
      ),
    },
    { id: "payout", header: "Payout", align: "right", sortValue: (g) => g.payoutINR, cell: (g) => <span className="whitespace-nowrap tabular-nums">{formatINR(g.payoutINR)}</span> },
    {
      id: "difficulty",
      header: "Level",
      sortValue: (g) => ["EASY", "MEDIUM", "HARD"].indexOf(g.difficulty),
      cell: (g) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Status tone={DIFFICULTY[g.difficulty]?.tone}>{DIFFICULTY[g.difficulty]?.label || g.difficulty}</Status>
          <span className="text-xs text-subtle">Stage {g.minStage}+</span>
        </span>
      ),
    },
    {
      id: "applicants",
      header: "Applicants",
      align: "right",
      sortValue: (g) => g.applicantsCount || 0,
      cell: (g) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatNumber(g.applicantsCount)} <span className="text-subtle">/ {g.spots}</span>
        </span>
      ),
    },
    { id: "deadline", header: "Deadline", sortValue: (g) => g.deadline || "", cell: (g) => <span className="whitespace-nowrap text-muted">{formatDate(g.deadline, { day: "numeric", month: "short" })}</span> },
    {
      id: "mentor",
      header: "Mentor",
      hideOnMobile: true,
      sortValue: (g) => g.mentor?.name || "",
      cell: (g) =>
        g.mentor ? (
          <Tooltip content={g.mentor.name}>
            <span className="inline-flex">
              <Avatar name={g.mentor.name} src={g.mentor.avatarUrl} size="xs" />
            </span>
          </Tooltip>
        ) : (
          <span className="text-xs text-subtle">—</span>
        ),
    },
    {
      id: "status",
      header: "Open",
      align: "right",
      sortValue: (g) => g.status,
      cell: (g) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Switch checked={g.status === "OPEN"} onCheckedChange={() => toggle.mutate(g)} aria-label={g.status === "OPEN" ? `Close ${g.title}` : `Open ${g.title}`} />
          <IconBtn label={`Edit ${g.title}`} icon={Pencil} onClick={() => setEditing(g)} className="hidden md:flex" />
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminHeader
        title="Gigs"
        description={gigs.data ? `${openCount} open gigs worth ${formatINR(openValue)} in payouts across all spots.` : "Micro-gigs students do under a mentor."}
        actions={
          <Button leftIcon={Plus} onClick={() => setEditing(emptyGig())}>
            New gig
          </Button>
        }
      />
      <DataTable
        data={rows}
        loading={gigs.isLoading}
        error={gigs.error}
        onRetry={gigs.refetch}
        columns={columns}
        initialSort={{ id: "deadline", desc: false }}
        onRowClick={(g) => setEditing(g)}
        search={{ placeholder: "Search gigs, clients, skills…", text: (g) => [g.title, g.company?.name, g.category, ...(g.skills || [])].join(" ") }}
        toolbar={
          <Segmented
            value={status}
            onChange={setStatus}
            label="Status"
            options={[
              { value: "ALL", label: "All", count: all.length },
              { value: "OPEN", label: "Open", count: openCount },
              { value: "CLOSED", label: "Closed", count: all.length - openCount },
            ]}
          />
        }
        empty={{
          icon: Briefcase,
          title: "No gigs yet",
          description: "Post the first micro-gig so stage-3 students can earn.",
          action: (
            <Button leftIcon={Plus} onClick={() => setEditing(emptyGig())}>
              New gig
            </Button>
          ),
        }}
      />
      {editing && (
        <GigForm
          key={editing.id || "new"}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          initial={{ ...emptyGig(), ...editing, mentorId: editing.mentorId || "", deliverables: editing.deliverables?.length ? editing.deliverables : [""] }}
          mentors={mentors.data || []}
        />
      )}
    </>
  );
}
