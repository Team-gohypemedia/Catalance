/**
 * B (consent): the student's consent records for Settings (spec §15). Shows what was accepted, when, and which
 * policy version. Marketing can be given or withdrawn here; legal consents can't be withdrawn while using Campus.
 */
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/overlays";
import { CONSENT_COPY } from "./ConsentCheckboxes";

export function ConsentsList() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["my-consents"], queryFn: () => api.get("/api/me/consents") });

  const marketing = useMutation({
    mutationFn: (on) => (on ? api.post("/api/me/consents", { purposes: ["MARKETING"], context: "settings" }) : api.post("/api/me/consents/MARKETING/withdraw")),
    onSuccess: (_r, on) => {
      qc.invalidateQueries({ queryKey: ["my-consents"] });
      toast.success(on ? "You'll get course news and offers." : "Marketing emails stopped.");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-32 rounded-xl" />;
  if (error)
    return (
      <p className="text-sm text-muted">
        Couldn't load your consents.{" "}
        <button type="button" className="cursor-pointer text-primary underline-offset-4 hover:underline" onClick={() => refetch()}>
          Try again
        </button>
      </p>
    );

  const rows = data || [];
  // latest record per purpose (rows come newest first)
  const latest = new Map();
  for (const r of rows) if (!latest.has(r.purpose)) latest.set(r.purpose, r);
  const marketingOn = Boolean(latest.get("MARKETING") && !latest.get("MARKETING").withdrawnAt);
  const legal = [...latest.values()].filter((r) => r.purpose !== "MARKETING");

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium" id="consent-marketing">
            Course news and offers
          </p>
          <p className="text-xs text-muted">Optional. Stop any time.</p>
        </div>
        <Switch aria-labelledby="consent-marketing" checked={marketingOn} disabled={marketing.isPending} onCheckedChange={(v) => marketing.mutate(v)} />
      </div>

      <ul className="mt-5 divide-y divide-line border-t border-line">
        {legal.length ? (
          legal.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 py-3 text-sm">
              <span>{CONSENT_COPY[r.purpose]?.label || r.purpose}</span>
              <span className="text-xs text-muted">
                Accepted {formatDate(r.acceptedAt)} · version {r.policyVersion}
              </span>
            </li>
          ))
        ) : (
          <li className="py-3 text-sm text-muted">No consent records yet.</li>
        )}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Terms and privacy consents are needed to use Campus. To close your account, <Link to="/app/help" className="text-primary underline-offset-4 hover:underline">contact support</Link>.
      </p>
    </div>
  );
}
