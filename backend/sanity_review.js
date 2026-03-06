import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Step 1: Confirm delegate exists
if (!prisma.review) {
    console.error("FAIL: prisma.review is undefined — client was not regenerated correctly.");
    process.exit(1);
}
console.log("OK: prisma.review delegate exists.");

// Step 2: Count reviews (should return 0 or a number, no crash)
const count = await prisma.review.count();
console.log("OK: prisma.review.count() =", count);

// Step 3: Test aggregation with 0 or more rows (mimics getServiceById)
const service = await prisma.marketplace.findFirst();
if (!service) {
    console.log("WARN: No marketplace services found — skipping aggregate test.");
} else {
    const stats = await prisma.review.aggregate({
        where: { serviceId: service.id },
        _avg: { rating: true },
        _count: { id: true }
    });
    const averageRating = stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0;
    const reviewCount = stats._count.id;
    console.log("OK: aggregate result for serviceId", service.id, "→", { averageRating, reviewCount });
}

await prisma.$disconnect();
console.log("ALL CHECKS PASSED");
