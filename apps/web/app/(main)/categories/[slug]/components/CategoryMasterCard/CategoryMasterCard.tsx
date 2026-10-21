import type { CategoryMasterCardResponse } from "@glow-space/shared";
import MasterCover from "@/app/components/MasterCardParts/MasterCover";
import MasterRating from "@/app/components/MasterCardParts/MasterRating";
import { formatPrice } from "@/lib/format";
import styles from "./CategoryMasterCard.module.scss";

const SUBCATEGORIES_SHOWN = 3;

type CategoryMasterCardProps = {
  master: CategoryMasterCardResponse;
};

export default function CategoryMasterCard({
  master,
}: CategoryMasterCardProps) {
  const subcategories = master.subcategories
    .slice(0, SUBCATEGORIES_SHOWN)
    .map((subcategory) => subcategory.name)
    .join(", ");

  return (
    <article className={styles.card}>
      <MasterCover
        className={styles.card__photo}
        coverUrl={master.photoUrl}
        name={master.name}
      />

      <div className={styles.card__body}>
        <h2 className={styles.card__name}>{master.name}</h2>
        {subcategories && (
          <p className={styles.card__subcategories}>{subcategories}</p>
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
