import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MASTER_SORTS } from "@glow-space/shared";
import MastersCount, {
  MastersCountProvider,
} from "@/app/components/MastersGrid/MastersCount";
import MastersGrid from "@/app/components/MastersGrid/MastersGrid";
import SortSelect from "@/app/components/SortSelect/SortSelect";
import mastersApi from "@/lib/api/masters";
import { formatCount } from "@/lib/format";
import { joinNames, toMasterGridItem } from "@/lib/masterCard";
import {
  SORT_LABELS,
  SORT_SUBTITLES,
  parseOrigin,
  parseSort,
} from "@/lib/masterSort";
import { resolveCurrentCity } from "../../actions";
import { loadMoreMasters } from "./actions";
import EmptyState from "./components/EmptyState/EmptyState";
import OtherCities from "./components/OtherCities/OtherCities";
import { PAGE_SIZE, categoryHref } from "./query";
import styles from "./page.module.scss";

// Memoized per request: generateMetadata and the page both need it.
const getCategoryPage = cache((categorySlug: string, citySlug: string) =>
  mastersApi.getCategoryPage(categorySlug, citySlug),
);

export async function generateMetadata(
  props: PageProps<"/categories/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const city = await resolveCurrentCity();
  const page = await getCategoryPage(slug, city.slug);
  if (!page) return { title: "Category not found · GlowSpace" };

  return {
    title: `${page.category.name} in ${city.name} · GlowSpace`,
    description:
      page.category.description ??
      `${page.category.name} masters in ${city.name}`,
  };
}

export default async function CategoryPage(
  props: PageProps<"/categories/[slug]">,
) {
  const { slug } = await props.params;
  const query = await props.searchParams;
  const city = await resolveCurrentCity();

  const page = await getCategoryPage(slug, city.slug);
  if (!page) notFound();

  const { category, subcategories } = page;
  // Unknown or empty subcategories fall back to "All"
  const sub = subcategories.find(
    (subcategory) => subcategory.slug === query.sub,
  )?.slug;
  const sort = parseSort(query.sort);
  const origin = parseOrigin(sort, query.lat, query.lng);

  const { total, masters } = await mastersApi.getCategoryMasters(slug, {
    city: city.slug,
    sub,
    sort,
    offset: 0,
    limit: PAGE_SIZE,
    lat: origin?.lat,
    lng: origin?.lng,
  });

  // total === 0 means the whole category is empty in the city: `sub` is
  // only set when it is one of the chips, and chips only list
  // subcategories that have masters here. Other cities are only shown
  // (and fetched) in this empty state.
  const otherCities =
    total === 0 ? await mastersApi.getCategoryCities(slug, city.slug) : null;

  const title = `${category.name} in ${city.name}`;
  // Remounts the grid and its counter when the list changes, dropping
  // appended pages
  const listKey = [city.slug, sub, sort, origin?.lat, origin?.lng].join(":");

  return (
    <main className={styles.page}>
      <nav aria-label="Breadcrumb" className={styles.page__breadcrumb}>
        <Link href="/" className={styles.page__breadcrumbLink}>
          Home
        </Link>
        <span className={styles.page__breadcrumbSeparator}>/</span>
        <Link href="/categories" className={styles.page__breadcrumbLink}>
          Categories
        </Link>
        <span className={styles.page__breadcrumbSeparator}>/</span>
        <span aria-current="page">{category.name}</span>
      </nav>

      {otherCities ? (
        <>
          <h1 className={styles.page__title}>{title}</h1>
          <EmptyState cityName={city.name} />
          <OtherCities cities={otherCities} />
        </>
      ) : (
        <>
          <div className={styles.page__heading}>
            <h1 className={styles.page__title}>{title}</h1>
            <p className={styles.page__subtitle}>
              {formatCount(total, "master", "masters")}, sorted by{" "}
              {SORT_SUBTITLES[sort]}
            </p>
          </div>

          <MastersCountProvider
            key={listKey}
            shown={masters.length}
            total={total}
          >
            <div className={styles.page__toolbar}>
              <nav aria-label="Subcategories" className={styles.page__chips}>
                <Link
                  href={categoryHref(slug, undefined, sort, origin)}
                  scroll={false}
                  className={`${styles.page__chip} ${sub ? "" : styles["page__chip--active"]}`}
                  aria-current={sub ? undefined : "page"}
                >
                  All
                </Link>
                {subcategories.map((subcategory) => {
                  const active = subcategory.slug === sub;
                  return (
                    <Link
                      key={subcategory.slug}
                      href={categoryHref(slug, subcategory.slug, sort, origin)}
                      scroll={false}
                      className={`${styles.page__chip} ${active ? styles["page__chip--active"] : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      {subcategory.name}
                    </Link>
                  );
                })}
              </nav>

              <div className={styles.page__controls}>
                <MastersCount />
                <SortSelect
                  value={sort}
                  options={MASTER_SORTS.map((option) => ({
                    value: option,
                    label: SORT_LABELS[option],
                    href: categoryHref(slug, sub, option),
                  }))}
                />
              </div>
            </div>

            <MastersGrid
              initialMasters={masters.map((master) =>
                toMasterGridItem(master, joinNames(master.subcategories)),
              )}
              initialTotal={total}
              loadMore={loadMoreMasters.bind(null, {
                categorySlug: slug,
                citySlug: city.slug,
                sub,
                sort,
                lat: origin?.lat,
                lng: origin?.lng,
              })}
            />
          </MastersCountProvider>
        </>
      )}
    </main>
  );
}
