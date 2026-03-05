let razorpayScriptPromise = null;

export const loadRazorpayCheckoutScript = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};

export const openRazorpayCheckout = async ({
  key,
  amountPaise,
  currency = "INR",
  orderId,
  name = "Catalance",
  description = "Upfront project payment",
  prefill = {},
  notes = {},
  theme = { color: "#facc15" },
}) => {
  const loaded = await loadRazorpayCheckoutScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Failed to load Razorpay checkout script.");
  }

  return new Promise((resolve, reject) => {
    const instance = new window.Razorpay({
      key,
      amount: amountPaise,
      currency,
      name,
      description,
      order_id: orderId,
      prefill,
      notes,
      theme,
      handler: (response) => {
        resolve({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          reject(new Error("Payment popup was closed before completion."));
        },
      },
    });

    instance.on("payment.failed", (event) => {
      const reason =
        event?.error?.description ||
        event?.error?.reason ||
        "Razorpay payment failed.";
      reject(new Error(reason));
    });

    instance.open();
  });
};

