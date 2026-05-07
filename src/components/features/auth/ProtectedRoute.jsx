import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/shared/context/AuthContext";
import {
  ACCOUNT_ONBOARDING_PATH,
  FREELANCER_DASHBOARD,
  FREELANCER_DASHBOARD_PATH,
  canAccessDashboard,
  isAccountOnboardingPath,
  requiresAccountOnboarding,
  requiresFreelancerOnboarding,
} from "@/shared/lib/dashboard-preference";

const ProtectedRoute = ({
  children,
  loginPath = "/signin/phone",
  allowedRoles = null,
  allowFreelancerOnboardingOnly = false,
  requireFreelancerOnboardingComplete = false,
}) => {
  const { isAuthenticated, isCheckingAuth, user } = useAuth();
  const location = useLocation();

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />;
  }

  if (
    requiresAccountOnboarding(user) &&
    !isAccountOnboardingPath(location.pathname)
  ) {
    return <Navigate to={ACCOUNT_ONBOARDING_PATH} replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const currentRole = String(user?.role || "").toUpperCase();
    if (!allowedRoles.includes(currentRole)) {
      return <Navigate to="/" replace />;
    }
  }

  if (
    allowFreelancerOnboardingOnly &&
    !canAccessDashboard(user, FREELANCER_DASHBOARD)
  ) {
    return <Navigate to="/" replace />;
  }

  if (
    allowFreelancerOnboardingOnly &&
    !requiresFreelancerOnboarding(user)
  ) {
    return <Navigate to={FREELANCER_DASHBOARD_PATH} replace />;
  }

  if (
    requireFreelancerOnboardingComplete &&
    requiresFreelancerOnboarding(user)
  ) {
    return <Navigate to={FREELANCER_DASHBOARD_PATH} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  loginPath: PropTypes.string,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  allowFreelancerOnboardingOnly: PropTypes.bool,
  requireFreelancerOnboardingComplete: PropTypes.bool,
};

export default ProtectedRoute;
