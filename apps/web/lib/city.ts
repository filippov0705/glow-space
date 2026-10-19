import { CITIES, CitySeed } from "@glow-space/shared";

export function getCityBySlug(slug: string | null | undefined): CitySeed | null {
  if (!slug) return null;
  return CITIES.find((city) => city.slug === slug) ?? null;
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestCity(lat: number, lng: number): CitySeed | null {
  let nearest: CitySeed | null = null;
  let minDistance = Infinity;

  for (const city of CITIES) {
    const distance = haversineDistance(lat, lng, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  }

  return nearest;
}
