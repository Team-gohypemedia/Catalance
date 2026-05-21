import { asyncHandler } from "../utils/async-handler.js";
import { seedAdminAccount } from "../services/bootstrap.service.js";

export const seedAdminHandler = asyncHandler(async (_req, res) => {
  const data = await seedAdminAccount();

  res.json({
    data: {
      message: "Admin account seeded.",
      email: data.credentials.email,
      password: data.credentials.password,
      user: {
        email: data.admin.email,
        role: data.admin.role,
        isVerified: data.admin.isVerified,
        onboardingComplete: data.admin.onboardingComplete
      }
    }
  });
});
