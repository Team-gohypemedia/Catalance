import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.marketplaceFilterService.updateMany({
    where: { name: "Web Development" },
    data: { name: "Website Development" }
  });
  console.log("Updated MarketplaceFilterService name 'Web Development' to 'Website Development':", result);

  const result2 = await prisma.service.updateMany({
    where: { name: "Web Development" },
    data: { name: "Website Development" }
  });
  console.log("Updated Service name 'Web Development' to 'Website Development':", result2);
}
main().finally(() => prisma.$disconnect());
