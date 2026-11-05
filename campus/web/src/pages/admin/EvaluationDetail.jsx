import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardCheck, Gavel, Link2, Lock } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Field, Input, Skeleton, Textarea } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/overlays";
import { AdminHeader, ConfirmDialog, Markdown, Panel, SectionLabel, Status } from "@/components/admin/kit";
import { ATTEMPT_STATUS, AttemptStatus, QueryError, levelLabel, previewScore, weightShare } from "@/components/assessment/meta";
import { AttemptFileLink } from "@/components/assessment/files";

function SubmissionBlock({ submission, attemptId, canOpenFiles }) {
  const { text, links = [], files = [] } = submission || {};
  return (
    <div className="space-y-2 text-sm">
      {links.map((l) => (
        <a key={l} href={l} target="_blank" rel="noreferrer" className="flex max-w-full items-center gap-2 font-medium break-all text-primary hover:underline">
          <Link2 className="size-4 shrink-0" /> {l}
        </a>
      ))}
      {files.map((f, i) => (
        <AttemptFileLink key={f.key || i} attemptId={attemptId} index={i} file={f} />
      ))}
      {files.length > 0 && !canOpenFiles && <p className="text-xs text-muted">Claim this attempt to open its files. File links are private and expire after 10 minutes.</p>}
      {text && <p className="leading-relaxed whitespace-pre-wrap">{text}</p>}
      {!text && !links.length && !files.length && <p className="text-muted">Empty submission.</p>}
    </div>
  );
}

function ScoreSummary({ attempt }) {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <p className="text-3xl font-medium tracking-tight tabular-nums">
          {attempt.totalScore}
          <span className="text-base text-subtle">/100</span>
        </p>
        <AttemptStatus status={attempt.status} className="mb-1" />
      </div>
      <ul className="divide-y divide-line rounded-xl border border-line">
        {attempt.scores.map((s) => (
          <li key={s.criterionId} className="px-4 py-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <span>
                {s.label}
                {s.critical && <span className="ml-1.5 text-xs text-subtle">critical</span>}
              </span>
              <span className="tabular-nums">
                {s.score}/{s.maxScore}
              </span>
            </div>
            {s.note && <p className="mt-0.5 text-muted">{s.note}</p>}
          </li>
        ))}
      </ul>
      {attempt.feedback && (
        <div>
          <SectionLabel>Feedback to student</SectionLabel>
          <p className="text-sm whitespace-pre-wrap">{attempt.feedback}</p>
        </div>
      )}
      {attempt.evaluatorNotes && (
        <div>
          <SectionLabel>Internal notes</SectionLabel>
          <p className="text-sm whitespace-pre-wrap text-muted">{attempt.evaluatorNotes}</p>
        </div>
      )}
      <p className="text-xs text-subtle">
        Scored by {attempt.evaluator?.name || "—"} · rubric v{attempt.rubricVersion} · {formatDate(attempt.reviewedAt)}
      </p>
    </div>
  );
}

