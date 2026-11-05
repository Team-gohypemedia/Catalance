import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { CohortCard, CohortStatus, TrackLabel } from "@/components/community/CohortCard";

export default function Cohorts() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["cohorts"], queryFn: () => api.get("/api/cohorts") });

  const join = useMutation({
    mutationFn: (c) => api.post(`/api/cohorts/${c.id}/join`),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["cohorts"] });
      qc.setQueryData(["cohort", c.id], c);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(`Welcome to ${c.title}`);
      navigate(`/app/cohorts/${c.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const mine = (data || []).filter((c) => c.isMember);
  const others = (data || []).filter((c) => !c.isMember);

  return (
    <div>
      <PageHeader
        eyebrow="Cohorts"
        title={
          <>
            Learn together, <em className="accent">not alone</em>
          </>
        }
        description="Small study groups with a lead mentor, a fixed weekly schedule and a shared feed. People who learn in cohorts finish far more often."
      />

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState icon={Users} title="No cohorts open right now" description="New batches open every month. We'll notify you when one starts in your track." />
      ) : (
        <>
          {mine.length > 0 && (
            <section className="mb-12">
              <h2 className="mb-4 text-lg font-medium tracking-tight">Your cohorts</h2>
              <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                {mine.map((c) => (
                  <Link key={c.id} to={`/app/cohorts/${c.id}`} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2/50 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium group-hover:text-primary">{c.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <TrackLabel track={c.track} />
                        <span className="text-xs text-subtle">{c.schedule}</span>
                        <CohortStatus cohort={c} />
                      </div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-subtle transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-lg font-medium tracking-tight">{mine.length ? "Explore more cohorts" : "Open cohorts"}</h2>
            {others.length === 0 ? (
              <EmptyState icon={Users} title="You've joined every open cohort" description="New batches open every month." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {others.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.03 }}
                  >
                    <CohortCard cohort={c} onJoin={(x) => join.mutate(x)} joining={join.isPending && join.variables?.id === c.id} />
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
