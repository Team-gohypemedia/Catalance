import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const services = await prisma.service.findMany({
    select: { id: true, slug: true, name: true, active: true }
  });
  console.log("Catalog Services:", services);
}
main().finally(() => prisma.$disconnect());
