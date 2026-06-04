import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const counts = await prisma.marketplace.groupBy({
    by: ['serviceKey'],
    _count: { id: true }
  });
  console.log("Marketplace counts:", counts);
}
main().finally(() => prisma.$disconnect());
