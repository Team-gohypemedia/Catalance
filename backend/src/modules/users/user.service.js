import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { extractBioText } from "../../utils/bio-utils.js";
import { env } from "../../config/env.js";
import { ensureResendClient } from "../../lib/resend.js";
import { hashPassword, verifyPassword, verifyLegacyPassword } from "./password.utils.js";
import {
  generatePasswordResetEmail,
  generatePasswordResetTextEmail
} from "../../lib/email-templates/password-reset.template.js";

const OTP_TTL_MINUTES = 15;
const OTP_EMAIL_RETRY_ATTEMPTS = 2;

const normalizeRoleValue = (value) =>
  typeof value === "string" ? value.toUpperCase() : null;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildOtpEmailContent = ({ otpCode, isResend = false }) => ({
  subject: isResend
    ? "Your New Verification Code - Catalance"
    : "Verify Your Email - Catalance",
  html: `<p>Your ${isResend ? "new " : ""}verification code is: <strong>${otpCode}</strong></p><p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>`
});

const sendOtpEmail = async ({ email, otpCode, isResend = false }) => {
  const hasResendConfig = Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL);

  if (!hasResendConfig) {
    const message =
      "Email service is not configured (missing RESEND_API_KEY or RESEND_FROM_EMAIL).";
    if (env.NODE_ENV === "production") {
      throw new AppError(message, 500, {
        provider: "resend",
        reason: "missing_config"
      });
    }

    console.warn(`[OTP Email] ${message}`);
    console.log(`[DEV] OTP for ${email}: ${otpCode}`);
    return { delivered: false, reason: "missing_config" };
  }

  const resend = ensureResendClient();
  const { subject, html } = buildOtpEmailContent({ otpCode, isResend });
  let lastError = null;

  for (let attempt = 1; attempt <= OTP_EMAIL_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const result = await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: email,
        subject,
        html
      });

      if (result?.error) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : result.error?.message || JSON.stringify(result.error)
        );
      }

      console.log(
        `[OTP Email] Sent to ${email}. Subject: ${subject}. ID: ${result?.data?.id || "n/a"}`
      );
      return { delivered: true, id: result?.data?.id || null };
    } catch (error) {
      lastError = error;
      console.error(
        `[OTP Email] Attempt ${attempt}/${OTP_EMAIL_RETRY_ATTEMPTS} failed:`,
        error?.message || error
      );
      if (attempt < OTP_EMAIL_RETRY_ATTEMPTS) {
        await wait(400);
      }
    }
  }

  throw new AppError(
    "We could not deliver the verification code email. Please try again in a moment.",
    502,
    {
      provider: "resend",
      reason: "delivery_failed",
      cause: lastError?.message || "unknown_error"
    }
  );
};

const ensureUserRoles = async (user, requestedRole) => {
  if (!user) return user;

  const baseRole = normalizeRoleValue(user.role) || "FREELANCER";
  const requested = normalizeRoleValue(requestedRole);
  const existingRoles = Array.isArray(user.roles)
    ? user.roles.map((role) => normalizeRoleValue(role)).filter(Boolean)
    : [];
  const roles = existingRoles.length ? existingRoles : [baseRole];
  const updates = {};

  if (!roles.includes(baseRole)) {
    roles.push(baseRole);
  }

  if (requested && !roles.includes(requested)) {
    roles.push(requested);
    if (requested === "FREELANCER") {
      updates.status = "PENDING_APPROVAL";
      updates.onboardingComplete = false;
    }
  }

  const uniqueRoles = Array.from(new Set(roles));
  const needsRoleUpdate =
    !existingRoles.length ||
    uniqueRoles.length !== existingRoles.length ||
    uniqueRoles.some((entry) => !existingRoles.includes(entry));
  if (needsRoleUpdate) {
    updates.roles = uniqueRoles;
  }

  if (Object.keys(updates).length === 0) {
    return user;
  }

  return prisma.user.update({
    where: { id: user.id },
    data: updates
  });
};

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
  const allowedUpdates = ["fullName", "phoneNumber", "bio", "portfolio", "linkedin", "github", "profileDetails", "onboardingComplete"];
  const cleanUpdates = {};

  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      // Sanitize bio to plain text even if JSON/object slips in.
      if (key === "bio") {
        cleanUpdates[key] = extractBioText(updates[key]);
      } else {
        cleanUpdates[key] = updates[key];
      }
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
  const otpExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  const user = await createUserRecord({ ...payload, otpCode, otpExpires });
  let otpEmail;
  try {
    otpEmail = await sendOtpEmail({ email: user.email, otpCode });
  } catch (error) {
    await prisma.user.delete({ where: { id: user.id } }).catch((cleanupError) => {
      console.warn(
        `[OTP Email] Failed to cleanup unsent signup user ${user.id}:`,
        cleanupError?.message || cleanupError
      );
    });
    throw error;
  }

  return {
    message: otpEmail?.delivered
      ? "Verification code sent to your email"
      : "Account created. In development mode, use the OTP printed in backend logs.",
    email: user.email,
    userId: user.id,
    emailDelivery: otpEmail?.delivered ? "sent" : "not_sent"
  };
};