function ScoringForm({ attempt, rules, onDone }) {
  const criteria = attempt.rubric?.criteria || [];
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [feedback, setFeedback] = useState("");
  const [internal, setInternal] = useState("");
  const [confirm, setConfirm] = useState(false);
  const preview = useMemo(() => previewScore(criteria, scores, rules.passScore), [criteria, scores, rules.passScore]);
  const outcome = !preview.complete ? null : preview.passes ? "PASSED" : attempt.attemptNo < rules.maxAttempts ? "REASSESSMENT_REQUIRED" : "FAILED";

  const send = useMutation({
    mutationFn: () =>
      api.post(`/api/evaluations/${attempt.id}/result`, {
        scores: criteria.map((c) => ({ criterionId: c.id, score: Number(scores[c.id]), note: notes[c.id] || "" })),
        feedback: feedback.trim(),
        evaluatorNotes: internal.trim() || undefined,
      }),
    onSuccess: (a) => {
      setConfirm(false);
      toast.success(`Result sent: ${ATTEMPT_STATUS[a.status]?.label} (${a.totalScore}/100).`);
      onDone();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!preview.complete) return toast.error("Score every criterion.");
        if (feedback.trim().length < 20) return toast.error("Write feedback of at least 20 characters.");
        setConfirm(true);
      }}
    >
      <ul className="space-y-3">
        {criteria.map((c) => (
          <li key={c.id} className="rounded-xl border border-line p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {c.label}
                  {c.critical && <span className="ml-1.5 rounded-full bg-warning-soft px-1.5 py-0.5 text-[11px] text-warning">Critical</span>}
                </p>
                <p className="text-xs text-subtle">{weightShare(criteria, c)}% of the total</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={c.maxScore}
                  step={1}
                  aria-label={`Score for ${c.label}`}
                  value={scores[c.id] ?? ""}
                  onChange={(e) => setScores((s) => ({ ...s, [c.id]: e.target.value === "" ? "" : String(Math.min(c.maxScore, Math.max(0, Number(e.target.value)))) }))}
                  className="h-9 w-16 text-center tabular-nums"
                />
                <span className="text-xs text-subtle tabular-nums">/ {c.maxScore}</span>
              </div>
            </div>
            {c.guide && <p className="mt-2 text-xs text-muted">{c.guide}</p>}
            <Input aria-label={`Note for ${c.label}`} placeholder="Note to the student (optional)" value={notes[c.id] || ""} onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))} className="mt-2 h-9" />
          </li>
        ))}
      </ul>

      <div className={cn("rounded-xl border p-4", outcome === "PASSED" ? "border-success/40 bg-success-soft/40" : outcome ? "border-warning/40 bg-warning-soft/40" : "border-line")} aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">Live total</p>
          <p className="text-2xl font-medium tabular-nums">
            {preview.total}
            <span className="text-sm text-subtle">/100</span>
          </p>
        </div>
        <p className="mt-1 text-sm">
          {!outcome
            ? `Score every criterion. Pass mark ${rules.passScore}.`
            : outcome === "PASSED"
              ? "Will pass."
              : `${ATTEMPT_STATUS[outcome].label}${preview.criticalFailed.length ? `: critical not met (${preview.criticalFailed.join(", ")})` : `: below ${rules.passScore}`}.`}
        </p>
      </div>

      <Field label="Feedback to the student" htmlFor="ev-feedback" hint="Published. What worked, what to fix, and the next step.">
        <Textarea id="ev-feedback" rows={5} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      </Field>
      <Field label="Internal notes" htmlFor="ev-internal" hint="Only staff see these.">
        <Textarea id="ev-internal" rows={2} value={internal} onChange={(e) => setInternal(e.target.value)} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" leftIcon={ClipboardCheck}>
          Send result
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        tone="primary"
        title={`Send result: ${outcome ? ATTEMPT_STATUS[outcome].label : ""} (${preview.total}/100)?`}
        description="The student is notified with the score and feedback. Results are logged and can only be changed through an appeal."
        confirmLabel="Send result"
        loading={send.isPending}
        onConfirm={() => send.mutate()}
      />
    </form>
  );
}

function AppealPanel({ attempt, canDecide, onDone }) {
  const [decision, setDecision] = useState("UPHOLD");
  const [note, setNote] = useState("");
  const send = useMutation({
    mutationFn: () => api.post(`/api/evaluations/${attempt.id}/appeal-decision`, { decision, note: note.trim() }),
    onSuccess: () => {
      toast.success("Decision sent.");
      onDone();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Panel title="Appeal" description="Decided by someone other than the original evaluator.">
      <SectionLabel>Student's reason</SectionLabel>
      <p className="text-sm whitespace-pre-wrap">{attempt.appealReason}</p>
      {canDecide ? (
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (note.trim().length < 10) return toast.error("Explain the decision in at least 10 characters.");
            send.mutate();
          }}
        >
          <div role="radiogroup" aria-label="Decision" className="grid gap-2 sm:grid-cols-2">
            {[
              ["UPHOLD", "Uphold the result", "The original result stands."],
              ["OVERTURN", "Change to a pass", "The student moves to verification onboarding."],
            ].map(([v, label, hint]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={decision === v}
                onClick={() => setDecision(v)}
                className={cn("rounded-xl border p-3 text-left transition-colors", decision === v ? "border-primary bg-primary-soft/40" : "border-line hover:border-line-strong")}
              >
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </button>
            ))}
          </div>
          <Field label="Note to the student" htmlFor="ap-note">
            <Textarea id="ap-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" leftIcon={Gavel} loading={send.isPending}>
              Send decision
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">
          <Lock className="size-4 shrink-0" /> You scored this attempt, so another admin must decide the appeal.
        </p>
      )}
    </Panel>
  );
}

