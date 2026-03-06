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

const AuthButtons = ({ visible, isHome, isDark, isAuthenticated, dashboardPath }) => {
  const forceWhite = isHome && isDark && !visible;

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <NavbarButton
          as={Link}
          to={dashboardPath}
          className={cn(
            forceWhite ? "text-white border-white/20 hover:bg-white/10" : ""
          )}
        >
          Dashboard
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
              className="w-full mt-4"
              onClick={closeMobileMenu}
            >
              Dashboard
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
