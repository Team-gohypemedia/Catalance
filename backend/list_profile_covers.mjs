import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

const profiles = await prisma.freelancerProfile.findMany({
    select: { userId: true, profileDetails: true },
    take: 15
});

const result = [];
profiles.forEach(p => {
    const sd = p.profileDetails?.serviceDetails || {};
    Object.keys(sd).forEach(key => {
        if (sd[key]) {
            result.push({
                userId: p.userId,
                serviceKey: key,
                coverImage: sd[key]?.coverImage || null,
                image: sd[key]?.image || null,
            });
        }
    });
});

writeFileSync('profile_service_covers.json', JSON.stringify(result, null, 2));
console.log(result.length, 'service entries');
result.forEach(r => console.log(r.userId, r.serviceKey, '->', r.coverImage?.substring(0, 80) || 'NULL'));

await prisma.$disconnect();
