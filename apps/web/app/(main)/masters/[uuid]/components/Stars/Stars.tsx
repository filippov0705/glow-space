import styles from "./Stars.module.scss";

type StarsProps = {
  // 0–5; rounded to whole stars
  rating: number;
  className?: string;
};

// Five stars, the first Math.round(rating) filled. The label carries the
// value, so the glyphs are hidden from screen readers.
export default function Stars({ rating, className }: StarsProps) {
  const filled = Math.round(rating);

  return (
    <span
      className={className ? `${styles.stars} ${className}` : styles.stars}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= filled ? undefined : styles["stars__star--empty"]}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}
