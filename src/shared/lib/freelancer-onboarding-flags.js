const FREELANCER_WELCOME_PENDING_KEY = "freelancer_welcome_pending_v1";

export const markFreelancerWelcomePending = () => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(FREELANCER_WELCOME_PENDING_KEY, "1");
  } catch {
    // Ignore storage failures in private/restricted browser contexts.
  }
};

export const consumeFreelancerWelcomePending = () => {
  if (typeof window === "undefined") return false;

  try {
    const isPending =
      window.sessionStorage.getItem(FREELANCER_WELCOME_PENDING_KEY) === "1";

    if (isPending) {
      window.sessionStorage.removeItem(FREELANCER_WELCOME_PENDING_KEY);
    }

    return isPending;
  } catch {
    return false;
  }
};
