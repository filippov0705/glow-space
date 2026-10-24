import Link from "next/link";
import type { SearchChipKind } from "@glow-space/shared";
import styles from "./UnderstoodChips.module.scss";

export type UnderstoodChip = {
  kind: SearchChipKind;
  label: string;
  // The same search without this chip
  removeHref: string;
};

type UnderstoodChipsProps = {
  chips: UnderstoodChip[];
};

export default function UnderstoodChips({ chips }: UnderstoodChipsProps) {
  return (
    <div className={styles.understood}>
      <p className={styles.understood__label} id="search-understood-label">
        We understood:
      </p>
      <ul
        className={styles.understood__chips}
        aria-labelledby="search-understood-label"
      >
        {chips.map((chip) => (
          <li key={chip.kind} className={styles.understood__chip}>
            <span>{chip.label}</span>
            <Link
              href={chip.removeHref}
              scroll={false}
              className={styles.understood__remove}
              aria-label={`Remove ${chip.label}`}
            >
              ×
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
