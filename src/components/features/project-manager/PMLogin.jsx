import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import catalanceLogo from "@/assets/logos/logo.svg";

const initialFormState = {
    email: "",
    password: ""
};

const AnimatedDeskIllustration = ({ isDark, gender }) => (
  <svg viewBox="0 0 500 240" className="w-full h-auto max-w-[440px] -ml-4 select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
    <style>
      {`
        @keyframes steam {
          0% { transform: translateY(0) scaleX(1); opacity: 0; }
          30% { opacity: 0.5; }
          100% { transform: translateY(-12px) scaleX(1.4); opacity: 0; }
        }
        @keyframes typing {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(0.5px) rotate(0.4deg); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 1px rgba(217, 105, 42, 0.4)); }
          50% { filter: drop-shadow(0 0 5px rgba(217, 105, 42, 0.8)); }
        }
        .steam-line {
          animation: steam 2.5s infinite linear;
          transform-origin: bottom center;
        }
        .steam-line-2 {
          animation: steam 2.5s infinite linear;
          animation-delay: 1.25s;
          transform-origin: bottom center;
        }
        .typing-arm {
          animation: typing 0.12s infinite ease-in-out;
          transform-origin: 100px 170px;
        }
        .bobbing-head-body {
          animation: bob 4s infinite ease-in-out;
        }
        .glowing-chart {
          animation: glow 3s infinite ease-in-out;
        }
      `}
    </style>

    {/* Skyline Buildings */}
    <path d="M0 200 V120 H40 V150 H90 V110 H130 V160 H180 V100 H220 V200 Z" fill={isDark ? "rgba(255,255,255,0.015)" : "#F5EFE6"} opacity="0.6" />
    <path d="M220 200 V130 H260 V110 H300 V150 H340 V120 H380 V200 Z" fill={isDark ? "rgba(255,255,255,0.01)" : "#F5EFE6"} opacity="0.4" />

    {/* Table Surface */}
    <path d="M -10 200 C 100 200, 220 205, 340 215 C 390 220, 440 228, 480 240 H -10 Z" fill={isDark ? "#2A1D15" : "#F1D2B9"} />

    {/* Plant */}
    <path d="M 16 180 H 26 L 24 200 H 18 Z" fill="#C5683C" />
    <path d="M 21 180 C 14 165, 9 175, 21 180 Z" fill="#5B8266" />
    <path d="M 21 180 C 28 165, 33 175, 21 180 Z" fill="#6A9977" />
    <path d="M 21 180 C 21 155, 24 175, 21 180 Z" fill="#5B8266" />

    {/* Mug with animated steam */}
    <rect x="360" y="180" width="16" height="20" rx="3" fill="#D9692A" />
    <path d="M 376 184 C 381 184, 383 187, 383 190 C 383 193, 381 196, 376 196" stroke="#D9692A" strokeWidth="2" />
    <path className="steam-line" d="M 365 172 Q 367 169 365 166" stroke={isDark ? "rgba(255,255,255,0.4)" : "#D9692A"} strokeWidth="1.2" strokeLinecap="round" />
    <path className="steam-line-2" d="M 371 170 Q 373 167 371 164" stroke={isDark ? "rgba(255,255,255,0.4)" : "#D9692A"} strokeWidth="1.2" strokeLinecap="round" />

    {/* Chair */}
    <rect x="35" y="175" width="45" height="8" rx="2" fill="#2E2C2B" />
    <path d="M 30 125 C 30 120, 35 115, 40 115 H 45 C 50 115, 55 120, 55 125 V 175 H 30 Z" fill="#2E2C2B" />
    <path d="M 50 175 V 225 H 55 V 175 Z" fill="#423F3E" />
    <line x1="42" y1="225" x2="68" y2="225" stroke="#2E2C2B" strokeWidth="3" strokeLinecap="round" />

    {/* Character Bobbing Head & Body Wrapper */}
    <g className="bobbing-head-body">
      {gender === "female" ? (
        // FEMALE CHARACTER
        <>
          {/* Hair back */}
          <path d="M 72 110 C 65 110, 60 125, 60 145 C 60 165, 75 170, 80 170 Z" fill="#3B2314" />
          {/* Body */}
          <path d="M 72 170 C 72 150, 95 150, 110 155 L 155 180 C 165 185, 165 190, 160 215 H 70 Z" fill="#D9692A" />
          {/* Head */}
          <circle cx="92" cy="115" r="14" fill="#FDD7C6" />
          {/* Hair front */}
          <path d="M 92 101 C 77 101, 74 129, 92 129 C 104 129, 106 117, 102 111 C 98 105, 96 101, 92 101 Z" fill="#3B2314" />
          {/* Face Nose details */}
          <path d="M 98 113 H 104 L 100 118 H 96 Z" fill="#FDD7C6" />
          {/* Neck */}
          <rect x="85" y="126" width="10" height="15" fill="#FDD7C6" />
          {/* Arm with typing animation */}
          <path className="typing-arm" d="M 100 170 Q 140 170, 205 198" stroke="#FDD7C6" strokeWidth="8" strokeLinecap="round" />
          <path className="typing-arm" d="M 100 170 Q 140 170, 205 198" stroke="#D9692A" strokeWidth="8" strokeLinecap="round" opacity="0.25" />
        </>
      ) : (
        // MALE CHARACTER
        <>
          {/* Body */}
          <path d="M 72 170 C 72 150, 95 150, 110 155 L 155 180 C 165 185, 165 190, 160 215 H 70 Z" fill="#4B6FA5" />
          {/* Head */}
          <circle cx="92" cy="115" r="14" fill="#FDD7C6" />
          {/* Short Hair */}
          <path d="M 80 102 C 85 98, 105 98, 105 107 C 105 112, 102 115, 100 115 C 95 115, 95 106, 80 106 Z" fill="#221C18" />
          {/* Beard/Stubble */}
          <path d="M 84 120 C 84 128, 98 128, 100 120 C 95 122, 90 122, 84 120 Z" fill="#221C18" opacity="0.8" />
          {/* Glasses */}
          <circle cx="98" cy="113" r="4.5" stroke="#1A1A1A" strokeWidth="1.2" />
          <line x1="92" y1="113" x2="94" y2="113" stroke="#1A1A1A" strokeWidth="1.2" />
          {/* Nose/chin */}
          <path d="M 98 113 H 103 L 100 118 H 96 Z" fill="#FDD7C6" />
          {/* Neck */}
          <rect x="85" y="126" width="10" height="15" fill="#FDD7C6" />
          {/* Arm with typing animation */}
          <path className="typing-arm" d="M 100 170 Q 140 170, 205 198" stroke="#FDD7C6" strokeWidth="8" strokeLinecap="round" />
          <path className="typing-arm" d="M 100 170 Q 140 170, 205 198" stroke="#4B6FA5" strokeWidth="8" strokeLinecap="round" opacity="0.25" />
        </>
      )}
    </g>

    {/* Laptop with glowing screen chart */}
    <path d="M 195 200 H 275 L 262 165 H 202 Z" fill={isDark ? "#1C1C1E" : "#ffffff"} stroke={isDark ? "rgba(255,255,255,0.15)" : "#C6B9A8"} strokeWidth="1.5" />
    <rect x="188" y="198" width="94" height="4" rx="2" fill={isDark ? "#3A3A3C" : "#A39480"} />
    <circle className="glowing-chart" cx="225" cy="182" r="6" stroke="#D9692A" strokeWidth="3.2" fill="none" />
    <line x1="240" y1="178" x2="254" y2="178" stroke={isDark ? "#fff" : "#1C1B1F"} strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
    <line x1="240" y1="184" x2="250" y2="184" stroke={isDark ? "#fff" : "#1C1B1F"} strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
  </svg>
);

