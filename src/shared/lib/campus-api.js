import { useEffect, useState } from "react";
import { CAMPUS_BRIDGE_PATH, CAMPUS_URL } from "@/shared/lib/campus";

// Read-only Campus data served by the Catalance backend (/api/campus/*, see backend/src/routes/campus.routes.js).
// Campus being unavailable is never an error for the marketplace: callers get empty results.

const QUIET_FETCH_OPTIONS = { skipLogoutOn401: true, suppressToast: true };

export const CAMPUS_LEVEL_LABELS = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  STANDARD: "Standard",
};

export const CAMPUS_LEVEL_OPTIONS = Object.entries(CAMPUS_LEVEL_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const campusLevelLabel = (level) =>
  CAMPUS_LEVEL_LABELS[String(level || "").toUpperCase()] || String(level || "");

/** Public verification page on Campus for a skill badge. */
export const campusSkillVerifyUrl = (verification) =>
  verification?.verifyCode
    ? `${CAMPUS_URL}/verify/skill/${encodeURIComponent(verification.verifyCode)}`
    : verification?.verifyUrl || "";

/** /campus?next=<path>: hands the Catalance session over to Campus (CampusBridge). */
export const campusBridgeHref = (next = "") =>
  next ? `${CAMPUS_BRIDGE_PATH}?next=${encodeURIComponent(next)}` : CAMPUS_BRIDGE_PATH;

const toQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
};

const readPayload = async (response) => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return payload;
};

export const campusApi = {
  async getUserSkills(authFetch, userId) {
    if (!userId) return [];
    const payload = await readPayload(
      await authFetch(`/campus/users/${encodeURIComponent(userId)}/skills`, QUIET_FETCH_OPTIONS)
    );
    return Array.isArray(payload?.data) ? payload.data : [];
  },

  async getMySummary(authFetch) {
    const payload = await readPayload(await authFetch("/campus/me/summary", QUIET_FETCH_OPTIONS));
    return payload?.data || null;
  },

  async getTalent(authFetch, { skill, level } = {}) {
    const payload = await readPayload(
      await authFetch(`/campus/talent${toQuery({ skill, level })}`, QUIET_FETCH_OPTIONS)
    );
    return {
      talent: Array.isArray(payload?.data) ? payload.data : [],
      skills: Array.isArray(payload?.meta?.skills) ? payload.meta.skills : [],
      available: payload?.meta?.available !== false,
    };
  },
};

/** Active Campus skill verifications for a Catalance user; [] while loading or on any failure. */
export const useCampusVerifiedSkills = (authFetch, userId) => {
  const [state, setState] = useState({ userId: null, skills: [] });

  useEffect(() => {
    if (!authFetch || !userId) return undefined;
    let active = true;
    campusApi
      .getUserSkills(authFetch, userId)
      .then((skills) => {
        if (active) setState({ userId, skills });
      })
      .catch(() => {
        if (active) setState({ userId, skills: [] });
      });
    return () => {
      active = false;
    };
  }, [authFetch, userId]);

  return state.userId === userId ? state.skills : [];
};
