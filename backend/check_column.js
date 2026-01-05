
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // Try to create a dummy project with externalLink (and rollback or fail)
    // OR just use $queryRaw to check column
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Project' AND column_name = 'externalLink';
    `;
    console.log("Column check result:", result);
    
    if (result.length > 0) {
        console.log("SUCCESS: externalLink column exists.");
    } else {
        console.log("FAILURE: externalLink column MISSING.");
    }

  } catch (e) {
    console.error("Error checking column:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
