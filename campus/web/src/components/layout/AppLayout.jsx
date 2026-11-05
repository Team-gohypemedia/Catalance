import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronRight, Flame, LogOut, Menu, Moon, Search, Shield, Sun, User, Settings, Zap, X, Coins, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api, IS_DEMO } from "@/lib/api/client";
import { CATALANCE_URL, DIVISIONS, cn, formatCompact } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { Avatar, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Tooltip } from "@/components/ui/overlays";
import { DivisionBadge } from "@/components/ui/campus";
import { APP_NAV, MENTOR_NAV_ITEM, MOBILE_NAV } from "./nav-config";
import { isStaff, navItemVisible, staffHome, usePlatformConfig } from "@/lib/platform";

function SidebarNav({ onNavigate }) {
  const { user } = useAuth();
  const { flags } = usePlatformConfig();
  const allGroups = user?.role === "MENTOR" || user?.role === "ADMIN" ? [...APP_NAV, { label: "Mentor", items: [MENTOR_NAV_ITEM] }] : APP_NAV;
  const groups = allGroups
    .map((g) => ({ ...g, items: g.items.filter((item) => navItemVisible(item, user, flags)) }))
    .filter((g) => g.items.length);
  return (
    <nav className="flex flex-col gap-5" aria-label="Main">
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.label && <p className="mb-1.5 px-3 text-[11px] font-medium tracking-[0.08em] text-subtle uppercase">{group.label}</p>}
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive ? "bg-primary-soft font-medium text-primary" : "text-muted hover:bg-surface-2 hover:text-fg",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("size-[17px] shrink-0", isActive ? "text-primary" : "text-subtle group-hover:text-fg")} strokeWidth={1.75} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && <span className="rounded-full border border-line px-1.5 py-px text-[10px] font-medium text-muted">{item.badge}</span>}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SeasonCard({ onNavigate }) {
  const { user } = useAuth();
  if (!user) return null;
  const order = Object.keys(DIVISIONS);
  const cur = DIVISIONS[user.division] || DIVISIONS.BRONZE;
  const nextKey = order[order.indexOf(user.division) + 1];
  const next = nextKey ? DIVISIONS[nextKey] : null;
  const pct = next ? Math.min(100, Math.max(4, Math.round((((user.seasonPoints || 0) - cur.min) / (next.min - cur.min)) * 100))) : 100;
  return (
    <NavLink to="/app/leaderboard" onClick={onNavigate} className="group block rounded-xl border border-line bg-bg p-3.5 transition-colors hover:border-line-strong">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">Season rank</span>
        <DivisionBadge division={user.division} size="sm" />
      </div>
      <p className="mt-1.5 text-lg font-medium tracking-tight">
        {formatCompact(user.seasonPoints || 0)} <span className="text-sm font-normal text-muted">pts</span>
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 flex items-center justify-between text-[11px] text-subtle">
        {next ? `${formatCompact(next.min - (user.seasonPoints || 0))} pts to ${next.label}` : "Top division"}
        <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </p>
    </NavLink>
  );
}

function NotificationBell() {
  const { data = [] } = useQuery({ queryKey: ["notifications"], queryFn: () => api.get("/api/notifications"), staleTime: 30_000, retry: false });
  const unread = Array.isArray(data) ? data.filter((n) => !n.read).length : 0;
  return (
    <Tooltip content="Notifications">
      <NavLink
        to="/app/notifications"
        className="relative flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="size-[18px]" strokeWidth={1.75} />
        {unread > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-bg" />}
      </NavLink>
    </Tooltip>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ml-1 cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]" aria-label="Account menu">
        <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-medium text-fg">{user?.name}</p>
          <p className="truncate">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/app/profile")}><User className="size-4" /> Profile</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate(`/u/${user?.username}`)}><Zap className="size-4" /> Public passport</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/app/settings")}><Settings className="size-4" /> Settings</DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); toggleTheme(); }}>
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />} {theme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        {isStaff(user) && <DropdownMenuItem onSelect={() => navigate(staffHome(user))}><Shield className="size-4" /> {user.role === "ADMIN" ? "Admin panel" : "Staff console"}</DropdownMenuItem>}
        <DropdownMenuItem onSelect={() => { window.location.href = CATALANCE_URL; }}><ExternalLink className="size-4" /> Go to Catalance</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { logout(); navigate("/"); }} className="text-danger [&_svg]:text-danger"><LogOut className="size-4" /> Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DemoBanner() {
  if (!IS_DEMO) return null;
  return (
    <div className="flex items-center justify-center gap-2 border-b border-line bg-surface-2 px-4 py-1 text-center text-[11px] text-muted">
      <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
      Demo mode. Data is saved in this browser only.
    </div>
  );
}

