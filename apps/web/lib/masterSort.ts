import { MASTER_SORTS, MasterSort } from "@glow-space/shared";

export const DEFAULT_SORT: MasterSort = "top_rated";

export const SORT_LABELS: Record<MasterSort, string> = {
  top_rated: "Top rated",
  most_reviews: "Most reviews",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  newest: "Newest",
  nearest: "Nearest",
};

// Used in the subtitle: "214 masters, sorted by rating"
export const SORT_SUBTITLES: Record<MasterSort, string> = {
  top_rated: "rating",
  most_reviews: "number of reviews",
  price_asc: "price, low to high",
  price_desc: "price, high to low",
  newest: "newest",
  nearest: "distance",
};

export function parseSort(value: unknown): MasterSort {
  return MASTER_SORTS.find((sort) => sort === value) ?? DEFAULT_SORT;
}

// The user's location for the nearest sort. Without it the backend
// measures from the city centre.
export type Origin = { lat: number; lng: number };

function parseCoordinate(value: unknown, limit: number): number | null {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

// lat/lng only count with the nearest sort, and only as a valid pair.
export function parseOrigin(
  sort: MasterSort,
  lat: unknown,
  lng: unknown,
): Origin | undefined {
  if (sort !== "nearest") return undefined;
  const parsedLat = parseCoordinate(lat, 90);
  const parsedLng = parseCoordinate(lng, 180);
  if (parsedLat === null || parsedLng === null) return undefined;
  return { lat: parsedLat, lng: parsedLng };
}

// Adds lat/lng to URL params when they apply (nearest sort only).
export function setOriginParams(
  params: URLSearchParams,
  sort: MasterSort,
  origin: Origin | undefined,
): void {
  if (sort !== "nearest" || !origin) return;
  params.set("lat", String(origin.lat));
  params.set("lng", String(origin.lng));
}
