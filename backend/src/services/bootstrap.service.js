import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../modules/users/password.utils.js";

const ADMIN_EMAIL = "admin@catalance.com";
const ADMIN_PASSWORD = "Password123";

export const seedAdminAccount = async () => {
  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,
      fullName: "Catalance Admin",
      role: "ADMIN",
      isVerified: true,
      onboardingComplete: true
    },
    create: {
      email: ADMIN_EMAIL,
      fullName: "Catalance Admin",
      passwordHash,
      role: "ADMIN",
      isVerified: true,
      onboardingComplete: true
    }
  });

  return {
    admin,
    credentials: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }
  };
};
