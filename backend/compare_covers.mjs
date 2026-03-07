import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

// For the Web Development freelancer (cmmaawrzt0000151v1gpyvpdp), 
// compare Marketplace.serviceDetails.coverImage vs profileDetails.serviceDetails.web_development.coverImage
const fp = await prisma.freelancerProfile.findUnique({
    where: { userId: 'cmmaawrzt0000151v1gpyvpdp' },
    select: { profileDetails: true }
});

const mktRow = await prisma.marketplace.findFirst({
    where: { freelancerId: 'cmmaawrzt0000151v1gpyvpdp', serviceKey: 'web_development' },
    select: { id: true, serviceDetails: true }
});

const profileServiceCover = fp?.profileDetails?.serviceDetails?.web_development?.coverImage;
const marketplaceCover = mktRow?.serviceDetails?.coverImage;

console.log('=== WEB DEVELOPMENT FREELANCER ===');
console.log('Marketplace.serviceDetails.coverImage:', marketplaceCover);
console.log('profileDetails.serviceDetails.web_development.coverImage:', profileServiceCover);
console.log('Same?', marketplaceCover === profileServiceCover);

// Also check Creative & Design for comparison
const fp2 = await prisma.freelancerProfile.findFirst({
    where: { user: { marketplace: { some: { serviceKey: 'creative_design' } } } },
    select: { userId: true, profileDetails: true }
});

if (fp2) {
    const mktRow2 = await prisma.marketplace.findFirst({
        where: { freelancerId: fp2.userId, serviceKey: 'creative_design' },
        select: { id: true, serviceDetails: true }
    });
    const profileCover2 = fp2?.profileDetails?.serviceDetails?.creative_design?.coverImage;
    const mktCover2 = mktRow2?.serviceDetails?.coverImage;
    console.log('\n=== CREATIVE & DESIGN ===');
    console.log('Marketplace.serviceDetails.coverImage:', mktCover2);
    console.log('profileDetails.serviceDetails.creative_design.coverImage:', profileCover2);
    console.log('Same?', mktCover2 === profileCover2);
}

// List all unique profileDetails service cover images for all freelancers
const profiles = await prisma.freelancerProfile.findMany({
    where: { profileDetails: { not: undefined } },
    select: { userId: true, profileDetails: true },
    take: 10
});

console.log('\n=== ALL PROFILE SERVICE COVERS ===');
profiles.forEach(p => {
    const sd = p.profileDetails?.serviceDetails || {};
    Object.keys(sd).forEach(key => {
        if (sd[key]?.coverImage) {
            console.log(p.userId, key, '->', sd[key].coverImage.substring(0, 100));
        }
    });
});

await prisma.$disconnect();
