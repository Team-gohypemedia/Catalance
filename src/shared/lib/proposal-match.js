const SERVICE_EQUIVALENCE_GROUPS = Object.freeze([
  ["web_development", "website_development", "web_dev", "web_design_development"],
  ["app_development", "mobile_app_development", "android_app_development", "ios_app_development"],
  ["seo", "search_engine_optimization"],
  ["social_media_marketing", "smm"],
  ["ui_ux_design", "ux_ui_design", "product_design"],
  ["graphic_design", "branding", "brand_design"],
  ["video_editing", "video_production"],
]);

const SERVICE_ALIAS_MAP = SERVICE_EQUIVALENCE_GROUPS.reduce((accumulator, group) => {
  const canonical = group[0];
  group.forEach((value) => {
    accumulator[value] = canonical;
  });
  return accumulator;
}, {});

export const clampPercentage = (value, { fallback = 0 } = {}) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
};

export const normalizeServiceIdentity = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export const canonicalizeServiceIdentity = (value = "") => {
  const normalized = normalizeServiceIdentity(value);
  if (!normalized) {
    return "";
  }

  return SERVICE_ALIAS_MAP[normalized] || normalized;
};

export const resolveFreelancerServiceIdentity = (freelancer = {}) => {
  const serviceCandidates = [
    freelancer?.matchedService?.serviceKey,
    freelancer?.matchedService?.serviceName,
    freelancer?.serviceKey,
    freelancer?.serviceType,
    freelancer?.serviceName,
    freelancer?.service,
  ];

  for (const candidate of serviceCandidates) {
    const normalized = canonicalizeServiceIdentity(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return "";
};

export const isFreelancerServiceAligned = (freelancer = {}, proposalService = "") => {
  if (freelancer?.serviceMatch === true) {
    return true;
  }

  const normalizedProposalService = canonicalizeServiceIdentity(proposalService);
  const normalizedFreelancerService = resolveFreelancerServiceIdentity(freelancer);

  if (!normalizedProposalService || !normalizedFreelancerService) {
    return false;
  }

  return normalizedProposalService === normalizedFreelancerService;
};

export const resolveFreelancerMatchPercent = (freelancer = {}, fallback = null) => {
  const scoreCandidates = [
    freelancer?.matchPercent,
    freelancer?.matchScore,
    freelancer?.projectRelevanceScore,
    freelancer?.score,
  ];

  const numericScore = scoreCandidates.find((value) =>
    Number.isFinite(Number(value)),
  );

  if (!Number.isFinite(Number(numericScore))) {
    return fallback;
  }

  return clampPercentage(numericScore, { fallback });
};
