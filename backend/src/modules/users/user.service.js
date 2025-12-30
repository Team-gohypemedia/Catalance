import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { env } from "../../config/env.js";
import { ensureResendClient } from "../../lib/resend.js";
import { hashPassword, verifyPassword, verifyLegacyPassword } from "./password.utils.js";
import {
  generatePasswordResetEmail,
  generatePasswordResetTextEmail
} from "../../lib/email-templates/password-reset.template.js";

export const listUsers = async (filters = {}) => {
  const users = await prisma.user.findMany({
    where: {
      role: filters.role,
      status: filters.status || 'ACTIVE'
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return users.map(sanitizeUser);
};

export const updateUserProfile = async (userId, updates) => {
  const allowedUpdates = ["fullName", "phoneNumber", "bio", "portfolio", "linkedin", "github"];
  const cleanUpdates = {};

  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      cleanUpdates[key] = updates[key];
    }
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: cleanUpdates
  });

  return sanitizeUser(user);
};

export const createUser = async (payload) => {
  const user = await createUserRecord(payload);
  return sanitizeUser(user);
};

export const registerUser = async (payload) => {
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  const user = await createUserRecord({ ...payload, otpCode, otpExpires });

  // Send OTP Email
  if (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL) {
    try {
      const resend = ensureResendClient();
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: user.email,
        subject: "Verify Your Email - Catalance",
        html: `<p>Your verification code is: <strong>${otpCode}</strong></p><p>This code expires in 15 minutes.</p>`
      });
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      // In dev, log the OTP so we can proceed
      console.log(`[DEV] OTP for ${user.email}: ${otpCode}`);
    }
  } else {
    console.log(`[DEV] OTP for ${user.email}: ${otpCode}`);
  }

  return {
    message: "Verification code sent to your email",
    email: user.email,
    userId: user.id
  };
};

export const verifyUserOtp = async ({ email, otp }) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    // Already verified, just log them in
    return {
      user: sanitizeUser(user),
      accessToken: issueAccessToken(user)
    };
  }

  if (!user.otpCode || !user.otpExpires) {
    throw new AppError("Invalid verification request", 400);
  }

  if (String(user.otpCode) !== String(otp)) {
    throw new AppError("Invalid verification code", 400);
  }

  if (new Date() > new Date(user.otpExpires)) {
    throw new AppError("Verification code expired", 400);
  }

  // Verify user
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      otpCode: null,
      otpExpires: null
    }
  });

  // Send welcome email now that they are verified
  await maybeSendWelcomeEmail(updatedUser);

  return {
    user: sanitizeUser(updatedUser),
    accessToken: issueAccessToken(updatedUser)
  };
};

export const authenticateUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  let isValid =
    user?.passwordHash && password
      ? await verifyPassword(password, user.passwordHash)
      : false;

  if (!isValid && user?.passwordHash && password) {
    const legacyValid = await verifyLegacyPassword(password, user.passwordHash);
    if (legacyValid) {
      isValid = true;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await hashPassword(password)
        }
      });
    }
  }

  if (!isValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isVerified) {
    // Optionally resend OTP here if needed, or just tell them to verify
    throw new AppError("Please verify your email address before logging in.", 403);
  }

  return {
    user: sanitizeUser(user),
    accessToken: issueAccessToken(user)
  };
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return sanitizeUser(user);
};

const createUserRecord = async (payload) => {
  try {
    const user = await prisma.user.create({
      data: {
        email: payload.email,
        fullName: payload.fullName,
        passwordHash: await hashUserPassword(payload.password),
        role: payload.role ?? "FREELANCER",
        bio: payload.bio,
        skills: payload.skills ?? [],
        hourlyRate: payload.hourlyRate ?? null,
        otpCode: payload.otpCode,
        otpExpires: payload.otpExpires,
        isVerified: false,
        status: (payload.role === "FREELANCER") ? "PENDING_APPROVAL" : "ACTIVE",
        portfolio: payload.portfolio,
        linkedin: payload.linkedin,
        github: payload.github,
        portfolioProjects: payload.portfolioProjects ?? []
      }
    });

    // Don't send welcome email yet, wait for verification
    // await maybeSendWelcomeEmail(user);

    return user;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("A user with that email already exists", 409);
    }

    throw error;
  }
};

