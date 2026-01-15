import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { forgotPassword } from "@/shared/lib/api-client";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";

function ForgotPassword({ className, ...props }) {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await forgotPassword(email.trim().toLowerCase());
            toast.success("Check your email for reset instructions");
            setIsSuccess(true);
        } catch (error) {
            const message = error?.message || "Failed to process request. Please try again.";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
                <div className="w-full mt-10 max-w-sm">
                    <div className={cn("flex flex-col gap-6", className)} {...props}>
                        <Card>
                            <CardContent className="p-6 md:p-8">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                                        <svg
                                            className="h-6 w-6 text-green-600 dark:text-green-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <h1 className="text-2xl font-bold">Check your email</h1>
                                    <p className="text-muted-foreground text-sm text-balance">
                                        If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        The link will expire in 1 hour.
                                    </p>
                                    <Button
                                        onClick={() => navigate("/login")}
                                        variant="outline"
                                        className="mt-4 w-full"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to login
                                    </Button>
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
                                            Forgot your password?
                                        </h1>
                                        <p className="text-muted-foreground text-sm text-balance">
                                            Enter your email address and we'll send you a link to reset your password
                                        </p>
                                    </div>
                                    <Field>
                                        <FieldLabel htmlFor="forgotEmail">Email</FieldLabel>
                                        <Input
                                            id="forgotEmail"
                                            name="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </Field>
                                    <Field>
                                        <Button type="submit" disabled={isSubmitting} className="w-full">
                                            {isSubmitting ? "Sending..." : "Send reset link"}
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

export default ForgotPassword;

ForgotPassword.propTypes = {
    className: PropTypes.string
};
