import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "wetivi1284@mekuron.com";
  console.log(`Checking bio for ${email}...`);
  
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    console.log("User not found!");
  } else {
    console.log("User found ID:", user.id);
    console.log("Bio raw value:", JSON.stringify(user.bio));
    console.log("Bio starts with {?", user.bio && user.bio.trim().startsWith('{'));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
