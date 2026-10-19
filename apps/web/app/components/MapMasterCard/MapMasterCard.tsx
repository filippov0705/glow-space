import Link from "next/link";
import { MasterCardResponse } from "@glow-space/shared";
import MasterCover from "../MasterCardParts/MasterCover";
import MasterRating from "../MasterCardParts/MasterRating";
import styles from "./MapMasterCard.module.scss";

type MapMasterCardProps = {
  master: MasterCardResponse;
};

export default function MapMasterCard({ master }: MapMasterCardProps) {
  const category = master.categories[0]?.name;

  return (
    <article className={styles.mapCard}>
      <MasterCover
        className={styles.mapCard__photo}
        coverUrl={master.coverUrl}
        name={master.name}
      />

      <div className={styles.mapCard__body}>
        <div className={styles.mapCard__header}>
          <h3 className={styles.mapCard__name}>{master.name}</h3>
          {category && <p className={styles.mapCard__category}>{category}</p>}
        </div>

        <div className={styles.mapCard__footer}>
          <MasterRating
            className={styles.mapCard__rating}
            rating={master.rating}
            reviewsCount={master.reviewsCount}
          />
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
