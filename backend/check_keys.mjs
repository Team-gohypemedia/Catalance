import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const mktRows = await prisma.marketplace.findMany({
        take: 5,
        include: { freelancer: { include: { freelancerProfile: true } } }
    });

    const results = mktRows.map(row => {
        const profile = row.freelancer?.freelancerProfile;
        const profileServiceKeys = profile?.profileDetails?.serviceDetails ? Object.keys(profile.profileDetails.serviceDetails) : [];

        return {
            mktId: row.id,
            mktService: row.service,
            mktServiceKey: row.serviceKey,
            mktHasImage: !!(row.serviceDetails?.coverImage || row.serviceDetails?.image),
            profileServiceKeys
        };
    });

    console.log(JSON.stringify(results, null, 2));
    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
