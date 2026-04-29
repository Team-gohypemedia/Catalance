import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginWithGoogle } from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";
import { resolveWorkspaceHomePath } from "@/shared/lib/dashboard-preference";
import logo from "@/assets/logos/logo.svg";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Search from "lucide-react/dist/esm/icons/search";

const CLIENT_ROLE = "CLIENT";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;
const PASSWORD_REQUIREMENT_MESSAGE =
  "Use at least 8 characters, including 1 uppercase letter, 1 number, and 1 special character.";

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

function EmailSignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: setAuthSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = "Sign up | Catalance";
  }, []);

  const selectedRole = searchParams.get("role")?.toUpperCase() || CLIENT_ROLE;

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setFormError("Enter a valid email address to continue.");
      return;
    }

    if (!PASSWORD_PATTERN.test(password)) {
      toast.error(PASSWORD_REQUIREMENT_MESSAGE);
      return;
    }

    const roleParam = searchParams.get("role");
    const nextPath = roleParam ? `/signup?role=${encodeURIComponent(roleParam)}` : "/signup";

    navigate(nextPath, {
      state: {
        email: normalizedEmail,
        password,
        signupSource: "email",
      },
    });
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setFormError("");

    try {
      const { signInWithGoogle } = await import("@/shared/lib/firebase");
      const firebaseUser = await signInWithGoogle();
      const idToken = await firebaseUser.getIdToken();
      const authPayload = await loginWithGoogle(idToken, selectedRole, "signup");

      if (!authPayload?.user || !authPayload?.accessToken) {
        throw new Error("Unable to complete Google sign-up. Please try again.");
      }

      const googleAvatar = getGoogleAvatarFromFirebaseUser(firebaseUser);
      const sessionUser = mergeAuthUserWithAvatar(authPayload.user, googleAvatar);

      setAuthSession(sessionUser, authPayload.accessToken);
      toast.success(
        `Welcome, ${sessionUser?.fullName || firebaseUser.displayName || "User"}!`,
      );
      navigate(resolveWorkspaceHomePath(sessionUser), { replace: true });
    } catch (error) {
      console.error("Google sign-up error:", error);
      const message = error?.message || "Unable to sign up with Google.";
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleClick = () => {
    toast.info("Apple sign-up is not connected yet.");
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
                Hire verified freelancers for your next project.
              </p>
            </div>

            <section className="mt-3 w-full">
              <Card className="mx-auto mt-3 w-full rounded-lg border border-white/10 bg-[#101010]/90 p-3.5 shadow-none backdrop-blur-2xl">
                <form className="space-y-3" onSubmit={handleSubmit} noValidate>
                  <div className="w-full space-y-2">
                    <Input
                      id="emailAddress"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      aria-label="Email address"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (formError) setFormError("");
                      }}
                      className="!h-10 !py-0 rounded-md border-white/10 bg-[#171717] px-3 text-[13px] leading-none text-white/90 placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:border-primary/60 focus-visible:ring-primary/20"
                    />
                  </div>

                  <div className="w-full space-y-2">
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        aria-label="Password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          if (formError) setFormError("");
                        }}
                        className="!h-10 !py-0 rounded-md border-white/10 bg-[#171717] px-3 pr-10 text-[13px] leading-none text-white/90 placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:border-primary/60 focus-visible:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-white/42 transition-colors hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {formError ? (
                    <p className="pt-1 text-sm text-red-400" aria-live="polite">
                      {formError}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    className="!h-11 w-full rounded-md bg-primary text-[15px] font-medium text-black shadow-none hover:bg-primary/95"
                  >
                    Continue
                    <ArrowRight className="size-[0.95rem]" />
                  </Button>
                </form>
              </Card>

              <div className="mt-2.5 flex items-center gap-3 text-white/42">
                <span className="h-px flex-1 bg-white/12" />
                <span className="text-[11px] tracking-[0.18em]">or</span>
                <span className="h-px flex-1 bg-white/12" />
              </div>

              <div className="mt-2.5 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignUp}
                  disabled={isGoogleLoading}
                  className="!h-10 w-full rounded-md border-white/12 bg-white/[0.03] text-[13px] font-medium text-white hover:bg-white/[0.06] hover:text-white"
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
                  {isGoogleLoading ? "Signing up..." : "Continue with Google"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAppleClick}
                  disabled={isGoogleLoading}
                  className="!h-10 w-full rounded-md border-white/12 bg-white/[0.03] text-[13px] font-medium text-white hover:bg-white/[0.06] hover:text-white"
                >
                  <AppleLogo className="size-[18px] text-white" />
                  Continue with Apple
                </Button>
              </div>

              <p className="mt-2.5 text-center text-[0.82rem] text-white/68">
                <Link
                  to="/signup/phone"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Sign up with phone instead
                </Link>
              </p>

              <p className="mt-2.5 text-center text-[0.82rem] text-white/68">
                Already have an account?{" "}
                <Link
                  to="/login/phone"
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
                  Hire verified freelancers for your next project.
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
                  <p className="mb-6 px-4 text-center text-3xl font-semibold text-white sm:px-6 md:mb-7 md:px-12">
                    Sign up
                  </p>
                  <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                    <div className="space-y-3">
                      <Input
                        id="emailAddressDesktop"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        aria-label="Email address"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (formError) setFormError("");
                        }}
                        className="!h-12 !py-0 rounded-md border-white/10 bg-[#171717] px-4 text-[15px] leading-none text-white/90 placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:border-primary/60 focus-visible:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          id="passwordDesktop"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          aria-label="Password"
                          placeholder="Create a password"
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);
                            if (formError) setFormError("");
                          }}
                          className="!h-12 !py-0 rounded-md border-white/10 bg-[#171717] px-4 pr-11 text-[15px] leading-none text-white/90 placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:border-primary/60 focus-visible:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-white/42 transition-colors hover:text-white"
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {formError ? (
                      <p className="pt-1 text-sm text-red-400" aria-live="polite">
                        {formError}
                      </p>
                    ) : null}

                    <Button
                      type="submit"
                      className="!h-14 w-full rounded-md bg-primary text-lg font-medium text-black shadow-none hover:bg-primary/95 sm:text-xl"
                    >
                      Continue
                      <ArrowRight className="size-5" />
                    </Button>

                    <div className="flex items-center gap-4 text-white/42">
                      <span className="h-px flex-1 bg-white/12" />
                      <span className="text-sm tracking-[0.28em]">OR</span>
                      <span className="h-px flex-1 bg-white/12" />
                    </div>

                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleSignUp}
                        disabled={isGoogleLoading}
                        className="!h-14 w-full rounded-md border-white/12 bg-white/[0.03] text-base font-medium text-white hover:bg-white/[0.06] hover:text-white"
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
                        {isGoogleLoading
                          ? "Signing up..."
                          : "Continue with Google"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAppleClick}
                        disabled={isGoogleLoading}
                        className="!h-14 w-full rounded-md border-white/12 bg-white/[0.03] text-base font-medium text-white hover:bg-white/[0.06] hover:text-white"
                      >
                        <AppleLogo className="size-5" />
                        Continue with Apple
                      </Button>
                    </div>

                    <div className="space-y-4 text-center">
                      <Link
                        to="/signup/phone"
                        className="inline-flex text-lg text-primary underline-offset-4 hover:underline"
                      >
                        Sign up with phone instead
                      </Link>

                      <p className="text-base text-white/68">
                        Already have an account?{" "}
                        <Link
                          to="/login/email"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          Log in
                        </Link>
                      </p>
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

export default EmailSignUp;
