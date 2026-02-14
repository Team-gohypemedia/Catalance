
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const services = await prisma.service.findMany();
    console.log('Services count:', services.length);
    console.log('Services:', JSON.stringify(services, null, 2));
}

main()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
