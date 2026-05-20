import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { signup, verifyOtp, resendOtp } from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";

const initialFormState = {
  fullName: "",
  email: "",
  password: "",
};

function PMRegister({ className, ...props }) {
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setAuthSession } = useAuth();

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timeoutId = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [resendCooldown]);

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
      const signupResult = await signup({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: "PROJECT_MANAGER",
      });

      if (signupResult?.emailDelivery === "not_sent") {
        toast.warning(
          "Verification email could not be delivered. Use Resend Code or check backend logs."
        );
      } else {
        toast.success("Verification code sent. Check your email.");
      }
      setIsVerifying(true);
      setOtpValue("");
    } catch (error) {
      const message = error?.message || "Unable to create Project Manager account.";
      const normalizedMessage = message.toLowerCase();

      if (normalizedMessage.includes("already exists")) {
        try {
          await resendOtp(formData.email.trim().toLowerCase());
          setIsVerifying(true);
          setOtpValue("");
          setResendCooldown(60);
          toast.info("This email is pending verification. A fresh code has been sent.");
          return;
        } catch (resendError) {
          const resendMessage =
            resendError?.message || "Unable to resend verification code.";
          if (String(resendMessage).toLowerCase().includes("already verified")) {
            toast.info("Account already exists. Redirecting to PM login.");
            navigate("/project-manager/login", {
              replace: true,
              state: { email: formData.email.trim().toLowerCase() },
            });
            return;
          }

          setFormError(resendMessage);
          toast.error(resendMessage);
          return;
        }
      }

      if (
        normalizedMessage.includes("verification code email") ||
        normalizedMessage.includes("pending verification")
      ) {
        setIsVerifying(true);
        setOtpValue("");
      }

      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (otpValue.length !== 6) {
      setFormError("Please enter a valid 6-digit code.");
      return;
    }

    setFormError("");
    setIsVerifyingOtp(true);
    try {
      const authPayload = await verifyOtp({
        email: formData.email.trim().toLowerCase(),
        otp: otpValue,
      });

      const role = authPayload?.user?.role;
      if (role !== "PROJECT_MANAGER" && role !== "ADMIN") {
        throw new Error("This verification did not produce a Project Manager account.");
      }

      setAuthSession(authPayload?.user, authPayload?.accessToken);
      toast.success("Project Manager account verified.");
      setFormData(initialFormState);

      const redirectTo = location?.state?.redirectTo;
      navigate(redirectTo || "/project-manager/profile", { replace: true });
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
      toast.success("New verification code sent.");
      setOtpValue("");
      setResendCooldown(60);
    } catch (error) {
      const message = error?.message || "Failed to resend code.";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsResendingOtp(false);
    }
  };

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card className="overflow-hidden border-t-4 border-t-primary">
            <CardContent className="p-0">
              <form
                className="p-6 md:p-8"
                onSubmit={isVerifying ? handleVerifyOtp : handleSubmit}
                noValidate
              >
                <FieldGroup>
                  <div className="mb-4 flex flex-col items-center gap-2 text-center">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      {isVerifying ? "Verify PM Account" : "Register PM Account"}
                    </h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      {isVerifying
                        ? `Enter the code sent to ${formData.email}`
                        : "Create a Project Manager account for the PM portal."}
                    </p>
                  </div>

                  {isVerifying ? (
                    <>
                      <Field>
                        <div className="flex flex-col items-center gap-4 py-2">
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
                        </div>
                      </Field>
                      <Field>
                        <Button type="submit" disabled={isVerifyingOtp} className="w-full">
                          {isVerifyingOtp ? "Verifying..." : "Verify Account"}
                        </Button>
                      </Field>
                      <Field>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResendOtp}
                          disabled={isResendingOtp || resendCooldown > 0}
                          className="w-full gap-2"
                        >
                          {isResendingOtp ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : resendCooldown > 0 ? (
                            `Resend in ${resendCooldown}s`
                          ) : (
                            "Resend Code"
                          )}
                        </Button>
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field>
                        <FieldLabel htmlFor="pmRegisterName">Full Name</FieldLabel>
                        <Input
                          id="pmRegisterName"
                          name="fullName"
                          type="text"
                          placeholder="Project manager name"
                          autoComplete="name"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="pmRegisterEmail">Email</FieldLabel>
                        <Input
                          id="pmRegisterEmail"
                          name="email"
                          type="email"
                          placeholder="manager@example.com"
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="pmRegisterPassword">Password</FieldLabel>
                        <div className="relative">
                          <Input
                            id="pmRegisterPassword"
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
                            className="absolute top-0 right-0 flex h-full cursor-pointer select-none items-center px-3 text-zinc-400 hover:text-foreground"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </Field>
                      <Field>
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                          {isSubmitting ? "Creating..." : "Create PM Account"}
                        </Button>
                      </Field>
                    </>
                  )}

                  {formError ? (
                    <FieldDescription
                      className="text-destructive text-sm text-center"
                      aria-live="polite"
                    >
                      {formError}
                    </FieldDescription>
                  ) : null}
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
          <div className="text-center text-xs text-muted-foreground">
            {isVerifying ? (
              <button
                type="button"
                onClick={() => {
                  setIsVerifying(false);
                  setOtpValue("");
                  setFormError("");
                }}
                className="underline underline-offset-4 hover:text-foreground"
              >
                Back to registration form
              </button>
            ) : (
              <>
                Already have a PM account?{" "}
                <Link
                  to="/project-manager/login"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PMRegister;

PMRegister.propTypes = {
  className: PropTypes.string,
};
