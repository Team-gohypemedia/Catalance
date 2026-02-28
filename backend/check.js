const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const data = await prisma.marketplace.findMany({ take: 3 });
    console.log(JSON.stringify(data.map(d => d.serviceDetails), null, 2));
}
main().finally(() => prisma.$disconnect());
