const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const mktRows = await prisma.marketplace.findMany({
        include: { freelancer: { include: { freelancerProfile: true } } }
    });

    const candidates = mktRows.filter(row => {
        const sd = row.serviceDetails || {};
        // Check if missing cover image
        const hasImage = sd.coverImage || sd.image || (Array.isArray(sd.images) && sd.images.length > 0);
        return !hasImage;
    }).slice(0, 3);

    const results = candidates.map(row => {
        const serviceKey = row.serviceKey;
        const profileSd = row.freelancer?.freelancerProfile?.profileDetails?.serviceDetails?.[serviceKey] || {};
        return {
            mktId: row.id,
            freelancerId: row.freelancerId,
            serviceKey,
            mktServiceDetails: row.serviceDetails,
            profileServiceDetails: profileSd
        };
    });

    console.log('MARKER_START');
    console.log(JSON.stringify(results, null, 2));
    console.log('MARKER_END');
    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
