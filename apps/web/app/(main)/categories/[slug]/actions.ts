"use server";

import { cookies } from "next/headers";
import { CategoryMastersResponse } from "@glow-space/shared";
import mastersApi from "@/lib/api/masters";
import { getCityBySlug } from "@/lib/city";
import { isSlug } from "@/lib/slug";
import { CITY_COOKIE, CITY_COOKIE_MAX_AGE } from "@/app/constants";
import { PAGE_SIZE, parseSort } from "./query";

export type LoadMoreMastersInput = {
  categorySlug: string;
  citySlug: string;
  sub?: string;
  sort: string;
  offset: number;
};

export type LoadMoreMastersResult =
  | ({ ok: true } & CategoryMastersResponse)
  | { ok: false };

// Next page for "Show more". The city comes from the rendered page, so
// appended masters always match the ones already shown.
export async function loadMoreMasters(
  input: LoadMoreMastersInput,
): Promise<LoadMoreMastersResult> {
  // Actions are public POST endpoints, so the input shape isn't trusted
  if (typeof input !== "object" || input === null) return { ok: false };

  const city = getCityBySlug(input.citySlug);
  if (
    !city ||
    !isSlug(input.categorySlug) ||
    !Number.isInteger(input.offset) ||
    input.offset < 0
  ) {
    return { ok: false };
  }

  try {
    const result = await mastersApi.getCategoryMasters(input.categorySlug, {
      city: city.slug,
      sub: isSlug(input.sub) ? input.sub : undefined,
      sort: parseSort(input.sort),
      offset: input.offset,
      limit: PAGE_SIZE,
    });
    return { ok: true, ...result };
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
