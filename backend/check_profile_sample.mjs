import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const mktRow = await prisma.marketplace.findUnique({
        where: { id: 'cmmac4uv000049zd8qiymj2hb' },
        include: { freelancer: { include: { freelancerProfile: true } } }
    });

    console.log('--- MARKETPLACE SD ---');
    console.log(JSON.stringify(mktRow.serviceDetails, null, 2));

    const profile = mktRow.freelancer?.freelancerProfile;
    console.log('--- PROFILE SD (web_development) ---');
    console.log(JSON.stringify(profile?.profileDetails?.serviceDetails?.web_development, null, 2));

    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
