import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const freelancerId = 'cmmaawrzt0000151v1gpyvpdp';
const serviceKey = 'web_development';

const mkt = await prisma.marketplace.findFirst({
    where: { freelancerId, serviceKey }
});

const prof = await prisma.freelancerProfile.findUnique({
    where: { userId: freelancerId }
});

console.log('--- MARKETPLACE ROW ---');
console.log(JSON.stringify(mkt?.serviceDetails, null, 2));

console.log('\n--- PROFILE DETAILS ---');
const profSd = prof?.profileDetails?.serviceDetails?.[serviceKey];
console.log(JSON.stringify(profSd, null, 2));

console.log('\n--- PORTFOLIO PROJECTS ---');
const portfolio = prof?.portfolioProjects || [];
portfolio.forEach((p, i) => {
    console.log(`Project ${i}: ${p.image || p.imageUrl}`);
});

await prisma.$disconnect();
