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
import { useAuth } from "@/shared/context/AuthContext";

const navItems = [
  { name: "Home", link: "/" },
  { name: "Marketplace", link: "/marketplace" },
  { name: "Service", link: "/service" },
  { name: "Contact", link: "/contact" },
];

const getDashboardPath = (role) => {
  const normalizedRole = String(role || "").toUpperCase();
  if (normalizedRole === "ADMIN") return "/admin";
  if (normalizedRole === "PROJECT_MANAGER") return "/project-manager";
  if (normalizedRole === "FREELANCER") return "/freelancer";
  return "/client";
};

const getDisplayName = (user) =>
  user?.fullName || user?.name || user?.email?.split("@")[0] || "Profile";

const getInitials = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "P";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const AuthButtons = ({
  visible,
  isHome,
  isDark,
  isAuthenticated,
  dashboardPath,
  user,
}) => {
  const forceWhite = isHome && isDark && !visible;
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <NavbarButton
          as={Link}
          to={dashboardPath}
          className={cn(
            "inline-flex items-center gap-2 !text-black",
            forceWhite ? "border-white/20 hover:bg-white/10" : ""
          )}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-primary">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={displayName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </span>
          <span className="max-w-32 truncate text-black">{displayName}</span>
        </NavbarButton>
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

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { user, isAuthenticated } = useAuth();
  const dashboardPath = useMemo(() => getDashboardPath(user?.role), [user?.role]);

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
            isAuthenticated={isAuthenticated}
            dashboardPath={dashboardPath}
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
          {isAuthenticated ? (
            <NavbarButton
              as={Link}
              to={dashboardPath}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 !text-black"
              onClick={closeMobileMenu}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-primary">
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
