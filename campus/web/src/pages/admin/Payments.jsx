/**
 * B: finance console for course payments (ADMIN | FINANCE). Orders with filters; verify an offline payment,
 * mark a payment failed, refund (amount + reason). Every action is audited by the API.
 */
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, CircleSlash, Clock, IndianRupee, ReceiptText, RotateCcw, Undo2 } from "lucide-react";
import { api, qs } from "@/lib/api/client";
import { formatDate, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Skeleton, Textarea } from "@/components/ui/primitives";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { ErrorState } from "@/components/ui/campus";
import { DataTable, Segmented } from "@/components/admin/DataTable";
import { AdminHeader, Drawer, KV, Kpi, KpiGrid, SectionLabel } from "@/components/admin/kit";
import { OrderStatusBadge, PROVIDER_LABEL, PriceRows, ReceiptView } from "@/components/payments/shared";

const STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"];

function ReceiptPanel({ orderId }) {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["receipt", orderId], queryFn: () => api.get(`/api/orders/${orderId}/receipt`) });
  if (isLoading) return <Skeleton className="h-80 rounded-2xl" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  return <ReceiptView receipt={data} className="p-5 sm:p-6" />;
}

/** One dialog for the three finance actions. kind: verify | fail | refund */
function ActionDialog({ action, onClose }) {
  const qc = useQueryClient();
  const order = action?.order;
  const refundable = order ? order.totalINR - (order.refundINR || 0) : 0;
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const kind = action?.kind;

  const run = useMutation({
    mutationFn: () => {
      if (kind === "verify") return api.post(`/api/admin/orders/${order.id}/verify-offline`, { note: note.trim() || undefined });
      if (kind === "fail") return api.post(`/api/admin/orders/${order.id}/fail`, { reason: note.trim() });
      return api.post(`/api/admin/orders/${order.id}/refund`, { amountINR: Number(amount || refundable), reason: note.trim() });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["receipt", order.id] });
      toast.success({ verify: "Payment verified. The student is enrolled.", fail: "Marked as failed. The student was told how to retry.", refund: "Refund recorded." }[kind]);
      setNote("");
      setAmount("");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!order) return null;
  const amountNum = Number(amount || order.totalINR);
  const invalidAmount = kind === "refund" && (!Number.isInteger(amountNum) || amountNum < 1 || amountNum > refundable);
  const needsReason = kind !== "verify" && note.trim().length < 3;
  const copy = {
    verify: { t: "Verify offline payment", d: "Only verify after you see the money in the bank account. The student is enrolled at once.", cta: "Verify payment" },
    fail: { t: "Mark payment failed", d: "Use when no money arrived. The student gets retry and help steps.", cta: "Mark failed" },
    refund: {
      t: "Refund payment",
      d: order.provider === "RAZORPAY" ? "The refund is sent through Razorpay. A full refund ends course access." : "Send the money back yourself, then record it here. A full refund ends course access.",
      cta: "Refund",
    },
  }[kind];

  return (
    <Dialog open={Boolean(action)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={copy.t} description={copy.d} size="sm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!invalidAmount && !needsReason) run.mutate();
          }}
        >
          <div className="rounded-xl border border-line p-3.5 text-sm">
            <p className="font-medium">{order.user?.name}</p>
            <p className="text-xs text-muted">
              {order.course?.title} · {formatINR(order.totalINR)}
              {order.offlineReference ? ` · ref ${order.offlineReference}` : ""}
            </p>
          </div>
          {kind === "refund" && (
            <Field label="Amount (₹)" htmlFor="refund-amount" hint={order.refundINR ? `Up to ${formatINR(refundable)} left (${formatINR(order.refundINR)} already refunded).` : `Up to ${formatINR(order.totalINR)} (fee + GST).`} error={amount && invalidAmount ? "Enter a whole amount within the total." : null}>
              <Input id="refund-amount" inputMode="numeric" value={amount} placeholder={String(refundable)} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} />
            </Field>
          )}
          <Field label={kind === "verify" ? "Note (optional)" : "Reason"} htmlFor="order-note">
            <Textarea id="order-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={kind === "verify" ? "e.g. Seen in HDFC statement" : kind === "fail" ? "e.g. No transfer received after 3 days" : "e.g. Requested within 7 days"} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant={kind === "verify" ? "primary" : "danger"} loading={run.isPending} disabled={invalidAmount || needsReason}>
              {copy.cta}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OrderActions({ order, onAction, size = "sm" }) {
  const pending = order.status === "PENDING";
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      {pending && order.provider === "OFFLINE" && (
        <Button size={size} leftIcon={BadgeCheck} onClick={() => onAction({ kind: "verify", order })}>
          Verify
        </Button>
      )}
      {pending && (
        <Button size={size} variant="ghost" leftIcon={CircleSlash} onClick={() => onAction({ kind: "fail", order })}>
          Mark failed
        </Button>
      )}
      {order.status === "PAID" && (
        <Button size={size} variant="outline" leftIcon={Undo2} onClick={() => onAction({ kind: "refund", order })}>
          Refund
        </Button>
      )}
    </div>
  );
}

