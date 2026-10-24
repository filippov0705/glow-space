import { Sparkles } from "lucide-react";
import MasterRating from "@/app/components/MasterCardParts/MasterRating";
import cardStyles from "@/app/components/MasterListCard/MasterListCard.module.scss";
import gridStyles from "@/app/components/MastersGrid/MastersGrid.module.scss";
import { SearchPendingMarker } from "@/app/components/SearchBar/SearchPending";
import bestStyles from "../BestMatchCard/BestMatchCard.module.scss";
import resultsStyles from "../SearchResults/SearchResults.module.scss";
import chipStyles from "../UnderstoodChips/UnderstoodChips.module.scss";
import styles from "./SearchSkeleton.module.scss";

const CHIP_LABELS = ["Nails ×", "Gel polish ×", "Up to €35 ×", "Saturday ×"];
const CARD_COUNT = 4;

// Placeholder text sized like typical results, so lines wrap the same way
const EXPLANATION =
  "Rated 4.9 from 128 reviews, Gel polish from €30, within your budget.";

// Grey text placeholder: keeps the element's own typography, so the block is
// exactly as tall as the real text. `text` rounds a plain text line, `fit`
// shrinks it to the text width inside a stretching column.
const ghost = (
  className: string,
  { text = false, fit = false }: { text?: boolean; fit?: boolean } = {},
) =>
  [className, styles.ghost, text && styles.text, fit && styles.fit]
    .filter(Boolean)
    .join(" ");

const ghostRating = `${styles.ghost} ${styles.text}`;

// Fallback for SearchResults. It reuses the classes of the real chips row,
// BestMatchCard, "More masters" header and MasterListCard with grey text, so
// nothing moves when the results replace it. Keeps the SearchBar button on
// "Searching..." while shown.
export default function SearchSkeleton() {
  return (
    <>
      <SearchPendingMarker />

      {/* Takes the place of the "We understood" row. The status is announced
          by SearchPendingStatus on the page, a live region that stays mounted */}
      <div className={chipStyles.understood} aria-hidden>
        <p className={`${chipStyles.understood__label} ${styles.status}`}>
          <Sparkles className={styles.status__icon} size={16} />
          Understanding your request
        </p>
        <div className={chipStyles.understood__chips}>
          {CHIP_LABELS.map((label) => (
            <span key={label} className={ghost(chipStyles.understood__chip)}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className={bestStyles.card} aria-hidden>
        <div className={`${bestStyles.card__photo} ${styles.block}`} />
        <div className={bestStyles.card__body}>
          <span className={ghost(bestStyles.card__badge)}>✦ Best match</span>
          <div className={bestStyles.card__info}>
            <p className={ghost(bestStyles.card__name, { text: true })}>
              Anna K.
            </p>
            <p className={ghost(bestStyles.card__subtitle, { text: true })}>
              Manicure, Gel polish, Nail art
            </p>
            <MasterRating
              rating={4.9}
              reviewsCount={128}
              className={ghostRating}
            />
            <p className={ghost(bestStyles.card__price, { text: true })}>
              from €30
            </p>
          </div>
          <p className={ghost(bestStyles.card__explanation)}>{EXPLANATION}</p>
          <span className={ghost(bestStyles.card__button)}>View profile</span>
        </div>
      </div>

      <div className={resultsStyles.more} aria-hidden>
        <div className={resultsStyles.more__header}>
          <p className={ghost(resultsStyles.more__title, { text: true })}>
            More masters (23)
          </p>
          <span className={`${styles.block} ${styles.sort}`} />
        </div>

        <ul className={gridStyles.masters__grid}>
          {Array.from({ length: CARD_COUNT }, (_, index) => (
            <li
              key={index}
              className={`${gridStyles.masters__item} ${styles.item}`}
            >
              <div className={cardStyles.card}>
                <div className={`${cardStyles.card__photo} ${styles.block}`} />
                <div className={cardStyles.card__body}>
                  <p
                    className={ghost(cardStyles.card__name, {
                      text: true,
                      fit: true,
                    })}
                  >
                    Daria M.
                  </p>
                  <p
                    className={ghost(cardStyles.card__subtitle, {
                      text: true,
                      fit: true,
                    })}
                  >
                    Nails
                  </p>
                  <div className={cardStyles.card__footer}>
                    <MasterRating
                      rating={4.9}
                      reviewsCount={203}
                      className={ghostRating}
                    />
                    <p
                      className={ghost(cardStyles.card__price, { text: true })}
                    >
                      from €25
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
