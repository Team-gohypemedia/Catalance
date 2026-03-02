import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'rishav@catalance.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Ensuring PM account exists for ${email}...`);

        const pms = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash: hashedPassword,
                role: 'PROJECT_MANAGER',
                status: 'ACTIVE',
                isVerified: true
            },
            create: {
                email,
                fullName: 'Rishav Cata',
                passwordHash: hashedPassword,
                role: 'PROJECT_MANAGER',
                status: 'ACTIVE',
                isVerified: true
            }
        });

        console.log(`Successfully configured ${email}.`);
        console.log(`Password set to: ${password}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
