import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/overlays";
import { ADMIN_NAV } from "./nav-config";
import { navItemVisible, usePlatformConfig } from "@/lib/platform";
import { DemoBanner } from "./AppLayout";

function AdminNav({ onNavigate }) {
  const { user } = useAuth();
  const { flags } = usePlatformConfig();
  return (
    <ul className="space-y-0.5">
      {ADMIN_NAV.filter((item) => navItemVisible(item, user, flags)).map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn("group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors", isActive ? "bg-primary-soft font-medium text-primary" : "text-muted hover:bg-surface-2 hover:text-fg")
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("size-[17px] shrink-0", isActive ? "text-primary" : "text-subtle group-hover:text-fg")} strokeWidth={1.75} /> {item.label}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col border-r border-line bg-surface">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <LogoMark className="size-8" />
        <div className="leading-none">
          <p className="text-[15px] font-medium tracking-tight">
            Campus <span className="font-accent text-[17px]">Admin</span>
          </p>
          <p className="mt-1 text-[11px] text-subtle">Control room</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <p className="mb-1.5 px-3 text-[11px] font-medium tracking-[0.08em] text-subtle uppercase">Manage</p>
        <AdminNav onNavigate={() => setOpen(false)} />
      </div>
      <div className="space-y-1 border-t border-line p-3">
        <NavLink to="/app" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg">
          <ArrowLeft className="size-4" strokeWidth={1.75} /> Back to Campus
        </NavLink>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar name={user?.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-subtle">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-bg">
      <DemoBanner />
      <div className="flex lg:bg-[linear-gradient(to_right,var(--surface)_0_239px,var(--line)_239px_240px,transparent_240px)]">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 lg:block">{sidebar}</aside>
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
              <motion.div
                className="absolute inset-y-0 left-0 w-[84vw] max-w-xs"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
                role="dialog"
                aria-label="Admin menu"
              >
                {sidebar}
                <button className="absolute top-3.5 right-3 flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-2" onClick={() => setOpen(false)} aria-label="Close menu">
                  <X className="size-5" strokeWidth={1.75} />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-bg/85 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
            <button className="-ml-1 flex size-9 items-center justify-center rounded-full hover:bg-surface-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="size-5" strokeWidth={1.75} />
            </button>
            <span className="text-[15px] font-medium tracking-tight lg:hidden">
              Campus <span className="font-accent text-[17px]">Admin</span>
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={toggleTheme} className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg" aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="size-[18px]" strokeWidth={1.75} /> : <Moon className="size-[18px]" strokeWidth={1.75} />}
              </button>
              <button onClick={() => { logout(); navigate("/"); }} className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-danger" aria-label="Log out">
                <LogOut className="size-[18px]" strokeWidth={1.75} />
              </button>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
