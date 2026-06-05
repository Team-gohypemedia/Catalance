import { prisma } from "../src/lib/prisma.js";

async function runTest() {
    console.log("Listing all services in DB:");
    const services = await prisma.service.findMany();
    services.forEach(s => console.log(`- Slug: "${s.slug}", Name: "${s.name}", ID: "${s.id}"`));

    const serviceId = "Web_dev";

    const sampleQuestions = [
        {
            id: "confirmation",
            question: "Q14. Is there anything else you would like us to know before we generate your proposal?",
            type: "input",
            required: true,
            options: [],
            logic: [],
            subtitle: "Examples: multilingual support, high traffic volumes, future mobile app, enterprise security, integrations with existing software, or ongoing maintenance and support. Include this as additional notes if the client provides anything. If not, generate the proposal.",
            saveResponse: true,
            nextQuestionSlug: ""
        }
    ];

    console.log(`\nStarting import transaction test for service slug: "${serviceId}"...`);
    try {
        const service = await prisma.service.findUnique({
            where: { slug: serviceId }
        });

        console.log("Service found:", service.id, service.name);

        await prisma.$transaction(async (tx) => {
            // Delete existing questions
            console.log("Deleting existing questions...");
            const deleteCount = await tx.serviceQuestion.deleteMany({
                where: { serviceId: service.id }
            });
            console.log(`Deleted ${deleteCount.count} questions.`);

            // Create new questions in order using createMany
            console.log("Creating new questions in bulk using createMany...");
            await tx.serviceQuestion.createMany({
                data: sampleQuestions.map((q, index) => {
                    const id = q.id || q.slug;
                    const questionText = q.question || q.text;
                    const type = q.type || "input";

                    return {
                        serviceId: service.id,
                        slug: id,
                        text: questionText,
                        type,
                        options: q.options || [],
                        logic: q.logic || [],
                        required: q.required === undefined ? true : q.required,
                        order: index,
                        subtitle: q.subtitle || null,
                        saveResponse: q.saveResponse === undefined ? false : q.saveResponse,
                        nextQuestionSlug: q.nextQuestionSlug || null
                    };
                })
            });
        });

        console.log("Transaction completed successfully!");
    } catch (error) {
        console.error("TRANSACTION FAILED:", error);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
