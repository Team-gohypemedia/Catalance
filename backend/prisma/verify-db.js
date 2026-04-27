import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.servicePositiveKeyword.count();
  console.log('Total keywords in database:', count);
  
  const sample = await prisma.servicePositiveKeyword.findMany({
    take: 10,
    include: { service: true }
  });
  
  console.log('Sample Keywords:');
  sample.forEach(k => {
    console.log(`- [${k.service.name}] ${k.name}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
