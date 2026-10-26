"use server";

import mastersApi from "@/lib/api/masters";
import { getCityBySlug } from "@/lib/city";
import { LoadMoreMastersResult, toMasterGridItem } from "@/lib/masterCard";
import { parseOrigin, parseSort } from "@/lib/masterSort";
import { isSlug } from "@/lib/slug";
import { PAGE_SIZE, gridSubtitle } from "./query";

export type LoadMoreSearchInput = {
  citySlug: string;
  category?: string;
  subcategory?: string;
  priceMax?: number; // in cents
  // Local dates of a free slot, YYYY-MM-DD; both or neither
  dateFrom?: string;
  dateTo?: string;
  sort: string;
  // Only with the nearest sort
  lat?: number;
  lng?: number;
};

// The first master of the list is shown as Best match above the grid
const BEST_MATCH_COUNT = 1;

const isDate = (value: unknown): boolean =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

// Next page for the "More masters" grid. The grid counts only its own
// cards, so its offset is shifted past Best match here, and the total it
// gets back excludes Best match too.
export async function loadMoreSearchResults(
  input: LoadMoreSearchInput,
  offset: number,
): Promise<LoadMoreMastersResult> {
  // Actions are public POST endpoints (bound arguments included), so the
  // input shape isn't trusted
  if (typeof input !== "object" || input === null) return { ok: false };

  const city = getCityBySlug(input.citySlug);
  // Malformed filters fail instead of silently widening the list, which
  // wouldn't match the cards already shown
  const categoryValid =
    input.category === undefined || isSlug(input.category);
  const subcategoryValid =
    input.subcategory === undefined ||
    (isSlug(input.subcategory) && input.category !== undefined);
  const priceMaxValid =
    input.priceMax === undefined ||
    (Number.isInteger(input.priceMax) && input.priceMax >= 1);
  const datesValid =
    (input.dateFrom === undefined && input.dateTo === undefined) ||
    (isDate(input.dateFrom) && isDate(input.dateTo));
  if (
    !city ||
    !categoryValid ||
    !subcategoryValid ||
    !priceMaxValid ||
    !datesValid ||
    !Number.isInteger(offset) ||
    offset < 0
  ) {
    return { ok: false };
  }

  const sort = parseSort(input.sort);
  const origin = parseOrigin(sort, input.lat, input.lng);

  try {
    const result = await mastersApi.getMasters({
      city: city.slug,
      category: input.category,
      subcategory: input.subcategory,
      priceMax: input.priceMax,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      sort,
      offset: offset + BEST_MATCH_COUNT,
      limit: PAGE_SIZE,
      lat: origin?.lat,
      lng: origin?.lng,
    });
    return {
      ok: true,
      total: Math.max(result.total - BEST_MATCH_COUNT, 0),
      masters: result.masters.map((master) =>
        toMasterGridItem(master, gridSubtitle(master)),
      ),
    };
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
}
