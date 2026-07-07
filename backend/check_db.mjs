import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  try {
    const userId = "cmqf3xh4z00018qx3uvk2o61s";
    
    // Check if phone number is used by someone else
    const phone = "+919968511724";
    const phoneUsers = await prisma.user.findMany({
      where: {
        OR: [
          { phone: { contains: "9968511724" } },
          { phoneNumber: { contains: "9968511724" } }
        ]
      }
    });
    console.log("Users with phone:", phoneUsers.map(u => ({ id: u.id, email: u.email, phone: u.phone, phoneNumber: u.phoneNumber })));

    // Check marketplace entries for user
    const marketplace = await prisma.marketplace.findMany({
      where: { freelancerId: userId }
    });
    console.log("Marketplace entries:", marketplace);
    
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
