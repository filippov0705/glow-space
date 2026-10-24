"use client";

import { useState, useTransition } from "react";
import Button from "@/app/components/Button/Button";
import MasterListCard from "@/app/components/MasterListCard/MasterListCard";
import type { LoadMoreMastersResult, MasterGridItem } from "@/lib/masterCard";
import { useMastersCount } from "./MastersCount";
import styles from "./MastersGrid.module.scss";

type MastersGridProps = {
  initialMasters: MasterGridItem[];
  initialTotal: number;
  // A server action bound to the page's filters; gets the next offset
  loadMore: (offset: number) => Promise<LoadMoreMastersResult>;
};

// The page keys this component (or a parent such as MastersCountProvider)
// by its filters, so changing them remounts it and drops the appended pages.
export default function MastersGrid({
  initialMasters,
  initialTotal,
  loadMore,
}: MastersGridProps) {
  const [masters, setMasters] = useState(initialMasters);
  const [total, setTotal] = useState(initialTotal);
  // Rows fetched so far. Kept apart from masters.length, which shrinks
  // when duplicates are dropped and would re-request the same page.
  const [offset, setOffset] = useState(initialMasters.length);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const count = useMastersCount();

  const hasMore = offset < total;

  const showMore = () => {
    setFailed(false);
    startTransition(async () => {
      try {
        const result = await loadMore(offset);
        if (!result.ok) {
          setFailed(true);
          return;
        }
        // Skip masters already shown in case the list shifted between pages.
        // The button is disabled while loading, so `masters` is current.
        const shown = new Set(masters.map((master) => master.uuid));
        const nextMasters = [
          ...masters,
          ...result.masters.filter((master) => !shown.has(master.uuid)),
        ];
        // An empty page means the list ended early; stop offering more
        const nextTotal = result.masters.length === 0 ? offset : result.total;

        setMasters(nextMasters);
        setOffset(offset + result.masters.length);
        setTotal(nextTotal);
        count?.setCount({ shown: nextMasters.length, total: nextTotal });
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
            <MasterListCard master={master} />
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
