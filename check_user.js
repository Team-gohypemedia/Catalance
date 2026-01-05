
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "wetivi1284@mekuron.com";
  console.log(`Checking user: ${email}`);
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log("User not found");
  } else {
    console.log("User found:");
    console.log(`ID: ${user.id}`);
    console.log(`Verified: ${user.isVerified}`);
    console.log(`Role: ${user.role}`);
    console.log(`Status: ${user.status}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
