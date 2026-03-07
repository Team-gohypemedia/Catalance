import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const rows = await prisma.marketplace.findMany();
rows.forEach(r => {
    const sd = r.serviceDetails || {};
    const hasImage = !!sd.image;
    const hasImages = !!sd.images;
    const hasGallery = !!sd.gallery;
    const hasCover = !!sd.coverImage;

    if (hasImage || hasImages || hasGallery || hasCover) {
        console.log(`ID: ${r.id}, Key: ${r.serviceKey}`);
        if (hasImage) console.log(`  image: ${sd.image}`);
        if (hasImages) console.log(`  images: ${JSON.stringify(sd.images)}`);
        if (hasGallery) console.log(`  gallery: ${JSON.stringify(sd.gallery)}`);
        if (hasCover) console.log(`  coverImage: ${sd.coverImage}`);
    }
});

await prisma.$disconnect();
