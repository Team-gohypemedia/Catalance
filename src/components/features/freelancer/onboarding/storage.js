const LEGACY_DATA_KEY = "freelancer_onboarding_data";
const LEGACY_STEP_KEY = "freelancer_onboarding_step";
const STORAGE_PREFIX = "freelancer_onboarding";

const sanitizeStorageIdentity = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export const getFreelancerOnboardingStorageKeys = (user) => {
  const identity = sanitizeStorageIdentity(user?.id || user?.email || "guest");
  return {
    dataKey: `${STORAGE_PREFIX}_data_${identity}`,
    stepKey: `${STORAGE_PREFIX}_step_${identity}`,
  };
};

export const LEGACY_FREELANCER_ONBOARDING_STORAGE_KEYS = {
  dataKey: LEGACY_DATA_KEY,
  stepKey: LEGACY_STEP_KEY,
};

