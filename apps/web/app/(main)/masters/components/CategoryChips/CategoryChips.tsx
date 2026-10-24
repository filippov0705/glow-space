import Link from "next/link";
import MoreMenu, { ChipItem } from "./MoreMenu";
import styles from "./CategoryChips.module.scss";

// Chips kept in the row on desktop ("All" plus 5 categories); the rest
// go into "More". At 768px and below every chip is in one scrolling row.
const CHIPS_SHOWN = 6;

type CategoryChipsProps = {
  // "All" first, then categories in sortOrder
  chips: ChipItem[];
};

export default function CategoryChips({ chips }: CategoryChipsProps) {
  // A single extra chip takes the place "More" would, so it stays inline
  const shown = chips.length <= CHIPS_SHOWN + 1 ? chips.length : CHIPS_SHOWN;
  const overflow = chips.slice(shown);

  return (
    <nav aria-label="Categories" className={styles.chips}>
      {chips.map((chip, index) => (
        <Link
          key={chip.key}
          href={chip.href}
          scroll={false}
          className={[
            styles.chips__chip,
            chip.active ? styles["chips__chip--active"] : "",
            // Hidden on desktop, where they are listed in "More" instead
            index >= shown ? styles["chips__chip--overflow"] : "",
          ].join(" ")}
          aria-current={chip.active ? "page" : undefined}
        >
          {chip.name}
        </Link>
      ))}
      {overflow.length > 0 && <MoreMenu items={overflow} />}
    </nav>
  );
}
