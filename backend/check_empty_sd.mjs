import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const rows = await prisma.marketplace.findMany();
    const empty = rows.filter(r => !r.serviceDetails || Object.keys(r.serviceDetails).length === 0);
    console.log(`Found ${empty.length} rows with empty serviceDetails.`);
    if (empty.length > 0) {
        console.log('Sample IDs with empty SD:', empty.slice(0, 5).map(r => r.id));
    }
    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
