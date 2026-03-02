import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.upsert({
            where: { email: 'rishav@catalance.com' },
            create: {
                email: 'rishav@catalance.com',
                fullName: 'Rishav PM',
                passwordHash: hashedPassword,
                role: 'PROJECT_MANAGER',
                status: 'ACTIVE',
                isVerified: true
            },
            update: {
                passwordHash: hashedPassword,
                role: 'PROJECT_MANAGER',
                status: 'ACTIVE',
                isVerified: true
            }
        });
        console.log("SUCCESS. You can now login with rishav@catalance.com / password123");
    } catch (e) {
        console.error("FAIL:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
