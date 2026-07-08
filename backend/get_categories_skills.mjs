import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const services = await prisma.marketplaceFilterService.findMany({
    include: {
      subCategories: {
        include: {
          tools: true,
        }
      }
    }
  });

  const output = [];

  for (const service of services) {
    output.push(`\n## Service: ${service.name}`);
    
    if (service.subCategories.length === 0) {
      output.push(`  No categories/skills found.`);
      continue;
    }

    for (const category of service.subCategories) {
      output.push(`\n### Category: ${category.name}`);
      
      if (category.tools.length === 0) {
        output.push(`  - (No skills)`);
        continue;
      }

      const skills = category.tools.map(t => t.name).join(', ');
      output.push(`  - Skills: ${skills}`);
    }
  }

  fs.writeFileSync('categories_skills_output.txt', output.join('\n'), 'utf-8');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
