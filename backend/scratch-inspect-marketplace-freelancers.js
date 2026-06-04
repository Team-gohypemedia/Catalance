import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const rows = await prisma.marketplace.findMany({
    select: {
      id: true,
      freelancerId: true,
      serviceKey: true,
    }
  });

  const freelancerIds = rows.map(r => r.freelancerId);
  const users = await prisma.user.findMany({
    where: { id: { in: freelancerIds } },
    select: {
      id: true,
      fullName: true,
      role: true,
      roles: true,
      status: true,
      freelancerProfile: {
        select: {
          openToWork: true,
        }
      }
    }
  });

  console.log("Users associated with marketplace rows:", users);
}
main().finally(() => prisma.$disconnect());
