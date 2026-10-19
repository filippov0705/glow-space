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
      <h2 className={styles.topMasters__title}>Top masters in {cityName}</h2>

      {masters.length === 0 ? (
        <p className={styles.topMasters__empty}>
          No masters in {cityName} yet.
        </p>
      ) : (
        <div className={styles.topMasters__grid}>
          {masters.map((master) => (
            <MasterCard key={master.uuid} master={master} />
          ))}
        </div>
      )}
    </section>
  );
}
