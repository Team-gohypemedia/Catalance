import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const marketplaceRows = await prisma.marketplace.findMany();
const profiles = await prisma.freelancerProfile.findMany();

console.log('--- SCANNING MARKETPLACE ROWS ---');
marketplaceRows.forEach(r => {
    const sd = r.serviceDetails || {};
    const keys = Object.keys(sd);
    const imgKeys = keys.filter(k => k.toLowerCase().includes('image') || k.toLowerCase().includes('cover') || k.toLowerCase().includes('banner') || k.toLowerCase().includes('service'));
    if (imgKeys.length > 0) {
        console.log(`ID: ${r.id}, Key: ${r.serviceKey}`);
        imgKeys.forEach(k => console.log(`  ${k}: ${sd[k]}`));
    }
});

console.log('\n--- SCANNING PROFILE SERVICE DETAILS ---');
profiles.forEach(p => {
    const psd = p.profileDetails?.serviceDetails || {};
    Object.keys(psd).forEach(sKey => {
        const keys = Object.keys(psd[sKey]);
        const imgKeys = keys.filter(k => k.toLowerCase().includes('image') || k.toLowerCase().includes('cover') || k.toLowerCase().includes('banner') || k.toLowerCase().includes('service'));
        if (imgKeys.length > 0) {
            console.log(`User: ${p.userId}, Service: ${sKey}`);
            imgKeys.forEach(k => console.log(`  ${k}: ${psd[sKey][k]}`));
        }
    });
});

await prisma.$disconnect();
