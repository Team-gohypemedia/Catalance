import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { verifyResetToken, resetPassword } from "@/shared/lib/api-client";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";

function ResetPassword({ className, ...props }) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [isVerifying, setIsVerifying] = useState(true);
    const [isValidToken, setIsValidToken] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const checkToken = async () => {
            if (!token) {
                toast.error("Invalid reset link");
                setIsVerifying(false);
                return;
            }

            try {
                const result = await verifyResetToken(token);
                if (result.valid) {
                    setIsValidToken(true);
                    setUserEmail(result.email || "");
                } else {
                    toast.error("This reset link is invalid or has expired");
                }
            } catch (error) {
                toast.error("Failed to verify reset link");
            } finally {
                setIsVerifying(false);
            }
        };

        checkToken();
    }, [token]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        setIsSubmitting(true);

        try {
            await resetPassword({ token, password });
            toast.success("Password reset successfully!");
            navigate("/login", { replace: true });
        } catch (error) {
            const message = error?.message || "Failed to reset password. Please try again.";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Verifying reset link...</p>
                </div>
            </div>
        );
    }

    if (!isValidToken) {
        return (
            <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
                <div className="w-full mt-10 max-w-sm">
                    <div className={cn("flex flex-col gap-6", className)} {...props}>
                        <Card>
                            <CardContent className="p-6 md:p-8">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                                        <svg
                                            className="h-6 w-6 text-red-600 dark:text-red-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                            />
                                        </svg>
                                    </div>
                                    <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
                                    <p className="text-muted-foreground text-sm text-balance">
                                        This password reset link is invalid or has expired. Links expire after 1 hour.
                                    </p>
                                    <div className="flex flex-col gap-2 w-full mt-4">
                                        <Button onClick={() => navigate("/forgot-password")}>
                                            Request new link
                                        </Button>
                                        <Button onClick={() => navigate("/login")} variant="outline">
                                            Back to login
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full mt-10 max-w-sm">
                <div className={cn("flex flex-col gap-6", className)} {...props}>
                    <Card>
                        <CardContent className="p-6 md:p-8">
                            <form onSubmit={handleSubmit} noValidate>
                                <FieldGroup>
                                    <div className="flex flex-col gap-2 text-center">
                                        <h1 className="text-2xl font-bold">
                                            Reset your password
                                        </h1>
                                        {userEmail && (
                                            <p className="text-muted-foreground text-sm text-balance">
                                                Enter a new password for <strong>{userEmail}</strong>
                                            </p>
                                        )}
                                    </div>
                                    <Field>
                                        <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                autoComplete="new-password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pr-10"
                                                required
                                                autoFocus
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
                                        <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                autoComplete="new-password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="pr-10"
                                                required
                                            />
                                            <div
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute top-0 right-0 h-full px-3 flex items-center cursor-pointer select-none text-zinc-400 hover:text-white"
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </div>
                                        </div>
                                    </Field>
                                    <Field>
                                        <Button type="submit" disabled={isSubmitting} className="w-full">
                                            {isSubmitting ? "Resetting..." : "Reset password"}
                                        </Button>
                                    </Field>
                                    <FieldDescription className="text-center">
                                        Remember your password?{" "}
                                        <a href="/login" className="text-primary hover:underline">
                                            Back to login
                                        </a>
                                    </FieldDescription>
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;

ResetPassword.propTypes = {
    className: PropTypes.string
};
