import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const rows = await prisma.marketplace.findMany({
    select: {
      id: true,
      freelancerId: true,
      serviceKey: true,
      service: true,
      isFeatured: true
    }
  });
  console.log("Marketplace rows:", rows);
}
main().finally(() => prisma.$disconnect());
