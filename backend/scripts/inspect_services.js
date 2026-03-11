import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const mkt = await prisma.marketplace.findMany({
        take: 5,
        include: {
            freelancer: {
                include: {
                    freelancerProfile: {
                        include: {
                            freelancerProfileDetails: true
                        }
                    }
                }
            }
        }
    });

    const output = [];

    for (const row of mkt) {
        let pd = null;
        if (row.freelancer?.freelancerProfile) {
            pd = row.freelancer.freelancerProfile.freelancerProfileDetails?.profileDetails;
        }
        output.push({
            mktId: row.id,
            serviceKey: row.serviceKey,
            mktDetailsKeys: Object.keys(row.serviceDetails || {}),
            pdKeys: pd ? Object.keys(pd) : [],
            pdServiceDataKeys: pd && pd[row.serviceKey] ? Object.keys(pd[row.serviceKey]) : null
        });
    }

    fs.writeFileSync('inspect_out.json', JSON.stringify(output, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
