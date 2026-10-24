import { Search } from "lucide-react";
import styles from "./SearchEmptyState.module.scss";

type SearchEmptyStateProps = {
  cityName: string;
  // Whether there are chips above that can be removed
  hasFilters: boolean;
};

export default function SearchEmptyState({
  cityName,
  hasFilters,
}: SearchEmptyStateProps) {
  return (
    <section className={styles.empty} role="status">
      <span className={styles.empty__icon} aria-hidden="true">
        <Search size={20} strokeWidth={2} />
      </span>
      <p className={styles.empty__text}>
        {hasFilters
          ? "No masters match all filters. Try removing one above."
          : `No masters in ${cityName} yet.`}
      </p>
    </section>
  );
}
