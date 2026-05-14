import { prisma } from "./src/lib/prisma.js";

async function main() {
  const emails = ["anikerthakur@gmail.com", "aniketthakur@gmail.com"];
  const phones = ["+919910762692", "9910762692"];

  for (const email of emails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`Deleted user with email: ${email}`);
    } else {
      console.log(`User not found with email: ${email}`);
    }
  }

  for (const phone of phones) {
    const user = await prisma.user.findFirst({ where: { phoneNumber: phone } });
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`Deleted user with phone: ${phone}`);
    } else {
      console.log(`User not found with phone: ${phone}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
