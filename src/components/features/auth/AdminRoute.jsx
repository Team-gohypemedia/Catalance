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

  // Role-based verification
  const roles = Array.isArray(user?.roles) ? user.roles.map((r) => String(r).toUpperCase()) : [];
  const isSeoUser = roles.includes("SEO_TEAM") || roles.includes("BLOG_AUTHOR");

  // If user has no admin or SEO role, redirect away
  if (user?.role !== "ADMIN" && !isSeoUser) {
    return <Navigate to={resolveWorkspaceHomePath(user)} replace />;
  }

  // SEO users are restricted only to the Blog CMS & SEO Studio (/admin/blogs)
  if (isSeoUser && location.pathname !== "/admin/blogs") {
    return <Navigate to="/admin/blogs" replace />;
  }

  return children;
};

export default AdminRoute;

