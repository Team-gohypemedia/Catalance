
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const prisma = new PrismaClient();

async function checkUser() {
  const phone = '9910762692';
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { phoneNumber: { contains: phone } },
        { phone: { contains: phone } }
      ]
    }
  });
  console.log('Users found:', JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

checkUser();
