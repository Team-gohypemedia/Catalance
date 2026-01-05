
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Attempting to query Project with externalLink...");
    // Attempt to select the specific field. 
    // If the client doesn't know about it, this might fail at runtime or return undefined.
    const project = await prisma.project.findFirst({
      select: {
        id: true,
        externalLink: true // This will throw if field doesn't exist in Client Types/Schema
      }
    });
    console.log("Query Successful:", project);
  } catch (e) {
    console.error("Query Failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
