import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardCheck, ExternalLink } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Skeleton, Textarea } from "@/components/ui/primitives";
import { Avatar, Dialog, DialogContent } from "@/components/ui/overlays";
import { DataTable, Segmented } from "@/components/admin/DataTable";
import { AdminHeader, SectionLabel, Status } from "@/components/admin/kit";

const STATUS = { SUBMITTED: { label: "Needs review", tone: "warning" }, REVIEWED: { label: "Reviewed", tone: "success" } };

function findLesson(course, lessonId) {
  for (const m of course?.modules || []) for (const l of m.lessons || []) if (l.id === lessonId) return l;
  return null;
}

function ReviewDialog({ submission, onClose }) {
  const qc = useQueryClient();
  const reviewed = submission.status === "REVIEWED";
  const course = useQuery({
    queryKey: ["admin", "course", submission.courseId],
    queryFn: () => api.get(`/api/admin/courses/${submission.courseId}`),
    enabled: !!submission.courseId,
    retry: false,
  });
  const lesson = findLesson(course.data, submission.lessonId);
  const rubric = lesson?.assignment?.rubric || [];
  const max = submission.maxScore || rubric.reduce((s, r) => s + (Number(r.points) || 0), 0) || 100;

  const [scores, setScores] = useState({});
  const [manual, setManual] = useState(reviewed ? String(submission.score ?? "") : "");
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const rubricTotal = rubric.reduce((s, r, i) => s + (Number(scores[i]) || 0), 0);
  const usingRubric = rubric.length > 0 && Object.keys(scores).length > 0;
  const score = usingRubric ? rubricTotal : Number(manual);

  const review = useMutation({
    mutationFn: () => api.post(`/api/mentor/submissions/${submission.id}/review`, { score: Math.round(score), feedback: feedback.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "submissions"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
      toast.success(`Reviewed: ${Math.round(score)}/${max}. ${submission.user?.name?.split(" ")[0] || "The student"} gets points and a verified portfolio item.`);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!Number.isFinite(score) || (manual === "" && !usingRubric)) return toast.error("Add a score.");
    if (score < 0 || score > max) return toast.error(`Score must be between 0 and ${max}.`);
    if (feedback.trim().length < 10) return toast.error("Write a line or two of feedback so they can improve.");
    review.mutate();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg" title={submission.lessonTitle || "Assignment"} description={`${submission.user?.name || "Student"} · submitted ${timeAgo(submission.createdAt)}`}>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2 rounded-xl border border-line bg-surface-2/40 p-4 text-sm">
            {submission.link && (
              <a href={submission.link} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 font-medium break-all text-primary hover:underline">
                <ExternalLink className="size-4 shrink-0" /> {submission.link}
              </a>
            )}
            {submission.text && <p className="leading-relaxed whitespace-pre-wrap">{submission.text}</p>}
            {!submission.link && !submission.text && <p className="text-muted">Empty submission.</p>}
          </div>

          <div>
            <SectionLabel action={<span className="text-xs text-subtle tabular-nums">Max {max}</span>}>Rubric</SectionLabel>
            {course.isLoading ? (
              <Skeleton className="h-24" />
            ) : rubric.length ? (
              <div className="divide-y divide-line rounded-xl border border-line">
                {rubric.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <p className="min-w-0 flex-1 text-sm">{r.criterion}</p>
                    <Input
                      type="number"
                      min={0}
                      max={r.points}
                      aria-label={`Score for ${r.criterion}`}
                      value={scores[i] ?? ""}
                      disabled={reviewed}
                      onChange={(e) => setScores((s) => ({ ...s, [i]: Math.min(Number(r.points), Math.max(0, Number(e.target.value))) }))}
                      className="h-9 w-20"
                    />
                    <span className="w-10 text-xs text-subtle tabular-nums">/ {r.points}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No rubric found for this lesson. Score it out of {max}.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <Field label="Score" htmlFor="rv-score" hint={usingRubric ? "Sum of the rubric" : `Out of ${max}`}>
              <Input
                id="rv-score"
                type="number"
                min={0}
                max={max}
                value={usingRubric ? rubricTotal : manual}
                readOnly={usingRubric || reviewed}
                onChange={(e) => setManual(e.target.value)}
                className={cn("text-base font-medium tabular-nums", usingRubric && "bg-surface-2")}
              />
            </Field>
            <Field label="Feedback" htmlFor="rv-feedback">
              <Textarea id="rv-feedback" rows={4} value={feedback} readOnly={reviewed} onChange={(e) => setFeedback(e.target.value)} placeholder="What worked, what to fix next time. Be specific and kind." />
            </Field>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {reviewed ? "Close" : "Cancel"}
            </Button>
            {!reviewed && (
              <Button type="submit" loading={review.isPending} leftIcon={ClipboardCheck}>
                Submit review
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Submissions() {
  const [status, setStatus] = useState("SUBMITTED");
  const [open, setOpen] = useState(null);
  const list = useQuery({ queryKey: ["admin", "submissions", status], queryFn: () => api.get(`/api/admin/submissions${qs({ status: status === "ALL" ? "" : status })}`) });
  const all = useQuery({ queryKey: ["admin", "submissions", "ALL"], queryFn: () => api.get("/api/admin/submissions") });
  const pending = useMemo(() => (all.data || []).filter((s) => s.status === "SUBMITTED").length, [all.data]);

  const columns = [
    {
      id: "student",
      header: "Student",
      sortValue: (s) => s.user?.name || "",
      cell: (s) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={s.user?.name} src={s.user?.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium">{s.user?.name || "Unknown"}</p>
            <p className="truncate text-xs text-muted">{s.user?.college?.shortName || "—"}</p>
          </div>
        </div>
      ),
    },
    { id: "lesson", header: "Assignment", sortValue: (s) => s.lessonTitle || "", cell: (s) => <span className="line-clamp-1 text-fg/90 md:max-w-xs">{s.lessonTitle}</span> },
    { id: "status", header: "Status", sortValue: (s) => s.status, cell: (s) => <Status tone={STATUS[s.status]?.tone}>{STATUS[s.status]?.label || s.status}</Status> },
    {
      id: "score",
      header: "Score",
      align: "right",
      sortValue: (s) => s.score ?? -1,
      cell: (s) => (s.score != null ? <span className="tabular-nums">{s.score}<span className="text-subtle">/{s.maxScore}</span></span> : <span className="text-subtle">—</span>),
    },
    { id: "submitted", header: "Submitted", align: "right", sortValue: (s) => s.createdAt, cell: (s) => <span className="text-xs whitespace-nowrap text-muted">{timeAgo(s.createdAt)}</span> },
    {
      id: "action",
      header: <span className="sr-only">Action</span>,
      align: "right",
      hideOnMobile: true,
      cell: (s) => (
        <Button size="sm" variant={s.status === "SUBMITTED" ? "outline" : "ghost"} onClick={(e) => (e.stopPropagation(), setOpen(s))}>
          {s.status === "SUBMITTED" ? "Review" : "View"}
        </Button>
      ),
    },
  ];

  return (
    <>
      <AdminHeader title="Assignment reviews" description="Every review becomes verified proof on the student's Skill Passport. Score fairly, write feedback they can act on." />
      <DataTable
        data={list.data}
        loading={list.isLoading}
        error={list.error}
        onRetry={list.refetch}
        columns={columns}
        initialSort={{ id: "submitted", desc: status !== "SUBMITTED" }}
        onRowClick={setOpen}
        search={{ placeholder: "Search student or assignment…", text: (s) => [s.user?.name, s.lessonTitle, s.user?.college?.name].join(" ") }}
        toolbar={
          <Segmented
            value={status}
            onChange={setStatus}
            label="Review status"
            options={[
              { value: "SUBMITTED", label: "Needs review", count: all.data ? pending : undefined },
              { value: "REVIEWED", label: "Reviewed" },
              { value: "ALL", label: "All" },
            ]}
          />
        }
        empty={{ icon: ClipboardCheck, title: status === "SUBMITTED" ? "Inbox zero" : "No submissions", description: status === "SUBMITTED" ? "Every assignment has been reviewed. Shabash!" : "Submissions appear when students hand in assignments." }}
      />
      {open && <ReviewDialog key={open.id} submission={open} onClose={() => setOpen(null)} />}
    </>
  );
}
