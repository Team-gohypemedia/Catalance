import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { fullName: { contains: 'Shoaib Malik' } },
    include: {
      freelancerProfile: true,
    }
  });
  
  if (user && user.freelancerProfile) {
    console.log("Shoaib Malik freelancerProfile:", JSON.stringify(user.freelancerProfile, null, 2));
  } else {
    console.log("Not found");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
