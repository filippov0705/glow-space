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
    subcategories: [
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
    subcategories: [
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
    subcategories: [
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
    subcategories: [
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
    subcategories: [
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
    subcategories: [
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
    subcategories: [
      'Haircut',
      'Beard trim',
      'Hot shave',
      'Kids haircut',
      'Styling',
    ],
  },
  {
    slug: 'waxing',
    name: 'Waxing',
    description: 'Wax, sugaring, laser',
    sortOrder: 8,
    imageUrl:
      'https://plus.unsplash.com/premium_photo-1664187387475-7e56d94d3691?q=80&w=708&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    subcategories: [
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
    subcategories: [
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
    subcategories: [
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
    subcategories: [
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
    subcategories: [
      'Body wrap',
      'Scrub',
      'Hot stone',
      'Aromatherapy',
      'Couples spa',
    ],
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
    categories: ['nails'],
    offerings: [
      {
        subcategory: 'manicure',
        name: 'Classic manicure',
        price: 2500,
        durationMin: 45,
      },
      {
        subcategory: 'gel-polish',
        name: 'Manicure with gel polish',
        price: 3500,
        durationMin: 75,
      },
      {
        subcategory: 'nail-art',
        name: 'Nail art (up to 10 nails)',
        price: 1500,
        durationMin: 30,
      },
    ],
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
    categories: ['brows-and-lashes', 'makeup'],
    offerings: [
      {
        subcategory: 'brow-lamination',
        name: 'Brow lamination with tinting',
        price: 4000,
        durationMin: 60,
      },
      {
        subcategory: 'lash-extensions',
        name: 'Classic lash extensions',
        price: 5500,
        durationMin: 120,
      },
      {
        subcategory: 'evening-makeup',
        name: 'Evening makeup',
        price: 6000,
        durationMin: 75,
      },
    ],
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
    categories: ['hair'],
    offerings: [
      {
        subcategory: 'haircut',
        name: "Women's haircut and blow-dry",
        price: 4500,
        durationMin: 60,
      },
      {
        subcategory: 'coloring',
        name: 'Single-process color',
        price: 7500,
        durationMin: 120,
      },
      {
        subcategory: 'highlights',
        name: 'Balayage highlights',
        price: 12000,
        durationMin: 180,
      },
    ],
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
    categories: ['makeup'],
    offerings: [
      {
        subcategory: 'day-makeup',
        name: 'Day makeup',
        price: 4000,
        durationMin: 45,
      },
      {
        subcategory: 'bridal',
        name: 'Bridal makeup',
        price: 12000,
        durationMin: 90,
      },
      {
        subcategory: 'photoshoot',
        name: 'Photoshoot makeup',
        price: 6500,
        durationMin: 60,
      },
    ],
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
    categories: ['skincare'],
    offerings: [
      {
        subcategory: 'facial-cleaning',
        name: 'Deep facial cleansing',
        price: 6000,
        durationMin: 75,
      },
      {
        subcategory: 'peeling',
        name: 'Chemical peel',
        price: 7000,
        durationMin: 45,
      },
    ],
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
    categories: ['massage', 'skincare'],
    offerings: [
      {
        subcategory: 'relaxing',
        name: 'Relaxing full-body massage',
        price: 6000,
        durationMin: 60,
      },
      {
        subcategory: 'back-and-neck',
        name: 'Back and neck massage',
        price: 3500,
        durationMin: 30,
      },
      {
        subcategory: 'hydration',
        name: 'Hydrating facial',
        price: 5500,
        durationMin: 60,
      },
    ],
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
    categories: ['nails'],
    offerings: [
      {
        subcategory: 'manicure',
        name: 'Classic manicure',
        price: 2000,
        durationMin: 45,
      },
      {
        subcategory: 'pedicure',
        name: 'Classic pedicure',
        price: 3500,
        durationMin: 60,
      },
    ],
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
    categories: ['hair', 'makeup'],
    offerings: [
      {
        subcategory: 'styling',
        name: 'Evening hairstyle',
        price: 5000,
        durationMin: 60,
      },
      {
        subcategory: 'evening-makeup',
        name: 'Evening makeup',
        price: 5000,
        durationMin: 60,
      },
    ],
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
    categories: ['massage'],
    offerings: [
      {
        subcategory: 'sports',
        name: 'Sports massage',
        price: 5500,
        durationMin: 60,
      },
      {
        subcategory: 'lymphatic-drainage',
        name: 'Lymphatic drainage massage',
        price: 6500,
        durationMin: 75,
      },
    ],
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
    categories: ['brows-and-lashes', 'nails'],
    offerings: [
      {
        subcategory: 'lash-lift',
        name: 'Lash lift with tinting',
        price: 4500,
        durationMin: 60,
      },
      {
        subcategory: 'brow-tinting',
        name: 'Brow tinting and shaping',
        price: 2500,
        durationMin: 30,
      },
      {
        subcategory: 'manicure',
        name: 'Classic manicure',
        price: 2200,
        durationMin: 45,
      },
    ],
    photoUrl:
      'https://images.unsplash.com/photo-1658492055212-e1acbccfca5a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  // Nail masters in Vilnius, so the AI search mockup query ("gel manicure
  // under €35") has a Best match and a grid. Olga T. and Viktorija S. are over
  // that budget; Milda V. has no reviews yet. Photos reuse the ones above.
  {
    userUuid: '00000000-0000-4000-8000-000000000011',
    displayName: 'Daria M.',
    city: 'vilnius',
    address: 'Vokiečių g. 4, Vilnius',
    lat: 54.6805,
    lng: 25.2853,
    categories: ['nails'],
    offerings: [
      {
        subcategory: 'manicure',
        name: 'Classic manicure',
        price: 2200,
        durationMin: 45,
      },
      {
        subcategory: 'gel-polish',
        name: 'Manicure with gel polish',
        price: 2500,
        durationMin: 70,
      },
      {
        subcategory: 'nail-art',
        name: 'Glitter and French design',
        price: 1000,
        durationMin: 20,
      },
    ],
    photoUrl:
      'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000012',
    displayName: 'Olga T.',
    city: 'vilnius',
    address: 'Konstitucijos pr. 7, Vilnius',
    lat: 54.6961,
    lng: 25.2772,
    categories: ['nails'],
    offerings: [
      {
        subcategory: 'gel-polish',
        name: 'Gel polish with care',
        price: 4500,
        durationMin: 90,
      },
      {
        subcategory: 'extensions',
        name: 'Gel nail extensions',
        price: 6000,
        durationMin: 150,
      },
    ],
    photoUrl:
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000013',
    displayName: 'Sofia L.',
    city: 'vilnius',
    address: 'Didžioji g. 18, Vilnius',
    lat: 54.6788,
    lng: 25.2878,
    categories: ['nails'],
    offerings: [
      {
        subcategory: 'gel-polish',
        name: 'Manicure with gel polish',
        price: 2800,
        durationMin: 75,
      },
      {
        subcategory: 'pedicure',
        name: 'Classic pedicure',
        price: 3500,
        durationMin: 60,
      },
    ],
    photoUrl:
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000014',
    displayName: 'Katya R.',
    city: 'vilnius',
    address: 'Savanorių pr. 16, Vilnius',
    lat: 54.6812,
    lng: 25.2634,
    categories: ['nails'],
    offerings: [
      {
        subcategory: 'gel-polish',
        name: 'Gel polish, one colour',
        price: 3200,
        durationMin: 60,
      },
      {
        subcategory: 'nail-repair',
        name: 'Nail repair, per nail',
        price: 500,
        durationMin: 15,
      },
    ],
    photoUrl:
      'https://images.unsplash.com/photo-1626383137804-ff908d2753a2?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000015',
    displayName: 'Rasa J.',
    city: 'vilnius',
    address: 'Užupio g. 10, Vilnius',
    lat: 54.6814,
    lng: 25.2971,
    categories: ['nails'],
    offerings: [
      {
        subcategory: 'manicure',
        name: 'Classic manicure',
        price: 2000,
        durationMin: 40,
      },
      {
        subcategory: 'gel-polish',
        name: 'Manicure with gel polish',
        price: 3000,
        durationMin: 70,
      },
    ],
    photoUrl:
      'https://images.unsplash.com/photo-1706629505300-168aa1604912?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000016',
    displayName: 'Eglė P.',
    city: 'vilnius',
    address: 'Žirmūnų g. 64, Vilnius',
    lat: 54.7046,
    lng: 25.2982,
    categories: ['nails'],
    offerings: [
      {
        subcategory: 'gel-polish',
        name: 'Gel polish with nail art',
        price: 3300,
        durationMin: 80,
      },
      {
        subcategory: 'pedicure',
        name: 'Pedicure with gel polish',
        price: 4200,
        durationMin: 90,
      },
    ],
    photoUrl:
      'https://images.unsplash.com/photo-1614438865362-9137f7e3036e?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000017',
    displayName: 'Milda V.',
    city: 'vilnius',
    address: 'Kalvarijų g. 35, Vilnius',
    lat: 54.6995,
    lng: 25.2858,
    categories: ['nails'],
    offerings: [
      {
        subcategory: 'gel-polish',
        name: 'Manicure with gel polish',
        price: 2700,
        durationMin: 75,
      },
    ],
    photoUrl:
      'https://images.unsplash.com/photo-1633681926053-9074b76e21a7?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  {
    userUuid: '00000000-0000-4000-8000-000000000018',
    displayName: 'Viktorija S.',
    city: 'vilnius',
    address: 'Vilniaus g. 31, Vilnius',
    lat: 54.6862,
    lng: 25.2801,
    categories: ['nails'],
    offerings: [
      {
        subcategory: 'gel-polish',
        name: 'Premium gel manicure',
        price: 4000,
        durationMin: 90,
      },
      {
        subcategory: 'nail-art',
        name: 'Hand-painted nail art',
        price: 2000,
        durationMin: 45,
      },
    ],
    photoUrl:
      'https://images.unsplash.com/photo-1781450090585-1a511b7066d9?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
];

// Template chips under the home page search input. Vilnius rows are
// interleaved with the global ones by sortOrder.
const searchSuggestions = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    text: 'Gel manicure under €30',
    locale: 'en',
    citySlug: null,
    sortOrder: 10,
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    text: 'Manicure in Old Town tomorrow morning',
    locale: 'en',
    citySlug: 'vilnius',
    sortOrder: 15,
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    text: 'Haircut and color this weekend',
    locale: 'en',
    citySlug: null,
    sortOrder: 20,
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    text: 'Brow lamination near the center',
    locale: 'en',
    citySlug: null,
    sortOrder: 30,
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    text: 'Haircut near Gediminas Avenue after 6 pm',
    locale: 'en',
    citySlug: 'vilnius',
    sortOrder: 35,
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    text: 'Relaxing massage after work',
    locale: 'en',
    citySlug: null,
    sortOrder: 40,
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    text: 'Lash lift with a top-rated master',
    locale: 'en',
    citySlug: null,
    sortOrder: 50,
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    text: 'Deep facial cleansing',
    locale: 'en',
    citySlug: null,
    sortOrder: 60,
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000009',
    text: 'Hot shave and beard trim',
    locale: 'en',
    citySlug: null,
    sortOrder: 5,
    isActive: false,
  },
  {
    id: '10000000-0000-4000-8000-000000000010',
    text: 'Маникюр с гель-лаком до €30',
    locale: 'ru',
    citySlug: null,
    sortOrder: 10,
    isActive: true,
  },
];

const WORKS_PER_CATEGORY = 8;

const languages = [
  { code: 'en', name: 'English', sortOrder: 1 },
  { code: 'ru', name: 'Russian', sortOrder: 2 },
  { code: 'lt', name: 'Lithuanian', sortOrder: 3 },
];

// Profile details are picked from the master's position, so the profile page
// has masters without experience, without languages or without an about text
// (Elena V. and Viktorija S. have none of them, so their About section is omitted).
const LANGUAGE_SETS = [
  ['en', 'ru', 'lt'],
  ['lt', 'en'],
  [],
  ['ru', 'en'],
  ['lt'],
];
const EXPERIENCE_YEARS = [7, 4, null, 12, 3, null];
const ANNA_ABOUT =
  "Hi, I'm Anna! I've been doing nails for seven years and still love every appointment. I work with hypoallergenic gel polishes, sterilise every tool after each client and take my time on cuticle care, so your manicure stays neat for three weeks or more. Bring a photo of the design you like, or let's pick one together.";
const ABOUT_TEXTS = [
  'I believe beauty work should feel relaxed and unhurried. I listen first, suggest options that suit you, and use only professional products I trust.',
  'Certified master who keeps up with new techniques every season. Clean studio, careful work and honest advice on what will last.',
];

const profileData = (index: number) => ({
  about:
    index === 0
      ? ANNA_ABOUT
      : index % 3 === 2
        ? null
        : ABOUT_TEXTS[index % ABOUT_TEXTS.length],
  experienceYears: EXPERIENCE_YEARS[index % EXPERIENCE_YEARS.length],
  languageCodes: LANGUAGE_SETS[index % LANGUAGE_SETS.length],
});

// Reviews per master, by position. Masters with 0 stay "New" (no rating), which
// the top masters block and the cards rely on.
const REVIEW_COUNTS = [8, 6, 5, 7, 0, 0, 0, 0, 0, 4, 9, 6, 5, 7, 4, 3, 0, 5];

// Star ratings are read from this ring starting at the master's position, so
// averages differ between masters and stay the same on every run.
const REVIEW_RATINGS = [5, 5, 4, 5, 5, 3, 5, 4, 5, 5, 4, 5];

const REVIEW_AUTHORS = [
  'Laura G.',
  'Monika S.',
  'Kristina V.',
  'Agnė B.',
  'Jurgita P.',
  'Ewa K.',
  'Marija L.',
  'Inga T.',
  'Rūta D.',
];

const REVIEW_TEXTS: Record<number, string[]> = {
  5: [
    'Lovely result, exactly what I asked for. Will definitely come back.',
    'Very careful and precise work, and it still looks perfect after two weeks.',
    'Cosy place and great attention to detail. Highly recommend!',
  ],
  4: [
    'Good work overall, just had to wait about ten minutes past my slot.',
    'Nice result, though it took a bit longer than I expected.',
  ],
  3: ['The result is fine, but the appointment felt rushed.'],
};

const REVIEW_REPLIES = [
  'Thank you so much, see you next time!',
  'Thanks for the feedback, we will keep your notes in mind.',
];

// Reviews are dated back from a fixed day, not the run date, so reruns don't
// reshuffle the newest-first list.
const REVIEWS_BASE_DATE = Date.UTC(2026, 9, 20, 12);
const DAY_MS = 24 * 60 * 60 * 1000;

// Every third review is star-only (no text); every fourth review with text has
// the master's reply. Matches the CHECKs in the master_reviews migration.
const reviewData = (
  masterId: number,
  masterIndex: number,
  offeringNames: string[],
) =>
  Array.from({ length: REVIEW_COUNTS[masterIndex] ?? 0 }, (_, reviewIndex) => {
    const rating =
      REVIEW_RATINGS[(masterIndex + reviewIndex) % REVIEW_RATINGS.length];
    const texts = REVIEW_TEXTS[rating];
    const text =
      reviewIndex % 3 === 2
        ? null
        : texts[(masterIndex + reviewIndex) % texts.length];
    const createdAt = new Date(
      REVIEWS_BASE_DATE - (reviewIndex * 9 + masterIndex) * DAY_MS,
    );
    const replied = text !== null && reviewIndex % 4 === 0;

    return {
      masterId,
      // Fake client uuids, unique per master (one review per client per master)
      clientUserUuid: `00000000-0000-4000-9000-${String(masterIndex).padStart(6, '0')}${String(reviewIndex).padStart(6, '0')}`,
      authorName:
        REVIEW_AUTHORS[(masterIndex * 2 + reviewIndex) % REVIEW_AUTHORS.length],
      offeringName: offeringNames[reviewIndex % offeringNames.length],
      rating,
      text,
      replyText: replied
        ? REVIEW_REPLIES[masterIndex % REVIEW_REPLIES.length]
        : null,
      repliedAt: replied ? new Date(createdAt.getTime() + DAY_MS) : null,
      createdAt,
    };
  });

type Interval = { startTime: string; endTime: string };

const WEEKDAYS_WITH_LUNCH = [1, 2, 3, 4, 5];
const LUNCH_SPLIT: Interval[] = [
  { startTime: '10:00', endTime: '14:00' },
  { startTime: '15:00', endTime: '19:00' },
];
const WEEKDAYS_NO_BREAK = [2, 3, 4, 5, 6];
const NO_BREAK: Interval[] = [{ startTime: '09:00', endTime: '18:00' }];
const SUNDAY = 7;
const SUNDAY_HOURS: Interval = { startTime: '11:00', endTime: '16:00' };

// Patterns are picked from the master's position so every run seeds the same schedule.
const weeklySchedule = (index: number) => {
  const noBreak = index % 3 === 1;
  const worksSunday = index % 4 === 3;
  const weekdays = noBreak ? WEEKDAYS_NO_BREAK : WEEKDAYS_WITH_LUNCH;
  const intervals = noBreak ? NO_BREAK : LUNCH_SPLIT;

  const rows = weekdays.flatMap((weekday) =>
    intervals.map((interval) => ({ weekday, ...interval })),
  );
  if (worksSunday) {
    rows.push({ weekday: SUNDAY, ...SUNDAY_HOURS });
  }
  return rows;
};

// Exceptions are keyed by master position. `afterDays` is the minimum offset from
// the seed run date; the date is moved forward to the first day that fits the kind.
type ExceptionSeed =
  | { kind: 'dayOff'; afterDays: number }
  | { kind: 'shortDay'; afterDays: number }
  | { kind: 'extraDay'; afterDays: number; interval: Interval };

const scheduleExceptions: Record<number, ExceptionSeed[]> = {
  0: [
    { kind: 'dayOff', afterDays: 3 },
    { kind: 'shortDay', afterDays: 8 },
  ],
  1: [{ kind: 'shortDay', afterDays: 2 }],
  2: [
    {
      kind: 'extraDay',
      afterDays: 1,
      interval: { startTime: '11:00', endTime: '17:00' },
    },
  ],
  5: [{ kind: 'dayOff', afterDays: 5 }],
  7: [
    {
      kind: 'extraDay',
      afterDays: 4,
      interval: { startTime: '10:00', endTime: '15:00' },
    },
  ],
};

const SHORT_DAY: Interval = { startTime: '10:00', endTime: '14:00' };

// @db.Date columns are stored as UTC midnight of the calendar date.
const isoWeekday = (date: Date) => date.getUTCDay() || 7;

const dateAfter = (afterDays: number, fits: (weekday: number) => boolean) => {
  const now = new Date();
  for (let offset = afterDays; offset < afterDays + 7; offset++) {
    const date = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + offset),
    );
    if (fits(isoWeekday(date))) {
      return date;
    }
  }
  throw new Error(`No fitting date within a week after ${afterDays} days`);
};

const exceptionData = (
  masterId: number,
  workingWeekdays: Set<number>,
  exception: ExceptionSeed,
) => {
  if (exception.kind === 'extraDay') {
    return {
      masterId,
      date: dateAfter(
        exception.afterDays,
        (weekday) => !workingWeekdays.has(weekday),
      ),
      isDayOff: false,
      ...exception.interval,
    };
  }
  const date = dateAfter(exception.afterDays, (weekday) =>
    workingWeekdays.has(weekday),
  );
  return exception.kind === 'dayOff'
    ? { masterId, date, isDayOff: true, startTime: null, endTime: null }
    : { masterId, date, isDayOff: false, ...SHORT_DAY };
};

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function main() {
  const languageIds = new Map<string, number>();
  for (const language of languages) {
    const { id } = await prisma.language.upsert({
      where: { code: language.code },
      create: language,
      update: language,
    });
    languageIds.set(language.code, id);
  }

  for (const city of CITIES) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      create: city,
      update: city,
    });
  }

  for (const { subcategories, ...categoryData } of categories) {
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      create: categoryData,
      update: categoryData,
    });

    for (const [index, name] of subcategories.entries()) {
      const subcategoryData = {
        categoryId: category.id,
        slug: slugify(name),
        name,
        sortOrder: index + 1,
      };
      await prisma.subcategory.upsert({
        where: {
          categoryId_slug: {
            categoryId: category.id,
            slug: subcategoryData.slug,
          },
        },
        create: subcategoryData,
        update: subcategoryData,
      });
    }
  }

  for (const [
    masterIndex,
    { city, categories: categorySlugs, offerings, ...data },
  ] of masters.entries()) {
    const { id: cityId } = await prisma.city.findUniqueOrThrow({
      where: { slug: city },
    });
    const { languageCodes, ...profile } = profileData(masterIndex);
    const masterData = {
      ...data,
      ...profile,
      cityId,
      status: MasterStatus.ACTIVE,
    };

    const master = await prisma.master.upsert({
      where: { userUuid: data.userUuid },
      create: masterData,
      update: masterData,
    });

    const masterCategories = await prisma.category.findMany({
      where: { slug: { in: categorySlugs } },
    });

    // Subcategory slugs are resolved only within the master's own categories,
    // before anything is deleted, so a wrong slug leaves the master untouched.
    const masterSubcategories = await prisma.subcategory.findMany({
      where: {
        slug: { in: offerings.map((offering) => offering.subcategory) },
        category: { slug: { in: categorySlugs } },
      },
    });
    const offeringData = offerings.map(({ subcategory: slug, ...offering }) => {
      const matches = masterSubcategories.filter(
        (subcategory) => subcategory.slug === slug,
      );
      if (matches.length !== 1) {
        throw new Error(
          `Master ${data.displayName}: expected one subcategory "${slug}" in their categories, found ${matches.length}`,
        );
      }
      const [subcategory] = matches;
      return {
        ...offering,
        masterId: master.id,
        categoryId: subcategory.categoryId,
        subcategoryId: subcategory.id,
      };
    });
    const languageData = languageCodes.map((code) => {
      const languageId = languageIds.get(code);
      if (languageId === undefined) {
        throw new Error(
          `Master ${data.displayName}: unknown language "${code}"`,
        );
      }
      return { masterId: master.id, languageId };
    });

    // Offerings and works reference master_categories, so they are removed first.
    await prisma.offering.deleteMany({ where: { masterId: master.id } });
    await prisma.work.deleteMany({ where: { masterId: master.id } });
    await prisma.masterCategory.deleteMany({ where: { masterId: master.id } });
    await prisma.masterCategory.createMany({
      data: masterCategories.map((category) => ({
        masterId: master.id,
        categoryId: category.id,
      })),
    });

    await prisma.offering.createMany({ data: offeringData });

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

    await prisma.masterLanguage.deleteMany({ where: { masterId: master.id } });
    await prisma.masterLanguage.createMany({ data: languageData });

    const workingHours = weeklySchedule(masterIndex);
    const workingWeekdays = new Set(workingHours.map((row) => row.weekday));

    await prisma.workingHours.deleteMany({ where: { masterId: master.id } });
    await prisma.workingHours.createMany({
      data: workingHours.map((row) => ({ ...row, masterId: master.id })),
    });

    // Exception dates depend on the run date, so old rows are replaced, not upserted.
    await prisma.scheduleException.deleteMany({
      where: { masterId: master.id },
    });
    await prisma.scheduleException.createMany({
      data: (scheduleExceptions[masterIndex] ?? []).map((exception) =>
        exceptionData(master.id, workingWeekdays, exception),
      ),
    });

    const reviews = reviewData(
      master.id,
      masterIndex,
      offerings.map((offering) => offering.name),
    );
    await prisma.review.deleteMany({ where: { masterId: master.id } });
    await prisma.review.createMany({ data: reviews });

    // rating and reviewsCount are derived from the seeded reviews: the average
    // of all reviews (star-only included), rounded to one decimal; null if none.
    const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
    await prisma.master.update({
      where: { id: master.id },
      data: {
        rating:
          reviews.length > 0
            ? Math.round((ratingSum / reviews.length) * 10) / 10
            : null,
        reviewsCount: reviews.length,
      },
    });
  }

  for (const suggestion of searchSuggestions) {
    await prisma.searchSuggestion.upsert({
      where: { id: suggestion.id },
      create: suggestion,
      update: suggestion,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
