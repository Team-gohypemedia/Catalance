import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, IndianRupee, Plus, Wallet, XCircle } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import { cn, formatDate, formatINR, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { usePlatformConfig } from "@/lib/platform";
import { DataTable, Segmented } from "@/components/admin/DataTable";
import { AdminHeader, Drawer, KV, Kpi, KpiGrid, SectionLabel, Status } from "@/components/admin/kit";
import { PAYOUT_STATUS, SPLIT_BASIS_LABEL, offerChip } from "@/components/projects/meta";

const STATUS_TABS = ["all", "PENDING", "ELIGIBLE", "PAID", "FAILED", "NOT_DUE"];

/** Client price + taxes + split rule → platform share preview (mirrors computeSplit in api/src/services/projects.js). */
function previewSplit({ clientPriceINR, taxesINR, splitBasis, freelancerSharePercent, payoutINR }) {
  if (clientPriceINR === "" || clientPriceINR == null || Number.isNaN(Number(clientPriceINR))) return null;
  const base = splitBasis === "CLIENT_PRICE_INC_TAX" ? Number(clientPriceINR) + (Number(taxesINR) || 0) : Number(clientPriceINR);
  const rule = Math.round((base * (Number(freelancerSharePercent) || 0)) / 100);
  return { base, rule, platform: base - rule, variance: payoutINR - rule };
}

/** Project finance (spec §9.2): client price, split, platform share snapshot, adjustments, payout status and references. ADMIN | FINANCE. */
export default function AdminPayouts() {
  const [status, setStatus] = useState("ELIGIBLE");
  const [filters, setFilters] = useState({ reconciled: "", from: "", to: "" });
  const [openId, setOpenId] = useState(null);
  const query = { reconciled: filters.reconciled || undefined, from: filters.from || undefined, to: filters.to || undefined };
  const list = useQuery({ queryKey: ["finance-offers", query], queryFn: () => api.get(`/api/finance/offers${qs(query)}`) });
  const rows = list.data || [];
  const data = useMemo(() => (status === "all" ? rows : rows.filter((r) => r.payoutStatus === status)), [rows, status]);
  const counts = Object.fromEntries(STATUS_TABS.map((s) => [s, s === "all" ? rows.length : rows.filter((r) => r.payoutStatus === s).length]));
  const sum = (fn, test) => rows.filter(test).reduce((s, r) => s + (fn(r) || 0), 0);
  const selected = rows.find((r) => r.id === openId);

  const columns = [
    {
      id: "title",
      header: "Project",
      sortValue: (r) => r.title,
      cell: (r) => (
        <div className="min-w-0">
          <p className="max-w-[280px] truncate font-medium">{r.title}</p>
          <p className="truncate text-xs text-muted">
            {r.student?.name}
            {r.catalanceProjectId ? ` · ${r.catalanceProjectId}` : ""}
          </p>
        </div>
      ),
    },
    { id: "client", header: "Client price", align: "right", sortValue: (r) => r.clientPriceINR ?? -1, cell: (r) => (r.clientPriceINR == null ? <span className="text-subtle">Not set</span> : <span className="tabular-nums">{formatINR(r.clientPriceINR)}</span>) },
    {
      id: "net",
      header: "Payout",
      align: "right",
      sortValue: (r) => r.netPayoutINR,
      cell: (r) => (
        <span className="tabular-nums">
          {formatINR(r.netPayoutINR)}
          {r.adjustmentsTotalINR ? <span className="block text-[11px] text-subtle">incl. {r.adjustmentsTotalINR > 0 ? "+" : ""}{formatINR(r.adjustmentsTotalINR)}</span> : null}
        </span>
      ),
    },
    { id: "platform", header: "Platform share", align: "right", hideOnMobile: true, sortValue: (r) => r.platformShareINR ?? -1, cell: (r) => (r.platformShareINR == null ? <span className="text-subtle">—</span> : <span className="tabular-nums">{formatINR(r.platformShareINR)}</span>) },
    {
      id: "status",
      header: "Payout status",
      sortValue: (r) => r.payoutStatus,
      cell: (r) => (
        <div>
          <Status tone={PAYOUT_STATUS[r.payoutStatus]?.tone}>{PAYOUT_STATUS[r.payoutStatus]?.label}</Status>
          <p className="mt-1 text-[11px] text-subtle">{offerChip(r).label}</p>
        </div>
      ),
    },
    { id: "ref", header: "Reference", hideOnMobile: true, sortValue: (r) => r.payoutRef || "", cell: (r) => <span className="text-xs text-muted">{r.payoutRef || "—"}</span> },
    { id: "updated", header: "Updated", hideOnMobile: true, sortValue: (r) => r.updatedAt, cell: (r) => <span className="text-muted">{timeAgo(r.updatedAt)}</span> },
  ];

  return (
    <div>
      <AdminHeader title="Project finance" description="Client price, split, adjustments and payouts. Internal only." />

      <KpiGrid className="mb-6">
        <Kpi icon={Wallet} label="Eligible to pay" value={formatINR(sum((r) => r.netPayoutINR, (r) => r.payoutStatus === "ELIGIBLE"))} hint={`${counts.ELIGIBLE} payout${counts.ELIGIBLE === 1 ? "" : "s"}`} />
        <Kpi icon={CheckCircle2} label="Paid" value={formatINR(sum((r) => r.netPayoutINR, (r) => r.payoutStatus === "PAID"))} hint={`${counts.PAID} payout${counts.PAID === 1 ? "" : "s"}`} />
        <Kpi icon={XCircle} label="Failed" value={counts.FAILED} hint="Retry with a new reference" />
        <Kpi icon={IndianRupee} label="Platform share (snapshots)" value={formatINR(sum((r) => r.platformShareINR, () => true))} />
      </KpiGrid>

      <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:max-w-2xl">
        <Field label="Reconciled" htmlFor="pf-rec">
          <Select id="pf-rec" value={filters.reconciled} onChange={(e) => setFilters((f) => ({ ...f, reconciled: e.target.value }))}>
            <option value="">All</option>
            <option value="yes">Paid with reference</option>
            <option value="no">Not reconciled</option>
          </Select>
        </Field>
        <Field label="Updated from" htmlFor="pf-from">
          <Input id="pf-from" type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
        </Field>
        <Field label="Updated to" htmlFor="pf-to">
          <Input id="pf-to" type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
        </Field>
      </div>

      <DataTable
        data={data}
        loading={list.isLoading}
        error={list.error}
        onRetry={list.refetch}
        columns={columns}
        initialSort={{ id: "updated", desc: true }}
        onRowClick={(r) => setOpenId(r.id)}
        search={{ placeholder: "Search project, student, reference…", text: (r) => [r.title, r.student?.name, r.payoutRef, r.catalanceProjectId].join(" ") }}
        toolbar={
          <Segmented
            value={status}
            onChange={setStatus}
            label="Payout status"
            options={STATUS_TABS.map((s) => ({ value: s, label: s === "all" ? "All" : PAYOUT_STATUS[s].label, count: list.data ? counts[s] : undefined }))}
          />
        }
        empty={{ icon: Wallet, title: "No payouts here", description: "Payouts appear once a student accepts an offer." }}
      />

      {selected && <FinanceDrawer key={selected.id} row={selected} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function FinanceDrawer({ row, onClose }) {
  const qc = useQueryClient();
  const config = usePlatformConfig();
  const settings = useQuery({ queryKey: ["finance-rules"], queryFn: () => api.get("/api/finance/rules"), retry: false, staleTime: 60_000 });
  const defaults = settings.data || {};
  const paid = row.payoutStatus === "PAID";

  const [form, setForm] = useState(() => ({
    clientPriceINR: row.clientPriceINR ?? "",
    taxesINR: row.taxesINR ?? "",
    splitBasis: row.splitBasis || "",
    freelancerSharePercent: row.freelancerSharePercent ?? "",
    reason: "",
  }));
  // fill rule defaults once settings arrive (finance.splitBasis, finance.freelancerSharePercent)
  useEffect(() => {
    if (!settings.data) return;
    setForm((f) => ({
      ...f,
      splitBasis: f.splitBasis || defaults.splitBasis || "CLIENT_PRICE_EX_TAX",
      freelancerSharePercent: f.freelancerSharePercent === "" ? (defaults.freelancerSharePercent ?? 50) : f.freelancerSharePercent,
    }));
  }, [settings.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const split = previewSplit({ ...form, splitBasis: form.splitBasis || "CLIENT_PRICE_EX_TAX", freelancerSharePercent: form.freelancerSharePercent === "" ? 50 : form.freelancerSharePercent, payoutINR: row.payoutINR });
  const gst = config.pricing?.gstPercent ?? 18;

  const [adj, setAdj] = useState({ amountINR: "", reason: "" });
  const [ref, setRef] = useState(row.payoutRef || "");
  const [failNote, setFailNote] = useState("");

  const done = (msg) => () => {
    qc.invalidateQueries({ queryKey: ["finance-offers"] });
    qc.invalidateQueries({ queryKey: ["pm-offer", row.id] });
    toast.success(msg);
  };
  const onError = (e) => toast.error(e.message);

  const saveSplit = useMutation({
    mutationFn: () =>
      api.put(`/api/finance/offers/${row.id}`, {
        clientPriceINR: Number(form.clientPriceINR),
        taxesINR: Number(form.taxesINR) || 0,
        splitBasis: form.splitBasis || undefined,
        freelancerSharePercent: form.freelancerSharePercent === "" ? undefined : Number(form.freelancerSharePercent),
        reason: form.reason.trim() || undefined,
      }),
    onSuccess: done("Split saved and snapshotted"),
    onError,
  });
  const addAdj = useMutation({
    mutationFn: () => api.post(`/api/finance/offers/${row.id}/adjustments`, { amountINR: Number(adj.amountINR), reason: adj.reason.trim() }),
    onSuccess: () => {
      setAdj({ amountINR: "", reason: "" });
      done("Adjustment added")();
    },
    onError,
  });
  const payout = useMutation({
    mutationFn: (status) => api.post(`/api/finance/offers/${row.id}/payout`, { status, payoutRef: ref.trim(), note: status === "FAILED" ? failNote.trim() || undefined : undefined }),
    onSuccess: (_u, status) => done(status === "PAID" ? "Marked paid. The student was notified." : "Marked failed. The student was notified.")(),
    onError,
  });

  const priceInvalid = form.clientPriceINR === "" || !Number.isInteger(Number(form.clientPriceINR)) || Number(form.clientPriceINR) < 0;
  const adjInvalid = !Number.isInteger(Number(adj.amountINR)) || Number(adj.amountINR) === 0 || adj.reason.trim().length < 5;
  const canPay = ["ELIGIBLE", "FAILED"].includes(row.payoutStatus);

  return (
    <Drawer open onOpenChange={(v) => !v && onClose()} title={row.title} description={`${row.student?.name} · ${offerChip(row).label}`} size="lg">
      <div className="space-y-8">
        <section>
          <SectionLabel>Summary</SectionLabel>
          <KV label="Agreed payout">{formatINR(row.payoutINR)}</KV>
          <KV label="Adjustments">{row.adjustmentsTotalINR ? `${row.adjustmentsTotalINR > 0 ? "+" : ""}${formatINR(row.adjustmentsTotalINR)}` : "None"}</KV>
          <KV label="Net payout">
            <span className="font-medium">{formatINR(row.netPayoutINR)}</span>
          </KV>
          <KV label="Payout status">
            <Status tone={PAYOUT_STATUS[row.payoutStatus]?.tone}>{PAYOUT_STATUS[row.payoutStatus]?.label}</Status>
          </KV>
          <KV label="Client accepted">{row.clientAcceptedAt ? formatDate(row.clientAcceptedAt) : "Not yet"}</KV>
          {row.paidAt && <KV label="Paid on">{formatDate(row.paidAt)}</KV>}
          {row.catalanceProjectId && <KV label="Catalance project">{row.catalanceProjectId}</KV>}
        </section>

        <section>
          <SectionLabel>Split (snapshotted on save and at client acceptance)</SectionLabel>
          <fieldset disabled={paid} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Client price, ex tax (₹)" htmlFor="fd-price">
                <Input id="fd-price" type="number" inputMode="numeric" min={0} value={form.clientPriceINR} onChange={(e) => setForm({ ...form, clientPriceINR: e.target.value })} />
              </Field>
              <Field label={`Taxes (₹)`} htmlFor="fd-tax" hint={form.clientPriceINR ? `GST at ${gst}% would be ${formatINR(Math.round((Number(form.clientPriceINR) * gst) / 100))}` : null}>
                <Input id="fd-tax" type="number" inputMode="numeric" min={0} value={form.taxesINR} onChange={(e) => setForm({ ...form, taxesINR: e.target.value })} />
              </Field>
              <Field label="Split basis" htmlFor="fd-basis">
                <Select id="fd-basis" value={form.splitBasis || "CLIENT_PRICE_EX_TAX"} onChange={(e) => setForm({ ...form, splitBasis: e.target.value })}>
                  {Object.entries(SPLIT_BASIS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Freelancer share (%)" htmlFor="fd-pct">
                <Input id="fd-pct" type="number" inputMode="numeric" min={0} max={100} value={form.freelancerSharePercent} onChange={(e) => setForm({ ...form, freelancerSharePercent: e.target.value })} />
              </Field>
            </div>
            {split && (
              <div className="rounded-xl bg-surface-2/60 p-3 text-sm">
                <KV label="Split base">{formatINR(split.base)}</KV>
                <KV label="Freelancer share by rule">{formatINR(split.rule)}</KV>
                <KV label="Platform share">
                  <span className="font-medium">{formatINR(split.platform)}</span>
                </KV>
                {split.variance !== 0 && (
                  <p className={cn("mt-2 flex items-start gap-1.5 text-xs", "text-warning")}>
                    <AlertTriangle className="mt-px size-3.5 shrink-0" /> Agreed payout is {formatINR(Math.abs(split.variance))} {split.variance > 0 ? "above" : "below"} the rule.
                  </p>
                )}
              </div>
            )}
            {row.platformShareINR != null && <p className="text-xs text-muted">Current snapshot: platform share {formatINR(row.platformShareINR)}.</p>}
            <Field label="Reason for change (optional)" htmlFor="fd-reason">
              <Input id="fd-reason" maxLength={500} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </Field>
            <div className="flex justify-end">
              <Button loading={saveSplit.isPending} disabled={priceInvalid || paid} onClick={() => saveSplit.mutate()}>
                Save split
              </Button>
            </div>
          </fieldset>
          {paid && <p className="mt-2 text-xs text-muted">Paid payouts are locked. Contact an admin for corrections.</p>}
        </section>

        <section>
          <SectionLabel>Adjustments</SectionLabel>
          {row.adjustments?.length ? (
            <ul className="mb-3 divide-y divide-line rounded-xl border border-line">
              {row.adjustments.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="text-fg">{a.reason}</p>
                    <p className="text-xs text-subtle">
                      {a.approvedBy?.name} · {formatDate(a.at)}
                    </p>
                  </div>
                  <span className={cn("shrink-0 tabular-nums", a.amountINR < 0 ? "text-danger" : "text-success")}>
                    {a.amountINR > 0 ? "+" : ""}
                    {formatINR(a.amountINR)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-subtle">No adjustments.</p>
          )}
          {!paid && (
            <div className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-end">
              <Field label="Amount (₹, − to deduct)" htmlFor="fd-adj-amt">
                <Input id="fd-adj-amt" type="number" inputMode="numeric" value={adj.amountINR} onChange={(e) => setAdj({ ...adj, amountINR: e.target.value })} />
              </Field>
              <Field label="Reason" htmlFor="fd-adj-reason">
                <Input id="fd-adj-reason" maxLength={500} value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} placeholder="e.g. Extra screen agreed with client" />
              </Field>
              <Button variant="outline" leftIcon={Plus} loading={addAdj.isPending} disabled={adjInvalid} onClick={() => addAdj.mutate()}>
                Add
              </Button>
            </div>
          )}
        </section>

        <section>
          <SectionLabel>Payout</SectionLabel>
          {canPay ? (
            <div className="space-y-3">
              <Field label="Payout reference (UTR / transfer id)" htmlFor="fd-ref">
                <Input id="fd-ref" maxLength={120} value={ref} onChange={(e) => setRef(e.target.value)} />
              </Field>
              {row.payoutStatus === "ELIGIBLE" && (
                <Field label="Failure note (only if it failed)" htmlFor="fd-fail">
                  <Textarea id="fd-fail" rows={2} maxLength={500} value={failNote} onChange={(e) => setFailNote(e.target.value)} />
                </Field>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                {row.payoutStatus === "ELIGIBLE" && (
                  <Button variant="outline" leftIcon={XCircle} loading={payout.isPending && payout.variables === "FAILED"} onClick={() => payout.mutate("FAILED")}>
                    Mark failed
                  </Button>
                )}
                <Button leftIcon={CheckCircle2} loading={payout.isPending && payout.variables === "PAID"} disabled={!ref.trim()} onClick={() => payout.mutate("PAID")}>
                  Mark paid {formatINR(row.netPayoutINR)}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              {paid ? `Paid ${formatDate(row.paidAt)} · ${row.payoutRef}` : "Payouts become eligible when the client accepts the work."}
            </p>
          )}
        </section>
      </div>
    </Drawer>
  );
}
