/**
 * Reports (spec §16): seven dashboards built from the domain tables, a date range, CSV export,
 * and (admins) the funnel visitor → paid → verified → first accepted paid project with the north-star metric.
 * Charts use at most two series (primary + sky, colour-validated) with a legend and a table view.
 */
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Download, Star } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatINR, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { AdminHeader, Kpi, KpiGrid, Panel } from "@/components/admin/kit";
import { DataTable, Segmented } from "@/components/admin/DataTable";
import { downloadCsv } from "@/components/admin/csv-download";

const C1 = "var(--primary)";
const C2 = "var(--sky)";

const fmt = {
  num: (v) => formatNumber(v),
  pct: (v) => `${v}%`,
  inr: (v) => formatINR(v),
  days: (v) => `${v} days`,
  hours: (v) => `${v} h`,
};
const show = (v, kind = "num") => (v === null || v === undefined ? "—" : fmt[kind](v));

/** Tiles and chart per report. Keys match the API's `metrics` and `series`. */
const REPORTS = {
  growth: {
    label: "Growth",
    description: "Sign-ups to paid enrolments.",
    tiles: [
      ["signups", "Sign-ups"],
      ["checkoutStarts", "Checkout starts"],
      ["paidEnrolments", "Paid enrolments"],
      ["signupToPaidRate", "Sign-up to paid", "pct"],
      ["checkoutToPaidRate", "Checkout to paid", "pct"],
      ["visits", "Visits", "num", "Needs web analytics"],
      ["leadSources", "Lead source", "num", "Needs web analytics"],
      ["cacINR", "CAC", "inr", "Needs marketing spend"],
    ],
    chart: { kind: "line", x: "date", series: [["signups", "Sign-ups"], ["paidEnrolments", "Paid enrolments"]] },
  },
  course: {
    label: "Course",
    description: "Enrolment, progress, completion and assessment results.",
    tiles: [
      ["enrolments", "Enrolments"],
      ["avgProgress", "Average progress", "pct"],
      ["completionRate", "Completion", "pct"],
      ["passRate", "Assessment pass rate", "pct"],
      ["latenessRate", "Late submissions", "pct"],
      ["reassessments", "Reassessments"],
      ["refunds", "Refunds"],
      ["refundINR", "Refunded", "inr"],
    ],
    chart: { kind: "bar", x: "label", series: [["enrolments", "Enrolments"], ["completed", "Completed"]] },
  },
  talent: {
    label: "Talent",
    description: "Verified students by skill and level.",
    tiles: [
      ["verifiedStudents", "Verified students"],
      ["newVerifications", "New verifications"],
      ["openToProjects", "Open to projects"],
      ["avgProfileCompleteness", "Profile complete", "pct"],
      ["avgRating", "Average rating", "num"],
      ["onTimeRate", "On time", "pct"],
      ["suspended", "Suspended"],
      ["appealsOpen", "Open appeals"],
    ],
    chart: { kind: "bar", x: "label", series: [["verified", "Verified"], ["openToProjects", "Open to projects"]] },
  },
  marketplace: {
    label: "Marketplace",
    description: "Project offers, responses and paid completions.",
    tiles: [
      ["offers", "Offers sent"],
      ["accepted", "Accepted"],
      ["acceptanceRate", "Acceptance rate", "pct"],
      ["expired", "Expired"],
      ["medianDaysToFirstOpportunity", "Verified to first offer", "days"],
      ["paidProjectsCompleted", "Paid projects done"],
      ["repeatWorkRate", "Repeat work", "pct"],
      ["declined", "Declined"],
    ],
    chart: { kind: "line", x: "date", series: [["offers", "Offers"], ["accepted", "Accepted"]] },
  },
  quality: {
    label: "Quality",
    description: "Client acceptance, delivery and disputes.",
    tiles: [
      ["completed", "Client accepted"],
      ["clientAcceptanceRate", "Acceptance rate", "pct"],
      ["onTimeRate", "On-time delivery", "pct"],
      ["avgRevisions", "Average revisions"],
      ["avgRating", "Average rating"],
      ["complaints", "Complaints"],
      ["disputes", "Disputes"],
      ["disputeRate", "Dispute rate", "pct"],
    ],
    chart: null,
  },
  finance: {
    label: "Finance",
    description: "Course revenue (ex GST), refunds, project share and payouts.",
    tiles: [
      ["courseRevenueExTaxINR", "Course revenue ex GST", "inr"],
      ["refundsINR", "Refunds", "inr"],
      ["netCourseRevenueINR", "Net course revenue", "inr"],
      ["platformShareINR", "Platform share", "inr"],
      ["freelancerPayoutsINR", "Freelancer payouts", "inr"],
      ["payoutsPendingINR", "Payouts pending", "inr"],
      ["paymentFeesEstINR", "Payment fees (est.)", "inr"],
      ["contributionMarginINR", "Contribution margin", "inr"],
    ],
    chart: { kind: "bar", x: "date", money: true, series: [["courseRevenueExTaxINR", "Course revenue"], ["platformShareINR", "Platform share"]] },
  },
  capacity: {
    label: "Capacity",
    description: "Workload today: instructors, evaluators, PMs and support.",
    tiles: [
      ["instructors", "Instructors"],
      ["pendingAssignmentReviews", "Assignments to review"],
      ["evaluatorQueue", "Evaluation queue"],
      ["unassignedEvaluations", "Unassigned evaluations"],
      ["oldestEvaluationHours", "Oldest evaluation", "hours"],
      ["activeProjects", "Active projects"],
      ["openTickets", "Open tickets"],
      ["urgentTickets", "High or urgent"],
    ],
    chart: { kind: "bar", x: "label", series: [["assigned", "Assigned"], ["waiting", "Waiting"]] },
  },
};
const NAMES = Object.keys(REPORTS);

