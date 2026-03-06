import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // Test endpoint 1: 0 reviews average rating
    const serviceWithoutReviews = await prisma.marketplace.findFirst({
        where: { reviews: { none: {} } }
    });

    if (serviceWithoutReviews) {
        console.log("Found service with 0 reviews:", serviceWithoutReviews.id);
        const reviewStats = await prisma.review.aggregate({
            where: { serviceId: serviceWithoutReviews.id },
            _avg: { rating: true },
            _count: { id: true }
        });
        console.log("Stats (0 reviews):", {
            averageRating: reviewStats._avg.rating ? Number(reviewStats._avg.rating.toFixed(1)) : 0,
            reviewCount: reviewStats._count.id
        });
    }

    // Test endpoint 2: Reviews ordering
    console.log("\nTesting review fetching...");
    const serviceWithReviews = await prisma.marketplace.findFirst({
        where: { reviews: { some: {} } }
    });

    if (serviceWithReviews) {
        const dbReviews = await prisma.review.findMany({
            where: { serviceId: serviceWithReviews.id },
            orderBy: { createdAt: "desc" },
            take: 2,
            skip: 0
        });
        console.log("Reviews fetched (newest first, limit 2):");
        dbReviews.forEach(r => console.log(`- ${r.clientName} (Rating: ${r.rating}) on ${r.createdAt}`));
    }
}

main().finally(() => prisma.$disconnect());
