import { MasterSort } from "@glow-space/shared";
import { DEFAULT_SORT, Origin, setOriginParams } from "@/lib/masterSort";

export const PAGE_SIZE = 8;

// Default sort and "All" are left out so the plain URL stays canonical.
// lat/lng are kept only with the nearest sort.
export function categoryHref(
  categorySlug: string,
  sub: string | undefined,
  sort: MasterSort,
  origin?: Origin,
): string {
  const params = new URLSearchParams();
  if (sub) params.set("sub", sub);
  if (sort !== DEFAULT_SORT) params.set("sort", sort);
  setOriginParams(params, sort, origin);
  const query = params.toString();
  return `/categories/${encodeURIComponent(categorySlug)}${query ? `?${query}` : ""}`;
}
