import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, FolderTree, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Skeleton, Textarea } from "@/components/ui/primitives";
import { Dialog, DialogContent, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/overlays";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { AdminHeader, ConfirmDialog, Drawer, IconBtn, Panel, Status, Tag, TagInput } from "@/components/admin/kit";
import { CATALOG_STATUS, COURSE_LEVELS, LEVEL_LABELS } from "@/components/learning/catalog-meta";

/**
 * Admin: categories → skills (spec §6). Create, edit, reorder, publish / pause / archive.
 * Only PUBLISHED skills in PUBLISHED categories show on the public Skills page; drafts stay hidden.
 */

const CATEGORY_ACTIONS = [
  ["PUBLISHED", "Publish"],
  ["DRAFT", "Move to draft"],
  ["ARCHIVED", "Archive"],
];
const SKILL_ACTIONS = [
  ["PUBLISHED", "Publish"],
  ["PAUSED", "Pause"],
  ["DRAFT", "Move to draft"],
  ["ARCHIVED", "Archive"],
];

function StatusChip({ status }) {
  const meta = CATALOG_STATUS[status] || { label: status, tone: "neutral" };
  return <Status tone={meta.tone}>{meta.label}</Status>;
}

function StatusMenu({ label, current, actions, onPick }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-fg focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
        >
          <MoreHorizontal className="size-4" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions
          .filter(([s]) => s !== current)
          .map(([s, text]) => (
            <DropdownMenuItem key={s} onSelect={() => onPick(s)}>
              {text}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ───────── category dialog ───────── */
function CategoryDialog({ open, onOpenChange, category, onSaved }) {
  const [form, setForm] = useState({ name: "", slug: "", status: "DRAFT" });
  const [lastId, setLastId] = useState(undefined);
  if (open && lastId !== (category?.id ?? null)) {
    setLastId(category?.id ?? null);
    setForm({ name: category?.name || "", slug: category?.slug || "", status: category?.status || "DRAFT" });
  }
  const save = useMutation({
    mutationFn: () => {
      const body = { name: form.name.trim(), ...(form.slug.trim() ? { slug: form.slug.trim() } : {}), status: form.status };
      return category ? api.put(`/api/admin/categories/${category.id}`, body) : api.post("/api/admin/categories", body);
    },
    onSuccess: () => {
      toast.success(category ? "Category saved" : "Category created");
      onSaved();
      onOpenChange(false);
      setLastId(undefined);
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setLastId(undefined);
      }}
    >
      <DialogContent title={category ? "Edit category" : "New category"} description="Categories group skills on the Skills page and in course filters.">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) return toast.error("Give the category a name.");
            save.mutate();
          }}
        >
          <Field label="Name" htmlFor="cat-name">
            <Input id="cat-name" autoFocus value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Design & Creative" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug" htmlFor="cat-slug" hint="Leave empty to generate.">
              <Input id="cat-slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="design-creative" />
            </Field>
            <Field label="Status" htmlFor="cat-status">
              <Select id="cat-status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {Object.keys(CATALOG_STATUS)
                  .filter((s) => s !== "PAUSED")
                  .map((s) => (
                    <option key={s} value={s}>
                      {CATALOG_STATUS[s].label}
                    </option>
                  ))}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending}>
              {category ? "Save" : "Create category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ───────── skill drawer ───────── */
const blankSkill = (categoryId) => ({ name: "", slug: "", categoryId, description: "", clientServices: "", tags: [], formats: ["BEGINNER", "INTERMEDIATE", "ADVANCED"], status: "DRAFT" });

function SkillDrawer({ open, onOpenChange, skill, categories, defaultCategoryId, onSaved }) {
  const [form, setForm] = useState(blankSkill(defaultCategoryId));
  const [lastKey, setLastKey] = useState(undefined);
  const key = skill?.id ?? `new:${defaultCategoryId}`;
  if (open && lastKey !== key) {
    setLastKey(key);
    setForm(skill ? { ...blankSkill(skill.categoryId), ...skill, slug: skill.slug || "" } : blankSkill(defaultCategoryId || categories[0]?.id || ""));
  }
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        description: form.description,
        clientServices: form.clientServices,
        tags: form.tags,
        formats: COURSE_LEVELS.filter((l) => form.formats.includes(l)),
        status: form.status,
        ...(form.slug?.trim() ? { slug: form.slug.trim() } : {}),
      };
      return skill ? api.put(`/api/admin/skills/${skill.id}`, body) : api.post("/api/admin/skills", body);
    },
    onSuccess: () => {
      toast.success(skill ? "Skill saved" : "Skill created");
      onSaved();
      onOpenChange(false);
      setLastKey(undefined);
    },
    onError: (e) => toast.error(e.message),
  });
  const submit = () => {
    if (!form.name.trim()) return toast.error("Give the skill a name.");
    if (!form.categoryId) return toast.error("Choose a category.");
    if (!form.formats.length) return toast.error("Pick at least one level format.");
    save.mutate();
  };
  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setLastKey(undefined);
      }}
      title={skill ? `Edit ${skill.name}` : "New skill"}
      description="Skills are what learners get verified in. Courses are offered per skill and level."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            {skill ? "Save skill" : "Create skill"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Name" htmlFor="sk-name">
          <Input id="sk-name" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. UI/UX Design" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="sk-cat">
            <Select id="sk-cat" value={form.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="sk-status">
            <Select id="sk-status" value={form.status} onChange={(e) => set({ status: e.target.value })}>
              {Object.entries(CATALOG_STATUS).map(([s, m]) => (
                <option key={s} value={s}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Slug" htmlFor="sk-slug" hint="Leave empty to generate. Used in links and filters.">
          <Input id="sk-slug" value={form.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="ui-ux-design" />
        </Field>
        <Field label="Short description" htmlFor="sk-desc">
          <Textarea id="sk-desc" rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="One plain sentence about the work." />
        </Field>
        <div className="space-y-2">
          <p className="text-sm font-medium text-fg">Level formats</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Level formats">
            {COURSE_LEVELS.map((l) => {
              const on = form.formats.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ formats: on ? form.formats.filter((x) => x !== l) : [...form.formats, l] })}
                  className={cn(
                    "h-8 cursor-pointer rounded-full border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none",
                    on ? "border-primary/40 bg-primary-soft text-primary" : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
                  )}
                >
                  {LEVEL_LABELS[l]}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted">Standard is one focused, job-ready workflow.</p>
        </div>
        <Field label="Future client services" htmlFor="sk-services" hint="What clients will be able to buy once learners are verified.">
          <Textarea id="sk-services" rows={3} value={form.clientServices} onChange={(e) => set({ clientServices: e.target.value })} placeholder="Wireframes, responsive screens, prototypes" />
        </Field>
        <Field label="Tags" htmlFor="sk-tags" hint="Tools and keywords. Press Enter or comma to add.">
          <TagInput id="sk-tags" value={form.tags || []} onChange={(tags) => set({ tags })} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ───────── page ───────── */
export default function AdminCatalogue() {
  const qc = useQueryClient();
  const cats = useQuery({ queryKey: ["admin", "categories"], queryFn: () => api.get("/api/admin/categories") });
  const courses = useQuery({ queryKey: ["admin", "courses"], queryFn: () => api.get("/api/admin/courses") });
  const [catDialog, setCatDialog] = useState({ open: false, category: null });
  const [skillDrawer, setSkillDrawer] = useState({ open: false, skill: null, categoryId: null });
  const [toDelete, setToDelete] = useState(null); // { kind, item }
  const [filter, setFilter] = useState("ALL");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["public", "categories"] });
  };

  const courseCount = useMemo(() => {
    const m = new Map();
    for (const c of courses.data || []) if (c.skillId) m.set(c.skillId, (m.get(c.skillId) || 0) + 1);
    return m;
  }, [courses.data]);

  const update = useMutation({
    mutationFn: ({ kind, id, body }) => api.put(`/api/admin/${kind}/${id}`, body),
    onSuccess: refresh,
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: ({ kind, id }) => api.delete(`/api/admin/${kind}/${id}`),
    onSuccess: () => {
      refresh();
      toast.success("Deleted");
      setToDelete(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // swap with the neighbour, then write order = position for every row that changed
  const reorder = async (kind, list, i, d) => {
    if (!list[i] || !list[i + d]) return;
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    try {
      await Promise.all(next.map((x, j) => (x.order !== j ? api.put(`/api/admin/${kind}/${x.id}`, { order: j }) : null)));
      refresh();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const setStatus = (kind, item, status) =>
    update.mutate(
      { kind, id: item.id, body: { status } },
      { onSuccess: () => toast.success(`${item.name}: ${(CATALOG_STATUS[status]?.label || status).toLowerCase()}`) },
    );

  const categories = cats.data || [];
  const allSkills = categories.flatMap((c) => c.skills || []);
  const published = allSkills.filter((s) => s.status === "PUBLISHED").length;
  const visibleSkills = (c) => (c.skills || []).filter((s) => filter === "ALL" || s.status === filter);

  return (
    <>
      <AdminHeader
        title="Catalogue"
        description={
          cats.data
            ? `${categories.length} categories · ${allSkills.length} skills · ${published} published. Launch a few skills at a time.`
            : "Categories and skills that courses, verification and projects are built on."
        }
        actions={
          <>
            <Button variant="outline" leftIcon={Plus} onClick={() => setCatDialog({ open: true, category: null })}>
              New category
            </Button>
            <Button leftIcon={Plus} disabled={!categories.length} onClick={() => setSkillDrawer({ open: true, skill: null, categoryId: categories[0]?.id })}>
              New skill
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter skills by status">
        {[["ALL", "All"], ...Object.entries(CATALOG_STATUS).map(([k, v]) => [k, v.label])].map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className={cn(
              "h-8 cursor-pointer rounded-full border px-3 text-sm transition-colors",
              filter === k ? "border-primary/40 bg-primary-soft text-primary" : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
            )}
          >
            {label}
            <span className="ml-1.5 text-subtle tabular-nums">{k === "ALL" ? allSkills.length : allSkills.filter((s) => s.status === k).length}</span>
          </button>
        ))}
      </div>

      {cats.error ? (
        <ErrorState error={cats.error} onRetry={cats.refetch} />
      ) : cats.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : !categories.length ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Add a category, then the skills inside it."
          action={
            <Button leftIcon={Plus} onClick={() => setCatDialog({ open: true, category: null })}>
              New category
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {categories.map((c, ci) => {
            const skills = c.skills || [];
            const shown = visibleSkills(c);
            return (
              <Panel
                key={c.id}
                flush
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {c.name} <StatusChip status={c.status} />
                  </span>
                }
                description={`${skills.length} skills · ${skills.filter((s) => s.status === "PUBLISHED").length} published`}
                action={
                  <div className="flex items-center">
                    <IconBtn label={`Move ${c.name} up`} icon={ArrowUp} disabled={ci === 0} onClick={() => reorder("categories", categories, ci, -1)} />
                    <IconBtn label={`Move ${c.name} down`} icon={ArrowDown} disabled={ci === categories.length - 1} onClick={() => reorder("categories", categories, ci, 1)} />
                    <IconBtn label={`Edit ${c.name}`} icon={Pencil} onClick={() => setCatDialog({ open: true, category: c })} />
                    <StatusMenu label={`Change status of ${c.name}`} current={c.status} actions={CATEGORY_ACTIONS} onPick={(s) => setStatus("categories", c, s)} />
                    <IconBtn label={`Delete ${c.name}`} icon={Trash2} danger onClick={() => setToDelete({ kind: "categories", item: c })} />
                  </div>
                }
              >
                {shown.length ? (
                  <ul className="divide-y divide-line">
                    {shown.map((s) => {
                      const si = skills.indexOf(s);
                      const n = courseCount.get(s.id) || 0;
                      return (
                        <li key={s.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <button type="button" onClick={() => setSkillDrawer({ open: true, skill: s })} className="cursor-pointer text-left font-medium text-fg hover:text-primary">
                                {s.name}
                              </button>
                              <StatusChip status={s.status} />
                              {n > 0 && (
                                <Link to={`/admin/courses`} className="text-xs text-muted hover:text-fg">
                                  {n} course{n === 1 ? "" : "s"}
                                </Link>
                              )}
                            </div>
                            <p className="mt-1 line-clamp-1 text-sm text-muted">{s.clientServices || s.description || "No client services yet."}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {(s.formats || []).map((f) => (
                                <Tag key={f}>{LEVEL_LABELS[f] || f}</Tag>
                              ))}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center self-end sm:self-center">
                            <IconBtn label={`Move ${s.name} up`} icon={ArrowUp} disabled={si === 0 || filter !== "ALL"} onClick={() => reorder("skills", skills, si, -1)} />
                            <IconBtn label={`Move ${s.name} down`} icon={ArrowDown} disabled={si === skills.length - 1 || filter !== "ALL"} onClick={() => reorder("skills", skills, si, 1)} />
                            <IconBtn label={`Edit ${s.name}`} icon={Pencil} onClick={() => setSkillDrawer({ open: true, skill: s })} />
                            <StatusMenu label={`Change status of ${s.name}`} current={s.status} actions={SKILL_ACTIONS} onPick={(st) => setStatus("skills", s, st)} />
                            <IconBtn label={`Delete ${s.name}`} icon={Trash2} danger onClick={() => setToDelete({ kind: "skills", item: s })} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
                    <p className="text-sm text-muted">{skills.length ? "No skills with this status." : "No skills in this category yet."}</p>
                    {!skills.length && (
                      <Button size="sm" variant="outline" leftIcon={Plus} onClick={() => setSkillDrawer({ open: true, skill: null, categoryId: c.id })}>
                        Add skill
                      </Button>
                    )}
                  </div>
                )}
                {shown.length > 0 && (
                  <div className="border-t border-line px-3 py-2">
                    <Button size="sm" variant="ghost" leftIcon={Plus} onClick={() => setSkillDrawer({ open: true, skill: null, categoryId: c.id })}>
                      Add skill
                    </Button>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      <CategoryDialog open={catDialog.open} category={catDialog.category} onOpenChange={(o) => setCatDialog((d) => ({ ...d, open: o }))} onSaved={refresh} />
      <SkillDrawer
        open={skillDrawer.open}
        skill={skillDrawer.skill}
        defaultCategoryId={skillDrawer.categoryId}
        categories={categories}
        onOpenChange={(o) => setSkillDrawer((d) => ({ ...d, open: o }))}
        onSaved={refresh}
      />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete "${toDelete?.item?.name}"?`}
        description={
          toDelete?.kind === "categories"
            ? "Only empty categories can be deleted. Archive it to hide it instead."
            : "Skills with courses, verifications or projects can't be deleted. Archive them instead."
        }
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate({ kind: toDelete.kind, id: toDelete.item.id })}
      />
    </>
  );
}
