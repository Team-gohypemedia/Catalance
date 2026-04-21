import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/shared/context/AuthContext";

const ProtectedRoute = ({
  children,
  loginPath = "/login",
  allowedRoles = null,
}) => {
  const { isAuthenticated, isCheckingAuth, user } = useAuth();

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

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const currentRole = String(user?.role || "").toUpperCase();
    if (!allowedRoles.includes(currentRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  loginPath: PropTypes.string,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

export default ProtectedRoute;
