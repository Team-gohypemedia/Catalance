/**
 * Campus uses Catalance accounts. Signing in, signing up and passwords happen on the main Catalance app;
 * its /campus route sends the user back to Campus /sso with their session (see pages/auth/Sso.jsx).
 * Not used in demo mode, where the in-browser engine has its own demo logins.
 */
export const CATALANCE_URL = (
  import.meta.env.VITE_CATALANCE_URL ||
  (import.meta.env.DEV ? "http://localhost:5173" : "https://catalance.in")
).replace(/\/$/, "");

/** Only same-site paths ("/app/gigs"), never "//evil.com" or absolute URLs. */
export const safeNext = (value) => {
  const path = String(value || "").trim();
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : "";
};

/** Sign in on Catalance (or reuse the Catalance session) and come back to Campus at `next`. */
export function catalanceSigninUrl(next) {
  const params = new URLSearchParams({ signin: "1" });
  const path = safeNext(next);
  if (path) params.set("next", path);
  return `${CATALANCE_URL}/campus?${params}`;
}

export const catalanceForgotPasswordUrl = () => `${CATALANCE_URL}/forgot-password`;
