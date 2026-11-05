import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Copy, ExternalLink, Link2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/primitives";
import { EmptyState, PageHeader } from "@/components/ui/campus";
import { NoGuarantee } from "@/components/marketing/NoGuarantee";
import { LevelBadge, QueryError, VerificationChip, levelLabel } from "@/components/assessment/meta";

function SkillCard({ v }) {
  const url = `${window.location.origin}/verify/skill/${v.verifyCode}`;
  const active = v.status === "ACTIVE";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Verify link copied.");
    } catch {
      toast.error(`Couldn't copy. Link: ${url}`);
    }
  };
  const last = v.history?.[v.history.length - 1];
  return (
    <Card className="flex flex-col p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${active ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted"}`}>
          <BadgeCheck className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <VerificationChip status={v.status} />
            <LevelBadge level={v.level} />
          </div>
          <h3 className="mt-2 text-lg font-medium tracking-tight">{v.skill?.name}</h3>
          <p className="text-sm text-muted">
            {levelLabel(v.level)} · verified {formatDate(v.awardedAt)}
            {v.expiresAt ? ` · ${v.status === "EXPIRED" ? "expired" : "valid until"} ${formatDate(v.expiresAt)}` : ""}
          </p>
        </div>
      </div>

      {v.status === "REVOKED" && (
        <p className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          Revoked{last?.at ? ` on ${formatDate(last.at)}` : ""}. {v.revokedReason}
        </p>
      )}

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">From</dt>
          <dd className="mt-0.5 truncate">{v.course?.title || "Assessment"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Rubric</dt>
          <dd className="mt-0.5">Version {v.rubricVersion ?? "—"}</dd>
        </div>
      </dl>

      {v.evidence?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted">Evidence</p>
          <ul className="mt-1.5 space-y-1">
            {v.evidence.map((e) => (
              <li key={e.url + e.label}>
                <a href={e.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 text-sm break-all text-primary hover:underline">
                  <Link2 className="size-3.5 shrink-0" /> {e.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Button size="sm" variant="outline" leftIcon={Copy} onClick={copy} disabled={!active}>
          Copy verify link
        </Button>
        <Button size="sm" variant="ghost" leftIcon={ExternalLink} href={`/verify/skill/${v.verifyCode}`} target="_blank" rel="noreferrer">
          Open
        </Button>
      </div>
    </Card>
  );
}

export default function Skills() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["my-skills"], queryFn: () => api.get("/api/me/skills") });
  return (
    <div>
      <PageHeader
        eyebrow="Verified"
        title="My skills"
        description="A skill badge means you passed a practical assessment and an admin approved it. It records the skill, level, date and your evidence."
        actions={<Button to="/app/assessments" variant="brandOutline">Assessments</Button>}
      />
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
      ) : error ? (
        <QueryError error={error} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState
          icon={BadgeCheck}
          title="No verified skills yet"
          description="Pass a course's final assessment and complete onboarding to get your first badge. Course certificates don't count as verification."
          action={<Button to="/app/assessments">View assessments</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">{data.map((v) => <SkillCard key={v.id} v={v} />)}</div>
          <NoGuarantee className="mt-6" />
        </>
      )}
    </div>
  );
}
