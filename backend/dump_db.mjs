import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

const mktRows = await prisma.marketplace.findMany({
    take: 8,
    select: { id: true, serviceKey: true, service: true, serviceDetails: true }
});

const fpRows = await prisma.freelancerProject.findMany({
    take: 8,
    select: { id: true, serviceKey: true, serviceName: true, fileUrl: true, budget: true, timeline: true }
});

writeFileSync('raw_marketplace_rows.json', JSON.stringify(mktRows, null, 2));
writeFileSync('raw_fp_rows.json', JSON.stringify(fpRows, null, 2));

console.log('=== MARKETPLACE TABLE ===');
mktRows.forEach(r => {
    const sd = r.serviceDetails || {};
    const imgKeys = Object.keys(sd).filter(k => k.toLowerCase().includes('image') || k.toLowerCase().includes('cover') || k.toLowerCase().includes('thumb'));
    console.log(r.id, r.serviceKey, '| image keys:', imgKeys.join(',') || 'NONE', '| coverImage:', sd.coverImage, '| image:', sd.image, '| minBudget:', sd.minBudget, '| startingPrice:', sd.startingPrice);
});

console.log('\n=== FREELANCER PROJECTS TABLE ===');
fpRows.forEach(r => {
    console.log(r.id, r.serviceKey, '| fileUrl:', r.fileUrl || 'null', '| budget:', r.budget);
});

await prisma.$disconnect();
