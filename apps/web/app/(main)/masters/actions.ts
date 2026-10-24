"use server";

import mastersApi from "@/lib/api/masters";
import { getCityBySlug } from "@/lib/city";
import { LoadMoreMastersResult, toMasterGridItem } from "@/lib/masterCard";
import { parseOrigin, parseSort } from "@/lib/masterSort";
import { isSlug } from "@/lib/slug";
import { PAGE_SIZE, cardSubtitle } from "./query";

export type LoadMoreMastersInput = {
  citySlug: string;
  // The selected category's slug; the card subtitle is built from it here
  categorySlug?: string;
  sort: string;
  // Only with the nearest sort
  lat?: number;
  lng?: number;
};

// Next page for "Show more". The page binds `input` to its filters; the
// city comes from the rendered page, so appended masters always match
// the ones already shown.
export async function loadMoreMasters(
  input: LoadMoreMastersInput,
  offset: number,
): Promise<LoadMoreMastersResult> {
  // Actions are public POST endpoints (bound arguments included), so the
  // input shape isn't trusted
  if (typeof input !== "object" || input === null) return { ok: false };

  const city = getCityBySlug(input.citySlug);
  // A malformed category fails instead of silently widening the list to
  // all masters, which wouldn't match the cards already shown
  const categoryValid =
    input.categorySlug === undefined || isSlug(input.categorySlug);
  if (!city || !categoryValid || !Number.isInteger(offset) || offset < 0) {
    return { ok: false };
  }

  const categorySlug = input.categorySlug;
  const sort = parseSort(input.sort);
  const origin = parseOrigin(sort, input.lat, input.lng);

  try {
    const result = await mastersApi.getMasters({
      city: city.slug,
      category: categorySlug,
      sort,
      offset,
      limit: PAGE_SIZE,
      lat: origin?.lat,
      lng: origin?.lng,
    });
    return {
      ok: true,
      total: result.total,
      masters: result.masters.map((master) =>
        toMasterGridItem(master, cardSubtitle(master, categorySlug)),
      ),
    };
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
}
