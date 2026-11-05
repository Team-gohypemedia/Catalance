import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Copy, SearchX } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { LogoMark } from "@/components/brand/Logo";

export default function VerifyCertificate() {
  const { code } = useParams();
  const { data: cert, isLoading, error, refetch } = useQuery({
    queryKey: ["public", "certificate", code],
    queryFn: () => api.get(`/api/certificates/verify/${encodeURIComponent(code)}`),
    retry: false,
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Verification link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <section className="container-campus max-w-4xl py-16 sm:py-24">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-sm">
          <span className="text-muted">Certificate verification</span>
          <span className="font-mono text-xs font-medium">{code}</span>
        </span>
      </div>

      <div className="mt-10">
        {isLoading ? (
          <Skeleton className="mx-auto aspect-[1.414] w-full max-w-3xl rounded-2xl" />
        ) : error ? (
          error.status === 404 ? (
            <EmptyState
              icon={SearchX}
              title="We couldn't find this certificate"
              description={`No Campus certificate matches the code “${code}”. Check the code for typos; it's printed at the bottom of every certificate.`}
              action={
                <Button to="/" variant="outline">
                  Go to Campus
                </Button>
              }
              className="mx-auto max-w-3xl bg-surface"
            />
          ) : (
            <ErrorState error={error} onRetry={refetch} />
          )
        ) : (
          <>
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-3xl rounded-2xl border border-line bg-surface p-2 shadow-sm"
              aria-label="Certificate"
            >
              <div className="flex flex-col items-center rounded-xl border border-line px-6 py-12 text-center sm:px-14 sm:py-16">
                <div className="flex items-center gap-2.5">
                  <LogoMark className="size-8" />
                  <span className="text-sm font-semibold tracking-tight uppercase">Catalance</span>
                  <span className="font-accent text-lg leading-none">Campus</span>
                </div>
                <p className="eyebrow mt-10">Certificate of completion</p>
                <p className="mt-6 text-sm text-muted">This certifies that</p>
                <h1 className="mt-3 text-4xl leading-[1.1] font-medium tracking-tight break-words sm:text-6xl">{cert.userName}</h1>
                <p className="mt-5 text-sm text-muted">has successfully completed</p>
                <p className="mt-2 text-xl font-medium tracking-tight sm:text-2xl">
                  <em className="accent text-2xl sm:text-3xl">{cert.courseTitle}</em>
                </p>
                {cert.trackTitle && <p className="mt-1.5 text-sm text-muted">{cert.trackTitle} track</p>}

                <span className="mt-10 flex size-14 items-center justify-center rounded-full border border-primary/30 bg-primary-soft text-primary" aria-hidden="true">
                  <BadgeCheck className="size-7" strokeWidth={1.75} />
                </span>

                <dl className="mt-10 grid w-full grid-cols-1 gap-5 border-t border-line pt-8 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted">Final score</dt>
                    <dd className="mt-1 text-base font-medium">{cert.score != null ? `${cert.score}%` : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Mentor</dt>
                    <dd className="mt-1 text-base font-medium">{cert.mentorName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Issued</dt>
                    <dd className="mt-1 text-base font-medium">{formatDate(cert.issuedAt)}</dd>
                  </div>
                </dl>
                <p className="mt-8 font-mono text-xs text-subtle">Verification code: {cert.verifyCode || code}</p>
              </div>
            </motion.article>

            <div className="mx-auto mt-4 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-5 py-4 sm:flex-row sm:px-6">
              <p className="flex items-center gap-2.5 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                  <BadgeCheck className="size-3.5" />
                </span>
                This certificate is genuine and was issued by Catalance Campus.
              </p>
              <Button variant="outline" size="sm" leftIcon={Copy} onClick={copyLink} className="shrink-0">
                Copy link
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="mt-14 text-center">
        <p className="text-muted">Campus certificates are verified skill certificates, backed by mentor-reviewed work.</p>
        <Button to="/signup" variant="link" rightIcon={ArrowRight} className="mt-1">
          Earn yours, start free
        </Button>
      </div>
    </section>
  );
}
