import { z } from "zod";

export const userRoleEnum = z.enum(["CLIENT", "FREELANCER", "ADMIN"]);

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    fullName: z.string().min(2).max(120),
    password: z.string().min(8).max(72),
    role: userRoleEnum.default("FREELANCER"),
    bio: z.string().max(500).optional(),
    skills: z.array(z.string()).default([])
  })
});

export const listUsersSchema = z.object({
  query: z.object({
    role: userRoleEnum.optional(),
    status: z.string().optional(),
    onboardingComplete: z.union([z.string(), z.boolean()]).optional(),
    requiredSkills: z.union([z.string(), z.array(z.string())]).optional()
  })
});

export const loginSchema = z.object({
  body: z
    .object({
      email: z.string().trim().min(1).max(255).optional(),
      identifier: z.string().trim().min(1).max(255).optional(),
      password: z.string().min(8).max(72),
      role: userRoleEnum.optional()
    })
    .refine((data) => Boolean(data.email || data.identifier), {
      message: "Email or phone number is required",
      path: ["email"]
    })
});

export const emailOtpRequestSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255),
    role: userRoleEnum.optional()
  })
});

export const emailOtpVerifySchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255),
    otp: z.string().trim().regex(/^\d{4,8}$/, "OTP must contain only digits"),
    role: userRoleEnum.optional()
  })
});

export const googleLoginSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    role: userRoleEnum.optional(),
    mode: z.enum(["login", "signup"]).optional()
  })
});

const whatsappPhoneFields = {
  countryCode: z.string().trim().min(1).max(8),
  phoneNumber: z.string().trim().min(6).max(32),
  role: userRoleEnum.optional()
};

export const whatsappOtpRequestSchema = z.object({
  body: z.object(whatsappPhoneFields)
});

export const whatsappOtpVerifySchema = z.object({
  body: z.object({
    ...whatsappPhoneFields,
    otp: z.string().trim().regex(/^\d{4,8}$/, "OTP must contain only digits")
  })
});
