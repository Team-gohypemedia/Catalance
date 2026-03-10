import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const marketplaces = await prisma.marketplace.findMany();

    for (const row of marketplaces) {
        if (row.serviceDetails && typeof row.serviceDetails === 'object') {
            const sd = row.serviceDetails;
            if (sd.startingPrice < 1000 && sd.averageProjectPriceRange && String(sd.averageProjectPriceRange).toLowerCase().includes('lakh')) {
                // It's 1 Lakh, 2 Lakhs, etc.
                const newSd = { ...sd };
                const matches = String(sd.averageProjectPriceRange).replace(/,/g, '').match(/\d+/g);
                if (matches && matches.length > 0) {
                    const num = parseFloat(matches[0]);
                    newSd.startingPrice = num * 100000;
                    await prisma.marketplace.update({
                        where: { id: row.id },
                        data: { serviceDetails: newSd }
                    });
                    console.log(`Updated ${row.id} from ${sd.startingPrice} to ${newSd.startingPrice}`);
                }
            }
        }
    }

}

main().catch(console.error).finally(() => prisma.$disconnect());
