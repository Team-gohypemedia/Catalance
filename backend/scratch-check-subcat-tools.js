import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking marketplace filters...");

  const subCategories = await prisma.marketplaceFilterSubCategory.findMany({
    take: 20
  });
  console.log("Sample subCategories:", subCategories);

  const shopifyTools = await prisma.marketplaceFilterTool.findMany({
    where: {
      name: {
        contains: "Shopify",
        mode: "insensitive"
      }
    }
  });
  console.log("Shopify tools:", shopifyTools);

  if (shopifyTools.length > 0) {
    const parentSubCat = await prisma.marketplaceFilterSubCategory.findUnique({
      where: { id: shopifyTools[0].subCategoryId }
    });
    console.log("Parent SubCategory of Shopify tool:", parentSubCat);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
