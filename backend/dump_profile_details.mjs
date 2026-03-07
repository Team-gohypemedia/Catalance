import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

const r = await prisma.freelancerProfile.findUnique({
    where: { userId: 'cmmaawrzt0000151v1gpyvpdp' }
});

if (r) {
    writeFileSync('full_profile_details.json', JSON.stringify(r.profileDetails, null, 2));
    console.log('Saved to full_profile_details.json');
} else {
    console.log('Profile not found');
}

await prisma.$disconnect();
