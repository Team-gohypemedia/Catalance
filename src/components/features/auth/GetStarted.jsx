import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Zap from "lucide-react/dist/esm/icons/zap";
import CircleHelp from "lucide-react/dist/esm/icons/circle-help";
import logoDark from "@/assets/logos/logo.svg";
import logoLight from "@/assets/logos/logo.svg";

/* ─── Feature bullet list ─────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Sparkles,
    title: "Personalized experience",
    desc: "Get recommended roles and content that match your goals.",
    colorLight: "bg-violet-100 text-violet-600",
    colorDark: "bg-violet-900/40 text-violet-400",
  },
  {
    icon: ShieldCheck,
    title: "Secure & private",
    desc: "Your information is encrypted and never shared.",
    colorLight: "bg-emerald-100 text-emerald-600",
    colorDark: "bg-emerald-900/40 text-emerald-400",
  },
  {
    icon: Zap,
    title: "Quick & easy",
    desc: "Takes less than 2 minutes to complete.",
    colorLight: "bg-amber-100 text-amber-600",
    colorDark: "bg-amber-900/40 text-amber-400",
  },
];

/* ─── Role card ───────────────────────────────────────────────────── */
function RoleCard({ id, label, sublabel, emoji, selected, onSelect, isDark }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={cn(
        "w-full flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200",
        selected
          ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
          : isDark
          ? "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
          : "border-black/[0.07] bg-white hover:border-primary/30 hover:bg-primary/5"
      )}
    >
      <span className="text-3xl leading-none select-none">{emoji}</span>
      <div className="min-w-0">
        <p
          className={cn(
            "font-semibold text-[0.95rem] leading-tight",
            selected
              ? "text-primary"
              : isDark
              ? "text-white"
              : "text-[#1C1B1F]"
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "text-[0.78rem] mt-0.5",
            isDark ? "text-white/50" : "text-black/50"
          )}
        >
          {sublabel}
        </p>
      </div>
      {/* Radio indicator */}
      <span
        className={cn(
          "ml-auto flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          selected
            ? "border-primary bg-primary"
            : isDark
            ? "border-white/20"
            : "border-black/20"
        )}
      >
        {selected && (
          <span className="size-2 rounded-full bg-white dark:bg-[#1C1B1F]" />
        )}
      </span>
    </button>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function GetStarted() {
  const [searchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();

  useEffect(() => {
    document.documentElement.classList.add("onboarding-page");
    return () => document.documentElement.classList.remove("onboarding-page");
  }, []);

  // Pre-select freelancer if coming from hero CTA
  useEffect(() => {
    if (searchParams.get("for") === "freelancer") setSelectedRole("FREELANCER");
  }, [searchParams]);

  const handleContinue = () => {
    if (!selectedRole) return;
    const role = selectedRole.toLowerCase();
    if (role === "client") {
      navigate("/service");
    } else {
      navigate(`/signup?role=${role}`);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen w-full flex flex-col relative overflow-hidden",
        isDark ? "bg-[#0A0A0A]" : "bg-[#FAF6F0]"
      )}
    >
      {/* ── Subtle dot-grid background ─────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: isDark
            ? "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)"
            : "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Decorative blobs ───────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 size-[500px] rounded-full opacity-20 blur-[120px]"
        style={{ background: isDark ? "#F9D94930" : "#D9692A30" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 size-[400px] rounded-full opacity-15 blur-[100px]"
        style={{ background: isDark ? "#F9D94925" : "#D9692A25" }}
      />

      {/* ── Logo bar ───────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center gap-2.5 px-8 pt-7 pb-0">
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-full",
            "bg-primary"
          )}
        >
          <img
            src={isDark ? logoDark : logoLight}
            alt=""
            className="h-[18px] w-[18px] object-contain invert dark:invert-0"
          />
        </div>
        <span
          className={cn(
            "text-[1.05rem] font-bold tracking-[-0.4px]",
            isDark ? "text-white" : "text-[#1C1B1F]"
          )}
        >
          Catalance
        </span>
      </header>

      {/* ── Main split layout ──────────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 items-center justify-center gap-12 px-6 py-12 lg:px-16 xl:gap-20">
        {/* ──── Left panel ─────────────────────────────────────────── */}
        <div className="hidden max-w-sm flex-1 lg:flex lg:flex-col">
          {/* Step badge */}
          <div
            className={cn(
              "mb-7 inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[0.75rem] font-medium",
              isDark
                ? "border-white/10 bg-white/[0.05] text-white/60"
                : "border-black/[0.08] bg-white/70 text-black/50"
            )}
          >
            <Sparkles className="size-3 text-primary" />
            Step 1 of 2
          </div>

          {/* Headline */}
          <h1
            className={cn(
              "mb-4 text-[2.6rem] font-bold leading-[1.15] tracking-[-1px]",
              isDark ? "text-white" : "text-[#1C1B1F]"
            )}
          >
            Join as a{" "}
            <span className="text-primary">Client</span>
            {" "}or{" "}
            <span className="text-primary">Freelancer</span>
            {" "}👋
          </h1>

          {/* Sub text */}
          <p
            className={cn(
              "mb-9 text-[0.95rem] leading-relaxed",
              isDark ? "text-white/50" : "text-black/50"
            )}
          >
            Let's get to know you better so we can personalize your experience.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, desc, colorLight, colorDark }) => (
              <div key={title} className="flex items-start gap-4">
                <div
                  className={cn(
                    "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl",
                    isDark ? colorDark : colorLight
                  )}
                >
                  <Icon className="size-4.5" />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-[0.88rem] font-semibold",
                      isDark ? "text-white" : "text-[#1C1B1F]"
                    )}
                  >
                    {title}
                  </p>
                  <p
                    className={cn(
                      "text-[0.8rem] leading-snug",
                      isDark ? "text-white/45" : "text-black/45"
                    )}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Help link */}
          <div className="mt-10 flex items-center gap-1.5">
            <CircleHelp
              className={cn("size-4", isDark ? "text-white/30" : "text-black/30")}
            />
            <span
              className={cn(
                "text-[0.8rem]",
                isDark ? "text-white/40" : "text-black/40"
              )}
            >
              Need help?
            </span>
            <Link
              to="/contact"
              className="text-[0.8rem] text-primary hover:underline font-medium"
            >
              Contact support
            </Link>
          </div>
        </div>

        {/* ──── Right card ─────────────────────────────────────────── */}
        <div
          className={cn(
            "w-full max-w-md rounded-3xl border p-8 shadow-2xl",
            isDark
              ? "border-white/[0.07] bg-white/[0.04] backdrop-blur-xl shadow-black/60"
              : "border-black/[0.06] bg-white shadow-black/[0.08]"
          )}
        >
          {/* Mobile headline (visible below lg) */}
          <div className="mb-7 lg:hidden">
            <div
              className={cn(
                "mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.75rem] font-medium",
                isDark
                  ? "border-white/10 bg-white/[0.05] text-white/60"
                  : "border-black/[0.08] bg-black/[0.04] text-black/50"
              )}
            >
              <Sparkles className="size-3 text-primary" />
              Step 1 of 2
            </div>
            <h1
              className={cn(
                "text-2xl font-bold tracking-[-0.5px]",
                isDark ? "text-white" : "text-[#1C1B1F]"
              )}
            >
              Join as a <span className="text-primary">Client</span> or{" "}
              <span className="text-primary">Freelancer</span>
            </h1>
          </div>

          {/* Card title */}
          <p
            className={cn(
              "mb-1.5 text-[1.15rem] font-bold tracking-[-0.3px]",
              isDark ? "text-white" : "text-[#1C1B1F]"
            )}
          >
            How will you use Catalance?
          </p>
          <p
            className={cn(
              "mb-6 text-[0.82rem]",
              isDark ? "text-white/45" : "text-black/45"
            )}
          >
            Choose your role to get started. You can always switch later.
          </p>

          {/* Role options */}
          <div className="space-y-3">
            <RoleCard
              id="CLIENT"
              label="I'm a Client"
              sublabel="Hiring for a project"
              emoji="💼"
              selected={selectedRole === "CLIENT"}
              onSelect={setSelectedRole}
              isDark={isDark}
            />
            <RoleCard
              id="FREELANCER"
              label="I'm a Freelancer"
              sublabel="Looking for work"
              emoji="💻"
              selected={selectedRole === "FREELANCER"}
              onSelect={setSelectedRole}
              isDark={isDark}
            />
          </div>

          {/* Divider */}
          <div
            className={cn(
              "my-6 h-px",
              isDark ? "bg-white/[0.06]" : "bg-black/[0.06]"
            )}
          />

          {/* CTA button */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedRole}
            className={cn(
              "group flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[0.95rem] font-bold transition-all duration-200",
              selectedRole
                ? "bg-primary text-white shadow-lg shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
                : isDark
                ? "cursor-not-allowed bg-white/[0.07] text-white/30"
                : "cursor-not-allowed bg-black/[0.05] text-black/25"
            )}
          >
            Continue
            <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Security note */}
          <p
            className={cn(
              "mt-4 text-center text-[0.72rem]",
              isDark ? "text-white/30" : "text-black/35"
            )}
          >
            🔒 Your information is secure and will never be shared.
          </p>

          {/* Login link */}
          <p
            className={cn(
              "mt-3 text-center text-[0.8rem]",
              isDark ? "text-white/40" : "text-black/40"
            )}
          >
            Already have an account?{" "}
            <Link
              to="/signin/phone"
              className="font-semibold text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
