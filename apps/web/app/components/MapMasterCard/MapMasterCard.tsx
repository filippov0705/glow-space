import Link from "next/link";
import { MasterCardResponse } from "@glow-space/shared";
import MasterCover from "../MasterCardParts/MasterCover";
import MasterRating from "../MasterCardParts/MasterRating";
import styles from "./MapMasterCard.module.scss";

type MapMasterCardProps = {
  master: MasterCardResponse;
  // "popup": inside the Leaflet popup on desktop and tablet.
  // "docked": a single row docked at the bottom of the map on mobile.
  variant?: "popup" | "docked";
};

export default function MapMasterCard({
  master,
  variant = "popup",
}: MapMasterCardProps) {
  const category = master.categories[0]?.name;

  const photo = (
    <MasterCover
      className={styles.mapCard__photo}
      coverUrl={master.photoUrl ?? master.coverUrl}
      name={master.name}
    />
  );
  const name = <h3 className={styles.mapCard__name}>{master.name}</h3>;
  const categoryLine = category && (
    <p className={styles.mapCard__category}>{category}</p>
  );
  const rating = (
    <MasterRating
      className={styles.mapCard__rating}
      rating={master.rating}
      reviewsCount={master.reviewsCount}
    />
  );

  if (variant === "docked") {
    return (
      <article className={`${styles.mapCard} ${styles.mapCard_docked}`}>
        {photo}

        <div className={styles.mapCard__body}>
          {name}
          <div className={styles.mapCard__meta}>
            {categoryLine}
            {category && (
              <span className={styles.mapCard__separator} aria-hidden="true">
                ·
              </span>
            )}
            {rating}
          </div>
        </div>

        <Link className={styles.mapCard__link} href={`/masters/${master.uuid}`}>
          View
        </Link>
      </article>
    );
  }

  return (
    <article className={styles.mapCard}>
      {photo}

      <div className={styles.mapCard__body}>
        <div className={styles.mapCard__header}>
          {name}
          {categoryLine}
        </div>

        <div className={styles.mapCard__footer}>
          {rating}
          <Link
            className={styles.mapCard__link}
            href={`/masters/${master.uuid}`}
          >
            View profile
          </Link>
        </div>
      </div>
    </article>
  );
}
