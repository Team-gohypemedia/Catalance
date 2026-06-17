import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login } from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Lock from "lucide-react/dist/esm/icons/lock";
import Mail from "lucide-react/dist/esm/icons/mail";
import BarChart2 from "lucide-react/dist/esm/icons/bar-chart-2";
import Users from "lucide-react/dist/esm/icons/users";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import catalanceLogo from "@/assets/logos/logo.svg";
import pmLoginDark from "@/assets/images/pm-login-dark.png";
import pmLoginLight from "@/assets/images/pm-login-light.png";

const initialFormState = {
    email: "",
    password: ""
};

function PMLogin({ className, ...props }) {
    const [formData, setFormData] = useState(initialFormState);
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login: setAuthSession } = useAuth();

    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

    useEffect(() => {
        document.documentElement.classList.add("onboarding-page");

        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        return () => {
            document.documentElement.classList.remove("onboarding-page");
            observer.disconnect();
        };
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");
        setIsSubmitting(true);

        try {
            const authPayload = await login({
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                role: "PROJECT_MANAGER",
            });

            const role = String(authPayload?.user?.role || "").toUpperCase();
            const roles = Array.isArray(authPayload?.user?.roles)
                ? authPayload.user.roles.map((entry) => String(entry || "").toUpperCase())
                : [];
            const hasPmAccess =
                role === "PROJECT_MANAGER" ||
                role === "ADMIN" ||
                roles.includes("PROJECT_MANAGER") ||
                roles.includes("ADMIN");

            if (!hasPmAccess) {
                throw new Error("Access Denied: This portal is for Project Managers only.");
            }

            setAuthSession(authPayload?.user, authPayload?.accessToken);
            toast.success("Welcome back, Manager.");
            setFormData(initialFormState);

            const redirectTo = location?.state?.redirectTo;
            if (redirectTo) {
                navigate(redirectTo, { replace: true });
            } else {
                navigate("/project-manager", { replace: true });
            }
        } catch (error) {
            const message = error?.message || "Unable to log in with those details.";
            setFormError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const features = [
        {
            icon: BarChart2,
            title: "Overview at a Glance",
            desc: "Get instant insights into projects, tasks and team performance.",
        },
        {
            icon: Users,
            title: "Team Collaboration",
            desc: "Communicate, assign tasks and keep your team aligned.",
        },
        {
            icon: CheckCircle2,
            title: "On Track, Always",
            desc: "Monitor timelines, milestones and deliver results on time.",
        },
    ];

    return (
        <div
            className={cn(
                "min-h-screen w-full flex flex-col relative overflow-hidden",
                isDark ? "bg-[#080808]" : "bg-[#FAF6F0]",
                className
            )}
            {...props}
        >
            {/* Animated gradient orbs */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-32 -left-32 size-[600px] rounded-full opacity-30 blur-[140px] animate-pulse"
                style={{ background: isDark ? "#F9D94918" : "#D9692A18", animationDuration: "6s" }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-32 -right-32 size-[500px] rounded-full opacity-20 blur-[120px] animate-pulse"
                style={{ background: isDark ? "#F9D94912" : "#D9692A12", animationDuration: "9s", animationDelay: "3s" }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] rounded-full opacity-[0.04] blur-[180px]"
                style={{ background: isDark ? "#F9D949" : "#D9692A" }}
            />

            {/* Dot-grid pattern */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: isDark
                        ? "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)"
                        : "radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                }}
            />

            {/* Logo bar */}
            <header className="relative z-10 flex items-center justify-between px-8 pt-7 pb-0">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
                        <img src={catalanceLogo} alt="" className="h-[18px] w-[18px] object-contain invert dark:invert-0" />
                    </div>
                    <span className={cn("text-[1.05rem] font-bold tracking-[-0.4px]", isDark ? "text-white" : "text-[#1C1B1F]")}>
                        Catalance
                    </span>
                </div>
                <div className={cn(
                    "hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold",
                    isDark ? "border-white/[0.08] bg-white/[0.03] text-white/40" : "border-black/[0.08] bg-black/[0.02] text-black/40"
                )}>
                    <ShieldCheck className="size-3 text-primary" />
                    Secure PM Portal
                </div>
            </header>

            {/* Main split layout */}
            <main className="relative z-10 flex flex-1 items-center justify-center gap-8 px-6 py-8 lg:py-6 lg:px-16 lg:gap-16 max-w-6xl mx-auto w-full">

                {/* ── Left panel (Desktop Only) ── */}
                <div className="hidden lg:flex flex-col justify-between flex-1 max-w-[440px] self-stretch pt-2 pb-4">

                    {/* Top: heading + features */}
                    <div>
                        {/* Brand mark */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-2xl border",
                                isDark
                                    ? "border-white/[0.08] bg-white/[0.04]"
                                    : "border-primary/20 bg-primary/8"
                            )}>
                                <ShieldCheck className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className={cn("text-[2rem] font-bold tracking-[-1.2px] leading-none", isDark ? "text-white" : "text-[#1C1B1F]")}>
                                    PM Portal
                                </h1>
                                <p className="text-primary font-semibold text-[10px] tracking-[0.12em] uppercase mt-1 opacity-80">
                                    Project Manager Portal
                                </p>
                            </div>
                        </div>

                        <p className={cn("mb-7 text-[0.9rem] leading-relaxed", isDark ? "text-white/45" : "text-black/50")}>
                            Access your projects, track progress, and deliver success with confidence.
                        </p>

                        {/* Features */}
                        <div className="space-y-4">
                            {features.map(({ icon: Icon, title, desc }, idx) => (
                                <div key={title} className="flex items-start gap-3.5 group">
                                    <div className={cn(
                                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
                                        isDark
                                            ? "bg-white/[0.06] text-white/70 group-hover:bg-primary/20 group-hover:text-primary"
                                            : "bg-primary/10 text-primary group-hover:bg-primary/15"
                                    )}>
                                        <Icon className="size-4.5" />
                                    </div>
                                    <div>
                                        <p className={cn("text-[0.85rem] font-semibold leading-snug", isDark ? "text-white/85" : "text-[#1C1B1F]")}>
                                            {title}
                                        </p>
                                        <p className={cn("text-[0.77rem] leading-relaxed mt-0.5", isDark ? "text-white/35" : "text-black/45")}>
                                            {desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom: illustration */}
                    <div className="mt-6 relative">
                        {/* Subtle glow under illustration */}
                        <div
                            aria-hidden
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-16 blur-2xl opacity-25 rounded-full"
                            style={{ background: isDark ? "#F9D949" : "#D9692A" }}
                        />
                        <img
                            src={isDark ? pmLoginDark : pmLoginLight}
                            alt="Project manager at work"
                            className="w-full max-w-[400px] h-auto object-contain select-none relative z-10 transition-all duration-700"
                            draggable={false}
                        />
                    </div>
                </div>

                {/* ── Right Card / Form ── */}
                <div className={cn(
                    "w-full max-w-[420px] rounded-3xl border p-7 shadow-2xl relative overflow-hidden",
                    isDark
                        ? "border-white/[0.07] bg-white/[0.03] backdrop-blur-2xl shadow-black/60"
                        : "border-black/[0.07] bg-white shadow-black/[0.08]"
                )}>

                    {/* Subtle card glow top */}
                    <div
                        aria-hidden
                        className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl opacity-20 rounded-full pointer-events-none"
                        style={{ background: isDark ? "#F9D949" : "#D9692A" }}
                    />

                    {/* Card header */}
                    <div className="flex flex-col items-center gap-2 text-center mb-6 relative z-10">
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center mb-1 shadow-lg",
                            isDark ? "bg-primary/15 shadow-primary/10" : "bg-primary/10 shadow-primary/10"
                        )}>
                            <ShieldCheck className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className={cn("text-[1.4rem] font-bold tracking-tight leading-tight", isDark ? "text-white" : "text-[#1C1B1F]")}>
                            Welcome Back!
                        </h2>
                        <p className={cn("text-xs font-medium", isDark ? "text-white/40" : "text-black/40")}>
                            Secure login for Project Managers
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate className="space-y-0 relative z-10">
                        <FieldGroup className="space-y-4">
                            {/* Email */}
                            <Field className="block space-y-1.5 text-left">
                                <FieldLabel
                                    htmlFor="loginEmail"
                                    className={cn("text-[11px] font-bold uppercase tracking-[0.1em]", isDark ? "text-white/45" : "text-black/45")}
                                >
                                    Email
                                </FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="loginEmail"
                                        name="email"
                                        type="email"
                                        placeholder="manager@example.com"
                                        autoComplete="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className={cn(
                                            "!h-11 rounded-xl border pr-11 text-[13px] transition-all duration-200",
                                            "focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/15",
                                            isDark
                                                ? "border-white/[0.09] bg-white/[0.04] text-white placeholder:text-white/30"
                                                : "border-black/[0.1] bg-black/[0.02] text-[#1C1B1F] placeholder:text-black/30"
                                        )}
                                    />
                                    <Mail className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-primary/50" />
                                </div>
                            </Field>

                            {/* Password */}
                            <Field className="block space-y-1.5 text-left">
                                <FieldLabel
                                    htmlFor="loginPassword"
                                    className={cn("text-[11px] font-bold uppercase tracking-[0.1em]", isDark ? "text-white/45" : "text-black/45")}
                                >
                                    Password
                                </FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="loginPassword"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className={cn(
                                            "!h-11 rounded-xl border pr-11 text-[13px] transition-all duration-200",
                                            "focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/15",
                                            isDark
                                                ? "border-white/[0.09] bg-white/[0.04] text-white placeholder:text-white/30"
                                                : "border-black/[0.1] bg-black/[0.02] text-[#1C1B1F] placeholder:text-black/30"
                                        )}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={cn(
                                            "absolute right-0 top-0 h-full px-3.5 flex items-center cursor-pointer select-none transition-colors",
                                            isDark ? "text-white/30 hover:text-white/60" : "text-black/30 hover:text-black/60"
                                        )}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </Field>

                            {/* Remember + Forgot */}
                            <div className="flex items-center justify-between text-[12px]">
                                <label className={cn("flex items-center gap-2 cursor-pointer select-none font-medium", isDark ? "text-white/55" : "text-black/55")}>
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="rounded border-black/15 dark:border-white/10 text-primary focus:ring-primary/20 accent-primary"
                                    />
                                    Remember me
                                </label>
                                <Link to="/forgot-password" className="text-primary hover:text-primary/80 font-semibold transition-colors hover:underline">
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Error */}
                            {formError && (
                                <FieldDescription
                                    className="text-red-400 text-xs text-center bg-red-400/10 rounded-xl py-2 px-3 border border-red-400/20"
                                    aria-live="polite"
                                >
                                    {formError}
                                </FieldDescription>
                            )}

                            {/* Submit CTA */}
                            <div className="pt-1">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="group flex w-full items-center justify-center gap-2.5 rounded-2xl h-[46px] text-[0.9rem] font-bold transition-all duration-200 keep-white bg-primary text-white shadow-xl shadow-primary/25 hover:brightness-110 hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin text-white keep-white" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="size-4 text-white keep-white" />
                                            Access Dashboard
                                            
                                        </>
                                    )}
                                </Button>
                            </div>
                        </FieldGroup>
                    </form>

                    {/* Security note */}
                    <div className={cn(
                        "mt-5 flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 relative z-10",
                        isDark ? "bg-white/[0.03] border border-white/[0.05]" : "bg-black/[0.025] border border-black/[0.06]"
                    )}>
                        <Lock className={cn("size-3.5", isDark ? "text-white/25" : "text-black/25")} />
                        <span className={cn("text-[0.68rem] font-semibold tracking-tight", isDark ? "text-white/25" : "text-black/30")}>
                            Restricted Access. Authorized Personnel Only.
                        </span>
                    </div>

                    {/* Register link */}
                    <div className={cn("mt-4 text-center text-[12px] font-medium relative z-10", isDark ? "text-white/35" : "text-black/40")}>
                        Need a PM account?{" "}
                        <Link to="/project-manager/register" className="text-primary hover:text-primary/80 font-bold transition-colors hover:underline">
                            Register here
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

PMLogin.propTypes = {
    className: PropTypes.string
};

export default PMLogin;
