import { cache } from "react";
import { cookies, headers } from "next/headers";
import { CitySeed } from "@glow-space/shared";
import geolocationApi from "@/lib/api/geolocaation";
import { findNearestCity, getCityBySlug } from "@/lib/city";
import { CITY_COOKIE, DEFAULT_CITY } from "@/app/constants";

async function getCityFromIp(): Promise<CitySeed | null> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "127.0.0.1";

  const location = await geolocationApi.getLocationFromIp(ip);
  if (!location) return null;

  return findNearestCity(location.lat, location.lng);
}

// Memoized per request: the layout and the page both call it.
export const resolveCurrentCity = cache(async (): Promise<CitySeed> => {
  const cookieStore = await cookies();
  const fromCookie = getCityBySlug(cookieStore.get(CITY_COOKIE)?.value);
  if (fromCookie) return fromCookie;

  const fromIp = await getCityFromIp();
  if (fromIp) return fromIp;

  const fallback = getCityBySlug(DEFAULT_CITY);
  if (!fallback) {
    throw new Error(`DEFAULT_CITY "${DEFAULT_CITY}" is not in CITIES`);
  }
  return fallback;
});