AnimatedDeskIllustration.propTypes = {
  isDark: PropTypes.bool.isRequired,
  gender: PropTypes.string.isRequired
};

function PMLogin({ className, ...props }) {
    const [formData, setFormData] = useState(initialFormState);
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [gender, setGender] = useState("female");
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

    return (
        <div
            className={cn(
                "min-h-screen w-full flex flex-col relative overflow-hidden",
                isDark ? "bg-[#0A0A0A]" : "bg-[#FAF6F0]",
                className
            )}
            {...props}
        >
            {/* dot-grid pattern */}
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
            {/* background decorative blobs */}
            <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 size-[500px] rounded-full opacity-20 blur-[120px]" style={{ background: isDark ? "#F9D94930" : "#D9692A30" }} />
            <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 size-[400px] rounded-full opacity-15 blur-[100px]" style={{ background: isDark ? "#F9D94925" : "#D9692A25" }} />

            {/* Logo bar */}
            <header className="relative z-10 flex items-center gap-2.5 px-8 pt-7">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary">
                    <img src={catalanceLogo} alt="" className="h-[18px] w-[18px] object-contain invert dark:invert-0" />
                </div>
                <span className={cn("text-[1.05rem] font-bold tracking-[-0.4px]", isDark ? "text-white" : "text-[#1C1B1F]")}>Catalance</span>
            </header>

            {/* Main split */}
            <main className="relative z-10 flex flex-1 items-center justify-center gap-6 px-6 py-6 lg:py-8 lg:px-16 lg:gap-12 max-w-5xl mx-auto w-full">
                
                {/* Left panel (Desktop Only) */}
                <div className="hidden max-w-md flex-1 lg:flex lg:flex-col lg:justify-between lg:self-stretch pb-4 pt-2">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className={cn("text-[2.2rem] font-bold tracking-[-1px] leading-none", isDark ? "text-white" : "text-[#1C1B1F]")}>
                                    PM Portal
                                </h1>
                                <p className="text-primary font-medium text-xs tracking-wider uppercase mt-0.5">
                                    Project Manager Portal
                                </p>
                            </div>
                        </div>
                        <p className={cn("mb-8 text-[0.92rem] leading-relaxed", isDark ? "text-white/50" : "text-black/50")}>
                            Access your projects, track progress, and deliver success.
                        </p>

                        {/* Features list */}
                        <div className="space-y-4">
                            {[
                                { 
                                    icon: BarChart2, 
                                    title: "Overview at a Glance", 
                                    desc: "Get instant insights into projects, tasks and team performance.", 
                                    light: "bg-accent text-accent-foreground dark:bg-white/[0.06] dark:text-white"
                                },
                                { 
                                    icon: Users, 
                                    title: "Team Collaboration", 
                                    desc: "Communicate, assign tasks and keep your team aligned.", 
                                    light: "bg-accent text-accent-foreground dark:bg-white/[0.06] dark:text-white"
                                },
                                { 
                                    icon: CheckCircle2, 
                                    title: "On Track, Always", 
                                    desc: "Monitor timelines, milestones and deliver results on time.", 
                                    light: "bg-accent text-accent-foreground dark:bg-white/[0.06] dark:text-white"
                                },
                            ].map(({ icon: Icon, title, desc, light }) => (
                                <div key={title} className="flex items-start gap-3.5">
                                    <div className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full", light)}>
                                        <Icon className="size-4.5" />
                                    </div>
                                    <div>
                                        <p className={cn("text-[0.85rem] font-semibold", isDark ? "text-white" : "text-[#1C1B1F]")}>{title}</p>
                                        <p className={cn("text-[0.78rem] leading-snug", isDark ? "text-white/45" : "text-black/45")}>{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Desk Illustration with switcher at bottom left */}
                    <div className="mt-4 space-y-3">
                        <AnimatedDeskIllustration isDark={isDark} gender={gender} />
                        <button
                            type="button"
                            onClick={() => setGender(prev => prev === "female" ? "male" : "female")}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200",
                                isDark 
                                    ? "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08]" 
                                    : "bg-white border-black/[0.08] text-black/60 shadow-sm hover:bg-black/[0.02]"
                            )}
                        >
                            <RefreshCw className="size-3" />
                            Switch Manager View
                        </button>
                    </div>
                </div>

                {/* Right Card / Form container */}
                <div className={cn("w-full max-w-md rounded-3xl border p-6 shadow-2xl shadow-black/5 dark:shadow-black/40", isDark ? "border-white/[0.07] bg-white/[0.04] backdrop-blur-xl" : "border-black/[0.06] bg-white")}>
                    
                    {/* Header inside Card */}
                    <div className="flex flex-col items-center gap-2 text-center mb-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className={cn("text-xl font-bold tracking-tight", isDark ? "text-white" : "text-[#1C1B1F]")}>
                            Welcome Back!
                        </h2>
                        <p className={cn("text-xs", isDark ? "text-white/45" : "text-black/45")}>
                            Secure login for Project Managers
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="space-y-0">
                        <FieldGroup className="space-y-3.5">
                            <Field className="block space-y-1 text-left">
                                <FieldLabel htmlFor="loginEmail" className="text-[11px] font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">Email</FieldLabel>
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
                                        className="!h-10 rounded-md border-black/15 dark:border-[#ffffff]/10 bg-black/[0.03] dark:bg-[#171717] px-3 pr-11 text-[13px] text-black dark:text-[#ffffff]/90 placeholder:text-[#1c1b1f]/45 dark:placeholder:text-[#ffffff]/35 focus-visible:border-primary/60 focus-visible:ring-primary/20"
                                    />
                                    <Mail className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-black/35 dark:text-white/35" />
                                </div>
                            </Field>

                            <Field className="block space-y-1 text-left">
                                <div className="flex justify-between items-center">
                                    <FieldLabel htmlFor="loginPassword" className="text-[11px] font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">Password</FieldLabel>
                                </div>
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
                                        className="!h-10 rounded-md border-black/15 dark:border-[#ffffff]/10 bg-black/[0.03] dark:bg-[#171717] px-3 pr-11 text-[13px] text-black dark:text-[#ffffff]/90 placeholder:text-[#1c1b1f]/45 dark:placeholder:text-[#ffffff]/35 focus-visible:border-primary/60 focus-visible:ring-primary/20"
                                    />
                                    <div
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute top-0 right-0 h-full px-3 flex items-center cursor-pointer select-none text-zinc-400 hover:text-foreground"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </div>
                                </div>
                            </Field>

                            {/* Remember Me and Forgot Password row */}
                            <div className="flex items-center justify-between text-xs">
                                <label className="flex items-center gap-2 cursor-pointer select-none text-black/60 dark:text-white/60">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="rounded border-black/15 dark:border-white/10 text-primary focus:ring-primary/20"
                                    />
                                    <span>Remember me</span>
                                </label>
                                <Link to="/forgot-password" className="text-primary hover:underline font-medium">
                                    Forgot password?
                                </Link>
                            </div>

                            {formError ? (
                                <FieldDescription
                                    className="text-red-400 text-xs text-center"
                                    aria-live="polite"
                                >
                                    {formError}
                                </FieldDescription>
                            ) : null}

                            {/* Submit CTA */}
                            <div className="pt-1">
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="group flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[0.95rem] font-bold transition-all duration-200 keep-white bg-primary text-white shadow-lg shadow-primary/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="size-4 animate-spin text-white keep-white" />
                                    ) : (
                                        <Lock className="size-4 text-white keep-white" />
                                    )}
                                    {isSubmitting ? "Verifying..." : "Access Dashboard"}
                                </Button>
                            </div>
                        </FieldGroup>
                    </form>

                    {/* Footer note inside Card */}
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] py-2 px-3">
                        <Lock className={cn("size-3.5", isDark ? "text-white/30" : "text-black/30")} />
                        <span className={cn("text-[0.7rem] font-medium tracking-tight", isDark ? "text-white/30" : "text-black/35")}>
                            Restricted Access. Authorized Personnel Only.
                        </span>
                    </div>

                    {/* Register link */}
                    <div className="mt-3 text-center text-xs text-muted-foreground">
                        Need a PM account?{" "}
                        <Link to="/project-manager/register" className="text-primary hover:underline font-semibold">
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
