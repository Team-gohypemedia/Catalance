import PropTypes from "prop-types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

import {
  clearSession,
  getSession,
  isSessionTokenExpired,
  persistSession,
} from "@/shared/lib/auth-storage";
import { API_BASE_URL } from "@/shared/lib/api-client";
import { migrateSavedProposalsToUser } from "@/shared/lib/client-proposal-storage";
import { rememberDashboardFromPath } from "@/shared/lib/dashboard-preference";

const AuthContext = createContext(null);
AuthContext.displayName = "AuthContext";

const VERIFY_TIMEOUT_MS = 10000;
const PROTECTED_PATH_PREFIXES = [
  "/client",
  "/freelancer",
  "/dashboard",
  "/admin",
];
const isAbsoluteUrl = (value = "") => /^https?:\/\//i.test(value);

const resolveRequestUrl = (target) => {
  if (!target) {
    throw new Error("authFetch requires a request URL.");
  }

  if (isAbsoluteUrl(target)) {
    return target;
  }

  if (!API_BASE_URL) {
    throw new Error(
      "API_BASE_URL is not configured. Provide a full URL or set VITE_API_BASE_URL."
    );
  }

  const normalizedBase = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  const normalizedPath = target.startsWith("/") ? target : `/${target}`;

  return `${normalizedBase}${normalizedPath}`;
};

const PROFILE_ENDPOINT = resolveRequestUrl("/auth/profile");
// FORCE LOCAL FOR DEBUGGING
// const PROFILE_ENDPOINT = "http://localhost:5000/api/auth/profile";

