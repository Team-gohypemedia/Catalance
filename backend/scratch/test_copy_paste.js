import { prisma } from "../src/lib/prisma.js";

async function runTest() {
    const serviceId = "website_uiux";

    try {
        const service = await prisma.service.findUnique({
            where: { slug: serviceId },
            include: {
                questions: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!service) {
            console.error("Service not found:", serviceId);
            process.exit(1);
        }

        console.log(`Found service "${service.name}" with ${service.questions.length} questions.`);

        // Format to what frontend gets and copies
        const questions = service.questions.map(q => ({
            id: q.slug,
            question: q.text,
            type: q.type,
            required: q.required,
            options: q.options || [],
            logic: q.logic || [],
            subtitle: q.subtitle || "",
            saveResponse: q.saveResponse || false,
            nextQuestionSlug: q.nextQuestionSlug || ""
        }));

        const jsonText = JSON.stringify(questions, null, 2);
        console.log("Stringified questions length:", jsonText.length);

        // Parse it back to simulate pasting
        const parsed = JSON.parse(jsonText);

        console.log("Simulating import transaction...");
        await prisma.$transaction(async (tx) => {
            // Delete existing questions
            await tx.serviceQuestion.deleteMany({
                where: { serviceId: service.id }
            });

            // Create new questions in order
            for (let index = 0; index < parsed.length; index++) {
                const q = parsed[index];
                const id = q.id || q.slug;
                const questionText = q.question || q.text;
                const type = q.type || "input";

                await tx.serviceQuestion.create({
                    data: {
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
                    }
                });
            }
        });

        console.log("Import simulation completed successfully!");
    } catch (error) {
        console.error("IMPORT SIMULATION FAILED:", error);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
