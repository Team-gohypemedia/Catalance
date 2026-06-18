import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const record = await prisma.freelancerOnboardingContent.findFirst();
  const content = record.content;
  console.log("Global keys:", Object.keys(content.global || {}));
  console.log("Services keys:", Object.keys(content.services || {}));
  // Print global serviceInfo if exists
  if (content.global?.serviceInfo) {
    const serviceInfo = content.global.serviceInfo;
    const catField = serviceInfo.fieldList?.find(f => f.id === 'categories');
    console.log("Global categories options count:", catField?.options?.length);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
