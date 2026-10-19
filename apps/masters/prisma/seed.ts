import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import { CITIES, MasterStatus } from '@glow-space/shared';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

const categories = [
  { slug: 'nails', name: 'Nails', sortOrder: 1 },
  { slug: 'hair', name: 'Hair', sortOrder: 2 },
  { slug: 'brows-and-lashes', name: 'Brows and lashes', sortOrder: 3 },
  { slug: 'makeup', name: 'Makeup', sortOrder: 4 },
  { slug: 'skincare', name: 'Skincare', sortOrder: 5 },
  { slug: 'massage', name: 'Massage', sortOrder: 6 },
];

const masters = [
  {
    userUuid: '00000000-0000-4000-8000-000000000001',
    displayName: 'Anna K.',
    city: 'vilnius',
    address: 'Gedimino pr. 9, Vilnius',
    lat: 54.6869,
    lng: 25.2765,
    rating: 4.9,
    reviewsCount: 128,
    categories: ['nails'],
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000002',
    displayName: 'Marta S.',
    city: 'vilnius',
    address: 'Pilies g. 22, Vilnius',
    lat: 54.6833,
    lng: 25.2897,
    rating: 4.8,
    reviewsCount: 94,
    categories: ['brows-and-lashes', 'makeup'],
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000003',
    displayName: 'Elena V.',
    city: 'vilnius',
    address: 'Konstitucijos pr. 7, Vilnius',
    lat: 54.6965,
    lng: 25.2766,
    rating: 5.0,
    reviewsCount: 61,
    categories: ['hair'],
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000004',
    displayName: 'Julia P.',
    city: 'vilnius',
    address: 'Vokieciu g. 13, Vilnius',
    lat: 54.6795,
    lng: 25.2834,
    rating: 4.9,
    reviewsCount: 87,
    categories: ['makeup'],
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000005',
    displayName: 'Ieva M.',
    city: 'vilnius',
    address: 'Zirmunu g. 64, Vilnius',
    lat: 54.7105,
    lng: 25.3016,
    rating: null,
    reviewsCount: 0,
    categories: ['skincare'],
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000006',
    displayName: 'Greta L.',
    city: 'vilnius',
    address: 'Savanoriu pr. 16, Vilnius',
    lat: 54.6801,
    lng: 25.2502,
    rating: null,
    reviewsCount: 0,
    categories: ['massage', 'skincare'],
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000007',
    displayName: 'Liga B.',
    city: 'riga',
    address: 'Brivibas iela 40, Riga',
    lat: 56.9561,
    lng: 24.1189,
    rating: null,
    reviewsCount: 0,
    categories: ['nails'],
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000008',
    displayName: 'Ilze K.',
    city: 'riga',
    address: 'Elizabetes iela 51, Riga',
    lat: 56.9551,
    lng: 24.1131,
    rating: null,
    reviewsCount: 0,
    categories: ['hair', 'makeup'],
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000009',
    displayName: 'Dace R.',
    city: 'riga',
    address: 'Terbatas iela 14, Riga',
    lat: 56.9586,
    lng: 24.1265,
    rating: null,
    reviewsCount: 0,
    categories: ['massage'],
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000010',
    displayName: 'Sofia N.',
    city: 'riga',
    address: 'Barona iela 31, Riga',
    lat: 56.9536,
    lng: 24.1253,
    rating: 4.7,
    reviewsCount: 42,
    categories: ['brows-and-lashes', 'nails'],
  },
];

const WORKS_PER_CATEGORY = 2;

async function main() {
  for (const city of CITIES) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      create: city,
      update: city,
    });
  }

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    });
  }

  for (const { city, categories: categorySlugs, ...data } of masters) {
    const { id: cityId } = await prisma.city.findUniqueOrThrow({
      where: { slug: city },
    });
    const masterData = { ...data, cityId, status: MasterStatus.ACTIVE };

    const master = await prisma.master.upsert({
      where: { userUuid: data.userUuid },
      create: masterData,
      update: masterData,
    });

    const masterCategories = await prisma.category.findMany({
      where: { slug: { in: categorySlugs } },
    });

    // Works reference master_categories, so they are removed first.
    await prisma.work.deleteMany({ where: { masterId: master.id } });
    await prisma.masterCategory.deleteMany({ where: { masterId: master.id } });
    await prisma.masterCategory.createMany({
      data: masterCategories.map((category) => ({
        masterId: master.id,
        categoryId: category.id,
      })),
    });

    await prisma.work.createMany({
      data: masterCategories.flatMap((category, categoryIndex) =>
        Array.from({ length: WORKS_PER_CATEGORY }, (_, workIndex) => ({
          masterId: master.id,
          categoryId: category.id,
          imageUrl: `https://placehold.co/600x400?text=${encodeURIComponent(category.name)}`,
          sortOrder: categoryIndex * WORKS_PER_CATEGORY + workIndex,
        })),
      ),
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
