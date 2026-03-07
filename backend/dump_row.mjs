import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const r = await prisma.marketplace.findUnique({
    where: { id: 'cmmad5oi50007151v0xoj8lod' }
});

if (r) {
    console.log(JSON.stringify(r.serviceDetails, null, 2));
} else {
    console.log('Row not found');
}

await prisma.$disconnect();
