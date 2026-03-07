import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run') || !process.argv.includes('--real-run');

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

async function backfill() {
    console.log(`Starting backfill... Mode: ${DRY_RUN ? 'DRY_RUN' : 'REAL_RUN'}`);

    const mktRows = await prisma.marketplace.findMany({
        include: { freelancer: { include: { freelancerProfile: true } } }
    });

    let updatedCount = 0;
    let skippedCount = 0;
    const samples = [];
    let verboseLog = '';

    for (const row of mktRows) {
        const mktKey = row.serviceKey;
        const mktSd = row.serviceDetails || {};
        const profile = row.freelancer?.freelancerProfile;
        const profileDetails = profile?.profileDetails || {};
        const profileServiceDetails = profileDetails.serviceDetails || {};

        verboseLog += `\nCHECKING: Row ${row.id} | Service: ${row.service} | MktKey: ${mktKey}\n`;

        // Try mapping or direct key
        const candidates = KEY_MAPPING[mktKey] || [mktKey];
        let profileSd = null;
        let matchedKey = null;

        for (const k of candidates) {
            if (profileServiceDetails[k] && Object.keys(profileServiceDetails[k]).length > 0) {
                profileSd = profileServiceDetails[k];
                matchedKey = k;
                break;
            }
        }

        if (!profileSd) {
            verboseLog += `  - SKIP: No profile data found for candidates: ${candidates.join(', ')}\n`;
            verboseLog += `  - Available profile keys: ${Object.keys(profileServiceDetails).join(', ')}\n`;
            skippedCount++;
            continue;
        }

        verboseLog += `  - MATCH: Found profile data in key: ${matchedKey}\n`;

        const isPlaceholder = (val) => !val || (typeof val === 'string' && val.includes('/assets/services/'));

        const patch = {};

        // 1. Cover Image
        if (isPlaceholder(mktSd.coverImage) && !mktSd.image && (!mktSd.images || mktSd.images.length === 0)) {
            let candidate = profileSd.coverImage || (Array.isArray(profileSd.images) ? profileSd.images[0] : null) || profileSd.image || profileSd.thumbnail;

            // Fallback to first project image if available
            if (isPlaceholder(candidate) && Array.isArray(profileSd.projects)) {
                const projectImage = profileSd.projects.find(p => p.file?.url && !p.file.url.startsWith('blob:'))?.file?.url;
                if (projectImage) candidate = projectImage;
            }

            verboseLog += `  - Image Candidate: ${candidate} (isPlaceholder: ${isPlaceholder(candidate)})\n`;
            if (candidate && !isPlaceholder(candidate)) patch.coverImage = candidate;
        }

        // 2. Images
        if (!mktSd.images || (Array.isArray(mktSd.images) && mktSd.images.length === 0)) {
            if (Array.isArray(profileSd.images) && profileSd.images.length > 0) patch.images = profileSd.images;
            else if (profileSd.gallery && Array.isArray(profileSd.gallery)) patch.images = profileSd.gallery;
        }

        // 3. Price
        if (!mktSd.startingPrice && !mktSd.minBudget) {
            const p = profileSd.startingPrice || profileSd.minBudget || profileSd.price || profileSd.averageProjectPrice || profileSd.averagePrice;
            verboseLog += `  - Price Candidate: ${p}\n`;
            if (p) patch.startingPrice = p;
        }

        // 4. Delivery
        if (!mktSd.deliveryTime) {
            const d = profileSd.deliveryTime || profileSd.deliveryDays || profileSd.turnaround || profileSd.timeline;
            if (d) patch.deliveryTime = d;
        }

        // 5. Tools
        if (!mktSd.tools || (Array.isArray(mktSd.tools) && mktSd.tools.length === 0)) {
            let t = profileSd.tools || profileSd.techStack || profileSd.technologies || profileSd.stack;
            if ((!t || t.length === 0) && Array.isArray(profileSd.projects) && profileSd.projects[0]?.techStack) {
                t = profileSd.projects[0].techStack;
            }
            if (Array.isArray(t) && t.length > 0) patch.tools = t;
        }

        // 6. Deliverables
        if (!mktSd.deliverables || (Array.isArray(mktSd.deliverables) && mktSd.deliverables.length === 0)) {
            const del = profileSd.deliverables || profileSd.whatsIncluded || profileSd.includes || profileSd.features;
            if (Array.isArray(del) && del.length > 0) patch.deliverables = del;
        }

        // 7. Description
        if (!mktSd.description || mktSd.description === '') {
            const desc = profileSd.serviceDescription || profileSd.description || profileSd.about || profileSd.bio || profileSd.summary;
            if (desc) patch.description = desc;
        }

        if (Object.keys(patch).length > 0) {
            updatedCount++;
            const newSd = { ...mktSd, ...patch };

            if (samples.length < 5) {
                samples.push({
                    id: row.id,
                    service: row.service,
                    mktKey,
                    profileMatchedKey: matchedKey,
                    patch
                });
            }

            if (!DRY_RUN) {
                await prisma.marketplace.update({
                    where: { id: row.id },
                    data: { serviceDetails: newSd }
                });
            }
        } else {
            skippedCount++;
        }
    }

    let report = `# Dry-Run Backfill Report\n\nMode: ${DRY_RUN ? 'DRY_RUN' : 'REAL_RUN'}\n\n`;
    report += `## Summary\n`;
    report += `- Total Marketplace rows: ${mktRows.length}\n`;
    report += `- Targets for update: **${updatedCount}**\n`;
    report += `- Skipped: ${skippedCount}\n\n`;

    if (samples.length > 0) {
        report += `## Sample Updates\n`;
        report += '```json\n' + JSON.stringify(samples, null, 2) + '\n```\n\n';
    }

    if (verboseLog) {
        report += `## Detailed Logs\n\`\`\`\n${verboseLog}\n\`\`\`\n`;
    }

    const reportPath = 'C:/Users/User/.gemini/antigravity/brain/61f5b98b-8740-4b3b-894c-25645dd49d98/dry_run_report.md';
    fs.writeFileSync(reportPath, report);
    console.log(`Report written to ${reportPath}`);

    await prisma.$disconnect();
}

backfill().catch(err => {
    console.error(err);
    process.exit(1);
});
