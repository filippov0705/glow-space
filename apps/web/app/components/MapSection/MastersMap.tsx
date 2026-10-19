"use client";

import { useEffect, useRef, useState } from "react";
import {
  CircleMarker as LeafletCircleMarker,
  latLngBounds,
  LeafletEvent,
} from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";
import { MasterMapPointResponse } from "@glow-space/shared";
import {
  MAP_DEFAULT_ZOOM,
  MAP_MARKER_ACTIVE_COLOR,
  MAP_MARKER_ACTIVE_RADIUS,
  MAP_MARKER_COLOR,
  MAP_MARKER_RADIUS,
  MAP_MAX_FIT_ZOOM,
  MAP_POPUP_AUTO_PAN_PADDING,
  MAP_POPUP_AUTO_PAN_PADDING_TOP,
  MAP_SINGLE_POINT_ZOOM,
  MAP_TILE_ATTRIBUTION,
  MAP_TILE_URL,
} from "@/app/constants";
import MapMasterCard from "../MapMasterCard/MapMasterCard";
import "leaflet/dist/leaflet.css";
import styles from "./MapSection.module.scss";

type MastersMapProps = {
  points: MasterMapPointResponse[];
  center: { lat: number; lng: number };
};

function FitToPoints({ points, center }: MastersMapProps) {
  const map = useMap();
  // Re-fitting moves the view away from an open card, so it is skipped while
  // one is open. Kept in a ref so the state survives re-runs of the fit effect.
  const isPopupOpenRef = useRef(false);
  // Set when a fit was skipped because of an open popup, so it can be applied
  // once the popup closes. Without a skipped fit, closing keeps the user's view.
  const pendingFitRef = useRef(false);
  // The latest fit for the current points/center, read by the popupclose
  // handler, which lives in a separate effect.
  const fitRef = useRef<() => void>(() => {});

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // Clicking another pin first closes the open popup (the map's preclick
    // closes it via closeOnClick), then opens the new one, so the flag ends up
    // true when switching between pins.
    const onPopupOpen = () => {
      isPopupOpenRef.current = true;
    };
    const onPopupClose = () => {
      isPopupOpenRef.current = false;
      if (!pendingFitRef.current) {
        return;
      }

      // Deferred because on a pin switch the next popup opens synchronously
      // right after this close. Fitting in that gap would move the view under
      // the new card, so re-check and keep the fit pending if one is open.
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (isPopupOpenRef.current || !pendingFitRef.current) {
          return;
        }
        pendingFitRef.current = false;
        fitRef.current();
      }, 0);
    };
    map.on("popupopen", onPopupOpen);
    map.on("popupclose", onPopupClose);

    return () => {
      clearTimeout(timeoutId);
      map.off("popupopen", onPopupOpen);
      map.off("popupclose", onPopupClose);
    };
  }, [map]);

  useEffect(() => {
    const fit = () => {
      if (!points.length) {
        map.setView([center.lat, center.lng], MAP_DEFAULT_ZOOM);
        return;
      }

      if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], MAP_SINGLE_POINT_ZOOM);
        return;
      }

      const bounds = latLngBounds(
        points.map((point): [number, number] => [point.lat, point.lng]),
      );
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: MAP_MAX_FIT_ZOOM });
    };
    fitRef.current = fit;

    // Fits now, or remembers the fit for popupclose while a card is open.
    const fitOrDefer = () => {
      if (isPopupOpenRef.current) {
        pendingFitRef.current = true;
        return;
      }
      pendingFitRef.current = false;
      fit();
    };

    fitOrDefer();

    // The container size can change after mount (late leaflet.css, font layout
    // shift), so re-measure on every resize and re-fit (or defer the fit while a
    // card is open). Fitting only changes the view, not the container size, so
    // it cannot retrigger the observer.
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      fitOrDefer();
    });
    observer.observe(map.getContainer());

    return () => observer.disconnect();
  }, [map, points, center.lat, center.lng]);

  return null;
}

export default function MastersMap({ points, center }: MastersMapProps) {
  const [activeUuid, setActiveUuid] = useState<string | null>(null);

  return (
    <MapContainer
      className={styles.mapSection__map}
      center={[center.lat, center.lng]}
      zoom={MAP_DEFAULT_ZOOM}
      scrollWheelZoom={false}
      zoomControl={false}
    >
      <ZoomControl position="topright" />
      <TileLayer url={MAP_TILE_URL} attribution={MAP_TILE_ATTRIBUTION} />
      {points.map((point) => {
        const isActive = point.uuid === activeUuid;

        return (
          <CircleMarker
            key={point.uuid}
            center={[point.lat, point.lng]}
            radius={isActive ? MAP_MARKER_ACTIVE_RADIUS : MAP_MARKER_RADIUS}
            pathOptions={{
              color: "white",
              weight: 2,
              fillColor: isActive ? MAP_MARKER_ACTIVE_COLOR : MAP_MARKER_COLOR,
              fillOpacity: 1,
            }}
            eventHandlers={{
              popupopen: (event: LeafletEvent) => {
                // draws the dark active pin above its neighbours
                (event.target as LeafletCircleMarker).bringToFront();
                setActiveUuid(point.uuid);
              },
              // When switching pins the previous popup also closes, so only
              // clear the state if it still points at this pin. That keeps the
              // new pin active regardless of the event order.
              popupclose: () =>
                setActiveUuid((current) =>
                  current === point.uuid ? null : current,
                ),
            }}
          >
            <Popup
              className={styles.mapSection__popup}
              autoPanPadding={[
                MAP_POPUP_AUTO_PAN_PADDING,
                MAP_POPUP_AUTO_PAN_PADDING,
              ]}
              autoPanPaddingTopLeft={[
                MAP_POPUP_AUTO_PAN_PADDING,
                MAP_POPUP_AUTO_PAN_PADDING_TOP,
              ]}
            >
              <MapMasterCard master={point} />
            </Popup>
          </CircleMarker>
        );
      })}
      <FitToPoints points={points} center={center} />
    </MapContainer>
  );
}
