import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api/client";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { isStaff, staffHome, usePlatformConfig } from "@/lib/platform";

export function FullPageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg">
      <LogoMark className="size-10 animate-pulse" />
    </div>
  );
}

/**
 * Gate for logged-in areas. Everything inside Campus (except marketing pages and /u/:username) needs login.
 * - not logged in → /login?next=…
 * - logged in but not onboarded → /onboarding
 * - roles=["ADMIN"] → others go to /app
 */
export function RequireAuth({ roles, allowUnonboarded = false }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === "loading") return <FullPageLoader />;
  if (status !== "authed") return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (!allowUnonboarded && !user.onboarded && user.role === "STUDENT") return <Navigate to="/onboarding" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={isStaff(user) && !location.pathname.startsWith(staffHome(user)) ? staffHome(user) : "/app"} replace />;
  return <Outlet />;
}

/** Login / signup pages: logged-in users skip straight to the app. */
export function GuestOnly() {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === "loading") return <FullPageLoader />;
  if (status === "authed") {
    // keep ?goal / ?track / ?college from signup links so onboarding can preselect them
    const dest = isStaff(user) ? staffHome(user) : user.onboarded || user.role !== "STUDENT" ? "/app" : `/onboarding${location.search}`;
    return <Navigate to={dest} replace />;
  }
  return <Outlet />;
}

/**
 * Feature-flag gate (spec §2: MVP leaves some areas off). When the flag is off the route shows "Not available",
 * matching the API's 404. Pages behind a flag that is on by default render straight away.
 *   <Route element={<RequireFlag flag="gigs" />}> … </Route>
 */
export function RequireFlag({ flag, children }) {
  const { flags } = usePlatformConfig();
  // same query as usePlatformConfig (deduped): wait for the real flags before saying "not available"
  const { isPending } = useQuery({ queryKey: ["platform-config"], queryFn: () => api.get("/api/platform/config"), staleTime: 60_000 });
  if (!flags[flag]) return isPending ? <FullPageLoader /> : <FeatureOff />;
  return children ?? <Outlet />;
}

function FeatureOff() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
      <p className="eyebrow">Not available</p>
      <h1 className="mt-3 text-2xl font-medium tracking-tight">This feature isn't available right now.</h1>
      <p className="mt-2 text-sm text-muted">It may be switched on later. Your courses, assessments and skills are all on Home.</p>
      <Button to="/app" className="mt-6">
        Go to Home
      </Button>
    </div>
  );
}
