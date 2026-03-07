import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const mktRows = await prisma.marketplace.findMany({
        select: { id: true, serviceKey: true, service: true }
    });
    console.log(JSON.stringify(mktRows, null, 2));
    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
