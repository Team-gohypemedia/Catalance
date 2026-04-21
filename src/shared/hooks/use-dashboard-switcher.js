import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/shared/context/AuthContext";
import {
  canAccessDashboard,
  getAccessibleDashboards,
  getDashboardFromPathname,
  getDashboardLabel,
  getDashboardPath,
  getDashboardProfilePath,
  resolvePreferredDashboard,
  resolveSwitchTargetDashboard,
  resolveWorkspaceHomePath,
  setStoredDashboardPreference,
} from "@/shared/lib/dashboard-preference";

export const useDashboardSwitcher = ({
  currentDashboard: explicitCurrentDashboard = null,
} = {}) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const preferredDashboard = useMemo(
    () => resolvePreferredDashboard(user),
    [user]
  );

  const routeDashboard = useMemo(
    () => getDashboardFromPathname(location.pathname),
    [location.pathname]
  );

  const currentDashboard =
    explicitCurrentDashboard || routeDashboard || preferredDashboard;

  const activeDashboard = useMemo(() => {
    if (canAccessDashboard(user, currentDashboard)) {
      return currentDashboard;
    }

    return preferredDashboard;
  }, [currentDashboard, preferredDashboard, user]);

  const accessibleDashboards = useMemo(
    () => getAccessibleDashboards(user),
    [user]
  );

  const switchTarget = useMemo(
    () =>
      resolveSwitchTargetDashboard(user, activeDashboard, {
        preferredDashboard,
      }),
    [activeDashboard, preferredDashboard, user]
  );

  const dashboardPath = useMemo(() => {
    const activeDashboardPath = getDashboardPath(activeDashboard);

    if (activeDashboardPath) {
      return activeDashboardPath;
    }

    return resolveWorkspaceHomePath(user, {
      preferredDashboard,
    });
  }, [activeDashboard, preferredDashboard, user]);

  const profilePath = useMemo(
    () => getDashboardProfilePath(activeDashboard) || dashboardPath,
    [activeDashboard, dashboardPath]
  );

  const rememberDashboard = useCallback(
    (dashboard) => setStoredDashboardPreference(user, dashboard),
    [user]
  );

  const switchDashboard = useCallback(() => {
    if (!switchTarget) {
      return;
    }

    rememberDashboard(switchTarget.dashboard);
    navigate(switchTarget.path);
  }, [navigate, rememberDashboard, switchTarget]);

  return {
    accessibleDashboards,
    canSwitchDashboard: Boolean(switchTarget),
    currentDashboard: activeDashboard,
    currentDashboardLabel: getDashboardLabel(activeDashboard),
    dashboardPath,
    profilePath,
    preferredDashboard,
    rememberDashboard,
    switchDashboard,
    switchLabel: switchTarget ? `Switch to ${switchTarget.label}` : null,
    switchTarget,
  };
};

export default useDashboardSwitcher;
