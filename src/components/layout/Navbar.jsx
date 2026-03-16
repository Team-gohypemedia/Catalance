"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

/* ─── Dropdown Popup ─────────────────────────────────────────────────────── */
const UserDropdown = ({ user, dashboardPath }) => {
  const [open, setOpen] = useState(false);
  const [isFreelancer, setIsFreelancer] = useState(
    dashboardPath === "/freelancer"
  );
  const ref = useRef(null);
  const navigate = useNavigate();
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  // Sync toggle with actual role whenever dashboardPath changes
  useEffect(() => {
    setIsFreelancer(dashboardPath === "/freelancer");
  }, [dashboardPath]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    const next = !isFreelancer;
    setIsFreelancer(next);
    navigate(next ? "/freelancer" : "/client");
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref} style={{ zIndex: 9999 }}>
      {/* Trigger — plain button, NOT NavbarButton, to avoid cloneElement interference */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-bold text-black transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-yellow-400">
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
        <span className="max-w-[8rem] truncate">{displayName}</span>
        {/* Chevron */}
        <svg
          className={cn(
            "h-3.5 w-3.5 text-gray-400 transition-transform duration-200",
            open ? "rotate-180" : ""
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-gray-100 bg-white shadow-2xl"
          style={{ zIndex: 99999 }}
        >
          {/* User info header */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-yellow-400">
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
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="truncate text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            {/* Profile */}
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              Profile
            </Link>

            {/* Dashboard */}
            <Link
              to={dashboardPath}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </span>
              Dashboard
            </Link>

            {/* Divider */}
            <div className="my-1.5 border-t border-gray-100" />

            {/* Client ↔ Freelancer Toggle */}
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {isFreelancer ? "Freelancer" : "Client"}
                  </p>
                  <p className="text-xs text-gray-400">Switch view</p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={handleToggle}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
                  "transition-colors duration-200 ease-in-out focus:outline-none",
                  isFreelancer ? "bg-black" : "bg-gray-300"
                )}
                aria-label="Switch between Client and Freelancer"
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md",
                    "transform transition-transform duration-200 ease-in-out",
                    isFreelancer ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── AuthButtons ────────────────────────────────────────────────────────── */
const AuthButtons = ({
  isHome,
  isDark,
  isAuthenticated,
  dashboardPath,
  user,
}) => {
  const forceWhite = isHome && isDark; // `visible` prop is no longer used here

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <UserDropdown user={user} dashboardPath={dashboardPath} />
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
            <>
              <NavbarButton
                as={Link}
                to="/profile"
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
