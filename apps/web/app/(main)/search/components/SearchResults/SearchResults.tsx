import { isAxiosError } from "axios";
import {
  MASTER_SORTS,
  MasterSort,
  MastersListResponse,
  SearchChipKind,
  SearchChipResponse,
  SearchFiltersResponse,
  SearchParseResponse,
} from "@glow-space/shared";
import MastersGrid from "@/app/components/MastersGrid/MastersGrid";
import SortSelect from "@/app/components/SortSelect/SortSelect";
import mastersApi from "@/lib/api/masters";
import { toMasterGridItem } from "@/lib/masterCard";
import { DEFAULT_SORT, Origin, SORT_LABELS } from "@/lib/masterSort";
import { resolveCurrentCity } from "../../../actions";
import { loadMoreSearchResults } from "../../actions";
import {
  PAGE_SIZE,
  SearchFilters,
  SearchParams,
  bestMatchExplanation,
  bestMatchSubtitle,
  gridSubtitle,
  searchHref,
  withoutHref,
} from "../../query";
import BestMatchCard from "../BestMatchCard/BestMatchCard";
import ClarifyCard from "../ClarifyCard/ClarifyCard";
import SearchEmptyState from "../SearchEmptyState/SearchEmptyState";
import UnderstoodChips from "../UnderstoodChips/UnderstoodChips";
import styles from "./SearchResults.module.scss";

type SearchResultsProps = {
  params: SearchParams;
};

// The area chip only sorts, so it doesn't narrow the list
const FILTER_CHIP_KINDS = new Set<SearchChipKind>([
  "category",
  "subcategory",
  "priceMax",
  "day",
]);

// The first page also holds Best match, so the grid starts with a full page
const FIRST_PAGE_LIMIT = PAGE_SIZE + 1;

// Filters, the place and chips from the parser, minus the removed kinds.
// Removing the category also drops the subcategory: /masters needs a
// category for it. A clarify response has no category, but its price, day
// and area still count.
function fromParser(
  parsed: SearchParseResponse,
  removed: Set<SearchChipKind>,
): { filters: SearchFilters; place?: Origin; chips: SearchChipResponse[] } {
  const parsedFilters: SearchFiltersResponse = parsed.filters;
  const category = removed.has("category") ? undefined : parsedFilters.category;
  const subcategory =
    category && !removed.has("subcategory")
      ? parsedFilters.subcategory
      : undefined;
  const priceMax = removed.has("priceMax") ? undefined : parsedFilters.priceMax;
  const withDay = !removed.has("day");

  return {
    filters: {
      category,
      subcategory,
      priceMax,
      dateFrom: withDay ? parsedFilters.dateFrom : undefined,
      dateTo: withDay ? parsedFilters.dateTo : undefined,
    },
    place: removed.has("area") ? undefined : parsedFilters.origin,
    chips: parsed.chips.filter(
      (chip) =>
        !removed.has(chip.kind) &&
        !(chip.kind === "subcategory" && !subcategory),
    ),
  };
}

const isNotFound = (error: unknown): boolean =>
  isAxiosError(error) && error.response?.status === 404;

