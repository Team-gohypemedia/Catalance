import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, FileCheck2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/primitives";
import { EmptyState, PageHeader } from "@/components/ui/campus";
import { NoGuarantee } from "@/components/marketing/NoGuarantee";
import { ATTEMPT_STATUS, AttemptStatus, LevelBadge, QueryError, daysLeft } from "@/components/assessment/meta";

/** One primary verb per state (spec §14.1: Start, Submit, View feedback, Get verified). */
function actionFor(row) {
  switch (row.status) {
    case "NOT_STARTED":
      return "Start";
    case "IN_PROGRESS":
      return "Continue";
    case "PASSED":
      return row.attempt?.onboarding?.submittedAt ? "View" : "Get verified";
    case "REASSESSMENT_REQUIRED":
    case "FAILED":
      return "View feedback";
    case "VERIFIED":
      return "View badge";
    default:
      return "View";
  }
}

function AssessmentRow({ row }) {
  const status = row.status;
  const left = status === "REASSESSMENT_REQUIRED" ? daysLeft(row.reassessUntil) : null;
  const primary = ["NOT_STARTED", "IN_PROGRESS", "REASSESSMENT_REQUIRED"].includes(status) || (status === "PASSED" && !row.attempt?.onboarding?.submittedAt);
  return (
    <Card interactive className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <AttemptStatus status={status} />
          <LevelBadge level={row.course.level} />
          {row.attempt?.totalScore != null && <span className="text-xs text-muted tabular-nums">Score {row.attempt.totalScore}/100</span>}
        </div>
        <h3 className="mt-2.5 truncate text-base font-medium tracking-tight">{row.course.title}</h3>
        <p className="mt-1 text-sm text-muted">
          {status === "REASSESSMENT_REQUIRED" && row.reassessUntil ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5" /> Resubmit by {formatDate(row.reassessUntil)} · {left}
            </span>
          ) : status === "NOT_STARTED" && row.progressPercent < 100 ? (
            `Course ${row.progressPercent}% done. Finish the lessons first for the best result.`
          ) : (
            ATTEMPT_STATUS[status]?.hint
          )}
        </p>
      </div>
      <Button to={status === "VERIFIED" ? "/app/skills" : `/app/assessments/${row.course.id}`} variant={primary ? "primary" : "outline"} rightIcon={ArrowRight} className="w-full sm:w-auto">
        {actionFor(row)}
      </Button>
    </Card>
  );
}

export default function Assessments() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["my-assessments"], queryFn: () => api.get("/api/me/assessments") });
  const active = (data || []).filter((r) => !["VERIFIED", "FAILED"].includes(r.status));
  const done = (data || []).filter((r) => ["VERIFIED", "FAILED"].includes(r.status));

  return (
    <div>
      <PageHeader
        eyebrow="Prove it"
        title="Assessments"
        description="Each course ends with one practical project, scored with a rubric. Pass it to get your skill verified."
      />
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : error ? (
        <QueryError error={error} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState icon={FileCheck2} title="No assessments yet" description="Enrol in a course. Its final assessment shows up here." action={<Button to="/app/catalog">Explore courses</Button>} />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section className="space-y-3">
              {active.map((r) => <AssessmentRow key={r.course.id} row={r} />)}
            </section>
          )}
          {done.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted">Completed</h2>
              <div className="space-y-3">{done.map((r) => <AssessmentRow key={r.course.id} row={r} />)}</div>
            </section>
          )}
          <NoGuarantee />
        </div>
      )}
    </div>
  );
}
