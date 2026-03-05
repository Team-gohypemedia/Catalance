import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
    const service = await prisma.marketplace.findFirst();
    if (!service) {
        console.log("No marketplace services found.");
        return;
    }

    console.log("Service ID:", service.id);
    console.log("Service:", service.service);

    const newReview = await prisma.review.create({
        data: {
            serviceId: service.id,
            clientName: "Test Client API",
            rating: 4,
            comment: "This is a great service! Working perfectly."
        }
    });

    console.log("Created review:", newReview);

    const stats = await prisma.review.aggregate({
        where: { serviceId: service.id },
        _avg: { rating: true },
        _count: { id: true }
    });

    console.log("Stats from aggregate:", stats);
}

verify().catch(console.error).finally(() => prisma.$disconnect());
