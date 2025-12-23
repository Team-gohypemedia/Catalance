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
      role: filters.role
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return users.map(sanitizeUser);
};

export const createUser = async (payload) => {
  const user = await createUserRecord(payload);
  return sanitizeUser(user);
};

export const registerUser = async (payload) => {
  const user = await createUserRecord(payload);
  return {
    user: sanitizeUser(user),
    accessToken: issueAccessToken(user)
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
        hourlyRate: payload.hourlyRate ?? null
      }
    });

    await maybeSendWelcomeEmail(user);

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
export const requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  // For security, always return success even if user doesn't exist
  // This prevents email enumeration attacks
  if (!user) {
    return { message: "If an account exists with that email, a password reset link has been sent." };
  }

  // Generate secure random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Save token to database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpiry
    }
  });

  // Send reset email if Resend is configured
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
  } else {
    console.warn("Resend not configured - password reset email not sent");
  }

  return { message: "If an account exists with that email, a password reset link has been sent." };
};

/**
 * Verify if a reset token is valid and not expired
 * @param {string} token - The reset token to verify
 * @returns {Promise<{valid: boolean, email?: string}>}
 */
export const verifyResetToken = async (token) => {
  if (!token) {
    throw new AppError("Reset token is required", 400);
  }

  const user = await prisma.user.findUnique({
    where: { resetPasswordToken: token }
  });

  if (!user || !user.resetPasswordExpires) {
    return { valid: false };
  }

  // Check if token has expired
  const now = new Date();
  if (now > user.resetPasswordExpires) {
    return { valid: false };
  }

  return {
    valid: true,
    email: user.email
  };
};

/**
 * Reset user's password using a valid token
 * @param {string} token - The reset token
 * @param {string} newPassword - The new password
 * @returns {Promise<{message: string}>}
 */
export const resetPassword = async (token, newPassword) => {
  if (!token) {
    throw new AppError("Reset token is required", 400);
  }

  if (!newPassword || newPassword.length < 8) {
    throw new AppError("Password must be at least 8 characters long", 400);
  }

  const user = await prisma.user.findUnique({
    where: { resetPasswordToken: token }
  });

  if (!user || !user.resetPasswordExpires) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  // Check if token has expired
  const now = new Date();
  if (now > user.resetPasswordExpires) {
    throw new AppError("Reset token has expired", 400);
  }

  // Hash the new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password and clear reset token fields
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newPasswordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null
    }
  });

  return { message: "Password has been reset successfully" };
};
