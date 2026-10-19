"use client";

import dynamic from "next/dynamic";
import styles from "./MapSection.module.scss";

// Leaflet needs `window`, so the map is rendered only on the client.
// `ssr: false` is allowed only inside a Client Component.
const MastersMapLoader = dynamic(() => import("./MastersMap"), {
  ssr: false,
  loading: () => <div className={styles.mapSection__placeholder} />,
});

export default MastersMapLoader;
