import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const mktRows = await prisma.marketplace.findMany({
        include: { freelancer: { include: { freelancerProfile: true } } }
    });

    const targets = [];

    for (const row of mktRows) {
        const mktSd = row.serviceDetails || {};
        const serviceKey = row.serviceKey;
        const profileSd = row.freelancer?.freelancerProfile?.profileDetails?.serviceDetails?.[serviceKey] || {};

        if (!profileSd || Object.keys(profileSd).length === 0) continue;

        const patch = {};

        // Check for missing items that profile HAS
        const profileImage = profileSd.coverImage || (Array.isArray(profileSd.images) ? profileSd.images[0] : null) || profileSd.image || profileSd.thumbnail;
        if (!mktSd.coverImage && profileImage) patch.coverImage = profileImage;

        const profilePrice = profileSd.startingPrice || profileSd.minBudget || profileSd.price;
        if (!mktSd.startingPrice && !mktSd.minBudget && profilePrice) patch.startingPrice = profilePrice;

        if (Object.keys(patch).length > 0) {
            targets.push({
                id: row.id,
                service: row.service,
                serviceKey,
                patch,
                mktSd,
                profileSd
            });
        }

        if (targets.length >= 3) break;
    }

    console.log('MARKER_START');
    console.log(JSON.stringify(targets, null, 2));
    console.log('MARKER_END');
    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
