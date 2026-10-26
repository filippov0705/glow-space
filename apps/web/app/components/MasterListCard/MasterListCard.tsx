import Link from "next/link";
import MasterCover from "@/app/components/MasterCardParts/MasterCover";
import MasterRating from "@/app/components/MasterCardParts/MasterRating";
import { formatPrice } from "@/lib/format";
import type { MasterGridItem } from "@/lib/masterCard";
import styles from "./MasterListCard.module.scss";

type MasterListCardProps = {
  master: MasterGridItem;
};

// The name links to the profile; its ::after stretches over the whole card,
// so the card is clickable with a single link in the tab order.
export default function MasterListCard({ master }: MasterListCardProps) {
  return (
    <article className={styles.card}>
      <MasterCover
        className={styles.card__photo}
        coverUrl={master.photoUrl}
        name={master.name}
      />

      <div className={styles.card__body}>
        <h2 className={styles.card__name}>
          <Link href={`/masters/${master.uuid}`} className={styles.card__link}>
            {master.name}
          </Link>
        </h2>
        {master.subtitle && (
          <p className={styles.card__subtitle}>{master.subtitle}</p>
        )}
        <div className={styles.card__footer}>
          <MasterRating
            rating={master.rating}
            reviewsCount={master.reviewsCount}
          />
          <p className={styles.card__price}>
            from {formatPrice(master.minPrice, master.currency)}
          </p>
        </div>
      </div>
    </article>
  );
}