export default function AdminEvaluationDetail() {
  const { attemptId } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: a, isLoading, error, refetch } = useQuery({ queryKey: ["evaluation", attemptId], queryFn: () => api.get(`/api/evaluations/${attemptId}`), retry: (n, e) => e?.status >= 500 && n < 2 });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["evaluation", attemptId] });
    qc.invalidateQueries({ queryKey: ["evaluations"] });
  };
  const claim = useMutation({ mutationFn: () => api.post(`/api/evaluations/${attemptId}/claim`), onSuccess: refresh, onError: (e) => toast.error(e.message) });

  if (isLoading)
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  if (error) return <QueryError error={error} onRetry={refetch} backTo="/admin/evaluations" backLabel="Back to the queue" />;

  const isAdmin = user?.role === "ADMIN";
  const mine = a.evaluatorId === user?.id;
  const canScore = a.status === "UNDER_REVIEW" && (mine || isAdmin);
  const reviewed = a.totalScore != null;

  return (
    <>
      <AdminHeader
        crumbs={[{ label: "Evaluation queue", to: "/admin/evaluations" }, { label: a.user?.name || "Attempt" }]}
        title={a.course?.title}
        description={`${levelLabel(a.course?.level)} · attempt ${a.attemptNo} of ${a.rules?.maxAttempts} · rubric v${a.rubricVersion} · pass mark ${a.rules?.passScore}`}
        actions={<AttemptStatus status={a.status} />}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-5">
          <Panel
            title="Submission"
            description={a.submittedAt ? `Version ${a.version} · submitted ${timeAgo(a.submittedAt)}` : "Not submitted"}
            action={
              <div className="flex items-center gap-2">
                <Avatar name={a.user?.name} src={a.user?.avatarUrl} size="sm" />
                <span className="hidden text-sm sm:inline">{a.user?.name}</span>
              </div>
            }
          >
            <SubmissionBlock submission={a.submission} attemptId={a.id} canOpenFiles={mine || user?.role === "ADMIN" || user?.role === "MENTOR"} />
          </Panel>
          <Panel title="Brief">
            <Markdown>{a.assessment?.brief || "_No brief._"}</Markdown>
          </Panel>
          {a.previous?.length > 0 && (
            <Panel title="Earlier attempts">
              <ul className="space-y-4">
                {a.previous.map((p) => (
                  <li key={p.id} className="rounded-xl border border-line p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Attempt {p.attemptNo}</p>
                      <span className="text-sm tabular-nums">{p.totalScore ?? "—"}/100</span>
                    </div>
                    {p.feedback && <p className="mt-2 text-sm text-muted">{p.feedback}</p>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          <Panel title="History">
            <ol className="space-y-2.5">
              {(a.history || []).map((h, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <Status tone={ATTEMPT_STATUS[h.status]?.tone}>{ATTEMPT_STATUS[h.status]?.label || h.status}</Status>
                  <span className="text-muted">{h.note}</span>
                  <span className="ml-auto text-xs text-subtle">{formatDate(h.at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          {a.status === "APPEAL_PENDING" && isAdmin && <AppealPanel attempt={a} canDecide={!mine} onDone={refresh} />}
          <Panel title={canScore ? "Score" : "Result"} description={canScore ? `${a.rubric?.name} · v${a.rubricVersion}` : undefined}>
            {canScore ? (
              <ScoringForm attempt={a} rules={a.rules} onDone={refresh} />
            ) : a.status === "SUBMITTED" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">Waiting for an evaluator. Claim it to start scoring.</p>
                <Button leftIcon={ClipboardCheck} loading={claim.isPending} onClick={() => claim.mutate()}>
                  Claim
                </Button>
              </div>
            ) : reviewed ? (
              <ScoreSummary attempt={a} />
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Lock className="size-4" /> {a.evaluator?.name || "Another evaluator"} is scoring this.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