function Chip({ icon: Icon, children, label }) {
  return (
    <Tooltip content={label}>
      <span className="hidden h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-medium text-fg tabular-nums sm:inline-flex">
        <Icon className="size-3.5 text-primary" strokeWidth={2} />
        {children}
      </span>
    </Tooltip>
  );
}

export default function AppLayout() {
  const { user } = useAuth();
  // spec §2: XP, coins, streaks and divisions are part of gamification, hidden unless the flag is on
  const { flags } = usePlatformConfig();
  const gamified = flags.gamification;
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // lesson player & tutor use the full height without the page padding
  const immersive = /\/app\/courses\/[^/]+\/learn\//.test(location.pathname);

  return (
    <div className="min-h-dvh bg-bg">
      <DemoBanner />
      <div className="flex lg:bg-[linear-gradient(to_right,var(--surface)_0_255px,var(--line)_255px_256px,transparent_256px)]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
          <div className="flex h-16 items-center px-5">
            <Logo to="/app" />
          </div>
          <div className="scrollbar-none flex-1 overflow-y-auto px-3 pt-2 pb-4">
            <SidebarNav />
          </div>
          {gamified && (
            <div className="border-t border-line p-3">
              <SeasonCard />
            </div>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-bg/85 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
            <button className="-ml-1 flex size-9 items-center justify-center rounded-full text-fg hover:bg-surface-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="size-5" strokeWidth={1.75} />
            </button>
            <div className="lg:hidden">
              <Logo to="/app" compact />
            </div>
            <form
              className="ml-auto hidden max-w-sm flex-1 md:block lg:ml-0"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get("q");
                navigate(`/app/catalog${q ? `?q=${encodeURIComponent(q)}` : ""}`);
              }}
            >
              <label className="relative block">
                <span className="sr-only">Search</span>
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} />
                <input
                  name="q"
                  placeholder="Search courses, skills, mentors"
                  className="h-9 w-full rounded-full border border-line bg-surface pr-4 pl-10 text-sm placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-4 focus:ring-[var(--ring)]"
                />
              </label>
            </form>
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {gamified && <Chip icon={Flame} label={`${user?.streak ?? 0}-day streak`}>{user?.streak ?? 0}</Chip>}
              {gamified && <Chip icon={Coins} label="Campus coins">{formatCompact(user?.coins ?? 0)}</Chip>}
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          <main className={cn("flex-1 pb-24 lg:pb-12", immersive ? "" : "px-4 pt-6 sm:px-6 sm:pt-10 lg:px-10")}>
            <div className={cn(!immersive && "mx-auto w-full max-w-6xl")}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Quick">
        <ul className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={({ isActive }) => cn("relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-medium transition-colors", isActive ? "text-primary" : "text-subtle hover:text-fg")}>
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" aria-hidden="true" />}
                    <item.icon className="size-5" strokeWidth={1.75} />
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[84vw] max-w-xs flex-col border-r border-line bg-surface lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
              role="dialog"
              aria-label="Menu"
            >
              <div className="flex h-16 items-center justify-between px-5">
                <Logo to="/app" />
                <button onClick={() => setMobileOpen(false)} className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-2" aria-label="Close menu">
                  <X className="size-5" strokeWidth={1.75} />
                </button>
              </div>
              {gamified && <div className="flex gap-2 px-5 pb-4">
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] font-medium"><Flame className="size-3.5 text-primary" /> {user?.streak ?? 0} days</span>
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] font-medium"><Coins className="size-3.5 text-primary" /> {formatCompact(user?.coins ?? 0)}</span>
              </div>}
              <div className="flex-1 overflow-y-auto px-3 pb-4">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
              {gamified && (
                <div className="border-t border-line p-3">
                  <SeasonCard onNavigate={() => setMobileOpen(false)} />
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
