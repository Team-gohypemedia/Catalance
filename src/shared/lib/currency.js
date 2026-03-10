const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const BROKEN_INR_SYMBOL_PATTERN = /\u00e2\u201a\u00b9|\u00c6\u2019,1/g;

export const INR_PREFIX_PATTERN = /(?:INR|Rs\.?|\u20B9)/i;

export const normalizeINRText = (value = "") =>
  String(value ?? "").replace(BROKEN_INR_SYMBOL_PATTERN, "\u20B9");

export const formatINR = (value = 0) => INR_FORMATTER.format(Number(value) || 0);
