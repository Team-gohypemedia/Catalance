import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, Check, ExternalLink, Info, Lock, Send, ShieldCheck, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api/client";
import { cn, formatDate, formatINR, formatNumber, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Skeleton, Textarea } from "@/components/ui/primitives";
import { Avatar, Dialog, DialogContent } from "@/components/ui/overlays";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { ApplicationTimeline, CompanyMonogram, Markdown, StatusBadge, Tag } from "@/components/earn/EarnUI";
import { APP_STATUS, DIFFICULTY, payoutSplit, trackMeta } from "@/components/earn/meta";

function ApplyDialog({ gig, open, onOpenChange }) {
  const qc = useQueryClient();
  const [pitch, setPitch] = useState("");
  const apply = useMutation({
    mutationFn: () => api.post(`/api/gigs/${gig.id}/apply`, { pitch }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gig", gig.id] });
      qc.invalidateQueries({ queryKey: ["gigs"] });
      qc.invalidateQueries({ queryKey: ["my-gig-applications"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Pitch sent. Your mentor replies within 48 hours.");
      onOpenChange(false);
      setPitch("");
    },
    onError: (e) => toast.error(e.message),
  });
  const len = pitch.trim().length;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={`Apply to ${gig.company?.name?.split(",")[0]}`} description={gig.title}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (len >= 30) apply.mutate();
          }}
          className="space-y-4"
        >
          <Field label="Your pitch" htmlFor="pitch" error={len > 0 && len < 30 ? `${30 - len} more characters` : null} hint="Why you, plus one link to similar work. Under 120 words wins.">
            <Textarea
              id="pitch"
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder={`Namaste! I'd love to work on this for ${gig.company?.name?.split(",")[0]}. Last month I…`}
              rows={6}
              maxLength={1500}
              autoFocus
            />
          </Field>
          <div className="rounded-xl border border-line p-4 text-xs text-muted">
            <p className="font-medium text-fg">What clients look for</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
              <li>Mention their business by name</li>
              <li>A link to one similar piece (portfolio, GitHub, Drive)</li>
              <li>When you'll share a first draft</li>
            </ul>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-subtle">{len}/1500</span>
            <Button type="submit" loading={apply.isPending} disabled={len < 30} leftIcon={Send}>
              Send pitch
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitDialog({ gig, application, open, onOpenChange }) {
  const qc = useQueryClient();
  const [link, setLink] = useState(application.submissionLink || "");
  const [note, setNote] = useState(application.submissionNote || "");
  const validLink = /^https?:\/\/\S+\.\S+/.test(link.trim());
  const submit = useMutation({
    mutationFn: () => api.post(`/api/gig-applications/${application.id}/submit`, { submissionLink: link.trim(), submissionNote: note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gig", gig.id] });
      qc.invalidateQueries({ queryKey: ["my-gig-applications"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Work submitted. Your mentor will review it soon.");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Submit your work" description="Your mentor reviews it first, then it goes to the client.">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (validLink) submit.mutate();
          }}
        >
          <Field label="Link to your work" htmlFor="sub-link" error={link && !validLink ? "Use a full link starting with https://" : null} hint="Google Drive, GitHub, Figma, Netlify… make sure it's viewable.">
            <Input id="sub-link" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" leftIcon={ExternalLink} autoFocus />
          </Field>
          <Field label="Note for your mentor" htmlFor="sub-note" hint="What you did, decisions you made, anything the client should know.">
            <Textarea id="sub-note" value={note} onChange={(e) => setNote(e.target.value)} rows={5} maxLength={2000} />
          </Field>
          <div className="rounded-xl border border-line p-4">
            <p className="text-xs font-medium">Deliverables check</p>
            <ul className="mt-2 space-y-1.5">
              {gig.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2 text-xs text-muted">
                  <Check className="mt-px size-3.5 shrink-0 text-primary" /> {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={submit.isPending} disabled={!validLink} leftIcon={Upload}>
              {application.status === "SUBMITTED" ? "Update submission" : "Submit work"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

export default function GigDetail() {
  const { gigId } = useParams();
  const { user } = useAuth();
  const [applyOpen, setApplyOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [checked, setChecked] = useState({});
  const { data: gig, isLoading, error, refetch } = useQuery({ queryKey: ["gig", gigId], queryFn: () => api.get(`/api/gigs/${gigId}`) });
  const { data: wallet } = useQuery({ queryKey: ["wallet"], queryFn: () => api.get("/api/wallet") });

  const back = (
    <Link to="/app/gigs" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> All gigs
    </Link>
  );

  if (isLoading) return <DetailSkeleton />;
  if (error)
    return (
      <div>
        {back}
        {error.status === 404 ? <EmptyState icon={Info} title="Gig not found" description="It may have been closed or removed by the client." action={<Button to="/app/gigs">Browse open gigs</Button>} /> : <ErrorState error={error} onRetry={refetch} />}
      </div>
    );

  const t = trackMeta(gig.category);
  const stage = user?.ladderStage || 1;
  const locked = stage < gig.minStage;
  const app = gig.myApplication;
  const split = payoutSplit(gig.payoutINR, wallet?.payLater);
  const diff = DIFFICULTY[gig.difficulty] || DIFFICULTY.EASY;
  const closed = gig.status !== "OPEN";
  const spotsLeft = gig.spotsLeft ?? gig.spots;

  return (
    <div>
      {back}

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <CompanyMonogram company={gig.company} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">
            {gig.company?.name} <span className="text-subtle">·</span> Posted {timeAgo(gig.createdAt)}
          </p>
          <h1 className="mt-1.5 max-w-3xl text-2xl leading-[1.15] font-medium tracking-tight sm:text-4xl">{gig.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Tag icon={t.icon}>{t.label}</Tag>
            <Tag>{diff.label}</Tag>
            <Tag>{gig.minStage >= 4 ? "Real project, Stage 4+" : "Micro-gig, Stage 3+"}</Tag>
            {closed && <Tag className="border-line-strong text-fg">Closed</Tag>}
          </div>
        </div>
      </motion.header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* Main */}
        <div className="min-w-0 space-y-6">
          {app && (
            <section className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-medium">Your application</h2>
                  <p className="mt-0.5 text-sm text-muted">Updated {timeAgo(app.updatedAt || app.createdAt)}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
              <ApplicationTimeline application={app} />
              <p className="mt-6 text-sm text-muted">{APP_STATUS[app.status]?.hint}.</p>
              {app.feedback && (
                <div className="mt-4 flex gap-3 rounded-xl bg-surface-2 p-4">
                  <Avatar name={gig.mentor?.name} size="sm" />
                  <div>
                    <p className="text-xs font-medium">{gig.mentor?.name}, mentor</p>
                    <p className="mt-0.5 text-sm text-muted">{app.feedback}</p>
                  </div>
                </div>
              )}
              {app.submissionLink && (
                <a href={app.submissionLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  View your submission <ArrowUpRight className="size-3.5" />
                </a>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
            <h2 className="text-base font-medium">The brief</h2>
            <Markdown className="-mt-3 text-muted [&_h2]:mt-7 [&_h2]:text-base [&_h2]:font-medium [&_h2]:text-fg [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-fg">{gig.description}</Markdown>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-medium">Deliverables</h2>
              <span className="text-xs text-muted tabular-nums">{Object.values(checked).filter(Boolean).length} of {gig.deliverables.length} ready</span>
            </div>
            <p className="mt-1 text-sm text-muted">Tick these off as you work. Your mentor checks every one.</p>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {gig.deliverables.map((d, i) => (
                <li key={d}>
                  <button
                    type="button"
                    onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                    aria-pressed={!!checked[i]}
                    className="flex w-full items-start gap-3 py-3.5 text-left text-sm transition-colors hover:text-fg"
                  >
                    <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border", checked[i] ? "border-primary bg-primary text-primary-fg" : "border-line-strong")}>
                      {checked[i] && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className={cn(checked[i] ? "text-muted line-through" : "text-fg")}>{d}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <p className="text-xs text-muted">Skills</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {gig.skills.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="order-first space-y-4 lg:sticky lg:top-24 lg:order-none">
          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <p className="text-sm text-muted">Payout</p>
            <p className="mt-1 text-3xl font-medium tracking-tight tabular-nums">{formatINR(gig.payoutINR)}</p>
            {split.deduction > 0 ? (
              <div className="mt-4 text-sm">
                <div className="mb-2.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                  <span className="rounded-full bg-primary" style={{ width: `${100 - split.pct}%` }} />
                  <span className="rounded-full bg-line-strong" style={{ width: `${split.pct}%` }} />
                </div>
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-muted"><span className="font-medium text-fg">{formatINR(split.now)}</span> to your wallet</span>
                  <span className="text-muted"><span className="font-medium text-fg">{formatINR(split.deduction)}</span> to fees</span>
                </div>
                <p className="mt-2 text-xs text-subtle">{formatINR(wallet.payLater.remainingINR)} of course fees left.</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">The full amount goes to your wallet. Withdraw to UPI anytime.</p>
            )}

            <dl className="mt-5 divide-y divide-line border-y border-line text-sm">
              {[
                ["Duration", `${gig.durationDays} days`],
                ["Apply by", formatDate(gig.deadline, { day: "numeric", month: "short" })],
                ["Spots left", `${spotsLeft} of ${gig.spots}`],
                ["Applicants", formatNumber(gig.applicantsCount)],
              ].map(([label, v]) => (
                <div key={label} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium text-fg tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5">
              {app ? (
                app.status === "ACCEPTED" || app.status === "SUBMITTED" ? (
                  <Button size="lg" className="w-full" leftIcon={Upload} onClick={() => setSubmitOpen(true)}>
                    {app.status === "SUBMITTED" ? "Update submission" : "Submit work"}
                  </Button>
                ) : (
                  <div className="flex items-center justify-between rounded-lg bg-surface-2 px-4 py-3 text-sm">
                    <span className="text-muted">Status</span>
                    <StatusBadge status={app.status} />
                  </div>
                )
              ) : locked ? (
                <div className="rounded-xl bg-surface-2 p-4 text-sm">
                  <p className="flex items-center gap-2 font-medium"><Lock className="size-4 text-muted" /> Unlocks at Stage {gig.minStage}</p>
                  <p className="mt-1 text-muted">You're on Stage {stage}. Complete your ladder requirements to apply.</p>
                  <Button to="/app/ladder" variant="brandOutline" size="sm" className="mt-3 w-full">See my ladder</Button>
                </div>
              ) : closed || spotsLeft === 0 ? (
                <Button size="lg" className="w-full" disabled>
                  {closed ? "Applications closed" : "All spots filled"}
                </Button>
              ) : (
                <>
                  <Button size="lg" className="w-full" leftIcon={Send} onClick={() => setApplyOpen(true)}>
                    Apply with a pitch
                  </Button>
                  <p className="mt-2.5 text-center text-xs text-subtle">Mentors reply within 48 hours</p>
                </>
              )}
            </div>
          </div>

          {gig.mentor && (
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-sm text-muted">Your mentor on this gig</p>
              <Link to={`/app/mentors/${gig.mentor.id}`} className="-mx-1 mt-3 flex items-center gap-3 rounded-xl p-1 hover:bg-surface-2">
                <Avatar name={gig.mentor.name} src={gig.mentor.avatarUrl} />
                <div className="min-w-0">
                  <p className="font-medium">{gig.mentor.name}</p>
                  <p className="truncate text-xs text-muted">{gig.mentor.headline}</p>
                </div>
              </Link>
              <p className="mt-3 flex items-start gap-2 border-t border-line pt-3 text-xs text-muted">
                <ShieldCheck className="mt-px size-4 shrink-0 text-primary" strokeWidth={1.75} /> Reviews your work before the client sees it, and makes sure you get paid.
              </p>
            </div>
          )}
        </aside>
      </div>

      <ApplyDialog gig={gig} open={applyOpen} onOpenChange={setApplyOpen} />
      {app && <SubmitDialog key={app.id + app.status} gig={gig} application={app} open={submitOpen} onOpenChange={setSubmitOpen} />}
    </div>
  );
}
