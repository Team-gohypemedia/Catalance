
import { prisma } from "../src/lib/prisma.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
    console.log("Starting migration...");

    const jsonPath = join(__dirname, "../src/data/servicesComplete.json");
    const rawData = readFileSync(jsonPath, "utf-8");
    // Basic cleanup of BOM if present
    const payload = JSON.parse(rawData.replace(/^[\u0000-\u001F\uFEFF]+/, "").trimStart());

    const services = payload.services || [];

    console.log(`Found ${services.length} services to migrate.`);

    for (const s of services) {
        console.log(`Migrating: ${s.name} (${s.id})`);

        // Create or update Service
        const service = await prisma.service.upsert({
            where: { slug: s.id },
            update: {
                name: s.name,
                minBudget: s.budget?.min_required_amount || 0,
                currency: payload.currency || 'INR'
            },
            create: {
                slug: s.id,
                name: s.name,
                minBudget: s.budget?.min_required_amount || 0,
                currency: payload.currency || 'INR'
            }
        });

        // Migrate Questions
        if (s.questions && Array.isArray(s.questions)) {
            let order = 0;
            for (const q of s.questions) {
                // Determine type based on options presence if not explicit, though we should infer 'input' if no options
                // The JSON doesn't strictly have 'type', so we infer:
                // if options exist -> 'single_option' (default) or 'multi_option' (not really distiguishable in basic JSON without heuristics, assuming single for now unless labeled)
                // logic in AI service used heuristics. Let's default to 'input' if no options, 'single_option' if options.

                let type = 'input';
                if (q.options && q.options.length > 0) {
                    type = 'single_option';
                }

                // Check if there is a 'multi' flag in original data? No.
                // But for future we can edit it in Admin UI.

                await prisma.serviceQuestion.upsert({
                    where: {
                        serviceId_slug: {
                            serviceId: service.id,
                            slug: q.id
                        }
                    },
                    update: {
                        text: q.question,
                        type: type,
                        options: q.options || [],
                        order: order++
                    },
                    create: {
                        serviceId: service.id,
                        slug: q.id,
                        text: q.question,
                        type: type,
                        options: q.options || [],
                        order: order++
                    }
                });
            }
        }
    }

    console.log("Migration complete.");
}

migrate()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
