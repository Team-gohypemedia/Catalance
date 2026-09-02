import PropTypes from "prop-types";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import {
  ACCOUNT_ONBOARDING_PATH,
  requiresAccountOnboarding,
  resolveWorkspaceHomePath,
} from "@/shared/lib/dashboard-preference";
import Loader from "@/components/common/Loader";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isCheckingAuth, user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (isCheckingAuth) {
    return <Loader />;
  }

  if (isAuthenticated && user) {
    if (requiresAccountOnboarding(user)) {
      return <Navigate to={ACCOUNT_ONBOARDING_PATH} replace />;
    }

    const redirectParam = searchParams.get("redirect");
    const openMessageParam = searchParams.get("openMessage");
    const openReviewParam = searchParams.get("openReview");

    let targetPath = null;
    if (redirectParam) {
      targetPath = redirectParam;
      if (openMessageParam && !targetPath.includes("openMessage=")) {
        const sep = targetPath.includes("?") ? "&" : "?";
        targetPath = `${targetPath}${sep}openMessage=${openMessageParam}`;
      }
      if (openReviewParam && !targetPath.includes("openReview=")) {
        const sep = targetPath.includes("?") ? "&" : "?";
        targetPath = `${targetPath}${sep}openReview=${openReviewParam}`;
      }
    } else if (location.state?.redirectTo) {
      targetPath = location.state.redirectTo;
    }

    const finalDestination = targetPath || resolveWorkspaceHomePath(user);
    return <Navigate to={finalDestination} replace />;
  }

  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PublicRoute;
