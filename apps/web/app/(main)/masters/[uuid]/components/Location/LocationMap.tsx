"use client";

import {
  CircleMarker,
  MapContainer,
  TileLayer,
  ZoomControl,
} from "react-leaflet";
import {
  MAP_MARKER_COLOR,
  MAP_MARKER_RADIUS,
  MAP_SINGLE_POINT_ZOOM,
  MAP_TILE_ATTRIBUTION,
  MAP_TILE_URL,
} from "@/app/constants";
import "leaflet/dist/leaflet.css";
import styles from "./Location.module.scss";

type LocationMapProps = {
  lat: number;
  lng: number;
};

// One pin, styled like the home map's pins, with no popup. Scroll-wheel zoom
// is off, as on the home map, so the page scrolls over it.
export default function LocationMap({ lat, lng }: LocationMapProps) {
  return (
    <MapContainer
      className={styles.location__map}
      center={[lat, lng]}
      zoom={MAP_SINGLE_POINT_ZOOM}
      scrollWheelZoom={false}
      zoomControl={false}
    >
      <ZoomControl position="topright" />
      <TileLayer url={MAP_TILE_URL} attribution={MAP_TILE_ATTRIBUTION} />
      <CircleMarker
        center={[lat, lng]}
        radius={MAP_MARKER_RADIUS}
        interactive={false}
        pathOptions={{
          color: "white",
          weight: 2,
          fillColor: MAP_MARKER_COLOR,
          fillOpacity: 1,
        }}
      />
    </MapContainer>
  );
}