const hashUserPassword = async (password) => {
  if (!password) {
    throw new AppError("Password is required", 400);
  }

  return hashPassword(password);
};

const maybeSendWelcomeEmail = async (user) => {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return;
  }

  try {
    const resend = ensureResendClient();
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: user.email,
      subject: "Welcome to the Freelancer platform",
      html: `<p>Hi ${user.fullName},</p><p>Thanks for joining the platform as a ${user.role.toLowerCase()}!</p>`
    });
  } catch (emailError) {
    console.warn("Unable to send welcome email via Resend:", emailError);
  }
};

export const sanitizeUser = (user) => {
  if (!user) {
    return user;
  }

  // eslint-disable-next-line no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

const issueAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN
    }
  );
};

/**
 * Request a password reset - generates token and sends email
 * @param {string} email - User's email address
 * @returns {Promise<{message: string}>}
 */
// Request a password reset
export const requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (!user) {
    return { message: "If an account exists with that email, a password reset link has been sent." };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Use raw query to bypass stale Prisma Client definitions
  await prisma.$executeRaw`
    UPDATE "User" 
    SET "resetPasswordToken" = ${resetToken}, 
        "resetPasswordExpires" = ${resetTokenExpiry},
        "updatedAt" = NOW()
    WHERE "id" = ${user.id}
  `;

  if (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL) {
    try {
      const resend = ensureResendClient();
      const resetUrl = `${env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: user.email,
        subject: "Reset Your Password - Catalance",
        html: generatePasswordResetEmail(resetUrl, user.email),
        text: generatePasswordResetTextEmail(resetUrl, user.email)
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      throw new AppError("Failed to send reset email. Please try again later.", 500);
    }
  }

  return { message: "If an account exists with that email, a password reset link has been sent." };
};

export const verifyResetToken = async (token) => {
  if (!token) throw new AppError("Reset token is required", 400);

  // Raw query to find user by token
  const users = await prisma.$queryRaw`
    SELECT * FROM "User" 
    WHERE "resetPasswordToken" = ${token} 
    LIMIT 1
  `;
  const user = users[0];

  if (!user || !user.resetPasswordExpires) {
    return { valid: false };
  }

  const now = new Date();
  // Ensure expiry is a Date object (pg driver returns Date usually)
  const expiry = new Date(user.resetPasswordExpires);

  if (now > expiry) {
    return { valid: false };
  }

  return { valid: true, email: user.email };
};

export const resetPassword = async (token, newPassword) => {
  if (!token) throw new AppError("Reset token is required", 400);
  if (!newPassword || newPassword.length < 8) {
    throw new AppError("Password must be at least 8 characters long", 400);
  }

  const users = await prisma.$queryRaw`
    SELECT * FROM "User" 
    WHERE "resetPasswordToken" = ${token} 
    LIMIT 1
  `;
  const user = users[0];

  if (!user || !user.resetPasswordExpires) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  const now = new Date();
  const expiry = new Date(user.resetPasswordExpires);

  if (now > expiry) {
    throw new AppError("Reset token has expired", 400);
  }

  const newPasswordHash = await hashPassword(newPassword);

  // Raw update to clear token and set password
  await prisma.$executeRaw`
    UPDATE "User"
    SET "passwordHash" = ${newPasswordHash},
        "resetPasswordToken" = NULL,
        "resetPasswordExpires" = NULL,
        "updatedAt" = NOW()
    WHERE "id" = ${user.id}
  `;

  return { message: "Password has been reset successfully" };
};
