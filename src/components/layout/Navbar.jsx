"use client";

import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import {
  Navbar as ResizableNavbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarLogo,
  NavbarButton,
} from "@/components/ui/resizable-navbar-fixed";
import WorkspaceProfileDropdown from "@/components/layout/WorkspaceProfileDropdown";
import { useAuth } from "@/shared/context/AuthContext";
import { useDashboardSwitcher } from "@/shared/hooks/use-dashboard-switcher";

const buildNavItems = ({
  isFreelancer = false,
  hideServiceTab = false,
} = {}) => [
  { name: "Home", link: "/" },
  {
    name: isFreelancer ? "Opportunity" : "Marketplace",
    link: isFreelancer ? "/opportunity" : "/marketplace",
  },
  ...(!hideServiceTab ? [{ name: "Service", link: "/service" }] : []),
  { name: "Contact", link: "/contact" },
];

const isFreelancerSidePath = (pathname = "") => {
  const normalizedPath = String(pathname || "").trim().toLowerCase();
  return normalizedPath.startsWith("/freelancer") || normalizedPath === "/opportunity";
};

const getDisplayName = (user) =>
  user?.fullName || user?.name || user?.email?.split("@")[0] || "Profile";

const getInitials = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

/* ─── AuthButtons ────────────────────────────────────────────────────────── */
const AuthButtons = ({
  isHome,
  isDark,
  showAuthenticatedNav,
  currentDashboard,
  user,
}) => {
  const forceWhite = isHome && isDark; // `visible` prop is no longer used here

  if (showAuthenticatedNav) {
    const displayName = getDisplayName(user);

    return (
      <div className="flex items-center gap-2">
        <WorkspaceProfileDropdown
          currentDashboard={currentDashboard === "freelancer" ? "freelancer" : "client"}
          displayName={displayName}
          profile={{
            avatar: user?.avatar || "",
            email: user?.email || "",
            isVerified: Boolean(user?.isVerified || user?.freelancerProfile?.isVerified),
          }}
          profileInitial={getInitials(displayName)}
          showVerifiedBadge={currentDashboard === "freelancer"}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <NavbarButton
        as={Link}
        to="/login"
        variant="outline"
        className={cn(
          forceWhite ? "text-white border-white/20 hover:bg-white/10" : ""
        )}
      >
        Log In
      </NavbarButton>
      <NavbarButton as={Link} to="/get-started">
        Sign Up
      </NavbarButton>
    </div>
  );
};

/* ─── Navbar ─────────────────────────────────────────────────────────────── */
const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { user, token, isAuthenticated, authLoading, logout } = useAuth();
  const {
    currentDashboard,
    dashboardPath,
    profilePath,
  } = useDashboardSwitcher();
  const shouldShowAuthenticatedNav =
    isAuthenticated || (authLoading && Boolean(user && token));
  const isFreelancerUser = useMemo(
    () => shouldShowAuthenticatedNav && currentDashboard === "freelancer",
    [currentDashboard, shouldShowAuthenticatedNav],
  );
  const hideServiceTab = useMemo(
    () => isFreelancerSidePath(location.pathname),
    [location.pathname],
  );
  const navItems = useMemo(
    () => buildNavItems({ isFreelancer: isFreelancerUser, hideServiceTab }),
    [hideServiceTab, isFreelancerUser],
  );

  const toggleMobileMenu = () => setMobileOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileOpen(false);
  const isDark = true;

  return (
    <ResizableNavbar isHome={isHome} isDark={isDark}>
      {/* Desktop Navbar */}
      <NavBody>
        <NavbarLogo isHome={isHome} />
        <NavItems
          items={navItems}
          onItemClick={closeMobileMenu}
          isHome={isHome}
        />
        <div className="flex shrink-0 items-center gap-3">
          <AuthButtons
            isHome={isHome}
            isDark={isDark}
            showAuthenticatedNav={shouldShowAuthenticatedNav}
            currentDashboard={currentDashboard}
            user={user}
          />
        </div>
      </NavBody>

      {/* Mobile Navbar */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <MobileNavToggle isOpen={mobileOpen} onClick={toggleMobileMenu} />
        </MobileNavHeader>

        <MobileNavMenu isOpen={mobileOpen}>
          {navItems.map((item, idx) => (
            <Link
              key={`mobile-link-${idx}`}
              to={item.link}
              onClick={closeMobileMenu}
              className="w-full px-4 py-2 text-center text-lg text-white hover:bg-neutral-800 rounded"
            >
              {item.name}
            </Link>
          ))}
          {shouldShowAuthenticatedNav ? (
            <>
              <NavbarButton
                as={Link}
                to={profilePath}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 !text-black"
                onClick={closeMobileMenu}
              >
                Profile
              </NavbarButton>
              <NavbarButton
                as={Link}
                to={dashboardPath}
                className="inline-flex w-full items-center justify-center gap-2 !text-black"
                onClick={closeMobileMenu}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-yellow-400">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={getDisplayName(user)}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(getDisplayName(user))
                  )}
                </span>
                <span className="truncate text-black">{getDisplayName(user)}</span>
              </NavbarButton>
              <NavbarButton
                as="button"
                onClick={() => {
                  closeMobileMenu();
                  logout();
                }}
                className="inline-flex w-full items-center justify-center gap-2 !text-red-600 !bg-red-50 hover:!bg-red-100 mt-2"
              >
                Log Out
              </NavbarButton>
            </>
          ) : (
            <>
              <NavbarButton
                as={Link}
                to="/login"
                variant="outline"
                className="w-full mt-4"
              >
                Log In
              </NavbarButton>
              <NavbarButton as={Link} to="/get-started" className="w-full">
                Sign Up
              </NavbarButton>
            </>
          )}
        </MobileNavMenu>
      </MobileNav>
    </ResizableNavbar>
  );
};

export default Navbar;
