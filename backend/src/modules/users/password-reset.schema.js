import { z } from "zod";

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email("Please provide a valid email address")
            .transform((email) => email.toLowerCase().trim())
    })
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Reset token is required"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .max(128, "Password must not exceed 128 characters")
    })
});