export default function AdminPayments() {
  const [params, setParams] = useSearchParams();
  const status = STATUSES.includes(params.get("status")) ? params.get("status") : "";
  const setStatus = (v) => setParams((p) => {
    const next = new URLSearchParams(p);
    if (v) next.set("status", v);
    else next.delete("status");
    return next;
  });
  const [provider, setProvider] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);

  const list = useQuery({ queryKey: ["admin", "orders", status, provider, q], queryFn: () => api.get(`/api/admin/orders${qs({ status, provider, q: q.trim() })}`) });
  const all = useQuery({ queryKey: ["admin", "orders", "all"], queryFn: () => api.get("/api/admin/orders") });

  const stats = useMemo(() => {
    const rows = all.data || [];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const paidMonth = rows.filter((o) => o.status === "PAID" && o.paidAt && new Date(o.paidAt) >= monthStart);
    return {
      toVerify: rows.filter((o) => o.status === "PENDING" && o.provider === "OFFLINE" && o.offlineReference).length,
      collected: paidMonth.reduce((s, o) => s + o.totalINR, 0),
      paidCount: paidMonth.length,
      refunded: rows.reduce((s, o) => s + (o.refundINR || 0), 0),
      failed: rows.filter((o) => o.status === "FAILED").length,
    };
  }, [all.data]);
  const count = (s) => (all.data ? all.data.filter((o) => o.status === s).length : undefined);
  const current = selected && (list.data || []).find((o) => o.id === selected.id) ? (list.data || []).find((o) => o.id === selected.id) : selected;

  const columns = [
    {
      id: "student",
      header: "Student",
      sortValue: (o) => o.user?.name || "",
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{o.user?.name || "Unknown"}</p>
          <p className="truncate text-xs text-muted">{o.user?.email}</p>
        </div>
      ),
    },
    { id: "course", header: "Course", sortValue: (o) => o.course?.title || "", cell: (o) => <span className="line-clamp-2 md:max-w-56">{o.course?.title}</span> },
    { id: "total", header: "Total", align: "right", sortValue: (o) => o.totalINR, cell: (o) => <span className="tabular-nums">{formatINR(o.totalINR)}</span> },
    { id: "method", header: "Method", hideOnMobile: true, sortValue: (o) => o.provider, cell: (o) => <span className="text-muted">{PROVIDER_LABEL[o.provider] || o.provider}</span> },
    { id: "status", header: "Status", sortValue: (o) => o.status, cell: (o) => <OrderStatusBadge order={o} /> },
    {
      id: "ref",
      header: "Receipt / ref",
      hideOnMobile: true,
      sortValue: (o) => o.receiptNo || o.offlineReference || "",
      cell: (o) => <span className="text-xs break-all text-muted tabular-nums">{o.receiptNo || o.offlineReference || "—"}</span>,
    },
    { id: "date", header: "Date", align: "right", sortValue: (o) => new Date(o.createdAt).getTime(), cell: (o) => <span className="text-muted tabular-nums">{formatDate(o.createdAt, { day: "numeric", month: "short" })}</span> },
    { id: "actions", header: <span className="sr-only">Actions</span>, align: "right", mobileLabel: "Actions", cell: (o) => <OrderActions order={o} onAction={setAction} /> },
  ];

  return (
    <>
      <AdminHeader title="Course payments" description="Verify offline payments, follow up failures and record refunds. Every change is logged." />

      <KpiGrid className="mb-6">
        <Kpi icon={Clock} label="To verify" value={all.isLoading ? "…" : stats.toVerify} hint="Offline, reference added" />
        <Kpi icon={IndianRupee} label="Collected this month" value={all.isLoading ? "…" : formatINR(stats.collected)} hint={`${stats.paidCount} paid orders, incl. GST`} />
        <Kpi icon={RotateCcw} label="Refunded" value={all.isLoading ? "…" : formatINR(stats.refunded)} hint="All time" />
        <Kpi icon={CircleSlash} label="Failed" value={all.isLoading ? "…" : stats.failed} hint="Students were told how to retry" />
      </KpiGrid>

      <DataTable
        data={list.data}
        loading={list.isLoading}
        error={list.error}
        onRetry={list.refetch}
        columns={columns}
        initialSort={{ id: "date", desc: true }}
        pageSize={15}
        onRowClick={(o) => setSelected(o)}
        search={{ placeholder: "Search name, email, course, receipt or UTR…", value: q, onChange: setQ }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              value={status}
              onChange={setStatus}
              label="Status"
              options={[
                { value: "", label: "All", count: all.data?.length },
                { value: "PENDING", label: "Pending", count: count("PENDING") },
                { value: "PAID", label: "Paid", count: count("PAID") },
                { value: "FAILED", label: "Failed", count: count("FAILED") },
                { value: "REFUNDED", label: "Refunded", count: count("REFUNDED") },
              ]}
            />
            <Select aria-label="Payment method" value={provider} onChange={(e) => setProvider(e.target.value)} className="h-9 w-auto">
              <option value="">All methods</option>
              <option value="RAZORPAY">Online (Razorpay)</option>
              <option value="OFFLINE">Bank / UPI</option>
              <option value="DEMO">Demo</option>
            </Select>
          </div>
        }
        empty={{
          icon: ReceiptText,
          title: status === "PENDING" ? "Nothing to verify" : "No orders",
          description: status === "PENDING" ? "Offline payments appear here once a student enrols." : "Course orders appear here when students check out.",
        }}
      />

      <Drawer
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
        title={current?.course?.title || "Order"}
        description={current ? `${current.user?.name} · ${current.id}` : undefined}
        size="lg"
        footer={current ? <OrderActions order={current} onAction={setAction} size="md" /> : null}
      >
        {current && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <OrderStatusBadge order={current} />
              <span className="text-xs text-muted">{formatDate(current.createdAt)}</span>
            </div>
            <div className="rounded-xl border border-line p-4">
              <PriceRows price={current} />
            </div>
            <div>
              <SectionLabel>Details</SectionLabel>
              <div className="divide-y divide-line rounded-xl border border-line px-4">
                <KV label="Student">{current.user?.email}</KV>
                <KV label="Method">{PROVIDER_LABEL[current.provider] || current.provider}</KV>
                {current.offlineReference && <KV label="Reference">{current.offlineReference}</KV>}
                {current.paidAt && <KV label="Paid">{formatDate(current.paidAt)}</KV>}
                {current.failureReason && <KV label="Failure">{current.failureReason}</KV>}
                {current.refundINR > 0 && (
                  <KV label={current.status === "REFUNDED" ? "Refunded" : "Partly refunded"}>
                    {(current.refunds?.length ? current.refunds : [{ amountINR: current.refundINR, reason: current.refundReason }]).map((r, i) => (
                      <span key={i} className="block">{`${formatINR(r.amountINR)} · ${r.reason || ""}`}</span>
                    ))}
                  </KV>
                )}
              </div>
            </div>
            {current.receiptNo && (
              <div>
                <SectionLabel>Receipt</SectionLabel>
                <ReceiptPanel orderId={current.id} />
              </div>
            )}
          </div>
        )}
      </Drawer>

      <ActionDialog key={action ? `${action.kind}-${action.order.id}` : "none"} action={action} onClose={() => setAction(null)} />
    </>
  );
}
