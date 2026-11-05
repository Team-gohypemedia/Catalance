/**
 * Shared assessment UI bits: status chips (spec §8.1 states), level labels, the scoring formula used for live previews,
 * and small helpers. Scoring mirrors api/src/services/assessment.js — keep both in step.
 */
import { Lock, ShieldAlert } from "lucide-react";
import { Status } from "@/components/admin/kit";
import { Badge } from "@/components/ui/primitives";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { Button } from "@/components/ui/button";

export const ATTEMPT_STATUS = {
  NOT_STARTED: { label: "Not started", tone: "neutral", hint: "Start when you're ready." },
  IN_PROGRESS: { label: "In progress", tone: "sky", hint: "Save a draft, then submit." },
  SUBMITTED: { label: "Submitted", tone: "warning", hint: "Locked. Waiting for an evaluator." },
  UNDER_REVIEW: { label: "Under review", tone: "violet", hint: "An evaluator is scoring your work." },
  PASSED: { label: "Passed", tone: "success", hint: "Complete onboarding to get verified." },
  REASSESSMENT_REQUIRED: { label: "Reassessment required", tone: "warning", hint: "Read the feedback and resubmit." },
  FAILED: { label: "Closed", tone: "danger", hint: "No attempts left. You can appeal." },
  APPEAL_PENDING: { label: "Appeal pending", tone: "violet", hint: "An independent reviewer is deciding." },
  VERIFIED: { label: "Verified", tone: "success", hint: "Your skill badge is live." },
};

export const VERIFICATION_STATUS = {
  ACTIVE: { label: "Active", tone: "success" },
  REVOKED: { label: "Revoked", tone: "danger" },
  EXPIRED: { label: "Expired", tone: "neutral" },
};

export const LEVEL_LABEL = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced", STANDARD: "Standard" };
export const levelLabel = (l) => LEVEL_LABEL[l] || l || "";

export function AttemptStatus({ status, className }) {
  const m = ATTEMPT_STATUS[status] || { label: status, tone: "neutral" };
  return (
    <Status tone={m.tone} className={className}>
      {m.label}
    </Status>
  );
}

export function VerificationChip({ status, className }) {
  const m = VERIFICATION_STATUS[status] || { label: status, tone: "neutral" };
  return (
    <Status tone={m.tone} className={className}>
      {m.label}
    </Status>
  );
}

export const LevelBadge = ({ level, className }) => (
  <Badge tone="outline" className={className}>
    {levelLabel(level)}
  </Badge>
);

/** Live total + pass preview (same formula as the API: Σ weight × score/max, normalised to 100). */
export function previewScore(criteria = [], scores = {}, passScore = 70) {
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0) || 1;
  let weighted = 0;
  let complete = true;
  const criticalFailed = [];
  for (const c of criteria) {
    const raw = scores[c.id];
    if (raw === "" || raw == null || !Number.isFinite(Number(raw))) {
      complete = false;
      continue;
    }
    const v = Math.min(c.maxScore, Math.max(0, Number(raw)));
    weighted += c.weight * (v / c.maxScore);
    if (c.critical && v < c.maxScore * 0.5) criticalFailed.push(c.label);
  }
  const total = Math.round((weighted / totalWeight) * 100);
  return { total, complete, criticalFailed, passes: complete && total >= passScore && !criticalFailed.length };
}

/** Weight as a share of the rubric (for "30%" labels). */
export const weightShare = (criteria, c) => Math.round((c.weight / (criteria.reduce((s, x) => s + x.weight, 0) || 1)) * 100);

/** "9 days left" / "ends today" / "closed". */
export function daysLeft(until) {
  if (!until) return null;
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return "closed";
  const d = Math.ceil(ms / 86400000);
  return d <= 1 ? "ends today" : `${d} days left`;
}

/** Error view that distinguishes "no access" (403) and "not found" (404) from other failures (spec §14.2). */
export function QueryError({ error, onRetry, backTo, backLabel = "Go back" }) {
  if (error?.status === 403)
    return (
      <EmptyState icon={Lock} title="You can't open this yet" description={error.message} action={backTo ? <Button to={backTo} variant="outline">{backLabel}</Button> : null} />
    );
  if (error?.status === 404)
    return <EmptyState icon={ShieldAlert} title="Not found" description={error.message} action={backTo ? <Button to={backTo} variant="outline">{backLabel}</Button> : null} />;
  return <ErrorState error={error} onRetry={onRetry} />;
}
