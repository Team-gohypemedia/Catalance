/**
 * Auth building blocks: AuthShell (calm split layout), PasswordInput, DemoChips, postAuthPath.
 */
import { forwardRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, BookOpen, Briefcase, Eye, EyeOff, Lock } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Input } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/overlays";
import { IS_DEMO } from "@/lib/api/client";
import { isStaff, staffHome } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { QUOTES } from "@/components/marketing/data";

/** Where to go after login/signup. Honors a safe ?next= path. */
export function postAuthPath(user, next) {
  if (user?.role === "STUDENT" && !user.onboarded) return "/onboarding";
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  if (isStaff(user)) return staffHome(user);
  return "/app";
}

/** Light brand panel with one quiet, slowly rotating student quote. */
function QuotePanel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % QUOTES.length), 7000);
    return () => clearInterval(t);
  }, []);
  const q = QUOTES[i];
  return (
    <div className="flex flex-col items-center text-center">
      <LogoMark className="size-16" />
      <p className="mt-8 text-4xl leading-[1.1] font-medium tracking-tight xl:text-5xl">
        Learn. Get assessed. <em className="accent">Get verified.</em>
      </p>
      <p className="mt-4 max-w-sm text-lg text-muted">Practical skill courses with a real assessment at the end.</p>

      <div className="mt-12 min-h-[150px] w-full max-w-md" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.figure key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <blockquote className="text-lg leading-relaxed text-fg">“{q.quote}”</blockquote>
            <figcaption className="mt-5 flex items-center justify-center gap-3">
              <Avatar name={q.name} size="sm" />
              <span className="text-left">
                <span className="block text-sm font-medium">{q.name}</span>
                <span className="block text-xs text-muted">{q.meta}</span>
              </span>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
        {[
          [BookOpen, "Practical courses"],
          [BadgeCheck, "Skill verification"],
          [Briefcase, "Project eligibility"],
        ].map(([Icon, label]) => (
          <li key={label} className="flex items-center gap-2">
            <Icon className="size-4" strokeWidth={1.75} /> {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Calm auth layout: quiet brand panel left (desktop), form card right. */
export function AuthShell({ title, description, children, footer }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="mx-auto flex h-20 w-full max-w-7xl items-center px-4 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-line-strong">
          <ArrowLeft className="size-4" /> Back to home
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-16 px-4 pb-12 sm:px-8 lg:grid-cols-2">
        <aside className="hidden lg:block">
          <QuotePanel />
        </aside>

        <main className="mx-auto w-full max-w-[460px] py-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="mb-8 flex justify-center">
              <Logo />
            </div>
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-10">
              <h1 className="text-2xl leading-[1.15] font-medium tracking-tight sm:text-3xl">{title}</h1>
              {description && <p className="mt-2 text-[15px] text-muted">{description}</p>}
              <div className="mt-8">{children}</div>
            </div>
            {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
          </motion.div>
        </main>
      </div>

      <p className="pb-6 text-center text-xs text-subtle">
        © {new Date().getFullYear()} Catalance Campus ·{" "}
        <Link to="/about" className="hover:text-fg">
          A Catalance product
        </Link>
      </p>
    </div>
  );
}

export const PasswordInput = forwardRef(function PasswordInput({ className, ...props }, ref) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={show ? "text" : "password"} leftIcon={Lock} className={cn("pr-11", className)} {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});

const DEMO = [
  { label: "Student", email: "student@campus.dev" },
  { label: "Mentor", email: "mentor@campus.dev" },
  { label: "Admin", email: "admin@campus.dev" },
  { label: "Aspirant", email: "aspirant@campus.dev" },
  { label: "Evaluator", email: "evaluator@campus.dev" },
  { label: "PM", email: "pm@campus.dev" },
  { label: "Finance", email: "finance@campus.dev" },
];

/** One-click demo logins: a quiet row, only rendered in demo mode. */
export function DemoChips({ onPick, loadingEmail }) {
  if (!IS_DEMO) return null;
  return (
    <div className="pt-2">
      <div className="flex items-center gap-3 text-xs text-subtle">
        <span className="h-px flex-1 bg-line" />
        <span>Exploring the demo?</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {DEMO.map((d) => (
          <button
            key={d.email}
            type="button"
            disabled={!!loadingEmail}
            onClick={() => onPick(d.email, "campus123")}
            className="cursor-pointer rounded-full border border-line px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-fg disabled:opacity-50"
            aria-label={`Sign in as demo ${d.label.toLowerCase()}`}
          >
            {loadingEmail === d.email ? "Signing in…" : d.label}
          </button>
        ))}
      </div>
      <p className="mt-2.5 text-center text-[11px] text-subtle">Demo password: campus123</p>
    </div>
  );
}
