import { headers } from "next/headers";
import geolocationApi from "@/lib/api/geolocaation";

export async function getCityFromIpAction(): Promise<string | null> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "127.0.0.1";

  const city = await geolocationApi.getCityFromIp(ip);

  console.log(city);
  if (!city) return null;

  return formatCity(city);
}

function formatCity(city: string): string {
  return city
    .toLowerCase()
    .replace(/_/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
