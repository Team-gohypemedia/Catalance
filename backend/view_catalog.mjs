import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const catalog = await prisma.serviceCatalog.findMany();
console.log(JSON.stringify(catalog, null, 2));

await prisma.$disconnect();
