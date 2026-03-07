import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const profiles = await prisma.freelancerProfile.findMany({
        select: { profileDetails: true }
    });

    const allKeys = new Set();
    profiles.forEach(p => {
        const keys = p.profileDetails?.serviceDetails ? Object.keys(p.profileDetails.serviceDetails) : [];
        keys.forEach(k => allKeys.add(k));
    });

    console.log(JSON.stringify(Array.from(allKeys).sort(), null, 2));
    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
