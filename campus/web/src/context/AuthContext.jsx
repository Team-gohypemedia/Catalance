import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, tokenStore } from "@/lib/api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (tokenStore.get() ? "loading" : "guest")); // loading | authed | guest

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;
    let cancelled = false;
    api
      .get("/api/auth/me")
      .then(({ user }) => {
        if (cancelled || tokenStore.get() !== token) return;
        setUser(user);
        setStatus("authed");
      })
      .catch(() => {
        // a newer session may have been adopted (/sso) while this check was in flight
        if (cancelled || tokenStore.get() !== token) return;
        tokenStore.clear();
        setStatus("guest");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startSession = useCallback(
    ({ user, token }) => {
      tokenStore.set(token);
      queryClient.clear();
      setUser(user);
      setStatus("authed");
      return user;
    },
    [queryClient],
  );

  const login = useCallback((email, password) => api.post("/api/auth/login", { email, password }).then(startSession), [startSession]);
  const signup = useCallback((payload) => api.post("/api/auth/signup", payload).then(startSession), [startSession]);

  /** Use a Catalance access token (handed over via /sso) as the Campus session. */
  const adoptToken = useCallback(
    async (token) => {
      tokenStore.set(token);
      try {
        const { user } = await api.get("/api/auth/me");
        return startSession({ user, token });
      } catch (err) {
        if (tokenStore.get() === token) tokenStore.clear();
        setStatus("guest");
        throw err;
      }
    },
    [startSession],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    queryClient.clear();
    setUser(null);
    setStatus("guest");
  }, [queryClient]);

  /** Re-fetch the current user (e.g. after earning points). */
  const refreshUser = useCallback(async () => {
    const { user } = await api.get("/api/auth/me");
    setUser(user);
    return user;
  }, []);

  const value = useMemo(
    () => ({ user, status, isAuthed: status === "authed", login, signup, adoptToken, logout, setUser, refreshUser }),
    [user, status, login, signup, adoptToken, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
