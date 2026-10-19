import styles from "./MasterRating.module.scss";

type MasterRatingProps = {
  rating: number | null;
  reviewsCount: number;
  // Sets spacing around the rating line
  className?: string;
};

export default function MasterRating({
  rating,
  reviewsCount,
  className,
}: MasterRatingProps) {
  return (
    <p className={className ? `${styles.rating} ${className}` : styles.rating}>
      {rating === null ? (
        <span className={styles.rating__new}>New</span>
      ) : (
        <>
          <span className={styles.rating__star} aria-hidden="true">
            ★
          </span>
          <span aria-hidden="true">{rating.toFixed(1)}</span>
          <span className={styles.rating__reviews} aria-hidden="true">
            ({reviewsCount})
          </span>
          <span className={styles.visuallyHidden}>
            Rating {rating.toFixed(1)} from {reviewsCount} reviews
          </span>
        </>
      )}
    </p>
  );
}
