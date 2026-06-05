import { prisma } from "../src/lib/prisma.js";

async function testDuplicate() {
    const serviceId = "Web_dev";
    const service = await prisma.service.findUnique({
        where: { slug: serviceId }
    });

    const duplicateQuestions = [
        {
            id: "confirmation",
            question: "First confirmation",
            type: "input"
        },
        {
            id: "confirmation",
            question: "Second confirmation",
            type: "input"
        }
    ];

    try {
        console.log("Starting transaction with duplicate questions...");
        await prisma.$transaction(async (tx) => {
            await tx.serviceQuestion.deleteMany({
                where: { serviceId: service.id }
            });

            await tx.serviceQuestion.createMany({
                data: duplicateQuestions.map((q, index) => ({
                    serviceId: service.id,
                    slug: q.id,
                    text: q.question,
                    type: q.type,
                    order: index
                }))
            });
        });
        console.log("Transaction succeeded (unexpected!)");
    } catch (err) {
        console.error("Transaction failed with expected error:");
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

testDuplicate();
