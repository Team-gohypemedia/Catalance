import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, ArrowUpRight, LayoutDashboard, Menu, Moon, ShieldCheck, Sun, X } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { CATALANCE_URL, cn } from "@/lib/utils";
import { usePlatformConfig } from "@/lib/platform";

// spec §4.1 public pages. `flag` items hide while that platform feature flag is off.
const NAV = [
  { to: "/tracks", label: "Courses" },
  { to: "/skills", label: "Skills" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/for-companies", label: "For businesses" },
];
const MOBILE_EXTRA = [
  { to: "/aspirants", label: "Govt exam prep", flag: "aspirants" },
  { to: "/for-colleges", label: "For colleges" },
  { to: "/faqs", label: "FAQs" },
  { to: "/contact", label: "Contact" },
  { to: "/about", label: "About" },
];

function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={cn("flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary-soft text-primary transition-colors hover:bg-primary hover:text-primary-fg", className)}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

function dashboardPath(user) {
  if (!user) return "/app";
  if (user.role === "ADMIN") return "/admin";
  if (user.role === "STUDENT" && !user.onboarded) return "/onboarding";
  return "/app";
}

function Navbar() {
  const { isAuthed, user, status } = useAuth();
  const { flags } = usePlatformConfig();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  const authButtons =
    status === "loading" ? (
      <div className="h-9 w-28" aria-hidden="true" />
    ) : isAuthed ? (
      <Link to={dashboardPath(user)} className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover">
        <LayoutDashboard className="size-4" /> Dashboard
      </Link>
    ) : (
      <>
        <Link to="/login" className="inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-fg transition-colors hover:text-primary">
          Log in
        </Link>
        <Link to="/signup" className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover">
          Sign up
        </Link>
      </>
    );

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 rounded-full border border-line bg-surface/90 pr-2 pl-3 shadow-sm backdrop-blur-xl sm:h-16 sm:pr-3 sm:pl-5">
        <Logo className="min-w-0" />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn("rounded-full px-3.5 py-2 text-sm font-medium transition-colors", isActive ? "bg-primary text-primary-fg" : "text-fg hover:text-primary")
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-1 sm:flex">{authButtons}</div>
          <SheetPrimitive.Root open={open} onOpenChange={setOpen}>
            <SheetPrimitive.Trigger asChild>
              <button type="button" aria-label="Open menu" className="flex size-9 cursor-pointer items-center justify-center rounded-full text-fg hover:bg-surface-2 lg:hidden">
                <Menu className="size-5" />
              </button>
            </SheetPrimitive.Trigger>
            <SheetPrimitive.Portal>
              <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
              <SheetPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(90vw,360px)] flex-col border-l border-line bg-bg shadow-lg focus:outline-none" aria-describedby={undefined}>
                <div className="flex h-16 items-center justify-between px-5">
                  <SheetPrimitive.Title className="sr-only">Menu</SheetPrimitive.Title>
                  <Logo />
                  <SheetPrimitive.Close className="flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-surface-2" aria-label="Close menu">
                    <X className="size-5" />
                  </SheetPrimitive.Close>
                </div>
                <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
                  <ul className="space-y-1">
                    {[...NAV, ...MOBILE_EXTRA].filter((n) => !n.flag || flags[n.flag]).map((n) => (
                      <li key={n.to}>
                        <NavLink
                          to={n.to}
                          className={({ isActive }) =>
                            cn("flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors", isActive ? "bg-primary text-primary-fg" : "text-fg hover:bg-surface-2")
                          }
                        >
                          {n.label}
                          <ArrowRight className="size-4 opacity-50" />
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="grid gap-2 border-t border-line p-4">
                  {isAuthed ? (
                    <Button to={dashboardPath(user)} size="lg" leftIcon={LayoutDashboard}>
                      Go to dashboard
                    </Button>
                  ) : (
                    <>
                      <Button to="/signup" size="lg">
                        Sign up
                      </Button>
                      <Button to="/login" variant="brandOutline" size="lg">
                        Log in
                      </Button>
                    </>
                  )}
                </div>
              </SheetPrimitive.Content>
            </SheetPrimitive.Portal>
          </SheetPrimitive.Root>
        </div>
      </div>
    </header>
  );
}

const FOOTER_COLS = [
  {
    title: "Learn",
    links: [
      { to: "/tracks", label: "All courses" },
      { to: "/skills", label: "Skills" },
      { to: "/tracks/accounting-tally-gst", label: "Tally & GST" },
      { to: "/tracks/digital-marketing", label: "Digital Marketing" },
      { to: "/tracks/content-writing", label: "Content Writing" },
      { to: "/tracks/web-development", label: "Web Development" },
    ],
  },
  {
    title: "Campus",
    links: [
      { to: "/how-it-works", label: "How it works" },
      { to: "/pricing", label: "Pricing" },
      { to: "/faqs", label: "FAQs" },
      { to: "/contact", label: "Contact and support" },
      { to: "/aspirants", label: "For aspirants", flag: "aspirants" },
    ],
  },
  {
    title: "Partners",
    links: [
      { to: "/for-companies", label: "For businesses" },
      { to: "/for-colleges", label: "For colleges" },
      { to: "/about", label: "About us" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/legal/terms", label: "Terms" },
      { to: "/legal/privacy", label: "Privacy" },
      { to: "/legal/refund", label: "Refunds" },
      { to: "/legal/assessment", label: "Assessment policy" },
      { to: "/legal/project", label: "Project policy" },
    ],
  },
];

function VerifyLink() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) navigate(`/verify/${encodeURIComponent(code.trim())}`);
      }}
      className="mt-6 flex max-w-xs items-center gap-2"
    >
      <label htmlFor="footer-verify" className="sr-only">
        Verification code
      </label>
      <ShieldCheck className="size-4 shrink-0 text-muted" aria-hidden="true" />
      <input
        id="footer-verify"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Verify a certificate code"
        className="h-9 min-w-0 flex-1 border-b border-line bg-transparent text-sm outline-none placeholder:text-subtle focus:border-primary"
      />
      <button type="submit" aria-label="Verify certificate" className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-fg">
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}

