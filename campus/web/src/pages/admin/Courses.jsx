import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Library, Pencil, Plus, Trash2, Users } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatINR, formatNumber, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/primitives";
import { Dialog, DialogContent, Avatar } from "@/components/ui/overlays";
import { CourseCover } from "@/components/ui/campus";
import { DataTable } from "@/components/admin/DataTable";
import { AdminHeader, ConfirmDialog, IconBtn, Status, Tag } from "@/components/admin/kit";
import { COURSE_LEVELS, COURSE_STATUS, COURSE_STATUSES, DEFAULT_LEVEL_DEFAULTS, LEVEL_LABELS } from "@/components/learning/catalog-meta";
import { usePlatformConfig } from "@/lib/platform";

const LEVELS = COURSE_LEVELS.map((value) => ({ value, label: LEVEL_LABELS[value] }));

function CourseStatus({ status }) {
  const meta = COURSE_STATUS[status] || { label: status, tone: "neutral" };
  return <Status tone={meta.tone}>{meta.label}</Status>;
}

function NewCourseDialog({ open, onOpenChange, tracks, mentors, skills }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { pricing } = usePlatformConfig();
  const [form, setForm] = useState({ title: "", trackId: "", mentorId: "", skillId: "", level: "BEGINNER" });
  const skill = skills.find((s) => s.id === form.skillId);
  const levels = skill?.formats?.length ? LEVELS.filter((l) => skill.formats.includes(l.value)) : LEVELS;
  const defaults = { ...DEFAULT_LEVEL_DEFAULTS, ...(pricing?.levelDefaults || {}) }[form.level] || DEFAULT_LEVEL_DEFAULTS.BEGINNER;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const create = useMutation({
    mutationFn: () =>
      api.post("/api/admin/courses", {
        title: form.title.trim(),
        level: form.level,
        ...(form.trackId ? { trackId: form.trackId } : {}),
        ...(form.mentorId ? { mentorId: form.mentorId } : {}),
        ...(form.skillId ? { skillId: form.skillId } : {}),
      }),
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      toast.success("Draft created. Add the details and curriculum.");
      onOpenChange(false);
      navigate(`/admin/courses/${course.id}`);
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="New course" description="Courses start as drafts. Price and duration fill in from the level defaults.">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim()) return toast.error("Give the course a title.");
            create.mutate();
          }}
        >
          <Field label="Title" htmlFor="nc-title">
            <Input id="nc-title" autoFocus value={form.title} onChange={set("title")} placeholder="e.g. Instagram Reels editing for local brands" />
          </Field>
          <Field label="Skill" htmlFor="nc-skill" hint="The skill learners get verified in.">
            <Select
              id="nc-skill"
              value={form.skillId}
              onChange={(e) => {
                const next = skills.find((s) => s.id === e.target.value);
                setForm((f) => ({ ...f, skillId: e.target.value, level: next?.formats?.length && !next.formats.includes(f.level) ? next.formats[0] : f.level }));
              }}
            >
              <option value="">Choose later</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.categoryName} · {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Track" htmlFor="nc-track">
              <Select id="nc-track" value={form.trackId} onChange={set("trackId")}>
                <option value="">Choose later</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Level" htmlFor="nc-level">
              <Select id="nc-level" value={form.level} onChange={set("level")}>
                {levels.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Mentor" htmlFor="nc-mentor">
            <Select id="nc-mentor" value={form.mentorId} onChange={set("mentorId")}>
              <option value="">Choose later</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
            {LEVEL_LABELS[form.level]} default: <span className="text-fg">{formatINR(defaults.priceINR)}</span> + {pricing?.gstPercent ?? 18}% GST · {defaults.durationDays} days
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending} rightIcon={Pencil}>
              Create & open editor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Courses() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [skillFilter, setSkillFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const courses = useQuery({ queryKey: ["admin", "courses"], queryFn: () => api.get("/api/admin/courses") });
  const tracks = useQuery({ queryKey: ["admin", "tracks"], queryFn: () => api.get("/api/admin/tracks") });
  const mentors = useQuery({ queryKey: ["admin", "mentors"], queryFn: () => api.get("/api/admin/mentors") });
  const cats = useQuery({ queryKey: ["admin", "categories"], queryFn: () => api.get("/api/admin/categories") });
  const skills = useMemo(() => (cats.data || []).flatMap((c) => (c.skills || []).map((s) => ({ ...s, categoryName: c.name }))), [cats.data]);

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/api/admin/courses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      toast.success("Course deleted");
      setToDelete(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const rows = useMemo(
    () =>
      (courses.data || []).filter(
        (c) => (!skillFilter || (skillFilter === "none" ? !c.skillId : c.skillId === skillFilter)) && (!statusFilter || (c.status || "PUBLISHED") === statusFilter),
      ),
    [courses.data, skillFilter, statusFilter],
  );

  const columns = [
    {
      id: "title",
      header: "Course",
      sortValue: (c) => c.title,
      cell: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          <CourseCover cover={c.cover} className="h-9 w-14 shrink-0 rounded-md" />
          <div className="min-w-0">
            <p className="truncate font-medium md:max-w-[260px]">{c.title}</p>
            <p className="truncate text-xs text-muted md:max-w-[260px]">
              {LEVEL_LABELS[c.level] || c.level} · {c.durationDays ? `${c.durationDays} days` : formatDuration(c.durationMinutes)}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "skill",
      header: "Skill",
      sortValue: (c) => c.skill?.name || "",
      cell: (c) =>
        c.skill ? (
          <span className="flex min-w-0 flex-col whitespace-nowrap">
            <span className="text-sm text-fg/90">{c.skill.name}</span>
            <span className="text-xs text-subtle">{c.skill.category?.name}</span>
          </span>
        ) : (
          <Status tone="warning">No skill</Status>
        ),
    },
    { id: "status", header: "Status", sortValue: (c) => c.status || "", cell: (c) => <CourseStatus status={c.status || "PUBLISHED"} /> },
    {
      id: "mentor",
      header: "Mentor",
      sortValue: (c) => c.mentor?.name || "",
      cell: (c) =>
        c.mentor ? (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <Avatar name={c.mentor.name} src={c.mentor.avatarUrl} size="xs" />
            <span className="truncate">{c.mentor.name}</span>
          </span>
        ) : (
          <Status tone="warning">Unassigned</Status>
        ),
    },
    { id: "lessons", header: "Lessons", align: "right", sortValue: (c) => c.lessonsCount, cell: (c) => <span className="text-muted tabular-nums">{c.lessonsCount}</span> },
    {
      id: "students",
      header: "Students",
      align: "right",
      sortValue: (c) => c.studentsCount || 0,
      cell: (c) => <span className="tabular-nums">{formatNumber(c.studentsCount)}</span>,
    },
    {
      id: "price",
      header: "Price",
      align: "right",
      sortValue: (c) => c.priceINR,
      cell: (c) =>
        c.isFree ? (
          <Tag>Free</Tag>
        ) : (
          <span className="inline-flex flex-col items-end whitespace-nowrap">
            <span className="tabular-nums">{formatINR(c.priceINR)}</span>
            <span className="text-[11px] text-subtle">+ {c.gstPercent ?? 18}% GST</span>
          </span>
        ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      hideOnMobile: true,
      cell: (c) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <IconBtn label={`Edit ${c.title}`} icon={Pencil} onClick={() => navigate(`/admin/courses/${c.id}`)} />
          <IconBtn label={`Delete ${c.title}`} icon={Trash2} danger onClick={() => setToDelete(c)} />
        </div>
      ),
    },
  ];

  const totalStudents = (courses.data || []).reduce((s, c) => s + (c.studentsCount || 0), 0);

  return (
    <>
      <AdminHeader
        title="Courses"
        description={
          courses.data
            ? `${courses.data.length} courses · ${courses.data.filter((c) => ["PUBLISHED", "ENROLMENT_OPEN"].includes(c.status)).length} taking enrolments · ${formatNumber(totalStudents)} students.`
            : "Build courses per skill and level, then publish them."
        }
        actions={
          <Button leftIcon={Plus} onClick={() => setCreating(true)}>
            New course
          </Button>
        }
      />

      <DataTable
        data={rows}
        loading={courses.isLoading}
        error={courses.error}
        onRetry={courses.refetch}
        columns={columns}
        initialSort={{ id: "students", desc: true }}
        onRowClick={(c) => navigate(`/admin/courses/${c.id}`)}
        search={{ placeholder: "Search courses, mentors, skills…", text: (c) => [c.title, c.subtitle, c.mentor?.name, c.track?.title, c.skill?.name, ...(c.skills || [])].join(" ") }}
        toolbar={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Select aria-label="Filter by skill" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="h-9 w-full rounded-lg sm:w-52">
              <option value="">All skills</option>
              <option value="none">No skill set</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 w-full rounded-lg sm:w-44">
              <option value="">All statuses</option>
              {COURSE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        }
        mobileCard={(c) => (
          <div className="flex gap-3">
            <CourseCover cover={c.cover} className="h-14 w-20 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 leading-snug font-medium">{c.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <CourseStatus status={c.status || "PUBLISHED"} />
                {c.skill && <span>{c.skill.name}</span>}
                <span>{c.lessonsCount} lessons</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3" />
                  {formatNumber(c.studentsCount)}
                </span>
                <span className="text-fg">{c.isFree ? "Free" : formatINR(c.priceINR)}</span>
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <IconBtn label={`Delete ${c.title}`} icon={Trash2} danger onClick={() => setToDelete(c)} />
            </div>
          </div>
        )}
        empty={{
          icon: Library,
          title: skillFilter || statusFilter ? "No courses match" : "No courses yet",
          description: "Create the first course and build its curriculum.",
          action: (
            <Button leftIcon={Plus} onClick={() => setCreating(true)}>
              New course
            </Button>
          ),
        }}
      />

      <NewCourseDialog open={creating} onOpenChange={setCreating} tracks={tracks.data || []} mentors={mentors.data || []} skills={skills} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete "${toDelete?.title}"?`}
        description={`This removes the course and its ${toDelete?.lessonsCount ?? 0} lessons for everyone. ${toDelete?.studentsCount ? `${formatNumber(toDelete.studentsCount)} students are enrolled.` : ""} This can't be undone.`}
        confirmLabel="Delete course"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(toDelete.id)}
      />
    </>
  );
}
