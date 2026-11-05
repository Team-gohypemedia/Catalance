import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BadgeCheck, CalendarDays, Clock, ExternalLink, Send, UserSearch } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Skeleton, Textarea } from "@/components/ui/primitives";
import { Avatar, Dialog, DialogContent, Switch } from "@/components/ui/overlays";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { AdminHeader, Tag } from "@/components/admin/kit";
import { DAYS, LEVELS, LEVEL_LABEL } from "@/components/projects/meta";

const dayLabel = Object.fromEntries(DAYS);

/**
 * Verified talent (spec §5.3 step 2, §13.2–13.4): transparent, rule-based filters over ACTIVE skill verifications.
 * Order is open-to-work → lighter workload → fewer recent offers → name. Never by fees paid. Declines are not shown.
 */
export default function AdminTalent() {
  const [params, setParams] = useSearchParams();
  const fromOffer = params.get("from");
  const [filters, setFilters] = useState({ skill: params.get("skill") || "", level: params.get("level") || "", available: params.get("available") === "1", q: "" });
  const [picked, setPicked] = useState(null);

  const query = { skill: filters.skill || undefined, level: filters.level || undefined, available: filters.available ? 1 : undefined, q: filters.q.trim() || undefined };
  const talent = useQuery({ queryKey: ["pm-talent", query], queryFn: () => api.get(`/api/pm/talent${qs(query)}`) });
  const everyone = useQuery({ queryKey: ["pm-talent", {}], queryFn: () => api.get("/api/pm/talent") });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => api.get("/api/categories"), retry: false, staleTime: 300_000 });

  // Skill filter: the catalogue when it's there, plus every skill someone is verified in.
  const skillOptions = useMemo(() => {
    const map = new Map();
    for (const c of categories.data || []) for (const s of c.skills || []) map.set(s.slug, s.name);
    for (const r of everyone.data || []) for (const v of r.verifications) if (v.skill?.slug) map.set(v.skill.slug, v.skill.name);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [categories.data, everyone.data]);

  const set = (k) => (v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    if (k !== "q") {
      const next = new URLSearchParams(params);
      if (v && v !== false) next.set(k, v === true ? "1" : v);
      else next.delete(k);
      setParams(next, { replace: true });
    }
  };

  return (
    <div>
      <AdminHeader
        title="Verified talent"
        description="Students with an active skill verification. Shortlist by skill, level, availability and workload."
        crumbs={fromOffer ? [{ label: "Project offers", to: "/admin/offers" }, { label: "Offer to another student" }] : undefined}
      />

      <div className="mb-5 grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1fr_180px_200px_auto]">
        <Field label="Skill" htmlFor="tl-skill">
          <Select id="tl-skill" value={filters.skill} onChange={(e) => set("skill")(e.target.value)}>
            <option value="">All skills</option>
            {skillOptions.map(([slug, name]) => (
              <option key={slug} value={slug}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Level (or higher)" htmlFor="tl-level">
          <Select id="tl-level" value={filters.level} onChange={(e) => set("level")(e.target.value)}>
            <option value="">Any level</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABEL[l]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Search" htmlFor="tl-q">
          <Input id="tl-q" value={filters.q} onChange={(e) => set("q")(e.target.value)} placeholder="Name, tool, skill" />
        </Field>
        <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm text-fg">
          <Switch checked={filters.available} onCheckedChange={set("available")} aria-label="Open to projects only" />
          Open to projects
        </label>
      </div>

      {talent.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : talent.error ? (
        <ErrorState error={talent.error} onRetry={talent.refetch} />
      ) : !talent.data?.length ? (
        <EmptyState icon={UserSearch} title="No verified students match" description="Try a lower level, another skill, or include students who are not open to projects." />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            {talent.data.length} verified student{talent.data.length === 1 ? "" : "s"}. Sorted by availability, then lighter workload, then fewer recent offers.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {talent.data.map((row) => (
              <CandidateCard key={row.user.id} row={row} onOffer={() => setPicked(row)} />
            ))}
          </div>
        </>
      )}

      {picked && <ShortlistDialog row={picked} skill={filters.skill} level={filters.level} fromOffer={fromOffer} onClose={() => setPicked(null)} />}
    </div>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div className="min-w-0 bg-surface px-3 py-2.5">
      <p className="truncate text-xs text-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-fg tabular-nums">{value}</p>
      {hint && <p className="truncate text-[11px] text-subtle">{hint}</p>}
    </div>
  );
}

function CandidateCard({ row, onOffer }) {
  const { user: u, verifications, availability: av, portfolio } = row;
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start gap-3">
        <Avatar name={u.name} src={u.avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-fg">{u.name}</p>
          <p className="truncate text-xs text-muted">{[u.college?.shortName || u.college?.name, u.stream, u.city].filter(Boolean).join(" · ")}</p>
        </div>
        <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs", av.openToProjects ? "border-success/30 text-success" : "border-line text-muted")}>
          <span className={cn("size-1.5 rounded-full", av.openToProjects ? "bg-success" : "bg-subtle")} aria-hidden="true" />
          {av.openToProjects ? "Open" : "Not open"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {verifications.map((v) => (
          <span
            key={v.id}
            className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs", v.matches ? "border-primary/40 bg-primary-soft text-primary" : "border-line text-fg/80")}
            title={`Verified ${timeAgo(v.awardedAt)} · ${v.verifyCode}`}
          >
            <BadgeCheck className="size-3.5" /> {v.skill?.name} · {LEVEL_LABEL[v.level] || v.level}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
        <Metric label="Active now" value={row.activeProjects} />
        <Metric label="Completed" value={row.completedProjects} />
        <Metric label="On time" value={row.onTimeRate == null ? "—" : `${row.onTimeRate}%`} hint={row.avgRating ? `Rating ${row.avgRating}/5` : null} />
        <Metric label="Offers, 30 days" value={row.offersLast30d} hint={row.lastOfferAt ? `Last ${timeAgo(row.lastOfferAt)}` : "No offers yet"} />
      </div>

      <div className="mt-4 space-y-1.5 text-sm text-muted">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> {av.hoursPerWeek || 0}h / week
          </span>
          {av.days?.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" /> {av.days.map((d) => dayLabel[d] || d).join(", ")}
            </span>
          )}
        </p>
        {av.preferredTaskTypes?.length > 0 && <p className="truncate">Prefers: {av.preferredTaskTypes.join(", ")}</p>}
        {av.communication && <p className="truncate">Reach: {av.communication}</p>}
      </div>

      {av.tools?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {av.tools.slice(0, 8).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}

      {portfolio?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {portfolio.map((p) => (
            <li key={p.id} className="flex min-w-0 items-center gap-1.5 text-sm">
              {p.verified && <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-label="Verified work" />}
              {p.link ? (
                <a href={p.link} target="_blank" rel="noreferrer noopener" className="inline-flex min-w-0 items-center gap-1 text-fg hover:underline">
                  <span className="truncate">{p.title}</span> <ExternalLink className="size-3 shrink-0 text-subtle" />
                </a>
              ) : (
                <span className="truncate text-fg">{p.title}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {row.openDisputes > 0 && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-danger">
          <AlertTriangle className="size-3.5" /> {row.openDisputes} open dispute{row.openDisputes === 1 ? "" : "s"}
        </p>
      )}

      <div className="mt-auto flex justify-end pt-4">
        <Button size="sm" leftIcon={Send} onClick={onOffer}>
          Create offer
        </Button>
      </div>
    </article>
  );
}

/** Shortlist reason is required (spec §13.3: keep a log of why a student was shortlisted). */
function ShortlistDialog({ row, skill, level, fromOffer, onClose }) {
  const navigate = useNavigate();
  const first = row.verifications.find((v) => v.matches) || row.verifications[0];
  const [verId, setVerId] = useState(first?.id || "");
  const [reason, setReason] = useState("");
  const ver = row.verifications.find((v) => v.id === verId);
  // Offer at the filtered level when the badge covers it; otherwise at the badge's own level.
  const offerLevel = level && ver?.matches ? level : ver?.level;
  const tooShort = reason.trim().length < 10;

  const go = () => {
    const p = new URLSearchParams({ studentId: row.user.id, skillId: ver.skill.id, level: offerLevel });
    if (fromOffer) p.set("from", fromOffer);
    navigate(`/admin/offers/new?${p}`, { state: { shortlistReason: reason.trim(), skillSlug: skill || ver.skill.slug } });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={`Offer to ${row.user.name}`} description="Say why this student fits. It is kept in the offer log." size="md">
        <div className="space-y-4">
          <Field label="Skill and level" htmlFor="sl-ver">
            <Select id="sl-ver" value={verId} onChange={(e) => setVerId(e.target.value)}>
              {row.verifications.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.skill?.name} · {LEVEL_LABEL[v.level] || v.level}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Shortlist reason" htmlFor="sl-reason" hint="e.g. Verified Intermediate, 12 h/week free, similar portfolio piece." error={reason && tooShort ? "At least 10 characters." : null}>
            <Textarea id="sl-reason" rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!ver || tooShort} onClick={go}>
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
