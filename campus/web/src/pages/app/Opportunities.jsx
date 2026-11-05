import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, CalendarClock, Clock, Inbox, Timer } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatDate, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { NoGuarantee } from "@/components/marketing/NoGuarantee";
import { OfferChip } from "@/components/projects/parts";
import { expiresIn, skillLine } from "@/components/projects/meta";

/** Open project offers for me (spec §4.2 Project opportunities, §9.1). One action per card: View project. */
export default function Opportunities() {
  const offers = useQuery({ queryKey: ["my-offers", "open"], queryFn: () => api.get("/api/me/offers?status=open") });
  const availability = useQuery({ queryKey: ["my-availability"], queryFn: () => api.get("/api/me/availability"), retry: false });
  const skills = useQuery({ queryKey: ["my-skills"], queryFn: () => api.get("/api/me/skills"), retry: false });

  const verified = (skills.data || []).filter((s) => s.status === "ACTIVE");
  const open = availability.data?.availability?.openToProjects;

  return (
    <div>
      <PageHeader
        eyebrow="Work"
        title="Project opportunities"
        description="Offers your project manager sent you. Check the payout and terms before you reply."
        actions={
          <Button variant="outline" size="sm" to="/app/projects">
            My projects
          </Button>
        }
      />

      {availability.data && !open && (
        <Card className="mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">You are not open to projects</p>
            <p className="text-sm text-muted">Set your hours and tools so PMs know when you can take work.</p>
          </div>
          <Button size="sm" variant="brandOutline" to="/app/profile#availability">
            Set availability
          </Button>
        </Card>
      )}

      {offers.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : offers.error ? (
        <ErrorState error={offers.error} onRetry={offers.refetch} />
      ) : !offers.data?.length ? (
        <EmptyState
          icon={Inbox}
          title="No open offers right now"
          description={
            verified.length
              ? "When a project fits your verified skills, your PM will send it here."
              : "Pass a skill assessment and get verified to become eligible for projects."
          }
          action={
            verified.length ? (
              <Button variant="outline" to="/app/projects">
                View my projects
              </Button>
            ) : (
              <Button to="/app/assessments" leftIcon={BadgeCheck}>
                Get verified
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {offers.data.map((o) => (
            <Card key={o.id} interactive className="flex flex-col p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-muted">{skillLine(o)}</p>
                <OfferChip offer={o} />
              </div>
              <h2 className="mt-2 text-lg leading-snug font-medium tracking-tight">
                <Link to={`/app/projects/${o.id}`} className="hover:underline">
                  {o.title}
                </Link>
              </h2>
              {o.summary && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{o.summary}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
                <span className="text-xl font-medium tracking-tight text-fg tabular-nums">{formatINR(o.payoutINR)}</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="size-3.5" /> Due {formatDate(o.deadline)}
                </span>
                {o.expectedHours && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {o.expectedHours}h
                  </span>
                )}
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                <span className="inline-flex items-center gap-1 text-xs text-warning">
                  <Timer className="size-3.5" /> {expiresIn(o.expiresAt)}
                </span>
                <Button size="sm" to={`/app/projects/${o.id}`} rightIcon={ArrowRight}>
                  View project
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <NoGuarantee className="mt-8" />
    </div>
  );
}
