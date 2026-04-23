import { buildNamespacedStorageKey } from "./storage-keys.js";

export const CLIENT_DASHBOARD = "client";
export const FREELANCER_DASHBOARD = "freelancer";
export const FREELANCER_DASHBOARD_PATH = "/freelancer";
export const FREELANCER_ONBOARDING_PATH = "/freelancer/onboarding";

const DASHBOARD_PREFERENCE_KEY_PREFIX = "lastDashboard:v1";
const DASHBOARD_PATHS = Object.freeze({
  [CLIENT_DASHBOARD]: "/client",
  [FREELANCER_DASHBOARD]: FREELANCER_DASHBOARD_PATH,
});
const DASHBOARD_PROFILE_PATHS = Object.freeze({
  [CLIENT_DASHBOARD]: "/client/profile",
  [FREELANCER_DASHBOARD]: "/freelancer/profile",
});
const ROLE_IMPLIED_TOKENS = Object.freeze({
  CLIENT: ["FREELANCER"],
  FREELANCER: ["CLIENT"],
});

const isBrowser = () => typeof window !== "undefined";

const normalizeRoleToken = (value = "") =>
  String(value || "")
    .trim()
    .toUpperCase();

const normalizePathnameToken = (value = "") => {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return "";
  }

  const [pathname] = normalizedValue.split(/[?#]/, 1);
  if (!pathname) {
    return "";
  }

  const normalizedPathname = pathname
    .replace(/\/+$/, "")
    .trim()
    .toLowerCase();

  return normalizedPathname || "/";
};

export const normalizeDashboardValue = (value = "") => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (
    normalized === CLIENT_DASHBOARD ||
    normalized === FREELANCER_DASHBOARD
  ) {
    return normalized;
  }

  return null;
};

export const getDashboardLabel = (dashboard = "") => {
  const normalizedDashboard = normalizeDashboardValue(dashboard);

  if (normalizedDashboard === FREELANCER_DASHBOARD) {
    return "Freelancer";
  }

  if (normalizedDashboard === CLIENT_DASHBOARD) {
    return "Client";
  }

  return "";
};

export const getDashboardPath = (dashboard = "") =>
  DASHBOARD_PATHS[normalizeDashboardValue(dashboard)] || null;

export const getDashboardProfilePath = (dashboard = "") =>
  DASHBOARD_PROFILE_PATHS[normalizeDashboardValue(dashboard)] || null;

export const getDashboardFromPathname = (pathname = "") => {
  const normalizedPathname = normalizePathnameToken(pathname);

  if (normalizedPathname.startsWith("/client")) {
    return CLIENT_DASHBOARD;
  }

  if (normalizedPathname.startsWith("/freelancer")) {
    return FREELANCER_DASHBOARD;
  }

  return null;
};

export const resolveDashboardValue = (value = "") => {
  const normalizedDashboard = normalizeDashboardValue(value);

  if (normalizedDashboard) {
    return normalizedDashboard;
  }

  const normalizedRole = normalizeRoleToken(value);

  if (normalizedRole === "CLIENT") {
    return CLIENT_DASHBOARD;
  }

  if (normalizedRole === "FREELANCER") {
    return FREELANCER_DASHBOARD;
  }

  return null;
};

export const getUserRoleTokens = (user = null) => {
  const roleTokens = new Set();
  const addRoleToken = (value = "") => {
    const normalizedRole = normalizeRoleToken(value);

    if (!normalizedRole) {
      return;
    }

    roleTokens.add(normalizedRole);
    (ROLE_IMPLIED_TOKENS[normalizedRole] || []).forEach((entry) => {
      roleTokens.add(entry);
    });
  };

  addRoleToken(user?.role);

  if (Array.isArray(user?.roles)) {
    user.roles
      .forEach((entry) => addRoleToken(entry));
  }

  return roleTokens;
};

export const getAccessibleDashboards = (user = null) => {
  const roleTokens = getUserRoleTokens(user);
  const dashboards = [];

  if (roleTokens.has("CLIENT")) {
    dashboards.push(CLIENT_DASHBOARD);
  }

  if (roleTokens.has("FREELANCER")) {
    dashboards.push(FREELANCER_DASHBOARD);
  }

  return dashboards;
};

export const canAccessDashboard = (user = null, dashboard = "") => {
  const normalizedDashboard = normalizeDashboardValue(dashboard);

  if (!normalizedDashboard) {
    return false;
  }

  return getAccessibleDashboards(user).includes(normalizedDashboard);
};

export const normalizeOnboardingComplete = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === "true" || normalizedValue === "1";
  }

  return false;
};

export const hasCompletedFreelancerOnboarding = (user = null) =>
  normalizeOnboardingComplete(
    user?.onboardingComplete ?? user?.isOnboarded
  );

export const requiresFreelancerOnboarding = (user = null) =>
  canAccessDashboard(user, FREELANCER_DASHBOARD) &&
  !hasCompletedFreelancerOnboarding(user);

export const isFreelancerOnboardingPath = (pathname = "") =>
  normalizePathnameToken(pathname) === FREELANCER_ONBOARDING_PATH;

export const isFreelancerDashboardPath = (pathname = "") =>
  normalizePathnameToken(pathname) === FREELANCER_DASHBOARD_PATH;

export const isFreelancerPath = (pathname = "") =>
  normalizePathnameToken(pathname).startsWith(FREELANCER_DASHBOARD_PATH);

