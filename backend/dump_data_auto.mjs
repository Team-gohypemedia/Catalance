import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const mktRows = await prisma.marketplace.findMany({
        include: { freelancer: { include: { freelancerProfile: true } } }
    });

    const target = mktRows.find(row => {
        const sd = row.serviceDetails || {};
        return !sd.coverImage && !sd.image && (!sd.images || sd.images.length === 0);
    });

    if (!target) {
        console.log('No targets found with missing images.');
    } else {
        console.log('--- FOUND TARGET ---');
        console.log(JSON.stringify(target, null, 2));
    }

    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
