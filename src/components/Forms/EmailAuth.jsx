import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import {
  loginWithGoogle,
  requestEmailOtp,
  verifyEmailOtp,
} from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";
import {
  ACCOUNT_ONBOARDING_PATH,
  canAccessDashboard,
  FREELANCER_DASHBOARD,
  getDashboardEntryPath,
  requiresAccountOnboarding,
  resolveDashboardValue,
  resolveFreelancerPath,
  resolveWorkspaceHomePath,
  setStoredDashboardPreference,
} from "@/shared/lib/dashboard-preference";
import logo from "@/assets/logos/logo.svg";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Search from "lucide-react/dist/esm/icons/search";

const CLIENT_ROLE = "CLIENT";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_LENGTH = 6;

const normalizeAvatarUrl = (value) => {
  const url = String(value || "").trim();
  if (!url || url.startsWith("blob:")) return "";
  return url;
};

const getGoogleAvatarFromFirebaseUser = (firebaseUser) => {
  if (!firebaseUser) return "";
  const providerPhoto = Array.isArray(firebaseUser.providerData)
    ? firebaseUser.providerData.find((entry) => Boolean(entry?.photoURL))
      ?.photoURL || ""
    : "";
  return normalizeAvatarUrl(firebaseUser.photoURL || providerPhoto || "");
};

const mergeAuthUserWithAvatar = (apiUser, fallbackAvatar) => {
  if (!apiUser || typeof apiUser !== "object") return apiUser;

  const existingIdentityAvatar =
    apiUser?.profileDetails?.identity?.profilePhoto || "";
  const resolvedAvatar = normalizeAvatarUrl(
    apiUser?.avatar || existingIdentityAvatar || fallbackAvatar,
  );

  if (!resolvedAvatar) return apiUser;

  return {
    ...apiUser,
    avatar: resolvedAvatar,
    profileDetails: {
      ...(apiUser.profileDetails && typeof apiUser.profileDetails === "object"
        ? apiUser.profileDetails
        : {}),
      identity: {
        ...((apiUser.profileDetails &&
          typeof apiUser.profileDetails === "object" &&
          apiUser.profileDetails.identity &&
          typeof apiUser.profileDetails.identity === "object"
          ? apiUser.profileDetails.identity
          : {})),
        profilePhoto: existingIdentityAvatar || resolvedAvatar,
      },
    },
  };
};

const isValidEmail = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return false;

  return EMAIL_PATTERN.test(normalized);
};

const navigateAfterLogin = ({ navigate, redirectTo, requestedRole, user }) => {
  const requestedDashboard = resolveDashboardValue(requestedRole);

  if (requestedDashboard === FREELANCER_DASHBOARD) {
    setStoredDashboardPreference(user, requestedDashboard);
    navigate(getDashboardEntryPath(user, requestedDashboard), { replace: true });
    return;
  }

  if (redirectTo) {
    navigate(resolveFreelancerPath(user, redirectTo), { replace: true });
    return;
  }

  if (requestedDashboard && canAccessDashboard(user, requestedDashboard)) {
    setStoredDashboardPreference(user, requestedDashboard);
    navigate(getDashboardEntryPath(user, requestedDashboard), { replace: true });
    return;
  }

  navigate(resolveWorkspaceHomePath(user), { replace: true });
};

function AppleLogo({ className }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0", className)}
      fill="currentColor"
      focusable="false"
      viewBox="0 0 814 1000"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}

function EmailAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: setAuthSession } = useAuth();

  const [email, setEmail] = useState(() =>
    typeof location.state?.email === "string"
      ? location.state.email
      : typeof location.state?.identifier === "string"
        ? location.state.identifier
        : "",
  );
  const [otpDigits, setOtpDigits] = useState("");
  const [authStep, setAuthStep] = useState("email");
  const [pendingEmail, setPendingEmail] = useState(null);
  const [otpExpiresInMinutes, setOtpExpiresInMinutes] = useState(15);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign in | Catalance";
    return () => {
      document.title = "Catalance";
    };
  }, []);

  const redirectParam = searchParams.get("redirect");
  const openMessageParam = searchParams.get("openMessage");
  const queryString = searchParams.toString();
  const phoneSigninPath = queryString
    ? `/signin/phone?${queryString}`
    : "/signin/phone";
  const identifierLabel = "Email address";
  const identifierPlaceholder = "name@example.com";
  const identifierInputType = "email";
  const identifierInputMode = "email";
  const identifierAutoComplete = "email";
  const requestedRole =
    searchParams.get("role")?.toUpperCase() ||
    (typeof location.state?.role === "string"
      ? location.state.role.toUpperCase()
      : undefined);

  const buildReturnUrl = () => {
    if (!redirectParam) return null;
    const extra = openMessageParam ? `?openMessage=${openMessageParam}` : "";
    return `${redirectParam}${extra}`;
  };

  const requestOtp = async ({ resend = false } = {}) => {
    setFormError("");

    const normalizedEmail = String(resend ? pendingEmail : email)
      .trim()
      .toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setFormError("Enter a valid email address to continue.");
      return;
    }

    if (resend) {
      setIsResending(true);
    } else {
      setIsSubmitting(true);
    }

    try {
      const result = await requestEmailOtp({
        email: normalizedEmail,
        role: requestedRole,
      });
      const nextPendingEmail = result?.email || normalizedEmail;

      setEmail(nextPendingEmail);
      setPendingEmail(nextPendingEmail);
      setOtpExpiresInMinutes(Number(result?.expiresInMinutes) || 15);
      setAuthStep("otp");
      toast.success(result?.message || "Verification code sent to your email.");
    } catch (error) {
      const message = error?.message || "Unable to send verification code.";
      setFormError(message);
      toast.error(message);
    } finally {
      if (resend) {
        setIsResending(false);
      } else {
        setIsSubmitting(false);
      }
    }
  };

  const verifyOtpCode = async () => {
    setFormError("");

    const normalizedEmail = String(pendingEmail || email).trim().toLowerCase();
    const otp = otpDigits.replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (!isValidEmail(normalizedEmail)) {
      setFormError("Enter a valid email address to continue.");
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      setFormError("Enter the 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const authPayload = await verifyEmailOtp({
        email: normalizedEmail,
        otp,
        role: requestedRole,
      });

      if (!authPayload?.user || !authPayload?.accessToken) {
        throw new Error("Invalid login payload received.");
      }

      const shouldStartAccountOnboarding =
        authPayload?.requiresAccountOnboarding ??
        requiresAccountOnboarding(authPayload?.user);
      const sessionUser = shouldStartAccountOnboarding
        ? { ...authPayload?.user, accountOnboardingPending: true }
        : authPayload?.user;

      setAuthSession(sessionUser, authPayload?.accessToken);
      toast.success("Signed in successfully.");
      setEmail("");
      setOtpDigits("");
      setPendingEmail(null);

      const redirectTo = buildReturnUrl() || location?.state?.redirectTo;

      if (shouldStartAccountOnboarding) {
        navigate(ACCOUNT_ONBOARDING_PATH, {
          replace: true,
          state: {
            fromEmailVerification: true,
            ...(redirectTo ? { redirectTo } : {}),
          },
        });
        return;
      }

      navigateAfterLogin({
        navigate,
        redirectTo,
        requestedRole,
        user: sessionUser,
      });
    } catch (error) {
      const message = error?.message || "Unable to verify email code.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (authStep === "otp") {
      await verifyOtpCode();
      return;
    }

    await requestOtp();
  };

  const handleChangeEmail = () => {
    setAuthStep("email");
    setOtpDigits("");
    setPendingEmail(null);
    setOtpExpiresInMinutes(15);
    setFormError("");
  };

  const handleResendOtp = () => {
    void requestOtp({ resend: true });
  };

  const handleGoogleSignIn = async () => {
    setFormError("");
    setIsGoogleLoading(true);

    try {
      const { signInWithGoogle } = await import("@/shared/lib/firebase");
      const firebaseUser = await signInWithGoogle();
      const idToken = await firebaseUser.getIdToken();
      const authPayload = await loginWithGoogle(
        idToken,
        requestedRole || CLIENT_ROLE,
        "signup",
      );
      const googleAvatar = getGoogleAvatarFromFirebaseUser(firebaseUser);
      const mergedUser = mergeAuthUserWithAvatar(authPayload?.user, googleAvatar);
      const shouldStartAccountOnboarding = requiresAccountOnboarding(mergedUser);
      const sessionUser = shouldStartAccountOnboarding
        ? { ...mergedUser, accountOnboardingPending: true }
        : mergedUser;

      setAuthSession(sessionUser, authPayload?.accessToken);
      toast.success(`Welcome, ${sessionUser?.fullName || "User"}!`);

      const redirectTo = buildReturnUrl() || location?.state?.redirectTo;

      if (shouldStartAccountOnboarding) {
        navigate(ACCOUNT_ONBOARDING_PATH, {
          replace: true,
          state: {
            fromGoogleSignin: true,
            ...(redirectTo ? { redirectTo } : {}),
          },
        });
        return;
      }

      navigateAfterLogin({
        navigate,
        redirectTo,
        requestedRole,
        user: sessionUser,
      });
    } catch (error) {
      const message = error?.message || "Unable to sign in with Google.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSocialClick = (provider) => {
    toast.info(`${provider} Log-in is not connected yet.`);
  };

  const renderAuthForm = ({ compact = false } = {}) => {
    const emailInputId = compact ? "loginEmail" : "loginEmailDesktop";
    const otpInputId = compact ? "emailOtp" : "emailOtpDesktop";
    const isOtpStep = authStep === "otp";
    const normalizedOtpDigits = otpDigits.replace(/\D/g, "").slice(0, OTP_LENGTH);
    const buttonLabel = isOtpStep ? "Verify code" : "Sign in";
    const loadingLabel = isOtpStep ? "Verifying..." : "Sending code...";
    const formSpacing = compact ? "space-y-3" : "space-y-6";
    const fieldSpacing = compact ? "space-y-3" : "space-y-4";
    const labelClass = compact
      ? "block text-[11px] font-medium uppercase tracking-[0.18em] text-black/55 dark:text-white/55"
      : "block text-[12px] font-medium uppercase tracking-[0.2em] text-black/55 dark:text-white/55";
    const inputClass = compact
      ? "!h-10 !py-0 rounded-md border-black/10 dark:border-[#ffffff]/10 bg-black/5 dark:bg-[#171717] px-3 text-[13px] leading-none text-black/90 dark:text-[#ffffff]/90 placeholder:text-black/35 dark:placeholder:text-[#ffffff]/35 shadow-[inset_0_1px_0_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:border-primary/60 focus-visible:ring-primary/20"
      : "!h-12 !py-0 rounded-md border-black/10 dark:border-[#ffffff]/10 bg-black/5 dark:bg-[#171717] px-4 text-[15px] leading-none text-black/90 dark:text-[#ffffff]/90 placeholder:text-black/35 dark:placeholder:text-[#ffffff]/35 shadow-[inset_0_1px_0_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:border-primary/60 focus-visible:ring-primary/20";
    const submitButtonClass = compact
      ? "!h-11 w-full rounded-md bg-primary text-[15px] font-medium text-black shadow-none hover:bg-primary/95"
      : "!h-14 w-full rounded-md bg-primary text-base font-medium text-black shadow-none hover:bg-primary/95 sm:text-[17px]";

    return (
      <form className={formSpacing} onSubmit={handleSubmit} noValidate>
        <div className={`${fieldSpacing} text-left`}>
          {!isOtpStep ? (
            <div className="space-y-1.5">
              <label htmlFor={emailInputId} className={labelClass}>
                Email address
              </label>
              <Input
                id={emailInputId}
                name="identifier"
                type={identifierInputType}
                inputMode={identifierInputMode}
                autoComplete={identifierAutoComplete}
                autoCapitalize="none"
                spellCheck={false}
                aria-label={identifierLabel}
                placeholder={identifierPlaceholder}
                value={email}
                disabled={isSubmitting || isResending}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (formError) setFormError("");
                }}
                className={inputClass}
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <label htmlFor={otpInputId} className={labelClass}>
                    Verification code
                  </label>
                  <p className="mt-1 truncate text-xs text-black/55 dark:text-white/55">
                    Email code sent to {pendingEmail}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleChangeEmail}
                  disabled={isSubmitting || isResending}
                  className="h-8 shrink-0 px-2 text-xs text-primary hover:bg-black/[0.06] dark:bg-white/[0.06] hover:text-primary"
                >
                  Change
                </Button>
              </div>

              <InputOTP
                id={otpInputId}
                maxLength={OTP_LENGTH}
                value={normalizedOtpDigits}
                onChange={(value) => {
                  setOtpDigits(value.replace(/\D/g, "").slice(0, OTP_LENGTH));
                  if (formError) setFormError("");
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern={REGEXP_ONLY_DIGITS}
                pasteTransformer={(pastedText) =>
                  String(pastedText || "").replace(/\D/g, "").slice(0, OTP_LENGTH)
                }
                containerClassName="w-full overflow-hidden px-2"
                aria-label="Email verification code"
              >
                <InputOTPGroup className="flex-1 flex items-center justify-center gap-3 min-w-0">
                  <InputOTPSlot index={0} className="flex-1 min-w-0 max-w-[3.5rem] sm:max-w-[5rem]" />
                  <InputOTPSlot index={1} className="flex-1 min-w-0 max-w-[3.5rem] sm:max-w-[5rem]" />
                </InputOTPGroup>
                <InputOTPSeparator className="mx-2 sm:mx-4" />
                <InputOTPGroup className="flex-1 flex items-center justify-center gap-3 min-w-0">
                  <InputOTPSlot index={2} className="flex-1 min-w-0 max-w-[3.5rem] sm:max-w-[5rem]" />
                  <InputOTPSlot index={3} className="flex-1 min-w-0 max-w-[3.5rem] sm:max-w-[5rem]" />
                </InputOTPGroup>
                <InputOTPSeparator className="mx-2 sm:mx-4" />
                <InputOTPGroup className="flex-1 flex items-center justify-center gap-3 min-w-0">
                  <InputOTPSlot index={4} className="flex-1 min-w-0 max-w-[3.5rem] sm:max-w-[5rem]" />
                  <InputOTPSlot index={5} className="flex-1 min-w-0 max-w-[3.5rem] sm:max-w-[5rem]" />
                </InputOTPGroup>
              </InputOTP>

              <div className="flex items-center justify-between gap-3 text-xs text-black/50 dark:text-white/50">
                <span>Code expires in {otpExpiresInMinutes} minutes.</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={isSubmitting || isResending}
                  className="h-8 px-2 text-xs text-primary hover:bg-black/[0.06] dark:bg-white/[0.06] hover:text-primary"
                >
                  {isResending ? "Resending..." : "Resend code"}
                </Button>
              </div>
            </div>
          )}

          {formError ? (
            <p className="pt-1 text-sm text-red-400" aria-live="polite">
              {formError}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || isResending}
          className={submitButtonClass}
        >
          {isSubmitting ? loadingLabel : buttonLabel}
          {isSubmitting ? (
            <Loader2
              className={
                compact ? "size-[0.95rem] animate-spin" : "size-5 animate-spin"
              }
            />
          ) : null}
        </Button>
      </form>
    );
  };

  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="relative mx-auto min-h-svh w-full max-w-[88rem] px-4 py-2 sm:px-10 lg:px-12 lg:py-8">
        <div className="xl:hidden flex min-h-[calc(100svh-1rem)] w-full items-center">
          <div className="mx-auto flex w-full max-w-[28rem] flex-col items-center text-center">
            <div className="mt-2 flex flex-col items-center text-center">
              <Link to="/" className="flex flex-col items-center text-center group cursor-pointer">
                <div className="mb-2.5 flex size-12 items-center justify-center rounded-[18px] border border-primary/70 bg-primary transition-all duration-300 group-hover:scale-105">
                  <img
                    src={logo}
                    alt="Catalance logo"
                    className="h-7 w-7 object-contain invert dark:invert-0"
                  />
                </div>

                <h1 className="text-[2.15rem] font-medium leading-none tracking-[-0.02em] text-black dark:text-white">
                  Catalance
                </h1>
              </Link>

              <p className="mt-2 text-[0.78rem] leading-tight text-black/68 dark:text-white/68">
                Hire verified creative freelancers.
              </p>
            </div>

            <section className="mt-3 w-full">
              <Card className="mx-auto mt-3 w-full rounded-lg border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#101010]/90 p-3.5 shadow-none backdrop-blur-2xl">
                {renderAuthForm({ compact: true })}
              </Card>

              <div className="mt-2.5 flex items-center gap-3 text-black/42 dark:text-white/42">
                <span className="h-px flex-1 bg-black/12 dark:bg-white/12" />
                <span className="text-[11px] tracking-[0.18em]">or</span>
                <span className="h-px flex-1 bg-black/12 dark:bg-white/12" />
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting || isResending || isGoogleLoading}
                  className="!h-10 w-full rounded-md border-black/12 dark:border-white/12 bg-black/[0.03] dark:bg-white/[0.03] text-[12px] font-medium text-black dark:text-white hover:bg-black/[0.06] dark:bg-white/[0.06] hover:text-black dark:text-white disabled:opacity-70 sm:text-[13px]"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="size-[18px] animate-spin" />
                  ) : (
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt=""
                      className="size-[18px]"
                    />
                  )}
                  {isGoogleLoading ? "Connecting..." : "Continue with Google"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialClick("Apple")}
                  className="!h-10 w-full rounded-md border-black/12 dark:border-white/12 bg-black/[0.03] dark:bg-white/[0.03] text-[12px] font-medium text-black dark:text-white hover:bg-black/[0.06] dark:bg-white/[0.06] hover:text-black dark:text-white sm:text-[13px]"
                >
                  <AppleLogo className="size-[18px] text-black dark:text-white" />
                  Continue with Apple
                </Button>
              </div>

              <div className="mt-3 text-center text-[0.82rem] text-black/68 dark:text-white/68">
                  <Link
                  to={phoneSigninPath}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Back to phone sign-in
                </Link>
              </div>

              <p className="mx-auto mt-2.5 max-w-[19rem] text-center text-[11px] leading-4 text-black/58 dark:text-white/58">
                By continuing you agree to Catalance&apos;s{" "}
                <Link to="/terms" className="text-primary underline-offset-4 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>
          </div>
        </div>

        <div className="hidden xl:grid min-h-[calc(100svh-4rem)] w-full items-center gap-12 xl:grid-cols-[1.05fr_0.95fr] xl:gap-16">
          <section className="order-2 flex justify-center xl:order-1 xl:justify-start">
            <div className="flex w-full max-w-xl flex-col items-center text-center">
              <Link to="/" className="flex flex-col items-center text-center group cursor-pointer">
                <div className="relative mb-8 flex size-28 items-center justify-center rounded-[22px] border border-primary/70 bg-primary sm:size-32 transition-all duration-300 group-hover:scale-105">
                  <img
                    src={logo}
                    alt="Catalance logo"
                    className="h-14 w-14 object-contain sm:h-25 sm:w-25 invert dark:invert-0"
                  />
                </div>

                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-black dark:text-white sm:text-6xl lg:text-7xl">
                  Catalance
                </h1>
              </Link>

              <p className="mt-5 max-w-lg text-lg leading-tight text-black/72 dark:text-white/72 sm:text-2xl">
                Hire verified creative freelancers.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 xl:justify-start">
                <div className="flex items-center gap-2.5 text-sm font-medium text-black dark:text-white">
                  <Search className="size-4 text-primary" />
                  Hire freelancers
                </div>

                <div className="flex items-center gap-2.5 text-sm font-medium text-black dark:text-white">
                  <Briefcase className="size-4 text-primary" />
                  Post a project
                </div>

                <div className="flex items-center gap-2.5 text-sm font-medium text-black dark:text-white">
                  <MessageCircle className="size-4 text-primary" />
                  Message freelancers
                </div>
              </div>
            </div>
          </section>

          <section className="order-1 flex justify-center xl:order-2 xl:justify-end">
            <div className="flex w-full max-w-[42rem] flex-col">
              <Card className="relative overflow-hidden rounded-lg border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#101010]/90 p-0 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_120px_-60px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
                <div className="relative p-6 sm:p-8 md:p-12">
                  <p className="px-4 text-center text-3xl font-semibold uppercase text-black dark:text-white sm:px-6 md:px-12">
                    Sign in
                  </p>

                  <p className="mb-4 px-4 text-center text-md text-nowrap text-black/72 dark:text-white/72 sm:px-6 md:px-12">
                    Use your email to continue.
                  </p>

                  {renderAuthForm()}

                  <div className="mt-6 flex items-center gap-4 text-black/42 dark:text-white/42">
                    <span className="h-px flex-1 bg-black/12 dark:bg-white/12" />
                    <span className="text-sm tracking-[0.28em]">OR</span>
                    <span className="h-px flex-1 bg-black/12 dark:bg-white/12" />
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleSignIn}
                      disabled={isSubmitting || isResending || isGoogleLoading}
                      className="!h-14 w-full rounded-md border-black/12 dark:border-white/12 bg-black/[0.03] dark:bg-white/[0.03] text-sm font-medium text-black dark:text-white hover:bg-black/[0.06] dark:bg-white/[0.06] hover:text-black dark:text-white disabled:opacity-70"
                    >
                      {isGoogleLoading ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <img
                          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                          alt=""
                          className="size-5"
                        />
                      )}
                      {isGoogleLoading ? "Connecting..." : "Continue with Google"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialClick("Apple")}
                      className="!h-14 w-full rounded-md border-black/12 dark:border-white/12 bg-black/[0.03] dark:bg-white/[0.03] text-sm font-medium text-black dark:text-white hover:bg-black/[0.06] dark:bg-white/[0.06] hover:text-black dark:text-white"
                    >
                      <AppleLogo className="size-5 text-black dark:text-white" />
                      Continue with Apple
                    </Button>
                  </div>

                  <div className="mt-6 text-center text-[0.95rem] text-black/68 dark:text-white/68">
                    <Link
                      to={phoneSigninPath}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Back to phone sign-in
                    </Link>
                  </div>
                </div>
              </Card>

              <p className="mt-6 px-4 text-center text-[13px] leading-relaxed text-black/58 dark:text-white/58 sm:text-sm sm:whitespace-nowrap">
                By continuing you agree to Catalance&apos;s{" "}
                <Link
                  to="/terms"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default EmailAuth;
