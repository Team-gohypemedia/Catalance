import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import {
  ACCOUNT_ONBOARDING_PATH,
  requiresAccountOnboarding,
  resolveWorkspaceHomePath,
} from "@/shared/lib/dashboard-preference";
import Loader from "@/components/common/Loader";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isCheckingAuth, user } = useAuth();

  if (isCheckingAuth) {
    return <Loader />;
  }

  if (isAuthenticated && user) {
    if (requiresAccountOnboarding(user)) {
      return <Navigate to={ACCOUNT_ONBOARDING_PATH} replace />;
    }

    const workspacePath = resolveWorkspaceHomePath(user);
    return <Navigate to={workspacePath} replace />;
  }

  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PublicRoute;
