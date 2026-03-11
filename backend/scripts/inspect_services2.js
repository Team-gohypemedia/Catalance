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
        let serviceDetailsFromPd = null;
        if (row.freelancer?.freelancerProfile) {
            pd = row.freelancer.freelancerProfile.freelancerProfileDetails?.profileDetails;
            if (pd && pd.serviceDetails) {
                serviceDetailsFromPd = pd.serviceDetails;
            }
        }
        output.push({
            mktId: row.id,
            serviceKey: row.serviceKey,
            mktDetails: row.serviceDetails,
            pdServiceDetailsType: typeof serviceDetailsFromPd,
            pdServiceDetailsIsArray: Array.isArray(serviceDetailsFromPd),
            pdServiceDetails: serviceDetailsFromPd,
        });
    }

    fs.writeFileSync('inspect_out2.json', JSON.stringify(output, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