const PRESETS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "custom", label: "Custom" },
];
const isoDay = (d) => d.toISOString().slice(0, 10);
function rangeFor(preset, custom) {
  if (preset === "custom") return { from: custom.from || undefined, to: custom.to || undefined };
  const to = new Date();
  const from = new Date(Date.now() - (Number(preset) - 1) * 86400000);
  return { from: isoDay(from), to: isoDay(to) };
}

/* ── charts ── */

function ChartTip({ active, payload, label, money, isDate }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-md">
      <p className="text-muted">{isDate ? formatDate(label, { weekday: "short", day: "numeric", month: "short" }) : label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="mt-0.5 flex items-center gap-2 text-sm text-fg tabular-nums">
          <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden="true" />
          <span className="text-muted">{p.name}</span>
          <span className="font-medium">{money ? formatINR(p.value) : formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function ReportChart({ spec, data }) {
  const isDate = spec.x === "date";
  const rows = data || [];
  const total = rows.reduce((s, r) => s + spec.series.reduce((t, [k]) => t + (Number(r[k]) || 0), 0), 0);
  if (!rows.length || !total) return <EmptyState icon={BarChart3} title="Nothing to chart yet" description="Numbers appear here once there is activity in this range." className="border-0 py-10" />;
  const axis = { tickLine: false, axisLine: false, tick: { fill: "var(--subtle)", fontSize: 11 } };
  const xTick = isDate ? (d) => (d.length > 7 ? formatDate(d, { day: "numeric", month: "short" }) : d) : (v) => (String(v).length > 14 ? `${String(v).slice(0, 13)}…` : v);
  const yTick = spec.money ? (v) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`) : undefined;
  const legend = <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "var(--muted)", paddingTop: 8 }} />;
  const label = `${spec.series.map((s) => s[1]).join(" and ")} chart. The table below has the same numbers.`;
  return (
    <div className="h-64" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        {spec.kind === "line" ? (
          <LineChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey={spec.x} {...axis} tickFormatter={xTick} minTickGap={24} tickMargin={8} />
            <YAxis allowDecimals={false} {...axis} width={40} />
            <RTooltip cursor={{ stroke: "var(--line-strong)" }} content={<ChartTip isDate={isDate} />} />
            {legend}
            {spec.series.map(([k, name], i) => (
              <Line key={k} type="monotone" dataKey={k} name={name} stroke={i ? C2 : C1} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }} isAnimationActive={false} />
            ))}
          </LineChart>
        ) : (
          <BarChart data={rows} margin={{ top: 8, right: 8, left: spec.money ? 0 : -12, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey={spec.x} {...axis} tickFormatter={xTick} minTickGap={12} tickMargin={8} interval={isDate ? "preserveStartEnd" : 0} />
            <YAxis allowDecimals={false} {...axis} width={spec.money ? 52 : 40} tickFormatter={yTick} />
            <RTooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTip isDate={isDate} money={spec.money} />} />
            {legend}
            {spec.series.map(([k, name], i) => (
              <Bar key={k} dataKey={k} name={name} fill={i ? C2 : C1} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/* ── table view of report rows ── */

const humanKey = (k) =>
  k
    .replace(/INR$/, "")
    .replace(/Id$/, " id")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
function cellValue(k, v) {
  if (v === null || v === undefined || v === "") return "—";
  if (/INR$/.test(k) && typeof v === "number") return formatINR(v);
  if (/Rate$|Progress$|Completeness$/.test(k) && typeof v === "number") return `${v}%`;
  if (k === "date" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return formatDate(v, { day: "numeric", month: "short" });
  return typeof v === "number" ? formatNumber(v) : String(v);
}

function RowsTable({ rows }) {
  const columns = useMemo(() => {
    const keys = [];
    for (const r of rows) for (const k of Object.keys(r)) if (!keys.includes(k) && !/Id$/.test(k)) keys.push(k);
    return keys.map((k, i) => ({
      id: k,
      header: humanKey(k),
      cell: (r) => <span className={i ? "tabular-nums" : "text-fg"}>{cellValue(k, r[k])}</span>,
      sortValue: (r) => r[k] ?? -1,
      align: i && typeof rows[0]?.[k] === "number" ? "right" : "left",
      hideOnMobile: i > 3,
    }));
  }, [rows]);
  return <DataTable data={rows} columns={columns} rowKey={(r) => r.offerId || r.courseId || `${r.date || ""}${r.role || ""}${r.name || ""}${r.skill || ""}${r.level || ""}`} pageSize={10} empty={{ title: "No rows in this range" }} />;
}

/* ── funnel + north star (admin) ── */

function Funnel({ range }) {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["admin", "funnel", range], queryFn: () => api.get(`/api/admin/funnel${qs(range)}`), placeholderData: keepPreviousData });
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (isLoading) return <Skeleton className="h-56 rounded-2xl" />;
  const steps = data.steps.filter((s) => s.count !== null);
  const max = Math.max(...steps.map((s) => s.count), 1);
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Panel className="lg:col-span-2" title="Funnel" description="Students who signed up in this range, and the share who reached each step.">
        {!data.steps.find((s) => s.key === "signup")?.count ? (
          <EmptyState icon={BarChart3} title="No sign-ups in this range" description="Pick a wider range to see the funnel." className="border-0 py-8" />
        ) : (
          <ol className="space-y-3.5" aria-label="Funnel steps">
            {steps.map((s, i) => (
              <li key={s.key}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate text-fg">{s.label}</span>
                  <span className="shrink-0 text-muted tabular-nums">
                    <span className="font-medium text-fg">{formatNumber(s.count)}</span>
                    {i > 0 && s.ofSignups !== null ? ` · ${s.ofSignups}%` : ""}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (s.count / max) * 100)}%`, opacity: 1 - i * 0.1 }} />
                </div>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-4 text-xs text-subtle">Visitors come from web analytics and aren't counted here.</p>
      </Panel>
      <Panel title="North star" description={data.northStar.label}>
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-primary">
            <Star className="size-4" strokeWidth={1.75} />
          </span>
          <p className="text-4xl font-medium tracking-tight text-fg tabular-nums">{formatNumber(data.northStar.count)}</p>
        </div>
        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Of sign-ups in range</dt>
            <dd className="text-fg tabular-nums">{show(data.northStar.rate, "pct")}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">All time</dt>
            <dd className="text-fg tabular-nums">{formatNumber(data.northStar.allTime)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-subtle">We track this, not raw sign-ups.</p>
      </Panel>
    </div>
  );
}

/* ── page ── */

export default function AdminReports() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [name, setName] = useState("growth");
  const [preset, setPreset] = useState("30");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [exporting, setExporting] = useState(false);
  const range = rangeFor(preset, custom);
  const spec = REPORTS[name];

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "report", name, range],
    queryFn: () => api.get(`/api/admin/reports/${name}${qs(range)}`),
    placeholderData: keepPreviousData,
  });
  const current = data?.name === name ? data : null;

  async function exportCsv() {
    setExporting(true);
    try {
      await downloadCsv(`/api/admin/reports/${name}.csv${qs(range)}`, `campus-${name}-${range.from || "start"}-to-${range.to || "today"}.csv`);
      toast.success(`${spec.label} report downloaded`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <AdminHeader
        title="Reports"
        description="Built from live records: orders, results, verifications, offers and tickets."
        actions={
          <Button variant="outline" size="sm" leftIcon={Download} loading={exporting} disabled={!current} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <Segmented label="Date range" value={preset} onChange={setPreset} options={PRESETS} />
        {preset === "custom" && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rp-from">From</Label>
              <Input id="rp-from" type="date" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rp-to">To</Label>
              <Input id="rp-to" type="date" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} />
            </div>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="mb-8">
          <Funnel range={range} />
        </div>
      )}

      <Tabs value={name} onValueChange={setName}>
        <div className="scrollbar-none -mx-1 overflow-x-auto px-1">
          <TabsList>
            {NAMES.map((n) => (
              <TabsTrigger key={n} value={n}>
                {REPORTS[n].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div className="mt-5" aria-busy={isFetching}>
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading || !current ? (
          <div className="space-y-5">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-muted">
              {spec.description} {formatDate(current.from)} to {formatDate(current.to)}.
            </p>
            <KpiGrid>
              {spec.tiles.map(([key, label, kind = "num", fallback]) => (
                <Kpi key={key} label={label} value={show(current.metrics[key], kind)} hint={current.metrics[key] === null || current.metrics[key] === undefined ? fallback || "No data yet" : undefined} />
              ))}
            </KpiGrid>
            {spec.chart && (
              <Panel title={spec.chart.series.map((s) => s[1]).join(" and ")} description={spec.chart.x === "date" ? "By day (by month for long ranges)" : "Top rows"}>
                <ReportChart spec={spec.chart} data={current.series} />
              </Panel>
            )}
            <Panel title="Details" description="Same rows as the CSV export." flush bodyClassName="p-0 sm:p-0">
              <div className="p-4 sm:p-5">
                <RowsTable rows={current.rows} />
              </div>
            </Panel>
            {current.notes?.length > 0 && (
              <ul className="space-y-1 text-xs text-subtle">
                {current.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}
