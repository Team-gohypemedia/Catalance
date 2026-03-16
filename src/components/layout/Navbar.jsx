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
  const { logout } = useAuth();
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
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-md transition duration-200 hover:bg-white/10 hover:shadow-lg"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">
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
            "h-3.5 w-3.5 text-white/40 transition-transform duration-200",
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
          className="absolute right-0 top-full mt-2 w-58 origin-top-right rounded-2xl border border-white/10 bg-[#171717] p-1.5 shadow-2xl backdrop-blur-xl"
          style={{ zIndex: 99999 }}
        >
          {/* User info header */}
          <div className="flex items-center gap-3 border-b border-white/5 px-3 py-2.5 mb-0.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">
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
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              <p className="truncate text-[10px] text-white/40 leading-none">{user?.email}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="space-y-0.5">
            {/* Dashboard */}
            <Link
              to={dashboardPath}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 transition-all hover:bg-white/5 hover:text-white"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-white/40 group-hover:text-white/80">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </span>
              Dashboard
            </Link>

            {/* Client ↔ Freelancer Toggle */}
            <div className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/5 group transition-all">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-white/40 group-hover:text-white/80">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-medium text-white/70 group-hover:text-white/90">
                    {isFreelancer ? "Freelancer" : "Client"}
                  </p>
                  <p className="text-[10px] text-white/30 leading-none">Switch view</p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={handleToggle}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
                  "transition-colors duration-200 ease-in-out focus:outline-none",
                  isFreelancer ? "bg-yellow-400" : "bg-white/10"
                )}
                aria-label="Switch between Client and Freelancer"
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg",
                    "transform transition-transform duration-200 ease-in-out",
                    isFreelancer ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Divider */}
            <div className="my-1 border-t border-white/5" />

            {/* Profile */}
            <Link
              to={isFreelancer ? "/freelancer/profile" : "/client/profile"}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 transition-all hover:bg-white/5 hover:text-white"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-white/40 group-hover:text-white/80">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              Profile
            </Link>

            {/* Log Out */}
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-400/80 transition-all hover:bg-red-500/10 hover:text-red-400"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/10 text-red-500/60">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </span>
              Log Out
            </button>
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
                to={dashboardPath === "/freelancer" ? "/freelancer/profile" : "/client/profile"}
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
