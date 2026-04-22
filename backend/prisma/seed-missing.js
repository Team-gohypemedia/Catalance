import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1. Fix the "Paid Advertising" name which has leading \r\n
  const adsService = await prisma.marketplaceFilterService.findFirst({
    where: { name: { contains: "Paid Advertising" } }
  });

  if (adsService && adsService.name !== "Paid Advertising") {
    console.log(`Fixing service name from "${JSON.stringify(adsService.name)}" to "Paid Advertising"`);
    await prisma.marketplaceFilterService.update({
      where: { id: adsService.id },
      data: { name: "Paid Advertising" }
    });
  }

  // 2. Fetch the fresh list of services
  const services = await prisma.marketplaceFilterService.findMany({
    select: { id: true, name: true },
  });

  const find = (name) => services.find((s) => s.name === name);
  const paidAds = find("Paid Advertising");

  const keywordMap = {};

  if (paidAds) {
    keywordMap[paidAds.id] = [
      "Google Ads", "Facebook Ads", "Instagram Ads", "LinkedIn Ads",
      "PPC Management", "Search Engine Marketing", "Display Ads",
      "Retargeting Campaigns", "Ad Copywriting", "Conversion Rate Optimization",
      "Media Buying", "Biddable Media", "Performance Marketing",
      "Google Merchant Center", "TikTok Ads",
    ];
  }

  let count = 0;
  for (const [serviceId, keywords] of Object.entries(keywordMap)) {
    for (const name of keywords) {
      await prisma.servicePositiveKeyword.upsert({
        where: {
          serviceId_name: { serviceId: Number(serviceId), name },
        },
        update: {},
        create: { serviceId: Number(serviceId), name },
      });
      count++;
    }
  }

  console.log(`Seeded ${count} keywords for Paid Advertising.`);

  // 3. Final verification
  const allServices = await prisma.marketplaceFilterService.findMany({
    select: { 
      name: true, 
      _count: { select: { positiveKeywords: true } } 
    },
    orderBy: { name: "asc" },
  });

  console.log("\nFinal keyword counts per service:");
  allServices.forEach((s) => {
    console.log(`  ${s.name.padEnd(25)}: ${s._count.positiveKeywords} keywords`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
