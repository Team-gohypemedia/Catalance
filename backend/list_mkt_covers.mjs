import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const rows = await prisma.marketplace.findMany({ select: { id: true, service: true, serviceDetails: true } });
    const report = rows.map(r => ({
        id: r.id,
        service: r.service,
        cover: r.serviceDetails?.coverImage,
        image: r.serviceDetails?.image,
        images: r.serviceDetails?.images
    }));
    console.log(JSON.stringify(report, null, 2));
    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
