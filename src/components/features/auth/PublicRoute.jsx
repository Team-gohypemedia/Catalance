import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import { resolveWorkspaceHomePath } from "@/shared/lib/dashboard-preference";
import Loader from "@/components/common/Loader";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isCheckingAuth, user } = useAuth();

  if (isCheckingAuth) {
    return <Loader />;
  }

  if (isAuthenticated && user) {
    const workspacePath = resolveWorkspaceHomePath(user);
    return <Navigate to={workspacePath} replace />;
  }

  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PublicRoute;
