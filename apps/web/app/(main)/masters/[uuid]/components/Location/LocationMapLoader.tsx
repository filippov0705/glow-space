"use client";

import dynamic from "next/dynamic";
import styles from "./Location.module.scss";

// Leaflet needs `window`, so the map is rendered only on the client.
// `ssr: false` is allowed only inside a Client Component.
const LocationMapLoader = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => <div className={styles.location__placeholder} />,
});

export default LocationMapLoader;
