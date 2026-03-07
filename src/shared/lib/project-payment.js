import { openRazorpayCheckout } from "@/shared/lib/razorpay-checkout";

export const processProjectInstallmentPayment = async ({
  authFetch,
  projectId,
  prefill,
  description,
}) => {
  if (typeof authFetch !== "function") {
    throw new Error("authFetch is required to process the payment.");
  }

  if (!projectId) {
    throw new Error("Project reference is missing for this payment.");
  }

  const orderRes = await authFetch(`/projects/${projectId}/payments/order`, {
    method: "POST",
  });
  const orderPayload = await orderRes.json().catch(() => null);

  if (!orderRes.ok) {
    if (orderRes.status === 503) {
      const fallbackRes = await authFetch(`/projects/${projectId}/payments/direct`, {
        method: "POST",
      });
      const fallbackPayload = await fallbackRes.json().catch(() => null);
      if (!fallbackRes.ok) {
        throw new Error(fallbackPayload?.message || "Payment failed");
      }
      return fallbackPayload?.data || fallbackPayload;
    }

    throw new Error(orderPayload?.message || "Unable to initiate payment");
  }

  const orderData = orderPayload?.data || {};
  const installment = orderData.installment || orderData.paymentPlan?.nextDueInstallment || null;
  const paymentProof = await openRazorpayCheckout({
    key: orderData.key,
    amountPaise: orderData.amountPaise,
    currency: orderData.currency || "INR",
    orderId: orderData.orderId,
    description:
      description ||
      `${installment?.label || "Project payment"} for ${
        orderData.projectTitle || "project"
      }`,
    prefill,
    notes: {
      projectId: orderData.projectId,
      installmentSequence: installment?.sequence,
    },
  });

  const verifyRes = await authFetch(`/projects/${projectId}/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentProof),
  });
  const verifyPayload = await verifyRes.json().catch(() => null);

  if (!verifyRes.ok) {
    throw new Error(verifyPayload?.message || "Payment verification failed");
  }

  return verifyPayload?.data || verifyPayload;
};
