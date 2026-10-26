import Link from "next/link";
import { MasterCardResponse } from "@glow-space/shared";
import MasterCover from "../MasterCardParts/MasterCover";
import MasterRating from "../MasterCardParts/MasterRating";
import styles from "./MasterCard.module.scss";

type MasterCardProps = {
  master: MasterCardResponse;
};

// The name links to the profile; its ::after stretches over the whole card,
// so the card is clickable with a single link in the tab order.
export default function MasterCard({ master }: MasterCardProps) {
  const category = master.categories[0]?.name;

  return (
    <article className={styles.card}>
      <MasterCover
        className={styles.card__photo}
        coverUrl={master.photoUrl ?? master.coverUrl}
        name={master.name}
      />

      <div className={styles.card__body}>
        <h3 className={styles.card__name}>
          <Link href={`/masters/${master.uuid}`} className={styles.card__link}>
            {master.name}
          </Link>
        </h3>
        {category && <p className={styles.card__category}>{category}</p>}
        <MasterRating
          className={styles.card__rating}
          rating={master.rating}
          reviewsCount={master.reviewsCount}
        />
      </div>
    </article>
  );
}
