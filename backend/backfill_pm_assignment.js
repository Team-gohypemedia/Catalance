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
  console.log("--- BACKFILLING PROJECT MANAGER ASSIGNMENTS ---");

  // 1. Get All Projects (filter in JS to avoid Prisma Unknown Arg error if schema mismatch)
  const allProjects = await prisma.project.findMany({
    select: { id: true, title: true, managerId: true }
  });
  
  const unassignedProjects = allProjects.filter(p => !p.managerId);

  console.log(`Found ${unassignedProjects.length} projects without a Project Manager.`);

  if (unassignedProjects.length === 0) {
    console.log("No action needed.");
    return;
  }

  // 2. Get Active Project Managers
  // We can sort by load to be smart
  const projectManagers = await prisma.user.findMany({
    where: { role: 'PROJECT_MANAGER', status: 'ACTIVE' },
    select: { id: true, fullName: true, email: true }
    // orderBy: { managedProjects: { _count: 'asc' } } // Commented out to fix validation error
  });

  if (projectManagers.length === 0) {
    console.error("CRITICAL: No Active Project Managers found to assign!");
    return;
  }

  console.log(`Found ${projectManagers.length} active Project Managers:`);
  projectManagers.forEach(pm => console.log(` - ${pm.fullName} (${pm.email})`));

  // 3. Assign Projects (Round Robin / Load Balanced approach simplified)
  let pmIndex = 0;
  let updatedCount = 0;

  for (const project of unassignedProjects) {
    const manager = projectManagers[pmIndex];
    console.log(`Assigning Project "${project.title}" (${project.id}) to ${manager.fullName}...`);

    await prisma.project.update({
      where: { id: project.id },
      data: { managerId: manager.id }
    });

    pmIndex = (pmIndex + 1) % projectManagers.length;
    updatedCount++;
  }

  console.log(`\nSuccessfully assigned ${updatedCount} projects.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
