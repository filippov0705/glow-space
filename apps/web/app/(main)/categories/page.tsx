import type { Metadata } from "next";
import Link from "next/link";
import mastersApi from "@/lib/api/masters";
import { formatCount } from "@/lib/format";
import CategoriesCatalog from "../../components/CategoriesCatalog/CategoriesCatalog";
import { resolveCurrentCity } from "../actions";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "All categories · GlowSpace",
  description: "Browse all beauty categories and masters in your city",
};

export default async function CategoriesPage() {
  const city = await resolveCurrentCity();
  const overview = await mastersApi.getCategoriesOverview(city.slug);

  const subtitle = `${formatCount(overview.categories.length, "category", "categories")} and ${formatCount(overview.totalMasters, "master", "masters")} in ${city.name}`;

  return (
    <main className={styles.page}>
      <nav aria-label="Breadcrumb" className={styles.page__breadcrumb}>
        <Link href="/" className={styles.page__breadcrumbLink}>
          Home
        </Link>
        <span className={styles.page__breadcrumbSeparator}>/</span>
        <span aria-current="page">Categories</span>
      </nav>

      <CategoriesCatalog
        categories={overview.categories}
        title="All categories"
        subtitle={subtitle}
      />
    </main>
  );
}
