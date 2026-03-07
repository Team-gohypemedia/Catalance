import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const rows = await prisma.marketplace.findMany({
        select: { id: true, service: true, serviceDetails: true }
    });
    console.log(JSON.stringify(rows, null, 2));
    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
