// Catalance Campus (campus/web) is deployed on its own URL but shares Catalance accounts:
// /campus (CampusBridge) hands the signed-in user's session over to it, so nobody signs up twice.
// Override with VITE_CAMPUS_URL when deploying (e.g. https://campus.catalance.in).
export const CAMPUS_URL = (
  import.meta.env.VITE_CAMPUS_URL ||
  (import.meta.env.DEV ? "http://localhost:5180" : "https://campus.catalance.in")
).replace(/\/$/, "");

export const CAMPUS_BRIDGE_PATH = "/campus";

export const campusNavItem = { label: "Campus", key: "campus", to: CAMPUS_BRIDGE_PATH };

/** Only same-site Campus paths ("/app/gigs"), never "//evil.com" or absolute URLs. */
export const safeCampusPath = (value) => {
  const path = String(value || "").trim();
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : "";
};
