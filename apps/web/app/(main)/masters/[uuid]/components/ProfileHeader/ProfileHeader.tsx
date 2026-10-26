import type { MasterProfileResponse } from "@glow-space/shared";
import { formatCount } from "@/lib/format";
import { initials, specialization } from "../../profile";
import styles from "./ProfileHeader.module.scss";

type ProfileHeaderProps = {
  profile: Pick<
    MasterProfileResponse,
    | "name"
    | "photoUrl"
    | "address"
    | "categories"
    | "subcategories"
    | "rating"
    | "reviewsCount"
  >;
};

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { name, photoUrl, address, rating, reviewsCount } = profile;
  const specializationLine = specialization(profile);

  return (
    <header className={styles.profileHeader}>
      {photoUrl ? (
        // photoUrl points to arbitrary hosts, so next/image is not used here
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.profileHeader__avatar}
          src={photoUrl}
          // Decorative: the name is in the adjacent <h1>
          alt=""
          decoding="async"
        />
      ) : (
        <div
          className={`${styles.profileHeader__avatar} ${styles["profileHeader__avatar--initials"]}`}
          aria-hidden="true"
        >
          {initials(name)}
        </div>
      )}

      <div className={styles.profileHeader__body}>
        <h1 className={styles.profileHeader__name}>{name}</h1>
        {specializationLine && (
          <p className={styles.profileHeader__specialization}>
            {specializationLine}
          </p>
        )}

        <div className={styles.profileHeader__meta}>
          {rating !== null && reviewsCount > 0 ? (
            <p className={styles.profileHeader__rating}>
              <span className={styles.profileHeader__star} aria-hidden="true">
                ★
              </span>
              <a
                href="#reviews"
                className={styles.profileHeader__ratingValue}
                aria-label={`Rating ${rating.toFixed(1)}, see reviews`}
              >
                {rating.toFixed(1)}
              </a>
              <a href="#reviews" className={styles.profileHeader__reviewsLink}>
                {formatCount(reviewsCount, "review", "reviews")}
              </a>
            </p>
          ) : (
            <p className={styles.profileHeader__new}>New</p>
          )}

          <p className={styles.profileHeader__address}>
            <svg
              className={styles.profileHeader__pin}
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path
                d="M8 1.5a4.75 4.75 0 0 0-4.75 4.75C3.25 9.8 8 14.5 8 14.5s4.75-4.7 4.75-8.25A4.75 4.75 0 0 0 8 1.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <circle
                cx="8"
                cy="6.25"
                r="1.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </svg>
            <span>{address}</span>
          </p>
        </div>
      </div>
    </header>
  );
}
