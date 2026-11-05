/**
 * B (payments): the checkout dialog (spec §5.1 steps 3–6). Order summary → fee + GST = total → payment terms
 * (100% advance, refund policy) → required consents → pay (Razorpay hosted checkout, offline transfer, or DEMO in the
 * demo engine). Handles processing, failure/retry, offline pending and success states.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, Clock, CreditCard, Receipt, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, IS_DEMO } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { usePlatformConfig } from "@/lib/platform";
import { cn, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Spinner } from "@/components/ui/primitives";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { ConsentCheckboxes, allAccepted } from "@/components/legal/ConsentCheckboxes";
import { NoGuarantee } from "@/components/marketing/NoGuarantee";
import { PriceRows, priceBreakdown } from "./shared";

const REQUIRED = ["TERMS", "PRIVACY", "REFUND"];
const DEFAULT_PAYMENTS = {
  advancePercent: 100,
  offlineEnabled: true,
  offlineInstructions: "Pay by UPI or bank transfer, then enter the UTR / reference number here. We confirm within one working day.",
  razorpayKeyId: null,
};

let razorpayScript = null;
/** Load Razorpay's hosted checkout on demand (card details never touch Campus). */
function loadRazorpay() {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(window.Razorpay);
  razorpayScript ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Payment window failed to load.")));
    s.onerror = () => {
      razorpayScript = null;
      reject(new Error("Couldn't load the payment window. Check your connection and try again."));
    };
    document.body.appendChild(s);
  });
  return razorpayScript;
}

export function usePaymentMethods() {
  const config = usePlatformConfig();
  const payments = { ...DEFAULT_PAYMENTS, ...config.payments };
  const methods = [];
  if (IS_DEMO) methods.push({ id: "DEMO", icon: Sparkles, title: "Pay now (demo)", desc: "Demo mode: the payment succeeds at once. No money is taken." });
  if (payments.razorpayKeyId) methods.push({ id: "RAZORPAY", icon: CreditCard, title: "Pay online", desc: "UPI, card or net banking through Razorpay. We never see your card details." });
  if (payments.offlineEnabled) methods.push({ id: "OFFLINE", icon: Building2, title: "Bank transfer or UPI", desc: "Pay, then enter the UTR. We confirm within one working day." });
  return { methods, payments, gstPercent: config.pricing?.gstPercent ?? 18 };
}

