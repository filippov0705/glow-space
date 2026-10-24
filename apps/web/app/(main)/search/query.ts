import {
  MasterListCardResponse,
  MasterSort,
  SEARCH_CHIP_KINDS,
  SearchChipKind,
} from "@glow-space/shared";
import { formatCount, formatPrice } from "@/lib/format";
import { joinNames } from "@/lib/masterCard";
import {
  DEFAULT_SORT,
  Origin,
  parseOrigin,
  parseSort,
  setOriginParams,
} from "@/lib/masterSort";
import { isSlug } from "@/lib/slug";

export const PAGE_SIZE = 12;

// Same limit as the parser endpoint and the search input
export const QUERY_MAX_LENGTH = 300;

export type SearchParams = {
  q: string;
  // Explicit category picked in the clarifying card; overrides the parser
  category?: string;
  // Chip kinds removed with ×
  without: SearchChipKind[];
  sort: MasterSort;
  origin?: Origin;
};

// What /masters is called with, on top of the city, sort and paging
export type SearchFilters = {
  category?: string;
  subcategory?: string;
  priceMax?: number; // in cents
};

type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const isChipKind = (value: string): value is SearchChipKind =>
  SEARCH_CHIP_KINDS.some((kind) => kind === value);

// q is trimmed (a no-JS submit can send "q=+++"); an empty q is null so the
// page can redirect home. Unknown `without` kinds are dropped.
export function parseSearchParams(raw: RawSearchParams): SearchParams | null {
  // Trimmed again after the cut, which can end on a space
  const q = (first(raw.q) ?? "").trim().slice(0, QUERY_MAX_LENGTH).trim();
  if (!q) return null;

  const category = first(raw.category);
  const withoutRaw = raw.without;
  const withoutList =
    withoutRaw === undefined
      ? []
      : Array.isArray(withoutRaw)
        ? withoutRaw
        : [withoutRaw];
  const without = [...new Set(withoutList.filter(isChipKind))];
  const sort = parseSort(first(raw.sort));

  return {
    q,
    category: isSlug(category) ? category : undefined,
    without,
    sort,
    origin: parseOrigin(sort, first(raw.lat), first(raw.lng)),
  };
}

// The default sort is left out so the plain URL stays canonical.
// lat/lng are kept only with the nearest sort.
export function searchHref(params: SearchParams): string {
  const query = new URLSearchParams({ q: params.q });
  if (params.category) query.set("category", params.category);
  for (const kind of params.without) query.append("without", kind);
  if (params.sort !== DEFAULT_SORT) query.set("sort", params.sort);
  setOriginParams(query, params.sort, params.origin);
  return `/search?${query}`;
}

// × on a chip: the same search with that kind removed. Removing the
// category also drops an explicit `category` override.
export function withoutHref(params: SearchParams, kind: SearchChipKind): string {
  return searchHref({
    ...params,
    category: kind === "category" ? undefined : params.category,
    without: params.without.includes(kind)
      ? params.without
      : [...params.without, kind],
  });
}

// "Gel, Nail art": the master's subcategories, or its categories when the
// list is empty
export function bestMatchSubtitle(master: MasterListCardResponse): string {
  return master.subcategories.length > 0
    ? joinNames(master.subcategories)
    : joinNames(master.categories);
}

// "Nails": grid cards show the master's categories, as in the mockup
export function gridSubtitle(master: MasterListCardResponse): string {
  return joinNames(master.categories);
}

type ExplanationContext = {
  // The service the price refers to: the subcategory or category chip label
  serviceName?: string;
  priceMax?: number;
};

// "Rated 4.9 from 128 reviews, Gel polish from €30, within your budget."
// Parts without data are skipped.
export function bestMatchExplanation(
  master: MasterListCardResponse,
  { serviceName, priceMax }: ExplanationContext,
): string {
  const parts: string[] = [];
  if (master.rating !== null) {
    const reviews = formatCount(master.reviewsCount, "review", "reviews");
    parts.push(`rated ${master.rating.toFixed(1)} from ${reviews}`);
  }
  const price = formatPrice(master.minPrice, master.currency);
  parts.push(serviceName ? `${serviceName} from ${price}` : `from ${price}`);
  // minPrice is already limited by priceMax on the backend
  if (priceMax !== undefined) parts.push("within your budget");

  const sentence = parts.join(", ");
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
}
