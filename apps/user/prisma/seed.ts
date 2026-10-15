import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

const cities = [
  {
    slug: 'vilnius',
    name: 'Vilnius',
    country: 'LT',
    lat: 54.6872,
    lng: 25.2797,
  },
  { slug: 'riga', name: 'Riga', country: 'LV', lat: 56.9496, lng: 24.1052 },
  {
    slug: 'tallinn',
    name: 'Tallinn',
    country: 'EE',
    lat: 59.437,
    lng: 24.7536,
  },
  { slug: 'warsaw', name: 'Warsaw', country: 'PL', lat: 52.2297, lng: 21.0122 },
  { slug: 'berlin', name: 'Berlin', country: 'DE', lat: 52.52, lng: 13.405 },
  { slug: 'paris', name: 'Paris', country: 'FR', lat: 48.8566, lng: 2.3522 },
  { slug: 'london', name: 'London', country: 'GB', lat: 51.5074, lng: -0.1278 },
  { slug: 'madrid', name: 'Madrid', country: 'ES', lat: 40.4168, lng: -3.7038 },
  { slug: 'rome', name: 'Rome', country: 'IT', lat: 41.9028, lng: 12.4964 },
  {
    slug: 'amsterdam',
    name: 'Amsterdam',
    country: 'NL',
    lat: 52.3676,
    lng: 4.9041,
  },
  { slug: 'prague', name: 'Prague', country: 'CZ', lat: 50.0755, lng: 14.4378 },
  { slug: 'vienna', name: 'Vienna', country: 'AT', lat: 48.2082, lng: 16.3738 },
  {
    slug: 'stockholm',
    name: 'Stockholm',
    country: 'SE',
    lat: 59.3293,
    lng: 18.0686,
  },
  { slug: 'kyiv', name: 'Kyiv', country: 'UA', lat: 50.4501, lng: 30.5234 },
  {
    slug: 'istanbul',
    name: 'Istanbul',
    country: 'TR',
    lat: 41.0082,
    lng: 28.9784,
  },
  {
    slug: 'tbilisi',
    name: 'Tbilisi',
    country: 'GE',
    lat: 41.7151,
    lng: 44.8271,
  },
  {
    slug: 'new-york',
    name: 'New York',
    country: 'US',
    lat: 40.7128,
    lng: -74.006,
  },
  {
    slug: 'toronto',
    name: 'Toronto',
    country: 'CA',
    lat: 43.6532,
    lng: -79.3832,
  },
  { slug: 'dubai', name: 'Dubai', country: 'AE', lat: 25.2048, lng: 55.2708 },
  { slug: 'tokyo', name: 'Tokyo', country: 'JP', lat: 35.6762, lng: 139.6503 },
];

async function main() {
  for (const city of cities) {
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
