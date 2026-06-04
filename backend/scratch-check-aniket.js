import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "anikerthakur@gmail.com";
  console.log(`Checking user in Neon DB: ${email}`);
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      freelancerProfile: true,
    }
  });

  if (!user) {
    console.log("User not found in Neon DB.");
  } else {
    console.log("User found in Neon DB:", user);
    
    // Let's delete the user and any associated records if found
    console.log("Attempting to delete user...");
    if (user.freelancerProfile) {
      await prisma.freelancerProfile.delete({
        where: { userId: user.id }
      });
      console.log("Deleted freelancer profile.");
    }
    await prisma.user.delete({
      where: { id: user.id }
    });
    console.log("Deleted user record successfully.");
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
