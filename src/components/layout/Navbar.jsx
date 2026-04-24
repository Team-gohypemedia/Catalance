"use client";

import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Menu from "lucide-react/dist/esm/icons/menu";
import X from "lucide-react/dist/esm/icons/x";
import { cn } from "@/shared/lib/utils";
import {
  Navbar as ResizableNavbar,
  NavBody,
  NavItems,
  NavbarLogo,
  NavbarButton,
} from "@/components/ui/resizable-navbar-fixed";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import WorkspaceProfileDropdown from "@/components/layout/WorkspaceProfileDropdown";
import WorkspaceMobileSidebar from "@/components/layout/WorkspaceMobileSidebar";
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

const buildMobileMarketingNavItems = ({
  isFreelancer = false,
  hideServiceTab = false,
} = {}) => [
  { label: "Home", key: "home", to: "/" },
  {
    label: isFreelancer ? "Opportunity" : "Marketplace",
    key: "marketplace",
    to: isFreelancer ? "/opportunity" : "/marketplace",
  },
  ...(!isFreelancer && !hideServiceTab
    ? [{ label: "Services", key: "service", to: "/service" }]
    : []),
  { label: "Contact", key: "contact", to: "/contact" },
];

const clientWorkspaceNavItems = [
  { label: "Dashboard", key: "dashboard", to: "/client" },
  { label: "Proposals", key: "proposals", to: "/client/proposal" },
  { label: "Projects", key: "projects", to: "/client/project" },
  { label: "Messages", key: "messages", to: "/client/messages" },
  { label: "Payments", key: "payments", to: "/client/payments" },
  { label: "Profile", key: "profile", to: "/client/profile" },
];

const freelancerWorkspaceNavItems = [
  { label: "Dashboard", key: "dashboard", to: "/freelancer" },
  { label: "Proposals", key: "proposals", to: "/freelancer/proposals" },
  { label: "Projects", key: "projects", to: "/freelancer/project" },
  { label: "Messages", key: "messages", to: "/freelancer/messages" },
  { label: "Payments", key: "payments", to: "/freelancer/payments" },
  { label: "Profile", key: "profile", to: "/freelancer/profile" },
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
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { user, token, isAuthenticated, authLoading, logout } = useAuth();
  const {
    currentDashboard,
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
  const mobileMarketingNavItems = useMemo(
    () =>
      buildMobileMarketingNavItems({
        isFreelancer: isFreelancerUser,
        hideServiceTab,
      }),
    [hideServiceTab, isFreelancerUser],
  );
  const activeDashboard =
    currentDashboard === "freelancer" ? "freelancer" : "client";
  const displayName = getDisplayName(user);
  const workspaceNavItems =
    activeDashboard === "freelancer"
      ? freelancerWorkspaceNavItems
      : clientWorkspaceNavItems;

  const closeMobileMenu = () => {};
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

      {shouldShowAuthenticatedNav ? (
        <WorkspaceMobileSidebar
          currentDashboard={activeDashboard}
          displayName={displayName}
          profile={{
            avatar: user?.avatar || "",
            email: user?.email || "",
            isVerified: Boolean(user?.isVerified || user?.freelancerProfile?.isVerified),
            openToWork:
              typeof user?.freelancerProfile?.openToWork === "boolean"
                ? user.freelancerProfile.openToWork
                : typeof user?.openToWork === "boolean"
                  ? user.openToWork
                  : undefined,
          }}
          profileInitial={getInitials(displayName)}
          profileTo={profilePath}
          activeMarketingKey={null}
          activeWorkspaceKey="dashboard"
          marketingNavItems={mobileMarketingNavItems}
          workspaceNavItems={workspaceNavItems}
          onLogout={logout}
        />
      ) : (
        <PublicMobileSidebar navItems={navItems} />
      )}
    </ResizableNavbar>
  );
};

const PublicMobileSidebar = ({ navItems }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full px-4 py-2 lg:hidden">
      <div className="flex w-full items-center justify-between gap-3">
        <Link to="/" onClick={() => setOpen(false)}>
          <NavbarLogo />
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open navigation menu"
              className="inline-flex size-10 items-center justify-center rounded-full text-white transition-colors hover:text-muted-foreground"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>

          <SheetContent
            side="right"
            showCloseButton={false}
            className="w-[min(92vw,23rem)] border-l border-border bg-background p-0 text-white shadow-[0_36px_120px_-48px_rgba(0,0,0,1)] sm:max-w-[23rem]"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation menu</SheetTitle>
              <SheetDescription>Open site navigation links.</SheetDescription>
            </SheetHeader>

            <div className="flex items-center justify-between px-4.5 py-2.5">
              <SheetClose asChild>
                <Link to="/">
                  <NavbarLogo />
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                >
                  <X className="size-4.5" />
                </button>
              </SheetClose>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-4.5 pb-4 pt-3">
              <nav className="space-y-1.5">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.link}>
                    <Link
                      to={item.link}
                      className="flex min-h-10 w-full items-center justify-center rounded-[15px] border border-white/[0.05] bg-white/[0.03] px-3 py-1.5 text-[0.9rem] font-medium text-muted-foreground transition-colors hover:border-white/[0.08] hover:bg-white/[0.05] hover:text-foreground"
                    >
                      {item.name}
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-auto space-y-2 pt-6">
                <SheetClose asChild>
                  <Link
                    to="/login"
                    className="flex min-h-10 w-full items-center justify-center rounded-[15px] border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[0.9rem] font-semibold text-foreground transition-colors hover:bg-white/[0.06]"
                  >
                    Log In
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/get-started"
                    className="flex min-h-10 w-full items-center justify-center rounded-[15px] bg-primary px-3 py-1.5 text-[0.9rem] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Sign Up
                  </Link>
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default Navbar;
