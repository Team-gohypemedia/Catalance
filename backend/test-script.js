import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.project.findUnique({
    where: { id: 'cmqf37ouh000t4ykx09v3eo9x' },
    include: { owner: true }
  });
  console.log(JSON.stringify(p, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
