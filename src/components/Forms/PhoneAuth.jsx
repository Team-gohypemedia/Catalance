import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { COUNTRY_CODES } from "@/shared/data/countryCodes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requestWhatsappOtp, verifyWhatsappOtp } from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";
import {
  canAccessDashboard,
  FREELANCER_DASHBOARD,
  getDashboardEntryPath,
  resolveDashboardValue,
  resolveFreelancerPath,
  resolveWorkspaceHomePath,
  setStoredDashboardPreference,
} from "@/shared/lib/dashboard-preference";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import logo from "@/assets/logos/logo.svg";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Search from "lucide-react/dist/esm/icons/search";

const DEFAULT_COUNTRY = "IN";
const MIN_PHONE_DIGITS = 6;
const OTP_LENGTH = 6;

const normalizePhoneNumber = (value) => String(value || "").replace(/\D/g, "");

const codeToFlagEmoji = (code) => {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizedCode)) {
    return "🏳️";
  }

  return normalizedCode.replace(/[A-Z]/g, (char) =>
    String.fromCodePoint(127397 + char.charCodeAt(0)),
  );
};

const COUNTRY_OPTIONS = Array.from(
  COUNTRY_CODES.reduce((accumulator, country) => {
    const code = String(country?.code || "").trim().toUpperCase();
    const label = String(country?.name || "").trim();
    const dialCode = String(country?.dial_code || "").trim();

    if (!code || !label || !dialCode || accumulator.has(code)) {
      return accumulator;
    }

    accumulator.set(code, {
      code,
      label,
      dialCode,
    });

    return accumulator;
  }, new Map()).values(),
).sort((a, b) => {
  if (a.code === DEFAULT_COUNTRY) return -1;
  if (b.code === DEFAULT_COUNTRY) return 1;
  return a.label.localeCompare(b.label);
});

const formatPhoneNumber = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 15);
  const groups = digits.match(/.{1,5}/g);
  return groups ? groups.join(" ") : "";
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

function CountryFlag({ code, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-5 items-center justify-center rounded-sm border border-white/10 bg-white/5 text-[0.95rem] leading-none",
        className,
      )}
    >
      {codeToFlagEmoji(code)}
    </span>
  );
}

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

function PhoneAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: setAuthSession } = useAuth();

  const initialCountryCode = (() => {
    const candidate =
      typeof location.state?.phoneCountry === "string"
        ? location.state.phoneCountry.toUpperCase()
        : DEFAULT_COUNTRY;

    return COUNTRY_OPTIONS.some((option) => option.code === candidate)
      ? candidate
      : DEFAULT_COUNTRY;
  })();

  const initialCountry =
    COUNTRY_OPTIONS.find((option) => option.code === initialCountryCode) ??
    COUNTRY_OPTIONS[0];

  const initialPhoneDigits = (() => {
    const rawValue =
      typeof location.state?.phoneNumber === "string"
        ? location.state.phoneNumber
        : typeof location.state?.identifier === "string"
          ? location.state.identifier
          : "";
    const digits = normalizePhoneNumber(rawValue);
    const dialDigits = normalizePhoneNumber(initialCountry?.dialCode || "");

    if (dialDigits && digits.startsWith(dialDigits)) {
      return digits.slice(dialDigits.length);
    }

    return digits;
  })();

  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [phoneDigits, setPhoneDigits] = useState(initialPhoneDigits);
  const [otpDigits, setOtpDigits] = useState("");
  const [authStep, setAuthStep] = useState("phone");
  const [pendingPhone, setPendingPhone] = useState(null);
  const [otpExpiresInMinutes, setOtpExpiresInMinutes] = useState(15);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    document.title = "Log in | Catalance";
  }, []);

  const selectedCountry = useMemo(
    () =>
      COUNTRY_OPTIONS.find((option) => option.code === countryCode) ??
      COUNTRY_OPTIONS[0],
    [countryCode],
  );
  const formattedPhone = formatPhoneNumber(phoneDigits);
  const emailSigninPath = searchParams.toString()
    ? `/signin/email?${searchParams.toString()}`
    : "/signin/email";
  const redirectParam = searchParams.get("redirect");
  const openMessageParam = searchParams.get("openMessage");
  const requestedRole =
    searchParams.get("role")?.toUpperCase() ||
    (typeof location.state?.role === "string"
      ? location.state.role.toUpperCase()
      : undefined);
  const pendingPhoneLabel = pendingPhone
    ? `${pendingPhone.countryCode} ${formatPhoneNumber(pendingPhone.phoneNumber)}`
    : "";

  const buildReturnUrl = () => {
    if (!redirectParam) return null;
    const extra = openMessageParam ? `?openMessage=${openMessageParam}` : "";
    return `${redirectParam}${extra}`;
  };

  const getPhonePayload = () => {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneDigits);

    if (normalizedPhoneNumber.length < MIN_PHONE_DIGITS) {
      setFormError("Enter a valid phone number to continue.");
      return null;
    }

    return {
      countryCode: selectedCountry.dialCode,
      phoneNumber: normalizedPhoneNumber,
    };
  };

  const requestOtp = async ({ resend = false } = {}) => {
    setFormError("");

    const phonePayload = resend ? pendingPhone : getPhonePayload();
    if (!phonePayload) return;

    if (resend) {
      setIsResending(true);
    } else {
      setIsSubmitting(true);
    }

    try {
      const result = await requestWhatsappOtp({
        ...phonePayload,
        role: requestedRole,
      });
      setPendingPhone(phonePayload);
      setOtpExpiresInMinutes(Number(result?.expiresInMinutes) || 15);
      setAuthStep("otp");
      toast.success(result?.message || "OTP sent on WhatsApp.");
    } catch (error) {
      const message = error?.message || "Unable to send WhatsApp OTP.";
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

    const otp = normalizePhoneNumber(otpDigits).slice(0, OTP_LENGTH);
    if (otp.length !== OTP_LENGTH) {
      setFormError("Enter the 6-digit verification code.");
      return;
    }

    const phonePayload = pendingPhone || getPhonePayload();
    if (!phonePayload) return;

    setIsSubmitting(true);

    try {
      const authPayload = await verifyWhatsappOtp({
        ...phonePayload,
        otp,
        role: requestedRole,
      });

      if (!authPayload?.user || !authPayload?.accessToken) {
        throw new Error("Invalid login payload received.");
      }

      setAuthSession(authPayload.user, authPayload.accessToken);
      toast.success("Logged in successfully.");
      setPhoneDigits("");
      setOtpDigits("");
      setPendingPhone(null);

      const redirectTo = buildReturnUrl() || location?.state?.redirectTo;

      navigateAfterLogin({
        navigate,
        redirectTo,
        requestedRole,
        user: authPayload.user,
      });
    } catch (error) {
      const message = error?.message || "Unable to verify WhatsApp OTP.";
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

  const handleChangePhone = () => {
    setAuthStep("phone");
    setOtpDigits("");
    setPendingPhone(null);
    setOtpExpiresInMinutes(15);
    setFormError("");
  };

  const handleResendOtp = () => {
    void requestOtp({ resend: true });
  };

  const handleSocialClick = (provider) => {
    toast.info(`${provider} sign-in is not connected yet.`);
  };

  const renderAuthForm = ({ compact = false } = {}) => {
    const phoneInputId = compact ? "phoneNumber" : "phoneNumberDesktop";
    const otpInputId = compact ? "whatsappOtp" : "whatsappOtpDesktop";
    const isOtpStep = authStep === "otp";
    const buttonLabel = isOtpStep ? "Verify OTP" : "Continue";
    const loadingLabel = isOtpStep ? "Verifying..." : "Sending OTP...";
    const formSpacing = compact ? "space-y-3" : "space-y-5";
    const labelClass = "block text-[11px] font-medium uppercase tracking-[0.18em] text-white/55";
    const phoneGridClass = compact
      ? "grid w-full grid-cols-[6.25rem_minmax(0,1fr)] gap-1.5"
      : "grid grid-cols-[7rem_minmax(0,1fr)] gap-2 sm:grid-cols-[7.75rem_minmax(0,1fr)]";
    const selectTriggerClass = compact
      ? "!h-10 !w-full cursor-pointer rounded-md border-white/10 bg-[#171717] px-2.5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:bg-[#1c1c1c]"
      : "!h-12 !w-full cursor-pointer rounded-md border-white/10 bg-[#171717] px-3.5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:bg-[#1c1c1c]";
    const phoneInputClass = compact
      ? "!h-10 !py-0 rounded-md border-white/10 bg-[#171717] px-3 text-[13px] leading-none text-white/90 placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:border-primary/60 focus-visible:ring-primary/20"
      : "!h-12 !py-0 rounded-md border-white/10 bg-[#171717] px-4 text-[15px] leading-none text-white/90 placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:border-primary/60 focus-visible:ring-primary/20";
    const otpInputClass = compact
      ? "!h-10 rounded-md border-white/10 bg-[#171717] px-3 text-center font-mono text-[16px] text-white/90 placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:border-primary/60 focus-visible:ring-primary/20"
      : "!h-12 rounded-md border-white/10 bg-[#171717] px-4 text-center font-mono text-lg text-white/90 placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:border-primary/60 focus-visible:ring-primary/20";
    const submitButtonClass = compact
      ? "!h-11 w-full rounded-md bg-primary text-[15px] font-medium text-black shadow-none hover:bg-primary/95"
      : "!h-14 w-full rounded-md bg-primary text-lg font-medium text-black shadow-none hover:bg-primary/95 sm:text-xl";

    return (
      <form className={`${formSpacing} text-left`} onSubmit={handleSubmit} noValidate>
        <div className="w-full space-y-3">
          {!isOtpStep ? (
            <div className="space-y-1.5">
              <label htmlFor={phoneInputId} className={labelClass}>
                Phone number
              </label>

              <div className={phoneGridClass}>
                <Select
                  value={countryCode}
                  onValueChange={(value) => {
                    setCountryCode(value);
                    if (formError) setFormError("");
                  }}
                  disabled={isSubmitting || isResending}
                >
                  <SelectTrigger
                    type="button"
                    aria-label="Select country code"
                    className={selectTriggerClass}
                  >
                    <div className="pointer-events-none flex min-w-0 items-center gap-2.5 select-none">
                      <CountryFlag
                        code={selectedCountry.code}
                        className={
                          compact ? "size-[1.05rem] rounded-sm text-[0.86rem]" : undefined
                        }
                      />
                      <span className={compact ? "truncate text-[13px] font-medium" : "truncate text-[15px] font-medium"}>
                        {selectedCountry.dialCode}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={8}
                    className="z-[60] min-w-[18rem] border-white/10 bg-[#121212] text-white shadow-2xl sm:min-w-[26rem]"
                  >
                    {COUNTRY_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.code}
                        value={option.code}
                        className="cursor-pointer text-white data-[highlighted]:bg-white/5 data-[highlighted]:text-white"
                      >
                        <span className="flex w-full items-center gap-3">
                          <CountryFlag code={option.code} />
                          <span className="min-w-0 flex-1 truncate">
                            {option.label}
                          </span>
                          <span className="shrink-0 text-white/45">
                            {option.code} {option.dialCode}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  id={phoneInputId}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  aria-label="Phone number"
                  placeholder="999 999 9999"
                  value={formattedPhone}
                  disabled={isSubmitting || isResending}
                  onChange={(event) => {
                    const digits = event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 15);
                    setPhoneDigits(digits);
                    if (formError) setFormError("");
                  }}
                  className={phoneInputClass}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <label htmlFor={otpInputId} className={labelClass}>
                    Verification code
                  </label>
                  <p className="mt-1 truncate text-xs text-white/55">
                    WhatsApp OTP sent to {pendingPhoneLabel}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleChangePhone}
                  disabled={isSubmitting || isResending}
                  className="h-8 shrink-0 px-2 text-xs text-primary hover:bg-white/[0.06] hover:text-primary"
                >
                  Change
                </Button>
              </div>

              <Input
                id={otpInputId}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="WhatsApp verification code"
                placeholder="123456"
                value={otpDigits}
                maxLength={OTP_LENGTH}
                disabled={isSubmitting}
                onChange={(event) => {
                  const digits = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, OTP_LENGTH);
                  setOtpDigits(digits);
                  if (formError) setFormError("");
                }}
                className={otpInputClass}
              />

              <div className="flex items-center justify-between gap-3 text-xs text-white/50">
                <span>Code expires in {otpExpiresInMinutes} minutes.</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={isSubmitting || isResending}
                  className="h-8 px-2 text-xs text-primary hover:bg-white/[0.06] hover:text-primary"
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
            <Loader2 className={compact ? "size-[0.95rem] animate-spin" : "size-5 animate-spin"} />
          ) : (
            <ArrowRight className={compact ? "size-[0.95rem]" : "size-5"} />
          )}
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
              <div className="mb-2.5 flex size-12 items-center justify-center rounded-[18px] border border-primary/70 bg-primary">
                <img
                  src={logo}
                  alt="Catalance logo"
                  className="h-7 w-7 object-contain"
                />
              </div>

              <h1 className="text-[2.15rem] font-medium leading-none tracking-[-0.02em] text-white">
                Catalance
              </h1>

              <p className="mt-1 text-[0.78rem] leading-tight text-white/68">
                Hire verified creative freelancers.
              </p>
            </div>

            <section className="mt-3 w-full">
              <Card className="mx-auto mt-3 w-full rounded-lg border border-white/10 bg-[#101010]/90 p-3.5 shadow-none backdrop-blur-2xl">
                {renderAuthForm({ compact: true })}
              </Card>

              <div className="mt-2.5 flex items-center gap-3 text-white/42">
                <span className="h-px flex-1 bg-white/12" />
                <span className="text-[11px] tracking-[0.18em]">or</span>
                <span className="h-px flex-1 bg-white/12" />
              </div>

              <div className="mt-2.5 space-y-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialClick("Google")}
                  className="!h-10 w-full rounded-md border-white/12 bg-white/[0.03] text-[12px] font-medium text-white hover:bg-white/[0.06] hover:text-white sm:text-[13px]"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt=""
                    className="size-[18px]"
                  />
                  Continue with Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialClick("Apple")}
                  className="!h-10 w-full rounded-md border-white/12 bg-white/[0.03] text-[12px] font-medium text-white hover:bg-white/[0.06] hover:text-white sm:text-[13px]"
                >
                  <AppleLogo className="size-[18px] text-white" />
                  Continue with Apple
                </Button>
              </div>

              <div className="mt-3 text-center text-[0.82rem] text-white/68">
                <Link
                  to={emailSigninPath}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Sign in with email and password
                </Link>
              </div>

              <p className="mx-auto mt-2 max-w-[19rem] text-center text-[11px] leading-4 text-white/58">
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
              <div className="relative mb-8 flex size-28 items-center justify-center rounded-[22px] border border-primary/70 bg-primary sm:size-32">
                <img
                  src={logo}
                  alt="Catalance logo"
                  className="h-14 w-14 object-contain sm:h-25 sm:w-25"
                />
              </div>

              <div className="space-y-5">
                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
                  Catalance
                </h1>

                <p className="max-w-lg text-lg leading-tight text-white/72 sm:text-2xl">
                  Hire verified creative freelancers.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 xl:justify-start">
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-full border-white/15 bg-white/[0.03] px-5 text-sm font-medium text-white hover:bg-white/[0.06] hover:text-white"
                >
                  <Link to="/talent" className="gap-2.5">
                    <Search className="size-4 text-primary" />
                    Hire freelancers
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-full border-white/15 bg-white/[0.03] px-5 text-sm font-medium text-white hover:bg-white/[0.06] hover:text-white"
                >
                  <Link to="/get-started" className="gap-2.5">
                    <Briefcase className="size-4 text-primary" />
                    Post a project
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-full border-white/15 bg-white/[0.03] px-5 text-sm font-medium text-white hover:bg-white/[0.06] hover:text-white"
                >
                  <Link to="/contact" className="gap-2.5">
                    <MessageCircle className="size-4 text-primary" />
                    Message freelancers
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="order-1 flex justify-center xl:order-2 xl:justify-end">
            <div className="flex w-full max-w-[42rem] flex-col">
              <Card className="relative overflow-hidden rounded-lg border border-white/10 bg-[#101010]/90 p-0 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
                <div className="relative p-6 sm:p-8 md:p-10">
                  {renderAuthForm()}

                  <div className="mt-5 flex items-center gap-4 text-white/42">
                    <span className="h-px flex-1 bg-white/12" />
                    <span className="text-sm tracking-[0.28em]">OR</span>
                    <span className="h-px flex-1 bg-white/12" />
                  </div>

                  <div className="mt-5 space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialClick("Google")}
                      className="!h-14 w-full rounded-md border-white/12 bg-white/[0.03] text-sm font-medium text-white hover:bg-white/[0.06] hover:text-white"
                    >
                      <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt=""
                        className="size-5"
                      />
                      Continue with Google
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialClick("Apple")}
                      className="!h-14 w-full rounded-md border-white/12 bg-white/[0.03] text-sm font-medium text-white hover:bg-white/[0.06] hover:text-white"
                    >
                      <AppleLogo className="size-5 text-white" />
                      Continue with Apple
                    </Button>
                  </div>

                  <div className="pt-5 text-center text-base text-white/68">
                    <Link
                      to={emailSigninPath}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Sign in with email and password
                    </Link>
                  </div>
                </div>
              </Card>

              <p className="mt-5 px-4 text-center text-[13px] leading-relaxed text-white/58 sm:text-sm sm:whitespace-nowrap">
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

export default PhoneAuth;
