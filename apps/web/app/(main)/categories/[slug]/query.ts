import { MASTER_SORTS, MasterSort } from "@glow-space/shared";

export const DEFAULT_SORT: MasterSort = "top_rated";
export const PAGE_SIZE = 8;

export const SORT_LABELS: Record<MasterSort, string> = {
  top_rated: "Top rated",
  most_reviews: "Most reviews",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  newest: "Newest",
};

// Used in the subtitle: "214 masters, sorted by rating"
export const SORT_SUBTITLES: Record<MasterSort, string> = {
  top_rated: "rating",
  most_reviews: "number of reviews",
  price_asc: "price, low to high",
  price_desc: "price, high to low",
  newest: "newest",
};

export function parseSort(value: unknown): MasterSort {
  return MASTER_SORTS.find((sort) => sort === value) ?? DEFAULT_SORT;
}

// Default sort and "All" are left out so the plain URL stays canonical.
export function categoryHref(
  categorySlug: string,
  sub: string | undefined,
  sort: MasterSort,
): string {
  const params = new URLSearchParams();
  if (sub) params.set("sub", sub);
  if (sort !== DEFAULT_SORT) params.set("sort", sort);
  const query = params.toString();
  return `/categories/${encodeURIComponent(categorySlug)}${query ? `?${query}` : ""}`;
}
