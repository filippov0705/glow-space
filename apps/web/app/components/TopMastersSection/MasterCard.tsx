import { MasterCardResponse } from "@glow-space/shared";
import MasterCover from "../MasterCardParts/MasterCover";
import MasterRating from "../MasterCardParts/MasterRating";
import styles from "./MasterCard.module.scss";

type MasterCardProps = {
  master: MasterCardResponse;
};

export default function MasterCard({ master }: MasterCardProps) {
  const category = master.categories[0]?.name;

  return (
    <article className={styles.card}>
      <MasterCover
        className={styles.card__photo}
        coverUrl={master.coverUrl}
        name={master.name}
      />

      <div className={styles.card__body}>
        <h3 className={styles.card__name}>{master.name}</h3>
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
