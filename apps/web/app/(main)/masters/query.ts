import { MasterListCardResponse, MasterSort } from "@glow-space/shared";
import { joinNames } from "@/lib/masterCard";
import { DEFAULT_SORT, Origin, setOriginParams } from "@/lib/masterSort";

export const PAGE_SIZE = 12;

// Card subtitle: the selected category's name (taken from the master's own
// categories, so it never comes from the client), otherwise all of them
export function cardSubtitle(
  master: MasterListCardResponse,
  categorySlug: string | undefined,
): string {
  const selected = categorySlug
    ? master.categories.find((category) => category.slug === categorySlug)
    : undefined;
  return selected?.name ?? joinNames(master.categories);
}

// Default sort and "All" are left out so the plain URL stays canonical.
// lat/lng are kept only with the nearest sort.
export function mastersHref(
  category: string | undefined,
  sort: MasterSort,
  origin?: Origin,
): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort !== DEFAULT_SORT) params.set("sort", sort);
  setOriginParams(params, sort, origin);
  const query = params.toString();
  return `/masters${query ? `?${query}` : ""}`;
}
