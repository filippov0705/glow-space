import { MasterMapPointResponse } from "@glow-space/shared";
import MastersMapLoader from "./MastersMapLoader";
import styles from "./MapSection.module.scss";

type MapSectionProps = {
  points: MasterMapPointResponse[];
  center: { lat: number; lng: number };
};

export default function MapSection({ points, center }: MapSectionProps) {
  return (
    <section className={styles.mapSection}>
      <h2 className={styles.mapSection__title}>On the map</h2>

      <div className={styles.mapSection__frame}>
        <span className={styles.mapSection__chip}>Map</span>
        <MastersMapLoader points={points} center={center} />
      </div>
    </section>
  );
}
