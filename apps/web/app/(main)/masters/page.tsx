import type { Metadata } from "next";
import Link from "next/link";
import { isAxiosError } from "axios";
import { MASTER_SORTS, MastersListResponse } from "@glow-space/shared";
import MastersCount, {
  MastersCountProvider,
} from "@/app/components/MastersGrid/MastersCount";
import MastersGrid from "@/app/components/MastersGrid/MastersGrid";
import SortSelect from "@/app/components/SortSelect/SortSelect";
import mastersApi from "@/lib/api/masters";
import { formatCount } from "@/lib/format";
import { toMasterGridItem } from "@/lib/masterCard";
import {
  SORT_LABELS,
  SORT_SUBTITLES,
  parseOrigin,
  parseSort,
} from "@/lib/masterSort";
import { isSlug } from "@/lib/slug";
import { resolveCurrentCity } from "../actions";
import { loadMoreMasters } from "./actions";
import CategoryChips from "./components/CategoryChips/CategoryChips";
import EmptyState, {
  CategoryEmptyState,
} from "./components/EmptyState/EmptyState";
import { PAGE_SIZE, cardSubtitle, mastersHref } from "./query";
import styles from "./page.module.scss";

export async function generateMetadata(): Promise<Metadata> {
  const city = await resolveCurrentCity();
  return {
    title: `Masters in ${city.name} · GlowSpace`,
    description: `Beauty masters in ${city.name}: ratings, reviews and prices`,
  };
}

export default async function MastersPage(props: PageProps<"/masters">) {
  const query = await props.searchParams;
  const city = await resolveCurrentCity();

  // Chips: categories that have masters in the city, in sortOrder.
  // The overview returns an empty list when it fails.
  const overview = await mastersApi.getCategoriesOverview(city.slug);
  const categories = overview.categories.filter(
    (category) => category.mastersCount > 0,
  );
  const sort = parseSort(query.sort);
  const origin = parseOrigin(sort, query.lat, query.lng);

  const fetchFirstPage = (category: string | undefined) =>
    mastersApi.getMasters({
      city: city.slug,
      category,
      sort,
      offset: 0,
      limit: PAGE_SIZE,
      lat: origin?.lat,
      lng: origin?.lng,
    });

  // The requested slug goes to the backend even if the overview doesn't
  // list it (it may have failed); only an unknown category (404) falls
  // back to "All"
  let categorySlug = isSlug(query.category) ? query.category : undefined;
  let firstPage: MastersListResponse;
  try {
    firstPage = await fetchFirstPage(categorySlug);
  } catch (error) {
    const unknownCategory =
      categorySlug !== undefined &&
      isAxiosError(error) &&
      error.response?.status === 404;
    if (!unknownCategory) throw error;
    categorySlug = undefined;
    firstPage = await fetchFirstPage(undefined);
  }
  const { total, masters } = firstPage;
  const categoryName = overview.categories.find(
    (candidate) => candidate.slug === categorySlug,
  )?.name;

  const title = `Masters in ${city.name}`;
  const allHref = mastersHref(undefined, sort, origin);
  // Remounts the toolbar, grid and counter when the list changes:
  // drops appended pages and any pending location request in SortSelect
  const listKey = [
    city.slug,
    categorySlug,
    sort,
    origin?.lat,
    origin?.lng,
  ].join(":");

  const chips = [
    {
      key: "all",
      name: "All",
      href: allHref,
      active: !categorySlug,
    },
    ...categories.map((candidate) => ({
      key: candidate.slug,
      name: candidate.name,
      href: mastersHref(candidate.slug, sort, origin),
      active: candidate.slug === categorySlug,
    })),
  ];

  return (
    <main className={styles.page}>
      <nav aria-label="Breadcrumb" className={styles.page__breadcrumb}>
        <Link href="/" className={styles.page__breadcrumbLink}>
          Home
        </Link>
        <span className={styles.page__breadcrumbSeparator}>/</span>
        <span aria-current="page">Masters</span>
      </nav>

      {total === 0 && !categorySlug ? (
        <>
          <h1 className={styles.page__title}>{title}</h1>
          <EmptyState cityName={city.name} />
        </>
      ) : (
        <>
          <div className={styles.page__heading}>
            <h1 className={styles.page__title}>{title}</h1>
            {total > 0 && (
              <p className={styles.page__subtitle}>
                {formatCount(total, "master", "masters")}, sorted by{" "}
                {SORT_SUBTITLES[sort]}
              </p>
            )}
          </div>

          <MastersCountProvider
            key={listKey}
            shown={masters.length}
            total={total}
          >
            <div className={styles.page__toolbar}>
              <CategoryChips chips={chips} />

              <div className={styles.page__controls}>
                <MastersCount />
                <SortSelect
                  value={sort}
                  options={MASTER_SORTS.map((option) => ({
                    value: option,
                    label: SORT_LABELS[option],
                    href: mastersHref(categorySlug, option),
                  }))}
                />
              </div>
            </div>

            {total === 0 ? (
              <CategoryEmptyState
                cityName={city.name}
                categoryName={categoryName}
                allHref={allHref}
              />
            ) : (
              <MastersGrid
                initialMasters={masters.map((master) =>
                  toMasterGridItem(master, cardSubtitle(master, categorySlug)),
                )}
                initialTotal={total}
                loadMore={loadMoreMasters.bind(null, {
                  citySlug: city.slug,
                  categorySlug,
                  sort,
                  lat: origin?.lat,
                  lng: origin?.lng,
                })}
              />
            )}
          </MastersCountProvider>
        </>
      )}
    </main>
  );
}
