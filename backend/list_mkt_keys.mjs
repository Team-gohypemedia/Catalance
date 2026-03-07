import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const mktRows = await prisma.marketplace.findMany({
        select: { serviceKey: true },
        distinct: ['serviceKey']
    });

    const keys = mktRows.map(row => row.serviceKey).sort();
    console.log(JSON.stringify(keys, null, 2));

    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
