const normalizeObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const resolveFreelancerAvailabilityState = (freelancer = {}) => {
  const profile = normalizeObject(freelancer?.freelancerProfile);
  const personal = normalizeObject(freelancer?.personal);
  const profileDetails = normalizeObject(
    freelancer?.profileDetails || profile?.profileDetails
  );
  const availability = normalizeObject(profileDetails?.availability);
  const hasOpenToWorkSignal =
    typeof freelancer?.openToWork === "boolean" ||
    typeof profile?.openToWork === "boolean" ||
    typeof personal?.openToWork === "boolean" ||
    typeof availability?.isOpenToWork === "boolean";

  if (typeof freelancer?.openToWork === "boolean") {
    return { openToWork: freelancer.openToWork, hasOpenToWorkSignal };
  }
  if (typeof profile?.openToWork === "boolean") {
    return { openToWork: profile.openToWork, hasOpenToWorkSignal };
  }
  if (typeof personal?.openToWork === "boolean") {
    return { openToWork: personal.openToWork, hasOpenToWorkSignal };
  }
  if (typeof availability?.isOpenToWork === "boolean") {
    return { openToWork: availability.isOpenToWork, hasOpenToWorkSignal };
  }

  if (typeof freelancer?.status === "string") {
    return {
      openToWork: freelancer.status.toUpperCase() === "ACTIVE",
      hasOpenToWorkSignal,
    };
  }

  return { openToWork: true, hasOpenToWorkSignal };
};

export const isFreelancerOpenToWork = (freelancer = {}) => {
  return resolveFreelancerAvailabilityState(freelancer).openToWork;
};

export const getFreelancerAvailabilityMeta = (freelancer = {}) => {
  const { openToWork, hasOpenToWorkSignal } = resolveFreelancerAvailabilityState(
    freelancer
  );

  return {
    openToWork,
    label: openToWork ? "Open to Work" : hasOpenToWorkSignal ? "At Capacity" : "Offline",
    badgeClass: openToWork
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : hasOpenToWorkSignal
        ? "border-primary/25 bg-primary/10 text-primary"
        : "border-border/70 bg-background/35 text-muted-foreground",
    dotClass: openToWork
      ? "bg-emerald-500 dark:bg-emerald-400"
      : hasOpenToWorkSignal
        ? "bg-primary"
        : "bg-muted-foreground/80",
  };
};