export const verifyUserOtp = async ({ email, otp }) => {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
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

export const resendOtp = async (email) => {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("Email is already verified", 400);
  }

  // Generate new OTP
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  // Update user with new OTP
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCode,
      otpExpires
    }
  });

  const otpEmail = await sendOtpEmail({
    email: user.email,
    otpCode,
    isResend: true
  });

  return {
    message: otpEmail?.delivered
      ? "New verification code sent to your email"
      : "In development mode, use the OTP printed in backend logs.",
    emailDelivery: otpEmail?.delivered ? "sent" : "not_sent"
  };
};

export const authenticateUser = async ({ email, password, role }) => {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
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
    // Resend OTP for unverified users
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode,
        otpExpires
      }
    });

    const otpEmail = await sendOtpEmail({ email: user.email, otpCode });

    // Return special response indicating verification is needed
    return {
      requiresVerification: true,
      email: user.email,
      message: otpEmail?.delivered
        ? "Please verify your email. A new verification code has been sent."
        : "Please verify your email. In development mode, use the OTP printed in backend logs.",
      emailDelivery: otpEmail?.delivered ? "sent" : "not_sent"
    };
  }

  const updatedUser = await ensureUserRoles(user, role);
  const requestedRole = normalizeRoleValue(role);
  const roles = Array.isArray(updatedUser?.roles)
    ? updatedUser.roles.map((entry) => normalizeRoleValue(entry)).filter(Boolean)
    : [];
  const activeRole = requestedRole && roles.includes(requestedRole)
    ? requestedRole
    : normalizeRoleValue(updatedUser?.role) || "FREELANCER";
  const sessionUser = sanitizeUser({ ...updatedUser, role: activeRole });

  return {
    user: sessionUser,
    accessToken: issueAccessToken(updatedUser, activeRole)
  };
};

export const authenticateWithGoogle = async ({ token, role }) => {
  const { verifyFirebaseToken } = await import("../../lib/firebase-admin.js");
  const normalizedRole = typeof role === "string" ? role.toUpperCase() : null;
  const requestedRole = ["CLIENT", "FREELANCER"].includes(normalizedRole)
    ? normalizedRole
    : null;

  // Verify token with Firebase
  const decodedToken = await verifyFirebaseToken(token);
  const { email, name, picture, uid } = decodedToken;

  if (!email) {
    throw new AppError("Google account does not have an email address", 400);
  }

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Create new user
    // Generate a random password since they use Google auth
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const initialRole = requestedRole || "CLIENT";

    user = await prisma.user.create({
      data: {
        email,
        fullName: name || email.split("@")[0],
        passwordHash: await hashUserPassword(randomPassword), // We still set a password to avoid null constraints if any
        role: initialRole, // Default to CLIENT if not specified in request
        roles: [initialRole],
        isVerified: true, // Google users are verified by definition
        // We can store the profile picture if we had a field for it, maybe update later
        otpCode: null,
        otpExpires: null,
        status: initialRole === "FREELANCER" ? "PENDING_APPROVAL" : "ACTIVE"
      }
    });

    await maybeSendWelcomeEmail(user);
  } else {
    // If user exists but is not verified, verify them since they used Google
    if (!user.isVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });
    }

    const currentPrimaryRole = normalizeRoleValue(user.role);
    const allowRequestedRole =
      requestedRole &&
      !["ADMIN", "PROJECT_MANAGER"].includes(currentPrimaryRole || "");
    user = await ensureUserRoles(user, allowRequestedRole ? requestedRole : null);
  }

  const roles = Array.isArray(user?.roles)
    ? user.roles.map((entry) => normalizeRoleValue(entry)).filter(Boolean)
    : [];
  const activeRole = requestedRole && roles.includes(requestedRole)
    ? requestedRole
    : normalizeRoleValue(user?.role) || "FREELANCER";
  const sessionUser = sanitizeUser({ ...user, role: activeRole });

  return {
    user: sessionUser,
    accessToken: issueAccessToken(user, activeRole)
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
    const normalizedEmail = String(payload.email || "").toLowerCase().trim();
    const normalizedRole = (payload.role || "FREELANCER").toUpperCase();
    const roles = Array.isArray(payload.roles) && payload.roles.length
      ? Array.from(new Set(payload.roles.map((role) => String(role).toUpperCase())))
      : [normalizedRole];
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: payload.fullName,
        passwordHash: await hashUserPassword(payload.password),
        role: normalizedRole,
        roles,
        bio: extractBioText(payload.bio),
        skills: payload.skills ?? [],
        hourlyRate: payload.hourlyRate ?? null,
        otpCode: payload.otpCode,
        otpExpires: payload.otpExpires,
        isVerified: false,
        status: normalizedRole === "FREELANCER" ? "PENDING_APPROVAL" : "ACTIVE",
        portfolio: payload.portfolio,
        linkedin: payload.linkedin,
        github: payload.github,
        portfolioProjects: payload.portfolioProjects ?? [],
        profileDetails: payload.freelancerProfile ?? {}
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
  const normalizedRole = normalizeRoleValue(safeUser.role) || "FREELANCER";
  const roles = Array.isArray(safeUser.roles)
    ? safeUser.roles.map((role) => normalizeRoleValue(role)).filter(Boolean)
    : [];
  const mergedRoles = roles.includes(normalizedRole)
    ? roles
    : [...roles, normalizedRole];

  return {
    ...safeUser,
    roles: mergedRoles.length ? mergedRoles : [normalizedRole]
  };
};

const issueAccessToken = (user, activeRole) => {
  const tokenRole = normalizeRoleValue(activeRole) || normalizeRoleValue(user.role);
  return jwt.sign(
    {
      sub: user.id,
      role: tokenRole,
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
