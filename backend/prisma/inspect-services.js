import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.marketplaceFilterService.findMany({
    select: { id: true, name: true },
  });
  console.log(JSON.stringify(services, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
