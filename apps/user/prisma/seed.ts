import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import { CITIES } from '@glow-space/shared';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

async function main() {
  for (const { slug, name, country, lat, lng } of CITIES) {
    const city = { slug, name, country, lat, lng };
    await prisma.city.upsert({
      where: { slug: city.slug },
      create: city,
      update: city,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
