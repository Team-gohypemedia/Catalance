import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const row = await prisma.marketplace.findUnique({
        where: { id: 'cmmac4uv00004151v093y447h' }, // An ID from research
        include: { freelancer: { include: { freelancerProfile: true } } }
    });

    console.log('--- MARKETPLACE ROW ---');
    console.log(JSON.stringify(row, null, 2));

    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