export default async function SearchResults({ params }: SearchResultsProps) {
  const city = await resolveCurrentCity();
  // Errors propagate to search/error.tsx
  const parsed = await mastersApi.parseSearch(params.q, city.slug);
  const removed = new Set(params.without);
  const parserResult = fromParser(parsed, removed);

  // A place in the query sorts by distance from it unless another sort was
  // picked, and it beats the browser location
  const { place } = parserResult;
  const sort: MasterSort = params.sort ?? (place ? "nearest" : DEFAULT_SORT);
  const origin = sort === "nearest" ? (place ?? params.origin) : undefined;

  const fetchFirstPage = (filters: SearchFilters) =>
    mastersApi.getMasters({
      city: city.slug,
      ...filters,
      sort,
      offset: 0,
      limit: FIRST_PAGE_LIMIT,
      lat: origin?.lat,
      lng: origin?.lng,
    });

  let category = removed.has("category") ? undefined : params.category;
  let filters = parserResult.filters;
  let chips = parserResult.chips;
  let firstPage: MastersListResponse | null = null;

  // An explicit category replaces the parser's category and subcategory;
  // the parser's price, day and area still apply. The override usually comes
  // from the clarifying card, whose response keeps them for this. An unknown
  // category (404) falls back to the parser result, as on /masters.
  if (category) {
    const overrideFilters: SearchFilters = {
      category,
      priceMax: parserResult.filters.priceMax,
      dateFrom: parserResult.filters.dateFrom,
      dateTo: parserResult.filters.dateTo,
    };
    try {
      firstPage = await fetchFirstPage(overrideFilters);
      filters = overrideFilters;
    } catch (error) {
      if (!isNotFound(error)) throw error;
      category = undefined;
    }
  }

  if (firstPage && category) {
    const categories =
      parsed.status === "clarify"
        ? parsed.categories
        : await mastersApi.getCategories();
    const label =
      categories.find((candidate) => candidate.slug === category)?.name ??
      category;
    chips = [
      { kind: "category", label },
      ...chips.filter(
        (chip) => chip.kind !== "category" && chip.kind !== "subcategory",
      ),
    ];
  }

  if (!firstPage) {
    // With the category chip removed the search runs across all categories
    // instead of asking again
    if (parsed.status === "clarify" && !removed.has("category")) {
      return (
        <ClarifyCard
          q={params.q}
          categories={parsed.categories}
          day={parsed.chips.find((chip) => chip.kind === "day")?.label}
        />
      );
    }
    firstPage = await fetchFirstPage(filters);
  }

  // Links are built from the effective params: a failed override is dropped
  const effective: SearchParams = { ...params, category };
  const { total, masters } = firstPage;
  const [bestMatch, ...rest] = masters;
  const moreTotal = Math.max(total - 1, 0);
  const serviceName =
    chips.find((chip) => chip.kind === "subcategory")?.label ??
    chips.find((chip) => chip.kind === "category")?.label;

  // Remounts the grid when the list changes, dropping appended pages
  const listKey = JSON.stringify([city.slug, filters, sort, origin]);
  const hasFilters = chips.some((chip) => FILTER_CHIP_KINDS.has(chip.kind));
  // Geoapify's free plan requires its and OpenStreetMap's attribution
  // wherever a geocoded place is used
  const showGeoAttribution = parsed.geocoded && place !== undefined;

  return (
    <>
      {chips.length > 0 && (
        <UnderstoodChips
          chips={chips.map((chip) => ({
            kind: chip.kind,
            label: chip.label,
            removeHref: withoutHref(effective, chip.kind),
          }))}
        />
      )}

      {showGeoAttribution && (
        <p className={styles.attribution}>
          <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">
            Powered by Geoapify
          </a>
          {" · "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap contributors
          </a>
        </p>
      )}

      {!bestMatch ? (
        <SearchEmptyState cityName={city.name} hasFilters={hasFilters} />
      ) : (
        <>
          <BestMatchCard
            master={bestMatch}
            subtitle={bestMatchSubtitle(bestMatch)}
            explanation={bestMatchExplanation(bestMatch, {
              serviceName,
              priceMax: filters.priceMax,
            })}
          />

          {moreTotal > 0 && (
            <section
              className={styles.more}
              aria-labelledby="search-more-title"
            >
              <div className={styles.more__header}>
                <h2 id="search-more-title" className={styles.more__title}>
                  More masters ({moreTotal.toLocaleString("en-US")})
                </h2>
                <SortSelect
                  value={sort}
                  options={MASTER_SORTS.map((option) => ({
                    value: option,
                    label: SORT_LABELS[option],
                    href: searchHref({
                      ...effective,
                      sort: option,
                      origin: undefined,
                    }),
                  }))}
                />
              </div>

              <MastersGrid
                key={listKey}
                initialMasters={rest.map((master) =>
                  toMasterGridItem(master, gridSubtitle(master)),
                )}
                initialTotal={moreTotal}
                loadMore={loadMoreSearchResults.bind(null, {
                  citySlug: city.slug,
                  ...filters,
                  sort,
                  lat: origin?.lat,
                  lng: origin?.lng,
                })}
              />
            </section>
          )}
        </>
      )}
    </>
  );
}
