"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import Button from "@/app/components/Button/Button";
import buttonStyles from "@/app/components/Button/Button.module.scss";
import styles from "./EmptyState.module.scss";

type EmptyStateProps = {
  cityName: string;
};

export default function EmptyState({ cityName }: EmptyStateProps) {
  return (
    <section className={styles.empty}>
      <span className={styles.empty__icon} aria-hidden="true">
        <Search size={20} strokeWidth={2} />
      </span>
      <h2 className={styles.empty__title}>No masters here yet</h2>
      <p className={styles.empty__text}>
        We don&apos;t have anyone offering this in {cityName} so far. Try
        another city or browse other categories.
      </p>
      <div className={styles.empty__actions}>
        {/* A link styled as the dark button: navigation, not an action */}
        <Link
          href="/categories"
          className={`${buttonStyles.button} ${buttonStyles.button_secondary} ${styles.empty__link}`}
        >
          Browse categories
        </Link>
        {/* Stub, like the header's "Become a Master" */}
        <Button variant="primary" onClick={() => {}}>
          Become a master
        </Button>
      </div>
    </section>
  );
}
