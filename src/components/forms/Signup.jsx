import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { signup, login, verifyOtp, resendOtp } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const initialFormState = {
  fullName: "",
  email: "",
  password: "",
};

const CLIENT_ROLE = "CLIENT";

function Signup({ className, ...props }) {
  const location = useLocation();
  const [formData, setFormData] = useState(() => {
    // Pre-fill email if redirected from login for verification
    if (location.state?.verifyEmail) {
      return { ...initialFormState, email: location.state.verifyEmail };
    }
    return initialFormState;
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Verification State - auto-enter verification mode if redirected from login
  const [isVerifying, setIsVerifying] = useState(!!location.state?.showVerification);
  const [otpValue, setOtpValue] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();
  const { login: setAuthSession, logout, isAuthenticated } = useAuth();

  // Clear existing session on mount
  useEffect(() => {
    if (isAuthenticated) {
      logout();
    }
  }, [logout, isAuthenticated]);

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
      await signup({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: CLIENT_ROLE,
      });

      // Instead of logging in, switch to verification mode
      toast.success("Verification code sent! Please check your email.");
      setIsVerifying(true);
    } catch (error) {
      const message = error?.message || "Unable to create your account right now.";
      
      if (message.toLowerCase().includes("already exists")) {
        toast.info("Account already exists. Redirecting to login...");
        setTimeout(() => navigate("/login", { state: { email: formData.email } }), 1000);
        return;
      }

      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      setFormError("Please enter a valid 6-digit code.");
      return;
    }

    setFormError("");
    setIsVerifyingOtp(true);

    try {
      // Calls backend verifyOtp which validates code and returns token
      const authPayload = await verifyOtp({
        email: formData.email.trim().toLowerCase(),
        otp: otpValue,
      });

      setAuthSession(authPayload?.user, authPayload?.accessToken);
      toast.success("Email verified! Welcome to Catalance.");
      setFormData(initialFormState);

      const nextRole = authPayload?.user?.role?.toUpperCase() || CLIENT_ROLE;
      navigate(nextRole === "CLIENT" ? "/client" : "/freelancer", {
        replace: true,
      });
    } catch (error) {
      const message = error?.message || "Invalid verification code. Please try again.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setFormError("");
    setIsResendingOtp(true);
    
    try {
      await resendOtp(formData.email.trim().toLowerCase());
      toast.success("New verification code sent! Check your email.");
      setOtpValue("");
      // Start 60 second cooldown
      setResendCooldown(60);
    } catch (error) {
      const message = error?.message || "Failed to resend code. Please try again.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsResendingOtp(false);
    }
  };

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);


  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setFormError("");
    try {
      // Sign in with Firebase Google
      const firebaseUser = await signInWithGoogle();
      
      // Try to create account or log in if exists
      let authPayload;
      try {
        // Try to sign up
        authPayload = await signup({
          fullName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email,
          password: firebaseUser.uid, // Use Firebase UID as password
          role: CLIENT_ROLE,
        });
      } catch (signupError) {
        // If user already exists, try to log in
        if (signupError?.message?.includes("already exists")) {
          authPayload = await login({
            email: firebaseUser.email,
            password: firebaseUser.uid
          });
        } else {
          throw signupError;
        }
      }
      
      setAuthSession(authPayload?.user, authPayload?.accessToken);
      toast.success(`Welcome, ${firebaseUser.displayName || 'User'}!`);
      
      navigate("/client", { replace: true });
    } catch (error) {
      console.error("Google sign-up error:", error);
      const message = error?.message || "Unable to sign up with Google.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const renderForm = () => (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full mt-10 max-w-md md:max-w-5xl">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <form className="p-8 md:p-12" onSubmit={isVerifying ? handleVerifyOtp : handleSubmit} noValidate>
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">{isVerifying ? "Verify your email" : "Create your account"}</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      {isVerifying 
                        ? `Enter the code sent to ${formData.email}` 
                        : "Enter your details below to create your account"}
                    </p>
                    {!isVerifying && (
                      <p className="text-xs uppercase tracking-[0.35em] text-primary">
                        You&apos;re creating a client account.
                      </p>
                    )}
                  </div>

                  {isVerifying ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                       <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                      {formError ? (
                        <p className="text-destructive text-sm font-medium">{formError}</p>
                      ) : null}
                      <Button type="submit" disabled={isVerifyingOtp} className="w-full">
                        {isVerifyingOtp ? "Verifying..." : "Verify Email"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleResendOtp}
                        disabled={isResendingOtp || resendCooldown > 0}
                        className="w-full gap-2"
                      >
                        {isResendingOtp ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        {resendCooldown > 0 
                          ? `Resend in ${resendCooldown}s` 
                          : isResendingOtp 
                            ? "Sending..." 
                            : "Resend Code"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsVerifying(false)}
                        className="text-sm text-muted-foreground"
                      >
                        Back to Signup
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Field>
                        <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                        <Input
                          id="fullName"
                          name="fullName"
                          type="text"
                          placeholder="Jane Doe"
                          autoComplete="name"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                          id="email"
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
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handleChange}
                            className="pr-10"
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
                      </Field>

                      <Field>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Sending verification..." : "Create Account"}
                        </Button>
                      </Field>

                      {formError ? (
                        <FieldDescription className="text-destructive text-sm" aria-live="polite">
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
                          onClick={handleGoogleSignUp}
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
                            {isGoogleLoading ? "Signing up..." : "Continue with Google"}
                          </span>
                        </Button>
                      </Field>

                      <FieldDescription className="text-center">
                        Already have an account? <Link to="/login" className="underline hover:text-primary">Sign in</Link>
                      </FieldDescription>
                    </>
                  )}
                </FieldGroup>
              </form>

              <div className="bg-muted relative hidden md:block">
                <img
                  src={image}
                  alt="Signup illustration"
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
              </div>
            </CardContent>
          </Card>

          <FieldDescription className="px-6 text-center">
            By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </FieldDescription>
        </div>
      </div>
    </div>
  );

  return renderForm();
}

export default Signup;

Signup.propTypes = {
  className: PropTypes.string,
};

