"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { CategoryWithCountResponse } from "@glow-space/shared";
import { formatCount } from "@/lib/format";
import styles from "./CategoriesCatalog.module.scss";

type CategoriesCatalogProps = {
  categories: CategoryWithCountResponse[];
  title: string;
  subtitle: string;
};

export default function CategoriesCatalog({
  categories,
  title,
  subtitle,
}: CategoriesCatalogProps) {
  const [query, setQuery] = useState("");

  const hasCategories = categories.length > 0;
  const normalizedQuery = query.trim().toLowerCase();
  // Keep each category's position in the full list so tile colours stay stable while searching.
  const filtered = categories
    .map((category, index) => ({ category, index }))
    .filter(({ category }) =>
      category.name.toLowerCase().includes(normalizedQuery),
    );

  return (
    <section className={styles.catalog}>
      <div className={styles.catalog__header}>
        <div className={styles.catalog__heading}>
          <h1 className={styles.catalog__title}>{title}</h1>
          {hasCategories && (
            <p className={styles.catalog__subtitle}>{subtitle}</p>
          )}
        </div>

        {hasCategories && (
          <label className={styles.catalog__search}>
            <Search className={styles.catalog__searchIcon} aria-hidden="true" />
            <input
              type="search"
              className={styles.catalog__searchInput}
              placeholder="Search categories"
              aria-label="Search categories"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        )}
      </div>

      {!hasCategories ? (
        <p className={styles.catalog__empty}>No categories available yet.</p>
      ) : filtered.length === 0 ? (
        <p className={styles.catalog__empty}>No categories found</p>
      ) : (
        <ul className={styles.catalog__grid}>
          {filtered.map(({ category, index }) => (
            <li key={category.slug} className={styles.catalog__item}>
              <Link
                href={`/categories/${category.slug}`}
                className={[
                  styles.catalog__tile,
                  category.imageUrl
                    ? styles["catalog__tile--image"]
                    : index % 2 === 1
                      ? styles["catalog__tile--beige"]
                      : styles["catalog__tile--pink"],
                ].join(" ")}
              >
                {category.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.catalog__image}
                    src={category.imageUrl}
                    alt=""
                  />
                )}
                <span className={styles.catalog__badge}>
                  {formatCount(category.mastersCount, "master", "masters")}
                </span>
                <div className={styles.catalog__info}>
                  <h2 className={styles.catalog__name}>{category.name}</h2>
                  {category.description && (
                    <p className={styles.catalog__description}>
                      {category.description}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