function MethodPicker({ methods, value, onChange, disabled }) {
  return (
    <div role="radiogroup" aria-label="Payment method" className="grid gap-2">
      {methods.map((m) => {
        const on = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(m.id)}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border bg-surface p-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              on ? "border-primary ring-1 ring-primary" : "border-line hover:border-line-strong",
            )}
          >
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", on ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted")}>
              <m.icon className="size-4" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{m.title}</span>
              <span className="mt-0.5 block text-xs text-muted">{m.desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * <CheckoutDialog open onOpenChange course existingOrder onEnrolled />
 * existingOrder: the latest non-cancelled order for this course (from /api/me/orders), used to resume offline/failed states.
 */
export function CheckoutDialog({ open, onOpenChange, course, existingOrder = null, onEnrolled }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { methods, payments, gstPercent } = usePaymentMethods();
  const preview = priceBreakdown(course.priceINR, course.gstPercent ?? gstPercent, payments.advancePercent);

  const initialStage = () => {
    if (existingOrder?.status === "PENDING" && existingOrder.provider === "OFFLINE") return existingOrder.offlineReference ? "pending" : "offline";
    return "review";
  };
  const [stage, setStage] = useState(initialStage);
  const [order, setOrder] = useState(existingOrder?.status === "PENDING" ? existingOrder : null);
  const [method, setMethod] = useState(methods[0]?.id || null);
  const [consents, setConsents] = useState({});
  const [tried, setTried] = useState(false);
  const [failure, setFailure] = useState(null);
  const [reference, setReference] = useState("");
  const [enrollment, setEnrollment] = useState(null);
  const lastError = useRef(null);

  // re-sync when reopened for a different order state
  useEffect(() => {
    if (!open) return;
    setStage((s) => (["success", "failed", "processing"].includes(s) ? s : initialStage()));
    if (existingOrder?.status === "PENDING") setOrder(existingOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existingOrder?.id, existingOrder?.status, existingOrder?.offlineReference]);
  useEffect(() => {
    if (!method && methods[0]) setMethod(methods[0].id);
  }, [method, methods]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["my-orders"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["enrollments"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const succeed = (o, e) => {
    setOrder(o);
    setEnrollment(e || null);
    setStage("success");
    refresh();
  };
  const fail = (message) => {
    setFailure(message || "The payment didn't go through.");
    setStage("failed");
    refresh();
  };

  const verify = useMutation({
    mutationFn: ({ orderId, response }) => api.post(`/api/orders/${orderId}/razorpay/verify`, response),
    onSuccess: ({ order: o, enrollment: e }) => succeed(o, e),
    onError: (e) => fail(e.message),
    onSettled: () => onOpenChange(true),
  });

  async function openRazorpay(o, rp) {
    let Razorpay;
    try {
      Razorpay = await loadRazorpay();
    } catch (e) {
      return fail(e.message);
    }
    lastError.current = null;
    const rzp = new Razorpay({
      key: rp.keyId,
      order_id: rp.orderId,
      amount: rp.amount,
      currency: rp.currency,
      name: "Catalance Campus",
      description: course.title,
      prefill: { name: user?.name || "", email: user?.email || "" },
      theme: { color: getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#D9692A" },
      handler: (response) => verify.mutate({ orderId: o.id, response }),
      modal: {
        ondismiss: () => {
          if (lastError.current) fail(lastError.current);
          else {
            setStage("review");
            toast("Payment cancelled. You can try again.");
          }
          onOpenChange(true);
        },
      },
    });
    rzp.on("payment.failed", (resp) => {
      lastError.current = resp?.error?.description || "The bank declined the payment.";
    });
    // our dialog traps focus, so it steps aside while Razorpay's window is open
    onOpenChange(false);
    rzp.open();
  }

  const checkout = useMutation({
    mutationFn: ({ simulate } = {}) => api.post(`/api/courses/${course.id}/checkout`, { provider: method, consents: REQUIRED, ...(simulate ? { simulate } : {}) }),
    onMutate: () => setStage("processing"),
    onSuccess: (res) => {
      const o = res.order;
      setOrder(o);
      if (o.status === "PAID") return succeed(o, res.enrollment);
      if (o.status === "FAILED") return fail(o.failureReason);
      if (o.provider === "OFFLINE") return setStage(o.offlineReference ? "pending" : "offline");
      if (o.provider === "RAZORPAY" && res.razorpay) return openRazorpay(o, res.razorpay);
      setStage("review");
    },
    onError: (e) => {
      if (e.status === 409 || e.status === 400) {
        setStage("review");
        toast.error(e.message);
      } else fail(e.message);
    },
  });

  const submitRef = useMutation({
    mutationFn: () => api.post(`/api/orders/${order.id}/offline-reference`, { reference: reference.trim() }),
    onSuccess: (o) => {
      setOrder(o);
      setStage("pending");
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const pay = (simulate) => {
    setTried(true);
    if (!allAccepted(consents, REQUIRED)) return;
    if (!method) return toast.error("No payment method is available right now. Contact support.");
    checkout.mutate({ simulate });
  };

  const shown = order && order.status === "PENDING" ? order : preview;
  const titles = {
    review: { t: "Enrol in this course", d: course.title },
    processing: { t: "Processing payment", d: course.title },
    offline: { t: "Pay by bank transfer or UPI", d: course.title },
    pending: { t: "Payment being checked", d: course.title },
    success: { t: "You're enrolled", d: course.title },
    failed: { t: "Payment didn't go through", d: course.title },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={titles[stage].t} description={titles[stage].d} size="md">
        {stage === "review" && (
          <div className="space-y-6">
            {existingOrder?.status === "FAILED" && (
              <p className="flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Your last payment didn't go through. No money was taken. Try again below.
              </p>
            )}
            <div className="rounded-xl border border-line p-4">
              <PriceRows price={shown} totalLabel="Total today" />
              <p className="mt-3 text-xs text-muted">
                {preview.advancePercent === 100 ? "100% advance." : `${preview.advancePercent}% advance.`} Your course unlocks once payment is confirmed. Refunds follow the{" "}
                <a href="/legal/refund" target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
                  refund policy
                </a>
                .
              </p>
            </div>

            {methods.length ? (
              <div>
                <p className="mb-2 text-sm font-medium">Payment method</p>
                <MethodPicker methods={methods} value={method} onChange={setMethod} disabled={checkout.isPending} />
              </div>
            ) : (
              <p className="rounded-xl bg-surface-2 px-3.5 py-3 text-sm text-muted">Payment isn't available right now. Please contact support.</p>
            )}

            <ConsentCheckboxes purposes={REQUIRED} value={consents} onChange={setConsents} showError={tried} disabled={checkout.isPending} />
            <NoGuarantee />

            <div className="flex flex-col gap-2">
              <Button size="lg" className="w-full" onClick={() => pay()} loading={checkout.isPending} disabled={!methods.length} rightIcon={ArrowRight}>
                {method === "OFFLINE" ? "Continue" : `Pay ${formatINR(shown.totalINR)}`}
              </Button>
              {IS_DEMO && method === "DEMO" && (
                <button type="button" className="cursor-pointer self-center text-xs text-muted underline-offset-4 hover:underline" onClick={() => pay("fail")}>
                  Demo: simulate a failed payment
                </button>
              )}
            </div>
          </div>
        )}

        {stage === "processing" && (
          <div className="flex flex-col items-center py-10 text-center" role="status" aria-live="polite">
            <Spinner className="size-7" />
            <p className="mt-4 text-sm text-muted">Don't close this window.</p>
          </div>
        )}

        {stage === "offline" && order && (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (reference.trim().length < 4) return toast.error("Enter the UTR or reference number.");
              submitRef.mutate();
            }}
          >
            <div className="rounded-xl border border-line p-4">
              <PriceRows price={order} totalLabel="Amount to pay" />
            </div>
            <div className="text-sm">
              <p className="font-medium">How to pay</p>
              <p className="mt-1 text-muted">{payments.offlineInstructions}</p>
              <p className="mt-2 text-muted">
                Add <span className="font-medium text-fg">{order.id}</span> in the payment note.
              </p>
            </div>
            <Field label="UTR or reference number" htmlFor="offline-ref" hint="You'll find it in your bank or UPI app after paying.">
              <Input id="offline-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. 412598730021" autoComplete="off" maxLength={80} />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={submitRef.isPending}>
              Submit reference
            </Button>
          </form>
        )}

        {stage === "pending" && (
          <div className="text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted">
              <Clock className="size-5" strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-sm text-muted">We're checking your payment{order?.offlineReference ? ` (ref ${order.offlineReference})` : ""}. This takes up to one working day. We'll notify you when your course unlocks.</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="outline" to="/app/payments">
                View payments
              </Button>
              <Button variant="ghost" to="/app/help">
                Get help
              </Button>
            </div>
          </div>
        )}

        {stage === "success" && (
          <div className="text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <CheckCircle2 className="size-6" strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-sm text-muted">Payment received{order?.receiptNo ? `. Receipt ${order.receiptNo}` : ""}. Your course is unlocked. Start with the first lesson, then read the assessment brief.</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                rightIcon={ArrowRight}
                onClick={() => {
                  onOpenChange(false);
                  onEnrolled?.(enrollment);
                }}
              >
                Start
              </Button>
              {order?.id && (
                <Button size="lg" variant="outline" leftIcon={Receipt} to={`/app/payments?receipt=${order.id}`}>
                  View receipt
                </Button>
              )}
            </div>
          </div>
        )}

        {stage === "failed" && (
          <div className="text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
              <AlertTriangle className="size-5" strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-sm text-muted">{failure}</p>
            <p className="mt-2 text-xs text-muted">If money left your account, it is returned by your bank in 5–7 working days, or contact support with your order details.</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                onClick={() => {
                  setFailure(null);
                  setOrder(null);
                  setStage("review");
                }}
              >
                Try again
              </Button>
              <Button variant="outline" to="/app/help">
                Get help
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