function StayAhead() {
  const [email, setEmail] = useState("");
  return (
    <div className="flex flex-col gap-4 border-t border-line py-8 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xl font-medium tracking-tight">
        Stay ahead of the <em className="accent">curve</em>
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Enter a valid email.");
          setEmail("");
          toast.success("You're on the list. One useful email a month.");
        }}
        className="flex w-full gap-2 sm:w-auto"
      >
        <label htmlFor="footer-email" className="sr-only">
          Email
        </label>
        <input
          id="footer-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3.5 text-sm outline-none placeholder:text-subtle focus:border-primary sm:w-72"
        />
        <Button type="submit">Subscribe</Button>
      </form>
    </div>
  );
}

function Footer() {
  const { flags } = usePlatformConfig();
  return (
    <footer className="relative overflow-hidden border-t border-line bg-bg">
      <div className="container-campus relative z-10 pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">Learn a practical skill, prove it in a final assessment and get verified. Part of Catalance.</p>
            <VerifyLink />
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-sm font-semibold">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.filter((l) => !l.flag || flags[l.flag]).map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="text-sm text-muted transition-colors hover:text-primary">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14">
          <StayAhead />
        </div>
        <div className="flex flex-col gap-2 border-t border-line py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Catalance Campus. Made in India.</p>
          <a href={CATALANCE_URL} className="inline-flex items-center gap-1 font-medium text-fg hover:text-primary">
            A Catalance product <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </div>
      <p
        aria-hidden="true"
        className="pointer-events-none -mt-6 -mb-[0.2em] text-center text-[19vw] leading-none font-semibold tracking-tight text-fg/[0.04] select-none"
      >
        Campus
      </p>
    </footer>
  );
}

/** Marketing shell (floating navbar + light footer). */
export default function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
