"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Button from "@/app/components/Button/Button";
import styles from "./error.module.scss";

type SearchErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function SearchError({
  error,
  unstable_retry,
}: SearchErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <div className={styles.page__card}>
        <h1 className={styles.page__title}>Couldn&apos;t run the search</h1>
        <p className={styles.page__text}>
          Something went wrong on our side. Please try again in a moment.
        </p>
        <Button variant="primary" onClick={() => unstable_retry()}>
          Try again
        </Button>
      </div>
    </main>
  );
}
