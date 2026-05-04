import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createUnverifiedTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "unverified@catalance.com" }
    });

    if (existingUser) {
      console.log("✅ Unverified test user already exists!");
      console.log("Email: unverified@catalance.com");
      console.log("Password: TestPassword123");
      console.log("Status: Unverified - will trigger OTP flow on login");
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash("TestPassword123", 10);

    // Create unverified test user
    const user = await prisma.user.create({
      data: {
        email: "unverified@catalance.com",
        fullName: "Unverified User",
        passwordHash,
        phoneNumber: "+1234567891",
        role: "CLIENT",
        roles: ["CLIENT"],
        status: "ACTIVE",
        isVerified: false,  // KEY: NOT VERIFIED - will trigger OTP flow
        onboardingComplete: false,
        otpCode: "123456",  // Pre-set OTP for testing
        otpExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      }
    });

    console.log("✅ Unverified test user created successfully!");
    console.log("Email: unverified@catalance.com");
    console.log("Password: TestPassword123");
    console.log("Test OTP Code: 123456");
    console.log("User ID:", user.id);
    console.log("\nFlow on login:");
    console.log("1. Enter email & password → Gets OTP sent to email");
    console.log("2. Verify OTP code (use: 123456)");
    console.log("3. Redirects to role onboarding");
  } catch (error) {
    console.error("❌ Error creating unverified test user:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUnverifiedTestUser();
