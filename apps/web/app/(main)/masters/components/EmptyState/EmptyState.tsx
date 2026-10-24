"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import Button from "@/app/components/Button/Button";
import styles from "./EmptyState.module.scss";

type EmptyStateProps = {
  cityName: string;
};

type CategoryEmptyStateProps = {
  cityName: string;
  // Unknown when the categories overview couldn't be loaded
  categoryName?: string;
  allHref: string;
};

// A category is selected but has no masters in the city
export function CategoryEmptyState({
  cityName,
  categoryName,
  allHref,
}: CategoryEmptyStateProps) {
  return (
    <section className={styles.empty}>
      <span className={styles.empty__icon} aria-hidden="true">
        <Search size={20} strokeWidth={2} />
      </span>
      <h2 className={styles.empty__title}>
        {categoryName
          ? `No ${categoryName} masters in ${cityName} yet`
          : `No masters in this category in ${cityName} yet`}
      </h2>
      <p className={styles.empty__text}>
        Try another category or see all masters in {cityName}.
      </p>
      <div className={styles.empty__actions}>
        <Link href={allHref} scroll={false} className={styles.empty__link}>
          Show all masters
        </Link>
      </div>
    </section>
  );
}

export default function EmptyState({ cityName }: EmptyStateProps) {
  return (
    <section className={styles.empty}>
      <span className={styles.empty__icon} aria-hidden="true">
        <Search size={20} strokeWidth={2} />
      </span>
      <h2 className={styles.empty__title}>No masters in {cityName} yet</h2>
      <p className={styles.empty__text}>
        Nobody offers their services in {cityName} so far. Check back soon or
        try another city.
      </p>
      <div className={styles.empty__actions}>
        {/* Stub, like the header's "Become a Master" */}
        <Button variant="primary" onClick={() => {}}>
          Become a master
        </Button>
      </div>
    </section>
  );
}
