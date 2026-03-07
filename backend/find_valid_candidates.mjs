import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const KEY_MAPPING = {
    "social_media_marketing": ["social_media_marketing", "social_strategy"],
    "paid_advertising": ["paid_advertising", "performance_marketing"],
    "performance_marketing": ["performance_marketing", "paid_advertising"],
    "video_editing": ["video_editing", "video_services"],
    "video_services": ["video_services", "video_editing"],
    "branding": ["branding", "creative_design"],
    "creative_design": ["creative_design", "branding"],
    "web_development": ["web_development", "software_development"]
};

const isPlaceholder = (val) => !val || (typeof val === 'string' && val.includes('/assets/services/'));

async function main() {
    const mktRows = await prisma.marketplace.findMany({
        include: { freelancer: { include: { freelancerProfile: true } } }
    });

    const results = [];

    for (const row of mktRows) {
        const mktKey = row.serviceKey;
        const mktSd = row.serviceDetails || {};
        const profile = row.freelancer?.freelancerProfile;
        const profileDetails = profile?.profileDetails || {};
        const profileServiceDetails = profileDetails.serviceDetails || {};

        const candidates = KEY_MAPPING[mktKey] || [mktKey];
        let profileSd = null;

        for (const k of candidates) {
            if (profileServiceDetails[k] && Object.keys(profileServiceDetails[k]).length > 0) {
                profileSd = profileServiceDetails[k];
                break;
            }
        }

        if (!profileSd) continue;

        const profileImage = profileSd.coverImage || (Array.isArray(profileSd.images) ? profileSd.images[0] : null) || profileSd.image || profileSd.thumbnail;
        const hasNewImage = isPlaceholder(mktSd.coverImage) && profileImage && !isPlaceholder(profileImage);

        const profilePrice = profileSd.startingPrice || profileSd.minBudget || profileSd.price;
        const hasNewPrice = !mktSd.startingPrice && !mktSd.minBudget && profilePrice;

        if (hasNewImage || hasNewPrice) {
            results.push({
                id: row.id,
                service: row.service,
                mktKey,
                hasNewImage,
                hasNewPrice,
                profileImage,
                profilePrice
            });
        }
    }

    console.log('MARKER_START');
    console.log(JSON.stringify(results, null, 2));
    console.log('MARKER_END');
    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
