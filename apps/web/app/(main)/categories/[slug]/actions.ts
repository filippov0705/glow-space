"use server";

import { cookies } from "next/headers";
import mastersApi from "@/lib/api/masters";
import { getCityBySlug } from "@/lib/city";
import {
  LoadMoreMastersResult,
  joinNames,
  toMasterGridItem,
} from "@/lib/masterCard";
import { parseOrigin, parseSort } from "@/lib/masterSort";
import { isSlug } from "@/lib/slug";
import { CITY_COOKIE, CITY_COOKIE_MAX_AGE } from "@/app/constants";
import { PAGE_SIZE } from "./query";

export type LoadMoreMastersInput = {
  categorySlug: string;
  citySlug: string;
  sub?: string;
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
  if (
    !city ||
    !isSlug(input.categorySlug) ||
    !Number.isInteger(offset) ||
    offset < 0
  ) {
    return { ok: false };
  }

  const sort = parseSort(input.sort);
  const origin = parseOrigin(sort, input.lat, input.lng);

  try {
    const result = await mastersApi.getCategoryMasters(input.categorySlug, {
      city: city.slug,
      sub: isSlug(input.sub) ? input.sub : undefined,
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
        toMasterGridItem(master, joinNames(master.subcategories)),
      ),
    };
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
}

// Setting a cookie in a server action re-renders the current page,
// so the category page reloads with the new city.
export async function selectCity(citySlug: string): Promise<void> {
  const city = getCityBySlug(citySlug);
  if (!city) return;

  const cookieStore = await cookies();
  cookieStore.set(CITY_COOKIE, city.slug, {
    maxAge: CITY_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
}
