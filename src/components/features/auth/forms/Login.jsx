import { useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import PropTypes from "prop-types";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import image from "@/assets/img.jpg";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login, loginWithGoogle } from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";

const initialFormState = {
  email: "",
  password: "",
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
    apiUser?.avatar || existingIdentityAvatar || fallbackAvatar
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
        profilePhoto:
          existingIdentityAvatar || resolvedAvatar,
      },
    },
  };
};

function Login({ className, ...props }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { login: setAuthSession } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const requestedRole =
        searchParams.get("role")?.toUpperCase() ||
        (typeof location.state?.role === "string"
          ? location.state.role.toUpperCase()
          : undefined);

      const authPayload = await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: requestedRole,
      });

      // Handle unverified user - redirect to verification
      if (authPayload?.requiresVerification) {
        toast.info(authPayload.message || "Please verify your email.");
        navigate("/signup", {
          state: {
            verifyEmail: authPayload.email,
            showVerification: true,
          },
          replace: true,
        });
        return;
      }

      setAuthSession(authPayload?.user, authPayload?.accessToken);
      toast.success("Logged in successfully.");
      setFormData(initialFormState);
      const nextRole = authPayload?.user?.role?.toUpperCase();
      const redirectTo = location?.state?.redirectTo;
      const normalizedRequestedRole =
        requestedRole === "CLIENT" || requestedRole === "FREELANCER"
          ? requestedRole
          : null;

      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else if (normalizedRequestedRole === "CLIENT") {
        navigate("/client", { replace: true });
      } else if (normalizedRequestedRole === "FREELANCER") {
        navigate("/freelancer", { replace: true });
      } else if (nextRole === "CLIENT") {
        navigate("/client", { replace: true });
      } else if (nextRole === "PROJECT_MANAGER") {
        navigate("/project-manager", { replace: true });
      } else if (nextRole === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/freelancer", { replace: true });
      }
    } catch (error) {
      const message = error?.message || "Unable to log in with those details.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setFormError("");
    const selectedRole =
      searchParams.get("role")?.toUpperCase() || location.state?.role;
    try {
      const { signInWithGoogle } = await import("@/shared/lib/firebase");
      // Sign in with Firebase Google
      const firebaseUser = await signInWithGoogle();
      const idToken = await firebaseUser.getIdToken();

      // Perform backend Google auth (auto-creates account when missing)
      const authPayload = await loginWithGoogle(idToken, selectedRole, "signup");
      const googleAvatar = getGoogleAvatarFromFirebaseUser(firebaseUser);
      const sessionUser = mergeAuthUserWithAvatar(authPayload?.user, googleAvatar);

      setAuthSession(sessionUser, authPayload?.accessToken);
      toast.success(`Welcome, ${authPayload?.user?.fullName || "User"}!`);

      const nextRole = authPayload?.user?.role?.toUpperCase();
      const redirectTo = location?.state?.redirectTo;
      const requestedRole =
        typeof selectedRole === "string"
          ? selectedRole.toUpperCase()
          : typeof location.state?.role === "string"
            ? location.state.role.toUpperCase()
            : null;
      const normalizedRequestedRole =
        requestedRole === "CLIENT" || requestedRole === "FREELANCER"
          ? requestedRole
          : null;

      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else if (normalizedRequestedRole === "CLIENT") {
        navigate("/client", { replace: true });
      } else if (normalizedRequestedRole === "FREELANCER") {
        navigate("/freelancer", { replace: true });
      } else if (nextRole === "CLIENT") {
        navigate("/client", { replace: true });
      } else if (nextRole === "PROJECT_MANAGER") {
        navigate("/project-manager", { replace: true });
      } else if (nextRole === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/freelancer", { replace: true });
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      const message = error?.message || "Unable to sign in with Google.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full mt-10 max-w-md md:max-w-5xl">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <form className="p-8 md:p-12" onSubmit={handleSubmit} noValidate>
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">
                      Login to your account
                    </h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      Enter your email below to log in to your account
                    </p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="loginEmail">Email</FieldLabel>
                    <Input
                      id="loginEmail"
                      name="email"
                      type="email"
                      placeholder="m@example.com"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="loginPassword">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="loginPassword"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        className="pr-10"
                        placeholder="••••••••"
                        required
                      />
                      <div
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-0 right-0 h-full px-3 flex items-center cursor-pointer select-none text-zinc-400 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    <FieldDescription>
                      Must be at least 8 characters long.
                    </FieldDescription>
                    <div className="text-sm text-right">
                      <a
                        href="/forgot-password"
                        className="text-primary hover:underline"
                      >
                        Forgot password?
                      </a>
                    </div>
                  </Field>
                  <Field>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Signing in..." : "Log In"}
                    </Button>
                  </Field>
                  {formError ? (
                    <FieldDescription
                      className="text-destructive text-sm"
                      aria-live="polite"
                    >
                      {formError}
                    </FieldDescription>
                  ) : null}
                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                    Or continue with
                  </FieldSeparator>
                  <Field>
                    <Button
                      variant="outline"
                      type="button"
                      className="flex items-center justify-center gap-2 w-full"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading || isSubmitting}
                    >
                      {isGoogleLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <img
                          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                          alt="Google logo"
                          className="h-5 w-5"
                        />
                      )}
                      <span className="font-medium">
                        {isGoogleLoading
                          ? "Signing in..."
                          : "Continue with Google"}
                      </span>
                    </Button>
                  </Field>
                  <div className="text-center text-sm text-muted-foreground space-y-1">
                    <p>
                      Don&apos;t have an account?{" "}
                      <Link
                        to="/get-started"
                        className="underline hover:text-primary"
                      >
                        Sign up
                      </Link>
                    </p>
                  </div>
                </FieldGroup>
              </form>
              <div className="bg-muted relative hidden md:block">
                <img
                  src={image}
                  alt="Login illustration"
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-75"
                />
              </div>
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center">
            By clicking continue, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </Link>
            .
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}

export default Login;

Login.propTypes = {
  className: PropTypes.string,
};
