import { useEffect } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";

import Loader from "@/components/common/Loader";
import { useAuth } from "@/shared/context/AuthContext";
import { isSessionTokenExpired } from "@/shared/lib/auth-storage";
import { CAMPUS_BRIDGE_PATH, CAMPUS_URL, safeCampusPath } from "@/shared/lib/campus";
import {
  ACCOUNT_ONBOARDING_PATH,
  requiresAccountOnboarding,
} from "@/shared/lib/dashboard-preference";

/**
 * /campus?next=/app/gigs[&signin=1]
 * Catalance Campus uses Catalance accounts. This route hands the current session to Campus:
 * - signed in   → CAMPUS_URL/sso#token=…&next=… (fragment, so the token never reaches a server log)
 * - signed out  → with signin=1 (Campus "Log in"), sign in here first and come back;
 *                 otherwise (navbar link) just open the Campus landing page.
 */
const CampusBridge = () => {
  const { isAuthenticated, isCheckingAuth, token, user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const next = safeCampusPath(searchParams.get("next"));
  const wantsSignin = searchParams.get("signin") === "1";
  const hasSession = isAuthenticated && token && !isSessionTokenExpired(token);
  const needsOnboarding = hasSession && requiresAccountOnboarding(user);

  const target = isCheckingAuth || needsOnboarding
    ? null
    : hasSession
      ? `${CAMPUS_URL}/sso#${new URLSearchParams({ token, ...(next ? { next } : {}) })}`
      : wantsSignin
        ? null
        : `${CAMPUS_URL}${next || "/"}`;

  useEffect(() => {
    if (target) window.location.replace(target);
  }, [target]);

  if (isCheckingAuth || target) {
    return <Loader />;
  }

  // After sign-in (or onboarding) come back here without signin=1, which then hands over the session.
  const returnTo = `${CAMPUS_BRIDGE_PATH}${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  if (needsOnboarding) {
    return (
      <Navigate
        to={ACCOUNT_ONBOARDING_PATH}
        replace
        state={{ ...location.state, redirectTo: returnTo }}
      />
    );
  }

  return <Navigate to={`/signin/phone?redirect=${encodeURIComponent(returnTo)}`} replace />;
};

export default CampusBridge;
