import type { MasterProfileResponse } from "@glow-space/shared";
import LocationMapLoader from "./LocationMapLoader";
import styles from "./Location.module.scss";

type LocationProps = Pick<MasterProfileResponse, "address" | "lat" | "lng">;

// The same address string as in the header, and a map with one pin
export default function Location({ address, lat, lng }: LocationProps) {
  return (
    <section className={styles.location} aria-labelledby="location-title">
      <h2 id="location-title" className={styles.location__title}>
        Location
      </h2>
      <p className={styles.location__address}>
        <svg
          className={styles.location__pin}
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
      <div className={styles.location__frame}>
        <LocationMapLoader lat={lat} lng={lng} />
      </div>
    </section>
  );
}
