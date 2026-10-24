import Link from "next/link";
import { MasterCardResponse } from "@glow-space/shared";
import MasterCard from "./MasterCard";
import styles from "./TopMastersSection.module.scss";

type TopMastersSectionProps = {
  cityName: string;
  masters: MasterCardResponse[];
};

export default function TopMastersSection({
  cityName,
  masters,
}: TopMastersSectionProps) {
  return (
    <section className={styles.topMasters}>
      <div className={styles.topMasters__header}>
        <h2 className={styles.topMasters__title}>Top masters in {cityName}</h2>
        <Link href="/masters" className={styles.topMasters__link}>
          See all
        </Link>
      </div>

      {masters.length === 0 ? (
        <p className={styles.topMasters__empty}>
          No masters in {cityName} yet.
        </p>
      ) : (
        // Focusable so the mobile carousel can be scrolled with the keyboard.
        <div
          className={styles.topMasters__grid}
          tabIndex={0}
          role="region"
          aria-label="Top masters"
        >
          {masters.map((master) => (
            <MasterCard key={master.uuid} master={master} />
          ))}
        </div>
      )}
    </section>
  );
}
