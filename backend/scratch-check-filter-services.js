import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const services = await prisma.marketplaceFilterService.findMany({
    select: { id: true, name: true }
  });
  console.log("Filter Services:", services);
}
main().finally(() => prisma.$disconnect());
