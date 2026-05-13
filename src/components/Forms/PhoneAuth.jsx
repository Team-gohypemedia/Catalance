import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import * as Flags from "country-flag-icons/react/3x2";
import { cn } from "@/shared/lib/utils";
import { COUNTRY_CODES } from "@/shared/data/countryCodes";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
} from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  loginWithGoogle,
  requestWhatsappOtp,
  verifyWhatsappOtp,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import logo from "@/assets/logos/logo.svg";
import whatsappIcon from "@/assets/icons/whatsapp.svg";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Search from "lucide-react/dist/esm/icons/search";

const DEFAULT_COUNTRY = "IN";
const MIN_PHONE_DIGITS = 6;
const DEFAULT_OTP_EXPIRY_MINUTES = 15;
const OTP_LENGTH = 6;

const formatCountdown = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

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

const normalizePhoneNumber = (value) => String(value || "").replace(/\D/g, "");

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

function CountryFlag({ code, className = "h-5 w-5" }) {
  const normalizedCode = String(code || "").trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalizedCode)) {
    return (
      <div
        aria-hidden="true"
        className={cn("rounded-sm border border-white/10 bg-white/5", className)}
      />
    );
  }

  const FlagComponent = Flags[normalizedCode];

  if (!FlagComponent) {
    return (
      <div
        aria-hidden="true"
        className={cn("rounded-sm border border-white/10 bg-white/5", className)}
      />
    );
  }

  return (
    <FlagComponent
      aria-hidden="true"
      className={cn("rounded-sm object-cover", className)}
    />
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
  const [otpExpiresInMinutes, setOtpExpiresInMinutes] = useState(DEFAULT_OTP_EXPIRY_MINUTES);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [resendCooldownAt, setResendCooldownAt] = useState(null);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const lastDigitsOnlyToastAtRef = useRef(0);
  const mobileOtpInputRef = useRef(null);
  const desktopOtpInputRef = useRef(null);
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia("(min-width: 1280px)").matches;
  });

  useEffect(() => {
    document.title = "Sign in | Catalance";
  }, []);

  useEffect(() => {
    if (authStep !== "otp" || !otpExpiresAt) {
      setCountdownNow(Date.now());
      return undefined;
    }

    const syncCountdown = () => {
      setCountdownNow(Date.now());
    };

    syncCountdown();
    const intervalId = window.setInterval(syncCountdown, 1000);

    return () => window.clearInterval(intervalId);
  }, [authStep, otpExpiresAt]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const syncViewport = (event) => {
      setIsDesktopViewport(event.matches);
    };

    setIsDesktopViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    if (authStep !== "otp") return undefined;

    const activeOtpInputRef = isDesktopViewport
      ? desktopOtpInputRef
      : mobileOtpInputRef;
    const frameId = window.requestAnimationFrame(() => {
      activeOtpInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [authStep, isDesktopViewport]);

  const selectedCountry = useMemo(
    () =>
      COUNTRY_OPTIONS.find((option) => option.code === countryCode) ??
      COUNTRY_OPTIONS[0],
    [countryCode],
  );
  const formattedPhone = formatPhoneNumber(phoneDigits);
  const otpRemainingSeconds = otpExpiresAt
    ? Math.max(0, Math.ceil((otpExpiresAt - countdownNow) / 1000))
    : otpExpiresInMinutes * 60;
  const resendCooldownSeconds = resendCooldownAt
    ? Math.max(0, Math.ceil((resendCooldownAt - countdownNow) / 1000))
    : 0;
  const isOtpExpired = authStep === "otp" && otpRemainingSeconds === 0;
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
      const phoneLabel = `${phonePayload.countryCode} ${formatPhoneNumber(
        phonePayload.phoneNumber,
      )}`;
      setPendingPhone(phonePayload);
      const expiresInMinutes =
        Number(result?.expiresInMinutes) || DEFAULT_OTP_EXPIRY_MINUTES;
      setOtpExpiresInMinutes(expiresInMinutes);
      setOtpExpiresAt(Date.now() + expiresInMinutes * 60 * 1000);
      setResendCooldownAt(Date.now() + 60 * 1000); // 1 minute cooldown
      setOtpDigits("");
      setAuthStep("otp");
      toast.success(`6-digit WhatsApp code sent to ${phoneLabel}.`);
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

    if (isOtpExpired) {
      setFormError("This WhatsApp code has expired. Request a new one.");
      return;
    }

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

      const sessionUser = authPayload.requiresAccountOnboarding
        ? { ...authPayload.user, accountOnboardingPending: true }
        : authPayload.user;

      setAuthSession(sessionUser, authPayload.accessToken);
      toast.success("Signed in successfully.");
      setPhoneDigits("");
      setOtpDigits("");
      setPendingPhone(null);
      setOtpExpiresAt(null);

      const redirectTo = buildReturnUrl() || location?.state?.redirectTo;

      if (authPayload?.requiresAccountOnboarding) {
        navigate(ACCOUNT_ONBOARDING_PATH, {
          replace: true,
          state: {
            fromPhoneVerification: true,
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
    setOtpExpiresInMinutes(DEFAULT_OTP_EXPIRY_MINUTES);
    setOtpExpiresAt(null);
    setFormError("");
  };

  const handleResendOtp = () => {
    if (resendCooldownSeconds > 0 || isSubmitting || isResending) return;

    void requestOtp({ resend: true });
  };

  const showDigitsOnlyToast = (message = "Only numbers are acceptable.") => {
    const now = Date.now();
    if (now - lastDigitsOnlyToastAtRef.current < 1200) return;

    lastDigitsOnlyToastAtRef.current = now;
    toast.error(message);
  };

  const handleGoogleSignIn = async () => {
    setFormError("");
    setIsGoogleLoading(true);

    try {
      const { signInWithGoogle } = await import("@/shared/lib/firebase");
      const firebaseUser = await signInWithGoogle();
      const idToken = await firebaseUser.getIdToken();
      const authPayload = await loginWithGoogle(idToken, requestedRole, "signup");
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
    toast.info(`${provider} sign-in is not connected yet.`);
  };

  const renderAuthForm = ({ compact = false } = {}) => {
    const phoneInputId = compact ? "phoneNumber" : "phoneNumberDesktop";
    const otpInputId = compact ? "whatsappOtp" : "whatsappOtpDesktop";
    const isOtpStep = authStep === "otp";
    const shouldAutoFocusOtp =
      isOtpStep && ((compact && !isDesktopViewport) || (!compact && isDesktopViewport));
    const otpInputRef = compact ? mobileOtpInputRef : desktopOtpInputRef;
    const normalizedOtpDigits = normalizePhoneNumber(otpDigits).slice(0, OTP_LENGTH);
    const isOtpComplete = normalizedOtpDigits.length === OTP_LENGTH;
    const countdownText = isOtpExpired
      ? "Code expired"
      : `Code expires in ${formatCountdown(otpRemainingSeconds)}`;
    const canResendOtp = resendCooldownSeconds === 0 && !isSubmitting && !isResending;
    const resendButtonLabel = isResending
      ? "Resending..."
      : resendCooldownSeconds > 0
        ? `Resend in ${formatCountdown(resendCooldownSeconds)}`
        : "Resend code";
    const buttonLabel = isOtpStep ? "Verify OTP" : "Continue with WhatsApp";
    const loadingLabel = isOtpStep ? "Verifying..." : "Connecting...";
    const formSpacing = compact ? "space-y-3" : "space-y-5";
    const labelClass = "block text-[11px] font-medium uppercase tracking-[0.18em] text-white";
    const phoneGridClass = compact
      ? "grid w-full grid-cols-[7rem_minmax(0,1fr)] gap-1.5"
      : "grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]";
    const selectTriggerClass = compact
      ? "!h-10 !w-full"
      : "!h-12 !w-full";
    const phoneInputClass = compact
      ? "phone-auth-autofill !h-10 !py-0"
      : "phone-auth-autofill !h-12 !py-0";
    const submitButtonClass = compact
      ? "!h-10 w-full rounded-md bg-primary text-[12px] font-medium text-black shadow-none hover:bg-primary/95 sm:text-[13px]"
      : "!h-12 w-full rounded-md bg-primary text-[13px] font-medium text-black shadow-none hover:bg-primary/95 sm:text-[14px]";
    const otpSlotClass = "h-10 w-10 sm:h-11 sm:w-11";
    const selectedCountryDialDigits = normalizePhoneNumber(
      selectedCountry?.dialCode || "",
    );
    const selectedCountryDialCodeLabel = selectedCountryDialDigits
      ? `+${selectedCountryDialDigits}`
      : selectedCountry?.dialCode || "";

    return (
      <form className={`${formSpacing} text-left`} onSubmit={handleSubmit} noValidate>
        <div className="w-full space-y-3">
          {!isOtpStep ? (
            <div className="space-y-2">
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
                    <div className="pointer-events-none flex shrink-0 items-center gap-2 select-none">
                      <CountryFlag code={selectedCountry.code} className="h-5 w-5" />
                      <span
                        className={compact ? "shrink-0 whitespace-nowrap text-[13px] font-medium" : "shrink-0 whitespace-nowrap text-[15px] font-medium"}
                      >
                        {selectedCountryDialCodeLabel}
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
                        className="group cursor-pointer pr-8 text-white data-[highlighted]:bg-white/5 data-[highlighted]:text-white group-data-[state=checked]:pr-14"
                      >
                        <span className="flex w-full items-center gap-0">
                          <CountryFlag code={option.code} className="h-5 w-5" />
                          <span className="ml-3 min-w-0 flex-1 truncate text-[13px]">
                            {option.label}
                          </span>
                          <span className="absolute right-3 text-[13px] text-white/45 group-data-[state=checked]:right-8">
                            +{option.dialCode.replace(/\D/g, "")}
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
                  onKeyDown={(event) => {
                    if (event.ctrlKey || event.metaKey || event.altKey) return;

                    if (event.key.length === 1 && /[a-z]/i.test(event.key)) {
                      event.preventDefault();
                      showDigitsOnlyToast("Phone number can only contain numbers.");
                    }
                  }}
                  onChange={(event) => {
                    const rawValue = event.target.value;
                    if (/[a-z]/i.test(rawValue)) {
                      showDigitsOnlyToast("Phone number can only contain numbers.");
                    }

                    const digits = rawValue.replace(/\D/g, "").slice(0, 15);
                    setPhoneDigits(digits);
                    if (formError) setFormError("");
                  }}
                  className={phoneInputClass}
                />
              </div>
            </div>
          ) : (
            <Field className="w-full gap-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <FieldLabel
                    htmlFor={otpInputId}
                    className="block text-[12px] font-semibold uppercase tracking-[0.2em] text-white"
                  >
                    Verification code
                  </FieldLabel>
                  <p className="mt-1 truncate text-xs text-white/55">
                    6-digit code sent to {pendingPhoneLabel}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleChangePhone}
                  disabled={isSubmitting || isResending}
                  className="self-start h-8 shrink-0 items-start px-2 py-1 text-xs leading-none text-primary hover:!bg-transparent hover:text-primary"
                >
                  Change number
                </Button>
              </div>

              <InputOTP
                ref={otpInputRef}
                id={otpInputId}
                maxLength={OTP_LENGTH}
                value={normalizedOtpDigits}
                autoFocus={shouldAutoFocusOtp}
                onChange={(value) => {
                  setOtpDigits(normalizePhoneNumber(value).slice(0, OTP_LENGTH));
                }}
                inputMode="numeric"
                pattern={REGEXP_ONLY_DIGITS}
                pasteTransformer={(pastedText) => normalizePhoneNumber(pastedText).slice(0, OTP_LENGTH)}
                onKeyDown={(event) => {
                  if (event.ctrlKey || event.metaKey || event.altKey) return;

                  if (event.key.length === 1 && /[a-z]/i.test(event.key)) {
                    event.preventDefault();
                    showDigitsOnlyToast();
                  }
                }}
                onBeforeInput={(event) => {
                  const inputText =
                    event?.nativeEvent?.data ?? event?.data ?? "";

                  if (inputText && /[a-z]/i.test(inputText)) {
                    event.preventDefault();
                    showDigitsOnlyToast();
                  }
                }}
                onPaste={(event) => {
                  const pastedText = event.clipboardData.getData("text");
                  if (/[a-z]/i.test(pastedText)) {
                    showDigitsOnlyToast();
                  }
                }}
                containerClassName="w-full justify-center overflow-hidden px-2"
              >
                <InputOTPGroup className="justify-center">
                  <InputOTPSlot index={0} className={otpSlotClass} />
                  <InputOTPSlot index={1} className={otpSlotClass} />
                  <InputOTPSlot index={2} className={otpSlotClass} />
                  <InputOTPSlot index={3} className={otpSlotClass} />
                  <InputOTPSlot index={4} className={otpSlotClass} />
                  <InputOTPSlot index={5} className={otpSlotClass} />
                </InputOTPGroup>
              </InputOTP>

              <div className="flex items-center justify-between gap-3 text-xs text-white/50">
                <span className={isOtpExpired ? "text-red-400" : "text-white/50"}>
                  {countdownText}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={!canResendOtp}
                  className="h-8 px-2 text-xs text-primary hover:bg-white/[0.06] hover:text-primary"
                >
                  {resendButtonLabel}
                </Button>
              </div>
            </Field>
          )}

          {formError ? (
            <p className="pt-1 text-sm text-red-400" aria-live="polite">
              {formError}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={
            isSubmitting ||
            isResending ||
            (authStep === "otp" && (!isOtpComplete || isOtpExpired))
          }
          className={submitButtonClass}
        >
          {isSubmitting ? (
            <Loader2 className={compact ? "size-[18px] animate-spin" : "size-5 animate-spin"} />
          ) : !isOtpStep ? (
            <img src={whatsappIcon} alt="" className={compact ? "size-[18px]" : "size-5"} />
          ) : null}
          {isSubmitting ? loadingLabel : buttonLabel}
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
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting || isResending || isGoogleLoading}
                  className="!h-10 w-full rounded-md border-white/12 bg-white/[0.03] text-[12px] font-medium text-white hover:bg-white/[0.06] hover:text-white disabled:opacity-70 sm:text-[13px]"
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
                  Sign in with email
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
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting || isResending || isGoogleLoading}
                  className="!h-14 w-full rounded-md border-white/12 bg-white/[0.03] text-sm font-medium text-white hover:bg-white/[0.06] hover:text-white disabled:opacity-70"
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
                      Sign in with email
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
