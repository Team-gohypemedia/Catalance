const TOKEN_KEY = "catalance.accessToken";
const USER_KEY = "catalance.user";

const isBrowser = () => typeof window !== "undefined";

const decodeBase64Url = (value = "") => {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded =
    normalized.length % 4 === 0
      ? normalized
      : normalized.padEnd(
          normalized.length + (4 - (normalized.length % 4)),
          "="
        );

  if (typeof globalThis.atob === "function") {
    return globalThis.atob(padded);
  }

  const bufferCtor = globalThis.Buffer;
  if (bufferCtor?.from) {
    return bufferCtor.from(padded, "base64").toString("utf8");
  }

  throw new Error("Unable to decode JWT payload.");
};

export const decodeJwtPayload = (token = "") => {
  const [, payloadSegment = ""] = String(token || "").split(".");

  if (!payloadSegment) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payloadSegment));
  } catch {
    return null;
  }
};

export const getTokenExpiryTime = (token = "") => {
  const exp = Number(decodeJwtPayload(token)?.exp);
  if (!Number.isFinite(exp) || exp <= 0) {
    return null;
  }

  return exp * 1000;
};

export const isSessionTokenExpired = (
  token = "",
  { now = Date.now() } = {}
) => {
  const expiresAt = getTokenExpiryTime(token);
  return !Number.isFinite(expiresAt) || expiresAt <= now;
};

export const persistSession = ({ accessToken, user }) => {
  if (!isBrowser()) {
    return;
  }

  if (accessToken) {
    window.localStorage.setItem(TOKEN_KEY, accessToken);
  }

  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const clearSession = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
};

export const getSession = (options = {}) => {
  if (!isBrowser()) {
    return null;
  }

  const accessToken = window.localStorage.getItem(TOKEN_KEY);
  const user = window.localStorage.getItem(USER_KEY);

  if (!accessToken || !user) {
    return null;
  }

  try {
    if (isSessionTokenExpired(accessToken, options)) {
      clearSession();
      return null;
    }

    return {
      accessToken,
      user: JSON.parse(user)
    };
  } catch {
    clearSession();
    return null;
  }
};

export const sessionStorageKeys = {
  token: TOKEN_KEY,
  user: USER_KEY
};