const sessionFromStorage = () => {
  const session = getSession();
  return {
    user: session?.user ?? null,
    token: session?.accessToken ?? null,
    hasStoredSession: Boolean(session?.user && session?.accessToken),
  };
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialSession = useMemo(sessionFromStorage, []);
  const hasBootstrappedRef = useRef(false);

  const [user, setUser] = useState(initialSession.user);
  const [token, setToken] = useState(initialSession.token);
  const [isCheckingAuth, setIsCheckingAuth] = useState(
    initialSession.hasStoredSession
  );

  const syncSession = useCallback((nextSession) => {
    if (nextSession?.accessToken && nextSession?.user) {
      persistSession(nextSession);
      setToken(nextSession.accessToken);
      setUser(nextSession.user);
      setIsCheckingAuth(false);
      return;
    }

    clearSession();
    setToken(null);
    setUser(null);
    setIsCheckingAuth(false);
  }, []);

  const expireSession = useCallback(
    (options = {}) => {
      const {
        redirect = true,
        redirectTo = "/login",
        showToast = true,
      } = options || {};

      syncSession(null);

      if (showToast) {
        toast.error("Session expired. Please log in again.");
      }

      if (redirect) {
        navigate(redirectTo, { replace: true });
      }
    },
    [navigate, syncSession]
  );

  const logout = useCallback(
    (options = {}) => {
      const {
        redirect = true,
        redirectTo = "/login",
        showToast = true,
      } = options || {};

      syncSession(null);

      if (showToast) {
        toast.success("You have been logged out.");
      }

      if (redirect) {
        navigate(redirectTo, { replace: true });
      }
    },
    [navigate, syncSession]
  );

  const authFetch = useCallback(
    async (target, options = {}) => {
      if (!token) {
        expireSession({ showToast: false });
        throw new Error("No token found. Please log in again.");
      }

      const url = resolveRequestUrl(target);
      const {
        skipLogoutOn401 = false,
        suppressAbortLog = false,
        suppressToast = false,
        ...fetchOptions
      } = options;

      try {
        const defaultHeaders =
          fetchOptions.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" };

        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            ...defaultHeaders,
            Authorization: `Bearer ${token}`,
            ...(fetchOptions.headers || {}),
          },
        });

        if (response.status === 401) {
          if (!skipLogoutOn401) {
            expireSession({ showToast: !suppressToast });
          }
          const unauthorizedError = new Error("Unauthorized");
          unauthorizedError.code = 401;
          unauthorizedError.skipLogout = Boolean(skipLogoutOn401);
          throw unauthorizedError;
        }

        return response;
      } catch (error) {
        if (error.name === "AbortError") {
          if (!suppressAbortLog) {
            console.warn("Auth fetch aborted:", error.message || "timeout");
          }
          throw error;
        }

        if (error.code === 401 && error.skipLogout) {
          // Suppress toast/logout for caller-handled unauthorized cases.
          throw error;
        }
        if (error.code === 401) {
          throw error;
        }
        console.error("Auth fetch failed:", error);
        if (!suppressToast) {
          toast.error("Network error. Please try again.");
        }
        throw error;
      }
    },
    [expireSession, token]
  );

  const verifyUser = useCallback(async ({ useLoader = false } = {}) => {
    if (!token) {
      if (useLoader) {
        setIsCheckingAuth(false);
      }
      return null;
    }

    if (isSessionTokenExpired(token)) {
      syncSession(null);
      return null;
    }

    if (useLoader) {
      setIsCheckingAuth(true);
    }

    if (!PROFILE_ENDPOINT) {
      if (useLoader) {
        setIsCheckingAuth(false);
      }
      return user;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    try {
      const response = await authFetch(PROFILE_ENDPOINT, {
        signal: controller.signal,
        suppressAbortLog: true,
        suppressToast: true,
        skipLogoutOn401: true,
      });

      if (response.status === 404) {
        console.warn(
          "Profile endpoint returned 404. Skip verification until backend exposes /auth/profile."
        );
        return user;
      }

      if (response.status >= 500) {
        console.warn(
          "Profile endpoint returned a server error; skipping verification."
        );
        return user;
      }

      // If we got a 401 via skipLogoutOn401, response.status will be 401 (if authFetch returns response on error? No, authFetch throws)
      // Actually authFetch throws on 401 even with skipLogoutOn401, but sets throw error.skipLogout = true
      // So we won't reach here if it is 401.

      if (!response.ok) {
        console.warn(
          `Profile verification failed with status ${response.status}.`
        );
        return user;
      }

      const payload = await response.json().catch(() => null);
      const nextUser = payload?.data ?? payload ?? null;

      if (nextUser) {
        persistSession({ accessToken: token, user: nextUser });
        setUser(nextUser);
      }
      return nextUser ?? user;
    } catch (error) {
      if (error.name === "AbortError") {
        // Timeout is non-fatal; just skip refresh.
        return user;
      }

      if (error.code === 401 || error.message === "Unauthorized") {
        syncSession(null);
        return null;
      }

      if (error.message !== "Unauthorized") {
        console.error("User verification failed:", error);
      } else {
        syncSession(null);
        return null;
      }
      return user;
    } finally {
      clearTimeout(timeoutId);
      if (useLoader) {
        setIsCheckingAuth(false);
      }
    }
  }, [authFetch, syncSession, token, user]);

  useEffect(() => {
    if (hasBootstrappedRef.current) {
      return;
    }

    hasBootstrappedRef.current = true;
    void verifyUser({ useLoader: true });
  }, [verifyUser]);

  useEffect(() => {
    if (!user) {
      return;
    }

    rememberDashboardFromPath(user, location.pathname);
  }, [location.pathname, user]);

  // NOTE: Automatic proposal sync has been DISABLED.
  // Proposals are now stored locally in drafts and only sent when user
  // explicitly clicks "Send Proposal" from the dashboard.
  // This prevents proposals from being automatically created/sent.

  // The old sync code has been removed to prevent any automatic sending.
  // Users must manually send proposals from the Client Dashboard.

  const login = useCallback(
    (userData, authToken) => {
      if (!authToken || !userData) {
        toast.error("Invalid login payload received.");
        return;
      }

      syncSession({
        user: userData,
        accessToken: authToken,
      });
      migrateSavedProposalsToUser(userData.id);
    },
    [syncSession]
  );

  const authValue = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      authFetch,
      refreshUser: verifyUser,
      isAuthenticated: Boolean(user && token) && !isCheckingAuth,
      isLoading: isCheckingAuth,
      authLoading: isCheckingAuth,
      isCheckingAuth,
    }),
    [
      authFetch,
      isCheckingAuth,
      login,
      logout,
      token,
      user,
      verifyUser,
    ]
  );

  const shouldShowGlobalLoader =
    isCheckingAuth &&
    PROTECTED_PATH_PREFIXES.some((path) => location.pathname?.startsWith(path));

  return (
    <AuthContext.Provider value={authValue}>
      {shouldShowGlobalLoader ? (
        <div className="flex min-h-screen items-center justify-center">
          <span className="loading loading-spinner text-primary" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

