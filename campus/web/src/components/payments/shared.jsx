/**
 * B (payments): shared pieces for checkout, the student Payments page and the finance console.
 * Prices: fees exclude GST (spec §6.2). The server computes the real order amounts; `priceBreakdown` is for display before checkout.
 */
import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { cn, formatDate, formatINR } from "@/lib/utils";

export const ORDER_STATUS = {
  PENDING: { label: "Pending", tone: "warning" },
  PAID: { label: "Paid", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "outline" },
};

export const PROVIDER_LABEL = { RAZORPAY: "Online", OFFLINE: "Bank / UPI", DEMO: "Demo", FREE: "Free" };

export function OrderStatusBadge({ order, className }) {
  const s = ORDER_STATUS[order.status] || { label: order.status, tone: "neutral" };
  const label = order.status === "PENDING" && order.provider === "OFFLINE" ? (order.offlineReference ? "Being checked" : "Awaiting payment") : s.label;
  return (
    <Badge tone={s.tone} dot className={className}>
      {label}
    </Badge>
  );
}

/** { amountINR, gstPercent, gstINR, totalINR } for a course fee (ex GST), with the advance share applied. */
export function priceBreakdown(priceINR, gstPercent = 18, advancePercent = 100) {
  const advance = Math.min(100, Math.max(1, Number(advancePercent) || 100));
  const amountINR = Math.round(((priceINR || 0) * advance) / 100);
  const gstINR = Math.round((amountINR * (Number(gstPercent) || 0)) / 100);
  return { amountINR, gstPercent: Number(gstPercent) || 0, gstINR, totalINR: amountINR + gstINR, advancePercent: advance };
}

/** Fee + GST = total rows. `price` is an order or a priceBreakdown() result. */
export function PriceRows({ price, className, totalLabel = "Total" }) {
  return (
    <dl className={cn("space-y-2 text-sm", className)}>
      <div className="flex justify-between gap-4">
        <dt className="text-muted">Course fee</dt>
        <dd className="tabular-nums">{formatINR(price.amountINR)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted">GST ({price.gstPercent}%)</dt>
        <dd className="tabular-nums">{formatINR(price.gstINR)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-line pt-2 text-base font-medium">
        <dt>{totalLabel}</dt>
        <dd className="tabular-nums">{formatINR(price.totalINR)}</dd>
      </div>
    </dl>
  );
}

/** Printable receipt (GET /api/orders/:id/receipt). Print hides everything else on the page. */
export function ReceiptView({ receipt, className }) {
  const { order } = receipt;
  const refunded = order.status === "REFUNDED";
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-6 sm:p-8", className)} id="campus-receipt">
      <style>{`@media print { body * { visibility: hidden !important; } #campus-receipt, #campus-receipt * { visibility: visible !important; } #campus-receipt { position: absolute; inset: 0 auto auto 0; width: 100%; border: 0; } .receipt-noprint { display: none !important; } }`}</style>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Logo />
          <p className="mt-3 text-xs text-muted">{receipt.issuer?.name}</p>
          {receipt.issuer?.email && <p className="text-xs text-muted">{receipt.issuer.email}</p>}
        </div>
        <div className="text-right">
          <p className="eyebrow">Receipt</p>
          <p className="mt-1 font-medium tabular-nums">{receipt.receiptNo}</p>
          <p className="text-xs text-muted">{formatDate(receipt.issuedAt)}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted">Billed to</p>
          <p className="mt-1 font-medium">{receipt.user?.name}</p>
          <p className="text-sm text-muted">{receipt.user?.email}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-muted">Payment</p>
          <p className="mt-1 text-sm">{receipt.paymentMethod}</p>
          {receipt.paymentRef && <p className="text-xs break-all text-muted">Ref {receipt.paymentRef}</p>}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-line p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium">{receipt.course?.title}</p>
            <p className="text-xs text-muted">Course fee, paid 100% in advance</p>
          </div>
          <OrderStatusBadge order={order} />
        </div>
        <PriceRows price={order} totalLabel="Total paid" />
        {refunded && (
          <div className="mt-3 flex justify-between gap-4 border-t border-line pt-2 text-sm">
            <span className="text-muted">Refunded {order.refundedAt ? `on ${formatDate(order.refundedAt)}` : ""}</span>
            <span className="tabular-nums">− {formatINR(order.refundINR)}</span>
          </div>
        )}
      </div>
      <p className="mt-6 text-xs text-muted">Fees exclude GST; GST is shown separately. This receipt confirms payment for course access. It is not a tax invoice.</p>
      <div className="receipt-noprint mt-6 flex justify-end">
        <Button variant="outline" leftIcon={Printer} onClick={() => window.print()}>
          Print
        </Button>
      </div>
    </div>
  );
}
