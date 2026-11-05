import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, SearchX, ShieldOff } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { LogoMark } from "@/components/brand/Logo";
import { VerificationChip, levelLabel } from "@/components/assessment/meta";

/** Public skill-badge check at /verify/skill/:code (spec §8.3). Shows no private data. */
export default function VerifySkill() {
  const { code } = useParams();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["verify-skill", code], queryFn: () => api.get(`/api/verify/skill/${encodeURIComponent(code)}`), retry: false });

  return (
    <section className="mx-auto max-w-xl px-4 py-16 sm:py-24">
      {isLoading ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : error ? (
        error.status === 404 ? (
          <EmptyState icon={SearchX} title="No badge found" description={error.message} action={<Button to="/" variant="outline">Go to Campus</Button>} />
        ) : (
          <ErrorState error={error} onRetry={refetch} />
        )
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center sm:p-10">
          <div className="flex items-center justify-center gap-2.5">
            <LogoMark className="size-7" />
            <span className="text-sm font-medium tracking-tight">Catalance Campus</span>
          </div>
          <span className={`mx-auto mt-8 flex size-14 items-center justify-center rounded-full ${data.status === "ACTIVE" ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted"}`}>
            {data.status === "ACTIVE" ? <BadgeCheck className="size-7" strokeWidth={1.5} /> : <ShieldOff className="size-7" strokeWidth={1.5} />}
          </span>
          <p className="eyebrow mt-6">Skill verification</p>
          <h1 className="mt-3 text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-4xl">{data.name}</h1>
          <p className="mt-3 text-base text-muted">
            {data.status === "ACTIVE" ? "is verified in" : "held a badge in"} <span className="font-medium text-fg">{data.skill?.name}</span> at <span className="font-medium text-fg">{levelLabel(data.level)}</span> level.
          </p>
          <div className="mt-6 flex justify-center">
            <VerificationChip status={data.status} />
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-6 text-left text-sm">
            <div>
              <dt className="text-xs text-muted">Verified on</dt>
              <dd className="mt-0.5">{formatDate(data.awardedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{data.expiresAt ? "Valid until" : "Expiry"}</dt>
              <dd className="mt-0.5">{data.expiresAt ? formatDate(data.expiresAt) : "No expiry"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Code</dt>
              <dd className="mt-0.5 font-mono text-xs">{data.code}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Rubric</dt>
              <dd className="mt-0.5">Version {data.rubricVersion ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-6 text-xs text-muted">
            Issued after a practical assessment scored with a rubric and approved by Catalance. It is not a degree or a government qualification, and it does not guarantee work.
          </p>
        </div>
      )}
    </section>
  );
}
