import Link from "next/link";
import type { MasterListCardResponse } from "@glow-space/shared";
import MasterCover from "@/app/components/MasterCardParts/MasterCover";
import MasterRating from "@/app/components/MasterCardParts/MasterRating";
import { formatPrice } from "@/lib/format";
import styles from "./BestMatchCard.module.scss";

type BestMatchCardProps = {
  master: MasterListCardResponse;
  subtitle: string;
  explanation: string;
};

// TODO: link to the master's profile once the route exists
const PROFILE_HREF = "#";

// Time slots from the mockup aren't shown: there is no schedule data.
export default function BestMatchCard({
  master,
  subtitle,
  explanation,
}: BestMatchCardProps) {
  return (
    <article className={styles.card} aria-labelledby="search-best-match-name">
      <MasterCover
        className={styles.card__photo}
        coverUrl={master.photoUrl}
        name={master.name}
      />

      <div className={styles.card__body}>
        <span className={styles.card__badge}>✦ Best match</span>

        <div className={styles.card__info}>
          <h2 id="search-best-match-name" className={styles.card__name}>
            {master.name}
          </h2>
          {subtitle && <p className={styles.card__subtitle}>{subtitle}</p>}
          <MasterRating
            rating={master.rating}
            reviewsCount={master.reviewsCount}
          />
          <p className={styles.card__price}>
            from {formatPrice(master.minPrice, master.currency)}
          </p>
        </div>

        <p className={styles.card__explanation}>{explanation}</p>

        <Link href={PROFILE_HREF} className={styles.card__button}>
          View profile
        </Link>
      </div>
    </article>
  );
}
