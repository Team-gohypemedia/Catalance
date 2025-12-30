import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log("--- UPDATING PM AVATAR ---");

  // 1. Find Rishav Cata
  const pm = await prisma.user.findFirst({
    where: { role: 'PROJECT_MANAGER', fullName: { contains: 'Rishav' } }
  });

  if (!pm) {
      console.log("Rishav not found, finding any PM...");
  }
  
  const targetId = pm ? pm.id : (await prisma.user.findFirst({ where: { role: 'PROJECT_MANAGER' } }))?.id;

  if (!targetId) { 
      console.error("No PM found."); 
      return; 
  }

  // 2. Update Avatar
  // Using a generic placeholder for now
  const avatarUrl = "https://github.com/shadcn.png"; 

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { avatar: avatarUrl }
  });

  console.log(`SUCCESS: Updated avatar for ${updated.fullName} to ${updated.avatar}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
