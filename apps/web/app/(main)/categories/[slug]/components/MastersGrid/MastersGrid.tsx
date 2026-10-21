"use client";

import { useState, useTransition } from "react";
import type {
  CategoryMasterCardResponse,
  MasterSort,
} from "@glow-space/shared";
import Button from "@/app/components/Button/Button";
import { loadMoreMasters } from "../../actions";
import CategoryMasterCard from "../CategoryMasterCard/CategoryMasterCard";
import styles from "./MastersGrid.module.scss";

type MastersGridProps = {
  categorySlug: string;
  citySlug: string;
  sub?: string;
  sort: MasterSort;
  initialMasters: CategoryMasterCardResponse[];
  initialTotal: number;
};

// The page passes a key built from sub and sort, so changing the filter
// remounts this component and drops the appended pages.
export default function MastersGrid({
  categorySlug,
  citySlug,
  sub,
  sort,
  initialMasters,
  initialTotal,
}: MastersGridProps) {
  const [masters, setMasters] = useState(initialMasters);
  const [total, setTotal] = useState(initialTotal);
  // Rows fetched so far. Kept apart from masters.length, which shrinks
  // when duplicates are dropped and would re-request the same page.
  const [offset, setOffset] = useState(initialMasters.length);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasMore = offset < total;

  const showMore = () => {
    setFailed(false);
    startTransition(async () => {
      try {
        const result = await loadMoreMasters({
          categorySlug,
          citySlug,
          sub,
          sort,
          offset,
        });
        if (!result.ok) {
          setFailed(true);
          return;
        }
        // Skip masters already shown in case the list shifted between pages
        setMasters((current) => {
          const shown = new Set(current.map((master) => master.uuid));
          return [
            ...current,
            ...result.masters.filter((master) => !shown.has(master.uuid)),
          ];
        });
        setOffset(offset + result.masters.length);
        // An empty page means the list ended early; stop offering more
        setTotal(
          result.masters.length === 0 ? offset : result.total,
        );
      } catch (error) {
        console.error(error);
        setFailed(true);
      }
    });
  };

  return (
    <div className={styles.masters}>
      <ul className={styles.masters__grid}>
        {masters.map((master) => (
          <li key={master.uuid} className={styles.masters__item}>
            <CategoryMasterCard master={master} />
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className={styles.masters__more}>
          {failed && (
            <p className={styles.masters__error} role="alert">
              Couldn&apos;t load more masters. Please try again.
            </p>
          )}
          <Button variant="primary" onClick={showMore} disabled={isPending}>
            {isPending ? "Loading…" : failed ? "Try again" : "Show more"}
          </Button>
        </div>
      )}
    </div>
  );
}
