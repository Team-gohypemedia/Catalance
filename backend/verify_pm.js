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
  console.log("--- DEBUGGING PM ASSIGNMENT ---");

  // 1. Check ALL Project Managers
  const allPMs = await prisma.user.findMany({
    where: { role: 'PROJECT_MANAGER' }
  });
  console.log(`Total Project Managers found: ${allPMs.length}`);
  allPMs.forEach(pm => {
    console.log(` - ${pm.fullName} (${pm.email}): Status=${pm.status}, Role=${pm.role}`);
  });

  // 2. Check the specific query used in controller
  const activePM = await prisma.user.findFirst({
    where: { 
      role: 'PROJECT_MANAGER',
      status: 'ACTIVE' 
    }
  });
  console.log("\nQuery Result for ACTIVE PM:");
  if (activePM) {
    console.log(`SUCCESS: Found active PM: ${activePM.fullName} (${activePM.id})`);
  } else {
    console.log("FAILURE: No active PM found with the query!");
  }

  // 3. Test Project Query
  try {
    const proj = await prisma.project.findFirst({
        select: { id: true, managerId: true }
    });
    console.log("Project Query Success:", proj);
  } catch (e) {
    console.error("Project Query Failed:", e);
  }

  /* 
  // Optional: Create a real project to test DB constraint?
  // We need a valid ownerId.
  const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
  if (client && activePM) {
      const p = await prisma.project.create({
          data: {
              title: "Debug Assignment Test",
              description: "Test",
              ownerId: client.id,
              managerId: activePM.id
          }
      });
      console.log("Test Project Created with Manager:", p.managerId);
      await prisma.project.delete({ where: { id: p.id } });
  }
  */
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
