/**
 * B: the student's course payments (spec §5.1 step 6, §14.2): orders and statuses, printable receipts (?receipt=<orderId>),
 * pending offline payments (add the UTR), failed payments (try again) and refunds.
 */
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Receipt, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { formatDate, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Input, Skeleton } from "@/components/ui/primitives";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { usePlatformConfig } from "@/lib/platform";
import { OrderStatusBadge, PROVIDER_LABEL, ReceiptView } from "@/components/payments/shared";
import { useMyOrders } from "@/components/payments/EnrolButton";

function ReceiptPage({ orderId }) {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["receipt", orderId], queryFn: () => api.get(`/api/orders/${orderId}/receipt`) });
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Payments" title="Receipt" actions={<Button variant="ghost" leftIcon={ArrowLeft} to="/app/payments">All payments</Button>} />
      {isLoading ? (
        <Skeleton className="h-[28rem] rounded-2xl" />
      ) : error ? (
        error.status === 404 ? (
          <EmptyState icon={ReceiptText} title="No receipt" description={error.message} action={<Button variant="outline" to="/app/payments">Back to payments</Button>} />
        ) : (
          <ErrorState error={error} onRetry={refetch} />
        )
      ) : (
        <ReceiptView receipt={data} />
      )}
    </div>
  );
}

function OfflineReference({ order }) {
  const qc = useQueryClient();
  const { payments } = usePlatformConfig();
  const [ref, setRef] = useState("");
  const save = useMutation({
    mutationFn: () => api.post(`/api/orders/${order.id}/offline-reference`, { reference: ref.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("Reference sent. We'll confirm within one working day.");
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form
      className="mt-4 space-y-2 border-t border-line pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (ref.trim().length < 4) return toast.error("Enter the UTR or reference number.");
        save.mutate();
      }}
    >
      <p className="text-sm text-muted">{payments?.offlineInstructions || "Pay by UPI or bank transfer, then enter the UTR here."} Add {order.id} in the payment note.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input aria-label="UTR or reference number" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UTR or reference number" maxLength={80} />
        <Button type="submit" loading={save.isPending}>
          Submit
        </Button>
      </div>
    </form>
  );
}

function OrderCard({ order }) {
  const pendingOffline = order.status === "PENDING" && order.provider === "OFFLINE";
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/app/courses/${order.courseId}`} className="font-medium hover:text-primary">
              {order.course?.title || "Course"}
            </Link>
            <p className="mt-0.5 text-xs text-muted">
              {formatDate(order.createdAt)} · {PROVIDER_LABEL[order.provider] || order.provider}
              {order.receiptNo ? ` · ${order.receiptNo}` : ""}
            </p>
          </div>
          <OrderStatusBadge order={order} />
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xl font-medium tracking-tight tabular-nums">{formatINR(order.totalINR)}</p>
            <p className="text-xs text-muted">
              {formatINR(order.amountINR)} + {formatINR(order.gstINR)} GST
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {order.receiptNo && (
              <Button size="sm" variant="outline" leftIcon={Receipt} to={`/app/payments?receipt=${order.id}`}>
                View receipt
              </Button>
            )}
            {order.status === "FAILED" && (
              <Button size="sm" rightIcon={ArrowRight} to={`/app/courses/${order.courseId}`}>
                Try again
              </Button>
            )}
          </div>
        </div>

        {order.status === "FAILED" && <p className="mt-3 text-xs text-muted">{order.failureReason || "The payment didn't go through."} No money was taken for this attempt.</p>}
        {order.refundINR > 0 && (
          <p className="mt-3 text-xs text-muted">
            {formatINR(order.refundINR)} refunded{order.refundedAt ? ` on ${formatDate(order.refundedAt)}` : ""}. Refunds take 5–7 working days to reach your account.
          </p>
        )}
        {pendingOffline && order.offlineReference && (
          <p className="mt-3 text-xs text-muted">We're checking your payment (ref {order.offlineReference}). This takes up to one working day.</p>
        )}
        {pendingOffline && !order.offlineReference && <OfflineReference order={order} />}
      </CardContent>
    </Card>
  );
}

export default function Payments() {
  const [params] = useSearchParams();
  const receiptId = params.get("receipt");
  const { data, isLoading, error, refetch } = useMyOrders(!receiptId);

  if (receiptId) return <ReceiptPage orderId={receiptId} />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Account" title="Payments" description="Your course payments and receipts. Fees are paid in full before a course starts." />
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState icon={ReceiptText} title="No payments yet" description="When you enrol in a paid course, your receipt shows up here." action={<Button to="/app/catalog">Explore courses</Button>} />
      ) : (
        <div className="space-y-3">
          {data.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}
