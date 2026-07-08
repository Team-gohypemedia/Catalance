import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDuplicatePhone() {
  try {
    const duplicateUserId = 'cmqf3wk8i00008qx3cr44xii5'; // shoaib.topmostmedia@gmail.com
    
    console.log("Updating duplicate phone number...");
    
    await prisma.user.update({
      where: { id: duplicateUserId },
      data: { 
        phone: '+91919968511725', // Changed the last digit from 4 to 5
        phoneNumber: '+91919968511725' 
      }
    });

    console.log("Successfully fixed the duplicate phone number conflict.");
    
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicatePhone();
