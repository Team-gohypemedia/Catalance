import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login } from "@/shared/lib/api-client";
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
import logo from "@/assets/logos/logo.svg";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Mail from "lucide-react/dist/esm/icons/mail";
import Search from "lucide-react/dist/esm/icons/search";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";

const PHONE_PATTERN = /^[+\d][\d\s()-]*$/;
const MIN_PHONE_DIGITS = 6;
const WHATSAPP_SUPPORT_URL = "https://wa.me/918882855425";

const isValidPhoneNumber = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return false;

  return (
    PHONE_PATTERN.test(normalized) &&
    normalized.replace(/\D/g, "").length >= MIN_PHONE_DIGITS
  );
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

function WhatsAppSVG({ className = "size-[18px]" }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
    >
      <path
        fill="#25D366"
        d="M16.6 14c-.2-.1-1.5-.7-1.7-.8c-.2-.1-.4-.1-.6.1c-.2.2-.6.8-.8 1c-.1.2-.3.2-.5.1c-.7-.3-1.4-.7-2-1.2c-.5-.5-1-1.1-1.4-1.7c-.1-.2 0-.4.1-.5c.1-.1.2-.3.4-.4c.1-.1.2-.3.2-.4c.1-.1.1-.3 0-.4c-.1-.1-.6-1.3-.8-1.8c-.1-.7-.3-.7-.5-.7h-.5c-.2 0-.5.2-.6.3c-.6.6-.9 1.3-.9 2.1c.1.9.4 1.8 1 2.6c1.1 1.6 2.5 2.9 4.2 3.7c.5.2.9.4 1.4.5c.5.2 1 .2 1.6.1c.7-.1 1.3-.6 1.7-1.2c.2-.4.2-.8.1-1.2l-.4-.2m2.5-9.1C15.2 1 8.9 1 5 4.9c-3.2 3.2-3.8 8.1-1.6 12L2 22l5.3-1.4c1.5.8 3.1 1.2 4.7 1.2c5.5 0 9.9-4.4 9.9-9.9c.1-2.6-1-5.1-2.8-7m-2.7 14c-1.3.8-2.8 1.3-4.4 1.3c-1.5 0-2.9-.4-4.2-1.1l-.3-.2l-3.1.8l.8-3l-.2-.3c-2.4-4-1.2-9 2.7-11.5S16.6 3.7 19 7.5c2.4 3.9 1.3 9-2.6 11.4"
      />
    </svg>
  );
}

