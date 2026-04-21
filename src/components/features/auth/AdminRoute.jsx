import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import { getSession } from "@/shared/lib/auth-storage";
import { resolveWorkspaceHomePath } from "@/shared/lib/dashboard-preference";

const AdminRoute = ({ children }) => {
  const { user, token, isAuthenticated, isCheckingAuth } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }

  // Double-check: also verify localStorage session exists
  const storedSession = getSession();
  const hasValidSession = isAuthenticated && token && storedSession?.accessToken;

  // Redirect to admin login if not authenticated or no valid session
  if (!hasValidSession) {
    return <Navigate to="/admin/login" state={{ redirectTo: location.pathname }} replace />;
  }

  // Only admins can access admin routes
  if (user?.role !== "ADMIN") {
    return <Navigate to={resolveWorkspaceHomePath(user)} replace />;
  }

  return children;
};

export default AdminRoute;

