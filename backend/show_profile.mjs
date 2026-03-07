import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const r = await prisma.freelancerProfile.findUnique({
    where: { userId: 'cmmaawrzt0000151v1gpyvpdp' }
});

if (r) {
    console.log(JSON.stringify(r, null, 2));
} else {
    console.log('Profile not found');
}

await prisma.$disconnect();
