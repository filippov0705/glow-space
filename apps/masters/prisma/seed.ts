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
  {
    slug: 'nails',
    name: 'Nails',
    description: 'Manicure, pedicure, nail art',
    sortOrder: 1,
    imageUrl:
      'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    tags: [
      'Manicure',
      'Pedicure',
      'Gel polish',
      'Extensions',
      'Nail art',
      'Nail repair',
    ],
  },
  {
    slug: 'hair',
    name: 'Hair',
    description: 'Cuts, coloring, styling',
    sortOrder: 2,
    imageUrl:
      'https://images.unsplash.com/photo-1564141696939-9eb6e957ccfc?q=80&w=1541&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    tags: [
      'Haircut',
      'Coloring',
      'Highlights',
      'Styling',
      'Keratin and treatment',
      'Extensions',
    ],
  },
  {
    slug: 'brows-and-lashes',
    name: 'Brows and lashes',
    description: 'Shaping, tinting, extensions',
    sortOrder: 3,
    imageUrl:
      'https://plus.unsplash.com/premium_photo-1718626727207-854154e67324?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    tags: [
      'Brow shaping',
      'Brow lamination',
      'Brow tinting',
      'Lash extensions',
      'Lash lift',
      'Lash tinting',
    ],
  },
  {
    slug: 'makeup',
    name: 'Makeup',
    description: 'Day, evening, bridal',
    sortOrder: 4,
    imageUrl:
      'https://images.unsplash.com/photo-1709477542149-f4e0e21d590b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    tags: [
      'Day makeup',
      'Evening makeup',
      'Bridal',
      'Photoshoot',
      'Makeup lesson',
    ],
  },
  {
    slug: 'skincare',
    name: 'Skincare',
    description: 'Facials, peels, cleansing',
    sortOrder: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    tags: [
      'Facial cleaning',
      'Peeling',
      'Hydration',
      'Anti-age',
      'Acne treatment',
      'Microneedling',
    ],
  },
  {
    slug: 'massage',
    name: 'Massage',
    description: 'Relaxing, therapeutic, sports',
    sortOrder: 6,
    imageUrl:
      'https://images.unsplash.com/photo-1745327883508-b6cd32e5dde5?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    tags: [
      'Relaxing',
      'Sports',
      'Face massage',
      'Anti-cellulite',
      'Back and neck',
      'Lymphatic drainage',
    ],
  },
  {
    slug: 'barbering',
    name: 'Barbering',
    description: 'Haircuts, beard, shave',
    sortOrder: 7,
    imageUrl:
      'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    tags: ['Haircut', 'Beard trim', 'Hot shave', 'Kids haircut', 'Styling'],
  },
  {
    slug: 'waxing',
    name: 'Waxing',
    description: 'Wax, sugaring, laser',
    sortOrder: 8,
    imageUrl:
      'https://plus.unsplash.com/premium_photo-1664187387475-7e56d94d3691?q=80&w=708&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    tags: [
      'Legs',
      'Bikini',
      'Underarms',
      'Face',
      'Sugaring',
      'Laser hair removal',
    ],
  },
  {
    slug: 'tattoo-and-piercing',
    name: 'Tattoo and piercing',
    description: 'Tattoo, piercing, removal',
    sortOrder: 9,
    imageUrl:
      'https://images.unsplash.com/photo-1597852075234-fd721ac361d3?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    tags: [
      'Tattoo',
      'Cover-up',
      'Tattoo removal',
      'Ear piercing',
      'Body piercing',
      'Permanent makeup',
    ],
  },
  {
    slug: 'cosmetology',
    name: 'Cosmetology',
    description: 'Injections, mesotherapy',
    sortOrder: 10,
    imageUrl:
      'https://images.unsplash.com/photo-1713085085470-fba013d67e65?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    tags: [
      'Botox and fillers',
      'Mesotherapy',
      'Biorevitalization',
      'Plasma therapy',
      'Consultation',
    ],
  },
  {
    slug: 'bridal',
    name: 'Bridal',
    description: 'Hair and makeup for weddings',
    sortOrder: 11,
    imageUrl:
      'https://images.unsplash.com/photo-1777312377880-4f08acc48020?q=80&w=717&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    tags: [
      'Bridal makeup',
      'Bridal hair',
      'Trial session',
      'Bridesmaids',
      'On location',
    ],
  },
  {
    slug: 'spa',
    name: 'Spa',
    description: 'Wraps, scrubs, body care',
    sortOrder: 12,
    imageUrl:
      'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    tags: ['Body wrap', 'Scrub', 'Hot stone', 'Aromatherapy', 'Couples spa'],
  },
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
    tags: ['manicure', 'gel-polish', 'nail-art'],
    photoUrl:
      'https://images.unsplash.com/photo-1781450090585-1a511b7066d9?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
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
    tags: ['brow-lamination', 'lash-extensions', 'evening-makeup'],
    photoUrl:
      'https://images.unsplash.com/photo-1781925856343-c97d0d44f94c?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
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
    tags: ['haircut', 'coloring', 'highlights'],
    photoUrl:
      'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
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
    tags: ['day-makeup', 'bridal', 'photoshoot'],
    photoUrl:
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
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
    tags: ['facial-cleaning', 'peeling'],
    photoUrl:
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
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
    tags: ['relaxing', 'back-and-neck', 'hydration'],
    photoUrl:
      'https://images.unsplash.com/photo-1626383137804-ff908d2753a2?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
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
    tags: ['manicure', 'pedicure'],
    photoUrl:
      'https://images.unsplash.com/photo-1706629505300-168aa1604912?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
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
    tags: ['styling', 'evening-makeup'],
    photoUrl:
      'https://images.unsplash.com/photo-1614438865362-9137f7e3036e?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
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
    tags: ['sports', 'lymphatic-drainage'],
    photoUrl:
      'https://images.unsplash.com/photo-1633681926053-9074b76e21a7?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
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
    tags: ['lash-lift', 'brow-tinting', 'manicure'],
    photoUrl:
      'https://images.unsplash.com/photo-1658492055212-e1acbccfca5a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
];

const WORKS_PER_CATEGORY = 2;

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function main() {
  for (const city of CITIES) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      create: city,
      update: city,
    });
  }

  for (const { tags, ...categoryData } of categories) {
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      create: categoryData,
      update: categoryData,
    });

    for (const [index, name] of tags.entries()) {
      const tagData = {
        categoryId: category.id,
        slug: slugify(name),
        name,
        sortOrder: index + 1,
      };
      await prisma.tag.upsert({
        where: {
          categoryId_slug: { categoryId: category.id, slug: tagData.slug },
        },
        create: tagData,
        update: tagData,
      });
    }
  }

  for (const {
    city,
    categories: categorySlugs,
    tags: tagSlugs,
    ...data
  } of masters) {
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

    // Works and tags reference master_categories, so they are removed first.
    await prisma.work.deleteMany({ where: { masterId: master.id } });
    await prisma.masterTag.deleteMany({ where: { masterId: master.id } });
    await prisma.masterCategory.deleteMany({ where: { masterId: master.id } });
    await prisma.masterCategory.createMany({
      data: masterCategories.map((category) => ({
        masterId: master.id,
        categoryId: category.id,
      })),
    });

    // Tag slugs are looked up only within the master's own categories.
    const masterTags = await prisma.tag.findMany({
      where: {
        slug: { in: tagSlugs },
        categoryId: { in: masterCategories.map((category) => category.id) },
      },
    });
    await prisma.masterTag.createMany({
      data: masterTags.map((tag) => ({
        masterId: master.id,
        categoryId: tag.categoryId,
        tagId: tag.id,
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
