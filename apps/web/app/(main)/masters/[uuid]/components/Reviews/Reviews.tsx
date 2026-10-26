import type { MasterProfileResponse } from "@glow-space/shared";
import { formatCount } from "@/lib/format";
import { initials, relativeDate } from "../../profile";
import Stars from "../Stars/Stars";
import styles from "./Reviews.module.scss";

type ReviewsProps = Pick<
  MasterProfileResponse,
  "name" | "rating" | "reviewsCount" | "ratingDistribution" | "reviews"
>;

// Always rendered, it is the #reviews anchor target. With no reviews the
// summary reads "No reviews yet" and there are no bars, cards or button.
export default function Reviews({
  name,
  rating,
  reviewsCount,
  ratingDistribution,
  reviews,
}: ReviewsProps) {
  const hasReviews = rating !== null && reviewsCount > 0;
  // Bars are shares of all rated reviews, star-only included
  const total = ratingDistribution.reduce((sum, row) => sum + row.count, 0);
  const now = new Date();

  return (
    <section
      id="reviews"
      className={styles.reviews}
      aria-labelledby="reviews-title"
    >
      <h2 id="reviews-title" className={styles.reviews__title}>
        Reviews
      </h2>

      {hasReviews ? (
        <div className={styles.reviews__summary}>
          <div className={styles.reviews__average}>
            <p className={styles.reviews__averageValue}>{rating.toFixed(1)}</p>
            <Stars rating={rating} />
            <p className={styles.reviews__count}>
              {formatCount(reviewsCount, "review", "reviews")}
            </p>
          </div>

          <ul
            className={styles.reviews__distribution}
            aria-label="Rating distribution"
          >
            {ratingDistribution.map((row) => (
              <li key={row.rating} className={styles.reviews__row}>
                <span className={styles.reviews__rowLabel} aria-hidden="true">
                  {row.rating}
                </span>
                <span className={styles.reviews__bar} aria-hidden="true">
                  <span
                    className={styles.reviews__barFill}
                    style={{
                      width: `${total > 0 ? (row.count / total) * 100 : 0}%`,
                    }}
                  />
                </span>
                <span className={styles.reviews__rowCount}>
                  <span className="sr-only">
                    {row.rating} stars:{" "}
                  </span>
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={styles.reviews__empty}>No reviews yet</p>
      )}

      {hasReviews && reviews.length > 0 && (
        <ul className={styles.reviews__cards}>
          {reviews.map((review) => (
            <li key={review.id} className={styles.reviews__card}>
              <div className={styles.reviews__cardHeader}>
                <span className={styles.reviews__avatar} aria-hidden="true">
                  {initials(review.authorName).slice(0, 1)}
                </span>
                <div className={styles.reviews__author}>
                  <p className={styles.reviews__authorName}>
                    {review.authorName}
                  </p>
                  <p className={styles.reviews__meta}>
                    <time dateTime={review.createdAt}>
                      {relativeDate(review.createdAt, now)}
                    </time>
                    {" · "}
                    {review.offeringName}
                  </p>
                </div>
                <Stars
                  rating={review.rating}
                  className={styles.reviews__cardStars}
                />
              </div>
              <p className={styles.reviews__text}>{review.text}</p>
              {review.replyText && (
                <div className={styles.reviews__reply}>
                  <p className={styles.reviews__replyAuthor}>
                    Reply from {name}
                  </p>
                  <p className={styles.reviews__replyText}>
                    {review.replyText}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {hasReviews && (
        // The reviews index page is out of scope: no handler
        <button type="button" className={styles.reviews__all}>
          Show all {formatCount(reviewsCount, "review", "reviews")}
        </button>
      )}
    </section>
  );
}
