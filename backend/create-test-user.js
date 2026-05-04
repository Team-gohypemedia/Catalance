import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "test@catalance.com" }
    });

    if (existingUser) {
      console.log("✅ Test user already exists!");
      console.log("Email: test@catalance.com");
      console.log("Password: TestPassword123");
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash("TestPassword123", 10);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: "test@catalance.com",
        fullName: "Test User",
        passwordHash,
        phoneNumber: "+1234567890",
        role: "CLIENT",
        roles: ["CLIENT"],
        status: "ACTIVE",
        isVerified: true,
        onboardingComplete: true
      }
    });

    console.log("✅ Test user created successfully!");
    console.log("Email: test@catalance.com");
    console.log("Password: TestPassword123");
    console.log("User ID:", user.id);
  } catch (error) {
    console.error("❌ Error creating test user:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
