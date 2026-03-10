const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const BROKEN_INR_SYMBOL_PATTERN = /\u00e2\u201a\u00b9|\u00c6\u2019,1/g;

export const INR_PREFIX_PATTERN = /(?:INR|Rs\.?|\u20B9)/i;
export const FREELANCER_BUDGET_SHARE = 0.7;
export const PLATFORM_MARGIN_SHARE = 0.3;

export const normalizeINRText = (value = "") =>
  String(value ?? "").replace(BROKEN_INR_SYMBOL_PATTERN, "\u20B9");

export const formatINR = (value = 0) => INR_FORMATTER.format(Number(value) || 0);

export const getFreelancerVisibleBudgetValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = normalizeINRText(String(value).trim());
  if (!normalized) {
    return null;
  }

  const hasKSuffix = /\d+\s*k$/i.test(normalized);
  const numeric = Number(normalized.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(numeric)) {
    return null;
  }

  const resolved = hasKSuffix ? numeric * 1000 : numeric;
  return Math.max(0, Math.round(resolved * FREELANCER_BUDGET_SHARE));
};
