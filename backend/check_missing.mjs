import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const mktRows = await prisma.marketplace.findMany({
        include: { freelancer: { include: { freelancerProfile: true } } }
    });

    const missing = mktRows.filter(row => {
        const sd = row.serviceDetails || {};
        return !sd.coverImage && !sd.image && (!sd.images || sd.images.length === 0);
    });

    console.log(`Found ${missing.length} rows with missing images.`);
    if (missing.length > 0) {
        console.log('Sample missing row IDs:', missing.map(m => m.id).slice(0, 5));
    }

    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
