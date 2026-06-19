const PHONE_ONLY_EMAIL_DOMAIN = "phone.catalance.local";
const PHONE_ONLY_DEFAULT_FULL_NAME = "WhatsApp User";

const normalizeText = (value = "") => String(value || "").trim();

export const normalizePhoneDigits = (value = "") =>
  String(value || "").replace(/\D/g, "");

export const isPhoneOnlyAccountEmail = (value = "") =>
  normalizeText(value).toLowerCase().endsWith(`@${PHONE_ONLY_EMAIL_DOMAIN}`);

export const resolveUserPhoneNumber = (user = null) => {
  const directPhone = normalizeText(user?.phoneNumber || user?.phone);

  if (directPhone) {
    return directPhone;
  }

  const email = normalizeText(user?.email);
  if (!isPhoneOnlyAccountEmail(email)) {
    return "";
  }

  const [localPart = ""] = email.split("@");
  return normalizePhoneDigits(localPart.replace(/^phone-/i, ""));
};

const isPlaceholderName = (value = "") =>
  normalizeText(value).toLowerCase() === PHONE_ONLY_DEFAULT_FULL_NAME.toLowerCase();

export const resolveUserDisplayName = (user = null, fallback = "User") => {
  const fullName = normalizeText(user?.fullName);
  if (fullName && !isPlaceholderName(fullName)) {
    return fullName;
  }

  const name = normalizeText(user?.name);
  if (name && !isPlaceholderName(name)) {
    return name;
  }

  const phoneNumber = resolveUserPhoneNumber(user);
  if (phoneNumber) {
    return phoneNumber;
  }

  const email = normalizeText(user?.email);
  if (email && !isPhoneOnlyAccountEmail(email)) {
    return email.split("@")[0] || email;
  }

  return fallback;
};

export const resolveUserSecondaryLabel = (user = null, fallback = "") => {
  const email = normalizeText(user?.email);
  if (email && !isPhoneOnlyAccountEmail(email)) {
    return email;
  }

  const phoneNumber = resolveUserPhoneNumber(user);
  if (
    phoneNumber &&
    normalizeText(resolveUserDisplayName(user, "")).toLowerCase() !== phoneNumber.toLowerCase()
  ) {
    return phoneNumber;
  }

  return fallback;
};
