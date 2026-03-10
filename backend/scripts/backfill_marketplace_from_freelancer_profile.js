import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const isDryRun = !process.argv.includes('--execute');
    console.log(`Starting Marketplace Backfill... (Dry Run: ${isDryRun ? 'YES' : 'NO'})\n`);

    const marketplaces = await prisma.marketplace.findMany({
        include: {
            freelancer: {
                include: { freelancerProfile: true }
            }
        }
    });

    let processedCount = 0;
    let updatedCount = 0;
    const samples = [];

    for (const row of marketplaces) {
        const mktSd = (row.serviceDetails && typeof row.serviceDetails === 'object') ? row.serviceDetails : {};

        let pdSrv = null;
        if (row.freelancer?.freelancerProfile) {
            const pd = row.freelancer.freelancerProfile.profileDetails;
            if (pd && typeof pd === 'object') {
                const pdServiceDetails = pd.serviceDetails || pd;
                if (pdServiceDetails && pdServiceDetails[row.serviceKey]) {
                    pdSrv = pdServiceDetails[row.serviceKey];
                } else if (pd[row.serviceKey]) {
                    pdSrv = pd[row.serviceKey];
                }
            }
        }

        if (!pdSrv) continue;

        processedCount++;
        const newSd = { ...mktSd };
        let hasChanges = false;

        // Detect and remove static assets to ensure only REAL cover images
        if (newSd.coverImage && typeof newSd.coverImage === 'string' && newSd.coverImage.startsWith('/assets/')) {
            delete newSd.coverImage;
            hasChanges = true;
        }
        if (newSd.image && typeof newSd.image === 'string' && newSd.image.startsWith('/assets/')) {
            delete newSd.image;
            hasChanges = true;
        }

        if (!newSd.coverImage && !newSd.image && !newSd.thumbnail && !newSd.images) {
            if (pdSrv.coverImage && typeof pdSrv.coverImage === 'string' && !pdSrv.coverImage.startsWith('/assets/')) {
                newSd.coverImage = pdSrv.coverImage;
                hasChanges = true;
            }
        }

        if (!newSd.startingPrice && !newSd.minBudget && !newSd.price && !newSd.averageProjectPriceRange) {
            const priceStr = pdSrv.averageProjectPrice || pdSrv.averagePrice;
            if (priceStr) {
                newSd.averageProjectPriceRange = priceStr;
                const matches = String(priceStr).replace(/,/g, '').match(/\d+/g);
                if (matches && matches.length > 0) {
                    newSd.startingPrice = parseInt(matches[0], 10);
                }
                hasChanges = true;
            }
        }

        if (!newSd.description && !newSd.bio) {
            if (pdSrv.serviceDescription) {
                newSd.description = pdSrv.serviceDescription;
                hasChanges = true;
            }
        }

        if (!newSd.tools && !newSd.techStack && !newSd.technologies && !newSd.stack) {
            let extractedTools = [];
            if (Array.isArray(pdSrv.skillsAndTechnologies)) {
                extractedTools.push(...pdSrv.skillsAndTechnologies);
            }
            if (pdSrv.groups) {
                for (const [key, val] of Object.entries(pdSrv.groups)) {
                    if (Array.isArray(val) && (key.includes('tech') || key.includes('tools') || key.includes('stack'))) {
                        extractedTools.push(...val);
                    }
                }
            }
            if (extractedTools.length > 0) {
                newSd.tools = [...new Set(extractedTools)];
                hasChanges = true;
            }
        }

        if (!newSd.deliverables && !newSd.whatsIncluded && !newSd.includes && !newSd.features) {
            let extractedDeliv = [];
            if (pdSrv.groups) {
                for (const [key, val] of Object.entries(pdSrv.groups)) {
                    if (Array.isArray(val) && (key.includes('deliver') || key.includes('scope') || key.includes('approach') || key.includes('specialization'))) {
                        extractedDeliv.push(...val);
                    }
                }
            }
            if (extractedDeliv.length > 0) {
                newSd.deliverables = [...new Set(extractedDeliv)];
                hasChanges = true;
            }
        }

        if (!newSd.portfolio && !newSd.projects) {
            if (Array.isArray(pdSrv.projects) && pdSrv.projects.length > 0) {
                const validProj = pdSrv.projects.filter(p => p.title || p.coverImage || p.image || p.link);
                if (validProj.length > 0) {
                    newSd.portfolio = validProj;
                    hasChanges = true;
                }
            }
        }

        if (!newSd.deliveryTime && !newSd.deliveryDays) {
            const caseTimeline = pdSrv.caseStudy?.timeline;
            if (caseTimeline) {
                newSd.deliveryTime = caseTimeline;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            if (samples.length < 3) {
                samples.push({
                    id: row.id,
                    serviceKey: row.serviceKey,
                    freelancerId: row.freelancerId,
                    before: mktSd,
                    after: newSd
                });
            }

            if (!isDryRun) {
                await prisma.marketplace.update({
                    where: { id: row.id },
                    data: { serviceDetails: newSd }
                });
            }
            updatedCount++;
        }
    }

    const result = {
        processedCount,
        updatedCount,
        samples
    };

    fs.writeFileSync('backfill_dry_run_output.json', JSON.stringify(result, null, 2));

    console.log(`Processed ${processedCount} rows with profile mapping.`);
    console.log(`Found ${updatedCount} rows requiring updates.`);

    if (isDryRun && updatedCount > 0) {
        console.log(`\nDry run complete. Run with --execute to apply changes.`);
    } else if (!isDryRun) {
        console.log(`\nExecute complete. Updated ${updatedCount} rows.`);
    }

}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