function PhoneLogin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: setAuthSession } = useAuth();

  const [identifier, setIdentifier] = useState(() =>
    typeof location.state?.identifier === "string"
      ? location.state.identifier
      : typeof location.state?.phoneNumber === "string"
        ? location.state.phoneNumber
        : "",
  );

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Log in | Catalance";
  }, []);

  const redirectParam = searchParams.get("redirect");
  const openMessageParam = searchParams.get("openMessage");
  const loginSearch = searchParams.toString();
  const emailLoginPath = loginSearch ? `/login/email?${loginSearch}` : "/login/email";

  const buildReturnUrl = () => {
    if (!redirectParam) return null;
    const extra = openMessageParam ? `?openMessage=${openMessageParam}` : "";
    return `${redirectParam}${extra}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const normalizedIdentifier = identifier.trim();

    if (!isValidPhoneNumber(normalizedIdentifier)) {
      setFormError("Enter a valid phone number to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestedRole =
        searchParams.get("role")?.toUpperCase() ||
        (typeof location.state?.role === "string"
          ? location.state.role.toUpperCase()
          : undefined);

      const authPayload = await login({
        identifier: normalizedIdentifier,
        role: requestedRole,
      });

      if (authPayload?.requiresVerification) {
        toast.info(authPayload.message || "Please verify your email.");
        navigate("/Logup", {
          state: {
            verifyEmail: authPayload.email,
            showVerification: true,
          },
          replace: true,
        });
        return;
      }

      setAuthSession(authPayload?.user, authPayload?.accessToken);
      toast.success("Loged in successfully.");
      setIdentifier("");

      const redirectTo = buildReturnUrl() || location?.state?.redirectTo;

      navigateAfterLogin({
        navigate,
        redirectTo,
        requestedRole,
        user: authPayload?.user,
      });
    } catch (error) {
      const message = error?.message || "Unable to Log in with those details.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialClick = (provider) => {
    toast.info(`${provider} Log-in is not connected yet.`);
  };

  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="relative mx-auto min-h-svh w-full max-w-[88rem] px-4 py-2 sm:px-10 lg:px-12 lg:py-8">
        <div className="lg:hidden flex min-h-[calc(100svh-1rem)] w-full items-center">
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
                <form className="space-y-3" onSubmit={handleSubmit} noValidate>
                  <div className="w-full space-y-2">
                    <Input
                      id="loginIdentifier"
                      name="identifier"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      autoCapitalize="none"
                      spellCheck={false}
                      aria-label="Phone number"
                      placeholder="999 999 9999"
                      value={identifier}
                      onChange={(event) => {
                        setIdentifier(event.target.value);
                        if (formError) setFormError("");
                      }}
                      className="!h-10 !py-0 rounded-md border-white/10 bg-[#171717] px-3 text-[13px] leading-none text-white/90 placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:border-primary/60 focus-visible:ring-primary/20"
                    />

                    {formError ? (
                      <p className="pt-1 text-sm text-red-400" aria-live="polite">
                        {formError}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="!h-11 w-full rounded-md bg-primary text-[15px] font-medium text-black shadow-none hover:bg-primary/95"
                  >
                    {isSubmitting ? "Logging in..." : "Log in"}
                    {isSubmitting ? (
                      <Loader2 className="size-[0.95rem] animate-spin" />
                    ) : (
                      <ArrowRight className="size-[0.95rem]" />
                    )}
                  </Button>
                </form>
              </Card>

              <div className="mt-2.5 flex items-center gap-3 text-white/42">
                <span className="h-px flex-1 bg-white/12" />
                <span className="text-[11px] tracking-[0.18em]">or</span>
                <span className="h-px flex-1 bg-white/12" />
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
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

                <Button
                  asChild
                  variant="outline"
                  className="!h-10 w-full rounded-md border-emerald-500/20 bg-emerald-500/5 text-[12px] font-medium text-emerald-50 hover:bg-emerald-500/10 hover:text-white sm:text-[13px]"
                >
                  <a
                    href={WHATSAPP_SUPPORT_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="gap-2"
                  >
                    <WhatsAppSVG className="size-[18px]" />
                    WhatsApp
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="!h-10 w-full rounded-md border-primary/20 bg-primary/5 text-[12px] font-medium text-white hover:bg-primary/10 hover:text-white sm:text-[13px]"
                >
                  <Link to={emailLoginPath} className="gap-2">
                    <Mail className="size-[18px]" />
                    Email
                  </Link>
                </Button>
              </div>

              <p className="mt-2.5 text-center text-[0.82rem] text-white/68">
                Need an account?{" "}
                <Link
                  to="/Logup/phone"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Log in
                </Link>
              </p>

              <p className="mx-auto mt-2.5 max-w-[19rem] text-center text-[11px] leading-4 text-white/58">
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
            </section>
          </div>
        </div>

        <div className="hidden lg:grid min-h-[calc(100svh-4rem)] w-full items-center gap-12 xl:grid-cols-[1.05fr_0.95fr] xl:gap-16">
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
                <div className="relative p-6 sm:p-8 md:p-12">
                  <p className="px-4 text-center text-3xl font-semibold uppercase text-white sm:px-6 md:px-12">
                    Login
                  </p>

                  <p className="mb-4 px-4 text-center text-md text-nowrap text-white/72 sm:px-6 md:px-12">
                    Use your phone number to continue.
                  </p>

                  <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                    <div className="space-y-3">
                      <Input
                        id="loginIdentifierDesktop"
                        name="identifier"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        autoCapitalize="none"
                        spellCheck={false}
                        aria-label="Phone number"
                        placeholder="999 999 9999"
                        value={identifier}
                        onChange={(event) => {
                          setIdentifier(event.target.value);
                          if (formError) setFormError("");
                        }}
                        className="!h-12 !py-0 rounded-md border-white/10 bg-[#171717] px-4 text-[15px] leading-none text-white/90 placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:border-primary/60 focus-visible:ring-primary/20"
                      />

                      {formError ? (
                        <p className="pt-1 text-sm text-red-400" aria-live="polite">
                          {formError}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="!h-14 w-full rounded-md bg-primary text-lg font-medium text-black shadow-none hover:bg-primary/95 sm:text-xl"
                    >
                      {isSubmitting ? "Loging in..." : "Log in"}
                      {isSubmitting ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <ArrowRight className="size-5" />
                      )}
                    </Button>

                    <div className="flex items-center gap-4 text-white/42">
                      <span className="h-px flex-1 bg-white/12" />
                      <span className="text-sm tracking-[0.28em]">OR</span>
                      <span className="h-px flex-1 bg-white/12" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
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

                      <Button
                        asChild
                        variant="outline"
                        className="!h-14 w-full rounded-md border-emerald-500/20 bg-emerald-500/5 text-sm font-medium text-emerald-50 hover:bg-emerald-500/10 hover:text-white"
                      >
                        <a
                          href={WHATSAPP_SUPPORT_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="gap-2"
                        >
                          <WhatsAppSVG className="size-5" />
                          Continue with WhatsApp
                        </a>
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        className="!h-14 w-full rounded-md border-primary/20 bg-primary/5 text-sm font-medium text-white hover:bg-primary/10 hover:text-white"
                      >
                        <Link to={emailLoginPath} className="gap-2">
                          <Mail className="size-5 text-primary" />
                          Continue with Email
                        </Link>
                      </Button>
                    </div>

                    <div className="space-y-4 text-center">
                      <Link
                        to="/Signup/phone"
                        className="inline-flex text-lg text-white/58 underline-offset-4 hover:underline"
                      >
                        Need an account?&nbsp;<span className="text-primary">Sign up</span>
                      </Link>
                    </div>
                  </form>
                </div>
              </Card>

              <p className="mt-10 px-4 text-center text-[13px] leading-relaxed text-white/58 sm:text-sm sm:whitespace-nowrap">
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

export default PhoneLogin;
