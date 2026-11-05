import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

/**
 * Public platform config: feature flags + editable content (GET /api/platform/config).
 * Defaults mirror api/src/lib/settings.js DEFAULT_SETTINGS so the UI is right before the request resolves.
 */
export const DEFAULT_CONFIG = {
  flags: { aiTutor: false, gamification: false, gigs: false, wallet: false, community: true, mentorBooking: true, cohorts: true, aspirants: true },
  pricing: { gstPercent: 18 },
  assessment: { passScore: 70, maxAttempts: 2, reassessWindowDays: 14 },
  content: {
    noGuarantee: "Passing an assessment makes you eligible for relevant project opportunities. Projects and earnings are not guaranteed.",
    hero: { title: "Learn a skill. Prove it. Get verified.", subtitle: "Build practical digital skills and become eligible for freelance projects through Catalance." },
    faqs: [],
  },
  policies: { versions: {} },
  support: { email: "support@catalance.in" },
};

export function usePlatformConfig() {
  const { data } = useQuery({
    queryKey: ["platform-config"],
    queryFn: () => api.get("/api/platform/config"),
    staleTime: 60_000,
  });
  return {
    ...DEFAULT_CONFIG,
    ...data,
    flags: { ...DEFAULT_CONFIG.flags, ...data?.flags },
    content: { ...DEFAULT_CONFIG.content, ...data?.content },
  };
}

/** Staff roles that use the console at /admin (each page lists which of these may open it). */
export const STAFF_ROLES = ["ADMIN", "EVALUATOR", "PROJECT_MANAGER", "FINANCE"];
export const isStaff = (user) => STAFF_ROLES.includes(user?.role);

/** Where a staff member lands in the console. */
export const staffHome = (user) =>
  ({ ADMIN: "/admin", EVALUATOR: "/admin/evaluations", PROJECT_MANAGER: "/admin/talent", FINANCE: "/admin/payments" })[user?.role] || "/app";

/** Nav/route item visible for this user + flags? Items may declare `flag` and/or `roles`. */
export const navItemVisible = (item, user, flags) =>
  (!item.flag || flags[item.flag]) && (!item.roles || item.roles.includes(user?.role));