export const resolveFreelancerPath = (
  user = null,
  pathname = FREELANCER_DASHBOARD_PATH
) => {
  const normalizedPath = String(pathname || "").trim();
  const requiresOnboarding = requiresFreelancerOnboarding(user);

  if (!normalizedPath) {
    return FREELANCER_DASHBOARD_PATH;
  }

  if (!isFreelancerPath(normalizedPath)) {
    return normalizedPath;
  }

  if (isFreelancerOnboardingPath(normalizedPath)) {
    return requiresOnboarding
      ? FREELANCER_ONBOARDING_PATH
      : FREELANCER_DASHBOARD_PATH;
  }

  if (requiresOnboarding && !isFreelancerDashboardPath(normalizedPath)) {
    return FREELANCER_DASHBOARD_PATH;
  }

  return normalizedPath;
};

export const getDashboardEntryPath = (user = null, dashboard = "") => {
  const normalizedDashboard = normalizeDashboardValue(dashboard);

  if (!normalizedDashboard) {
    return null;
  }

  const dashboardPath = getDashboardPath(normalizedDashboard);

  if (normalizedDashboard !== FREELANCER_DASHBOARD) {
    return dashboardPath;
  }

  return resolveFreelancerPath(user, dashboardPath);
};

const getStorage = (storage) =>
  storage || (isBrowser() ? window.localStorage : null);

export const getDashboardPreferenceStorageKey = (userOrId) => {
  const userId =
    userOrId && typeof userOrId === "object" ? userOrId.id : userOrId;
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    return null;
  }

  return buildNamespacedStorageKey(
    `${DASHBOARD_PREFERENCE_KEY_PREFIX}:${normalizedUserId}`
  );
};

export const getStoredDashboardPreference = (
  userOrId,
  { storage } = {}
) => {
  const resolvedStorage = getStorage(storage);
  const storageKey = getDashboardPreferenceStorageKey(userOrId);

  if (!resolvedStorage || !storageKey) {
    return null;
  }

  const rawValue = resolvedStorage.getItem(storageKey);
  const normalizedValue = normalizeDashboardValue(rawValue);

  if (!normalizedValue && rawValue !== null) {
    resolvedStorage.removeItem(storageKey);
  }

  return normalizedValue;
};

export const setStoredDashboardPreference = (
  userOrId,
  dashboard,
  { storage } = {}
) => {
  const resolvedStorage = getStorage(storage);
  const storageKey = getDashboardPreferenceStorageKey(userOrId);
  const normalizedDashboard = normalizeDashboardValue(dashboard);

  if (!resolvedStorage || !storageKey || !normalizedDashboard) {
    return null;
  }

  resolvedStorage.setItem(storageKey, normalizedDashboard);
  return normalizedDashboard;
};

export const rememberDashboardFromPath = (
  user,
  pathname,
  { storage } = {}
) => {
  const dashboard = getDashboardFromPathname(pathname);

  if (!dashboard || !canAccessDashboard(user, dashboard)) {
    return null;
  }

  return setStoredDashboardPreference(user, dashboard, { storage });
};

export const resolvePreferredDashboard = (
  user,
  { preferredDashboard = null, storage } = {}
) => {
  const accessibleDashboards = getAccessibleDashboards(user);

  if (!accessibleDashboards.length) {
    return null;
  }

  const explicitDashboard = normalizeDashboardValue(preferredDashboard);
  if (
    explicitDashboard &&
    accessibleDashboards.includes(explicitDashboard)
  ) {
    return explicitDashboard;
  }

  const storedDashboard = getStoredDashboardPreference(user, { storage });
  if (storedDashboard && accessibleDashboards.includes(storedDashboard)) {
    return storedDashboard;
  }

  const primaryRole = normalizeRoleToken(user?.role);
  if (
    primaryRole === "CLIENT" &&
    accessibleDashboards.includes(CLIENT_DASHBOARD)
  ) {
    return CLIENT_DASHBOARD;
  }

  if (
    primaryRole === "FREELANCER" &&
    accessibleDashboards.includes(FREELANCER_DASHBOARD)
  ) {
    return FREELANCER_DASHBOARD;
  }

  return accessibleDashboards[0] || null;
};

export const resolveSwitchTargetDashboard = (
  user,
  currentDashboard,
  { preferredDashboard = null, storage } = {}
) => {
  const accessibleDashboards = getAccessibleDashboards(user);

  if (accessibleDashboards.length < 2) {
    return null;
  }

  const normalizedCurrentDashboard =
    normalizeDashboardValue(currentDashboard) ||
    resolvePreferredDashboard(user, {
      preferredDashboard,
      storage,
    });

  const targetDashboard =
    accessibleDashboards.find(
      (dashboard) => dashboard !== normalizedCurrentDashboard
    ) || accessibleDashboards[0];

  if (!targetDashboard) {
    return null;
  }

  return {
    dashboard: targetDashboard,
    label: getDashboardLabel(targetDashboard),
    path: getDashboardEntryPath(user, targetDashboard),
  };
};

export const resolveWorkspaceHomePath = (
  user,
  { preferredDashboard = null, storage } = {}
) => {
  const dashboard = resolvePreferredDashboard(user, {
    preferredDashboard,
    storage,
  });

  if (dashboard) {
    return getDashboardEntryPath(user, dashboard);
  }

  const primaryRole = normalizeRoleToken(user?.role);

  if (primaryRole === "ADMIN") {
    return "/admin";
  }

  if (primaryRole === "PROJECT_MANAGER") {
    return "/project-manager";
  }

  if (primaryRole === "FREELANCER") {
    return getDashboardEntryPath(user, FREELANCER_DASHBOARD);
  }

  return "/client";
};
