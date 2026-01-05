
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'mohdkaif18th@gmail.com';
  console.log(`Updating user with email: ${email}`);
  
  try {
    const user = await prisma.user.update({
      where: { email },
      data: {
        bio: 'Passionate Product Manager with over 10 years of experience in building scalable tech solutions.',
        linkedin: 'https://linkedin.com/in/mohdkaif',
        jobTitle: 'Product Manager',
        companyName: 'TechFlow Systems',
        location: 'San Francisco, CA',
        rating: 4.8,
        reviewCount: 15
      }
    });
    console.log('User updated successfully:', user.email);
  } catch (e) {
    if (e.code === 'P2025') {
        console.log("User not found!");
    } else {
        console.error(e);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
