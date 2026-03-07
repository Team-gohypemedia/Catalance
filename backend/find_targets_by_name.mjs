import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const names = ['Swarnpriya', 'Bhaskar Gera', 'Shreya Pal', 'Dheeraj Sorout'];
    const mktRows = await prisma.marketplace.findMany({
        include: { freelancer: { select: { fullName: true, id: true, freelancerProfile: true } } }
    });

    const targets = mktRows.filter(r => names.some(name => r.freelancer?.fullName.includes(name)));

    const results = targets.map(t => ({
        id: t.id,
        name: t.freelancer.fullName,
        service: t.service,
        serviceKey: t.serviceKey,
        mktSd: t.serviceDetails,
        profileSd: t.freelancer.freelancerProfile?.profileDetails?.serviceDetails || {}
    }));

    console.log('MARKER_START');
    console.log(JSON.stringify(results, null, 2));
    console.log('MARKER_END');
    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
