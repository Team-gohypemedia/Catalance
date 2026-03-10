const normalizeObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const isFreelancerOpenToWork = (freelancer = {}) => {
  const profile = normalizeObject(freelancer?.freelancerProfile);
  const personal = normalizeObject(freelancer?.personal);
  const profileDetails = normalizeObject(
    freelancer?.profileDetails || profile?.profileDetails
  );
  const availability = normalizeObject(profileDetails?.availability);

  if (typeof freelancer?.available === "boolean") return freelancer.available;
  if (typeof profile?.available === "boolean") return profile.available;
  if (typeof personal?.available === "boolean") return personal.available;
  if (typeof availability?.isOpenToWork === "boolean") {
    return availability.isOpenToWork;
  }

  if (typeof freelancer?.status === "string") {
    return freelancer.status.toUpperCase() === "ACTIVE";
  }

  return true;
};

export const getFreelancerAvailabilityMeta = (freelancer = {}) => {
  const openToWork = isFreelancerOpenToWork(freelancer);

  return {
    openToWork,
    label: openToWork ? "Open to Work" : "Offline",
    badgeClass: openToWork
      ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-300"
      : "border-border/70 bg-background/35 text-muted-foreground",
    dotClass: openToWork ? "bg-emerald-400" : "bg-muted-foreground/80",
  };
};
