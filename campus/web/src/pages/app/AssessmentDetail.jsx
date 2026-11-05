import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, BadgeCheck, CalendarClock, CheckCircle2, ExternalLink, FileText, Flag, Link2, Lock, Plus, Save, Send, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, Field, Input, Skeleton, Textarea } from "@/components/ui/primitives";
import { Dialog, DialogContent, Progress } from "@/components/ui/overlays";
import { PageHeader } from "@/components/ui/campus";
import { Markdown } from "@/components/learning/Markdown";
import { NoGuarantee } from "@/components/marketing/NoGuarantee";
import { ATTEMPT_STATUS, AttemptStatus, LevelBadge, QueryError, daysLeft, weightShare } from "@/components/assessment/meta";
import { AttemptFileLink, DEFAULT_MAX_BYTES, UPLOAD_EXTENSIONS, acceptAttr, fileProblem, formatBytes, uploadAttemptFile } from "@/components/assessment/files";

const FORMAT_LABEL = { link: "Link", text: "Written note", file: "File" };
/* ───────────── pieces ───────────── */

function Section({ title, action, children, className }) {
  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-medium tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </Card>
  );
}

function RubricSummary({ rubric, passScore }) {
  if (!rubric) return null;
  return (
    <Section title="How you're scored" action={<span className="text-xs text-subtle">Rubric v{rubric.version}</span>}>
      <p className="mb-4 text-sm text-muted">
        Pass mark {passScore}/100, and every <span className="font-medium text-fg">critical</span> criterion needs at least half its marks.
      </p>
      <ul className="divide-y divide-line rounded-xl border border-line">
        {rubric.criteria.map((c) => (
          <li key={c.id} className="flex gap-3 px-4 py-3">
            <span className="w-10 shrink-0 text-sm text-muted tabular-nums">{weightShare(rubric.criteria, c)}%</span>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {c.label}
                {c.critical && <span className="ml-2 rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning">Critical</span>}
              </p>
              {c.guide && <p className="mt-0.5 text-sm text-muted">{c.guide}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function SubmissionView({ submission, attemptId }) {
  const { text, links = [], files = [] } = submission || {};
  if (!text && !links.length && !files.length) return <p className="text-sm text-muted">Nothing submitted.</p>;
  return (
    <div className="space-y-3 text-sm">
      {links.map((l) => (
        <a key={l} href={l} target="_blank" rel="noreferrer" className="flex max-w-full items-center gap-2 break-all text-primary hover:underline">
          <Link2 className="size-4 shrink-0" /> {l}
        </a>
      ))}
      {files.map((f, i) => (
        <AttemptFileLink key={f.key || i} attemptId={attemptId} index={i} file={f} />
      ))}
      {text && <p className="leading-relaxed whitespace-pre-wrap text-fg/90">{text}</p>}
    </div>
  );
}

function ResultView({ attempt, passScore }) {
  if (attempt.totalScore == null) return null;
  const passed = attempt.passed;
  return (
    <Section title="Result" action={<span className="text-xs text-subtle">Rubric v{attempt.rubricVersion} · {formatDate(attempt.reviewedAt)}</span>}>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <p className="text-4xl font-medium tracking-tight tabular-nums">
          {attempt.totalScore}
          <span className="text-lg text-subtle">/100</span>
        </p>
        <p className={cn("pb-1 text-sm font-medium", passed ? "text-success" : "text-warning")}>{passed ? "Passed" : `Pass mark is ${passScore}`}</p>
      </div>
      {attempt.feedback && (
        <div className="mt-5 rounded-xl bg-surface-2/60 p-4">
          <p className="text-xs font-medium text-muted">Feedback</p>
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{attempt.feedback}</p>
        </div>
      )}
      <ul className="mt-5 divide-y divide-line rounded-xl border border-line">
        {attempt.scores.map((s) => {
          const low = s.critical && s.maxScore && s.score < s.maxScore * 0.5;
          return (
            <li key={s.criterionId} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 text-sm font-medium">
                  {s.label}
                  {s.critical && <span className={cn("ml-2 text-[11px] font-medium", low ? "text-danger" : "text-subtle")}>{low ? "Critical, not met" : "Critical"}</span>}
                </p>
                <span className="shrink-0 text-sm tabular-nums">
                  {s.score}
                  <span className="text-subtle">/{s.maxScore}</span>
                </span>
              </div>
              {s.note && <p className="mt-1 text-sm text-muted">{s.note}</p>}
            </li>
          );
        })}
      </ul>
      {attempt.appealDecision && (
        <p className="mt-4 text-sm text-muted">
          <span className="font-medium text-fg">Appeal decision:</span> {attempt.appealDecision.replace(/^(UPHOLD|OVERTURN): /, (m, d) => (d === "UPHOLD" ? "Result upheld. " : "Result changed to a pass. "))}
        </p>
      )}
    </Section>
  );
}

/* ───────────── draft editor ───────────── */

/**
 * Files: picked → checked here (type, size, count) → private upload with progress → saved to the draft straight away,
 * so an uploaded file is never lost with unsaved text. Opening a file always fetches a fresh 10-minute link.
 */
function FilesField({ attempt, files, setFiles, uploads, canLink, pending, setPending }) {
  const inputRef = useRef(null);
  const filesRef = useRef(files);
  filesRef.current = files;
  const saving = useRef(Promise.resolve());
  const enabled = Boolean(uploads?.enabled);
  const extensions = uploads?.extensions?.length ? uploads.extensions : UPLOAD_EXTENSIONS;
  const maxBytes = uploads?.maxBytes || DEFAULT_MAX_BYTES;
  const maxFiles = uploads?.maxFiles || 10;
  const patch = (id, p) => setPending((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  // saves run one after another so two uploads finishing together don't overwrite each other
  const saveFiles = (build) => {
    const run = saving.current.then(async () => {
      const updated = await api.put(`/api/attempts/${attempt.id}/submission`, { files: build(filesRef.current) });
      filesRef.current = updated.submission.files;
      setFiles(updated.submission.files);
    });
    saving.current = run.catch(() => {});
    return run;
  };

  const addFiles = (list) => {
    let room = maxFiles - filesRef.current.length - pending.filter((p) => !p.error).length;
    for (const file of list) {
      const problem = fileProblem(file, { extensions, maxBytes });
      if (problem) {
        toast.error(problem);
        continue;
      }
      if (room <= 0) {
        toast.error(`You can add up to ${maxFiles} files.`);
        break;
      }
      room--;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setPending((xs) => [...xs, { id, name: file.name, size: file.size, progress: 0, error: null }]);
      uploadAttemptFile(attempt.id, file, (progress) => patch(id, { progress }))
        .then((saved) => saveFiles((current) => [...current, saved]))
        .then(() => setPending((xs) => xs.filter((x) => x.id !== id)))
        .catch((e) => patch(id, { error: e.message || "The upload failed." }));
    }
  };

  const remove = (index) =>
    saveFiles((current) => current.filter((_, k) => k !== index))
      .then(() => toast.success("File removed."))
      .catch((e) => toast.error(e.message));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Files</p>
      {enabled ? (
        <p className="text-xs text-muted">
          {extensions.map((e) => e.toUpperCase()).join(", ")} up to {formatBytes(maxBytes)} each, {maxFiles} files at most. Files are private: only you and the people who review your work can open them.
        </p>
      ) : (
        <p className="text-xs text-muted">
          File uploads aren't available right now.{" "}
          {canLink ? "Add a link to your file instead (Google Drive or Dropbox, set to “anyone with the link can view”)." : "Explain your work in the note below, or contact support."}
        </p>
      )}
      {files.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {files.map((f, i) => (
            <li key={f.key || i} className="flex items-center gap-2 py-1.5 pr-1.5 pl-3">
              <AttemptFileLink attemptId={attempt.id} index={i} file={f} className="min-w-0 flex-1 py-1 text-sm" />
              <Button type="button" size="iconSm" variant="ghost" aria-label={`Remove ${f.name}`} onClick={() => remove(i)}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {pending.map((p) => (
        <div key={p.id} className="rounded-xl border border-line px-3 py-2.5" aria-live="polite">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{p.name}</span>
            <span className={cn("shrink-0 text-xs tabular-nums", p.error ? "text-danger" : "text-subtle")}>{p.error ? "Failed" : p.progress >= 100 ? "Saving" : `${p.progress}%`}</span>
          </div>
          {p.error ? (
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-xs text-danger">{p.error}</p>
              <Button type="button" size="sm" variant="ghost" onClick={() => setPending((xs) => xs.filter((x) => x.id !== p.id))}>
                Dismiss
              </Button>
            </div>
          ) : (
            <Progress value={p.progress} className="mt-2 h-1.5" />
          )}
        </div>
      ))}
      {enabled && files.length + pending.filter((p) => !p.error).length < maxFiles && (
        <>
          <input
            ref={inputRef}
            id={`att-files-${attempt.id}`}
            type="file"
            multiple
            accept={acceptAttr(extensions)}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              addFiles([...(e.target.files || [])]);
              e.target.value = "";
            }}
          />
          <Button type="button" size="sm" variant="outline" leftIcon={Upload} onClick={() => inputRef.current?.click()}>
            Upload files
          </Button>
        </>
      )}
    </div>
  );
}

function DraftEditor({ attempt, assessment, courseId, uploads }) {
  const qc = useQueryClient();
  const formats = new Set(assessment.allowedFormats || []);
  const [text, setText] = useState(attempt.submission.text || "");
  const [links, setLinks] = useState(attempt.submission.links?.length ? attempt.submission.links : formats.has("link") ? [""] : []);
  const [files, setFiles] = useState(attempt.submission.files || []);
  const [pending, setPending] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const [dirty, setDirty] = useState(false);
  const uploading = pending.some((p) => !p.error);

  // files are saved as soon as they upload (FilesField), so the draft body carries text and links only
  const body = () => ({
    ...(formats.has("text") || text ? { text } : {}),
    ...(formats.has("link") ? { links: links.map((l) => l.trim()).filter(Boolean) } : {}),
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["assessment", courseId] });
    qc.invalidateQueries({ queryKey: ["my-assessments"] });
  };
  const save = useMutation({
    mutationFn: () => api.put(`/api/attempts/${attempt.id}/submission`, body()),
    onSuccess: () => {
      setDirty(false);
      refresh();
      toast.success("Draft saved.");
    },
    onError: (e) => toast.error(e.message),
  });
  const submit = useMutation({
    mutationFn: async () => {
      await api.put(`/api/attempts/${attempt.id}/submission`, body());
      return api.post(`/api/attempts/${attempt.id}/submit`);
    },
    onSuccess: () => {
      setConfirm(false);
      refresh();
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Submitted. Your work is locked for review.");
    },
    onError: (e) => toast.error(e.message),
  });

  // warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty && !uploading) return;
    const h = (e) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty, uploading]);

  const change = (fn) => (...args) => {
    setDirty(true);
    fn(...args);
  };
  const empty = !text.trim() && !links.some((l) => l.trim()) && !files.length;

  return (
    <Section title={attempt.attemptNo > 1 ? `Your work · attempt ${attempt.attemptNo}` : "Your work"} action={<span className="text-xs text-subtle">{dirty ? "Unsaved changes" : `Saved ${timeAgo(attempt.updatedAt)}`}</span>}>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (uploading) return toast.error("Wait for your files to finish uploading.");
          if (empty) return toast.error("Add your work before you submit.");
          setConfirm(true);
        }}
      >
        {formats.has("link") && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Links</p>
            {links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  aria-label={`Link ${i + 1}`}
                  leftIcon={Link2}
                  type="url"
                  placeholder="https://"
                  value={l}
                  onChange={change((e) => setLinks((xs) => xs.map((x, k) => (k === i ? e.target.value : x))))}
                  className="flex-1"
                />
                {links.length > 1 && (
                  <Button type="button" size="icon" variant="ghost" aria-label="Remove link" onClick={change(() => setLinks((xs) => xs.filter((_, k) => k !== i)))}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            {links.length < 10 && (
              <Button type="button" size="sm" variant="ghost" leftIcon={Plus} onClick={change(() => setLinks((xs) => [...xs, ""]))}>
                Add link
              </Button>
            )}
          </div>
        )}

        {formats.has("file") && <FilesField attempt={attempt} files={files} setFiles={setFiles} uploads={uploads} canLink={formats.has("link")} pending={pending} setPending={setPending} />}

        <Field label={formats.has("text") ? "Note" : "Note (optional)"} htmlFor="att-text" hint="Explain your choices and anything the evaluator should know.">
          <Textarea id="att-text" rows={6} value={text} maxLength={20000} onChange={change((e) => setText(e.target.value))} placeholder="What you built, the decisions you made, what you'd do next." />
        </Field>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" leftIcon={Save} loading={save.isPending} onClick={() => save.mutate()} disabled={!dirty}>
            Save draft
          </Button>
          <Button type="submit" leftIcon={Send} disabled={uploading}>
            Submit
          </Button>
        </div>
      </form>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent title="Submit your work?" description="Once submitted, your work is locked. An evaluator scores it with the rubric, usually within 3 working days.">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Not yet
            </Button>
            <Button leftIcon={Send} loading={submit.isPending} onClick={() => submit.mutate()}>
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Section>
  );
}

/* ───────────── onboarding + appeal ───────────── */

function OnboardingForm({ attempt, courseId }) {
  const qc = useQueryClient();
  const [portfolioUrl, setPortfolioUrl] = useState(attempt.submission.links?.[0] || "");
  const [identityConfirmed, setIdentity] = useState(false);
  const [payoutReady, setPayout] = useState(false);
  const [availabilityConfirmed, setAvailability] = useState(false);
  const [availabilityNote, setNote] = useState("");
  const send = useMutation({
    mutationFn: () => api.post(`/api/attempts/${attempt.id}/onboarding`, { portfolioUrl: portfolioUrl.trim(), identityConfirmed, payoutReady, availabilityConfirmed, availabilityNote: availabilityNote.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment", courseId] });
      qc.invalidateQueries({ queryKey: ["my-assessments"] });
      toast.success("Sent. We'll review it and issue your badge.");
    },
    onError: (e) => toast.error(e.message),
  });
  const check = (id, checked, set, label, hint) => (
    <label htmlFor={id} className="flex cursor-pointer gap-3 rounded-xl border border-line p-3.5 transition-colors hover:border-line-strong">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="mt-0.5 size-4 accent-[var(--primary)]" />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
  return (
    <Section title="Get verified">
      <p className="mb-5 text-sm text-muted">You passed. Three quick checks and an admin issues your skill badge.</p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^https?:\/\/\S+\.\S+/.test(portfolioUrl.trim())) return toast.error("Add a portfolio link that starts with https://");
          if (!identityConfirmed || !availabilityConfirmed) return toast.error("Confirm your identity and availability.");
          send.mutate();
        }}
      >
        <Field label="Portfolio link" htmlFor="ob-portfolio" hint="Your best work, including this project. Behance, GitHub, Drive or your own site.">
          <Input id="ob-portfolio" type="url" leftIcon={Link2} value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://" />
        </Field>
        {check("ob-identity", identityConfirmed, setIdentity, "My profile name and details are correct", "This name appears on your badge.")}
        {check("ob-payout", payoutReady, setPayout, "My payout details are ready (optional now)", "Needed before you can be paid for a project.")}
        {check("ob-availability", availabilityConfirmed, setAvailability, "I can take on project work", "You can change your availability any time.")}
        <Field label="Availability (optional)" htmlFor="ob-note">
          <Input id="ob-note" value={availabilityNote} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="For example: weekday evenings, about 10 hours a week" />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" leftIcon={BadgeCheck} loading={send.isPending}>
            Get verified
          </Button>
        </div>
      </form>
    </Section>
  );
}

function AppealDialog({ attempt, courseId, open, onOpenChange }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const send = useMutation({
    mutationFn: () => api.post(`/api/attempts/${attempt.id}/appeal`, { reason: reason.trim() }),
    onSuccess: () => {
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["assessment", courseId] });
      qc.invalidateQueries({ queryKey: ["my-assessments"] });
      toast.success("Appeal sent. Someone other than your evaluator will decide.");
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Appeal this result" description="An independent reviewer, not your original evaluator, looks at your work again. You can appeal each result once.">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (reason.trim().length < 20) return toast.error("Explain your appeal in at least 20 characters.");
            send.mutate();
          }}
        >
          <Field label="Why should the result change?" htmlFor="appeal-reason" hint="Point to the rubric criterion and where in your work it is met.">
            <Textarea id="appeal-reason" rows={5} value={reason} maxLength={3000} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" leftIcon={Flag} loading={send.isPending}>
              Send appeal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────── next step banner (one primary action) ───────────── */

function NextStep({ data, latest, onStart, starting, onAppeal }) {
  const { status } = data;
  const tone = { PASSED: "success", VERIFIED: "success", REASSESSMENT_REQUIRED: "warning", FAILED: "danger" }[status];
  const deadlinePassed = status === "NOT_STARTED" && !data.canStart && data.dueAt && new Date(data.dueAt) < new Date();

  let title = ATTEMPT_STATUS[status]?.label;
  let body = ATTEMPT_STATUS[status]?.hint;
  let action = null;
  if (status === "NOT_STARTED") {
    title = deadlinePassed ? "Deadline passed" : "Ready when you are";
    body = deadlinePassed ? "The deadline for this assessment has passed. Contact support if you need help." : data.course.progressPercent < 100 ? `You've finished ${data.course.progressPercent}% of the lessons. Finishing first gives you the best chance.` : "Read the brief and the rubric, then start.";
    if (data.canStart) action = <Button onClick={onStart} loading={starting}>Start</Button>;
    else if (deadlinePassed) action = <Button to="/app/help" variant="outline">Get help</Button>;
  } else if (status === "REASSESSMENT_REQUIRED") {
    title = "Reassessment required";
    body = `Read the feedback, fix what's flagged and resubmit by ${formatDate(data.reassessUntil)} (${daysLeft(data.reassessUntil)}).`;
    if (data.canReassess) action = <Button onClick={onStart} loading={starting}>Start reassessment</Button>;
  } else if (status === "FAILED") {
    title = latest?.storedStatus === "REASSESSMENT_REQUIRED" ? "Reassessment window closed" : "Assessment closed";
    body = data.canAppeal ? "You have no attempts left. If you think the result is wrong, you can appeal." : "You have no attempts left. Contact support if you need help.";
    if (data.canAppeal) action = <Button variant="outline" leftIcon={Flag} onClick={onAppeal}>Appeal</Button>;
  } else if (status === "PASSED") {
    title = latest?.onboarding?.submittedAt ? "Waiting for approval" : "You passed";
    body = latest?.onboarding?.submittedAt ? "We're checking your details. Your skill badge is issued after approval." : "Complete verification onboarding below to get your skill badge.";
  } else if (status === "VERIFIED") {
    title = "Skill verified";
    body = "Your badge is live. Keep your availability up to date.";
    action = <Button to="/app/skills" leftIcon={BadgeCheck}>View badge</Button>;
  } else if (status === "APPEAL_PENDING") {
    body = "An independent reviewer is looking at your work. We'll notify you of the decision.";
  }

  return (
    <Card className={cn("flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6", tone === "success" && "border-success/30", tone === "warning" && "border-warning/40", tone === "danger" && "border-danger/30")}>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted", tone === "success" && "bg-success-soft text-success", tone === "warning" && "bg-warning-soft text-warning", tone === "danger" && "bg-danger-soft text-danger")}>
        {status === "VERIFIED" || status === "PASSED" ? <CheckCircle2 className="size-5" /> : status === "REASSESSMENT_REQUIRED" ? <CalendarClock className="size-5" /> : status === "FAILED" ? <AlertTriangle className="size-5" /> : ["SUBMITTED", "UNDER_REVIEW"].includes(status) ? <Lock className="size-5" /> : <FileText className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{body}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Card>
  );
}

/* ───────────── page ───────────── */

export default function AssessmentDetail() {
  const { courseId } = useParams();
  const qc = useQueryClient();
  const [appealOpen, setAppealOpen] = useState(false);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["assessment", courseId], queryFn: () => api.get(`/api/courses/${courseId}/assessment`), retry: (n, e) => e?.status >= 500 && n < 2 });
  const start = useMutation({
    mutationFn: () => api.post(`/api/courses/${courseId}/assessment/start`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessment", courseId] });
      qc.invalidateQueries({ queryKey: ["my-assessments"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  if (error) return <QueryError error={error} onRetry={refetch} backTo="/app/assessments" backLabel="All assessments" />;

  const { assessment, attempts, course } = data;
  const latest = attempts[0] || null;
  const reviewed = attempts.filter((a) => a.totalScore != null);
  const lastResult = reviewed[0] || null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Assessment"
        title={course.title}
        description={assessment.title}
        actions={
          <div className="flex items-center gap-2">
            <LevelBadge level={course.level} />
            <AttemptStatus status={data.status} />
          </div>
        }
      />

      <div className="space-y-5">
        <NextStep data={data} latest={latest} onStart={() => start.mutate()} starting={start.isPending} onAppeal={() => setAppealOpen(true)} />

        {latest?.status === "IN_PROGRESS" && <DraftEditor key={latest.id} attempt={latest} assessment={assessment} courseId={course.id} uploads={data.uploads} />}
        {data.canOnboard && latest && <OnboardingForm attempt={latest} courseId={course.id} />}
        {lastResult && latest?.status !== "IN_PROGRESS" && <ResultView attempt={lastResult} passScore={assessment.passScore} />}
        {data.canAppeal && data.status !== "FAILED" && latest && (
          <p className="text-sm text-muted">
            Think the result is wrong?{" "}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => setAppealOpen(true)}>
              Appeal it
            </button>
            . An independent reviewer decides.
          </p>
        )}

        <Section title="The brief">
          <Markdown>{assessment.brief || "_The brief will appear here._"}</Markdown>
          {assessment.instructions && <p className="mt-4 border-t border-line pt-4 text-sm text-muted">{assessment.instructions}</p>}
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted">Submit as</dt>
              <dd className="mt-1">{(assessment.allowedFormats || []).map((f) => FORMAT_LABEL[f] || f).join(", ")}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Attempts</dt>
              <dd className="mt-1">
                {assessment.maxAttempts} in total · {data.attemptsLeft} left
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Deadline</dt>
              <dd className="mt-1">{data.dueAt ? formatDate(data.dueAt) : "No fixed deadline"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">If you need a reassessment, you get {assessment.reassessWindowDays} days to resubmit.</p>
        </Section>

        <RubricSummary rubric={assessment.rubric} passScore={assessment.passScore} />

        {attempts.length > 0 && (
          <Section title="Submission history">
            <ul className="space-y-4">
              {attempts.map((a) => (
                <li key={a.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      Attempt {a.attemptNo}
                      {a.version > 0 && <span className="ml-2 text-xs font-normal text-subtle">version {a.version}</span>}
                    </p>
                    <div className="flex items-center gap-2">
                      {a.totalScore != null && <span className="text-sm tabular-nums">{a.totalScore}/100</span>}
                      <AttemptStatus status={a.status} />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted">{a.submittedAt ? `Submitted ${formatDate(a.submittedAt)}` : `Started ${formatDate(a.createdAt)} · draft`}</p>
                  {a.status !== "IN_PROGRESS" && (
                    <div className="mt-3 border-t border-line pt-3">
                      <SubmissionView submission={a.submission} attemptId={a.id} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-medium tracking-tight">Course certificate or skill badge?</h2>
          <p className="mt-2 text-sm text-muted">
            A <span className="font-medium text-fg">course certificate</span> shows you finished the lessons. A{" "}
            <span className="font-medium text-fg">skill badge</span> shows you passed this assessment and were approved. Only the badge makes you eligible for project
            opportunities. Paying for or finishing a course never issues a badge.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button to="/app/certificates" variant="ghost" size="sm" rightIcon={ExternalLink}>
              Course certificates
            </Button>
            <Button to="/app/skills" variant="ghost" size="sm" rightIcon={ExternalLink}>
              My skills
            </Button>
          </div>
          <NoGuarantee className="mt-4" />
        </Card>
      </div>

      {latest && <AppealDialog attempt={latest} courseId={course.id} open={appealOpen} onOpenChange={setAppealOpen} />}
    </div>
  );
}
